/**
 * 充值管理路由
 * 处理用户充值申请和管理员审核
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// 管理员密钥
const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';

// 充值金额选项（分）- 优化后的赠送策略，确保平台利润率在13-15%
const RECHARGE_OPTIONS = [
  { amount: 1000, bonus: 0, label: '10元' },          // 无赠送
  { amount: 5000, bonus: 0, label: '50元' },          // 无赠送
  { amount: 10000, bonus: 50, label: '100元 送0.5元' },   // 送0.5元 (0.5%)
  { amount: 30000, bonus: 200, label: '300元 送2元' },    // 送2元 (0.67%)
  { amount: 50000, bonus: 500, label: '500元 送5元' },    // 送5元 (1%)
  { amount: 100000, bonus: 1500, label: '1000元 送15元' }, // 送15元 (1.5%)
];

// ==================== 用户充值申请 ====================

const submitRechargeSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  rechargeType: z.enum(['balance', 'membership', 'super_member']),
  payMethod: z.enum(['alipay', 'wechat', 'jdpay', 'bank_transfer']),
  transactionId: z.string().optional(),
  proofImages: z.array(z.string()).optional(),
  remark: z.string().optional(),
});

/**
 * 用户提交充值申请
 * POST /api/v1/recharge/submit
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const body = submitRechargeSchema.parse(req.body);
    
    // 生成订单号
    const orderNo = `RCH${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // 查找是否有相同的流水号待审核
    if (body.transactionId) {
      const { data: existingRecharge } = await client
        .from('recharge_records')
        .select('id, status')
        .eq('transaction_id', body.transactionId)
        .eq('status', 'pending')
        .single();
      
      if (existingRecharge) {
        return res.status(400).json({ 
          error: '该流水号已提交，请等待审核',
          orderNo: existingRecharge.id 
        });
      }
    }
    
    // 计算赠送金额
    const rechargeOption = RECHARGE_OPTIONS.find(opt => opt.amount === body.amount);
    const bonusAmount = rechargeOption?.bonus || 0;
    
    // 创建充值记录
    const { data: recharge, error } = await client
      .from('recharge_records')
      .insert([{
        user_id: body.userId,
        order_no: orderNo,
        amount: body.amount,
        recharge_type: body.rechargeType,
        pay_method: body.payMethod,
        transaction_id: body.transactionId,
        proof_images: body.proofImages ? JSON.stringify(body.proofImages) : null,
        status: 'pending',
        bonus_amount: bonusAmount,
        admin_remark: body.remark,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Create recharge error:', error);
      return res.status(500).json({ error: '提交失败，请稍后重试' });
    }
    
    // 记录到pay_orders表（兼容旧系统）
    await client
      .from('pay_orders')
      .insert([{
        order_no: orderNo,
        user_id: body.userId,
        amount: body.amount,
        pay_type: body.payMethod,
        product_type: body.rechargeType,
        status: 'confirming',
        transaction_id: body.transactionId,
        user_remark: body.remark,
        confirmed_at: new Date().toISOString(),
      }]);
    
    res.json({
      success: true,
      message: '充值申请已提交，请等待管理员审核（通常5分钟内）',
      data: {
        orderNo,
        amount: body.amount,
        bonusAmount,
        totalAmount: body.amount + bonusAmount,
        status: 'pending',
        submitAt: recharge.submit_at,
      },
    });
  } catch (error) {
    console.error('Submit recharge error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '提交失败' });
  }
});

/**
 * 查询用户充值记录
 * GET /api/v1/recharge/user/:userId
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const { data: records, error } = await client
      .from('recharge_records')
      .select('*')
      .eq('user_id', userId)
      .order('submit_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({
      success: true,
      data: records || [],
    });
  } catch (error) {
    console.error('Get user recharge error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * 获取充值选项
 * GET /api/v1/recharge/options
 */
router.get('/options', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: RECHARGE_OPTIONS,
  });
});

/**
 * 查询充值记录详情
 * GET /api/v1/recharge/:orderNo
 */
router.get('/:orderNo', async (req: Request, res: Response) => {
  try {
    const orderNo = Array.isArray(req.params.orderNo) 
      ? req.params.orderNo[0] 
      : req.params.orderNo;
    
    const { data: record, error } = await client
      .from('recharge_records')
      .select('*')
      .eq('order_no', orderNo)
      .single();
    
    if (error || !record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error('Get recharge detail error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// ==================== 管理员审核 ====================

const adminReviewSchema = z.object({
  orderNo: z.string().min(1),
  adminKey: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  rejectReason: z.string().optional(),
  adminRemark: z.string().optional(),
});

/**
 * 管理员审核充值
 * POST /api/v1/recharge/admin/review
 */
router.post('/admin/review', async (req: Request, res: Response) => {
  try {
    const body = adminReviewSchema.parse(req.body);
    
    // 验证管理员权限
    if (body.adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限，您不是管理员' });
    }
    
    // 查询充值记录
    const { data: record, error: recordError } = await client
      .from('recharge_records')
      .select('*')
      .eq('order_no', body.orderNo)
      .single();
    
    if (recordError || !record) {
      return res.status(404).json({ error: '充值记录不存在' });
    }
    
    if (record.status !== 'pending') {
      return res.status(400).json({ error: '该记录已被审核' });
    }
    
    if (body.action === 'approve') {
      // 审核通过
      const totalAmount = record.amount + (record.bonus_amount || 0);
      
      // 更新充值记录状态
      await client
        .from('recharge_records')
        .update({
          status: 'approved',
          review_at: new Date().toISOString(),
          admin_remark: body.adminRemark || '审核通过',
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);
      
      // 更新pay_orders状态
      await client
        .from('pay_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('order_no', body.orderNo);
      
      // 根据充值类型处理
      if (record.recharge_type === 'balance') {
        // 余额充值：更新用户余额
        const { data: existingBalance } = await client
          .from('user_balances')
          .select('balance, total_recharged')
          .eq('user_id', record.user_id)
          .single();
        
        if (existingBalance) {
          // 更新余额
          await client
            .from('user_balances')
            .update({
              balance: existingBalance.balance + totalAmount,
              total_recharged: (existingBalance.total_recharged || 0) + record.amount,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', record.user_id);
        } else {
          // 创建余额记录
          await client
            .from('user_balances')
            .insert([{
              user_id: record.user_id,
              balance: totalAmount,
              total_recharged: record.amount,
            }]);
        }
        
        // 记录日志
        await client.from('admin_logs').insert([{
          action: 'approve_recharge',
          target: body.orderNo,
          operator: 'admin',
          details: `充值审核通过，金额: ¥${(totalAmount / 100).toFixed(2)}（含赠送 ¥${((record.bonus_amount || 0) / 100).toFixed(2)}）`,
        }]);
        
        // 检查是否首次充值，给邀请人发放奖励
        const { data: previousRecharges } = await client
          .from('recharge_records')
          .select('id')
          .eq('user_id', record.user_id)
          .eq('status', 'approved')
          .neq('order_no', body.orderNo);
        
        if (!previousRecharges || previousRecharges.length === 0) {
          // 首次充值，给邀请人发放奖励
          const { data: inviteRecord } = await client
            .from('invite_records')
            .select('inviter_id')
            .eq('invitee_id', record.user_id)
            .single();
          
          if (inviteRecord) {
            // 计算首充奖励：充值金额的5%（最低1元，最高20元）
            const bonusPercent = 0.05;
            const minBonus = 100;
            const maxBonus = 2000;
            const bonusAmount = Math.min(Math.max(Math.floor(record.amount * bonusPercent), minBonus), maxBonus);
            
            // 更新邀请人余额
            const { data: inviterBalance } = await client
              .from('user_balances')
              .select('balance')
              .eq('user_id', inviteRecord.inviter_id)
              .single();
            
            if (inviterBalance) {
              await client
                .from('user_balances')
                .update({
                  balance: inviterBalance.balance + bonusAmount,
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', inviteRecord.inviter_id);
            } else {
              await client
                .from('user_balances')
                .insert([{
                  user_id: inviteRecord.inviter_id,
                  balance: bonusAmount,
                }]);
            }
            
            // 更新邀请记录
            await client
              .from('invite_records')
              .update({
                first_recharge_given: true,
                first_recharge_bonus: bonusAmount,
                first_recharge_at: new Date().toISOString(),
              })
              .eq('invitee_id', record.user_id);
            
            // 记录奖励日志
            await client.from('reward_records').insert([{
              user_id: inviteRecord.inviter_id,
              reward_type: 'invite',
              reward_key: 'first_recharge_bonus',
              amount: bonusAmount,
              description: `好友首充奖励（充值${(record.amount / 100).toFixed(2)}元）`,
            }]);
            
            console.log(`[Recharge] First recharge bonus for inviter: ${inviteRecord.inviter_id}, bonus: ${bonusAmount}厘`);
          }
        }
        
      } else if (record.recharge_type === 'membership' || record.recharge_type === 'super_member') {
        // 会员充值：激活会员
        const memberLevel = record.recharge_type === 'super_member' ? 'super' : 'member';
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 1);
        
        await client
          .from('users')
          .update({
            member_level: memberLevel,
            member_expire_at: expireDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.user_id);
        
        // 同时更新余额
        const { data: existingBalance } = await client
          .from('user_balances')
          .select('balance, total_recharged')
          .eq('user_id', record.user_id)
          .single();
        
        if (existingBalance) {
          await client
            .from('user_balances')
            .update({
              balance: existingBalance.balance + record.amount,
              total_recharged: (existingBalance.total_recharged || 0) + record.amount,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', record.user_id);
        } else {
          await client
            .from('user_balances')
            .insert([{
              user_id: record.user_id,
              balance: record.amount,
              total_recharged: record.amount,
            }]);
        }
        
        // 记录日志
        await client.from('admin_logs').insert([{
          action: 'approve_membership',
          target: body.orderNo,
          operator: 'admin',
          details: `会员充值审核通过，金额: ¥${(record.amount / 100).toFixed(2)}，会员类型: ${memberLevel}`,
        }]);
      }
      
      res.json({
        success: true,
        message: '审核通过，余额已到账',
        data: {
          orderNo: body.orderNo,
          amount: record.amount,
          bonusAmount: record.bonus_amount,
          totalAmount,
          status: 'approved',
        },
      });
      
    } else {
      // 审核拒绝
      await client
        .from('recharge_records')
        .update({
          status: 'rejected',
          reject_reason: body.rejectReason,
          review_at: new Date().toISOString(),
          admin_remark: body.adminRemark,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);
      
      // 更新pay_orders状态
      await client
        .from('pay_orders')
        .update({
          status: 'rejected',
          admin_remark: body.rejectReason,
          updated_at: new Date().toISOString(),
        })
        .eq('order_no', body.orderNo);
      
      // 记录日志
      await client.from('admin_logs').insert([{
        action: 'reject_recharge',
        target: body.orderNo,
        operator: 'admin',
        details: `充值审核拒绝，原因: ${body.rejectReason || '无'}`,
      }]);
      
      res.json({
        success: true,
        message: '已拒绝充值申请',
        data: {
          orderNo: body.orderNo,
          status: 'rejected',
          rejectReason: body.rejectReason,
        },
      });
    }
  } catch (error) {
    console.error('Admin review error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '审核失败' });
  }
});

/**
 * 获取待审核充值列表
 * GET /api/v1/recharge/admin/pending
 */
router.get('/admin/pending', async (req: Request, res: Response) => {
  try {
    const adminKey = req.query.adminKey as string;
    
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限' });
    }
    
    const { data: records, error } = await client
      .from('recharge_records')
      .select('*')
      .eq('status', 'pending')
      .order('submit_at', { ascending: true });
    
    if (error) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    // 获取用户信息
    const userIds = [...new Set((records || []).map(r => r.user_id))];
    const { data: users } = await client
      .from('users')
      .select('id, email, member_level')
      .in('id', userIds);
    
    const userMap = new Map((users || []).map(u => [u.id, u]));
    
    const result = (records || []).map(record => ({
      ...record,
      user: userMap.get(record.user_id) || null,
    }));
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get pending recharge error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * 获取充值统计
 * GET /api/v1/recharge/admin/stats
 */
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const adminKey = req.query.adminKey as string;
    
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限' });
    }
    
    // 待审核数量
    const { data: pendingRecords } = await client
      .from('recharge_records')
      .select('amount')
      .eq('status', 'pending');
    
    const pendingCount = pendingRecords?.length || 0;
    const pendingAmount = (pendingRecords || []).reduce((sum, r) => sum + (r.amount || 0), 0);
    
    // 今日已审核
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRecords } = await client
      .from('recharge_records')
      .select('amount, bonus_amount')
      .eq('status', 'approved')
      .gte('review_at', today);
    
    const todayCount = todayRecords?.length || 0;
    const todayAmount = (todayRecords || []).reduce((sum, r) => sum + (r.amount || 0) + (r.bonus_amount || 0), 0);
    
    // 累计充值
    const { data: totalRecords } = await client
      .from('recharge_records')
      .select('amount, bonus_amount')
      .eq('status', 'approved');
    
    const totalAmount = (totalRecords || []).reduce((sum, r) => sum + (r.amount || 0) + (r.bonus_amount || 0), 0);
    
    res.json({
      success: true,
      data: {
        pendingCount,
        pendingAmount,
        todayCount,
        todayAmount,
        totalApproved: totalRecords?.length || 0,
        totalAmount,
      },
    });
  } catch (error) {
    console.error('Get recharge stats error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * 获取所有充值记录（管理员）
 * GET /api/v1/recharge/admin/list
 */
router.get('/admin/list', async (req: Request, res: Response) => {
  try {
    const adminKey = req.query.adminKey as string;
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限' });
    }
    
    let query = client
      .from('recharge_records')
      .select('*')
      .order('submit_at', { ascending: false })
      .limit(limit);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: records, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({
      success: true,
      data: records || [],
    });
  } catch (error) {
    console.error('Get recharge list error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

export default router;
