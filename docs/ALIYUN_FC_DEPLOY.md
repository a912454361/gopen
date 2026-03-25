# 阿里云函数计算 FC 部署指南

## 部署架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  GitHub Pages   │     │  阿里云函数计算   │     │   Supabase      │
│   (前端 Web)    │────▶│   (后端 API)    │────▶│   (数据库)      │
│   免费托管       │     │   按量付费       │     │   免费额度       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
  用户访问 Web            API 请求处理
```

## 费用预估

| 项目 | 免费额度 | 超出后价格 |
|------|----------|-----------|
| 调用次数 | 100万次/月 | ¥0.0133/万次 |
| 执行时间 | 40万 CU/月 | ¥0.00011108/CU |
| 流量 | 1GB/月 | ¥0.50/GB |

**预计月费用**：小流量几乎免费，日活100用户约 ¥1-5/月

---

## 部署步骤

### 第一步：安装 Serverless Devs 工具

在本地电脑执行：

```bash
npm install -g @serverless-devs/s
```

---

### 第二步：配置阿里云密钥

```bash
s config add
```

按提示输入：
- AccountID：您的阿里云账号 ID（在控制台右上角查看）
- AccessKeyID：您的 AccessKey ID
- AccessKeySecret：您的 AccessKey Secret

---

### 第三步：克隆代码并部署

```bash
# 克隆代码
git clone https://github.com/a912454361/gopen.git
cd gopen/server

# 安装依赖
pnpm install

# 构建
pnpm run build

# 部署到阿里云 FC
s deploy
```

---

### 第四步：配置环境变量

部署完成后，在阿里云控制台设置环境变量：

1. 打开 https://fc.console.aliyun.com
2. 找到 `gopen-api` 函数
3. 点击「配置」→「环境变量」
4. 添加以下变量：

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=您的key
DATABASE_URL=postgresql://postgres:密码@db.xxx.supabase.co:5432/postgres
OSS_ACCESS_KEY_ID=您的oss_key
OSS_ACCESS_KEY_SECRET=您的oss_secret
OSS_BUCKET_PRIMARY=您的bucket
OSS_REGION=oss-cn-shanghai
OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
JWT_SECRET=随机32位字符串
STORAGE_ENCRYPTION_KEY=随机32位字符串
```

5. 点击「保存」→「发布版本」

---

### 第五步：获取 API 地址

部署成功后，控制台会显示：

```
https://gopen-api-xxx.cn-shanghai.fc.aliyuncs.com
```

---

### 第六步：更新前端配置

告诉我您的 FC 地址，我会更新前端连接。

---

## 常见问题

### Q: 部署失败？
检查：
1. AccessKey 是否正确
2. 是否有 FC 服务权限
3. 区域是否选择正确

### Q: 函数超时？
在控制台调大 `timeout` 值（默认60秒）

### Q: 内存不足？
在控制台调大 `memorySize`（默认512MB）

---

## 一键部署命令汇总

```bash
# 1. 安装工具
npm install -g @serverless-devs/s

# 2. 配置密钥
s config add

# 3. 克隆并部署
git clone https://github.com/a912454361/gopen.git
cd gopen/server
pnpm install
pnpm run build
s deploy

# 4. 在控制台配置环境变量
# 5. 获取 API 地址
```

---

## 安全提醒

⚠️ **不要在代码或聊天中暴露 AccessKey！**
- 使用环境变量存储敏感信息
- 定期轮换 AccessKey
- 使用 RAM 子账号，最小权限原则
