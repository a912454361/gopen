#!/bin/bash

# 万古长夜游戏平台 - 一键启动脚本

echo "=================================="
echo "  万古长夜 - 启动中..."
echo "=================================="

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "端口 $port 已被占用，正在停止旧服务..."
        kill -9 $(lsof -t -i:$port) 2>/dev/null
        sleep 1
    fi
}

# 停止旧服务
check_port 6091
check_port 6001

# 启动后端服务
echo ">>> 启动后端服务 (端口 6091)..."
cd /workspace/projects/wangu-game/server
npm run dev &
BACKEND_PID=$!
echo "后端 PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:6091/api/v1/health > /dev/null; then
    echo "✓ 后端服务启动成功"
else
    echo "✗ 后端服务启动失败，请检查日志"
    exit 1
fi

# 启动前端服务
echo ">>> 启动前端服务 (端口 6001)..."
cd /workspace/projects/wangu-game/client
npm run web:port &
FRONTEND_PID=$!
echo "前端 PID: $FRONTEND_PID"

# 等待前端启动
sleep 5

echo ""
echo "=================================="
echo "  🎮 万古长夜 启动完成！"
echo "=================================="
echo ""
echo "  前端: http://localhost:6001"
echo "  后端: http://localhost:6091/api/v1"
echo ""
echo "  按 Ctrl+C 停止服务"
echo ""

# 等待中断信号
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

wait
