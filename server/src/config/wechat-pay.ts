/**
 * 微信支付配置
 * 
 * 使用前请配置以下环境变量或直接修改配置：
 * - WECHAT_APPID: 微信公众号/小程序AppID
 * - WECHAT_MCHID: 微信支付商户号
 * - WECHAT_SERIAL_NO: 商户API证书序列号
 * - WECHAT_PRIVATE_KEY: 商户私钥（PEM格式，建议使用环境变量）
 * - WECHAT_API_V3_KEY: APIv3密钥
 */

export interface WechatPayConfig {
  appid: string;           // 微信AppID
  mchid: string;           // 商户号
  serial_no: string;       // 证书序列号
  privateKey: string;      // 商户私钥
  apiV3Key: string;        // APIv3密钥
  notify_url: string;      // 支付回调地址
}

// 从环境变量读取配置
export const getWechatPayConfig = (): WechatPayConfig | null => {
  const appid = process.env.WECHAT_APPID || '';
  const mchid = process.env.WECHAT_MCHID || '';
  const serial_no = process.env.WECHAT_SERIAL_NO || '';
  const privateKey = process.env.WECHAT_PRIVATE_KEY || '';
  const apiV3Key = process.env.WECHAT_API_V3_KEY || '';
  
  // 检查是否配置了完整的微信支付信息
  if (!appid || !mchid || !serial_no || !privateKey || !apiV3Key) {
    console.log('[WechatPay] 未配置完整的微信支付信息，将使用模拟模式');
    return null;
  }
  
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
  
  return {
    appid,
    mchid,
    serial_no,
    privateKey: privateKey.replace(/\\n/g, '\n'), // 处理换行符
    apiV3Key,
    notify_url: `${backendUrl}/api/v1/wechat-pay/notify`,
  };
};

// 检查是否为模拟模式
export const isMockMode = (): boolean => {
  return getWechatPayConfig() === null;
};
