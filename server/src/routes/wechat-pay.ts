/**
 * 微信支付路由
 * 
 * API列表：
 * POST /api/v1/wechat-pay/create     - 创建Native支付订单（返回code_url）
 * GET  /api/v1/wechat-pay/query      - 查询订单状态
 * POST /api/v1/wechat-pay/close      - 关闭订单
 * POST /api/v1/wechat-pay/refund     - 申请退款
 * POST /api/v1/wechat-pay/notify     - 支付回调（微信服务器调用）
 */

import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import {
  createNativeOrder,
  queryOrder,
  closeOrder,
  createRefund,
  verifyNotifySign,
  decryptNotifyData,
  generateSuccessResponse,
  generateFailResponse,
  generateOutTradeNo,
} from '../utils/wechat-pay.js';
import { isMockMode } from '../config/wechat-pay.js';

const router = express.Router();

// 内存订单存储（简化版，实际生产应使用数据库）
const ordersStore = new Map<string, any>();

// ==================== 创建Native支付订单 ====================

const createOrderSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(), // 金额（分）
  description: z.string().min(1).default('G Open会员服务'),
  productType: z.enum(['membership', 'super_member', 'recharge']).default('membership'),
  attach: z.string().optional(), // 附加数据
});

/**
 * 创建Native扫码支付订单
 * POST /api/v1/wechat-pay/create
 * 
 * 返回 code_url，前端使用 qrcode.js 生成二维码图片
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const body = createOrderSchema.parse(req.body);
    
    // 生成商户订单号
    const out_trade_no = generateOutTradeNo();
    
    // 创建订单过期时间（30分钟）
    const expiredAt = new Date(Date.now() + 30 * 60 * 1000);
    
    // 调用微信支付统一下单接口
    const orderResult = await createNativeOrder(
      out_trade_no,
      body.amount,
      body.description,
      JSON.stringify({ userId: body.userId, productType: body.productType })
    );
    
    if (!orderResult.success) {
      return res.status(400).json({
        success: false,
        error: orderResult.error || '创建订单失败',
      });
    }
    
    // 保存订单到数据库或内存
    const orderData = {
      id: crypto.randomUUID(),
      order_no: out_trade_no,
      user_id: body.userId,
      amount: body.amount,
      pay_type: 'wechat_native',
      product_type: body.productType,
      status: 'pending',
      expired_at: expiredAt.toISOString(),
      code_url: orderResult.code_url,
      prepay_id: orderResult.prepay_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // 使用内存存储
    ordersStore.set(out_trade_no, orderData);
    
    // 返回结果
    res.json({
      success: true,
      data: {
        out_trade_no,
        code_url: orderResult.code_url,  // 前端使用此链接生成二维码
        amount: body.amount,
        expired_at: expiredAt.toISOString(),
        description: body.description,
        is_mock: isMockMode(), // 标识是否为模拟模式
      },
    });
  } catch (error) {
    console.error('Create wechat pay order error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '参数错误', details: error.issues });
    }
    res.status(500).json({ error: '创建订单失败' });
  }
});

// ==================== 查询订单状态 ====================

const queryOrderSchema = z.object({
  out_trade_no: z.string().min(1),
});

/**
 * 查询订单状态
 * GET /api/v1/wechat-pay/query?out_trade_no=xxx
 */
router.get('/query', async (req: Request, res: Response) => {
  try {
    const { out_trade_no } = queryOrderSchema.parse({
      out_trade_no: req.query.out_trade_no,
    });
    
    // 先查询本地存储
    let localOrder: any = null;
    if (getClient()) {
      const { data, error: dbError } = await (getClient() as any)
        .from('pay_orders')
        .select('*')
        .eq('order_no', out_trade_no)
        .single();
      localOrder = data;
      if (dbError || !localOrder) {
        return res.status(404).json({ error: '订单不存在' });
      }
    } else {
      localOrder = ordersStore.get(out_trade_no);
      if (!localOrder) {
        return res.status(404).json({ error: '订单不存在' });
      }
    }
    
    // 如果订单已支付，直接返回本地状态
    if (localOrder.status === 'paid') {
      return res.json({
        success: true,
        data: {
          out_trade_no: localOrder.order_no,
          trade_state: 'SUCCESS',
          trade_state_desc: '支付成功',
          amount: localOrder.amount,
          paid_at: localOrder.paid_at,
          transaction_id: localOrder.transaction_id,
        },
      });
    }
    
    // 调用微信支付查询接口
    const queryResult = await queryOrder(out_trade_no);
    
    if (!queryResult.success) {
      return res.status(400).json({ error: queryResult.error || '查询失败' });
    }
    
    // 如果支付成功，更新本地订单状态
    if (queryResult.trade_state === 'SUCCESS' && localOrder.status === 'pending') {
      if (getClient()) {
        await (getClient() as any)
          .from('pay_orders')
          .update({
            status: 'paid',
            paid_at: queryResult.success_time || new Date().toISOString(),
            transaction_id: queryResult.transaction_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', localOrder.id);
      } else {
        localOrder.status = 'paid';
        localOrder.paid_at = queryResult.success_time || new Date().toISOString();
        localOrder.transaction_id = queryResult.transaction_id;
        ordersStore.set(out_trade_no, localOrder);
      }
    }
    
    res.json({
      success: true,
      data: queryResult,
    });
  } catch (error) {
    console.error('Query wechat pay order error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '参数错误' });
    }
    res.status(500).json({ error: '查询订单失败' });
  }
});

// ==================== 关闭订单 ====================

const closeOrderSchema = z.object({
  out_trade_no: z.string().min(1),
});

/**
 * 关闭订单
 * POST /api/v1/wechat-pay/close
 */
router.post('/close', async (req: Request, res: Response) => {
  try {
    const { out_trade_no } = closeOrderSchema.parse(req.body);
    
    // 关闭微信支付订单
    const closeResult = await closeOrder(out_trade_no);
    
    if (!closeResult.success) {
      return res.status(400).json({ error: closeResult.error || '关闭失败' });
    }
    
    // 更新本地订单状态
    if (getClient()) {
      await (getClient() as any)
        .from('pay_orders')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('order_no', out_trade_no);
    } else {
      const order = ordersStore.get(out_trade_no);
      if (order) {
        order.status = 'closed';
        ordersStore.set(out_trade_no, order);
      }
    }
    
    res.json({
      success: true,
      message: '订单已关闭',
    });
  } catch (error) {
    console.error('Close wechat pay order error:', error);
    res.status(500).json({ error: '关闭订单失败' });
  }
});

// ==================== 申请退款 ====================

const refundOrderSchema = z.object({
  out_trade_no: z.string().min(1),
  out_refund_no: z.string().min(1).optional(),
  total: z.number().int().positive(),
  refund: z.number().int().positive(),
  reason: z.string().optional(),
});

/**
 * 申请退款
 * POST /api/v1/wechat-pay/refund
 */
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const body = refundOrderSchema.parse(req.body);
    
    const out_refund_no = body.out_refund_no || `REFUND_${Date.now()}`;
    
    const refundResult = await createRefund(
      body.out_trade_no,
      out_refund_no,
      body.total,
      body.refund,
      body.reason
    );
    
    if (!refundResult.success) {
      return res.status(400).json({ error: refundResult.error || '退款失败' });
    }
    
    // 更新本地订单状态
    if (getClient()) {
      await (getClient() as any)
        .from('pay_orders')
        .update({
          status: 'refund',
          refund_id: refundResult.refund_id,
          refund_no: out_refund_no,
          updated_at: new Date().toISOString(),
        })
        .eq('order_no', body.out_trade_no);
    } else {
      const order = ordersStore.get(body.out_trade_no);
      if (order) {
        order.status = 'refund';
        order.refund_id = refundResult.refund_id;
        order.refund_no = out_refund_no;
        ordersStore.set(body.out_trade_no, order);
      }
    }
    
    res.json({
      success: true,
      data: {
        refund_id: refundResult.refund_id,
        out_refund_no,
      },
    });
  } catch (error) {
    console.error('Refund wechat pay order error:', error);
    res.status(500).json({ error: '申请退款失败' });
  }
});

// ==================== 支付回调通知 ====================

/**
 * 微信支付回调
 * POST /api/v1/wechat-pay/notify
 * 
 * 微信支付服务器会调用此接口通知支付结果
 */
router.post('/notify', async (req: Request, res: Response) => {
  try {
    console.log('[WechatPay] 收到支付回调:', req.body);
    
    // 获取签名信息
    const signature = req.headers['wechatpay-signature'] as string;
    const timestamp = req.headers['wechatpay-timestamp'] as string;
    const nonce = req.headers['wechatpay-nonce'] as string;
    const serial = req.headers['wechatpay-serial'] as string;
    
    // 验证签名
    const isValid = verifyNotifySign(
      timestamp,
      nonce,
      JSON.stringify(req.body),
      signature,
      serial
    );
    
    if (!isValid) {
      console.error('[WechatPay] 签名验证失败');
      return res.status(401).send(generateFailResponse('签名验证失败'));
    }
    
    // 解密回调数据
    const { resource } = req.body;
    if (!resource) {
      return res.status(400).send(generateFailResponse('缺少resource数据'));
    }
    
    const decryptedData = decryptNotifyData(
      resource.ciphertext,
      resource.associated_data || '',
      resource.nonce
    );
    
    if (!decryptedData) {
      return res.status(400).send(generateFailResponse('解密数据失败'));
    }
    
    console.log('[WechatPay] 解密后的支付数据:', decryptedData);
    
    const { out_trade_no, transaction_id, trade_state } = decryptedData;
    
    // 更新本地订单状态
    if (trade_state === 'SUCCESS') {
      if (getClient()) {
        const { error: updateError } = await (getClient() as any)
          .from('pay_orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            transaction_id,
            updated_at: new Date().toISOString(),
          })
          .eq('order_no', out_trade_no);
        
        if (updateError) {
          console.error('[WechatPay] 更新订单状态失败:', updateError);
          return res.status(500).send(generateFailResponse('更新订单状态失败'));
        }
      } else {
        const order = ordersStore.get(out_trade_no);
        if (order) {
          order.status = 'paid';
          order.paid_at = new Date().toISOString();
          order.transaction_id = transaction_id;
          ordersStore.set(out_trade_no, order);
        }
      }
      
      console.log('[WechatPay] 订单支付成功:', out_trade_no);
    }
    
    // 返回成功响应
    res.status(200).send(generateSuccessResponse());
  } catch (error) {
    console.error('[WechatPay] 处理支付回调失败:', error);
    res.status(500).send(generateFailResponse('处理失败'));
  }
});

// ==================== 获取支付配置状态 ====================

/**
 * 获取微信支付配置状态
 * GET /api/v1/wechat-pay/status
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      is_configured: !isMockMode(),
      is_mock: isMockMode(),
      message: isMockMode() 
        ? '微信支付未配置，使用模拟模式。请配置环境变量以启用真实支付。'
        : '微信支付已配置',
      required_env_vars: [
        'WECHAT_APPID',
        'WECHAT_MCHID',
        'WECHAT_SERIAL_NO',
        'WECHAT_PRIVATE_KEY',
        'WECHAT_API_V3_KEY',
      ],
    },
  });
});

export default router;
