#!/bin/bash
# G Open 启动脚本
# 在代码上传后执行

set -e

echo "=========================================="
echo "   G Open 服务启动"
echo "=========================================="

cd /var/www/gopen

# 安装并构建后端
echo "[1/4] 构建后端..."
cd /var/www/gopen/server
pnpm install
pnpm build

# 安装并构建前端
echo "[2/4] 构建前端..."
cd /var/www/gopen/client
pnpm install
npx expo export --platform web

# 启动后端服务
echo "[3/4] 启动后端服务..."
cd /var/www/gopen/server
pm2 delete gopen-server 2>/dev/null || true
pm2 start dist/index.js --name gopen-server
pm2 save
pm2 startup

# 重启 Nginx
echo "[4/4] 重启 Nginx..."
systemctl restart nginx

echo ""
echo "=========================================="
echo "   部署完成！"
echo "=========================================="
echo ""
echo "访问地址："
echo "  应用首页: http://114.55.115.39"
echo "  管理后台: http://114.55.115.39/admin?key=gopen_admin_2024"
echo ""
echo "常用命令："
echo "  查看日志: pm2 logs gopen-server"
echo "  重启服务: pm2 restart gopen-server"
echo "  停止服务: pm2 stop gopen-server"
echo ""
