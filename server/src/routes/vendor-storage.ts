/**
 * 厂商存储 API
 * 文件存储到厂商自己的存储账户中
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import {
  getVendorStorageClient,
  recordFileUpload,
  getVendorStorageConfig,
  generateFilename,
} from '../storage/vendor-storage-client.js';
import { db } from '../storage/database/supabase-client.js';
import { vendorStorageFiles } from '../storage/database/shared/vendor-schema.js';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

// 配置 multer 用于接收文件
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 最大 200MB（模型文件可能较大）
  },
});

// ==================== 中间件：厂商认证 ====================

/**
 * 从请求中获取厂商 ID
 * TODO: 集成实际的认证系统
 */
function getVendorIdFromRequest(req: Request): string | null {
  // 从 header 或 query 中获取 vendorId（临时方案）
  // 实际应该从 JWT token 中解析
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

  // 检查厂商是否有存储配置
  const config = await getVendorStorageConfig(vendorId);
  if (!config) {
    return res.status(403).json({ 
      error: '厂商未配置存储服务',
      message: '请先配置您的存储服务凭证',
      code: 'STORAGE_NOT_CONFIGURED'
    });
  }

  // 将配置附加到请求对象
  (req as any).vendorId = vendorId;
  (req as any).storageConfig = config;
  
  next();
}

// ==================== 文件上传 ====================

/**
 * 单文件上传
 * POST /api/v1/vendor-storage/upload
 */
router.post('/upload', requireVendor, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const config = (req as any).storageConfig;

    if (!req.file) {
      return res.status(400).json({ error: '未找到上传文件' });
    }

    // 检查文件大小
    if (config.maxFileSize && req.file.size > config.maxFileSize) {
      return res.status(400).json({ 
        error: `文件大小超过限制（最大 ${Math.round(config.maxFileSize / 1024 / 1024)}MB）` 
      });
    }

    // 检查文件类型
    if (config.allowedTypes && (config.allowedTypes as string[]).length > 0) {
      const allowedTypes = config.allowedTypes as string[];
      const mimeType = req.file.mimetype;
      const ext = req.file.originalname.split('.').pop() || '';
      
      const isAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return ext.toLowerCase() === type.slice(1).toLowerCase();
        }
        if (type.endsWith('/*')) {
          return mimeType.startsWith(type.replace('/*', '/'));
        }
        return mimeType === type;
      });

      if (!isAllowed) {
        return res.status(400).json({ 
          error: '文件类型不允许',
          allowedTypes 
        });
      }
    }

    const { folder, serviceId, modelId, category, metadata } = req.body;

    // 生成文件名
    const filename = generateFilename(req.file.originalname, folder);

    // 获取存储客户端
    const client = await getVendorStorageClient(vendorId);
    if (!client) {
      return res.status(500).json({ error: '存储服务不可用' });
    }

    // 上传文件
    const result = await client.upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
    });

    if (!result) {
      return res.status(500).json({ error: '上传失败' });
    }

    // 获取签名 URL
    const signedUrl = await client.getSignedUrl(filename, 3600);

    // 记录文件上传
    await recordFileUpload(vendorId, config.id, {
      filename: result.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      url: result.url,
      signedUrl: signedUrl || undefined,
      serviceId: serviceId || undefined,
      modelId: modelId || undefined,
      category: category || 'other',
      metadata: metadata ? JSON.parse(metadata) : undefined,
    });

    res.json({
      success: true,
      data: {
        filename: result.filename,
        url: result.url,
        signedUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('[VendorStorage] Upload error:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// ==================== 批量上传 ====================

/**
 * 多文件上传
 * POST /api/v1/vendor-storage/upload-multi
 */
router.post('/upload-multi', requireVendor, upload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const config = (req as any).storageConfig;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '未找到上传文件' });
    }

    const { folder, serviceId, modelId, category } = req.body;
    const client = await getVendorStorageClient(vendorId);
    if (!client) {
      return res.status(500).json({ error: '存储服务不可用' });
    }

    const results = [];
    for (const file of files) {
      // 检查文件大小
      if (config.maxFileSize && file.size > config.maxFileSize) {
        continue; // 跳过超大文件
      }

      const filename = generateFilename(file.originalname, folder);
      const result = await client.upload(filename, file.buffer, {
        contentType: file.mimetype,
      });

      if (result) {
        const signedUrl = await client.getSignedUrl(filename, 3600);
        
        // 记录文件
        await recordFileUpload(vendorId, config.id, {
          filename: result.filename,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          url: result.url,
          signedUrl: signedUrl || undefined,
          serviceId: serviceId || undefined,
          modelId: modelId || undefined,
          category: category || 'other',
        });

        results.push({
          filename: result.filename,
          url: result.url,
          signedUrl: signedUrl || undefined,
          size: file.size,
          mimetype: file.mimetype,
        });
      }
    }

    res.json({
      success: true,
      data: results,
      count: results.length,
      total: files.length,
    });
  } catch (error) {
    console.error('[VendorStorage] Multi upload error:', error);
    res.status(500).json({ error: '批量上传失败' });
  }
});

// ==================== 获取签名 URL ====================

/**
 * 获取文件签名 URL
 * GET /api/v1/vendor-storage/signed-url
 */
router.get('/signed-url', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const { filename, expires } = z.object({
      filename: z.string(),
      expires: z.string().optional().default('3600'),
    }).parse(req.query);

    const client = await getVendorStorageClient(vendorId);
    if (!client) {
      return res.status(500).json({ error: '存储服务不可用' });
    }

    const url = await client.getSignedUrl(filename, parseInt(expires));

    if (!url) {
      return res.status(404).json({ error: '获取签名 URL 失败' });
    }

    // 更新文件记录的签名 URL
    await db.update(vendorStorageFiles)
      .set({
        signedUrl: url,
        signedUrlExpires: new Date(Date.now() + parseInt(expires) * 1000),
        updatedAt: new Date(),
      })
      .where(and(
        eq(vendorStorageFiles.vendorId, vendorId),
        eq(vendorStorageFiles.filename, filename)
      ));

    res.json({
      success: true,
      data: {
        url,
        expires: parseInt(expires),
      },
    });
  } catch (error) {
    console.error('[VendorStorage] Get signed URL error:', error);
    res.status(400).json({ error: '获取签名 URL 失败' });
  }
});

// ==================== 删除文件 ====================

/**
 * 删除单个文件
 * DELETE /api/v1/vendor-storage/file
 */
router.delete('/file', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const { filename } = z.object({
      filename: z.string(),
    }).parse(req.body);

    const client = await getVendorStorageClient(vendorId);
    if (!client) {
      return res.status(500).json({ error: '存储服务不可用' });
    }

    const success = await client.delete(filename);

    if (!success) {
      return res.status(500).json({ error: '删除失败' });
    }

    // 更新文件记录状态
    await db.update(vendorStorageFiles)
      .set({
        status: 'deleted',
        updatedAt: new Date(),
      })
      .where(and(
        eq(vendorStorageFiles.vendorId, vendorId),
        eq(vendorStorageFiles.filename, filename)
      ));

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('[VendorStorage] Delete file error:', error);
    res.status(400).json({ error: '删除失败' });
  }
});

/**
 * 批量删除文件
 * DELETE /api/v1/vendor-storage/files
 */
router.delete('/files', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const { filenames } = z.object({
      filenames: z.array(z.string()),
    }).parse(req.body);

    const client = await getVendorStorageClient(vendorId);
    if (!client) {
      return res.status(500).json({ error: '存储服务不可用' });
    }

    const success = await client.deleteMulti(filenames);

    if (!success) {
      return res.status(500).json({ error: '批量删除失败' });
    }

    // 更新文件记录状态
    for (const filename of filenames) {
      await db.update(vendorStorageFiles)
        .set({
          status: 'deleted',
          updatedAt: new Date(),
        })
        .where(and(
          eq(vendorStorageFiles.vendorId, vendorId),
          eq(vendorStorageFiles.filename, filename)
        ));
    }

    res.json({
      success: true,
      message: '批量删除成功',
      count: filenames.length,
    });
  } catch (error) {
    console.error('[VendorStorage] Delete files error:', error);
    res.status(400).json({ error: '批量删除失败' });
  }
});

// ==================== 检查文件是否存在 ====================

/**
 * 检查文件是否存在
 * GET /api/v1/vendor-storage/exists
 */
router.get('/exists', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const { filename } = z.object({
      filename: z.string(),
    }).parse(req.query);

    const client = await getVendorStorageClient(vendorId);
    if (!client) {
      return res.status(500).json({ error: '存储服务不可用' });
    }

    const exists = await client.exists(filename);

    res.json({
      success: true,
      data: {
        filename,
        exists,
      },
    });
  } catch (error) {
    console.error('[VendorStorage] Check file exists error:', error);
    res.status(400).json({ error: '检查失败' });
  }
});

// ==================== 列出文件 ====================

/**
 * 列出指定前缀的文件
 * GET /api/v1/vendor-storage/list
 */
router.get('/list', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const { prefix, maxKeys } = z.object({
      prefix: z.string().optional().default(''),
      maxKeys: z.string().optional().default('100'),
    }).parse(req.query);

    const client = await getVendorStorageClient(vendorId);
    if (!client) {
      return res.status(500).json({ error: '存储服务不可用' });
    }

    const files = await client.list(prefix, parseInt(maxKeys));

    res.json({
      success: true,
      data: files || [],
      count: files?.length || 0,
    });
  } catch (error) {
    console.error('[VendorStorage] List files error:', error);
    res.status(400).json({ error: '获取文件列表失败' });
  }
});

// ==================== 文件记录查询 ====================

/**
 * 获取厂商的文件记录
 * GET /api/v1/vendor-storage/records
 */
router.get('/records', requireVendor, async (req: Request, res: Response) => {
  try {
    const vendorId = (req as any).vendorId;
    const { category, serviceId, limit, offset } = z.object({
      category: z.string().optional(),
      serviceId: z.string().optional(),
      limit: z.string().optional().default('50'),
      offset: z.string().optional().default('0'),
    }).parse(req.query);

    // 构建查询条件
    const conditions = [eq(vendorStorageFiles.vendorId, vendorId)];
    if (category) {
      conditions.push(eq(vendorStorageFiles.category, category));
    }
    if (serviceId) {
      conditions.push(eq(vendorStorageFiles.serviceId, serviceId));
    }
    conditions.push(eq(vendorStorageFiles.status, 'active'));

    const records = await db.select()
      .from(vendorStorageFiles)
      .where(and(...conditions))
      .orderBy(desc(vendorStorageFiles.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({
      success: true,
      data: records,
      count: records.length,
    });
  } catch (error) {
    console.error('[VendorStorage] Get records error:', error);
    res.status(400).json({ error: '获取文件记录失败' });
  }
});

// ==================== 存储配置信息 ====================

/**
 * 获取厂商存储配置信息（脱敏）
 * GET /api/v1/vendor-storage/config
 */
router.get('/config', requireVendor, async (req: Request, res: Response) => {
  try {
    const config = (req as any).storageConfig;

    // 返回脱敏的配置信息
    res.json({
      success: true,
      data: {
        storageType: config.storageType,
        region: config.region,
        bucket: config.bucket,
        customDomain: config.customDomain,
        pathPrefix: config.pathPrefix,
        maxFileSize: config.maxFileSize,
        allowedTypes: config.allowedTypes,
        totalFiles: config.totalFiles,
        totalSize: config.totalSize,
        verifyStatus: config.verifyStatus,
        lastVerified: config.lastVerified,
      },
    });
  } catch (error) {
    console.error('[VendorStorage] Get config error:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

export default router;
