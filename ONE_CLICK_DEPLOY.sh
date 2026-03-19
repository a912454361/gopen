#!/bin/bash
# G Open - 一键部署终极脚本
# 这是一个只需要复制粘贴一次的脚本

set -e

echo ""
echo "========================================="
echo "  🚀 G Open - 一键部署"
echo "========================================="
echo ""

# 检查 root
if [ "$EUID" -ne 0 ]; then 
  echo "请使用 root 用户运行！"
  echo "执行：sudo su"
  exit 1
fi

# 步骤 1: 解除宝塔限制（如果存在）
echo "[1/8] 检查宝塔..."
if command -v bt &> /dev/null; then
    echo "✓ 检测到宝塔，正在解除 IP 限制..."
    bt 13 <<EOF
y
EOF
    sleep 2
fi

# 步骤 2: 安装环境
echo "[2/8] 安装环境依赖..."
yum update -y 2>/dev/null || true

if ! command -v node &> /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
    yum install -y nginx
fi

# 步骤 3: 进入项目目录
echo "[3/8] 检查项目..."
cd /workspace/projects || {
    echo "✗ 项目目录不存在！"
    exit 1
}

# 步骤 4: 安装依赖
echo "[4/8] 安装项目依赖..."
cd /workspace/projects/server
pnpm install

cd /workspace/projects/client
pnpm install

# 步骤 5: 构建项目
echo "[5/8] 构建项目..."
cd /workspace/projects/server
pnpm run build

cd /workspace/projects/client
npx expo export --platform web 2>/dev/null || true

# 步骤 6: 配置 Nginx
echo "[6/8] 配置 Nginx..."
cat > /etc/nginx/conf.d/gopen.conf << 'NGINX_CONF
server {
    listen 80;
    server_name woshiguotao.cn www.woshiguotao.cn;
    
    location / {
        root /workspace/projects/client/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:9091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX_CONF

# 步骤 7: 启动服务
echo "[7/8] 启动服务..."
cd /workspace/projects/server
pm2 delete gopen-server 2>/dev/null || true
pm2 start npm --name "gopen-server" -- start
sleep 3

systemctl restart nginx
systemctl enable nginx

# 步骤 8: 检查状态
echo "[8/8] 检查服务..."
echo ""

if pm2 list | grep -q "gopen-server.*online"; then
    echo "✓ 后端服务运行正常"
else
    echo "✗ 后端服务可能有问题"
fi

if systemctl is-active --quiet nginx; then
    echo "✓ Nginx 运行正常"
fi

echo ""
echo "========================================="
echo "  🎉 部署完成！"
echo "========================================="
echo ""
echo "访问地址："
echo "  前端：http://woshiguotao.cn"
echo "  后端：http://woshiguotao.cn/api/v1/health"
echo ""
echo "管理后台："
echo "  http://woshiguotao.cn/admin"
echo ""
echo "常用命令："
echo "  查看日志：pm2 logs gopen-server"
echo "  重启服务：pm2 restart gopen-server"
echo ""
