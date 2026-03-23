/**
 * 服务端文件：server/src/services/production-storage-service.ts
 * 生产素材存储服务
 * 
 * 功能：
 * - 上传剧本、图片、视频、音频到对象存储
 * - 生成签名URL供前端访问
 * - 管理生产素材的生命周期
 */

import { S3Storage } from 'coze-coding-dev-sdk';

// ============================================================
// 类型定义
// ============================================================

export interface UploadResult {
  key: string;
  url: string;
  signedUrl: string;
  size: number;
  contentType: string;
}

export interface StorageConfig {
  endpointUrl?: string;
  bucketName?: string;
  region?: string;
}

// ============================================================
// 存储服务类
// ============================================================

class ProductionStorageService {
  private storage: S3Storage | null = null;
  private bucketName: string;
  private initialized: boolean = false;

  constructor() {
    this.bucketName = process.env.COZE_BUCKET_NAME || 'gopen-production';
    this.initStorage();
  }

  private initStorage(): void {
    try {
      const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
      
      if (!endpointUrl) {
        console.warn('[ProductionStorage] COZE_BUCKET_ENDPOINT_URL not set, storage will be disabled');
        return;
      }

      this.storage = new S3Storage({
        endpointUrl,
        accessKey: '',
        secretKey: '',
        bucketName: this.bucketName,
        region: 'cn-beijing',
      });

      this.initialized = true;
      console.log('[ProductionStorage] Initialized successfully');
    } catch (error: any) {
      console.error('[ProductionStorage] Initialization failed:', error.message);
    }
  }

  // ============================================================
  // 公共方法
  // ============================================================

  /**
   * 上传剧本文件
   */
  async uploadScript(productionId: string, episodeNumber: number, content: string): Promise<UploadResult | null> {
    const key = `productions/${productionId}/scripts/episode_${episodeNumber}.txt`;
    return this.uploadText(key, content, 'text/plain; charset=utf-8');
  }

  /**
   * 上传场景图像
   */
  async uploadSceneImage(productionId: string, episodeNumber: number, sceneId: string, imageBuffer: Buffer): Promise<UploadResult | null> {
    const key = `productions/${productionId}/images/ep${episodeNumber}_${sceneId}.png`;
    return this.uploadBuffer(key, imageBuffer, 'image/png');
  }

  /**
   * 上传外部图片（从URL下载后上传）
   */
  async uploadImageFromUrl(key: string, imageUrl: string): Promise<UploadResult | null> {
    if (!this.initialized || !this.storage) {
      console.warn('[ProductionStorage] Storage not initialized');
      return null;
    }

    try {
      // 下载图片
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/png';

      return await this.uploadBuffer(key, buffer, contentType);
    } catch (error: any) {
      console.error('[ProductionStorage] Upload image from URL error:', error.message);
      return null;
    }
  }

  /**
   * 上传视频
   */
  async uploadVideo(key: string, videoBuffer: Buffer, contentType: string = 'video/mp4'): Promise<UploadResult | null> {
    return this.uploadBuffer(key, videoBuffer, contentType);
  }

  /**
   * 上传音频
   */
  async uploadAudio(key: string, audioBuffer: Buffer, contentType: string = 'audio/mpeg'): Promise<UploadResult | null> {
    return this.uploadBuffer(key, audioBuffer, contentType);
  }

  /**
   * 上传JSON数据
   */
  async uploadJson(key: string, data: Record<string, unknown>): Promise<UploadResult | null> {
    const content = JSON.stringify(data, null, 2);
    return this.uploadText(key, content, 'application/json');
  }

  /**
   * 获取签名URL
   */
  async getSignedUrl(key: string, expireTime: number = 86400): Promise<string | null> {
    if (!this.initialized || !this.storage) {
      return null;
    }

    try {
      const signedUrl = await this.storage.generatePresignedUrl({ key, expireTime });
      return signedUrl;
    } catch (error: any) {
      console.error('[ProductionStorage] Get signed URL error:', error.message);
      return null;
    }
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.initialized;
  }

  // ============================================================
  // 私有方法
  // ============================================================

  private async uploadText(key: string, content: string, contentType: string): Promise<UploadResult | null> {
    const buffer = Buffer.from(content, 'utf-8');
    return this.uploadBuffer(key, buffer, contentType);
  }

  private async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<UploadResult | null> {
    if (!this.initialized || !this.storage) {
      console.warn('[ProductionStorage] Storage not initialized, skipping upload');
      return null;
    }

    try {
      // 上传文件
      const objectKey = await this.storage.uploadFile({
        fileContent: buffer,
        fileName: key,
        contentType,
      });

      // 生成签名URL（有效期30天）
      const signedUrl = await this.storage.generatePresignedUrl({ 
        key: objectKey, 
        expireTime: 86400 * 30 
      });

      console.log(`[ProductionStorage] Uploaded: ${key} (${buffer.length} bytes)`);

      return {
        key: objectKey,
        url: signedUrl, // 签名URL作为主URL
        signedUrl,
        size: buffer.length,
        contentType,
      };
    } catch (error: any) {
      console.error(`[ProductionStorage] Upload error for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * 读取文件内容
   */
  async readFile(key: string): Promise<Buffer | null> {
    if (!this.initialized || !this.storage) {
      console.warn('[ProductionStorage] Storage not initialized');
      return null;
    }

    try {
      const buffer = await this.storage.readFile({ fileKey: key });
      return buffer;
    } catch (error: any) {
      console.error(`[ProductionStorage] Read file error for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * 列出指定前缀的文件
   */
  async listFiles(prefix: string): Promise<string[]> {
    if (!this.initialized || !this.storage) {
      console.warn('[ProductionStorage] Storage not initialized');
      return [];
    }

    try {
      const result = await this.storage.listFiles({ prefix });
      return result.keys;
    } catch (error: any) {
      console.error(`[ProductionStorage] List files error for ${prefix}:`, error.message);
      return [];
    }
  }

  /**
   * 通过前缀查找并读取文件
   */
  async readFileByPrefix(prefix: string): Promise<{ key: string; content: Buffer } | null> {
    const keys = await this.listFiles(prefix);
    if (keys.length === 0) {
      return null;
    }
    
    const content = await this.readFile(keys[0]);
    if (!content) {
      return null;
    }
    
    return { key: keys[0], content };
  }
}

// ============================================================
// 单例
// ============================================================

let storageInstance: ProductionStorageService | null = null;

export function getProductionStorage(): ProductionStorageService {
  if (!storageInstance) {
    storageInstance = new ProductionStorageService();
  }
  return storageInstance;
}

export default ProductionStorageService;
