#!/bin/bash
# ==========================================
# G Open 一键部署命令
# 复制此文件全部内容，粘贴到服务器终端执行
# ==========================================

# 设置变量
SERVER_IP="114.55.115.39"

echo "开始部署 G Open..."

# ===== 第一步：安装环境 =====
echo ">>> 安装系统环境..."
apt update -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx
npm install -g pnpm pm2

# ===== 第二步：创建目录 =====
echo ">>> 创建项目目录..."
mkdir -p /var/www/gopen/server
mkdir -p /var/www/gopen/client
mkdir -p /var/log/gopen

# ===== 第三步：配置防火墙 =====
echo ">>> 配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ===== 第四步：配置 Nginx =====
echo ">>> 配置 Nginx..."
cat > /etc/nginx/sites-available/gopen << 'NGINX_CONF'
server {
    listen 80;
    server_name _;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
systemctl enable nginx

# ===== 第五步：创建环境变量 =====
echo ">>> 创建环境变量..."
cat > /var/www/gopen/server/.env << 'ENV_CONF'
NODE_ENV=production
PORT=9091
ADMIN_KEY=gopen_admin_2024
ENV_CONF

echo ""
echo "=========================================="
echo "✅ 环境安装完成！"
echo "=========================================="
echo ""
echo "下一步：在本地电脑执行上传命令"
echo ""
