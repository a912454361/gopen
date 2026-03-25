# G open 上线赚钱 - 必须完成清单

## 当前状态

| 项目 | 状态 | 说明 |
|------|------|------|
| 前端 | ✅ 已上线 | https://a912454361.github.io/gopen/ |
| 后端 | ❌ 未部署 | 需要您手动部署 |
| 支付 | ✅ 已配置 | 支付宝/微信收款码 |
| 数据库 | ✅ 正常 | Supabase |

---

## 必须完成（缺一不可）

### 1️⃣ 部署后端（您必须自己做）

**最简单方案：阿里云函数计算**

```bash
# 在您的电脑上执行：
npm install -g @serverless-devs/s
s config add  # 输入阿里云密钥

git clone https://github.com/a912454361/gopen.git
cd gopen/server
pnpm install
pnpm run build
s deploy
```

### 2️⃣ 配置环境变量

在阿里云 FC 控制台添加：

```
SUPABASE_URL=你的supabase地址
SUPABASE_ANON_KEY=你的key
DATABASE_URL=你的数据库连接
```

### 3️⃣ 告诉我 API 地址

部署完成后，把 API 地址发给我，我更新前端。

---

## 收钱流程

用户付款流程（已实现）：

```
用户选择会员 → 扫码支付 → 填写流水号 → 您审核通过 → 会员激活
```

**您的收款信息**（已配置）：
- 支付宝：18321337942（郭涛）
- 微信：a912454361（郭涛）
- 银行卡：6216600800003247932（中国银行）

---

## 预计费用

| 项目 | 费用 |
|------|------|
| 前端托管 | 免费（GitHub Pages） |
| 后端 FC | 几乎免费（按量付费） |
| 数据库 | 免费（Supabase 免费额度） |
| **总计** | **¥0/月** |

---

## 收费标准建议

| 会员类型 | 价格 | 说明 |
|----------|------|------|
| 月度会员 | ¥29/月 | 基础功能 |
| 季度会员 | ¥69/季 | 8折 |
| 年度会员 | ¥199/年 | 6折 |
| 永久会员 | ¥399 | 一次付费 |

---

## 快速检查清单

- [ ] 安装 Node.js（https://nodejs.org）
- [ ] 安装 pnpm（`npm install -g pnpm`）
- [ ] 安装 Serverless Devs（`npm install -g @serverless-devs/s`）
- [ ] 配置阿里云密钥（`s config add`）
- [ ] 克隆代码并部署（`git clone` + `s deploy`）
- [ ] 配置环境变量
- [ ] 获取 API 地址
- [ ] 告诉我更新前端

---

## 联系方式

完成部署后，把 API 地址发给我，我会立即更新前端配置。
