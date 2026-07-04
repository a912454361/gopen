# 万古长夜 - 独立服务器部署指南

## 概述

万古长夜是一个完全独立的国风粒子卡牌游戏平台，无需依赖任何第三方服务。

- **数据库**: SQLite (本地文件存储)
- **服务器端口**: 18789
- **访问地址**: http://127.0.0.1:18789

## 快速启动

### 1. 安装依赖

```bash
cd server
pnpm install
```

### 2. 启动服务器

```bash
# 开发模式
pnpm run independent

# 或者使用启动脚本
bash ../start-independent.sh
```

### 3. 验证服务

```bash
# 健康检查
curl http://127.0.0.1:18789/api/v1/health
```

## 前端配置

前端已经配置为连接本地服务器：

```env
# client/.env
EXPO_PUBLIC_BACKEND_BASE_URL=http://127.0.0.1:18789
```

## API 接口

### 认证相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/oauth/callback` | POST | OAuth登录回调 |
| `/api/v1/oauth/bindings/:userId` | GET | 获取用户绑定列表 |
| `/api/v1/oauth/bind` | POST | 绑定第三方账号 |
| `/api/v1/oauth/unbind` | POST | 解绑第三方账号 |
| `/api/v1/oauth/verify` | POST | 验证会话token |
| `/api/v1/oauth/logout` | POST | 登出 |

### 充值相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/recharge/submit` | POST | 提交充值申请 |
| `/api/v1/recharge/records/:userId` | GET | 获取充值记录 |
| `/api/v1/recharge/admin/pending` | GET | 获取待审核充值 (管理员) |
| `/api/v1/recharge/admin/approve` | POST | 审核通过 (管理员) |
| `/api/v1/recharge/admin/reject` | POST | 审核拒绝 (管理员) |

### 支付相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/payment/accounts` | GET | 获取收款账户列表 |
| `/api/v1/payment/accounts` | POST | 创建收款账户 (管理员) |

### 用户相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/user/balance/:userId` | GET | 获取用户余额 |
| `/api/v1/user/info/:userId` | GET | 获取用户信息 |

## 数据存储

所有数据存储在 `server/data/wangu.db` SQLite数据库文件中。

### 数据表结构

- `users` - 用户表
- `oauth_bindings` - OAuth绑定表
- `user_balances` - 用户余额表
- `recharge_records` - 充值记录表
- `sessions` - 会话表
- `game_items` - 游戏道具表
- `cards` - 卡牌表
- `user_cards` - 用户卡牌收藏表
- `user_inventory` - 用户背包表

## 管理员密钥

默认管理员密钥: `WanguAdmin2024SecretKey`

在调用管理员接口时，需要在请求头中添加:

```
x-admin-key: WanguAdmin2024SecretKey
```

## 测试示例

### OAuth 登录

```bash
curl -X POST http://127.0.0.1:18789/api/v1/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"platform":"github","code":"test-code"}'
```

### 获取用户余额

```bash
curl http://127.0.0.1:18789/api/v1/user/balance/{userId}
```

### 提交充值

```bash
curl -X POST http://127.0.0.1:18789/api/v1/recharge/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "amount": 10000,
    "rechargeType": "balance",
    "payMethod": "alipay",
    "transactionId": "tx-123456"
  }'
```

## 注意事项

1. **完全独立**: 不依赖任何第三方服务（无Supabase、无阿里云OSS）
2. **本地数据**: 所有数据存储在本地SQLite文件中
3. **端口固定**: 服务器运行在18789端口
4. **备份数据**: 定期备份 `server/data/wangu.db` 文件
