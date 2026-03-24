#!/bin/bash
# G Open 快速部署脚本（分步执行）
# 在服务器上执行

echo "=========================================="
echo "   G Open 快速部署"
echo "=========================================="

# 第一步：安装依赖
echo "[1/6] 安装系统依赖..."
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx
npm install -g pnpm pm2

# 第二步：创建目录
echo "[2/6] 创建项目目录..."
mkdir -p /var/www/gopen/server
mkdir -p /var/www/gopen/client
mkdir -p /var/log/gopen

# 第三步：配置防火墙
echo "[3/6] 配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 第四步：配置 Nginx
echo "[4/6] 配置 Nginx..."
cat > /etc/nginx/sites-available/gopen << 'NGINX_EOF'
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
NGINX_EOF

ln -sf /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 第五步：创建环境变量
echo "[5/6] 创建环境变量文件..."
cat > /var/www/gopen/server/.env << 'ENV_EOF'
NODE_ENV=production
PORT=9091
ADMIN_KEY=gopen_admin_2024
ENV_EOF

echo ""
echo "=========================================="
echo "   环境准备完成！"
echo "=========================================="
echo ""
echo "下一步：请上传代码后执行 deploy-start.sh"
