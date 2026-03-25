#!/bin/bash
# ============================================
# G open 智能创作助手 - 生产环境一键部署
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 权限运行此脚本"
    exit 1
fi

# 配置变量
DOMAIN=${DOMAIN:-"woshiguotao.cn"}
API_DOMAIN=${API_DOMAIN:-"api.woshiguotao.cn"}
INSTALL_DIR=${INSTALL_DIR:-"/opt/gopen"}
LOG_DIR=${LOG_DIR:-"/var/log/gopen"}

log_info "============================================"
log_info "  G open 智能创作助手 - 生产环境部署"
log_info "============================================"

# 1. 安装系统依赖
log_info "安装系统依赖..."
apt-get update
apt-get install -y curl wget git nginx certbot python3-certbot-nginx

# 2. 安装 Node.js
log_info "安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
log_success "Node.js $(node -v) 安装完成"

# 3. 安装 pnpm
log_info "安装 pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
log_success "pnpm $(pnpm -v) 安装完成"

# 4. 安装 PM2
log_info "安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
log_success "PM2 安装完成"

# 5. 创建目录结构
log_info "创建目录结构..."
mkdir -p $INSTALL_DIR
mkdir -p $LOG_DIR
mkdir -p /var/lib/gopen

# 6. 克隆代码（如果目录为空）
if [ ! -d "$INSTALL_DIR/.git" ]; then
    log_info "克隆代码..."
    git clone https://gitee.com/a912454361/gopen.git $INSTALL_DIR
else
    log_info "更新代码..."
    cd $INSTALL_DIR
    git pull origin main
fi

# 7. 安装依赖
log_info "安装项目依赖..."
cd $INSTALL_DIR
pnpm install

# 8. 检查环境配置
if [ ! -f "$INSTALL_DIR/server/.env" ]; then
    log_warning "未找到 .env 文件，请手动配置后重新运行"
    log_info "复制 .env.example 到 .env 并填写配置..."
    cp $INSTALL_DIR/server/.env.example $INSTALL_DIR/server/.env
    log_warning "请编辑 $INSTALL_DIR/server/.env 填写实际配置，然后重新运行此脚本"
    exit 0
fi

# 9. 构建前端
log_info "构建前端..."
cd $INSTALL_DIR/client
pnpm install
pnpm exec expo export --platform web

# 10. 构建 TypeScript
log_info "构建后端..."
cd $INSTALL_DIR/server
pnpm exec tsc --noEmit

# 11. 配置 Nginx
log_info "配置 Nginx..."
cp $INSTALL_DIR/deploy/nginx.conf /etc/nginx/nginx.conf

# 12. 配置 SSL 证书
log_info "配置 SSL 证书..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    log_info "申请 SSL 证书..."
    certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# 13. 创建 SSL 目录链接
mkdir -p /etc/nginx/ssl
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/fullchain.pem
    ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/privkey.pem
fi

# 14. 启动服务
log_info "启动后端服务..."
cd $INSTALL_DIR/server
pm2 delete gopen-api 2>/dev/null || true
pm2 start pnpm --name "gopen-api" -- run start

# 15. 配置 PM2 开机自启
pm2 startup
pm2 save

# 16. 重启 Nginx
log_info "重启 Nginx..."
nginx -t && systemctl restart nginx

# 17. 配置防火墙
log_info "配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

# 18. 设置自动更新证书
log_info "配置证书自动更新..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# 完成
log_success "============================================"
log_success "  部署完成！"
log_success "============================================"
echo ""
log_info "服务地址："
echo "  - 官网: https://$DOMAIN"
echo "  - API:  https://$API_DOMAIN"
echo ""
log_info "常用命令："
echo "  - 查看日志: pm2 logs gopen-api"
echo "  - 重启服务: pm2 restart gopen-api"
echo "  - 查看状态: pm2 status"
echo ""
log_info "日志目录: $LOG_DIR"
log_info "安装目录: $INSTALL_DIR"
