#!/bin/bash
# 一键部署脚本 - G Open AI 创作助手
# 服务器: 114.55.115.39
# 域名: woshiguotao.cn

echo "========================================="
echo "  G Open - 一键部署脚本"
echo "========================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
  echo "请使用 root 用户运行此脚本！"
  echo "使用命令: sudo su"
  exit 1
fi

echo "[1/8] 检查系统...
echo "-----------------------------------------"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "✓ Node.js 已安装: $(node --version)"
else
    echo "✗ Node.js 未安装，正在安装..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs -y
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "✓ pnpm 已安装"
else
    echo "✗ pnpm 未安装，正在安装..."
    npm install -g pnpm -g
fi

# 检查 git
if ! command -v git &> /dev/null; then
    echo "✓ git 已安装"
else
    echo "✗ git 未安装，正在安装..."
    yum install git -y
fi

echo ""
echo "[2/8] 安装依赖...
echo "-----------------------------------------"

# 安装后端依赖
cd /workspace/projects/server
pnpm install

# 安装前端依赖
cd /workspace/projects/client
pnpm install

echo ""
echo "[3/8] 构建项目...
echo "-----------------------------------------"

# 构建后端
cd /workspace/projects/server
pnpm run build

# 构建前端
cd /workspace/projects/client
npx expo export --platform web

echo ""
echo "[4/8] 配置环境变量...
echo "-----------------------------------------"

# 检查 .env 文件
if [ ! -f /workspace/projects/server/.env ]; then
    echo "✓ .env 文件已存在"
else
    echo "✗ 创建 .env 文件..."
    cat > /workspace/projects/server/.env << 'EOF'
# 服务器配置
PORT=9091
NODE_ENV=production

# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 集成配置
INTEGRATION_CONFIG=your_integration_config

# 管理员密钥
ADMIN_API_KEY=gopen_admin_2024

# 前端 URL
FRONTEND_URL=https://woshiguotao.cn
EOF
    echo "✓ .env 文件已创建"
fi

echo ""
echo "[5/8] 配置 Nginx...
echo "-----------------------------------------"

# 检查 Nginx
if ! command -v nginx &> /dev/null; then
    echo "✗ Nginx 未安装，正在安装..."
    yum install nginx -y
fi

# 创建 Nginx 配置
cat > /etc/nginx/conf.d/gopen.conf << 'EOF'
server {
    listen 80;
    server_name woshiguotao.cn www.woshiguotao.cn;
    
    # 前端静态文件
    location / {
        root /workspace/projects/client/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:9091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "✓ Nginx 配置已创建"

echo ""
echo "[6/8] 配置 PM2 进程管理...
echo "-----------------------------------------"

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "✗ PM2 未安装，正在安装..."
    npm install pm2 -g
fi

# 启动后端服务
cd /workspace/projects/server
pm2 delete gopen-server 2>/dev/null
pm2 start npm --name "gopen-server" -- start

echo "✓ 后端服务已启动"

echo ""
echo "[7/8] 启动 Nginx...
echo "-----------------------------------------"

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx

echo "✓ Nginx 已重启"

echo ""
echo "[8/8] 检查服务状态...
echo "-----------------------------------------"

# 检查后端服务
if pm2 list | grep -q "gopen-server.*online"; then
    echo "✓ 后端服务运行正常"
else
    echo "✗ 后端服务启动失败，请检查日志"
fi

# 检查 Nginx
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx 运行正常"
else
    echo "✗ Nginx 启动失败，请检查配置"
fi

echo ""
echo "========================================="
echo "  🎉 部署完成！"
echo "========================================="
echo ""
echo "访问地址:"
echo "  前端: http://woshiguotao.cn"
echo "  后端: http://woshiguotao.cn/api"
echo ""
echo "管理后台:"
echo "  http://woshiguotao.cn/admin"
echo ""
echo "常用命令:"
echo "  查看日志: pm2 logs gopen-server"
echo "  重启服务: pm2 restart gopen-server"
echo "  停止服务: pm2 stop gopen-server"
echo "  Nginx 重启: systemctl restart nginx"
echo ""
