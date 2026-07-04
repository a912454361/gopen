/**
 * 充值路由 - SQLite 版本
 * 完全独立，不依赖任何第三方服务
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  queryAll,
  queryOne,
  execute,
  transaction,
  generateUUID,
  generateOrderNo,
} from '../storage/database/sqlite-client.js';

const router = Router();

// ==================== 管理员配置 ====================

const ADMIN_KEY = process.env.ADMIN_KEY || 'wangu_admin_2024';

const verifyAdmin = (req: Request): boolean => {
  const adminKey = req.headers['x-admin-key'] as string
    || req.body?.adminKey
    || req.body?.key
    || req.query?.key as string;
  return adminKey === ADMIN_KEY;
};

// ==================== 提交充值 ====================

const submitSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  rechargeType: z.enum(['balance', 'membership', 'super_member', 'g_points']),
  payMethod: z.enum(['alipay', 'wechat', 'unionpay', 'bank']),
  transactionId: z.string().min(1),
  proofImages: z.array(z.string()).optional(),
});

// 充值赠送比例
const BONUS_RULES: Record<number, number> = {
  10000: 0,      // 100元无赠送
  30000: 500,    // 300元送5元
  50000: 1500,   // 500元送15元
  100000: 5000,  // 1000元送50元
  300000: 20000, // 3000元送200元
  500000: 50000, // 5000元送500元
};

/**
 * 计算赠送金额
 */
const calculateBonus = (amount: number): number => {
  let bonus = 0;
  for (const [threshold, bonusAmount] of Object.entries(BONUS_RULES)) {
    if (amount >= parseInt(threshold)) {
      bonus = bonusAmount;
    }
  }
  return bonus;
};

/**
 * 提交充值申请
 * POST /api/v1/recharge/submit
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const body = submitSchema.parse(req.body);
    const { userId, amount, rechargeType, payMethod, transactionId, proofImages } = body;

    // 检查用户是否存在
    const user = queryOne<{ id: string }>('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 检查流水号是否重复
    const existingTx = queryOne<{ id: string }>(
      'SELECT id FROM recharge_records WHERE transaction_id = ?',
      [transactionId]
    );
    if (existingTx) {
      return res.status(400).json({ error: '流水号已存在，请勿重复提交' });
    }

    const bonusAmount = calculateBonus(amount);
    const totalAmount = amount + bonusAmount;
    const orderNo = generateOrderNo('RCH');
    const recordId = generateUUID();

    // 创建充值记录
    execute(
      `INSERT INTO recharge_records 
       (id, user_id, order_no, amount, recharge_type, pay_method, transaction_id, proof_images, status, bonus_amount, total_amount, submit_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, datetime('now', 'localtime'))`,
      [
        recordId,
        userId,
        orderNo,
        amount,
        rechargeType,
        payMethod,
        transactionId,
        proofImages ? JSON.stringify(proofImages) : null,
        bonusAmount,
        totalAmount,
      ]
    );

    console.log(`[Recharge] 充值申请: 用户=${userId}, 金额=${amount}, 订单=${orderNo}`);

    res.json({
      success: true,
      message: '充值申请已提交，请等待管理员审核（通常5分钟内）',
      data: {
        orderNo,
        amount,
        bonusAmount,
        totalAmount,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Submit recharge error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '提交失败' });
  }
});

// ==================== 查询充值记录 ====================

/**
 * 查询用户充值记录
 * GET /api/v1/recharge/records/:userId
 */
router.get('/records/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const records = queryAll<{
      id: string;
      order_no: string;
      amount: number;
      recharge_type: string;
      pay_method: string;
      status: string;
      bonus_amount: number;
      total_amount: number;
      created_at: string;
      review_at: string | null;
    }>(
      `SELECT id, order_no, amount, recharge_type, pay_method, status, bonus_amount, total_amount, created_at, review_at
       FROM recharge_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

// ==================== 管理员审核 ====================

const reviewSchema = z.object({
  orderNo: z.string().min(1),
  action: z.enum(['approve', 'reject']),
  remark: z.string().optional(),
});

/**
 * 管理员审核充值
 * POST /api/v1/recharge/admin/review
 */
router.post('/admin/review', async (req: Request, res: Response) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ error: '无权限' });
    }

    const body = reviewSchema.parse(req.body);
    const { orderNo, action, remark } = body;

    // 查询充值记录
    const record = queryOne<{
      id: string;
      user_id: string;
      amount: number;
      bonus_amount: number;
      total_amount: number;
      status: string;
      recharge_type: string;
    }>(
      'SELECT id, user_id, amount, bonus_amount, total_amount, status, recharge_type FROM recharge_records WHERE order_no = ?',
      [orderNo]
    );

    if (!record) {
      return res.status(404).json({ error: '充值记录不存在' });
    }

    if (record.status !== 'pending') {
      return res.status(400).json({ error: '该记录已处理' });
    }

    if (action === 'approve') {
      transaction(() => {
        // 更新充值记录状态
        execute(
          `UPDATE recharge_records SET status = 'approved', review_at = datetime('now', 'localtime'), admin_remark = ? WHERE id = ?`,
          [remark || '审核通过', record.id]
        );

        // 更新用户余额
        if (record.recharge_type === 'balance') {
          const currentBalance = queryOne<{ balance: number }>(
            'SELECT balance FROM user_balances WHERE user_id = ?',
            [record.user_id]
          );

          if (currentBalance) {
            execute(
              `UPDATE user_balances SET balance = balance + ?, total_recharged = total_recharged + ?, updated_at = datetime('now', 'localtime') WHERE user_id = ?`,
              [record.total_amount, record.amount, record.user_id]
            );
          } else {
            execute(
              `INSERT INTO user_balances (user_id, balance, total_recharged) VALUES (?, ?, ?)`,
              [record.user_id, record.total_amount, record.amount]
            );
          }
        } else if (record.recharge_type === 'g_points') {
          // G点充值：1元 = 100G点
          const gPoints = Math.floor(record.amount / 100);
          execute(
            `UPDATE user_balances SET g_points = g_points + ?, updated_at = datetime('now', 'localtime') WHERE user_id = ?`,
            [gPoints, record.user_id]
          );
        }

        // 记录管理员日志
        execute(
          `INSERT INTO admin_logs (action, target, operator, details) VALUES ('approve_recharge', ?, 'admin', ?)`,
          [orderNo, `充值审核通过，金额: ¥${(record.total_amount / 100).toFixed(2)}`]
        );
      });

      console.log(`[Recharge] 审核通过: 订单=${orderNo}`);

      res.json({
        success: true,
        message: '审核通过，余额已到账',
        data: {
          orderNo,
          amount: record.amount,
          bonusAmount: record.bonus_amount,
          totalAmount: record.total_amount,
          status: 'approved',
        },
      });
    } else {
      // 拒绝
      execute(
        `UPDATE recharge_records SET status = 'rejected', review_at = datetime('now', 'localtime'), reject_reason = ? WHERE id = ?`,
        [remark || '审核拒绝', record.id]
      );

      console.log(`[Recharge] 审核拒绝: 订单=${orderNo}`);

      res.json({
        success: true,
        message: '已拒绝',
        data: {
          orderNo,
          status: 'rejected',
        },
      });
    }
  } catch (error) {
    console.error('Review error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '审核失败' });
  }
});

// ==================== 获取待审核列表 ====================

/**
 * 获取待审核充值列表
 * GET /api/v1/recharge/admin/pending
 */
router.get('/admin/pending', async (req: Request, res: Response) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ error: '无权限' });
    }

    const records = queryAll<{
      id: string;
      order_no: string;
      user_id: string;
      amount: number;
      bonus_amount: number;
      pay_method: string;
      transaction_id: string;
      proof_images: string | null;
      created_at: string;
    }>(
      `SELECT id, order_no, user_id, amount, bonus_amount, pay_method, transaction_id, proof_images, created_at
       FROM recharge_records WHERE status = 'pending' ORDER BY created_at ASC`,
      []
    );

    res.json({
      success: true,
      data: records.map((r) => ({
        ...r,
        proof_images: r.proof_images ? JSON.parse(r.proof_images) : [],
      })),
    });
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// ==================== 统计数据 ====================

/**
 * 获取充值统计
 * GET /api/v1/recharge/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = queryOne<{
      total_count: number;
      total_amount: number;
      pending_count: number;
    }>(
      `SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(amount), 0) as total_amount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
       FROM recharge_records`
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

export default router;
