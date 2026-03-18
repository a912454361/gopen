import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 收款账户配置 ====================

// 收款账户信息（实际项目中应从数据库或环境变量读取）
const PAYMENT_ACCOUNTS = {
  alipay: {
    name: '支付宝收款',
    account: process.env.ALIPAY_ACCOUNT || 'gopen@example.com', // 支付宝账号
    qrcodeUrl: process.env.ALIPAY_QRCODE_URL || '', // 收款码图片URL
    realName: process.env.ALIPAY_REAL_NAME || 'G Open官方', // 收款人姓名
  },
  wechat: {
    name: '微信收款',
    account: process.env.WECHAT_ACCOUNT || '', // 微信号
    qrcodeUrl: process.env.WECHAT_QRCODE_URL || '', // 收款码图片URL
    realName: process.env.WECHAT_REAL_NAME || 'G Open官方', // 收款人姓名
  },
};

/**
 * 获取收款账户信息
 * GET /api/v1/payment/accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    // 返回收款账户信息（隐藏敏感信息）
    const accounts = {
      alipay: {
        name: PAYMENT_ACCOUNTS.alipay.name,
        account: PAYMENT_ACCOUNTS.alipay.account,
        qrcodeUrl: PAYMENT_ACCOUNTS.alipay.qrcodeUrl,
        realName: PAYMENT_ACCOUNTS.alipay.realName,
      },
      wechat: {
        name: PAYMENT_ACCOUNTS.wechat.name,
        qrcodeUrl: PAYMENT_ACCOUNTS.wechat.qrcodeUrl,
        realName: PAYMENT_ACCOUNTS.wechat.realName,
      },
    };
    
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Get payment accounts error:', error);
    res.status(500).json({ error: 'Failed to get payment accounts' });
  }
});

// ==================== 创建支付订单 ====================

const createOrderSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(), // 金额（分）
  payType: z.enum(['alipay', 'wechat']),
  productType: z.enum(['membership', 'super_member']),
});

/**
 * 创建支付订单
 * POST /api/v1/payment/create
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const body = createOrderSchema.parse(req.body);
    
    // 生成订单号
    const orderNo = `GO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // 设置过期时间（30分钟后）
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);
    
    // 创建订单记录
    const { data: order, error } = await client
      .from('pay_orders')
      .insert([{
        order_no: orderNo,
        user_id: body.userId,
        amount: body.amount,
        pay_type: body.payType,
        status: 'pending',
        qr_code_url: PAYMENT_ACCOUNTS[body.payType].qrcodeUrl,
        product_type: body.productType,
        expired_at: expiredAt.toISOString(),
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create order:', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }
    
    // 获取收款账户信息
    const paymentAccount = PAYMENT_ACCOUNTS[body.payType];
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo,
        amount: body.amount,
        payType: body.payType,
        productType: body.productType,
        expiredAt: expiredAt.toISOString(),
        // 收款账户信息
        paymentAccount: {
          name: paymentAccount.name,
          account: paymentAccount.account,
          qrcodeUrl: paymentAccount.qrcodeUrl,
          realName: paymentAccount.realName,
        },
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 用户确认支付 ====================

const confirmPaymentSchema = z.object({
  orderNo: z.string().min(1),
  userId: z.string().min(1),
  transactionId: z.string().optional(), // 用户填写的交易流水号
  remark: z.string().optional(), // 用户备注
});

/**
 * 用户确认已支付
 * POST /api/v1/payment/confirm
 */
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const body = confirmPaymentSchema.parse(req.body);
    
    // 查询订单
    const { data: order, error: orderError } = await client
      .from('pay_orders')
      .select('*')
      .eq('order_no', body.orderNo)
      .eq('user_id', body.userId)
      .single();
    
    if (orderError || !order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态异常' });
    }
    
    // 检查订单是否过期
    if (new Date(order.expired_at) < new Date()) {
      return res.status(400).json({ error: '订单已过期' });
    }
    
    // 更新订单状态为待审核
    const { error: updateError } = await client
      .from('pay_orders')
      .update({
        status: 'confirming', // 待审核状态
        user_remark: body.remark,
        transaction_id: body.transactionId,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    
    if (updateError) {
      console.error('Failed to update order:', updateError);
      return res.status(500).json({ error: '确认失败' });
    }
    
    res.json({
      success: true,
      message: '已提交支付确认，请等待审核',
      data: {
        orderNo: body.orderNo,
        status: 'confirming',
      },
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 查询订单状态 ====================

/**
 * 查询订单状态
 * GET /api/v1/payment/status/:orderNo
 */
router.get('/status/:orderNo', async (req: Request, res: Response) => {
  try {
    const { orderNo } = req.params;
    
    const { data: order, error } = await client
      .from('pay_orders')
      .select('*')
      .eq('order_no', orderNo)
      .single();
    
    if (error || !order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        status: order.status,
        amount: order.amount,
        payType: order.pay_type,
        productType: order.product_type,
        paidAt: order.paid_at,
        confirmedAt: order.confirmed_at,
        expiredAt: order.expired_at,
      },
    });
  } catch (error) {
    console.error('Query order status error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// ==================== 管理员确认收款 ====================

const adminConfirmSchema = z.object({
  orderNo: z.string().min(1),
  adminKey: z.string().min(1), // 简单的管理员验证
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(), // 拒绝原因
});

/**
 * 管理员审核支付
 * POST /api/v1/payment/admin/verify
 */
router.post('/admin/verify', async (req: Request, res: Response) => {
  try {
    const body = adminConfirmSchema.parse(req.body);
    
    // 简单的管理员验证（实际项目中应使用JWT或更安全的方式）
    const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
    if (body.adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限' });
    }
    
    // 查询订单
    const { data: order, error: orderError } = await client
      .from('pay_orders')
      .select('*')
      .eq('order_no', body.orderNo)
      .single();
    
    if (orderError || !order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'confirming') {
      return res.status(400).json({ error: '订单状态异常' });
    }
    
    if (body.action === 'approve') {
      // 批准支付
      const { error: updateError } = await client
        .from('pay_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
      
      if (updateError) {
        return res.status(500).json({ error: '操作失败' });
      }
      
      // 激活会员（如果产品类型是会员）
      if (order.product_type === 'membership' || order.product_type === 'super_member') {
        const memberLevel = order.product_type === 'super_member' ? 'super' : 'member';
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 1);
        
        await client
          .from('users')
          .update({
            member_level: memberLevel,
            member_expire_at: expireDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.user_id);
      }
      
      res.json({ success: true, message: '支付已确认，会员已激活' });
    } else {
      // 拒绝支付
      const { error: updateError } = await client
        .from('pay_orders')
        .update({
          status: 'rejected',
          admin_remark: body.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);
      
      if (updateError) {
        return res.status(500).json({ error: '操作失败' });
      }
      
      res.json({ success: true, message: '支付已拒绝' });
    }
  } catch (error) {
    console.error('Admin verify error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 获取待审核订单列表 ====================

/**
 * 获取待审核订单
 * GET /api/v1/payment/admin/pending
 */
router.get('/admin/pending', async (req: Request, res: Response) => {
  try {
    const adminKey = req.query.adminKey as string;
    
    const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: '无权限' });
    }
    
    const { data: orders, error } = await client
      .from('pay_orders')
      .select('*, users(nickname, phone)')
      .eq('status', 'confirming')
      .order('confirmed_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({ success: true, data: orders || [] });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

export default router;
