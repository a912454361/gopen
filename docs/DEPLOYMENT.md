# G open 智能创作助手 - 免费部署指南

## 部署架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Render/Railway│     │   Supabase      │
│   (前端 Web)     │────▶│   (后端 API)    │────▶│   (数据库)      │
│   免费托管       │     │   免费托管       │     │   免费额度       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
  用户访问 Web            API 请求处理
```

## 部署成本：$0/月

| 服务 | 平台 | 费用 |
|------|------|------|
| 前端 Web | Vercel | 免费 |
| 后端 API | Render | 免费 |
| 数据库 | Supabase | 免费 |
| 对象存储 | 阿里云 OSS | 按量付费（小额） |

---

## 第一步：部署后端到 Render

### 1.1 注册 Render
访问 https://render.com 注册账号（可用 GitHub 登录）

### 1.2 创建 Web Service
1. 点击 **New** → **Web Service**
2. 连接 GitHub 仓库 `a912454361/gopen`
3. 配置如下：

| 配置项 | 值 |
|--------|-----|
| Name | gopen-api |
| Runtime | Node |
| Build Command | `cd server && pnpm install && pnpm run build` |
| Start Command | `cd server && node dist/index.js` |
| Region | Singapore |

### 1.3 设置环境变量
在 **Environment** 标签添加：

```bash
# 必填
NODE_ENV=production
SUPABASE_URL=你的supabase地址
SUPABASE_ANON_KEY=你的supabase_key
DATABASE_URL=你的数据库连接字符串

# OSS 配置（如需文件存储）
OSS_ACCESS_KEY_ID=你的oss_key
OSS_ACCESS_KEY_SECRET=你的oss_secret
OSS_BUCKET_PRIMARY=你的bucket名

# 安全配置（可自动生成）
JWT_SECRET=随机32位字符串
STORAGE_ENCRYPTION_KEY=随机32位字符串
```

### 1.4 部署
点击 **Create Web Service**，等待构建完成。

部署成功后，API 地址为：`https://gopen-api.onrender.com`

---

## 第二步：部署前端到 Vercel

### 2.1 注册 Vercel
访问 https://vercel.com 注册账号（用 GitHub 登录）

### 2.2 导入项目
1. 点击 **New Project**
2. 导入 GitHub 仓库 `a912454361/gopen`
3. 配置如下：

| 配置项 | 值 |
|--------|-----|
| Framework Preset | Other |
| Root Directory | client |
| Build Command | `npx expo export --platform web --output-dir dist` |
| Output Directory | dist |

### 2.3 设置环境变量
添加环境变量：
```
EXPO_PUBLIC_BACKEND_BASE_URL=https://gopen-api.onrender.com
```

### 2.4 部署
点击 **Deploy**，等待构建完成。

部署成功后，Web 地址为：`https://gopen.vercel.app`

---

## 第三步：配置 CORS

在后端 Render 的环境变量中添加：
```
CORS_ORIGIN=https://gopen.vercel.app
```

重启后端服务使配置生效。

---

## 备选方案：Railway 部署后端

如果 Render 无法使用，可以用 Railway：

### 1. 注册 Railway
访问 https://railway.app 注册账号

### 2. 部署
1. 点击 **New Project** → **Deploy from GitHub repo**
2. 选择 `a912454361/gopen`
3. 设置 Root Directory 为 `server`
4. 添加环境变量（同 Render）

---

## 免费额度限制

### Render 免费计划
- 750 小时/月运行时间
- 512MB 内存
- 服务会在 15 分钟无请求后休眠
- 首次请求可能需要 30 秒唤醒

### Vercel 免费计划
- 100GB 带宽/月
- 无限次部署
- 自动 HTTPS

### Supabase 免费计划
- 500MB 数据库
- 1GB 文件存储
- 50GB 带宽/月

---

## 部署验证

### 1. 测试后端 API
```bash
curl https://gopen-api.onrender.com/api/v1/health
# 应返回: {"status":"ok"}
```

### 2. 访问前端
```
https://gopen.vercel.app
```

---

## 自定义域名（可选）

### Vercel 添加域名
1. 项目设置 → Domains
2. 添加你的域名
3. 按提示配置 DNS

### Render 添加域名
1. 项目设置 → Custom Domains
2. 添加你的域名
3. 配置 DNS CNAME 指向 `gopen-api.onrender.com`

---

## 常见问题

### Q: 后端启动失败？
检查环境变量是否完整，特别是 `SUPABASE_URL` 和 `DATABASE_URL`

### Q: 前端无法连接后端？
1. 检查 `EXPO_PUBLIC_BACKEND_BASE_URL` 是否正确
2. 检查后端 `CORS_ORIGIN` 是否包含前端域名
3. 后端可能处于休眠状态，首次请求需要等待

### Q: 构建超时？
免费计划构建时间有限制，可以：
1. 简化依赖
2. 使用预构建镜像
3. 升级付费计划

---

## 下一步

部署完成后，你可以：
1. 配置自定义域名
2. 设置支付宝/微信支付
3. 发布 APP 到应用商店
