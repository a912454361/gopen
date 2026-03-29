#!/bin/bash

# 万古长夜 - 独立服务器启动脚本
# 数据库: SQLite (本地文件)
# 端口: 18789

echo "========================================"
echo "   万古长夜 - 独立服务器启动"
echo "========================================"

# 进入server目录
cd "$(dirname "$0")/server"

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    pnpm install
fi

# 创建数据目录
mkdir -p data

# 启动服务器
echo "启动服务器..."
NODE_ENV=development node --experimental-specifier-resolution=node dist/index-independent.js
