/**
 * 阿里云 OSS 对象存储客户端
 * 用于文件上传、下载、删除等操作
 */

import OSS from 'ali-oss';

// OSS 配置
interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
  bucket: string;
  endpoint?: string;
}

// 获取 OSS 配置
function getOSSConfig(bucket?: 'primary' | 'secondary'): OSSConfig {
  const bucketName = bucket === 'secondary' 
    ? process.env.OSS_BUCKET_SECONDARY 
    : process.env.OSS_BUCKET_PRIMARY;

  return {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    region: process.env.OSS_REGION || 'oss-cn-beijing',
    bucket: bucketName || process.env.OSS_BUCKET_PRIMARY || '',
    endpoint: process.env.OSS_ENDPOINT || 'https://oss-cn-beijing.aliyuncs.com',
  };
}

// 创建 OSS 客户端
function createOSSClient(bucket?: 'primary' | 'secondary'): OSS | null {
  const config = getOSSConfig(bucket);
  
  if (!config.accessKeyId || !config.accessKeySecret || !config.bucket) {
    console.warn('[OSS] OSS 配置不完整，请检查环境变量');
    return null;
  }

  return new OSS({
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    region: config.region,
    bucket: config.bucket,
    endpoint: config.endpoint,
    secure: true,
  });
}

// OSS 客户端实例
let primaryClient: OSS | null = null;
let secondaryClient: OSS | null = null;

/**
 * 获取主 Bucket 客户端
 */
export function getPrimaryOSSClient(): OSS | null {
  if (!primaryClient) {
    primaryClient = createOSSClient('primary');
  }
  return primaryClient;
}

/**
 * 获取次 Bucket 客户端
 */
export function getSecondaryOSSClient(): OSS | null {
  if (!secondaryClient) {
    secondaryClient = createOSSClient('secondary');
  }
  return secondaryClient;
}

/**
 * 上传文件到 OSS
 * @param filename 文件名（包含路径，如 'images/avatar/user123.jpg'）
 * @param content 文件内容（Buffer 或 Stream）
 * @param options 上传选项
 */
export async function uploadFile(
  filename: string,
  content: Buffer | NodeJS.ReadableStream,
  options?: {
    bucket?: 'primary' | 'secondary';
    contentType?: string;
    headers?: Record<string, string>;
  }
): Promise<{ url: string; name: string } | null> {
  const client = options?.bucket === 'secondary' 
    ? getSecondaryOSSClient() 
    : getPrimaryOSSClient();

  if (!client) {
    console.error('[OSS] OSS 客户端未初始化');
    return null;
  }

  try {
    const uploadOptions: OSS.PutObjectOptions = {
      headers: options?.headers,
    };

    if (options?.contentType) {
      uploadOptions.mime = options.contentType;
    }

    const result = await client.put(filename, content, uploadOptions);
    
    return {
      url: result.url,
      name: result.name,
    };
  } catch (error) {
    console.error('[OSS] 上传文件失败:', error);
    return null;
  }
}

/**
 * 上传 Buffer 文件
 */
export async function uploadBuffer(
  filename: string,
  buffer: Buffer,
  contentType?: string
): Promise<{ url: string; name: string } | null> {
  return uploadFile(filename, buffer, { contentType });
}

/**
 * 获取文件签名 URL（临时访问链接）
 * @param filename 文件名
 * @param expires 过期时间（秒），默认 3600
 */
export async function getSignedUrl(
  filename: string,
  expires: number = 3600,
  bucket?: 'primary' | 'secondary'
): Promise<string | null> {
  const client = bucket === 'secondary' 
    ? getSecondaryOSSClient() 
    : getPrimaryOSSClient();

  if (!client) {
    return null;
  }

  try {
    const url = client.signatureUrl(filename, {
      expires,
      method: 'GET',
    });
    return url;
  } catch (error) {
    console.error('[OSS] 获取签名 URL 失败:', error);
    return null;
  }
}

/**
 * 删除文件
 */
export async function deleteFile(
  filename: string,
  bucket?: 'primary' | 'secondary'
): Promise<boolean> {
  const client = bucket === 'secondary' 
    ? getSecondaryOSSClient() 
    : getPrimaryOSSClient();

  if (!client) {
    return false;
  }

  try {
    await client.delete(filename);
    return true;
  } catch (error) {
    console.error('[OSS] 删除文件失败:', error);
    return false;
  }
}

/**
 * 批量删除文件
 */
export async function deleteFiles(
  filenames: string[],
  bucket?: 'primary' | 'secondary'
): Promise<boolean> {
  const client = bucket === 'secondary' 
    ? getSecondaryOSSClient() 
    : getPrimaryOSSClient();

  if (!client) {
    return false;
  }

  try {
    await client.deleteMulti(filenames, { quiet: true });
    return true;
  } catch (error) {
    console.error('[OSS] 批量删除文件失败:', error);
    return false;
  }
}

/**
 * 检查文件是否存在
 */
export async function fileExists(
  filename: string,
  bucket?: 'primary' | 'secondary'
): Promise<boolean> {
  const client = bucket === 'secondary' 
    ? getSecondaryOSSClient() 
    : getPrimaryOSSClient();

  if (!client) {
    return false;
  }

  try {
    await client.head(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取文件元信息
 */
export async function getFileMeta(
  filename: string,
  bucket?: 'primary' | 'secondary'
): Promise<Record<string, unknown> | null> {
  const client = bucket === 'secondary' 
    ? getSecondaryOSSClient() 
    : getPrimaryOSSClient();

  if (!client) {
    return null;
  }

  try {
    const result = await client.head(filename);
    return result.meta || {};
  } catch (error) {
    console.error('[OSS] 获取文件元信息失败:', error);
    return null;
  }
}

/**
 * 列出指定前缀的文件
 */
export async function listFiles(
  prefix: string,
  bucket?: 'primary' | 'secondary',
  maxKeys: number = 100
): Promise<Array<{ name: string; url?: string; size?: number; lastModified?: Date }> | null> {
  const client = bucket === 'secondary' 
    ? getSecondaryOSSClient() 
    : getPrimaryOSSClient();

  if (!client) {
    return null;
  }

  try {
    const result = await client.list({
      prefix,
      'max-keys': maxKeys,
    }, {});
    
    return (result.objects || []).map(obj => ({
      name: obj.name,
      url: obj.url,
      size: obj.size,
      lastModified: obj.lastModified ? new Date(obj.lastModified) : undefined,
    }));
  } catch (error) {
    console.error('[OSS] 列出文件失败:', error);
    return null;
  }
}

/**
 * 生成文件名（防止重复）
 */
export function generateFilename(
  originalName: string,
  folder: string = 'uploads'
): string {
  const ext = originalName.split('.').pop() || '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${folder}/${timestamp}_${random}.${ext}`;
}

// 导出默认对象
export default {
  getPrimaryOSSClient,
  getSecondaryOSSClient,
  uploadFile,
  uploadBuffer,
  getSignedUrl,
  deleteFile,
  deleteFiles,
  fileExists,
  getFileMeta,
  listFiles,
  generateFilename,
};
