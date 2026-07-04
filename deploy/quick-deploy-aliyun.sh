#!/bin/bash

# ============================================
# G open 快速部署 - 复制此脚本到服务器执行
# ============================================
# 服务器: 8.136.229.243
# 域名: woshiguotao.cn
# ============================================

set -e

echo "================================"
echo "  G open 阿里云快速部署"
echo "================================"
echo ""

# 1. 安装 Docker
echo "[1/6] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
    systemctl start docker
    systemctl enable docker
    
    # 配置镜像加速
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
    "registry-mirrors": [
        "https://registry.cn-hangzhou.aliyuncs.com"
    ]
}
EOF
    systemctl restart docker
fi
echo "✓ Docker 安装完成"

# 2. 安装 Docker Compose
echo "[2/6] 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi
echo "✓ Docker Compose 安装完成"

# 3. 克隆代码
echo "[3/6] 克隆代码..."
mkdir -p /var/www/gopen
cd /var/www/gopen
if [ ! -d ".git" ]; then
    git clone https://gitee.com/a912454361/gopen.git .
fi
echo "✓ 代码克隆完成"

# 4. 配置环境变量
echo "[4/6] 配置环境变量..."
if [ ! -f "server/.env" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    cat > server/.env << EOF
# 服务配置
PORT=9091
NODE_ENV=production

# JWT 密钥
JWT_SECRET=$JWT_SECRET

# 管理员密钥
ADMIN_KEY=GtAdmin2024SecretKey8888

# 数据库 (使用 Supabase)
DATABASE_URL=你的Supabase数据库URL

# 对象存储
OSS_ACCESS_KEY=
OSS_SECRET_KEY=
OSS_BUCKET=
OSS_REGION=oss-cn-hangzhou
EOF
    echo ""
    echo "⚠️  请编辑 /var/www/gopen/server/.env 填写数据库等信息"
fi
echo "✓ 环境变量配置完成"

# 5. 安装 Nginx
echo "[5/6] 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    yum install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi
echo "✓ Nginx 安装完成"

# 6. 启动 Docker 服务
echo "[6/6] 启动服务..."
docker-compose -f docker-compose.prod.yml up -d --build
echo "✓ 服务启动完成"

# 创建 SSL 目录
mkdir -p /var/www/gopen/deploy/ssl

# 配置防火墙
echo "配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    systemctl start firewalld 2>/dev/null || true
    firewall-cmd --permanent --add-port=80/tcp
    firewall-cmd --permanent --add-port=443/tcp
    firewall-cmd --permanent --add-port=5000/tcp
    firewall-cmd --permanent --add-port=9091/tcp
    firewall-cmd --reload
fi

echo ""
echo "================================"
echo "  部署完成！"
echo "================================"
echo ""
echo "访问地址:"
echo "  前端: http://8.136.229.243:5000"
echo "  API:  http://8.136.229.243:9091/api/v1/health"
echo ""
echo "后续步骤:"
echo "  1. 配置域名解析 (DNS A记录指向 8.136.229.243)"
echo "  2. 申请 SSL 证书"
echo "  3. 配置 Nginx 反向代理"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
echo ""
