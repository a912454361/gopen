/**
 * 厂商存储配置管理 API
 * 厂商配置自己的存储服务凭证
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { db } from '../storage/database/supabase-client.js';
import { vendorStorageConfigs, vendors } from '../storage/database/shared/vendor-schema.js';
import { eq, and } from 'drizzle-orm';
import {
  encryptText,
  verifyStorageConfig,
  clearVendorStorageCache,
} from '../storage/vendor-storage-client.js';

const router = Router();

// ==================== 中间件：厂商认证 ====================

/**
 * 从请求中获取厂商 ID
 * TODO: 集成实际的认证系统
 */
function getVendorIdFromRequest(req: Request): string | null {
  return req.headers['x-vendor-id'] as string || req.query.vendorId as string || null;
}

/**
 * 厂商认证中间件
 */
async function requireVendor(req: Request, res: Response, next: Function) {
  const vendorId = getVendorIdFromRequest(req);
  
  if (!vendorId) {
    return res.status(401).json({ error: '需要厂商认证' });
  }

  // 验证厂商是否存在且已审核
  const vendor = await db.select()
    .from(vendors)
    .where(and(
      eq(vendors.id, vendorId),
      eq(vendors.status, 'approved')
    ))
    .limit(1);

  if (!vendor || vendor.length === 0) {
    return res.status(403).json({ error: '厂商不存在或未审核' });
  }

  (req as any).vendorId = vendorId;
  (req as any).vendor = vendor[0];
  
  next();
}

// ==================== 创建存储配置 ====================

const createConfigSchema = z.object({
  storageType: z.enum(['aliyun_oss', 'tencent_cos', 'aws_s3', 'minio']),
  accessKeyId: z.string().min(1),
  accessKeySecret: z.string().min(1),
  region: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.string().optional(),
  customDomain: z.string().optional(),
  pathPrefix: z.string().optional(),
  maxFileSize: z.number().optional().default(104857600), // 默认 100MB
  allowedTypes: z.array(z.string()).optional(),
});

/**
 * 创建存储配置
 * POST /api/v1/storage-config
 */
router.post('/', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const configData = createConfigSchema.parse(req.body);

    // 检查是否已存在配置
    const existing = await db.select()
      .from(vendorStorageConfigs)
      .where(eq(vendorStorageConfigs.vendorId, vendorId))
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: '存储配置已存在，请使用更新接口' });
    }

    // 加密凭证
    const accessKeyIdEncrypted = encryptText(configData.accessKeyId);
    const accessKeySecretEncrypted = encryptText(configData.accessKeySecret);

    // 创建配置
    const [config] = await db.insert(vendorStorageConfigs).values({
      vendorId,
      storageType: configData.storageType,
      accessKeyIdEncrypted: accessKeyIdEncrypted.encrypted,
      accessKeyIdIv: accessKeyIdEncrypted.iv,
      accessKeySecretEncrypted: accessKeySecretEncrypted.encrypted,
      accessKeySecretIv: accessKeySecretEncrypted.iv,
      region: configData.region,
      bucket: configData.bucket,
      endpoint: configData.endpoint,
      customDomain: configData.customDomain,
      pathPrefix: configData.pathPrefix,
      maxFileSize: configData.maxFileSize,
      allowedTypes: configData.allowedTypes,
      isDefault: true,
      status: 'active',
      verifyStatus: 'pending',
    }).returning();

    // 验证配置
    const verifyResult = await verifyStorageConfig(vendorId);

    res.status(201).json({
      success: true,
      data: {
        id: config.id,
        storageType: config.storageType,
        region: config.region,
        bucket: config.bucket,
        verifyStatus: verifyResult.success ? 'success' : 'failed',
        verifyMessage: verifyResult.message,
      },
    });
  } catch (error) {
    console.error('[StorageConfig] Create error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '参数错误', details: error.issues });
    }
    res.status(500).json({ error: '创建存储配置失败' });
  }
});

// ==================== 更新存储配置 ====================

const updateConfigSchema = z.object({
  storageType: z.enum(['aliyun_oss', 'tencent_cos', 'aws_s3', 'minio']).optional(),
  accessKeyId: z.string().min(1).optional(),
  accessKeySecret: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  bucket: z.string().min(1).optional(),
  endpoint: z.string().optional(),
  customDomain: z.string().optional(),
  pathPrefix: z.string().optional(),
  maxFileSize: z.number().optional(),
  allowedTypes: z.array(z.string()).optional(),
});

/**
 * 更新存储配置
 * PUT /api/v1/storage-config
 */
router.put('/', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const configData = updateConfigSchema.parse(req.body);

    // 查找现有配置
    const existing = await db.select()
      .from(vendorStorageConfigs)
      .where(eq(vendorStorageConfigs.vendorId, vendorId))
      .limit(1);

    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: '存储配置不存在，请先创建' });
    }

    const currentConfig = existing[0];

    // 准备更新数据
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // 只更新提供的字段
    if (configData.storageType) updateData.storageType = configData.storageType;
    if (configData.region) updateData.region = configData.region;
    if (configData.bucket) updateData.bucket = configData.bucket;
    if (configData.endpoint !== undefined) updateData.endpoint = configData.endpoint;
    if (configData.customDomain !== undefined) updateData.customDomain = configData.customDomain;
    if (configData.pathPrefix !== undefined) updateData.pathPrefix = configData.pathPrefix;
    if (configData.maxFileSize) updateData.maxFileSize = configData.maxFileSize;
    if (configData.allowedTypes) updateData.allowedTypes = configData.allowedTypes;

    // 如果更新了凭证，需要重新加密
    if (configData.accessKeyId) {
      const encrypted = encryptText(configData.accessKeyId);
      updateData.accessKeyIdEncrypted = encrypted.encrypted;
      updateData.accessKeyIdIv = encrypted.iv;
    }
    if (configData.accessKeySecret) {
      const encrypted = encryptText(configData.accessKeySecret);
      updateData.accessKeySecretEncrypted = encrypted.encrypted;
      updateData.accessKeySecretIv = encrypted.iv;
    }

    // 更新配置
    await db.update(vendorStorageConfigs)
      .set(updateData)
      .where(eq(vendorStorageConfigs.vendorId, vendorId));

    // 清除缓存
    clearVendorStorageCache(vendorId);

    // 重新验证
    const verifyResult = await verifyStorageConfig(vendorId);

    res.json({
      success: true,
      data: {
        message: '存储配置更新成功',
        verifyStatus: verifyResult.success ? 'success' : 'failed',
        verifyMessage: verifyResult.message,
      },
    });
  } catch (error) {
    console.error('[StorageConfig] Update error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '参数错误', details: error.issues });
    }
    res.status(500).json({ error: '更新存储配置失败' });
  }
});

// ==================== 获取存储配置 ====================

/**
 * 获取存储配置（脱敏）
 * GET /api/v1/storage-config
 */
router.get('/', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;

    const config = await db.select()
      .from(vendorStorageConfigs)
      .where(eq(vendorStorageConfigs.vendorId, vendorId))
      .limit(1);

    if (!config || config.length === 0) {
      return res.status(404).json({ 
        error: '存储配置不存在',
        code: 'STORAGE_NOT_CONFIGURED'
      });
    }

    const c = config[0];

    // 返回脱敏的配置信息
    res.json({
      success: true,
      data: {
        id: c.id,
        storageType: c.storageType,
        region: c.region,
        bucket: c.bucket,
        endpoint: c.endpoint,
        customDomain: c.customDomain,
        pathPrefix: c.pathPrefix,
        maxFileSize: c.maxFileSize,
        allowedTypes: c.allowedTypes,
        totalFiles: c.totalFiles,
        totalSize: c.totalSize,
        verifyStatus: c.verifyStatus,
        verifyMessage: c.verifyMessage,
        lastVerified: c.lastVerified,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        // 凭证脱敏
        accessKeyId: '******', // 不返回真实凭证
        accessKeySecret: '******',
      },
    });
  } catch (error) {
    console.error('[StorageConfig] Get error:', error);
    res.status(500).json({ error: '获取存储配置失败' });
  }
});

// ==================== 验证存储配置 ====================

/**
 * 验证存储配置
 * POST /api/v1/storage-config/verify
 */
router.post('/verify', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;

    const result = await verifyStorageConfig(vendorId);

    res.json({
      success: result.success,
      data: {
        verifyStatus: result.success ? 'success' : 'failed',
        verifyMessage: result.message,
      },
    });
  } catch (error) {
    console.error('[StorageConfig] Verify error:', error);
    res.status(500).json({ error: '验证存储配置失败' });
  }
});

// ==================== 删除存储配置 ====================

/**
 * 删除存储配置
 * DELETE /api/v1/storage-config
 */
router.delete('/', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;

    // 检查是否有文件
    const config = await db.select()
      .from(vendorStorageConfigs)
      .where(eq(vendorStorageConfigs.vendorId, vendorId))
      .limit(1);

    if (!config || config.length === 0) {
      return res.status(404).json({ error: '存储配置不存在' });
    }

    if (config[0].totalFiles > 0) {
      return res.status(400).json({ 
        error: '无法删除，存在关联文件',
        message: `该存储配置关联 ${config[0].totalFiles} 个文件，请先处理这些文件`,
        totalFiles: config[0].totalFiles,
      });
    }

    // 删除配置
    await db.delete(vendorStorageConfigs)
      .where(eq(vendorStorageConfigs.vendorId, vendorId));

    // 清除缓存
    clearVendorStorageCache(vendorId);

    res.json({
      success: true,
      message: '存储配置已删除',
    });
  } catch (error) {
    console.error('[StorageConfig] Delete error:', error);
    res.status(500).json({ error: '删除存储配置失败' });
  }
});

// ==================== 获取存储类型支持列表 ====================

/**
 * 获取支持的存储类型
 * GET /api/v1/storage-config/types
 */
router.get('/types', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        type: 'aliyun_oss',
        name: '阿里云 OSS',
        description: '阿里云对象存储服务',
        status: 'active',
        features: ['上传', '下载', '签名URL', '批量操作'],
      },
      {
        type: 'tencent_cos',
        name: '腾讯云 COS',
        description: '腾讯云对象存储服务',
        status: 'coming_soon',
        features: ['上传', '下载', '签名URL'],
      },
      {
        type: 'aws_s3',
        name: 'AWS S3',
        description: '亚马逊 S3 对象存储服务',
        status: 'coming_soon',
        features: ['上传', '下载', '签名URL'],
      },
      {
        type: 'minio',
        name: 'MinIO',
        description: '开源对象存储服务',
        status: 'coming_soon',
        features: ['上传', '下载', '签名URL'],
      },
    ],
  });
});

export default router;
