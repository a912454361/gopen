#!/bin/bash

echo "========================================"
echo "   万古长夜 - 独立服务器启动"
echo "========================================"
echo

# 进入server目录
cd "$(dirname "$0")/server"

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo
        echo "[错误] 依赖安装失败！"
        echo "请确保已安装 Node.js 18 或更高版本"
        exit 1
    fi
fi

# 创建数据目录
mkdir -p data

echo "启动服务器..."
echo
npm run dev
