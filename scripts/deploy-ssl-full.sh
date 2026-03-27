#!/bin/bash
# ==================================================
# 完整部署脚本 - 复制整个脚本到终端执行
# ==================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================"
echo "  G open 后端 SSL 部署"
echo -e "========================================${NC}"
echo ""

ECS_HOST="8.136.229.243"
ECS_USER="root"

# 步骤 1: 创建目录
echo -e "${YELLOW}[步骤 1/4] 创建 SSL 目录...${NC}"
ssh $ECS_USER@$ECS_HOST "mkdir -p /etc/nginx/ssl/gopen /etc/nginx/ssl/woshiguotao"
echo -e "${GREEN}✅ 目录创建完成${NC}"
echo ""

# 步骤 2: 上传 gopen.com.cn 证书
echo -e "${YELLOW}[步骤 2/4] 上传 gopen.com.cn 证书...${NC}"
scp /workspace/projects/docs/ssl/gopen.com.cn_bundle.crt $ECS_USER@$ECS_HOST:/etc/nginx/ssl/gopen/
scp /workspace/projects/docs/ssl/gopen.com.cn.key $ECS_USER@$ECS_HOST:/etc/nginx/ssl/gopen/
echo -e "${GREEN}✅ gopen.com.cn 证书上传完成${NC}"
echo ""

# 步骤 3: 上传 woshiguotao.cn 证书
echo -e "${YELLOW}[步骤 3/4] 上传 woshiguotao.cn 证书...${NC}"
scp /workspace/projects/docs/ssl/woshiguotao/woshiguotao.cn.pem $ECS_USER@$ECS_HOST:/etc/nginx/ssl/woshiguotao/
scp /workspace/projects/docs/ssl/woshiguotao/woshiguotao.cn.key $ECS_USER@$ECS_HOST:/etc/nginx/ssl/woshiguotao/
echo -e "${GREEN}✅ woshiguotao.cn 证书上传完成${NC}"
echo ""

# 步骤 4: 配置 Nginx
echo -e "${YELLOW}[步骤 4/4] 配置 Nginx...${NC}"
ssh $ECS_USER@$ECS_HOST 'cat > /etc/nginx/conf.d/gopen.conf << '\''EOF'\''
# ============================================
# gopen.com.cn - 后端 API 服务
# ============================================

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name gopen.com.cn api.gopen.com.cn;
    
    # Let'\''s Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl http2;
    server_name gopen.com.cn api.gopen.com.cn;
    
    # SSL 证书
    ssl_certificate /etc/nginx/ssl/gopen/gopen.com.cn_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/gopen/gopen.com.cn.key;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # CORS 配置
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Admin-Key, X-Player-Id" always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Max-Age "86400" always;
    
    # API 代理
    location /api/ {
        # 处理 OPTIONS 预检请求
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Admin-Key, X-Player-Id";
            add_header Access-Control-Max-Age "86400";
            add_header Content-Length 0;
            add_header Content-Type "text/plain charset=UTF-8";
            return 204;
        }
        
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲配置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:9091/api/v1/health;
        access_log off;
    }
    
    # 根路径重定向
    location / {
        return 301 https://github.com;
    }
}

# ============================================
# woshiguotao.cn - 预留配置
# ============================================
server {
    listen 80;
    server_name woshiguotao.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name woshiguotao.cn;
    
    ssl_certificate /etc/nginx/ssl/woshiguotao/woshiguotao.cn.pem;
    ssl_certificate_key /etc/nginx/ssl/woshiguotao/woshiguotao.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        return 200 "woshiguotao.cn - SSL OK";
        add_header Content-Type text/plain;
    }
}
EOF'

# 测试并重载 Nginx
echo -e "${YELLOW}测试 Nginx 配置...${NC}"
ssh $ECS_USER@$ECS_HOST "nginx -t"

echo -e "${YELLOW}重载 Nginx...${NC}"
ssh $ECS_USER@$ECS_HOST "nginx -s reload"

echo ""
echo -e "${GREEN}========================================"
echo "  ✅ 部署完成！"
echo -e "========================================${NC}"
echo ""
echo "测试命令:"
echo "  curl -I https://gopen.com.cn/api/v1/health"
echo "  curl https://gopen.com.cn/api/v1/health"
echo ""
