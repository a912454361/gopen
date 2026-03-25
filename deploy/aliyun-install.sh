#!/bin/bash

# ============================================
# G open 智能创作助手 - 阿里云一键部署脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# 系统检查
# ============================================
check_system() {
    print_info "检查系统环境..."
    
    if [ ! -f /etc/centos-release ] && [ ! -f /etc/redhat-release ]; then
        print_warning "此脚本主要针对 CentOS/RHEL 系统"
        print_warning "如果是 Ubuntu/Debian，请参考 docs/ALIYUN_DEPLOYMENT.md"
    fi
    
    print_success "系统检查完成"
}

# ============================================
# 安装 Docker
# ============================================
install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker 已安装: $(docker --version)"
        return
    fi
    
    print_info "安装 Docker..."
    
    # 安装 Docker
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
    
    # 启动 Docker
    systemctl start docker
    systemctl enable docker
    
    # 配置 Docker 镜像加速
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << EOF
{
    "registry-mirrors": [
        "https://registry.cn-hangzhou.aliyuncs.com",
        "https://mirror.ccs.tencentyun.com"
    ]
}
EOF
    systemctl restart docker
    
    print_success "Docker 安装完成"
}

# ============================================
# 安装 Docker Compose
# ============================================
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose 已安装: $(docker-compose --version)"
        return
    fi
    
    print_info "安装 Docker Compose..."
    
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose 安装完成"
}

# ============================================
# 安装 Nginx
# ============================================
install_nginx() {
    if command -v nginx &> /dev/null; then
        print_success "Nginx 已安装: $(nginx -v 2>&1)"
        return
    fi
    
    print_info "安装 Nginx..."
    
    yum install -y nginx
    systemctl start nginx
    systemctl enable nginx
    
    print_success "Nginx 安装完成"
}

# ============================================
# 安装 Git
# ============================================
install_git() {
    if command -v git &> /dev/null; then
        print_success "Git 已安装: $(git --version)"
        return
    fi
    
    print_info "安装 Git..."
    yum install -y git
    print_success "Git 安装完成"
}

# ============================================
# 克隆代码
# ============================================
clone_code() {
    print_info "准备代码..."
    
    APP_DIR="/var/www/gopen"
    
    if [ -d "$APP_DIR" ]; then
        print_warning "目录 $APP_DIR 已存在"
        read -p "是否删除并重新克隆？(y/n): " choice
        if [ "$choice" = "y" ]; then
            rm -rf "$APP_DIR"
        else
            print_info "使用现有代码，跳过克隆"
            cd "$APP_DIR"
            return
        fi
    fi
    
    mkdir -p "$APP_DIR"
    
    print_info "选择代码源："
    echo "1) GitHub (github.com/a912454361/gopen)"
    echo "2) Gitee (gitee.com/a912454361/gopen) - 国内更快"
    read -p "请选择 (1/2): " repo_choice
    
    if [ "$repo_choice" = "2" ]; then
        REPO_URL="https://gitee.com/a912454361/gopen.git"
    else
        REPO_URL="https://github.com/a912454361/gopen.git"
    fi
    
    print_info "从 $REPO_URL 克隆代码..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    
    print_success "代码克隆完成"
}

# ============================================
# 配置环境变量
# ============================================
configure_env() {
    print_info "配置环境变量..."
    
    ENV_FILE="/var/www/gopen/server/.env"
    
    if [ -f "$ENV_FILE" ]; then
        print_warning ".env 文件已存在"
        read -p "是否重新配置？(y/n): " choice
        if [ "$choice" != "y" ]; then
            return
        fi
    fi
    
    echo ""
    print_info "请输入以下配置信息："
    echo ""
    
    read -p "Supabase 数据库 URL: " db_url
    read -p "JWT 密钥 (留空自动生成): " jwt_secret
    if [ -z "$jwt_secret" ]; then
        jwt_secret=$(openssl rand -hex 32)
    fi
    
    cat > "$ENV_FILE" << EOF
# 服务端口
PORT=9091
NODE_ENV=production

# 数据库
DATABASE_URL=$db_url

# JWT 密钥
JWT_SECRET=$jwt_secret

# 管理员密钥
ADMIN_KEY=GtAdmin2024SecretKey8888

# 对象存储 (可选)
# OSS_ACCESS_KEY=
# OSS_SECRET_KEY=
# OSS_BUCKET=
# OSS_REGION=oss-cn-hangzhou

# AI API 配置 (可选)
# OPENAI_API_KEY=
# DEEPSEEK_API_KEY=
EOF
    
    chmod 600 "$ENV_FILE"
    
    print_success "环境变量配置完成"
}

# ============================================
# 配置防火墙
# ============================================
configure_firewall() {
    print_info "配置防火墙..."
    
    if command -v firewall-cmd &> /dev/null; then
        systemctl start firewalld 2>/dev/null || true
        systemctl enable firewalld 2>/dev/null || true
        
        firewall-cmd --permanent --add-port=22/tcp
        firewall-cmd --permanent --add-port=80/tcp
        firewall-cmd --permanent --add-port=443/tcp
        firewall-cmd --permanent --add-port=5000/tcp
        firewall-cmd --permanent --add-port=9091/tcp
        firewall-cmd --reload
        
        print_success "防火墙配置完成"
    else
        print_warning "firewalld 未安装，跳过防火墙配置"
    fi
}

# ============================================
# 构建 Docker 镜像
# ============================================
build_docker() {
    print_info "构建 Docker 镜像..."
    
    cd /var/www/gopen
    
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    print_success "Docker 镜像构建完成"
}

# ============================================
# 启动服务
# ============================================
start_services() {
    print_info "启动服务..."
    
    cd /var/www/gopen
    
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "服务启动完成"
    
    # 等待服务就绪
    print_info "等待服务就绪..."
    sleep 10
    
    # 检查服务状态
    docker-compose -f docker-compose.prod.yml ps
}

# ============================================
# 配置 SSL 证书
# ============================================
setup_ssl() {
    print_info "配置 SSL 证书..."
    
    SSL_DIR="/var/www/gopen/deploy/ssl"
    mkdir -p "$SSL_DIR"
    
    echo ""
    print_info "请选择 SSL 证书配置方式："
    echo "1) 使用阿里云免费证书 (推荐)"
    echo "2) 使用 Let's Encrypt 自动证书"
    echo "3) 跳过 (稍后手动配置)"
    read -p "请选择 (1/2/3): " ssl_choice
    
    case $ssl_choice in
        1)
            print_info "请按以下步骤操作："
            echo "1. 登录阿里云 SSL 证书控制台"
            echo "2. 购买免费DV证书"
            echo "3. 验证域名 woshiguotao.cn"
            echo "4. 下载 Nginx 格式证书"
            echo "5. 将证书文件放到 $SSL_DIR/"
            echo "   - woshiguotao.cn.pem (证书)"
            echo "   - woshiguotao.cn.key (私钥)"
            ;;
        2)
            print_info "安装 Certbot..."
            yum install -y certbot python3-certbot-nginx
            
            read -p "请输入域名 (默认 woshiguotao.cn): " domain
            domain=${domain:-woshiguotao.cn}
            
            certbot --nginx -d "$domain" -d "api.$domain" -d "www.$domain"
            
            # 设置自动续期
            (crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet") | crontab -
            ;;
        3)
            print_warning "跳过 SSL 配置"
            ;;
    esac
}

# ============================================
# 配置 Nginx 反向代理
# ============================================
configure_nginx() {
    print_info "配置 Nginx 反向代理..."
    
    NGINX_CONF="/etc/nginx/conf.d/gopen.conf"
    
    read -p "请输入服务器公网IP: " server_ip
    
    cat > "$NGINX_CONF" << EOF
# G open 智能创作助手 - Nginx 配置

# 后端 API 服务
upstream backend {
    server 127.0.0.1:9091;
    keepalive 64;
}

# 前端 Web 服务
upstream frontend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name woshiguotao.cn api.woshiguotao.cn www.woshiguotao.cn;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS - 主站
server {
    listen 443 ssl http2;
    server_name woshiguotao.cn www.woshiguotao.cn;
    
    ssl_certificate /var/www/gopen/deploy/ssl/woshiguotao.cn.pem;
    ssl_certificate_key /var/www/gopen/deploy/ssl/woshiguotao.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# HTTPS - API
server {
    listen 443 ssl http2;
    server_name api.woshiguotao.cn;
    
    ssl_certificate /var/www/gopen/deploy/ssl/woshiguotao.cn.pem;
    ssl_certificate_key /var/www/gopen/deploy/ssl/woshiguotao.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }
}
EOF
    
    # 测试配置
    nginx -t
    
    # 重载 Nginx
    systemctl reload nginx
    
    print_success "Nginx 配置完成"
}

# ============================================
# 验证部署
# ============================================
verify_deployment() {
    print_info "验证部署..."
    
    echo ""
    print_info "检查服务状态..."
    
    # 检查 Docker 容器
    docker ps
    
    echo ""
    print_info "测试 API 健康检查..."
    curl -s http://localhost:9091/api/v1/health && echo ""
    
    echo ""
    print_info "测试前端..."
    curl -s -I http://localhost:5000 | head -3
    
    print_success "验证完成"
}

# ============================================
# 打印部署信息
# ============================================
print_deployment_info() {
    echo ""
    echo "================================"
    echo -e "${GREEN}  部署完成！${NC}"
    echo "================================"
    echo ""
    echo "访问地址："
    echo "  前端: http://localhost:5000"
    echo "  后端: http://localhost:9091"
    echo ""
    echo "配置域名后访问："
    echo "  官网: https://woshiguotao.cn"
    echo "  API: https://api.woshiguotao.cn"
    echo ""
    echo "常用命令："
    echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
    echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
    echo ""
    echo "配置文件位置："
    echo "  应用目录: /var/www/gopen"
    echo "  环境变量: /var/www/gopen/server/.env"
    echo "  Nginx 配置: /etc/nginx/conf.d/gopen.conf"
    echo ""
    echo "后续步骤："
    echo "  1. 在阿里云控制台配置域名解析 (A记录指向服务器IP)"
    echo "  2. 申请 SSL 证书并配置 HTTPS"
    echo "  3. 测试访问 https://woshiguotao.cn"
    echo ""
}

# ============================================
# 主函数
# ============================================
main() {
    clear
    echo ""
    echo "================================"
    echo "  G open 智能创作助手"
    echo "  阿里云一键部署脚本"
    echo "================================"
    echo ""
    
    check_system
    install_docker
    install_docker_compose
    install_git
    clone_code
    configure_env
    configure_firewall
    build_docker
    start_services
    setup_ssl
    configure_nginx
    verify_deployment
    print_deployment_info
}

# 执行主函数
main
