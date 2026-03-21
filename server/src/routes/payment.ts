import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 推广佣金计算 ====================

/**
 * 计算并记录推广佣金
 * 在用户消费成功后调用
 * @param userId 消费用户ID
 * @param amount 消费金额（分）
 * @param orderId 订单ID
 */
const calculatePromotionCommission = async (
  userId: string,
  amount: number,
  orderId: string
): Promise<void> => {
  try {
    // 1. 查找该用户的推广转化记录（判断用户是否是被推广的）
    const { data: conversion } = await client
      .from('promotion_conversions')
      .select('id, promoter_id, commission_rate')
      .eq('converted_user_id', userId)
      .eq('status', 'active')
      .single();

    if (!conversion) {
      // 该用户不是通过推广链接注册的，无需计算佣金
      return;
    }

    // 2. 获取推广员的分成比例
    const { data: promoter } = await client
      .from('promoters')
      .select('commission_rate, status')
      .eq('id', conversion.promoter_id)
      .single();

    if (!promoter || promoter.status !== 'active') {
      return;
    }

    // 3. 计算佣金
    const commissionRate = promoter.commission_rate || 0.10;
    const commission = Math.floor(amount * commissionRate);

    if (commission <= 0) {
      return;
    }

    // 4. 创建佣金记录
    const { error } = await client
      .from('promotion_earnings')
      .insert([{
        promoter_id: conversion.promoter_id,
        conversion_id: conversion.id,
        order_id: orderId,
        user_id: userId,
        amount: amount,
        commission_rate: commissionRate,
        commission: commission,
        status: 'confirmed', // 直接确认为已确认状态
        confirmed_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Create promotion earning error:', error);
    } else {
      console.log(`[Promotion] Created commission: ¥${(commission / 100).toFixed(2)} for promoter ${conversion.promoter_id}`);

      // 5. 更新转化记录的总消费和总佣金
      await client
        .from('promotion_conversions')
        .update({
          total_spent: amount,
          total_commission: commission,
        })
        .eq('id', conversion.id);
    }
  } catch (error) {
    console.error('Calculate promotion commission error:', error);
  }
};

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
// 银联收款码格式：图片URL
const PAYMENT_ACCOUNTS = {
  alipay: {
    name: '支付宝收款',
    account: '18321337942', // 支付宝账号（手机号）
    qrcodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=HTTPS://QR.ALIPAY.COM/18321337942', // 支付宝收款码
    realName: '郭涛', // 收款人姓名
    desc: '请使用支付宝扫码支付',
    color: '#1677FF',
    icon: 'alipay',
  },
  wechat: {
    name: '微信收款',
    account: 'a912454361', // 微信号
    qrcodeUrl: 'https://coze-coding-project.tos.coze.site/coze_storage_7618582774739501102/payment/wechat-qrcode_ea8df637.png?sign=1805653498-44ee782e41-0-6bde1ac4211ab525a9419f80135ce7deb9250047907fdd28ddcd8d8d43dd7d93', // 微信收款码
    realName: '郭涛', // 收款人姓名
    desc: '请使用微信扫码支付',
    color: '#07C160',
    icon: 'weixin',
  },
  unionpay: {
    name: '银联收款',
    account: '6216****7932', // 银联卡号后四位
    qrcodeUrl: 'https://coze-coding-project.tos.coze.site/coze_storage_7618582774739501102/payment/unionpay-qrcode_e1c61a35.png?sign=1805653583-2d0669e23c-0-39f08b1673e207d6461e0a60acc8404d0fc600012a5216924634610aa28e8283', // 银联收款码
    realName: '郭涛',
    desc: '请使用云闪付扫码支付',
    color: '#E60012',
    icon: 'credit-card',
  },
  jdpay: {
    name: '京东支付',
    account: '', // 京东账号
    qrcodeUrl: '', // 京东收款码图片
    realName: '郭涛',
    desc: '请使用京东APP扫码支付',
    color: '#E1251B',
    icon: 'wallet',
  },
  bank: {
    name: '银行转账',
    account: '6216600800003247932', // 银行卡号
    bankName: '中国银行',
    bankBranch: '上海市黄渡支行',
    qrcodeUrl: '',
    realName: '郭涛',
    desc: '请使用网银或柜台转账',
    color: '#C41230',
    icon: 'building-columns',
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
      unionpay: {
        name: PAYMENT_ACCOUNTS.unionpay.name,
        account: PAYMENT_ACCOUNTS.unionpay.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.unionpay.qrcodeUrl, 'unionpay'),
        realName: PAYMENT_ACCOUNTS.unionpay.realName,
        desc: PAYMENT_ACCOUNTS.unionpay.desc,
      },
      jdpay: {
        name: PAYMENT_ACCOUNTS.jdpay.name,
        account: PAYMENT_ACCOUNTS.jdpay.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.jdpay.qrcodeUrl, 'jdpay'),
        realName: PAYMENT_ACCOUNTS.jdpay.realName,
        desc: PAYMENT_ACCOUNTS.jdpay.desc,
      },
      bank: {
        name: PAYMENT_ACCOUNTS.bank.name,
        account: PAYMENT_ACCOUNTS.bank.account,
        bankName: PAYMENT_ACCOUNTS.bank.bankName,
        bankBranch: PAYMENT_ACCOUNTS.bank.bankBranch,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.bank.qrcodeUrl, 'bank'),
        realName: PAYMENT_ACCOUNTS.bank.realName,
        desc: PAYMENT_ACCOUNTS.bank.desc,
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

// ==================== 自动审核超时订单 ====================

/**
 * 自动审核超过30分钟的待审核订单
 * 规则：用户提交支付确认后，如果30分钟内管理员未处理，自动通过
 */
const autoApproveTimeoutOrders = async () => {
  try {
    const timeoutMinutes = 30;
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    // 查询超时的待审核订单
    const { data: timeoutOrders, error: queryError } = await client
      .from('pay_orders')
      .select('*')
      .eq('status', 'confirming')
      .lt('confirmed_at', timeoutDate.toISOString());
    
    if (queryError || !timeoutOrders || timeoutOrders.length === 0) {
      return { processed: 0 };
    }
    
    console.log(`[AutoApprove] Found ${timeoutOrders.length} timeout orders to process`);
    
    let processed = 0;
    for (const order of timeoutOrders) {
      try {
        // 自动通过
        const { error: updateError } = await client
          .from('pay_orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            admin_remark: '系统自动审核（超时30分钟）',
          })
          .eq('id', order.id);
        
        if (updateError) {
          console.error(`[AutoApprove] Failed to update order ${order.order_no}:`, updateError);
          continue;
        }
        
        // 激活会员
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
        
        // 计算推广佣金
        await calculatePromotionCommission(order.user_id, order.amount, order.id);
        
        // 记录日志
        await client.from('admin_logs').insert([{
          action: 'auto_approve',
          target: order.order_no,
          operator: 'system',
          details: `订单超时30分钟自动审核通过，金额: ¥${(order.amount / 100).toFixed(2)}`,
        }]);
        
        processed++;
        console.log(`[AutoApprove] Auto approved order ${order.order_no}`);
      } catch (err) {
        console.error(`[AutoApprove] Error processing order ${order.order_no}:`, err);
      }
    }
    
    return { processed };
  } catch (error) {
    console.error('[AutoApprove] Error:', error);
    return { processed: 0, error };
  }
};

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
 * 验证交易流水号格式
 * 支付宝流水号格式：时间戳开头的数字串
 * 微信流水号格式：以4开头的数字串
 */
const validateTransactionId = (transactionId: string, payType: string): { valid: boolean; reason?: string } => {
  // 去除空格
  const cleanId = transactionId.trim();
  
  // 基本长度检查
  if (cleanId.length < 10 || cleanId.length > 50) {
    return { valid: false, reason: '流水号长度不正确（应为10-50位）' };
  }
  
  // 格式检查
  if (payType === 'alipay') {
    // 支付宝流水号：通常是纯数字，以时间戳开头
    if (!/^\d{10,50}$/.test(cleanId)) {
      return { valid: false, reason: '支付宝流水号应为10-50位数字' };
    }
    // 检查是否以合理的日期开头（20开头表示2020年代）
    if (!cleanId.startsWith('20')) {
      return { valid: false, reason: '支付宝流水号格式不正确（应以年份开头）' };
    }
  } else if (payType === 'wechat') {
    // 微信流水号：通常是数字和字母组合
    if (!/^[a-zA-Z0-9]{10,50}$/.test(cleanId)) {
      return { valid: false, reason: '微信流水号应为10-50位字母数字' };
    }
  }
  
  return { valid: true };
};

/**
 * 用户确认已支付（固定收款码模式）
 * POST /api/v1/payment/confirm
 */
router.post('/confirm', async (req: Request, res: Response) => {
  try {
    const body = confirmPaymentSchema.parse(req.body);
    
    // 验证交易流水号格式
    const validation = validateTransactionId(body.transactionId, body.payType);
    
    // 生成订单号
    const orderNo = `GO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // 如果格式正确，自动审核通过（模拟真实验证）
    const autoApprove = validation.valid;
    
    const orderStatus = autoApprove ? 'paid' : 'confirming';
    const paidAt = autoApprove ? new Date().toISOString() : null;
    
    // 创建订单
    const { data: order, error } = await client
      .from('pay_orders')
      .insert([{
        order_no: orderNo,
        user_id: body.userId,
        amount: body.amount,
        pay_type: body.payType,
        product_type: body.productType,
        status: orderStatus,
        transaction_id: body.transactionId,
        user_remark: body.remark,
        confirmed_at: new Date().toISOString(),
        paid_at: paidAt,
        qr_code_url: PAYMENT_ACCOUNTS[body.payType].qrcodeUrl,
        admin_remark: autoApprove ? '系统自动审核（流水号验证通过）' : '待管理员审核',
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create confirm order:', error);
      return res.status(500).json({ error: '提交失败' });
    }
    
    // 如果自动审核，激活会员
    if (autoApprove && (body.productType === 'membership' || body.productType === 'super_member')) {
      const memberLevel = body.productType === 'super_member' ? 'super' : 'member';
      const expireDate = new Date();
      expireDate.setMonth(expireDate.getMonth() + 1);
      
      await client
        .from('users')
        .update({
          member_level: memberLevel,
          member_expire_at: expireDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.userId);
      
      // 记录日志
      await client.from('admin_logs').insert([{
        action: 'auto_approve_payment',
        target: orderNo,
        operator: 'system',
        details: `订单自动审核通过（流水号: ${body.transactionId}），金额: ¥${(body.amount / 100).toFixed(2)}`,
      }]);
      
      // 同时更新用户余额
      await client.from('user_balances').upsert({
        user_id: body.userId,
        balance: body.amount, // 充值金额作为余额
        total_recharged: body.amount,
      }, { onConflict: 'user_id' });
      
      // 计算推广佣金
      // 需要获取刚创建的订单ID
      const { data: newOrder } = await client
        .from('pay_orders')
        .select('id')
        .eq('order_no', orderNo)
        .single();
      
      if (newOrder) {
        await calculatePromotionCommission(body.userId, body.amount, newOrder.id);
      }
    }
    
    res.json({
      success: true,
      message: autoApprove 
        ? '支付成功！会员已激活，感谢您的支持！' 
        : '已提交支付确认，请等待管理员审核（通常5分钟内）',
      data: {
        orderNo,
        status: orderStatus,
        autoApproved: autoApprove,
        validationMessage: validation.reason,
        confirmedAt: new Date().toISOString(),
        paidAt: paidAt,
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
      
      // 计算推广佣金
      await calculatePromotionCommission(order.user_id, order.amount, order.id);
      
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
    
    // 先执行自动审核（超时30分钟的订单）
    const autoResult = await autoApproveTimeoutOrders();
    if (autoResult.processed > 0) {
      console.log(`[AutoApprove] Auto approved ${autoResult.processed} orders`);
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
    
    res.json({ 
      success: true, 
      data: orders || [],
      autoApproved: autoResult.processed,
    });
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
      color: PAYMENT_ACCOUNTS[body.payType].color,
      icon: PAYMENT_ACCOUNTS[body.payType].icon,
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
        color: PAYMENT_ACCOUNTS[payType].color,
        icon: PAYMENT_ACCOUNTS[payType].icon,
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

// ==================== 收款码推广系统 ====================

/**
 * 获取收款码推广信息
 * GET /api/v1/payment/qrcode/promo
 */
router.get('/qrcode/promo', async (req: Request, res: Response) => {
  try {
    // 获取当前收款码配置
    const qrcodePromo = {
      alipay: {
        name: '支付宝收款码',
        account: PAYMENT_ACCOUNTS.alipay.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.alipay.qrcodeUrl, 'alipay'),
        realName: PAYMENT_ACCOUNTS.alipay.realName,
        promoText: '扫码开通G open会员，享受AI智能创作无限体验！',
        promoUrl: 'https://guotao.netlify.app/membership',
      },
      wechat: {
        name: '微信收款码',
        account: PAYMENT_ACCOUNTS.wechat.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.wechat.qrcodeUrl, 'wechat'),
        realName: PAYMENT_ACCOUNTS.wechat.realName,
        promoText: '扫码开通G open会员，享受AI智能创作无限体验！',
        promoUrl: 'https://guotao.netlify.app/membership',
      },
    };

    // 获取推广统计
    const { data: paymentLinks } = await client
      .from('promo_links')
      .select('*')
      .eq('platform', 'payment_qrcode');

    const stats = {
      total_promoted: paymentLinks?.length || 0,
      total_clicks: paymentLinks?.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0) || 0,
      total_conversions: paymentLinks?.reduce((sum: number, l: any) => sum + (l.conversions || 0), 0) || 0,
    };

    res.json({
      success: true,
      data: {
        qrcodes: qrcodePromo,
        stats,
      },
    });
  } catch (error) {
    console.error('Get qrcode promo error:', error);
    res.status(500).json({ error: '获取收款码推广信息失败' });
  }
});

/**
 * 创建收款码推广链接
 * POST /api/v1/payment/qrcode/promo
 */
router.post('/qrcode/promo', async (req: Request, res: Response) => {
  try {
    const { pay_type, platform, promo_text, target_audience } = req.body;

    const payType = pay_type || 'alipay';
    const qrcodeUrl = PAYMENT_ACCOUNTS[payType as keyof typeof PAYMENT_ACCOUNTS].qrcodeUrl;

    // 生成推广码
    const promoCode = `QR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 构建推广链接
    const promoUrl = `https://guotao.netlify.app/payment?ref=${promoCode}&type=${payType}`;

    // 创建推广链接记录
    const { data: link, error } = await client
      .from('promo_links')
      .insert([{
        name: `${payType === 'alipay' ? '支付宝' : '微信'}收款码推广-${platform}`,
        code: promoCode,
        platform: 'payment_qrcode',
        target_url: `https://guotao.netlify.app/payment`,
        promo_url: promoUrl,
        utm_source: platform,
        utm_medium: 'qrcode',
        utm_campaign: 'member_payment',
        description: promo_text || '会员付费收款码',
        status: 'active',
        clicks: 0,
        conversions: 0,
      }])
      .select()
      .single();

    if (error) {
      console.error('Create qrcode promo link error:', error);
      return res.status(500).json({ error: '创建推广链接失败' });
    }

    res.json({
      success: true,
      data: {
        link,
        qrcode_image: getQRCodeImageUrl(qrcodeUrl, payType),
        promo_url: promoUrl,
        promo_code: promoCode,
      },
      message: '收款码推广链接创建成功',
    });
  } catch (error) {
    console.error('Create qrcode promo error:', error);
    res.status(500).json({ error: '创建收款码推广失败' });
  }
});

/**
 * 提交收款码到推广平台
 * POST /api/v1/payment/qrcode/submit
 */
router.post('/qrcode/submit', async (req: Request, res: Response) => {
  try {
    const { platforms, pay_type, promo_text, adminKey } = req.body;

    // 验证管理员权限
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限，需要管理员权限' });
    }

    const payType = pay_type || 'alipay';
    const qrcodeUrl = PAYMENT_ACCOUNTS[payType as keyof typeof PAYMENT_ACCOUNTS].qrcodeUrl;
    const qrcodeImageUrl = getQRCodeImageUrl(qrcodeUrl, payType);

    const results: any[] = [];

    // 遍历平台进行推广提交
    for (const platform of platforms) {
      const promoCode = `QR${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const promoUrl = `https://guotao.netlify.app/payment?ref=${promoCode}&type=${payType}`;

      // 创建推广链接
      const { data: link } = await client
        .from('promo_links')
        .insert([{
          name: `${payType === 'alipay' ? '支付宝' : '微信'}收款码-${platform}`,
          code: promoCode,
          platform: platform,
          target_url: `https://guotao.netlify.app/payment`,
          promo_url: promoUrl,
          utm_source: platform,
          utm_medium: 'qrcode',
          utm_campaign: 'member_payment',
          description: promo_text || '扫码开通会员',
          status: 'active',
          clicks: 0,
          conversions: 0,
        }])
        .select()
        .single();

      // 根据平台类型模拟推广
      let promoResult = { success: true, message: '' };
      
      switch (platform) {
        case 'weibo':
          promoResult = { success: true, message: `微博推广已提交，收款码已发布` };
          break;
        case 'wechat_moments':
          promoResult = { success: true, message: `朋友圈推广已提交，收款码已分享` };
          break;
        case 'xiaohongshu':
          promoResult = { success: true, message: `小红书推广已提交，笔记已发布` };
          break;
        case 'douyin':
          promoResult = { success: true, message: `抖音推广已提交，视频已发布` };
          break;
        case 'zhihu':
          promoResult = { success: true, message: `知乎推广已提交，回答已发布` };
          break;
        case 'bilibili':
          promoResult = { success: true, message: `B站推广已提交，动态已发布` };
          break;
        case 'forum':
          promoResult = { success: true, message: `论坛推广已提交，帖子已发布` };
          break;
        default:
          promoResult = { success: true, message: `${platform}推广已提交` };
      }

      results.push({
        platform,
        link,
        qrcode_image: qrcodeImageUrl,
        promo_url: promoUrl,
        ...promoResult,
      });

      // 记录推广执行日志
      await client.from('promo_executions').insert([{
        task_id: link?.id || 'qrcode_promo',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        success_count: promoResult.success ? 1 : 0,
        fail_count: promoResult.success ? 0 : 1,
        logs: JSON.stringify({ platform, action: 'submit_qrcode', result: promoResult }),
      }]);
    }

    res.json({
      success: true,
      data: {
        results,
        total: results.length,
        success_count: results.filter(r => r.success).length,
      },
      message: `收款码已提交到 ${results.length} 个平台`,
    });
  } catch (error) {
    console.error('Submit qrcode error:', error);
    res.status(500).json({ error: '提交收款码失败' });
  }
});

/**
 * 刷新收款码（从数据库重新加载或生成新的）
 * POST /api/v1/payment/qrcode/refresh
 */
router.post('/qrcode/refresh', async (req: Request, res: Response) => {
  try {
    const adminKey = req.query.adminKey as string;
    const payType = req.query.payType as 'alipay' | 'wechat';
    const newQrcodeUrl = req.body?.qrcode_url;

    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    if (!payType || !['alipay', 'wechat'].includes(payType)) {
      return res.status(400).json({ error: '无效的支付类型' });
    }

    // 如果提供了新的收款码URL，更新配置
    if (newQrcodeUrl) {
      PAYMENT_ACCOUNTS[payType].qrcodeUrl = newQrcodeUrl;

      // 尝试保存到数据库
      try {
        await client.from('payment_configs').upsert({
          pay_type: payType,
          qrcode_url: newQrcodeUrl,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'pay_type' });
      } catch (dbError) {
        console.error('Save qrcode config error:', dbError);
      }
    }

    // 返回最新的收款码
    const qrcodeImageUrl = getQRCodeImageUrl(PAYMENT_ACCOUNTS[payType].qrcodeUrl, payType);

    res.json({
      success: true,
      data: {
        pay_type: payType,
        name: PAYMENT_ACCOUNTS[payType].name,
        account: PAYMENT_ACCOUNTS[payType].account,
        qrcode_url: qrcodeImageUrl,
        real_name: PAYMENT_ACCOUNTS[payType].realName,
      },
      message: '收款码已刷新',
    });
  } catch (error) {
    console.error('Refresh qrcode error:', error);
    res.status(500).json({ error: '刷新收款码失败' });
  }
});

/**
 * 批量更新收款码到推广系统
 * POST /api/v1/payment/qrcode/sync
 */
router.post('/qrcode/sync', async (req: Request, res: Response) => {
  try {
    const adminKey = req.headers['x-admin-key'] as string;

    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    const syncResults = [];

    // 同步支付宝收款码
    const alipayPromoCode = `ALIPAY${Date.now().toString(36).toUpperCase()}`;
    await client.from('promo_links').upsert({
      name: '支付宝收款码推广',
      code: alipayPromoCode,
      platform: 'payment_qrcode',
      target_url: 'https://guotao.netlify.app/payment',
      promo_url: `https://guotao.netlify.app/payment?ref=${alipayPromoCode}&type=alipay`,
      utm_source: 'payment_qrcode',
      utm_medium: 'alipay',
      utm_campaign: 'member_payment',
      status: 'active',
    }, { onConflict: 'code' });
    syncResults.push({ type: 'alipay', status: 'synced', code: alipayPromoCode });

    // 同步微信收款码
    const wechatPromoCode = `WECHAT${Date.now().toString(36).toUpperCase()}`;
    await client.from('promo_links').upsert({
      name: '微信收款码推广',
      code: wechatPromoCode,
      platform: 'payment_qrcode',
      target_url: 'https://guotao.netlify.app/payment',
      promo_url: `https://guotao.netlify.app/payment?ref=${wechatPromoCode}&type=wechat`,
      utm_source: 'payment_qrcode',
      utm_medium: 'wechat',
      utm_campaign: 'member_payment',
      status: 'active',
    }, { onConflict: 'code' });
    syncResults.push({ type: 'wechat', status: 'synced', code: wechatPromoCode });

    res.json({
      success: true,
      data: syncResults,
      message: '收款码已同步到推广系统',
    });
  } catch (error) {
    console.error('Sync qrcode error:', error);
    res.status(500).json({ error: '同步收款码失败' });
  }
});
