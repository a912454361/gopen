/**
 * 用户头像上传API
 */

import { Router, type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

/**
 * 上传用户头像
 * POST /api/v1/user/avatar
 */
router.post('/avatar', async (req: Request, res: Response) => {
  try {
    const { userId, avatarUrl } = req.body;
    
    if (!userId || !avatarUrl) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 更新用户头像
    const { error } = await client
      .from('users')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      console.error('Update avatar error:', error);
      return res.status(500).json({ error: '更新头像失败' });
    }
    
    res.json({
      success: true,
      data: { avatarUrl },
      message: '头像更新成功',
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: '上传头像失败' });
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
      .select('id, nickname, avatar_url, member_level, member_expire_at, created_at')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Get user error:', error);
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

/**
 * 更新用户信息
 * PUT /api/v1/user/:userId
 */
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { nickname, avatarUrl } = req.body;
    
    const updateData: any = { updated_at: new Date().toISOString() };
    if (nickname) updateData.nickname = nickname;
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    
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

export default router;
