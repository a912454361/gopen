# 支付直连配置指南

## 一、概述

G open 采用**支付直连架构**，所有充值资金直接进入你的账户，平台完全不参与资金流转。

```
┌────────────────────────────────────────────────────────────────┐
│                      支付直连流程                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   用户 ──支付──▶ 微信/支付宝 ──回调──▶ 你的服务器              │
│                          │                                     │
│                          ▼                                     │
│                     你的银行账户                               │
│                     (资金100%归你)                             │
│                                                                │
│   ✗ G open 平台不参与任何资金流转                              │
│   ✗ G open 平台不收取任何手续费                                │
│   ✓ 所有收入100%归你所有                                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 二、微信支付配置

### 1. 申请微信支付商户号

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 注册并完成企业/个体工商户认证
3. 获取商户号 (mch_id)

### 2. 配置说明

```bash
# 在你的服务器 .env 文件中配置
# ===================
# 微信支付配置
# ===================
WECHAT_PAY_MCH_ID=你的商户号
WECHAT_PAY_API_KEY=你的API密钥
WECHAT_PAY_API_V3_KEY=你的APIv3密钥
WECHAT_PAY_SERIAL_NO=证书序列号
WECHAT_PAY_PRIVATE_KEY_PATH=/path/to/private_key.pem
WECHAT_PAY_NOTIFY_URL=https://你的域名/api/v1/pay/wechat/notify
```

### 3. 代码实现

```typescript
// server/src/routes/pay.ts
import { WechatPay } from '@/services/wechat-pay';

const wechatPay = new WechatPay({
  mchId: process.env.WECHAT_PAY_MCH_ID!,
  apiKey: process.env.WECHAT_PAY_API_KEY!,
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL!,
});

// 创建支付订单
router.post('/wechat/create', async (req, res) => {
  const { amount, description } = req.body;
  
  // 直接调用你的微信商户API
  const order = await wechatPay.createOrder({
    amount: amount * 100, // 单位：分
    description,
    openid: req.user.openid,
  });
  
  // 返回支付参数
  res.json({
    code: 0,
    data: order,
  });
});

// 支付回调 - 直接到你的账户
router.post('/wechat/notify', async (req, res) => {
  const result = await wechatPay.verifyNotify(req.body);
  
  if (result.success) {
    // 支付成功，更新用户余额
    // 资金已经在你的微信商户账户中
    await updateUserBalance(result.out_trade_no, result.total_fee);
  }
  
  res.json({ code: 'SUCCESS' });
});
```

---

## 三、支付宝配置

### 1. 申请支付宝应用

1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 创建应用并签约"当面付"或"手机网站支付"
3. 获取 AppID

### 2. 配置说明

```bash
# 在你的服务器 .env 文件中配置
# ===================
# 支付宝配置
# ===================
ALIPAY_APP_ID=你的应用ID
ALIPAY_PRIVATE_KEY=你的应用私钥
ALIPAY_PUBLIC_KEY=支付宝公钥
ALIPAY_NOTIFY_URL=https://你的域名/api/v1/pay/alipay/notify
ALIPAY_RETURN_URL=https://你的域名/pay/success
```

### 3. 代码实现

```typescript
// server/src/routes/pay.ts
import AlipaySdk from 'alipay-sdk';

const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID!,
  privateKey: process.env.ALIPAY_PRIVATE_KEY!,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY!,
});

// 创建支付订单
router.post('/alipay/create', async (req, res) => {
  const { amount, subject } = req.body;
  
  // 直接调用你的支付宝应用API
  const result = alipaySdk.exec('alipay.trade.page.pay', {
    notifyUrl: process.env.ALIPAY_NOTIFY_URL,
    returnUrl: process.env.ALIPAY_RETURN_URL,
    bizContent: {
      out_trade_no: generateOrderId(),
      total_amount: amount,
      subject,
    },
  });
  
  res.json({
    code: 0,
    data: result,
  });
});

// 支付回调 - 直接到你的账户
router.post('/alipay/notify', async (req, res) => {
  const result = alipaySdk.checkNotifySign(req.body);
  
  if (result && req.body.trade_status === 'TRADE_SUCCESS') {
    // 支付成功，更新用户余额
    // 资金已经在你的支付宝账户中
    await updateUserBalance(req.body.out_trade_no, req.body.total_amount);
  }
  
  res.send('success');
});
```

---

## 四、资金流向说明

### 微信支付资金流

```
用户微信钱包
     │
     │ 支付 ¥100
     ▼
微信支付清算系统
     │
     │ T+1 结算
     ▼
你的微信商户账户
     │
     │ 可提现
     ▼
你的银行卡

✗ G open 平台完全不参与
```

### 支付宝资金流

```
用户支付宝账户
     │
     │ 支付 ¥100
     ▼
支付宝清算系统
     │
     │ 实时到账
     ▼
你的支付宝账户

✗ G open 平台完全不参与
```

---

## 五、用户充值流程

```
┌─────────────────────────────────────────────────────────────┐
│                     充值流程                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 用户在你的App中点击"充值"                                │
│           │                                                 │
│           ▼                                                 │
│  2. 选择金额和支付方式                                       │
│           │                                                 │
│           ▼                                                 │
│  3. 你的服务器创建支付订单                                   │
│      (使用你的商户号/API密钥)                                │
│           │                                                 │
│           ▼                                                 │
│  4. 用户完成支付                                             │
│           │                                                 │
│           ▼                                                 │
│  5. 微信/支付宝回调你的服务器                                │
│           │                                                 │
│           ▼                                                 │
│  6. 你的服务器更新用户余额                                   │
│      (写入你的数据库)                                        │
│           │                                                 │
│           ▼                                                 │
│  7. 资金已到你的账户                                         │
│                                                             │
│  ✓ 全程在你掌控之中                                          │
│  ✓ G open 无法访问任何数据                                   │
│  ✓ G open 无法截获任何资金                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 六、安全建议

### 1. 支付安全

- 使用 HTTPS 加密所有支付请求
- 验证回调签名防止伪造
- 使用订单号防止重复处理
- 记录所有支付日志

### 2. 资金安全

- 定期对账确保数据一致
- 设置支付密码二次验证
- 大额支付人工审核
- 异常交易自动风控

### 3. 数据安全

- 数据库定期备份
- 敏感信息加密存储
- 访问日志完整记录
- 异常访问告警

---

## 七、常见问题

### Q: 平台会不会知道我的收入？
**A:** 不会。所有支付直接到你的账户，平台无法获取任何支付数据。

### Q: 平台会不会收取手续费？
**A:** 不会。你的收入100%归你，平台不收取任何费用。

### Q: 如果支付出问题怎么办？
**A:** 所有支付数据都在你的服务器和数据库中，你可以完全控制和排查。

### Q: 用户充值记录存在哪里？
**A:** 存在你的数据库中，你完全拥有和掌控这些数据。

---

**文档版本**: v1.0  
**最后更新**: 2024年
