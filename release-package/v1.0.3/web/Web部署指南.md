# G open Web 版本部署指南

## 版本信息
- 版本号: v1.0.3
- 构建方式: Expo Web (Metro)
- 支持浏览器: Chrome, Firefox, Safari, Edge

## 部署要求

### 服务器要求
- 支持静态文件托管
- 支持 HTTPS（推荐）
- 可选：支持 Node.js（后端服务）

### 推荐平台
- Vercel（免费）
- Netlify（免费）
- GitHub Pages（免费）
- Cloudflare Pages（免费）
- 自有服务器

## 快速部署

### 方式一：Vercel（推荐）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
cd gopen-web
vercel --prod

# 4. 绑定自定义域名
# 在 Vercel Dashboard 添加域名
```

### 方式二：Netlify

```bash
# 1. 安装 Netlify CLI
npm i -g netlify-cli

# 2. 登录
netlify login

# 3. 部署
cd gopen-web
netlify deploy --prod

# 4. 绑定自定义域名
# 在 Netlify Dashboard 添加域名
```

### 方式三：GitHub Pages

```bash
# 1. 创建 GitHub 仓库
# 2. 推送代码
git init
git add .
git commit -m "Deploy G open web"
git remote add origin https://github.com/你的用户名/gopen-web.git
git push -u origin main

# 3. 启用 GitHub Pages
# Settings -> Pages -> Source: main branch

# 4. 绑定自定义域名
# 在 Pages 设置中添加域名
```

### 方式四：Docker

```bash
# 构建镜像
docker build -t gopen-web:v1.0.3 .

# 运行容器
docker run -d -p 80:80 gopen-web:v1.0.3

# 使用 Docker Compose
docker-compose up -d
```

## 本地构建

```bash
# 1. 解压源码
tar -xzvf gopen-web-v1.0.3.tar.gz
cd gopen-web

# 2. 安装依赖
cd client
pnpm install

# 3. 构建生产版本
pnpm build:web

# 4. 输出目录
# dist/ 或 web-build/
```

## Nginx 配置

```nginx
server {
    listen 80;
    server_name woshiguotao.cn www.woshiguotao.cn;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name woshiguotao.cn www.woshiguotao.cn;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/gopen;
    index index.html;
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:9091;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 环境变量

创建 `.env` 文件：

```env
EXPO_PUBLIC_BACKEND_BASE_URL=https://api.woshiguotao.cn
EXPO_PUBLIC_COZE_PROJECT_ID=your-project-id
```

## CDN 配置

推荐使用 Cloudflare CDN 加速：

1. 添加站点到 Cloudflare
2. 更新域名 DNS 服务器
3. 配置 SSL/TLS（Full 模式）
4. 启用缓存规则

## 性能优化

### 静态资源
- 启用 Gzip/Brotli 压缩
- 设置缓存头
- 使用 CDN

### 代码优化
- 代码分割
- 懒加载
- 预加载关键资源

## 问题排查

### 404 错误
确保服务器配置了 SPA 路由回退：
```nginx
try_files $uri $uri/ /index.html;
```

### API 跨域
确保后端配置了 CORS：
```javascript
app.use(cors({
  origin: ['https://woshiguotao.cn'],
  credentials: true
}));
```

## 联系支持

- GitHub: https://github.com/a912454361/gopen
- 问题反馈: https://github.com/a912454361/gopen/issues
