# 🚀 G open 部署指南

## 当前状态

| 组件 | 状态 | 产物 |
|------|------|------|
| 前端构建 | ✅ 完成 | `client/dist/` (11MB) |
| 后端构建 | ✅ 完成 | `server/dist/` (544KB) |
| 模型数据 | ✅ 就绪 | 122个模型已同步 |

---

## 方式一：命令行部署（最快）

### Netlify 部署
```bash
# 1. 安装 CLI（如果未安装）
npm install -g netlify-cli

# 2. 登录 Netlify
netlify login

# 3. 进入前端目录
cd /workspace/projects/client

# 4. 部署（创建新站点）
netlify deploy --prod --dir=dist --create-site

# 或部署到已有站点
netlify deploy --prod --dir=dist --site=your-site-id
```

### Vercel 部署
```bash
# 1. 安装 CLI（如果未安装）
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 进入前端目录
cd /workspace/projects/client

# 4. 部署
vercel --prod
```

---

## 方式二：GitHub 自动部署

### 步骤 1: 推送代码到 GitHub
```bash
cd /workspace/projects
git add .
git commit -m "feat: G open v1.0.0 ready for deployment"
git push origin main
```

### 步骤 2: 配置 GitHub Secrets
在 GitHub 仓库设置中添加：

| Secret | 说明 | 获取方式 |
|--------|------|----------|
| `NETLIFY_AUTH_TOKEN` | Netlify 个人访问令牌 | https://app.netlify.com/user/applications#personal-access-tokens |
| `NETLIFY_SITE_ID` | Netlify 站点 ID | 站点设置 > General > Site details |

### 步骤 3: 自动触发部署
推送代码后，GitHub Actions 会自动构建并部署到 Netlify。

---

## 方式三：网页控制台部署

### Netlify Dashboard
1. 访问 https://app.netlify.com
2. 点击 "Add new site" > "Deploy manually"
3. 拖拽 `client/dist` 文件夹
4. 等待部署完成

### Vercel Dashboard
1. 访问 https://vercel.com/new
2. 拖拽 `client/dist` 文件夹
3. 或连接 GitHub 仓库自动部署

---

## 部署后验证

```bash
# 健康检查
curl https://your-domain.com/api/v1/health

# 模型列表
curl https://your-domain.com/api/v1/models?limit=5
```

---

## 后端部署（可选）

如果需要部署后端服务：

### 方案 A: Railway
```bash
railway login
railway init
railway up
```

### 方案 B: Render
1. 访问 https://dashboard.render.com
2. 创建 Web Service
3. 连接 GitHub 仓库
4. 设置启动命令: `cd server && pnpm run start`

### 方案 C: 自有服务器
```bash
# 上传文件
scp -r server/dist user@server:/app/gopen/
scp server/package.json user@server:/app/gopen/server/

# 服务器启动
cd /app/gopen/server
pnpm install --prod
PORT=5000 pnpm run start
```

---

## 环境变量（生产环境）

| 变量 | 值 | 说明 |
|------|-----|------|
| NODE_ENV | production | 运行环境 |
| PORT | 5000 | 服务端口 |

> 注意：Supabase 连接信息已在代码中配置

---

## 预计部署时间

| 平台 | 时间 |
|------|------|
| Netlify CLI | ~2分钟 |
| Vercel CLI | ~2分钟 |
| GitHub Actions | ~5分钟 |
| Dashboard 手动 | ~1分钟 |

---

**推荐方案**: 使用 Netlify CLI 部署（最快最稳定）

```bash
# 一键部署命令
npm install -g netlify-cli && netlify login && cd /workspace/projects/client && netlify deploy --prod --dir=dist --create-site
```
