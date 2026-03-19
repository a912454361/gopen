#!/bin/bash
# 服务启动脚本

echo "========================================="
echo "  启动服务"
echo "========================================="
echo ""

# 启动后端
echo "[1/3] 启动后端服务..."
cd /workspace/projects/server
pm2 delete gopen-server 2>/dev/null
pm2 start npm --name "gopen-server" -- start
sleep 3

if pm2 list | grep -q "gopen-server.*online"; then
    echo "✓ 后端服务启动成功"
else
    echo "✗ 后端服务启动失败"
    pm2 logs gopen-server --lines 20
    exit 1
fi

# 启动 Nginx
echo "[2/3] 启动 Nginx..."
systemctl restart nginx
sleep 2

if systemctl is-active --quiet nginx; then
    echo "✓ Nginx 启动成功"
else
    echo "✗ Nginx 启动失败"
    systemctl status nginx
    exit 1
fi

# 检查服务
echo "[3/3] 检查服务状态..."
echo ""
echo "后端服务："
pm2 list | grep gopen-server
echo ""
echo "Nginx 状态："
systemctl status nginx | head -3
echo ""

echo "========================================="
echo "  ✅ 服务启动完成！"
echo "========================================="
echo ""
echo "访问地址："
echo "  前端：http://localhost"
echo "  后端：http://localhost/api/v1/health"
echo ""
echo "管理后台："
echo "  http://localhost/admin"
echo ""
