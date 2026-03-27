#!/bin/bash
# ==================================================
# 多域名 SSL 部署脚本 - 需要在有 SSH 访问权限的机器上运行
# ==================================================

set -e

ECS_HOST="8.136.229.243"
ECS_USER="root"

echo "========================================"
echo "  多域名 SSL 部署"
echo "========================================"
echo ""
echo "域名列表:"
echo "  - gopen.com.cn (腾讯云证书)"
echo "  - woshiguotao.cn (阿里云证书)"
echo ""

# 检查 SSH
echo "[检查] 测试 SSH 连接..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes $ECS_USER@$ECS_HOST "echo OK" 2>/dev/null; then
    echo "✅ SSH 连接成功"
else
    echo "❌ SSH 连接失败"
    echo ""
    echo "请在您的本地终端执行以下命令："
    echo ""
    echo "# 1. SSH 登录"
    echo "ssh root@8.136.229.243"
    echo ""
    echo "# 2. 创建目录"
    echo "mkdir -p /etc/nginx/ssl/gopen /etc/nginx/ssl/woshiguotao"
    echo ""
    echo "# 3. 上传证书（在本地新终端执行）"
    echo "scp docs/ssl/gopen.com.cn_bundle.crt root@8.136.229.243:/etc/nginx/ssl/gopen/"
    echo "scp docs/ssl/gopen.com.cn.key root@8.136.229.243:/etc/nginx/ssl/gopen/"
    echo "scp docs/ssl/woshiguotao/woshiguotao.cn.pem root@8.136.229.243:/etc/nginx/ssl/woshiguotao/"
    echo "scp docs/ssl/woshiguotao/woshiguotao.cn.key root@8.136.229.243:/etc/nginx/ssl/woshiguotao/"
    echo ""
    echo "# 4. 重载 Nginx"
    echo "nginx -t && nginx -s reload"
    exit 1
fi

# 创建目录
ssh $ECS_USER@$ECS_HOST "mkdir -p /etc/nginx/ssl/gopen /etc/nginx/ssl/woshiguotao"

# 上传证书
echo "[上传] gopen.com.cn 证书..."
scp docs/ssl/gopen.com.cn_bundle.crt $ECS_USER@$ECS_HOST:/etc/nginx/ssl/gopen/
scp docs/ssl/gopen.com.cn.key $ECS_USER@$ECS_HOST:/etc/nginx/ssl/gopen/

echo "[上传] woshiguotao.cn 证书..."
scp docs/ssl/woshiguotao/woshiguotao.cn.pem $ECS_USER@$ECS_HOST:/etc/nginx/ssl/woshiguotao/
scp docs/ssl/woshiguotao/woshiguotao.cn.key $ECS_USER@$ECS_HOST:/etc/nginx/ssl/woshiguotao/

# 配置 Nginx
echo "[配置] 更新 Nginx..."
ssh $ECS_USER@$ECS_HOST 'cat > /etc/nginx/conf.d/gopen.conf << '\''EOF'\''
# gopen.com.cn
server {
    listen 80;
    server_name gopen.com.cn api.gopen.com.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gopen.com.cn api.gopen.com.cn;
    
    ssl_certificate /etc/nginx/ssl/gopen/gopen.com.cn_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/gopen/gopen.com.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    add_header Access-Control-Allow-Origin * always;
    
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:9091/api/v1/health;
    }
}
EOF'

# 重载
ssh $ECS_USER@$ECS_HOST "nginx -t && nginx -s reload"

echo ""
echo "✅ 部署完成！"
echo ""
echo "测试: curl https://gopen.com.cn/api/v1/health"
