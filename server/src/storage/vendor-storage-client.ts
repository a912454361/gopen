/**
 * 厂商存储客户端
 * 支持多种存储服务：阿里云 OSS、腾讯云 COS、AWS S3、MinIO 等
 * 每个厂商使用自己的存储凭证，文件存储在厂商自己的账户中
 */

import OSS from 'ali-oss';
import crypto from 'crypto';
import { db } from './database/supabase-client.js';
import { vendorStorageConfigs, vendorStorageFiles } from './database/shared/vendor-schema.js';
import { eq, and } from 'drizzle-orm';

// ==================== 加密工具 ====================

const ENCRYPTION_KEY = process.env.STORAGE_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

/**
 * 加密文本
 */
export function encryptText(text: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * 解密文本
 */
export function decryptText(encrypted: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ==================== 存储类型定义 ====================

export type StorageType = 'aliyun_oss' | 'tencent_cos' | 'aws_s3' | 'minio' | 'custom';

export interface StorageConfig {
  vendorId: string;
  storageType: StorageType;
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  bucket: string;
  endpoint?: string;
  customDomain?: string;
  pathPrefix?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
}

export interface UploadResult {
  filename: string;
  url: string;
  signedUrl?: string;
  size: number;
}

export interface FileInfo {
  name: string;
  size?: number;
  lastModified?: Date;
  url?: string;
}

// ==================== 存储客户端接口 ====================

export interface IStorageClient {
  upload(filename: string, content: Buffer, options?: { contentType?: string }): Promise<UploadResult | null>;
  getSignedUrl(filename: string, expires?: number): Promise<string | null>;
  delete(filename: string): Promise<boolean>;
  deleteMulti(filenames: string[]): Promise<boolean>;
  exists(filename: string): Promise<boolean>;
  list(prefix: string, maxKeys?: number): Promise<FileInfo[] | null>;
}

// ==================== 阿里云 OSS 客户端 ====================

export class AliyunOSSClient implements IStorageClient {
  private client: OSS;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.client = new OSS({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      region: config.region,
      bucket: config.bucket,
      endpoint: config.endpoint,
      secure: true,
    });
  }

  async upload(filename: string, content: Buffer, options?: { contentType?: string }): Promise<UploadResult | null> {
    try {
      const fullPath = this.config.pathPrefix ? `${this.config.pathPrefix}/${filename}` : filename;
      const uploadOptions: OSS.PutObjectOptions = {};
      if (options?.contentType) {
        uploadOptions.mime = options.contentType;
      }

      const result = await this.client.put(fullPath, content, uploadOptions);
      const url = this.config.customDomain 
        ? `${this.config.customDomain}/${fullPath}`
        : result.url;

      return {
        filename: fullPath,
        url,
        size: content.length,
      };
    } catch (error) {
      console.error('[AliyunOSS] 上传失败:', error);
      return null;
    }
  }

  async getSignedUrl(filename: string, expires: number = 3600): Promise<string | null> {
    try {
      const fullPath = this.config.pathPrefix ? `${this.config.pathPrefix}/${filename}` : filename;
      const url = this.client.signatureUrl(fullPath, {
        expires,
        method: 'GET',
      });
      return url;
    } catch (error) {
      console.error('[AliyunOSS] 获取签名URL失败:', error);
      return null;
    }
  }

  async delete(filename: string): Promise<boolean> {
    try {
      const fullPath = this.config.pathPrefix ? `${this.config.pathPrefix}/${filename}` : filename;
      await this.client.delete(fullPath);
      return true;
    } catch (error) {
      console.error('[AliyunOSS] 删除失败:', error);
      return false;
    }
  }

  async deleteMulti(filenames: string[]): Promise<boolean> {
    try {
      const fullPaths = filenames.map(f => 
        this.config.pathPrefix ? `${this.config.pathPrefix}/${f}` : f
      );
      await this.client.deleteMulti(fullPaths, { quiet: true });
      return true;
    } catch (error) {
      console.error('[AliyunOSS] 批量删除失败:', error);
      return false;
    }
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const fullPath = this.config.pathPrefix ? `${this.config.pathPrefix}/${filename}` : filename;
      await this.client.head(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix: string, maxKeys: number = 100): Promise<FileInfo[] | null> {
    try {
      const fullPrefix = this.config.pathPrefix ? `${this.config.pathPrefix}/${prefix}` : prefix;
      const result = await this.client.list({
        prefix: fullPrefix,
        'max-keys': maxKeys,
      }, {});

      return (result.objects || []).map(obj => ({
        name: obj.name.replace(this.config.pathPrefix ? `${this.config.pathPrefix}/` : '', ''),
        size: obj.size,
        lastModified: obj.lastModified ? new Date(obj.lastModified) : undefined,
        url: this.config.customDomain 
          ? `${this.config.customDomain}/${obj.name}`
          : obj.url,
      }));
    } catch (error) {
      console.error('[AliyunOSS] 列出文件失败:', error);
      return null;
    }
  }
}

// ==================== 存储客户端工厂 ====================

const clientCache = new Map<string, IStorageClient>();

/**
 * 创建存储客户端
 */
export function createStorageClient(config: StorageConfig): IStorageClient {
  switch (config.storageType) {
    case 'aliyun_oss':
      return new AliyunOSSClient(config);
    case 'tencent_cos':
      // TODO: 实现腾讯云 COS 客户端
      throw new Error('腾讯云 COS 客户端暂未实现');
    case 'aws_s3':
    case 'minio':
      // TODO: 实现 AWS S3/MinIO 客户端
      throw new Error('AWS S3/MinIO 客户端暂未实现');
    default:
      throw new Error(`不支持的存储类型: ${config.storageType}`);
  }
}

/**
 * 获取厂商存储客户端（带缓存）
 */
export async function getVendorStorageClient(vendorId: string): Promise<IStorageClient | null> {
  // 检查缓存
  if (clientCache.has(vendorId)) {
    return clientCache.get(vendorId)!;
  }

  // 查询厂商存储配置
  const configs = await db.select()
    .from(vendorStorageConfigs)
    .where(and(
      eq(vendorStorageConfigs.vendorId, vendorId),
      eq(vendorStorageConfigs.status, 'active')
    ))
    .limit(1);

  if (!configs || configs.length === 0) {
    console.warn(`[VendorStorage] 厂商 ${vendorId} 未配置存储服务`);
    return null;
  }

  const config = configs[0];

  // 解密凭证
  const storageConfig: StorageConfig = {
    vendorId: config.vendorId,
    storageType: config.storageType as StorageType,
    accessKeyId: decryptText(config.accessKeyIdEncrypted, config.accessKeyIdIv),
    accessKeySecret: decryptText(config.accessKeySecretEncrypted, config.accessKeySecretIv),
    region: config.region,
    bucket: config.bucket,
    endpoint: config.endpoint || undefined,
    customDomain: config.customDomain || undefined,
    pathPrefix: config.pathPrefix || undefined,
    maxFileSize: config.maxFileSize || undefined,
    allowedTypes: config.allowedTypes as string[] | undefined,
  };

  // 创建客户端并缓存
  const client = createStorageClient(storageConfig);
  clientCache.set(vendorId, client);

  return client;
}

/**
 * 清除厂商存储客户端缓存
 */
export function clearVendorStorageCache(vendorId?: string): void {
  if (vendorId) {
    clientCache.delete(vendorId);
  } else {
    clientCache.clear();
  }
}

// ==================== 文件记录管理 ====================

/**
 * 记录文件上传
 */
export async function recordFileUpload(
  vendorId: string,
  configId: string,
  fileData: {
    filename: string;
    originalName?: string;
    fileSize: number;
    mimeType?: string;
    url?: string;
    signedUrl?: string;
    serviceId?: string;
    modelId?: string;
    category?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<string | null> {
  try {
    const [record] = await db.insert(vendorStorageFiles).values({
      vendorId,
      configId,
      filename: fileData.filename,
      originalName: fileData.originalName,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      url: fileData.url,
      signedUrl: fileData.signedUrl,
      signedUrlExpires: new Date(Date.now() + 3600000), // 1小时后过期
      serviceId: fileData.serviceId,
      modelId: fileData.modelId,
      category: fileData.category || 'other',
      metadata: fileData.metadata,
      status: 'active',
    }).returning({ id: vendorStorageFiles.id });

    // 更新存储配置统计
    await db.update(vendorStorageConfigs)
      .set({
        totalFiles: (await db.select().from(vendorStorageConfigs).where(eq(vendorStorageConfigs.id, configId)))[0]?.totalFiles + 1,
        totalSize: (await db.select().from(vendorStorageConfigs).where(eq(vendorStorageConfigs.id, configId)))[0]?.totalSize + fileData.fileSize,
        updatedAt: new Date(),
      })
      .where(eq(vendorStorageConfigs.id, configId));

    return record?.id || null;
  } catch (error) {
    console.error('[VendorStorage] 记录文件上传失败:', error);
    return null;
  }
}

/**
 * 获取厂商存储配置
 */
export async function getVendorStorageConfig(vendorId: string) {
  const configs = await db.select()
    .from(vendorStorageConfigs)
    .where(and(
      eq(vendorStorageConfigs.vendorId, vendorId),
      eq(vendorStorageConfigs.status, 'active')
    ))
    .limit(1);

  return configs?.[0] || null;
}

/**
 * 验证存储配置
 */
export async function verifyStorageConfig(vendorId: string): Promise<{ success: boolean; message: string }> {
  try {
    const client = await getVendorStorageClient(vendorId);
    if (!client) {
      return { success: false, message: '存储配置未找到' };
    }

    // 尝试列出文件（验证凭证是否有效）
    const files = await client.list('', 1);
    
    // 更新验证状态
    await db.update(vendorStorageConfigs)
      .set({
        lastVerified: new Date(),
        verifyStatus: 'success',
        verifyMessage: '验证成功',
        updatedAt: new Date(),
      })
      .where(eq(vendorStorageConfigs.vendorId, vendorId));

    return { success: true, message: '存储配置验证成功' };
  } catch (error) {
    const message = error instanceof Error ? error.message : '验证失败';
    
    // 更新验证状态
    await db.update(vendorStorageConfigs)
      .set({
        lastVerified: new Date(),
        verifyStatus: 'failed',
        verifyMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(vendorStorageConfigs.vendorId, vendorId));

    return { success: false, message };
  }
}

/**
 * 生成文件名
 */
export function generateFilename(originalName: string, folder?: string): string {
  const ext = originalName.split('.').pop() || '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}_${random}.${ext}`;
  return folder ? `${folder}/${filename}` : filename;
}

// 导出默认对象
export default {
  encryptText,
  decryptText,
  createStorageClient,
  getVendorStorageClient,
  clearVendorStorageCache,
  recordFileUpload,
  getVendorStorageConfig,
  verifyStorageConfig,
  generateFilename,
};
