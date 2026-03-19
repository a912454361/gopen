#!/bin/bash
# 环境准备脚本

echo "========================================="
echo "  环境准备"
echo "========================================="
echo ""

# 更新系统
echo "[1/5] 更新系统..."
yum update -y 2>/dev/null || apt-get update -y 2>/dev/null

# 安装 Node.js
echo "[2/5] 安装 Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

echo "✓ Node.js: $(node --version)"

# 安装 pnpm
echo "[3/5] 安装 pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
echo "✓ pnpm: $(pnpm --version)"

# 安装 PM2
echo "[4/5] 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo "✓ PM2: $(pm2 --version)"

# 安装 Nginx
echo "[5/5] 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    yum install -y nginx 2>/dev/null || apt-get install -y nginx 2>/dev/null
fi
echo "✓ Nginx: $(nginx -v 2>&1)"

echo ""
echo "========================================="
echo "  ✅ 环境准备完成！"
echo "========================================="
