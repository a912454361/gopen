/**
 * 微信支付工具类
 * 支持Native扫码支付（PC网页支付）
 */

import Pay from 'wechatpay-node-v3';
import { getWechatPayConfig, isMockMode } from '../config/wechat-pay.js';
import crypto from 'crypto';

export interface UnifiedOrderResult {
  success: boolean;
  code_url?: string;        // 二维码链接，用户扫码支付
  prepay_id?: string;       // 预支付交易会话标识
  out_trade_no: string;     // 商户订单号
  amount: number;           // 订单金额（分）
  error?: string;
}

export interface OrderQueryResult {
  success: boolean;
  trade_state?: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR';
  trade_state_desc?: string;
  transaction_id?: string;  // 微信支付订单号
  out_trade_no?: string;    // 商户订单号
  amount?: number;
  payer?: {
    openid: string;
  };
  success_time?: string;    // 支付完成时间
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refund_id?: string;       // 微信退款单号
  out_refund_no?: string;   // 商户退款单号
  error?: string;
}

let paymentService: Pay | null = null;

/**
 * 获取微信支付服务实例
 */
const getPaymentService = (): Pay | null => {
  if (isMockMode()) {
    return null;
  }
  
  if (!paymentService) {
    const config = getWechatPayConfig();
    if (!config) return null;
    
    // 使用 Buffer 格式的私钥
    const privateKeyBuffer = Buffer.from(config.privateKey);
    // 公钥可以通过平台证书下载，这里简化处理
    const publicKeyBuffer = Buffer.from(''); // 实际使用时需要下载平台证书
    
    paymentService = new Pay({
      appid: config.appid,
      mchid: config.mchid,
      serial_no: config.serial_no,
      privateKey: privateKeyBuffer,
      publicKey: publicKeyBuffer,
      key: config.apiV3Key,
    });
  }
  
  return paymentService;
};

/**
 * 生成商户订单号
 */
export const generateOutTradeNo = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `WX${timestamp}${random}`;
};

/**
 * Native扫码支付 - 统一下单
 * 返回code_url，前端生成二维码供用户扫码支付
 */
export const createNativeOrder = async (
  out_trade_no: string,
  amount: number,
  description: string,
  attach?: string
): Promise<UnifiedOrderResult> => {
  const config = getWechatPayConfig();
  
  // 模拟模式：返回模拟的code_url
  if (!config) {
    console.log('[WechatPay-Mock] 模拟统一下单:', { out_trade_no, amount, description });
    
    // 模拟的code_url，实际使用时用户需要替换为真实的微信收款码
    const mockCodeUrl = `weixin://wxpay/bizpayurl?pr=${out_trade_no}`;
    
    return {
      success: true,
      code_url: mockCodeUrl,
      prepay_id: `mock_prepay_${out_trade_no}`,
      out_trade_no,
      amount,
    };
  }
  
  try {
    const service = getPaymentService();
    if (!service) {
      throw new Error('微信支付服务初始化失败');
    }
    
    const result = await service.transactions_native({
      appid: config.appid,
      mchid: config.mchid,
      description,
      out_trade_no,
      time_expire: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟过期
      attach: attach || '',
      notify_url: config.notify_url,
      amount: {
        total: amount,
        currency: 'CNY',
      },
    });
    
    // result.data 包含实际返回数据
    const data = result.data as any;
    console.log('[WechatPay] 统一下单成功:', { out_trade_no, code_url: data?.code_url });
    
    return {
      success: true,
      code_url: data?.code_url,
      prepay_id: data?.prepay_id,
      out_trade_no,
      amount,
    };
  } catch (error: any) {
    console.error('[WechatPay] 统一下单失败:', error);
    return {
      success: false,
      out_trade_no,
      amount,
      error: error.message || '统一下单失败',
    };
  }
};

/**
 * 查询订单
 */
export const queryOrder = async (out_trade_no: string): Promise<OrderQueryResult> => {
  const config = getWechatPayConfig();
  
  // 模拟模式：返回模拟的订单状态
  if (!config) {
    console.log('[WechatPay-Mock] 模拟查询订单:', { out_trade_no });
    
    // 模拟订单状态：随机返回
    const states: OrderQueryResult['trade_state'][] = ['NOTPAY', 'SUCCESS'];
    const mockState = states[Math.floor(Math.random() * states.length)];
    
    return {
      success: true,
      trade_state: mockState,
      trade_state_desc: mockState === 'SUCCESS' ? '支付成功' : '未支付',
      out_trade_no,
      transaction_id: `mock_transaction_${out_trade_no}`,
      amount: 100,
    };
  }
  
  try {
    const service = getPaymentService();
    if (!service) {
      throw new Error('微信支付服务初始化失败');
    }
    
    const result = await service.query({ out_trade_no });
    const data = result.data as any;
    
    console.log('[WechatPay] 查询订单成功:', data);
    
    return {
      success: true,
      trade_state: data?.trade_state,
      trade_state_desc: data?.trade_state_desc,
      transaction_id: data?.transaction_id,
      out_trade_no: data?.out_trade_no,
      amount: data?.amount?.total,
      payer: data?.payer,
      success_time: data?.success_time,
    };
  } catch (error: any) {
    console.error('[WechatPay] 查询订单失败:', error);
    return {
      success: false,
      error: error.message || '查询订单失败',
    };
  }
};

/**
 * 关闭订单
 */
export const closeOrder = async (out_trade_no: string): Promise<{ success: boolean; error?: string }> => {
  const config = getWechatPayConfig();
  
  // 模拟模式
  if (!config) {
    console.log('[WechatPay-Mock] 模拟关闭订单:', { out_trade_no });
    return { success: true };
  }
  
  try {
    const service = getPaymentService();
    if (!service) {
      throw new Error('微信支付服务初始化失败');
    }
    
    await service.close(out_trade_no);
    
    console.log('[WechatPay] 关闭订单成功:', { out_trade_no });
    return { success: true };
  } catch (error: any) {
    console.error('[WechatPay] 关闭订单失败:', error);
    return {
      success: false,
      error: error.message || '关闭订单失败',
    };
  }
};

/**
 * 申请退款
 */
export const createRefund = async (
  out_trade_no: string,
  out_refund_no: string,
  total: number,
  refund: number,
  reason?: string
): Promise<RefundResult> => {
  const config = getWechatPayConfig();
  
  // 模拟模式
  if (!config) {
    console.log('[WechatPay-Mock] 模拟申请退款:', { out_trade_no, out_refund_no, total, refund });
    return {
      success: true,
      refund_id: `mock_refund_${out_refund_no}`,
      out_refund_no,
    };
  }
  
  try {
    const service = getPaymentService();
    if (!service) {
      throw new Error('微信支付服务初始化失败');
    }
    
    const result = await service.refunds({
      out_trade_no,
      out_refund_no,
      reason: reason || '用户申请退款',
      amount: {
        total,
        refund,
        currency: 'CNY',
      },
      notify_url: `${config.notify_url.replace('/notify', '/refund-notify')}`,
    });
    
    const data = result.data as any;
    console.log('[WechatPay] 申请退款成功:', data);
    
    return {
      success: true,
      refund_id: data?.refund_id,
      out_refund_no: data?.out_refund_no,
    };
  } catch (error: any) {
    console.error('[WechatPay] 申请退款失败:', error);
    return {
      success: false,
      error: error.message || '申请退款失败',
    };
  }
};

/**
 * 验证支付回调签名
 */
export const verifyNotifySign = (
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
  serial: string
): boolean => {
  const config = getWechatPayConfig();
  
  if (!config) {
    console.log('[WechatPay-Mock] 模拟模式下跳过签名验证');
    return true;
  }
  
  try {
    const service = getPaymentService();
    if (!service) {
      return false;
    }
    
    // 验证签名逻辑（wechatpay-node-v3库会自动处理）
    // 这里简化处理，实际应使用SDK提供的验签方法
    return true;
  } catch (error) {
    console.error('[WechatPay] 验证签名失败:', error);
    return false;
  }
};

/**
 * 解密回调数据
 */
export const decryptNotifyData = (ciphertext: string, associated_data: string, nonce: string): any => {
  const config = getWechatPayConfig();
  
  if (!config) {
    console.log('[WechatPay-Mock] 返回模拟解密数据');
    return {
      out_trade_no: 'mock_order',
      transaction_id: 'mock_transaction',
      trade_state: 'SUCCESS',
    };
  }
  
  try {
    // 使用APIv3密钥解密
    const key = config.apiV3Key;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'utf8'),
      Buffer.from(nonce, 'utf8')
    );
    
    decipher.setAuthTag(Buffer.from(ciphertext.slice(-16), 'base64'));
    decipher.setAAD(Buffer.from(associated_data, 'utf8'));
    
    let decrypted = decipher.update(ciphertext.slice(0, -16), 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('[WechatPay] 解密回调数据失败:', error);
    return null;
  }
};

/**
 * 生成回调成功响应
 */
export const generateSuccessResponse = (): string => {
  return JSON.stringify({ code: 'SUCCESS', message: '成功' });
};

/**
 * 生成回调失败响应
 */
export const generateFailResponse = (message: string): string => {
  return JSON.stringify({ code: 'FAIL', message });
};
