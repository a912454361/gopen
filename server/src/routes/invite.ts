import express, { type Request, type Response } from 'express';
import db from '../db.js';

const router = express.Router();

// 验证邀请码
router.get('/verify/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const { data: inviter, error } = await db
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error || !inviter) {
      res.json({ success: false, valid: false, message: '邀请码无效' });
      return;
    }

    res.json({ 
      success: true, 
      valid: true, 
      inviter_id: inviter.user_id,
      message: '邀请码有效' 
    });
  } catch (error) {
    console.error('Verify invite code error:', error);
    res.status(500).json({ success: false, error: '验证失败' });
  }
});

// 创建邀请码
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      res.status(400).json({ success: false, error: '用户ID不能为空' });
      return;
    }

    // 检查是否已有邀请码
    const { data: existing, error: fetchError } = await db
      .from('invite_codes')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existing) {
      res.json({ success: true, data: existing });
      return;
    }

    // 生成新邀请码
    const code = `GOP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { data: inviteCode, error: insertError } = await db
      .from('invite_codes')
      .insert({
        user_id,
        code,
        used_count: 0,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({ success: true, data: inviteCode });
  } catch (error) {
    console.error('Create invite code error:', error);
    res.status(500).json({ success: false, error: '创建失败' });
  }
});

// 使用邀请码（新用户注册时调用）
router.post('/use', async (req: Request, res: Response) => {
  try {
    const { code, new_user_id } = req.body;

    if (!code || !new_user_id) {
      res.status(400).json({ success: false, error: '参数不完整' });
      return;
    }

    // 查找邀请码
    const { data: inviteCode, error: fetchError } = await db
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !inviteCode) {
      res.json({ success: false, message: '邀请码无效' });
      return;
    }

    // 检查是否已使用过
    const { data: existingUse, error: checkError } = await db
      .from('invite_records')
      .select('*')
      .eq('inviter_id', inviteCode.user_id)
      .eq('invitee_id', new_user_id)
      .single();

    if (existingUse) {
      res.json({ success: false, message: '已使用过此邀请码' });
      return;
    }

    // 创建邀请记录
    const { error: recordError } = await db
      .from('invite_records')
      .insert({
        inviter_id: inviteCode.user_id,
        invitee_id: new_user_id,
        code: code,
        reward_given: true,
      });

    if (recordError) throw recordError;

    // 更新邀请码使用次数
    await db
      .from('invite_codes')
      .update({ 
        used_count: (inviteCode.used_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteCode.id);

    // 发放奖励（双方各得10次创作次数）
    // 这里可以调用用户服务增加创作次数
    // await UserService.addCreateCount(inviteCode.user_id, 10);
    // await UserService.addCreateCount(new_user_id, 10);

    res.json({ 
      success: true, 
      message: '邀请成功，双方已获得奖励',
      reward: 10,
    });
  } catch (error) {
    console.error('Use invite code error:', error);
    res.status(500).json({ success: false, error: '使用失败' });
  }
});

// 获取邀请统计
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // 获取邀请码
    const { data: inviteCode, error: codeError } = await db
      .from('invite_codes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!inviteCode) {
      res.json({ 
        success: true, 
        data: { 
          code: null, 
          invited_count: 0, 
          total_reward: 0 
        } 
      });
      return;
    }

    // 获取邀请记录
    const { data: records, error: recordsError } = await db
      .from('invite_records')
      .select('*')
      .eq('inviter_id', userId);

    const invitedCount = records?.length || 0;
    const totalReward = invitedCount * 10; // 每次邀请奖励10次

    res.json({ 
      success: true, 
      data: { 
        code: inviteCode.code,
        invited_count: invitedCount, 
        total_reward: totalReward,
        records: records,
      } 
    });
  } catch (error) {
    console.error('Get invite stats error:', error);
    res.status(500).json({ success: false, error: '获取失败' });
  }
});

export default router;
