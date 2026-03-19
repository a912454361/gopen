# G Open 一键部署指南

## 服务器信息
- 主服务器：114.55.115.39
- 备用服务器：121.41.198.107
- 管理密钥：gopen_admin_2024

---

## 🚀 第一步：服务器环境安装

### 1.1 SSH 登录服务器

```bash
ssh root@114.55.115.39
```

### 1.2 粘贴执行以下命令（一键安装）

```bash
apt update -y && apt upgrade -y && \
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
apt install -y nodejs nginx && \
npm install -g pnpm pm2 && \
mkdir -p /var/www/gopen/server /var/www/gopen/client/dist /var/log/gopen && \
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable && \
cat > /etc/nginx/sites-available/gopen << 'EOF'
server {
    listen 80;
    server_name _;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    location / {
        root /var/www/gopen/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/ && \
rm -f /etc/nginx/sites-enabled/default && \
nginx -t && systemctl restart nginx && \
cat > /var/www/gopen/server/.env << 'EOF'
NODE_ENV=production
PORT=9091
ADMIN_KEY=gopen_admin_2024
EOF
echo "✅ 环境安装完成！"
```

---

## 📤 第二步：上传代码

### 2.1 退出服务器

```bash
exit
```

### 2.2 在本地电脑执行（上传后端）

```bash
cd /workspace/projects
scp -r server/package.json server/tsconfig.json server/src root@114.55.115.39:/var/www/gopen/server/
```

### 2.3 上传前端

```bash
scp -r client/package.json client/tsconfig.json client/app.json client/app client/screens client/components client/constants client/hooks client/utils client/context client/types root@114.55.115.39:/var/www/gopen/client/
```

### 2.4 上传 assets（如有）

```bash
scp -r client/assets root@114.55.115.39:/var/www/gopen/client/
```

---

## 🔧 第三步：构建并启动

### 3.1 SSH 登录服务器

```bash
ssh root@114.55.115.39
```

### 3.2 构建并启动（一键执行）

```bash
cd /var/www/gopen/server && pnpm install && pnpm build && \
cd /var/www/gopen/client && pnpm install && npx expo export --platform web && \
cd /var/www/gopen && \
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gopen-server',
    cwd: '/var/www/gopen/server',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    env_production: { NODE_ENV: 'production', PORT: 9091 },
    error_file: '/var/log/gopen/error.log',
    out_file: '/var/log/gopen/out.log',
    time: true
  }]
};
EOF
pm2 start ecosystem.config.js && pm2 save && pm2 startup && \
echo "✅ 部署完成！"
```

---

## ✅ 第四步：验证部署

### 浏览器访问

| 项目 | 地址 |
|------|------|
| **应用首页** | http://114.55.115.39 |
| **健康检查** | http://114.55.115.39/api/v1/health |
| **管理后台** | http://114.55.115.39/admin?key=gopen_admin_2024 |

### 命令行验证

```bash
# 在服务器上执行
curl http://127.0.0.1:9091/api/v1/health
```

---

## 🛠️ 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs gopen-server

# 重启服务
pm2 restart gopen-server

# 停止服务
pm2 stop gopen-server

# 启动服务
pm2 start /var/www/gopen/ecosystem.config.js

# 查看 Nginx 状态
systemctl status nginx

# 重启 Nginx
systemctl restart nginx
```

---

## 🔄 更新部署

当有代码更新时，执行：

### 1. 上传新代码

```bash
# 在本地执行
scp -r server/src root@114.55.115.39:/var/www/gopen/server/
scp -r client/app client/screens root@114.55.115.39:/var/www/gopen/client/
```

### 2. 重新构建

```bash
# 在服务器执行
cd /var/www/gopen/server && pnpm build
cd /var/www/gopen/client && npx expo export --platform web
pm2 restart gopen-server
```

---

## 🔒 域名绑定（域名审核通过后）

```bash
# 1. 修改 Nginx 配置
nano /etc/nginx/sites-available/gopen
# 将 server_name _; 改为 server_name 您的域名.com;

# 2. 申请 SSL 证书
apt install -y certbot python3-certbot-nginx
certbot --nginx -d 您的域名.com

# 3. 重启 Nginx
systemctl restart nginx
```

---

## ⚠️ 故障排查

### 无法访问

```bash
# 检查服务
pm2 status

# 检查端口
netstat -tlnp | grep 9091

# 检查防火墙
ufw status

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 查看应用日志
tail -f /var/log/gopen/error.log
```

### 前端页面空白

```bash
# 检查前端构建
ls /var/www/gopen/client/dist/

# 重新构建
cd /var/www/gopen/client && npx expo export --platform web
```

### API 请求失败

```bash
# 查看后端日志
pm2 logs gopen-server

# 检查环境变量
cat /var/www/gopen/server/.env

# 重启后端
pm2 restart gopen-server
```
