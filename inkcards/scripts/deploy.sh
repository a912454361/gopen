#!/bin/bash

# 万古长夜 - 构建和部署脚本

set -e

echo "=================================="
echo "  万古长夜 - 构建部署"
echo "=================================="

# 构建前端
echo ""
echo "📦 构建 Web 版本..."
cd /workspace/projects/inkcards
npx expo export --platform web

# 部署到服务器
echo ""
echo "🚀 部署到服务器..."
export SSHPASS='Guo13816528465.'

# 创建目录
sshpass -e ssh -o StrictHostKeyChecking=no root@1.15.55.132 "mkdir -p /var/www/inkcards"

# 上传文件
sshpass -e scp -o StrictHostKeyChecking=no -r dist/* root@1.15.55.132:/var/www/inkcards/

# 配置 Nginx
echo ""
echo "⚙️ 配置 Nginx..."
sshpass -e ssh -o StrictHostKeyChecking=no root@1.15.55.132 'cat > /etc/nginx/conf.d/inkcards.conf << EOF
server {
    listen 80;
    server_name inkcards.gopen.com.cn;
    
    root /var/www/inkcards;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws/ {
        proxy_pass http://127.0.0.1:9092;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

server {
    listen 443 ssl;
    server_name inkcards.gopen.com.cn;
    
    ssl_certificate /etc/nginx/ssl/gopen/gopen.com.cn_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/gopen/gopen.com.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    root /var/www/inkcards;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws/ {
        proxy_pass http://127.0.0.1:9092;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF'

# 重载 Nginx
sshpass -e ssh -o StrictHostKeyChecking=no root@1.15.55.132 "nginx -t && nginx -s reload"

echo ""
echo "✅ 部署完成！"
echo ""
echo "🌐 访问地址："
echo "   HTTP:  http://inkcards.gopen.com.cn"
echo "   HTTPS: https://inkcards.gopen.com.cn"
echo ""
