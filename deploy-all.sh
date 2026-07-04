#!/bin/bash

# ============================================
# G open 一键部署脚本 - 阿里云函数计算
# ============================================

set -e

echo "================================================"
echo "   G open 智能创作助手 - 一键部署到阿里云"
echo "================================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装 Node.js${NC}"
    echo "请先安装 Node.js: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ Node.js 已安装: $(node -v)${NC}"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "正在安装 pnpm..."
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm 已安装: $(pnpm -v)${NC}"

# 检查 Serverless Devs
if ! command -v s &> /dev/null; then
    echo "正在安装 Serverless Devs..."
    npm install -g @serverless-devs/s
fi
echo -e "${GREEN}✓ Serverless Devs 已安装${NC}"

# 检查是否已配置阿里云密钥
echo ""
echo -e "${YELLOW}检查阿里云密钥配置...${NC}"
if [ ! -f ~/.s/access.yaml ]; then
    echo ""
    echo -e "${YELLOW}请配置阿里云密钥：${NC}"
    echo "1. 打开阿里云控制台: https://ram.console.aliyun.com/manage/ak"
    echo "2. 创建 AccessKey（如果还没有）"
    echo "3. 运行以下命令配置："
    echo ""
    echo "   s config add"
    echo ""
    echo "4. 输入："
    echo "   - AccountID: 在控制台右上角查看"
    echo "   - AccessKeyID: 您的 AccessKey ID"
    echo "   - AccessKeySecret: 您的 AccessKey Secret"
    echo ""
    read -p "配置完成后按回车继续..."
fi

# 克隆代码
echo ""
echo "正在克隆代码..."
if [ ! -d "gopen" ]; then
    git clone https://github.com/a912454361/gopen.git
fi
cd gopen/server

# 安装依赖
echo ""
echo "正在安装依赖..."
pnpm install

# 构建
echo ""
echo "正在构建..."
pnpm run build

# 部署
echo ""
echo "正在部署到阿里云函数计算..."
s deploy -y

echo ""
echo "================================================"
echo -e "${GREEN}   部署完成！${NC}"
echo "================================================"
echo ""
echo "下一步："
echo "1. 打开 https://fc.console.aliyun.com"
echo "2. 找到 gopen-api 函数"
echo "3. 配置环境变量："
echo ""
echo "   SUPABASE_URL=你的supabase地址"
echo "   SUPABASE_ANON_KEY=你的key"
echo "   DATABASE_URL=你的数据库连接"
echo ""
echo "4. 获取 API 地址后告诉开发者更新前端"
