#!/bin/bash
# G Open 一键部署脚本
# 使用方法：chmod +x deploy.sh && ./deploy.sh

set -e

echo "=========================================="
echo "   G Open 部署脚本"
echo "=========================================="

# 配置变量
SERVER_IP="114.55.115.39"
DOMAIN="您的域名.com"  # 域名审核通过后修改
ADMIN_KEY="gopen_admin_2024"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() { echo -e "${GREEN}[✓]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${YELLOW}[→]${NC} $1"; }

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 用户运行此脚本"
    exit 1
fi

# 1. 更新系统
info "更新系统..."
apt update && apt upgrade -y
success "系统更新完成"

# 2. 安装 Node.js 20
info "安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
node --version
npm --version
success "Node.js 安装完成"

# 3. 安装 pnpm
info "安装 pnpm..."
npm install -g pnpm
pnpm --version
success "pnpm 安装完成"

# 4. 安装 Nginx
info "安装 Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
success "Nginx 安装完成"

# 5. 安装 PM2
info "安装 PM2..."
npm install -g pm2
success "PM2 安装完成"

# 6. 创建项目目录
info "创建项目目录..."
mkdir -p /var/www/gopen
mkdir -p /var/log/gopen
success "目录创建完成"

# 7. 配置防火墙
info "配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    ufw --force enable
    success "防火墙配置完成"
fi

# 8. 创建 Nginx 配置
info "创建 Nginx 配置..."
cat > /etc/nginx/sites-available/gopen << 'EOF'
server {
    listen 80;
    server_name _;  # 域名审核通过后改为您的域名

    # 日志
    access_log /var/log/nginx/gopen.access.log;
    error_log /var/log/nginx/gopen.error.log;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;

    # 前端静态文件
    location / {
        root /var/www/gopen/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:9091/api/v1/health;
    }
}
EOF

# 启用站点配置
ln -sf /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
success "Nginx 配置完成"

# 9. 创建环境变量文件
info "创建环境变量..."
cat > /var/www/gopen/server/.env << EOF
NODE_ENV=production
PORT=9091
ADMIN_KEY=${ADMIN_KEY}

# Supabase 配置（请修改为您的实际配置）
SUPABASE_URL=您的supabase_url
SUPABASE_ANON_KEY=您的supabase_key
EOF

success "环境变量配置完成"
info "请编辑 /var/www/gopen/server/.env 填写正确的 Supabase 配置"

# 10. 创建 PM2 配置
info "创建 PM2 配置..."
cat > /var/www/gopen/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gopen-server',
    cwd: '/var/www/gopen/server',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 9091
    },
    error_file: '/var/log/gopen/error.log',
    out_file: '/var/log/gopen/out.log',
    log_file: '/var/log/gopen/combined.log',
    time: true
  }]
};
EOF

success "PM2 配置完成"

# 11. 创建 systemd 服务（开机自启）
info "创建 systemd 服务..."
cat > /etc/systemd/system/gopen.service << 'EOF'
[Unit]
Description=G Open Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/gopen/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=gopen
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable gopen
success "systemd 服务配置完成"

echo ""
echo "=========================================="
echo "   基础环境安装完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo ""
echo "1. 上传代码到服务器："
echo "   scp -r /workspace/projects/* root@${SERVER_IP}:/var/www/gopen/"
echo ""
echo "2. 修改环境变量："
echo "   nano /var/www/gopen/server/.env"
echo ""
echo "3. 安装依赖并构建："
echo "   cd /var/www/gopen/server && pnpm install && pnpm build"
echo "   cd /var/www/gopen/client && pnpm install && pnpm build"
echo ""
echo "4. 启动服务："
echo "   pm2 start /var/www/gopen/ecosystem.config.js"
echo ""
echo "5. 访问应用："
echo "   http://${SERVER_IP}"
echo ""
