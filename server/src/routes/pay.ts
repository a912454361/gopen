import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import type { PayOrder, PayAuth, PayDeductRecord } from '../storage/database/shared/schema.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 生成支付二维码 ====================

const generateQRCodeSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(), // 金额（分）
  payType: z.enum(['alipay', 'wechat', 'douyin']),
  productType: z.enum(['membership', 'super_member']),
  productDetail: z.record(z.string(), z.any()).optional(),
});

/**
 * 生成支付二维码
 * POST /api/v1/pay/qrcode
 * Body: { userId, amount, payType, productType, productDetail? }
 */
router.post('/qrcode', async (req: Request, res: Response) => {
  try {
    const body = generateQRCodeSchema.parse(req.body);
    
    // 生成订单号
    const orderNo = `GO${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // 设置过期时间（15分钟后）
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // 生成二维码URL（实际项目中应调用支付宝/微信支付API）
    // 根据支付方式生成对应的二维码链接
    let qrCodeUrl: string;
    if (body.payType === 'alipay') {
      qrCodeUrl = `https://qr.alipay.com/${orderNo}`;
    } else if (body.payType === 'wechat') {
      qrCodeUrl = `weixin://wxpay/bizpayurl?pr=${orderNo}`;
    } else {
      // 抖音支付
      qrCodeUrl = `snssdk1128://pay?order=${orderNo}`;
    }
    
    const qrCodeData = JSON.stringify({
      orderNo,
      amount: body.amount,
      payType: body.payType,
      productType: body.productType,
      timestamp: Date.now(),
    });
    
    // 创建订单记录
    const { data: order, error } = await client
      .from('pay_orders')
      .insert([{
        order_no: orderNo,
        user_id: body.userId,
        amount: body.amount,
        pay_type: body.payType,
        status: 'pending',
        qr_code_url: qrCodeUrl,
        qr_code_data: qrCodeData,
        product_type: body.productType,
        product_detail: body.productDetail || {},
        expired_at: expiredAt.toISOString(),
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create order:', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo,
        qrCodeUrl,
        qrCodeData,
        amount: body.amount,
        expiredAt: expiredAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 查询支付状态 ====================

/**
 * 查询支付状态
 * GET /api/v1/pay/status/:orderNo
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
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        status: order.status,
        amount: order.amount,
        payType: order.pay_type,
        paidAt: order.paid_at,
        productType: order.product_type,
      },
    });
  } catch (error) {
    console.error('Query order status error:', error);
    res.status(500).json({ error: 'Failed to query order status' });
  }
});

// ==================== 支付回调 ====================

const callbackSchema = z.object({
  orderNo: z.string(),
  tradeNo: z.string(),
  amount: z.number(),
  status: z.enum(['paid', 'failed']),
  callbackData: z.record(z.string(), z.any()).optional(),
});

/**
 * 支付回调（模拟）
 * POST /api/v1/pay/callback
 * Body: { orderNo, tradeNo, amount, status, callbackData? }
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const body = callbackSchema.parse(req.body);
    
    const { data: order, error: findError } = await client
      .from('pay_orders')
      .select('*')
      .eq('order_no', body.orderNo)
      .single();
    
    if (findError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // 更新订单状态
    const { error: updateError } = await client
      .from('pay_orders')
      .update({
        status: body.status,
        paid_at: body.status === 'paid' ? new Date().toISOString() : null,
        callback_data: body.callbackData || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    
    if (updateError) {
      console.error('Failed to update order:', updateError);
      return res.status(500).json({ error: 'Failed to update order' });
    }
    
    // 支付成功后触发业务逻辑（如开通会员）
    if (body.status === 'paid') {
      console.log(`[PayCallback] Order ${body.orderNo} paid, triggering business logic...`);
      // TODO: 调用会员开通服务
    }
    
    res.json({ success: true, message: 'Callback processed' });
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 模拟支付成功 ====================

/**
 * 模拟支付成功（仅用于测试）
 * POST /api/v1/pay/simulate/:orderNo
 */
router.post('/simulate/:orderNo', async (req: Request, res: Response) => {
  try {
    const { orderNo } = req.params;
    
    const { data: order, error: findError } = await client
      .from('pay_orders')
      .select('*')
      .eq('order_no', orderNo)
      .single();
    
    if (findError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // 更新订单状态为已支付
    const { error: updateError } = await client
      .from('pay_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        callback_data: { simulated: true },
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    
    if (updateError) {
      return res.status(500).json({ error: 'Failed to update order' });
    }
    
    res.json({ success: true, message: 'Payment simulated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to simulate payment' });
  }
});

// ==================== 生成授权二维码 ====================

const generateAuthQRCodeSchema = z.object({
  userId: z.string().min(1),
  authType: z.enum(['alipay', 'wechat']),
  deductAmount: z.number().int().positive().default(2900), // 默认29元
  deductCycle: z.enum(['monthly', 'daily']).default('monthly'),
});

/**
 * 生成代扣授权二维码
 * POST /api/v1/pay/auth/qrcode
 * Body: { userId, authType, deductAmount?, deductCycle? }
 */
router.post('/auth/qrcode', async (req: Request, res: Response) => {
  try {
    const body = generateAuthQRCodeSchema.parse(req.body);
    
    // 检查是否已有有效授权
    const { data: existingAuth } = await client
      .from('pay_auths')
      .select('*')
      .eq('user_id', body.userId)
      .eq('auth_type', body.authType)
      .eq('status', 'active')
      .single();
    
    if (existingAuth) {
      return res.status(400).json({ error: 'Active authorization already exists' });
    }
    
    // 生成授权号
    const authNo = `AUTH${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // 计算下次扣费时间
    const nextDeductTime = calculateNextDeductTime(body.deductCycle);
    
    // 生成Cron表达式
    const cronExpression = body.deductCycle === 'monthly' 
      ? '0 0 1 * *'  // 每月1号
      : '0 0 * * *'; // 每天
    
    // 创建授权记录
    const { data: auth, error } = await client
      .from('pay_auths')
      .insert([{
        user_id: body.userId,
        auth_type: body.authType,
        auth_no: authNo,
        status: 'active',
        deduct_amount: body.deductAmount,
        deduct_cycle: body.deductCycle,
        cron_expression: cronExpression,
        next_deduct_time: nextDeductTime.toISOString(),
        auth_data: { pending: true },
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to create authorization' });
    }
    
    // 生成授权二维码URL（实际项目中应调用支付宝/微信授权API）
    const qrCodeUrl = body.authType === 'alipay'
      ? `https://openauth.alipay.com/oauth2/appToAppAuth.htm?app_id=YOUR_APP_ID&redirect_uri=YOUR_CALLBACK&state=${authNo}`
      : `https://open.weixin.qq.com/connect/oauth2/authorize?appid=YOUR_APPID&redirect_uri=YOUR_CALLBACK&state=${authNo}#wechat_redirect`;
    
    res.json({
      success: true,
      data: {
        authId: auth.id,
        authNo,
        qrCodeUrl,
        deductAmount: body.deductAmount,
        deductCycle: body.deductCycle,
        nextDeductTime: nextDeductTime.toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate auth QR code error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 查询授权状态 ====================

/**
 * 查询授权状态
 * GET /api/v1/pay/auth/:userId
 */
router.get('/auth/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: auths, error } = await client
      .from('pay_auths')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');
    
    if (error) {
      return res.status(500).json({ error: 'Failed to query authorization' });
    }
    
    res.json({ success: true, data: auths });
  } catch (error) {
    res.status(500).json({ error: 'Failed to query authorization' });
  }
});

// ==================== 执行扣费 ====================

const deductFeeSchema = z.object({
  authId: z.string(),
  amount: z.number().int().positive().optional(),
});

/**
 * 执行代扣扣费
 * POST /api/v1/pay/deduct
 * Body: { authId, amount? }
 */
router.post('/deduct', async (req: Request, res: Response) => {
  try {
    const body = deductFeeSchema.parse(req.body);
    
    // 查询授权
    const { data: auth, error: authError } = await client
      .from('pay_auths')
      .select('*')
      .eq('id', body.authId)
      .eq('status', 'active')
      .single();
    
    if (authError || !auth) {
      return res.status(404).json({ error: 'Authorization not found or inactive' });
    }
    
    const deductAmount = body.amount || auth.deduct_amount;
    
    // 创建扣费记录
    const orderNo = `DED${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const { data: record, error: recordError } = await client
      .from('pay_deduct_records')
      .insert([{
        auth_id: auth.id,
        user_id: auth.user_id,
        order_no: orderNo,
        amount: deductAmount,
        status: 'pending',
      }])
      .select()
      .single();
    
    if (recordError) {
      return res.status(500).json({ error: 'Failed to create deduct record' });
    }
    
    // 模拟执行扣费（实际项目中应调用支付宝/微信扣费API）
    const deductSuccess = Math.random() > 0.2; // 80%成功率模拟
    
    if (deductSuccess) {
      // 更新扣费记录为成功
      await client
        .from('pay_deduct_records')
        .update({
          status: 'success',
          deducted_at: new Date().toISOString(),
        })
        .eq('id', record.id);
      
      // 更新授权的下次扣费时间
      const nextDeductTime = calculateNextDeductTime(auth.deduct_cycle);
      await client
        .from('pay_auths')
        .update({
          last_deduct_time: new Date().toISOString(),
          next_deduct_time: nextDeductTime.toISOString(),
          retry_count: 0,
        })
        .eq('id', auth.id);
      
      res.json({
        success: true,
        data: {
          recordId: record.id,
          orderNo,
          amount: deductAmount,
          status: 'success',
        },
      });
    } else {
      // 扣费失败
      await client
        .from('pay_deduct_records')
        .update({
          status: 'failed',
          error_message: 'Deduct fee failed (simulated)',
        })
        .eq('id', record.id);
      
      // 更新重试次数
      await client
        .from('pay_auths')
        .update({
          retry_count: auth.retry_count + 1,
        })
        .eq('id', auth.id);
      
      res.json({
        success: false,
        data: {
          recordId: record.id,
          orderNo,
          amount: deductAmount,
          status: 'failed',
          errorMessage: 'Deduct fee failed',
        },
      });
    }
  } catch (error) {
    console.error('Deduct fee error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 配置定时扣费 ====================

const setTimedDeductSchema = z.object({
  authId: z.string(),
  cronExpression: z.string(),
  deductAmount: z.number().int().positive().optional(),
});

/**
 * 配置定时扣费
 * POST /api/v1/pay/timed-deduct
 * Body: { authId, cronExpression, deductAmount? }
 */
router.post('/timed-deduct', async (req: Request, res: Response) => {
  try {
    const body = setTimedDeductSchema.parse(req.body);
    
    // 验证Cron表达式
    const cronValid = validateCronExpression(body.cronExpression);
    if (!cronValid) {
      return res.status(400).json({ error: 'Invalid cron expression' });
    }
    
    // 更新授权配置
    const { error } = await client
      .from('pay_auths')
      .update({
        cron_expression: body.cronExpression,
        deduct_amount: body.deductAmount || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.authId)
      .eq('status', 'active');
    
    if (error) {
      return res.status(500).json({ error: 'Failed to update timed deduct config' });
    }
    
    res.json({
      success: true,
      message: 'Timed deduct configured successfully',
      data: {
        authId: body.authId,
        cronExpression: body.cronExpression,
      },
    });
  } catch (error) {
    console.error('Set timed deduct error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 重试失败扣费 ====================

/**
 * 重试失败的扣费
 * POST /api/v1/pay/retry/:recordId
 */
router.post('/retry/:recordId', async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params;
    
    // 查询扣费记录
    const { data: record, error: recordError } = await client
      .from('pay_deduct_records')
      .select('*, pay_auths(*)')
      .eq('id', recordId)
      .single();
    
    if (recordError || !record) {
      return res.status(404).json({ error: 'Deduct record not found' });
    }
    
    if (record.status !== 'failed') {
      return res.status(400).json({ error: 'Only failed records can be retried' });
    }
    
    const auth = Array.isArray(record.pay_auths) ? record.pay_auths[0] : record.pay_auths;
    if (!auth) {
      return res.status(404).json({ error: 'Authorization not found' });
    }
    
    // 检查重试次数
    if (auth.retry_count >= auth.max_retry_count) {
      return res.status(400).json({ error: 'Max retry count exceeded' });
    }
    
    // 模拟重试扣费
    const deductSuccess = Math.random() > 0.3; // 70%成功率
    
    if (deductSuccess) {
      await client
        .from('pay_deduct_records')
        .update({
          status: 'success',
          retry_count: record.retry_count + 1,
          deducted_at: new Date().toISOString(),
          error_message: null,
        })
        .eq('id', recordId);
      
      await client
        .from('pay_auths')
        .update({
          retry_count: 0,
          last_deduct_time: new Date().toISOString(),
        })
        .eq('id', auth.id);
      
      res.json({
        success: true,
        message: 'Retry deduct successful',
        data: { recordId, status: 'success' },
      });
    } else {
      await client
        .from('pay_deduct_records')
        .update({
          retry_count: record.retry_count + 1,
          error_message: 'Retry deduct failed (simulated)',
        })
        .eq('id', recordId);
      
      await client
        .from('pay_auths')
        .update({
          retry_count: auth.retry_count + 1,
        })
        .eq('id', auth.id);
      
      res.json({
        success: false,
        message: 'Retry deduct failed',
        data: { recordId, status: 'failed', retryCount: record.retry_count + 1 },
      });
    }
  } catch (error) {
    console.error('Retry deduct error:', error);
    res.status(500).json({ error: 'Failed to retry deduct' });
  }
});

// ==================== 取消代扣授权 ====================

/**
 * 取消代扣授权
 * POST /api/v1/pay/auth/cancel/:authId
 */
router.post('/auth/cancel/:authId', async (req: Request, res: Response) => {
  try {
    const { authId } = req.params;
    
    const { data: auth, error: findError } = await client
      .from('pay_auths')
      .select('*')
      .eq('id', authId)
      .single();
    
    if (findError || !auth) {
      return res.status(404).json({ error: 'Authorization not found' });
    }
    
    if (auth.status !== 'active') {
      return res.status(400).json({ error: 'Authorization is not active' });
    }
    
    // 更新授权状态为已取消
    const { error } = await client
      .from('pay_auths')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', authId);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to cancel authorization' });
    }
    
    res.json({
      success: true,
      message: 'Authorization cancelled successfully',
      data: { authId, status: 'cancelled' },
    });
  } catch (error) {
    console.error('Cancel auth error:', error);
    res.status(500).json({ error: 'Failed to cancel authorization' });
  }
});

// ==================== 查询扣费记录 ====================

/**
 * 查询用户扣费记录
 * GET /api/v1/pay/deduct-records/:userId
 */
router.get('/deduct-records/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: records, error } = await client
      .from('pay_deduct_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to query deduct records' });
    }
    
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ error: 'Failed to query deduct records' });
  }
});

// ==================== 辅助函数 ====================

function calculateNextDeductTime(cycle: string): Date {
  const now = new Date();
  if (cycle === 'monthly') {
    // 下个月1号
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    return next;
  } else {
    // 明天
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    next.setHours(0, 0, 0, 0);
    return next;
  }
}

function validateCronExpression(expression: string): boolean {
  // 简单验证：检查是否有5或6个字段
  const parts = expression.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}

export default router;
