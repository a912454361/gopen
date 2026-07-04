# G open Web版部署指南

## 当前状态

Web版本已构建完成，静态文件位于 `client/dist/` 目录。

---

## 方案一：Vercel 部署（推荐）

### 步骤 1: 安装 Vercel CLI
```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel
```bash
vercel login
```
按提示选择登录方式（GitHub/GitLab/Email）

### 步骤 3: 部署
```bash
cd /workspace/projects/client
vercel --prod
```

### 步骤 4: 获取链接
部署完成后会生成类似链接：
- `https://gopen.vercel.app`
- 或自定义域名

---

## 方案二：Netlify 部署

### 步骤 1: 安装 Netlify CLI
```bash
npm install -g netlify
```

### 步骤 2: 登录 Netlify
```bash
netlify login
```

### 步骤 3: 部署
```bash
cd /workspace/projects/client
netlify deploy --prod --dir=dist
```

---

## 方案三：GitHub Pages 部署

### 步骤 1: 创建 GitHub 仓库
在 GitHub 上创建新仓库（如 `gopen-web`）

### 步骤 2: 推送代码
```bash
cd /workspace/projects
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gopen-web.git
git push -u origin main
```

### 步骤 3: 启用 GitHub Pages
1. 进入仓库 Settings > Pages
2. Source 选择 `main` 分支
3. 选择 `/dist` 目录
4. 保存后等待部署

### 步骤 4: 访问链接
`https://YOUR_USERNAME.github.io/gopen-web`

---

## 方案四：对象存储托管（阿里云/腾讯云）

### 阿里云 OSS
1. 创建 OSS Bucket，选择公共读
2. 开启静态网站托管
3. 上传 `client/dist/` 目录内容
4. 绑定自定义域名（可选）

### 腾讯云 COS
1. 创建 COS Bucket
2. 开启静态网站功能
3. 上传构建产物
4. 配置 CDN 加速（可选）

---

## 推荐选择

| 方案 | 费用 | 稳定性 | 自定义域名 | 推荐场景 |
|------|------|--------|-----------|----------|
| Vercel | 免费 | 高 | 支持 | **个人项目首选** |
| Netlify | 免费 | 高 | 支持 | 个人项目 |
| GitHub Pages | 免费 | 高 | 支持 | 开源项目 |
| 对象存储 | 付费 | 高 | 支持 | 企业项目 |

---

## 快速部署命令

如果你想快速部署，可以直接运行：

```bash
# Vercel 一键部署
cd /workspace/projects/client && vercel --prod

# 或者 Netlify
cd /workspace/projects/client && netlify deploy --prod --dir=dist
```

---

## 部署后配置

部署完成后，需要更新后端 CORS 配置，允许新域名访问：

```typescript
// server/src/index.ts
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:5000']
}));
```
