# G open 智能创作助手 - 部署就绪

## 构建状态 ✅

| 组件 | 状态 | 大小 | 路径 |
|------|------|------|------|
| 前端 (Web) | ✅ 已构建 | 11MB | `client/dist/` |
| 后端 (API) | ✅ 已构建 | 544KB | `server/dist/` |
| 模型数据 | ✅ 已同步 | 122个 | Supabase |

---

## 方案一：Netlify 部署（推荐 - 前端）

### 一键部署命令
```bash
cd /workspace/projects/client
netlify deploy --prod --dir=dist
```

### 或通过 Netlify Dashboard
1. 连接 GitHub 仓库
2. 构建命令: `pnpm install && npx expo export --platform web`
3. 发布目录: `dist`
4. 自动部署完成

### 预期地址
- `https://gopen.netlify.app`
- 或自定义域名

---

## 方案二：Vercel 部署（前端）

```bash
cd /workspace/projects/client
vercel --prod
```

---

## 方案三：服务器部署（全栈）

### 1. 上传代码到服务器
```bash
# 打包部署文件
tar -czvf gopen-deploy.tar.gz \
  client/dist/ \
  server/dist/ \
  server/package.json \
  server/node_modules/ \
  package.json \
  pnpm-workspace.yaml
```

### 2. 服务器启动
```bash
# 后端服务
cd server
PORT=5000 pnpm run start

# 前端静态文件托管 (nginx)
# 配置 nginx 指向 client/dist/
```

---

## 环境变量（生产环境）

| 变量 | 说明 | 示例 |
|------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `5000` |
| `SUPABASE_URL` | 数据库地址 | 已配置 |
| `SUPABASE_ANON_KEY` | 数据库密钥 | 已配置 |

---

## 已配置的功能

### 自动化任务
- ✅ 模型同步调度器（每6小时）
- ✅ 推广任务调度器（每日09:00）
- ✅ 全量模型同步（每日03:00）

### 支付方式
- ✅ 支付宝收款码
- ✅ 微信收款码
- ✅ 银联收款码
- ✅ 京东支付
- ✅ 银行转账

### 模型市场
- ✅ 122个活跃模型
- ✅ 35家主流厂商
- ✅ 价格自动同步

---

## 部署后验证

### 健康检查
```bash
curl https://your-domain.com/api/v1/health
# 期望: {"status":"ok"}
```

### 模型列表
```bash
curl https://your-domain.com/api/v1/models | head -100
```

---

## 快速部署命令

```bash
# Netlify（前端）
cd /workspace/projects/client && netlify deploy --prod --dir=dist

# Vercel（前端）
cd /workspace/projects/client && vercel --prod
```

---

**构建时间**: 2026-03-23 07:02:00
**版本**: v1.0.0
