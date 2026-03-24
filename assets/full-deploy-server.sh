#!/bin/bash
###############################################################
#                                                             #
#  G Open 完整部署脚本 - 服务器端                              #
#                                                             #
#  使用方法：                                                  #
#  1. SSH 登录服务器: ssh root@114.55.115.39                   #
#  2. 粘贴此脚本全部内容到终端执行                             #
#                                                             #
###############################################################

set -e

# ======================= 配置区域 =======================
SERVER_IP="114.55.115.39"
ADMIN_KEY="gopen_admin_2024"
PROJECT_DIR="/var/www/gopen"
LOG_DIR="/var/log/gopen"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${YELLOW}[STEP]${NC} $1"; }

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 用户执行此脚本"
    exit 1
fi

clear
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           G Open 完整部署脚本 v1.0                        ║"
echo "║                                                           ║"
echo "║  服务器: $SERVER_IP                                       ║"
echo "║  目录: $PROJECT_DIR                                       ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# ==================== 步骤 1: 更新系统 ====================
log_step "【1/8】更新系统..."
apt update -y
apt upgrade -y
log_success "系统更新完成"

# ==================== 步骤 2: 安装 Node.js ====================
log_step "【2/8】安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
log_success "Node.js ${NODE_VERSION} 安装完成"
log_success "npm ${NPM_VERSION} 安装完成"

# ==================== 步骤 3: 安装全局工具 ====================
log_step "【3/8】安装 pnpm 和 PM2..."
npm install -g pnpm pm2
PNPM_VERSION=$(pnpm -v)
PM2_VERSION=$(pm2 -v)
log_success "pnpm ${PNPM_VERSION} 安装完成"
log_success "PM2 ${PM2_VERSION} 安装完成"

# ==================== 步骤 4: 安装 Nginx ====================
log_step "【4/8】安装 Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log_success "Nginx 安装完成"

# ==================== 步骤 5: 配置防火墙 ====================
log_step "【5/8】配置防火墙..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log_success "防火墙配置完成"
ufw status

# ==================== 步骤 6: 创建项目目录 ====================
log_step "【6/8】创建项目目录..."
mkdir -p ${PROJECT_DIR}/server
mkdir -p ${PROJECT_DIR}/client
mkdir -p ${LOG_DIR}
mkdir -p ${PROJECT_DIR}/client/dist
log_success "目录创建完成"

# ==================== 步骤 7: 配置 Nginx ====================
log_step "【7/8】配置 Nginx..."
cat > /etc/nginx/sites-available/gopen << 'NGINX_CONFIG'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # 日志
    access_log /var/log/nginx/gopen.access.log;
    error_log /var/log/nginx/gopen.error.log;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml application/xml+rss;

    # 前端静态文件
    location / {
        root /var/www/gopen/client/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }

    # 健康检查
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:9091/api/v1/health;
    }
}
NGINX_CONFIG

# 启用站点
ln -sf /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试并重启
nginx -t
systemctl restart nginx
log_success "Nginx 配置完成"

# ==================== 步骤 8: 创建环境变量 ====================
log_step "【8/8】创建环境变量文件..."
cat > ${PROJECT_DIR}/server/.env << ENV_CONFIG
# 生产环境配置
NODE_ENV=production
PORT=9091

# 管理员密钥
ADMIN_KEY=${ADMIN_KEY}

# Supabase 配置（请修改为您的实际配置）
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_key
ENV_CONFIG

log_success "环境变量文件创建完成"

# ==================== 创建 PM2 配置 ====================
log_step "创建 PM2 配置..."
cat > ${PROJECT_DIR}/ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [{
    name: 'gopen-server',
    cwd: '/var/www/gopen/server',
    script: 'dist/index.js',
    instances: 'max',
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
    time: true,
    merge_logs: true
  }]
};
PM2_CONFIG

log_success "PM2 配置创建完成"

# ==================== 创建 systemd 服务 ====================
log_step "创建 systemd 服务..."
cat > /etc/systemd/system/gopen.service << 'SYSTEMD_CONFIG'
[Unit]
Description=G Open Application Server
Documentation=https://gopen.ai
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
SYSTEMD_CONFIG

systemctl daemon-reload
systemctl enable gopen
log_success "systemd 服务创建完成"

# ==================== 创建快捷命令 ====================
log_step "创建快捷命令..."
cat > /usr/local/bin/gopen << 'CLI_CONFIG'
#!/bin/bash
case "$1" in
    start)
        pm2 start /var/www/gopen/ecosystem.config.js
        ;;
    stop)
        pm2 stop gopen-server
        ;;
    restart)
        pm2 restart gopen-server
        ;;
    logs)
        pm2 logs gopen-server
        ;;
    status)
        pm2 status
        ;;
    build)
        echo "构建后端..."
        cd /var/www/gopen/server && pnpm build
        echo "构建前端..."
        cd /var/www/gopen/client && npx expo export --platform web
        ;;
    update)
        echo "更新后端依赖..."
        cd /var/www/gopen/server && pnpm install
        echo "更新前端依赖..."
        cd /var/www/gopen/client && pnpm install
        ;;
    *)
        echo "G Open 命令行工具"
        echo "用法: gopen <命令>"
        echo ""
        echo "命令:"
        echo "  start    启动服务"
        echo "  stop     停止服务"
        echo "  restart  重启服务"
        echo "  logs     查看日志"
        echo "  status   查看状态"
        echo "  build    构建项目"
        echo "  update   更新依赖"
        ;;
esac
CLI_CONFIG

chmod +x /usr/local/bin/gopen
log_success "快捷命令创建完成"

# ==================== 显示完成信息 ====================
clear
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║              ✅ 环境安装完成！                            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "已安装组件:"
echo "  • Node.js $(node -v)"
echo "  • npm $(npm -v)"
echo "  • pnpm $(pnpm -v)"
echo "  • PM2 $(pm2 -v)"
echo "  • Nginx $(nginx -v 2>&1 | cut -d'/' -f2)"
echo ""
echo "目录结构:"
echo "  • 项目目录: ${PROJECT_DIR}"
echo "  • 日志目录: ${LOG_DIR}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 下一步操作："
echo ""
echo "1️⃣  上传代码（在本地电脑执行）："
echo ""
echo "    # 上传后端"
echo "    scp -r /workspace/projects/server/package.json \\"
echo "              /workspace/projects/server/tsconfig.json \\"
echo "              /workspace/projects/server/src \\"
echo "              root@${SERVER_IP}:${PROJECT_DIR}/server/"
echo ""
echo "    # 上传前端"
echo "    scp -r /workspace/projects/client/package.json \\"
echo "              /workspace/projects/client/tsconfig.json \\"
echo "              /workspace/projects/client/app.json \\"
echo "              /workspace/projects/client/app \\"
echo "              /workspace/projects/client/screens \\"
echo "              /workspace/projects/client/components \\"
echo "              /workspace/projects/client/constants \\"
echo "              /workspace/projects/client/hooks \\"
echo "              /workspace/projects/client/utils \\"
echo "              /workspace/projects/client/context \\"
echo "              /workspace/projects/client/types \\"
echo "              root@${SERVER_IP}:${PROJECT_DIR}/client/"
echo ""
echo "2️⃣  构建并启动（在服务器执行）："
echo ""
echo "    cd ${PROJECT_DIR}/server && pnpm install && pnpm build"
echo "    cd ${PROJECT_DIR}/client && pnpm install && npx expo export --platform web"
echo "    gopen start"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "快捷命令："
echo "  gopen start    - 启动服务"
echo "  gopen stop     - 停止服务"
echo "  gopen restart  - 重启服务"
echo "  gopen logs     - 查看日志"
echo "  gopen status   - 查看状态"
echo "  gopen build    - 构建项目"
echo ""
