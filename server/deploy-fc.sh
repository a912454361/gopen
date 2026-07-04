#!/bin/bash

# G open 后端部署脚本 - 阿里云函数计算 FC

echo "=========================================="
echo "  G open 后端部署 - 阿里云函数计算 FC"
echo "=========================================="

# 检查 s 工具
if ! command -v s &> /dev/null; then
    echo "正在安装 Serverless Devs..."
    npm install -g @serverless-devs/s
fi

# 检查是否已配置密钥
echo ""
echo "请确保已配置阿里云密钥："
echo "  s config add"
echo ""

# 安装依赖
echo "安装依赖..."
pnpm install

# 构建
echo "构建项目..."
pnpm run build

# 部署
echo "部署到阿里云 FC..."
s deploy

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 打开 https://fc.console.aliyun.com"
echo "2. 找到 gopen-api 函数"
echo "3. 配置环境变量（SUPABASE_URL 等）"
echo "4. 获取 API 地址"
