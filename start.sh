#!/bin/bash

echo "==========================================="
echo "  Gopen 登录系统 - 启动脚本"
echo "==========================================="
echo ""

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo "[X] 未检测到 Go 环境"
    echo ""
    echo "请先安装 Go 1.21 或更高版本:"
    echo "  https://golang.org/dl/"
    echo "  或使用: brew install go"
    exit 1
fi

echo "[✓] Go 已安装"
go version
echo ""

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "[!] 未找到 .env 文件，从示例创建..."
    cp .env.example .env
    echo "[✓] 已创建 .env 文件"
    echo "[!] 请编辑 .env 文件，配置 JWT_SECRET 和 OAuth 密钥"
    echo ""
fi

# 创建数据目录
mkdir -p data

# 安装依赖
echo "[*] 正在安装依赖..."
if ! go mod download; then
    echo "[X] 依赖安装失败"
    exit 1
fi
echo "[✓] 依赖安装完成"
echo ""

# 运行项目
echo "[*] 启动服务器..."
echo "[i] 访问 http://localhost:8080"
echo "[i] 按 Ctrl+C 停止服务器"
echo ""

go run cmd/main.go