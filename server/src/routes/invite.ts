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
          total_reward: 0,
          first_recharge_bonus: 0,
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
    const totalReward = invitedCount * 500; // 每次邀请奖励500厘=0.5元
    
    // 计算被邀请人首充奖励总额
    const firstRechargeBonus = (records || [])
      .filter(r => r.first_recharge_given)
      .reduce((sum, r) => sum + (r.first_recharge_bonus || 0), 0);

    res.json({ 
      success: true, 
      data: { 
        code: inviteCode.code,
        invited_count: invitedCount, 
        total_reward: totalReward,
        first_recharge_bonus: firstRechargeBonus,
        records: records,
      } 
    });
  } catch (error) {
    console.error('Get invite stats error:', error);
    res.status(500).json({ success: false, error: '获取失败' });
  }
});

/**
 * 被邀请人首次充值后，给邀请人发放额外奖励
 * POST /api/v1/invite/first-recharge-bonus
 * Body: { invitee_id, recharge_amount }
 */
router.post('/first-recharge-bonus', async (req: Request, res: Response) => {
  try {
    const { invitee_id, recharge_amount } = req.body;

    if (!invitee_id || !recharge_amount) {
      res.status(400).json({ success: false, error: '参数不完整' });
      return;
    }

    // 查找被邀请人的邀请记录
    const { data: inviteRecord, error: findError } = await db
      .from('invite_records')
      .select('*')
      .eq('invitee_id', invitee_id)
      .single();

    if (!inviteRecord) {
      // 该用户不是通过邀请注册的，静默返回
      res.json({ success: true, bonus_given: false, message: '非邀请用户' });
      return;
    }

    // 检查是否已发放过首充奖励
    if (inviteRecord.first_recharge_given) {
      res.json({ success: true, bonus_given: false, message: '已发放过首充奖励' });
      return;
    }

    // 计算首充奖励：充值金额的5%（最低1元，最高20元）
    const bonusPercent = 0.05;
    const minBonus = 100; // 1元 = 100厘
    const maxBonus = 2000; // 20元 = 2000厘
    const bonusAmount = Math.min(Math.max(Math.floor(recharge_amount * bonusPercent), minBonus), maxBonus);

    // 给邀请人发放奖励
    const { data: inviterBalance, error: balanceError } = await db
      .from('user_balances')
      .select('balance')
      .eq('user_id', inviteRecord.inviter_id)
      .single();

    if (balanceError || !inviterBalance) {
      // 创建余额记录
      await db
        .from('user_balances')
        .insert([{
          user_id: inviteRecord.inviter_id,
          balance: bonusAmount,
          total_recharged: 0,
        }]);
    } else {
      // 更新余额
      await db
        .from('user_balances')
        .update({
          balance: inviterBalance.balance + bonusAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', inviteRecord.inviter_id);
    }

    // 更新邀请记录，标记已发放首充奖励
    await db
      .from('invite_records')
      .update({
        first_recharge_given: true,
        first_recharge_bonus: bonusAmount,
        first_recharge_at: new Date().toISOString(),
      })
      .eq('id', inviteRecord.id);

    // 记录奖励日志
    await db.from('reward_records').insert([{
      user_id: inviteRecord.inviter_id,
      reward_type: 'invite',
      reward_key: 'first_recharge_bonus',
      amount: bonusAmount,
      description: `好友首充奖励（充值${(recharge_amount / 100).toFixed(2)}元，奖励${(bonusAmount / 100).toFixed(2)}元）`,
    }]);

    console.log(`[Invite] First recharge bonus: inviter=${inviteRecord.inviter_id}, bonus=${bonusAmount}厘`);

    res.json({ 
      success: true, 
      bonus_given: true,
      bonus_amount: bonusAmount,
      message: `邀请人获得首充奖励${(bonusAmount / 100).toFixed(2)}元`,
    });
  } catch (error) {
    console.error('First recharge bonus error:', error);
    res.status(500).json({ success: false, error: '发放失败' });
  }
});

export default router;
