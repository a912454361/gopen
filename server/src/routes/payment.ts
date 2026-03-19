import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 管理员配置 ====================

// 唯一管理员配置（实际项目中应从数据库读取）
const ADMIN_CONFIG = {
  key: process.env.ADMIN_KEY || 'gopen_admin_2024',
  // 唯一管理员用户ID（可以设置为您的用户ID）
  adminUserId: process.env.ADMIN_USER_ID || 'gopen_admin',
  adminName: 'G Open 管理员',
};

/**
 * 验证管理员权限
 */
const verifyAdmin = (adminKey: string): boolean => {
  return adminKey === ADMIN_CONFIG.key;
};

// ==================== 收款账户配置 ====================

// 真实收款账户信息（管理员可配置）
// 支付宝收款码格式：https://qr.alipay.com/xxx
// 微信收款码格式：wxp://xxx 或图片URL
const PAYMENT_ACCOUNTS = {
  alipay: {
    name: '支付宝收款',
    account: '18321337942', // 支付宝账号（手机号）
    qrcodeUrl: 'https://coze-coding-project.tos.coze.site/coze_storage_7618582774739501102/payment/alipay-qrcode_fea69237.png?sign=1805436367-d91c235771-0-f4f506bd6dc6a7dd8461776b01138ce542579dcc6cc82f22fb7c7eb04089e51c', // 支付宝商户收款码图片
    realName: 'G Open官方', // 收款人姓名
    desc: '请使用支付宝扫码支付',
  },
  wechat: {
    name: '微信收款',
    account: '', // 微信号（可选）
    qrcodeUrl: 'https://coze-coding-project.tos.coze.site/coze_storage_7618582774739501102/payment/wechat-qrcode_c072ee41.png?sign=1805435684-13fd0778c0-0-d9cbf4d37cd37cba46a1bb9e0bc7981d07781fee239857e81b89d74bac7b76ae', // 微信商户收款码
    realName: 'G Open官方', // 收款人姓名
    desc: '请使用微信扫码支付',
  },
};

// 将收款链接转换为可显示的二维码图片URL
const getQRCodeImageUrl = (qrcodeUrl: string, payType: string): string => {
  // 如果已经是图片URL，直接返回
  // 支持：qrserver.com、对象存储URL(.png/.jpg等后缀或带查询参数的图片URL)、图片文件后缀
  if (
    qrcodeUrl.includes('qrserver.com') ||
    qrcodeUrl.includes('.tos.') || // 对象存储URL
    qrcodeUrl.match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/i) // 图片后缀（支持查询参数）
  ) {
    return qrcodeUrl;
  }
  // 否则使用第三方服务生成二维码图片
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrcodeUrl)}`;
};

/**
 * 获取收款账户信息
 * GET /api/v1/payment/accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    // 返回收款账户信息，将收款链接转换为可显示的二维码图片
    const accounts = {
      alipay: {
        name: PAYMENT_ACCOUNTS.alipay.name,
        account: PAYMENT_ACCOUNTS.alipay.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.alipay.qrcodeUrl, 'alipay'),
        realName: PAYMENT_ACCOUNTS.alipay.realName,
        desc: PAYMENT_ACCOUNTS.alipay.desc,
      },
      wechat: {
        name: PAYMENT_ACCOUNTS.wechat.name,
        account: PAYMENT_ACCOUNTS.wechat.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.wechat.qrcodeUrl, 'wechat'),
        realName: PAYMENT_ACCOUNTS.wechat.realName,
        desc: PAYMENT_ACCOUNTS.wechat.desc,
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
          qrcodeUrl: getQRCodeImageUrl(paymentAccount.qrcodeUrl, body.payType),
          realName: paymentAccount.realName,
        },
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 用户确认支付（固定收款码模式）====================

const confirmPaymentSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(), // 支付金额（分）
  payType: z.enum(['alipay', 'wechat']),
  productType: z.enum(['membership', 'super_member']),
  transactionId: z.string().min(1), // 用户填写的交易流水号
  remark: z.string().optional(), // 用户备注
});

/**
 * 用户确认已支付（固定收款码模式）
 * POST /api/v1/payment/confirm
 */
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const body = confirmPaymentSchema.parse(req.body);
    
    // 生成订单号
    const orderNo = `GO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // 创建待审核订单
    const { data: order, error } = await client
      .from('pay_orders')
      .insert([{
        order_no: orderNo,
        user_id: body.userId,
        amount: body.amount,
        pay_type: body.payType,
        product_type: body.productType,
        status: 'confirming', // 待审核状态
        transaction_id: body.transactionId,
        user_remark: body.remark,
        confirmed_at: new Date().toISOString(),
        qr_code_url: PAYMENT_ACCOUNTS[body.payType].qrcodeUrl,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create confirm order:', error);
      return res.status(500).json({ error: '提交失败' });
    }
    
    res.json({
      success: true,
      message: '已提交支付确认，请等待管理员审核',
      data: {
        orderNo,
        status: 'confirming',
        confirmedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 旧版用户确认支付（依赖订单号，已废弃）====================

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
    
    // 验证管理员权限（唯一管理员）
    if (!verifyAdmin(body.adminKey)) {
      return res.status(403).json({ error: '无权限，您不是管理员' });
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
    
    // 验证管理员权限（唯一管理员）
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限，您不是管理员' });
    }
    
    // 查询待审核订单
    const { data: orders, error } = await client
      .from('pay_orders')
      .select('*')
      .eq('status', 'confirming')
      .order('confirmed_at', { ascending: false });
    
    if (error) {
      console.error('Query error:', error);
      return res.status(500).json({ error: '查询失败' });
    }
    
    res.json({ success: true, data: orders || [] });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// ==================== 获取管理员信息 ====================

/**
 * 获取管理员信息
 * GET /api/v1/payment/admin/info
 */
router.get('/admin/info', async (req: Request, res: Response) => {
  try {
    const adminKey = req.query.adminKey as string;
    
    // 验证管理员权限
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }
    
    // 获取订单统计
    const { data: pendingOrders } = await client
      .from('pay_orders')
      .select('id')
      .eq('status', 'confirming');
    
    const { data: todayOrders } = await client
      .from('pay_orders')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', new Date().toISOString().split('T')[0]);
    
    const todayAmount = (todayOrders || []).reduce((sum, order) => sum + (order.amount || 0), 0);
    
    res.json({
      success: true,
      data: {
        adminName: ADMIN_CONFIG.adminName,
        pendingCount: pendingOrders?.length || 0,
        todayAmount,
        todayOrders: todayOrders?.length || 0,
      },
    });
  } catch (error) {
    console.error('Get admin info error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// ==================== 管理员更新收款账户 ====================

const updateAccountSchema = z.object({
  payType: z.enum(['alipay', 'wechat']),
  account: z.string().min(1),
  qrcodeUrl: z.string().url(),
  realName: z.string().optional(),
  desc: z.string().optional(),
});

/**
 * 管理员更新收款账户
 * POST /api/v1/payment/admin/accounts
 * Headers: x-admin-key: gopen_admin_2024
 */
router.post('/admin/accounts', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'] as string;
    
    // 验证管理员权限
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限，您不是管理员' });
    }
    
    const body = updateAccountSchema.parse(req.body);
    
    // 更新收款账户
    PAYMENT_ACCOUNTS[body.payType] = {
      name: body.payType === 'alipay' ? '支付宝收款' : '微信收款',
      account: body.account,
      qrcodeUrl: body.qrcodeUrl,
      realName: body.realName || PAYMENT_ACCOUNTS[body.payType].realName,
      desc: body.desc || `请使用${body.payType === 'alipay' ? '支付宝' : '微信'}扫码支付`,
    };
    
    res.json({
      success: true,
      data: {
        ...PAYMENT_ACCOUNTS[body.payType],
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS[body.payType].qrcodeUrl, body.payType),
      },
      message: '收款账户更新成功',
    });
  } catch (error) {
    console.error('Update payment account error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '参数错误', details: error.issues });
    }
    res.status(500).json({ error: '更新失败' });
  }
});

// ==================== 刷新收款码 ====================

/**
 * 刷新收款码（从数据库重新加载）
 * POST /api/v1/payment/admin/qrcode/refresh
 */
router.post('/admin/qrcode/refresh', async (req: Request, res: Response) => {
  try {
    const adminKey = req.query.adminKey as string;
    const payType = req.query.payType as 'alipay' | 'wechat';
    
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }
    
    if (!payType || !['alipay', 'wechat'].includes(payType)) {
      return res.status(400).json({ error: '无效的支付类型' });
    }
    
    // 尝试从数据库获取最新配置
    const { data: config, error } = await client
      .from('payment_configs')
      .select('*')
      .eq('pay_type', payType)
      .eq('is_active', true)
      .single();
    
    if (config) {
      // 更新内存中的配置
      PAYMENT_ACCOUNTS[payType] = {
        name: config.name || PAYMENT_ACCOUNTS[payType].name,
        account: config.account || PAYMENT_ACCOUNTS[payType].account,
        qrcodeUrl: config.qrcode_url || PAYMENT_ACCOUNTS[payType].qrcodeUrl,
        realName: config.real_name || PAYMENT_ACCOUNTS[payType].realName,
        desc: config.desc || PAYMENT_ACCOUNTS[payType].desc,
      };
    }
    
    res.json({
      success: true,
      data: {
        ...PAYMENT_ACCOUNTS[payType],
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS[payType].qrcodeUrl, payType),
      },
      message: '收款码已刷新',
    });
  } catch (error) {
    console.error('Refresh QR code error:', error);
    res.status(500).json({ error: '刷新失败' });
  }
});

// ==================== 商家配置 ====================

// 商家配置（内存存储，实际应存储在数据库）
let MERCHANT_CONFIG: {
  enabled: boolean;
  type: 'personal' | 'business';
  wechat?: {
    mchId: string;
    apiKey: string;
    certUploaded: boolean;
    status: string;
  };
  alipay?: {
    appId: string;
    privateKeyUploaded: boolean;
    status: string;
  };
} = {
  enabled: false,
  type: 'personal',
};

/**
 * 获取商家配置
 * GET /api/v1/payment/admin/merchant
 */
router.get('/admin/merchant', async (req: Request, res: Response) => {
  try {
    const adminKey = req.query.adminKey as string;
    
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }
    
    // 尝试从数据库获取配置
    const { data: merchantData } = await client
      .from('merchant_configs')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (merchantData) {
      MERCHANT_CONFIG = {
        enabled: merchantData.enabled || false,
        type: merchantData.type || 'personal',
        wechat: merchantData.wechat_config || undefined,
        alipay: merchantData.alipay_config || undefined,
      };
    }
    
    res.json({ success: true, data: MERCHANT_CONFIG });
  } catch (error) {
    // 数据库查询失败，返回默认配置
    res.json({ success: true, data: MERCHANT_CONFIG });
  }
});

const openMerchantSchema = z.object({
  type: z.enum(['personal', 'business']),
  wechatMchId: z.string().optional(),
  wechatApiKey: z.string().optional(),
  alipayAppId: z.string().optional(),
});

/**
 * 开通商家收款
 * POST /api/v1/payment/admin/merchant
 */
router.post('/admin/merchant', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'] as string;
    
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }
    
    const body = openMerchantSchema.parse(req.body);
    
    // 构建新的商家配置
    const newConfig = {
      enabled: !!(body.wechatMchId || body.alipayAppId),
      type: body.type,
      wechat: body.wechatMchId ? {
        mchId: body.wechatMchId,
        apiKey: body.wechatApiKey || '',
        certUploaded: false,
        status: 'pending',
      } : undefined,
      alipay: body.alipayAppId ? {
        appId: body.alipayAppId,
        privateKeyUploaded: false,
        status: 'pending',
      } : undefined,
    };
    
    // 保存到数据库
    try {
      // 先尝试更新
      const { error: upsertError } = await client
        .from('merchant_configs')
        .upsert([{
          id: 1, // 固定ID，只保留一条配置
          enabled: newConfig.enabled,
          type: newConfig.type,
          wechat_config: newConfig.wechat,
          alipay_config: newConfig.alipay,
          is_active: true,
          updated_at: new Date().toISOString(),
        }], { onConflict: 'id' });
      
      if (upsertError) {
        console.error('Save merchant config error:', upsertError);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }
    
    // 更新内存配置
    MERCHANT_CONFIG = newConfig;
    
    res.json({
      success: true,
      message: newConfig.enabled ? '商家开通申请已提交' : '请至少填写一个支付渠道',
      data: MERCHANT_CONFIG,
    });
  } catch (error) {
    console.error('Open merchant error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '参数错误', details: error.issues });
    }
    res.status(500).json({ error: '开通失败' });
  }
});

export default router;
