#!/bin/bash
# ==================================================
# G open 后端部署脚本 - 阿里云 ECS + SSL
# ==================================================
# 
# 使用方法：
# chmod +x deploy-to-ecs.sh
# ./deploy-to-ecs.sh
#

set -e

ECS_HOST="8.136.229.243"
ECS_USER="root"
PROJECT_DIR="/workspace/projects"

echo "========================================"
echo "  G open 后端部署 - 阿里云 ECS"
echo "========================================"
echo ""
echo "目标服务器: $ECS_HOST"
echo ""

# 检查 SSH 连接
echo "[1/5] 检查 SSH 连接..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $ECS_USER@$ECS_HOST "echo 'SSH OK'" 2>/dev/null; then
    echo "❌ SSH 连接失败"
    echo "请确保："
    echo "1. 已配置 SSH 密钥或密码"
    echo "2. ECS 安全组开放了 22 端口"
    exit 1
fi
echo "✅ SSH 连接成功"
echo ""

# 创建目录
echo "[2/5] 创建目录..."
ssh $ECS_USER@$ECS_HOST "mkdir -p /etc/nginx/ssl /var/www/gopen-backend"
echo "✅ 目录创建完成"
echo ""

# 上传 SSL 证书
echo "[3/5] 上传 SSL 证书..."
scp $PROJECT_DIR/docs/ssl/gopen.com.cn_bundle.crt $ECS_USER@$ECS_HOST:/etc/nginx/ssl/gopen.com.cn.crt
scp $PROJECT_DIR/docs/ssl/gopen.com.cn.key $ECS_USER@$ECS_HOST:/etc/nginx/ssl/
echo "✅ SSL 证书上传完成"
echo ""

# 上传 Nginx 配置
echo "[4/5] 配置 Nginx..."
cat > /tmp/gopen-nginx.conf << 'NGINX_CONF'
# HTTP 重定向
server {
    listen 80;
    server_name gopen.com.cn api.gopen.com.cn;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name gopen.com.cn api.gopen.com.cn;
    
    ssl_certificate /etc/nginx/ssl/gopen.com.cn.crt;
    ssl_certificate_key /etc/nginx/ssl/gopen.com.cn.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # CORS 配置
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization, X-Admin-Key, X-Player-Id' always;
    add_header Access-Control-Max-Age 86400 always;
    
    # API 代理
    location /api/ {
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:9091/api/v1/health;
        access_log off;
    }
    
    # 根路径
    location / {
        return 301 https://github.com/your-repo/gopen;
    }
}

# IP 直连（临时）
server {
    listen 9091;
    server_name 8.136.229.243;
    
    location / {
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX_CONF

scp /tmp/gopen-nginx.conf $ECS_USER@$ECS_HOST:/etc/nginx/conf.d/gopen.conf
echo "✅ Nginx 配置上传完成"
echo ""

# 测试并重载 Nginx
echo "[5/5] 重载 Nginx..."
ssh $ECS_USER@$ECS_HOST << 'REMOTE_CMD'
nginx -t && nginx -s reload
echo "✅ Nginx 重载成功"
REMOTE_CMD

echo ""
echo "========================================"
echo "  ✅ 部署完成！"
echo "========================================"
echo ""
echo "测试访问："
echo "  HTTP:  http://gopen.com.cn/api/v1/health"
echo "  HTTPS: https://gopen.com.cn/api/v1/health"
echo ""
