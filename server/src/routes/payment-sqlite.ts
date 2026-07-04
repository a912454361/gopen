/**
 * 支付路由 - SQLite 版本
 * 完全独立，不依赖任何第三方服务
 */

import { Router, type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 收款账户配置 ====================

// 您可以在这里修改收款账号
const PAYMENT_ACCOUNTS = {
  alipay: {
    name: '支付宝收款',
    account: '18321337942',
    qrcodeUrl: 'https://qr.alipay.com/18321337942',
    realName: '郭涛',
    desc: '请使用支付宝扫码支付',
    color: '#1677FF',
    icon: 'alipay',
  },
  wechat: {
    name: '微信收款',
    account: '18321337942',
    qrcodeUrl: '/api/v1/payment/wechat-qr',
    realName: '郭涛',
    desc: '请使用微信扫码支付',
    color: '#07C160',
    icon: 'weixin',
  },
  unionpay: {
    name: '银联收款',
    account: '6216600800003247932',
    qrcodeUrl: '',
    realName: '郭涛',
    desc: '请使用云闪付扫码支付',
    color: '#E60012',
    icon: 'credit-card',
  },
  bank: {
    name: '银行转账',
    account: '6216600800003247932',
    bankName: '中国银行',
    bankBranch: '上海市黄渡支行',
    qrcodeUrl: '',
    realName: '郭涛',
    desc: '请使用网银或柜台转账',
    color: '#C41230',
    icon: 'building-columns',
  },
};

/**
 * 将收款链接转换为可显示的二维码图片URL
 */
const getQRCodeImageUrl = (qrcodeUrl: string): string => {
  if (!qrcodeUrl) return '';
  
  // 本地API路由
  if (qrcodeUrl.startsWith('/api/')) {
    return qrcodeUrl;
  }
  
  // 已经是图片URL
  if (qrcodeUrl.match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/i)) {
    return qrcodeUrl;
  }
  
  // 使用第三方服务生成二维码
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrcodeUrl)}`;
};

// ==================== 获取收款账户信息 ====================

/**
 * 获取收款账户信息
 * GET /api/v1/payment/accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const accounts = {
      alipay: {
        name: PAYMENT_ACCOUNTS.alipay.name,
        account: PAYMENT_ACCOUNTS.alipay.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.alipay.qrcodeUrl),
        realName: PAYMENT_ACCOUNTS.alipay.realName,
        desc: PAYMENT_ACCOUNTS.alipay.desc,
      },
      wechat: {
        name: PAYMENT_ACCOUNTS.wechat.name,
        account: PAYMENT_ACCOUNTS.wechat.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.wechat.qrcodeUrl),
        realName: PAYMENT_ACCOUNTS.wechat.realName,
        desc: PAYMENT_ACCOUNTS.wechat.desc,
      },
      unionpay: {
        name: PAYMENT_ACCOUNTS.unionpay.name,
        account: PAYMENT_ACCOUNTS.unionpay.account,
        qrcodeUrl: getQRCodeImageUrl(PAYMENT_ACCOUNTS.unionpay.qrcodeUrl),
        realName: PAYMENT_ACCOUNTS.unionpay.realName,
        desc: PAYMENT_ACCOUNTS.unionpay.desc,
      },
      bank: {
        name: PAYMENT_ACCOUNTS.bank.name,
        account: PAYMENT_ACCOUNTS.bank.account,
        bankName: PAYMENT_ACCOUNTS.bank.bankName,
        bankBranch: PAYMENT_ACCOUNTS.bank.bankBranch,
        realName: PAYMENT_ACCOUNTS.bank.realName,
        desc: PAYMENT_ACCOUNTS.bank.desc,
      },
    };

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: '获取收款账户失败' });
  }
});

// ==================== 微信收款码图片 ====================

/**
 * 获取微信收款码图片
 * GET /api/v1/payment/wechat-qr
 */
router.get('/wechat-qr', async (req: Request, res: Response) => {
  try {
    const imagePath = path.join(__dirname, '../../public/images/wechat-pay-qr.png');
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Get wechat QR error:', error);
    res.status(500).json({ error: '获取微信收款码失败' });
  }
});

export default router;
