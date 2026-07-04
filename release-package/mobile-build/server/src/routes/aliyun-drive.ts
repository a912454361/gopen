/**
 * 阿里云盘集成路由
 * 用于管理Token和同步文件
 */

import { Router, type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { AliyunDriveClient, saveAliyunDriveToken, getPrivilegedUserAliyunDriveClient } from '../services/aliyun-drive.js';

const router = Router();
const client = getSupabaseClient();

// 特权用户ID（郭涛）
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

// 管理员密钥
const ADMIN_KEY = process.env.ADMIN_KEY || 'GtAdmin2024SecretKey8888';

/**
 * 配置阿里云盘Token（需要管理员权限）
 * POST /api/v1/aliyun-drive/token
 * Body: { user_id, refresh_token, admin_key }
 */
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { user_id, refresh_token, admin_key } = req.body;

    // 验证管理员权限
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限访问' });
    }

    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token 是必需的' });
    }

    const userId = user_id || PRIVILEGED_USER_ID;

    // 保存Token
    const success = await saveAliyunDriveToken(userId, refresh_token);

    if (success) {
      res.json({
        success: true,
        message: '阿里云盘Token配置成功',
        data: { user_id: userId },
      });
    } else {
      res.status(500).json({ error: 'Token配置失败，请检查refresh_token是否有效' });
    }
  } catch (error) {
    console.error('Save token error:', error);
    res.status(500).json({ error: 'Token配置失败' });
  }
});

/**
 * 获取阿里云盘用户信息
 * GET /api/v1/aliyun-drive/user-info
 * Query: user_id, admin_key
 */
router.get('/user-info', async (req: Request, res: Response) => {
  try {
    const { user_id, admin_key } = req.query;

    // 验证管理员权限
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限访问' });
    }

    const userId = (user_id as string) || PRIVILEGED_USER_ID;

    const driveClient = new AliyunDriveClient(userId);
    const initialized = await driveClient.init();

    if (!initialized) {
      return res.status(400).json({ error: '阿里云盘未配置，请先设置refresh_token' });
    }

    const userInfo = await driveClient.getUserInfo();

    res.json({
      success: true,
      data: userInfo,
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

/**
 * 同步文件到阿里云盘
 * POST /api/v1/aliyun-drive/sync
 * Body: { file_url, file_name, category, user_id?, admin_key? }
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { file_url, file_name, category, user_id, admin_key } = req.body;

    // 验证权限（管理员或特权用户自己）
    if (admin_key !== ADMIN_KEY && user_id !== PRIVILEGED_USER_ID) {
      return res.status(403).json({ error: '无权限访问' });
    }

    if (!file_url || !file_name) {
      return res.status(400).json({ error: 'file_url 和 file_name 是必需的' });
    }

    const userId = user_id || PRIVILEGED_USER_ID;

    // 初始化客户端
    const driveClient = new AliyunDriveClient(userId);
    const initialized = await driveClient.init();

    if (!initialized) {
      return res.status(400).json({ error: '阿里云盘未配置，请先设置refresh_token' });
    }

    // 同步文件
    const fileId = await driveClient.syncGeneratedFile(
      file_url,
      file_name,
      category || 'video'
    );

    if (fileId) {
      res.json({
        success: true,
        message: '文件同步成功',
        data: { file_id: fileId },
      });
    } else {
      res.status(500).json({ error: '文件同步失败' });
    }
  } catch (error) {
    console.error('Sync file error:', error);
    res.status(500).json({ error: '文件同步失败' });
  }
});

/**
 * 获取同步日志
 * GET /api/v1/aliyun-drive/logs
 * Query: user_id, limit, admin_key
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 50, admin_key } = req.query;

    // 验证管理员权限
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限访问' });
    }

    const userId = (user_id as string) || PRIVILEGED_USER_ID;

    const { data, error } = await client
      .from('cloud_drive_sync_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) {
      return res.status(500).json({ error: '获取日志失败' });
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
});

/**
 * 获取Token状态
 * GET /api/v1/aliyun-drive/status
 * Query: user_id, admin_key
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { user_id, admin_key } = req.query;

    // 验证管理员权限
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限访问' });
    }

    const userId = (user_id as string) || PRIVILEGED_USER_ID;

    const { data } = await client
      .from('user_cloud_drive_tokens')
      .select('drive_user_id, drive_nick_name, expires_at, updated_at')
      .eq('user_id', userId)
      .eq('drive_type', 'aliyun')
      .single();

    if (!data) {
      return res.json({
        success: true,
        data: { configured: false },
      });
    }

    const isExpired = new Date(data.expires_at) < new Date();

    res.json({
      success: true,
      data: {
        configured: true,
        expired: isExpired,
        drive_user_id: data.drive_user_id,
        drive_nick_name: data.drive_nick_name,
        expires_at: data.expires_at,
        updated_at: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: '获取状态失败' });
  }
});

export default router;
