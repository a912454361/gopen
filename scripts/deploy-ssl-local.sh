#!/bin/bash
# ============================================
# G open 双平台 SSL 部署脚本
# 请在本地终端执行此脚本
# ============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   G open 双平台 SSL 部署脚本${NC}"
echo -e "${GREEN}============================================${NC}"

# ============================================
# 腾讯云服务器配置 (gopen.com.cn)
# ============================================
TENCENT_IP="1.15.55.132"
TENCENT_USER="root"
TENCENT_PASS="guo13816528465"

# ============================================
# 阿里云服务器配置 (woshiguotao.cn)
# ============================================
ALIYUN_IP="8.136.229.243"
ALIYUN_USER="root"
# 阿里云使用密钥对，请指定私钥文件路径
ALIYUN_KEY=""  # 例如: ~/.ssh/38faf6875f74d4d3d973e158127b376f.pem

# ============================================
# 函数：部署到服务器
# ============================================
deploy_server() {
    local ip=$1
    local user=$2
    local auth=$3
    local domain=$4
    local cert_file=$5
    local key_file=$6
    
    echo -e "\n${YELLOW}>>> 部署 $domain 到 $ip${NC}"
    
    # 创建目录
    echo "创建 SSL 目录..."
    if [[ "$auth" == "key"* ]]; then
        ssh -i "$ALIYUN_KEY" -o StrictHostKeyChecking=no $user@$ip "mkdir -p /etc/nginx/ssl"
    else
        sshpass -p "$TENCENT_PASS" ssh -o StrictHostKeyChecking=no $user@$ip "mkdir -p /etc/nginx/ssl"
    fi
    
    # 上传证书
    echo "上传 SSL 证书..."
    if [[ "$auth" == "key"* ]]; then
        scp -i "$ALIYUN_KEY" -o StrictHostKeyChecking=no $cert_file $user@$ip:/etc/nginx/ssl/
        scp -i "$ALIYUN_KEY" -o StrictHostKeyChecking=no $key_file $user@$ip:/etc/nginx/ssl/
    else
        sshpass -p "$TENCENT_PASS" scp -o StrictHostKeyChecking=no $cert_file $user@$ip:/etc/nginx/ssl/
        sshpass -p "$TENCENT_PASS" scp -o StrictHostKeyChecking=no $key_file $user@$ip:/etc/nginx/ssl/
    fi
    
    echo -e "${GREEN}✅ 证书上传完成${NC}"
}

# ============================================
# 主流程
# ============================================

# 检查是否安装 sshpass
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}正在安装 sshpass...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    elif command -v brew &> /dev/null; then
        brew install sshpass 2>/dev/null || brew install hudochenkov/sshpass/sshpass
    fi
fi

# 检查证书文件
echo -e "\n${YELLOW}检查证书文件...${NC}"
if [[ ! -f "docs/ssl/gopen.com.cn_bundle.crt" ]]; then
    echo -e "${RED}错误: 找不到 gopen.com.cn 证书文件${NC}"
    exit 1
fi
if [[ ! -f "docs/ssl/woshiguotao/woshiguotao.cn.pem" ]]; then
    echo -e "${RED}错误: 找不到 woshiguotao.cn 证书文件${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 证书文件检查通过${NC}"

# 部署腾讯云
echo -e "\n${YELLOW}============================================${NC}"
echo -e "${YELLOW}   部署腾讯云服务器 (gopen.com.cn)${NC}"
echo -e "${YELLOW}============================================${NC}"
deploy_server "$TENCENT_IP" "$TENCENT_USER" "pass" "gopen.com.cn" \
    "docs/ssl/gopen.com.cn_bundle.crt" "docs/ssl/gopen.com.cn.key"

# 配置腾讯云 Nginx
echo "配置 Nginx..."
sshpass -p "$TENCENT_PASS" ssh -o StrictHostKeyChecking=no $TENCENT_USER@$TENCENT_IP 'cat > /etc/nginx/conf.d/gopen.conf << '\''EOF'\''
server {
    listen 80;
    server_name gopen.com.cn api.gopen.com.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gopen.com.cn api.gopen.com.cn;
    
    ssl_certificate /etc/nginx/ssl/gopen.com.cn_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/gopen.com.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    location /api/ {
        if ($request_method = OPTIONS) {
            return 204;
        }
        proxy_pass http://127.0.0.1:9091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:9091/api/v1/health;
    }
}
EOF'

# 重载腾讯云 Nginx
echo "重载 Nginx..."
sshpass -p "$TENCENT_PASS" ssh -o StrictHostKeyChecking=no $TENCENT_USER@$TENCENT_IP "nginx -t && nginx -s reload"

# 阿里云部署（如果提供了密钥）
if [[ -n "$ALIYUN_KEY" && -f "$ALIYUN_KEY" ]]; then
    echo -e "\n${YELLOW}============================================${NC}"
    echo -e "${YELLOW}   部署阿里云服务器 (woshiguotao.cn)${NC}"
    echo -e "${YELLOW}============================================${NC}"
    
    deploy_server "$ALIYUN_IP" "$ALIYUN_USER" "key" "woshiguotao.cn" \
        "docs/ssl/woshiguotao/woshiguotao.cn.pem" "docs/ssl/woshiguotao/woshiguotao.cn.key"
    
    # 配置阿里云 Nginx
    ssh -i "$ALIYUN_KEY" -o StrictHostKeyChecking=no $ALIYUN_USER@$ALIYUN_IP 'cat > /etc/nginx/conf.d/woshiguotao.conf << '\''EOF'\''
server {
    listen 80;
    server_name woshiguotao.cn api.woshiguotao.cn;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name woshiguotao.cn api.woshiguotao.cn;
    
    ssl_certificate /etc/nginx/ssl/woshiguotao.cn.pem;
    ssl_certificate_key /etc/nginx/ssl/woshiguotao.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    location /api/ {
        if ($request_method = OPTIONS) {
            return 204;
        }
        proxy_pass http://127.0.0.1:9091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:9091/api/v1/health;
    }
}
EOF'
    
    ssh -i "$ALIYUN_KEY" -o StrictHostKeyChecking=no $ALIYUN_USER@$ALIYUN_IP "nginx -t && nginx -s reload"
fi

# 验证部署
echo -e "\n${YELLOW}============================================${NC}"
echo -e "${YELLOW}   验证部署${NC}"
echo -e "${YELLOW}============================================${NC}"

echo -e "\n验证 gopen.com.cn..."
curl -I https://gopen.com.cn/api/v1/health 2>/dev/null | head -5 || echo "验证失败"

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}   部署完成！${NC}"
echo -e "${GREEN}============================================${NC}"
