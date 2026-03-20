import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 云存储配置 ====================

const BAIDU_CONFIG = {
  authUrl: 'https://openapi.baidu.com/oauth/2.0/authorize',
  tokenUrl: 'https://openapi.baidu.com/oauth/2.0/token',
  apiUrl: 'https://pan.baidu.com/rest/2.0/xpan',
  appId: process.env.BAIDU_APP_ID || 'YOUR_BAIDU_APP_ID',
  appKey: process.env.BAIDU_APP_KEY || 'YOUR_BAIDU_APP_KEY',
  secretKey: process.env.BAIDU_SECRET_KEY || 'YOUR_BAIDU_SECRET_KEY',
};

const ALIYUN_CONFIG = {
  authUrl: 'https://openapi.alipan.com/oauth/authorize',
  tokenUrl: 'https://openapi.alipan.com/oauth/access_token',
  apiUrl: 'https://openapi.alipan.com',
  appId: process.env.ALIYUN_APP_ID || 'YOUR_ALIYUN_APP_ID',
  appKey: process.env.ALIYUN_APP_KEY || 'YOUR_ALIYUN_APP_KEY',
};

// ==================== 生成授权URL ====================

const generateAuthUrlSchema = z.object({
  userId: z.string(),
  storage: z.enum(['baidu', 'aliyun']),
  redirectUri: z.string().url(),
});

/**
 * 生成云存储授权URL
 * POST /api/v1/cloud/auth-url
 */
router.post('/auth-url', async (req: Request, res: Response) => {
  try {
    const body = generateAuthUrlSchema.parse(req.body);
    
    let authUrl = '';
    const state = `${body.userId}_${Date.now()}`;
    
    if (body.storage === 'baidu') {
      authUrl = `${BAIDU_CONFIG.authUrl}?response_type=code&client_id=${BAIDU_CONFIG.appKey}&redirect_uri=${encodeURIComponent(body.redirectUri)}&scope=basic,netdisk&display=mobile&state=${state}`;
    } else {
      authUrl = `${ALIYUN_CONFIG.authUrl}?client_id=${ALIYUN_CONFIG.appKey}&redirect_uri=${encodeURIComponent(body.redirectUri)}&scope=user:base,file:all:read,file:all:write&state=${state}`;
    }
    
    res.json({
      success: true,
      data: {
        authUrl,
        state,
        expiresIn: 600, // 10分钟有效期
      },
    });
  } catch (error) {
    console.error('Generate auth URL error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== OAuth回调处理 ====================

const callbackSchema = z.object({
  userId: z.string(),
  storage: z.enum(['baidu', 'aliyun']),
  code: z.string(),
});

/**
 * 云存储OAuth回调
 * POST /api/v1/cloud/callback
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const body = callbackSchema.parse(req.body);
    
    // 模拟获取token（实际应调用平台API）
    const mockAccessToken = `access_${body.storage}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const mockRefreshToken = `refresh_${body.storage}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const expiresIn = 2592000; // 30天
    
    // 获取或创建配置
    const { data: existingConfig } = await client
      .from('cloud_storage_config')
      .select('*')
      .eq('user_id', body.userId)
      .single();
    
    const updateData = body.storage === 'baidu' ? {
      baidu_enabled: true,
      baidu_access_token: mockAccessToken,
      baidu_refresh_token: mockRefreshToken,
      baidu_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    } : {
      aliyun_enabled: true,
      aliyun_access_token: mockAccessToken,
      aliyun_refresh_token: mockRefreshToken,
      aliyun_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
    
    if (existingConfig) {
      await client
        .from('cloud_storage_config')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConfig.id);
    } else {
      await client
        .from('cloud_storage_config')
        .insert([{
          user_id: body.userId,
          ...updateData,
        }]);
    }
    
    res.json({
      success: true,
      message: `${body.storage === 'baidu' ? '百度网盘' : '阿里云盘'}授权成功`,
      data: {
        storage: body.storage,
        enabled: true,
        expiresIn,
      },
    });
  } catch (error) {
    console.error('Cloud callback error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 获取云存储配置 ====================

/**
 * 获取用户云存储配置
 * GET /api/v1/cloud/config/:userId
 */
router.get('/config/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: config, error } = await client
      .from('cloud_storage_config')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to get config' });
    }
    
    // 返回脱敏信息
    const safeConfig = config ? {
      baiduEnabled: config.baidu_enabled,
      baiduSyncPath: config.baidu_sync_path,
      baiduExpiresAt: config.baidu_expires_at,
      aliyunEnabled: config.aliyun_enabled,
      aliyunSyncPath: config.aliyun_sync_path,
      aliyunExpiresAt: config.aliyun_expires_at,
      autoSync: config.auto_sync,
      syncInterval: config.sync_interval,
      lastSyncAt: config.last_sync_at,
    } : null;
    
    res.json({
      success: true,
      data: safeConfig,
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// ==================== 更新同步设置 ====================

const updateSyncSettingsSchema = z.object({
  userId: z.string(),
  storage: z.enum(['baidu', 'aliyun']),
  syncPath: z.string().optional(),
  autoSync: z.boolean().optional(),
  syncInterval: z.number().int().min(5).max(1440).optional(), // 5分钟-24小时
});

/**
 * 更新同步设置
 * POST /api/v1/cloud/settings
 */
router.post('/settings', async (req: Request, res: Response) => {
  try {
    const body = updateSyncSettingsSchema.parse(req.body);
    
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (body.storage === 'baidu') {
      if (body.syncPath) updateData.baidu_sync_path = body.syncPath;
    } else {
      if (body.syncPath) updateData.aliyun_sync_path = body.syncPath;
    }
    
    if (body.autoSync !== undefined) updateData.auto_sync = body.autoSync;
    if (body.syncInterval !== undefined) updateData.sync_interval = body.syncInterval;
    
    const { error } = await client
      .from('cloud_storage_config')
      .upsert({
        user_id: body.userId,
        ...updateData,
      }, { onConflict: 'user_id' });
    
    if (error) {
      return res.status(500).json({ error: 'Failed to update settings' });
    }
    
    res.json({
      success: true,
      message: '同步设置已更新',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 上传文件 ====================

const uploadFileSchema = z.object({
  userId: z.string(),
  storage: z.enum(['baidu', 'aliyun']),
  fileName: z.string(),
  fileType: z.enum(['project', 'model', 'asset', 'other']),
  fileSize: z.number().int().positive(),
  localPath: z.string().optional(),
  md5: z.string().optional(),
});

/**
 * 上传文件到云存储
 * POST /api/v1/cloud/upload
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const body = uploadFileSchema.parse(req.body);
    
    // 检查配置
    const { data: config, error: configError } = await client
      .from('cloud_storage_config')
      .select('*')
      .eq('user_id', body.userId)
      .single();
    
    if (configError || !config) {
      return res.status(400).json({ error: 'Cloud storage not configured' });
    }
    
    const isEnabled = body.storage === 'baidu' ? config.baidu_enabled : config.aliyun_enabled;
    if (!isEnabled) {
      return res.status(400).json({ error: `${body.storage === 'baidu' ? '百度网盘' : '阿里云盘'}未授权` });
    }
    
    const syncPath = body.storage === 'baidu' ? config.baidu_sync_path : config.aliyun_sync_path;
    const remotePath = `${syncPath}/${body.fileName}`;
    
    // 模拟上传（实际应调用平台API）
    const mockRemoteId = `${body.storage}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // 创建同步记录
    const { data: syncFile, error } = await client
      .from('sync_files')
      .insert([{
        user_id: body.userId,
        file_name: body.fileName,
        file_type: body.fileType,
        file_size: body.fileSize,
        local_path: body.localPath,
        storage: body.storage,
        remote_path: remotePath,
        remote_id: mockRemoteId,
        md5: body.md5,
        status: 'uploaded',
        last_modified: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to create sync record' });
    }
    
    // 更新最后同步时间
    await client
      .from('cloud_storage_config')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', body.userId);
    
    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        fileId: syncFile.id,
        fileName: body.fileName,
        remotePath,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 下载文件 ====================

/**
 * 从云存储下载文件
 * GET /api/v1/cloud/download/:fileId
 */
router.get('/download/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    const { data: syncFile, error } = await client
      .from('sync_files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (error || !syncFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // 模拟生成下载链接（实际应调用平台API）
    const downloadUrl = `https://${syncFile.storage}.gopen.com/download/${syncFile.remote_id}`;
    
    res.json({
      success: true,
      data: {
        fileName: syncFile.file_name,
        fileSize: syncFile.file_size,
        downloadUrl,
        expiresIn: 3600, // 1小时有效
      },
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
});

// ==================== 获取同步文件列表 ====================

/**
 * 获取用户同步文件列表
 * GET /api/v1/cloud/files/:userId
 */
router.get('/files/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const storage = req.query.storage as string | undefined;
    const fileType = req.query.fileType as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    
    let query = client
      .from('sync_files')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (storage) {
      query = query.eq('storage', storage);
    }
    if (fileType) {
      query = query.eq('file_type', fileType);
    }
    
    const { data: files, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get files' });
    }
    
    res.json({
      success: true,
      data: files || [],
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to get files' });
  }
});

// ==================== 删除文件 ====================

/**
 * 删除云存储文件
 * POST /api/v1/cloud/delete/:fileId
 */
router.post('/delete/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    const { data: syncFile, error: findError } = await client
      .from('sync_files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (findError || !syncFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // 模拟删除云端文件（实际应调用平台API）
    
    // 删除记录
    await client
      .from('sync_files')
      .delete()
      .eq('id', fileId);
    
    res.json({
      success: true,
      message: '文件已删除',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ==================== 取消授权 ====================

const revokeAuthSchema = z.object({
  userId: z.string(),
  storage: z.enum(['baidu', 'aliyun']),
});

/**
 * 取消云存储授权
 * POST /api/v1/cloud/revoke
 */
router.post('/revoke', async (req: Request, res: Response) => {
  try {
    const body = revokeAuthSchema.parse(req.body);
    
    const updateData = body.storage === 'baidu' ? {
      baidu_enabled: false,
      baidu_access_token: null,
      baidu_refresh_token: null,
      baidu_expires_at: null,
    } : {
      aliyun_enabled: false,
      aliyun_access_token: null,
      aliyun_refresh_token: null,
      aliyun_expires_at: null,
    };
    
    await client
      .from('cloud_storage_config')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', body.userId);
    
    res.json({
      success: true,
      message: `${body.storage === 'baidu' ? '百度网盘' : '阿里云盘'}授权已取消`,
    });
  } catch (error) {
    console.error('Revoke auth error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 获取存储空间信息 ====================

/**
 * 获取云存储空间信息
 * GET /api/v1/cloud/quota/:userId
 */
router.get('/quota/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const storage = req.query.storage as 'baidu' | 'aliyun';
    
    // 模拟获取存储空间信息（实际应调用平台API）
    const quota = {
      total: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
      used: 500 * 1024 * 1024 * 1024, // 500GB
      free: 1.5 * 1024 * 1024 * 1024 * 1024, // 1.5TB
    };
    
    res.json({
      success: true,
      data: {
        storage,
        total: quota.total,
        used: quota.used,
        free: quota.free,
        usedPercent: (quota.used / quota.total * 100).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get quota error:', error);
    res.status(500).json({ error: 'Failed to get quota' });
  }
});

// ==================== 云存储账户管理 ====================

/**
 * 获取用户所有云存储账户
 * GET /api/v1/cloud/accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      // 返回空数组
      return res.json({ success: true, data: [] });
    }
    
    const { data: accounts, error } = await client
      .from('cloud_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) {
      console.error('Get accounts error:', error);
      return res.json({ success: true, data: [] });
    }
    
    // 返回脱敏信息
    const safeAccounts = (accounts || []).map(account => ({
      id: account.id,
      provider: account.provider,
      account_name: account.account_name,
      storage_used: account.storage_used,
      storage_total: account.storage_total,
      status: account.status,
      connected_at: account.connected_at,
      last_sync_at: account.last_sync_at,
    }));
    
    res.json({ success: true, data: safeAccounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.json({ success: true, data: [] });
  }
});

/**
 * 删除云存储账户
 * DELETE /api/v1/cloud/accounts/:accountId
 */
router.delete('/accounts/:accountId', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    const { error } = await client
      .from('cloud_accounts')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to disconnect account' });
    }
    
    res.json({ success: true, message: '账户已断开' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

// ==================== 各平台授权入口 ====================

const PROVIDER_CONFIGS: Record<string, { name: string; authUrl: string; scope: string }> = {
  baidu: {
    name: '百度网盘',
    authUrl: 'https://openapi.baidu.com/oauth/2.0/authorize',
    scope: 'basic,netdisk',
  },
  aliyun: {
    name: '阿里云盘',
    authUrl: 'https://openapi.alipan.com/oauth/authorize',
    scope: 'user:base,file:all:read,file:all:write',
  },
  google: {
    name: 'Google Drive',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/drive',
  },
  onedrive: {
    name: 'OneDrive',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scope: 'files.readwrite.all',
  },
  dropbox: {
    name: 'Dropbox',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
    scope: 'files.content.write files.content.read',
  },
  icloud: {
    name: 'iCloud',
    authUrl: 'https://idmsa.apple.com/appleauth/auth',
    scope: 'cloudkit',
  },
};

/**
 * 获取云存储授权链接
 * POST /api/v1/cloud/auth/:provider
 */
router.post('/auth/:provider', async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as string;
    const config = PROVIDER_CONFIGS[provider];
    
    if (!config) {
      return res.status(400).json({ error: 'Unknown provider' });
    }
    
    // 检查是否已配置
    const envKey = `${provider.toUpperCase()}_APP_KEY`;
    const appKey = process.env[envKey];
    
    if (!appKey) {
      // 返回模拟授权链接（用于演示）
      const mockAuthUrl = `${config.authUrl}?client_id=demo&redirect_uri=${encodeURIComponent('gopen://cloud-callback')}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${provider}_${Date.now()}`;
      
      return res.json({
        success: true,
        data: {
          authUrl: mockAuthUrl,
          provider: config.name,
          note: '服务暂未完全开放，敬请期待',
        },
      });
    }
    
    // 生成真实授权链接
    const redirectUri = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/callback`;
    const state = `${provider}_${Date.now()}`;
    const authUrl = `${config.authUrl}?client_id=${appKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${state}`;
    
    res.json({
      success: true,
      data: {
        authUrl,
        provider: config.name,
        state,
      },
    });
  } catch (error) {
    console.error('Get auth URL error:', error);
    res.status(500).json({ error: 'Failed to get auth URL' });
  }
});

/**
 * 云存储OAuth回调处理
 * GET /api/v1/cloud/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).send('缺少必要参数');
    }
    
    const [provider] = (state as string).split('_');
    
    // 模拟创建账户（实际应获取token并保存）
    const mockAccount = {
      provider,
      account_name: `${PROVIDER_CONFIGS[provider]?.name || provider}用户`,
      storage_used: 500 * 1024 * 1024 * 1024, // 500GB
      storage_total: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
    };
    
    // 返回成功页面
    res.send(`
      <html>
        <head><title>授权成功</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:system-ui;">
          <div style="text-align:center;">
            <h1 style="color:#22C55E;">✓ 授权成功</h1>
            <p>您已成功连接${PROVIDER_CONFIGS[provider]?.name || provider}</p>
            <p style="color:#666;">您可以关闭此页面，返回应用继续操作</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).send('授权失败');
  }
});

export default router;
