/**
 * 阿里云盘集成服务
 * 用于将生成的动漫和游戏内容同步到阿里云盘
 */

import axios, { type AxiosInstance } from 'axios';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const client = getSupabaseClient();

// 阿里云盘API配置
const ALIYUN_DRIVE_CONFIG = {
  API_BASE: 'https://open.aliyundrive.com',
  AUTH_BASE: 'https://auth.aliyundrive.com',
  CLIENT_ID: process.env.ALIYUN_DRIVE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.ALIYUN_DRIVE_CLIENT_SECRET || '',
};

// 特权用户ID（郭涛）
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

// 阿里云盘Token信息
interface AliyunDriveToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  nick_name: string;
}

// 阿里云盘文件信息
interface AliyunDriveFile {
  file_id: string;
  file_name: string;
  file_size: number;
  created_at: string;
  download_url: string;
}

/**
 * 阿里云盘客户端
 */
export class AliyunDriveClient {
  private axiosInstance: AxiosInstance;
  private token: AliyunDriveToken | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 初始化 - 加载Token
   */
  async init(): Promise<boolean> {
    // 从数据库加载Token
    const { data } = await client
      .from('user_cloud_drive_tokens')
      .select('*')
      .eq('user_id', this.userId)
      .eq('drive_type', 'aliyun')
      .single();

    if (!data) {
      console.log(`[AliyunDrive] No token found for user ${this.userId}`);
      return false;
    }

    this.token = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at).getTime(),
      user_id: data.drive_user_id,
      nick_name: data.drive_nick_name,
    };

    // 检查Token是否过期
    if (Date.now() > this.token.expires_at - 300000) { // 提前5分钟刷新
      await this.refreshToken();
    }

    return true;
  }

  /**
   * 刷新Token
   */
  async refreshToken(): Promise<boolean> {
    if (!this.token?.refresh_token) {
      return false;
    }

    try {
      const response = await this.axiosInstance.post(
        `${ALIYUN_DRIVE_CONFIG.API_BASE}/oauth/access_token`,
        {
          refresh_token: this.token.refresh_token,
          grant_type: 'refresh_token',
        }
      );

      if (response.data.access_token) {
        this.token = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_at: Date.now() + (response.data.expires_in || 7200) * 1000,
          user_id: response.data.user_id || this.token.user_id,
          nick_name: response.data.nick_name || this.token.nick_name,
        };

        // 更新数据库
        await client
          .from('user_cloud_drive_tokens')
          .update({
            access_token: this.token.access_token,
            refresh_token: this.token.refresh_token,
            expires_at: new Date(this.token.expires_at).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', this.userId)
          .eq('drive_type', 'aliyun');

        console.log(`[AliyunDrive] Token refreshed for user ${this.userId}`);
        return true;
      }
    } catch (error) {
      console.error('[AliyunDrive] Refresh token error:', error);
    }

    return false;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `${ALIYUN_DRIVE_CONFIG.API_BASE}/adrive/v1.0/user/getDriveInfo`,
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('[AliyunDrive] Get user info error:', error);
      return null;
    }
  }

  /**
   * 创建文件夹
   */
  async createFolder(parentId: string, name: string): Promise<string | null> {
    try {
      const response = await this.axiosInstance.post(
        `${ALIYUN_DRIVE_CONFIG.API_BASE}/adrive/v1.0/openFile/create`,
        {
          drive_id: await this.getDriveId(),
          parent_file_id: parentId,
          name: name,
          type: 'folder',
        },
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      );

      if (response.data.file_id) {
        console.log(`[AliyunDrive] Created folder: ${name} (${response.data.file_id})`);
        return response.data.file_id;
      }
    } catch (error) {
      console.error('[AliyunDrive] Create folder error:', error);
    }
    return null;
  }

  /**
   * 获取Drive ID
   */
  private async getDriveId(): Promise<string> {
    const userInfo = await this.getUserInfo();
    return userInfo?.default_drive_id || '';
  }

  /**
   * 上传文件（从URL）
   */
  async uploadFileFromUrl(
    parentId: string,
    fileName: string,
    fileUrl: string
  ): Promise<AliyunDriveFile | null> {
    try {
      // 1. 创建上传任务
      const driveId = await this.getDriveId();
      
      // 2. 获取上传URL
      const createResponse = await this.axiosInstance.post(
        `${ALIYUN_DRIVE_CONFIG.API_BASE}/adrive/v1.0/openFile/getUploadUrl`,
        {
          drive_id: driveId,
          parent_file_id: parentId,
          name: fileName,
          type: 'file',
        },
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      );

      if (!createResponse.data.upload_url) {
        console.error('[AliyunDrive] Failed to get upload URL');
        return null;
      }

      // 3. 下载文件内容
      const fileResponse = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      const fileBuffer = Buffer.from(fileResponse.data);

      // 4. 上传文件
      await axios.put(createResponse.data.upload_url, fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: `Bearer ${this.token?.access_token}`,
        },
      });

      // 5. 完成上传
      const completeResponse = await this.axiosInstance.post(
        `${ALIYUN_DRIVE_CONFIG.API_BASE}/adrive/v1.0/openFile/complete`,
        {
          drive_id: driveId,
          file_id: createResponse.data.file_id,
          upload_id: createResponse.data.upload_id,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      );

      console.log(`[AliyunDrive] File uploaded: ${fileName}`);
      return completeResponse.data;
    } catch (error) {
      console.error('[AliyunDrive] Upload file error:', error);
      return null;
    }
  }

  /**
   * 查找或创建文件夹
   */
  async ensureFolder(parentId: string, folderName: string): Promise<string> {
    try {
      const driveId = await this.getDriveId();
      
      // 查找文件夹
      const response = await this.axiosInstance.post(
        `${ALIYUN_DRIVE_CONFIG.API_BASE}/adrive/v1.0/openFile/search`,
        {
          drive_id: driveId,
          parent_file_id: parentId,
          name: folderName,
          type: 'folder',
          limit: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token?.access_token}`,
          },
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].file_id;
      }

      // 创建文件夹
      return await this.createFolder(parentId, folderName) || '';
    } catch (error) {
      console.error('[AliyunDrive] Ensure folder error:', error);
      return '';
    }
  }

  /**
   * 同步生成的文件到阿里云盘
   */
  async syncGeneratedFile(
    fileUrl: string,
    fileName: string,
    category: 'video' | 'anime' | 'game'
  ): Promise<string | null> {
    try {
      // 初始化
      const initialized = await this.init();
      if (!initialized) {
        console.log('[AliyunDrive] Not initialized, skipping sync');
        return null;
      }

      // 获取或创建根目录 "G Open 创作"
      const rootFolderId = await this.ensureFolder('root', 'G Open 创作');
      if (!rootFolderId) {
        console.error('[AliyunDrive] Failed to create root folder');
        return null;
      }

      // 根据类型创建子目录
      const categoryMap: Record<string, string> = {
        video: '视频生成',
        anime: '动漫创作',
        game: '游戏素材',
      };

      const categoryFolderId = await this.ensureFolder(rootFolderId, categoryMap[category] || '其他');
      if (!categoryFolderId) {
        console.error('[AliyunDrive] Failed to create category folder');
        return null;
      }

      // 上传文件
      const result = await this.uploadFileFromUrl(categoryFolderId, fileName, fileUrl);
      if (result) {
        console.log(`[AliyunDrive] File synced: ${fileName}`);
        
        // 记录同步日志
        await client.from('cloud_drive_sync_logs').insert([{
          user_id: this.userId,
          drive_type: 'aliyun',
          file_name: fileName,
          file_url: fileUrl,
          category: category,
          drive_file_id: result.file_id,
          created_at: new Date().toISOString(),
        }]);

        return result.file_id;
      }

      return null;
    } catch (error) {
      console.error('[AliyunDrive] Sync file error:', error);
      return null;
    }
  }
}

/**
 * 保存用户阿里云盘Token
 */
export async function saveAliyunDriveToken(
  userId: string,
  refreshToken: string
): Promise<boolean> {
  try {
    // 使用refresh_token获取access_token
    const response = await axios.post(
      `${ALIYUN_DRIVE_CONFIG.API_BASE}/oauth/access_token`,
      {
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }
    );

    if (response.data.access_token) {
      const expiresAt = Date.now() + (response.data.expires_in || 7200) * 1000;

      // 保存到数据库
      await client
        .from('user_cloud_drive_tokens')
        .upsert([{
          user_id: userId,
          drive_type: 'aliyun',
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_at: new Date(expiresAt).toISOString(),
          drive_user_id: response.data.user_id,
          drive_nick_name: response.data.nick_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'user_id,drive_type',
        });

      console.log(`[AliyunDrive] Token saved for user ${userId}`);
      return true;
    }
  } catch (error) {
    console.error('[AliyunDrive] Save token error:', error);
  }
  return false;
}

/**
 * 获取特权用户阿里云盘客户端
 */
export function getPrivilegedUserAliyunDriveClient(): AliyunDriveClient {
  return new AliyunDriveClient(PRIVILEGED_USER_ID);
}
