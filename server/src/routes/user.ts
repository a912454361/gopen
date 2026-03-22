/**
 * 用户资料API
 */

import { Router, type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import multer from 'multer';
import { S3Storage } from 'coze-coding-dev-sdk';

const router = Router();
const client = getSupabaseClient();

// 初始化对象存储
const s3Storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 配置 multer 用于文件上传
const multerStorage = multer.memoryStorage();
const upload = multer({ 
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 限制5MB
  fileFilter: (_req, file, cb) => {
    // 只允许图片类型
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  }
});

/**
 * 获取用户Token使用情况
 * GET /api/v1/user/:userId/token-usage
 */
router.get('/:userId/token-usage', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 获取本月使用情况
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const { data: monthUsage } = await client
      .from('consumption_records')
      .select('input_tokens, output_tokens, created_at')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString());
    
    // 统计本月Token
    const monthInputTokens = monthUsage?.reduce((sum, r) => sum + (r.input_tokens || 0), 0) || 0;
    const monthOutputTokens = monthUsage?.reduce((sum, r) => sum + (r.output_tokens || 0), 0) || 0;
    
    // 获取今日使用情况
    const today = new Date().toISOString().split('T')[0];
    const { data: todayUsage } = await client
      .from('consumption_records')
      .select('input_tokens, output_tokens')
      .eq('user_id', userId)
      .gte('created_at', today);
    
    const todayInputTokens = todayUsage?.reduce((sum, r) => sum + (r.input_tokens || 0), 0) || 0;
    const todayOutputTokens = todayUsage?.reduce((sum, r) => sum + (r.output_tokens || 0), 0) || 0;
    
    // 获取总使用情况
    const { data: totalUsage } = await client
      .from('consumption_records')
      .select('input_tokens, output_tokens')
      .eq('user_id', userId);
    
    const totalInputTokens = totalUsage?.reduce((sum, r) => sum + (r.input_tokens || 0), 0) || 0;
    const totalOutputTokens = totalUsage?.reduce((sum, r) => sum + (r.output_tokens || 0), 0) || 0;
    
    // 获取用户余额
    const { data: balance } = await client
      .from('user_balances')
      .select('balance, total_recharged, total_consumed')
      .eq('user_id', userId)
      .single();
    
    // 获取最近使用记录
    const { data: recentUsage } = await client
      .from('consumption_records')
      .select('resource_name, input_tokens, output_tokens, sell_total, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        today: {
          inputTokens: todayInputTokens,
          outputTokens: todayOutputTokens,
          totalTokens: todayInputTokens + todayOutputTokens,
          calls: todayUsage?.length || 0,
        },
        month: {
          inputTokens: monthInputTokens,
          outputTokens: monthOutputTokens,
          totalTokens: monthInputTokens + monthOutputTokens,
          calls: monthUsage?.length || 0,
        },
        total: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalTokens: totalInputTokens + totalOutputTokens,
          calls: totalUsage?.length || 0,
        },
        balance: {
          available: balance?.balance || 0,
          recharged: balance?.total_recharged || 0,
          consumed: balance?.total_consumed || 0,
        },
        recentUsage: recentUsage || [],
      },
    });
  } catch (error) {
    console.error('Get token usage error:', error);
    res.status(500).json({ error: '获取Token使用情况失败' });
  }
});

/**
 * 获取用户信息
 * GET /api/v1/user/:userId
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: user, error } = await client
      .from('users')
      .select('id, nickname, avatar, bio, member_level, member_expire_at, created_at')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Get user error:', error);
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 获取签名URL
    let avatarUrl = user.avatar;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      try {
        avatarUrl = await s3Storage.generatePresignedUrl({ key: avatarUrl, expireTime: 86400 });
      } catch {
        // 如果生成签名URL失败，保持原值
      }
    }
    
    res.json({
      success: true,
      data: {
        ...user,
        avatar_url: avatarUrl,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

/**
 * 更新用户信息
 * PUT /api/v1/user/:userId
 * Body 参数：nickname?: string, avatarUrl?: string, bio?: string
 */
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { nickname, avatarUrl, bio } = req.body;
    
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatarUrl !== undefined) updateData.avatar = avatarUrl;
    if (bio !== undefined) updateData.bio = bio;
    
    const { error } = await client
      .from('users')
      .update(updateData)
      .eq('id', userId);
    
    if (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: '更新用户信息失败' });
    }
    
    res.json({
      success: true,
      message: '用户信息已更新',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

/**
 * 上传用户头像
 * POST /api/v1/user/:userId/avatar
 * 使用 multipart/form-data 上传图片
 */
router.post('/:userId/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: '请选择要上传的头像图片' });
    }
    
    // 上传到对象存储
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `avatars/${userId}_${Date.now()}.${fileExtension}`;
    
    const objectKey = await s3Storage.uploadFile({
      fileContent: file.buffer,
      fileName,
      contentType: file.mimetype,
    });
    
    // 更新用户头像（存储对象存储key）
    const { error } = await client
      .from('users')
      .update({
        avatar: objectKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Update avatar error:', error);
      return res.status(500).json({ error: '更新头像失败' });
    }
    
    // 返回签名URL供前端显示
    const signedUrl = await s3Storage.generatePresignedUrl({ key: objectKey, expireTime: 86400 });
    
    res.json({
      success: true,
      data: { avatarUrl: signedUrl, avatarKey: objectKey },
      message: '头像上传成功',
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: '上传头像失败' });
  }
});

export default router;
