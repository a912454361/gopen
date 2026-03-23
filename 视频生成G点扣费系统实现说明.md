# 视频生成G点扣费系统实现说明

## 📋 功能概述

实现了视频生成的G点扣费系统，支持：
- **G点充值**：1元 = 100G点
- **视频生成定价**：1秒 = 1G点
  - 30秒视频 = 30G点
  - 2分钟视频 = 120G点
  - 5分钟视频 = 300G点（最高）
- **平台服务费**：平台仅收取G点服务费，token费用由用户直接支付给厂商

---

## 🗄️ 数据库变更

### 1. user_balances表新增字段
```sql
ALTER TABLE user_balances ADD COLUMN g_points INTEGER DEFAULT 0;
```

### 2. 创建G点记录表
```sql
CREATE TABLE g_point_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('recharge', 'consume', 'refund')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  related_type VARCHAR(50),
  related_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔌 后端API

### 1. 获取G点余额
```
GET /api/v1/billing/g-points/:userId
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "gPoints": 1000
  }
}
```

### 2. G点充值
```
POST /api/v1/billing/g-points/recharge
```

**请求体**：
```json
{
  "userId": "user123",
  "amount": 10
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "rechargeAmount": 10,
    "gPointsReceived": 1000,
    "balanceBefore": 0,
    "balanceAfter": 1000,
    "message": "充值成功，获得1000G点"
  }
}
```

### 3. G点扣费
```
POST /api/v1/billing/g-points/deduct
```

**请求体**：
```json
{
  "userId": "user123",
  "gPoints": 30,
  "description": "生成30秒视频",
  "relatedType": "video_generation"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "deducted": true,
    "gPointsDeducted": 30,
    "balanceBefore": 1000,
    "balanceAfter": 970,
    "message": "成功扣除30G点"
  }
}
```

### 4. 获取G点消费记录
```
GET /api/v1/billing/g-points/records/:userId?page=1&limit=20&type=consume
```

---

## 📱 前端功能

### 1. 视频生成页面（client/screens/create/index.tsx）

#### 新增功能：
- ✅ 视频时长选择器（30秒、2分钟、5分钟）
- ✅ G点价格实时显示
- ✅ G点余额显示
- ✅ G点不足提醒
- ✅ G点充值入口

#### UI效果：
```
┌─────────────────────────────────┐
│  选择时长                        │
│  ┌─────┬─────┬─────┐            │
│  │30秒 │2分钟│5分钟│  💰 1000 G点│
│  │30G  │120G │300G │            │
│  └─────┴─────┴─────┘            │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  ⚠️ G点不足，点击充值            │
└─────────────────────────────────┘
```

### 2. G点充值模态框

#### 充值选项：
- 充值 10元 → 获得 1000 G点
- 充值 50元 → 获得 5000 G点
- 充值 100元 → 获得 10000 G点
- 充值 200元 → 获得 20000 G点
- 充值 500元 → 获得 50000 G点

#### 费用说明：
```
• 视频生成：1秒 = 1G点
• 30秒视频 = 30G点
• 2分钟视频 = 120G点
• 5分钟视频 = 300G点
• 平台仅收取服务费，token费用另计
```

---

## 🎯 业务流程

### 视频生成流程：
```
1. 用户选择视频时长（30秒/2分钟/5分钟）
2. 系统计算所需G点
3. 检查用户G点余额
   - 余额不足 → 提示充值
   - 余额充足 → 继续
4. 扣除G点
5. 调用视频生成API
6. 返回生成结果
   - 成功 → 显示视频
   - 失败 → 退还G点
```

### G点充值流程：
```
1. 用户选择充值金额
2. 调用充值API
3. 更新用户G点余额
4. 记录充值记录
5. 显示充值成功提示
```

---

## 💡 设计要点

### 1. 双重收费模式
- **平台服务费**：通过G点收取（1秒1G点）
- **Token费用**：用户直接支付给AI厂商

### 2. 余额检查
- 生成前检查余额，避免扣费后无法生成
- 余额不足时提供充值入口

### 3. 异常处理
- 视频生成失败自动退还G点
- 记录所有G点交易，支持追溯

### 4. 用户体验
- 实时显示G点余额
- 清晰的价格标注
- 一键充值入口

---

## 📊 数据统计

### 可查询数据：
- 用户G点余额
- G点充值记录
- G点消费记录
- G点退款记录

### 统计维度：
- 按时间范围
- 按交易类型
- 按用户

---

## 🔒 安全措施

1. **余额检查**：扣费前检查余额，避免负数
2. **事务记录**：记录每次交易的前后余额
3. **自动退款**：服务失败自动退还G点
4. **权限验证**：需要userId验证

---

## 📝 后续优化建议

1. **批量充值优惠**：大额充值提供额外G点奖励
2. **会员特权**：会员享受G点折扣
3. **G点赠送**：新用户注册赠送G点
4. **活动奖励**：签到、邀请等获得G点
5. **G点商城**：其他功能也支持G点消费

---

## ✅ 已实现功能清单

- [x] 数据库：添加G点字段到user_balances表
- [x] 数据库：创建g_point_records表
- [x] 后端：G点余额查询API
- [x] 后端：G点充值API
- [x] 后端：G点扣费API
- [x] 后端：G点消费记录查询API
- [x] 前端：视频时长选择器
- [x] 前端：G点价格显示
- [x] 前端：G点余额显示
- [x] 前端：G点充值模态框
- [x] 前端：G点不足提醒
- [x] 前端：视频生成G点扣费逻辑
- [x] 测试：ESLint检查通过
- [x] 测试：TypeScript编译通过

---

## 🚀 部署步骤

1. 执行数据库迁移（已自动执行）
2. 重启后端服务
3. 前端热更新生效
4. 测试充值和扣费功能

---

**实现时间**：2025-01-15
**开发者**：AI助手
**版本**：v1.0.0
