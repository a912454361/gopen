#!/bin/bash
# G open 智能创作助手 - 一键部署脚本
# 使用方法: bash deploy-production.sh

set -e

echo "=========================================="
echo "  G open 智能创作助手 - 部署脚本"
echo "=========================================="
echo ""

# 检查构建产物
if [ ! -d "client/dist" ]; then
    echo "❌ 前端构建产物不存在，请先运行构建"
    echo "   cd client && npx expo export --platform web"
    exit 1
fi

if [ ! -f "server/dist/index.js" ]; then
    echo "❌ 后端构建产物不存在，请先运行构建"
    echo "   cd server && pnpm run build"
    exit 1
fi

echo "✅ 构建产物检查通过"
echo ""

# 部署选项
echo "请选择部署平台:"
echo "  1) Netlify (前端静态托管)"
echo "  2) Vercel (前端静态托管)"
echo "  3) 两者都部署"
echo ""
read -p "请输入选项 (1/2/3): " choice

case $choice in
    1|3)
        echo ""
        echo "=========================================="
        echo "  部署到 Netlify"
        echo "=========================================="
        
        # 检查 Netlify CLI
        if ! command -v netlify &> /dev/null; then
            echo "安装 Netlify CLI..."
            npm install -g netlify-cli
        fi
        
        # 检查登录状态
        if ! netlify status &> /dev/null; then
            echo ""
            echo "⚠️  需要登录 Netlify"
            echo "   运行: netlify login"
            echo "   然后重新执行此脚本"
            netlify login
        fi
        
        # 部署
        echo "开始部署..."
        cd client
        netlify deploy --prod --dir=dist --create-site
        cd ..
        echo "✅ Netlify 部署完成"
        ;;
esac

case $choice in
    2|3)
        echo ""
        echo "=========================================="
        echo "  部署到 Vercel"
        echo "=========================================="
        
        # 检查 Vercel CLI
        if ! command -v vercel &> /dev/null; then
            echo "安装 Vercel CLI..."
            npm install -g vercel
        fi
        
        # 检查登录状态
        if ! vercel whoami &> /dev/null; then
            echo ""
            echo "⚠️  需要登录 Vercel"
            echo "   运行: vercel login"
            echo "   然后重新执行此脚本"
            vercel login
        fi
        
        # 部署
        echo "开始部署..."
        cd client
        vercel --prod
        cd ..
        echo "✅ Vercel 部署完成"
        ;;
esac

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "📋 后续步骤:"
echo "   1. 配置自定义域名 (可选)"
echo "   2. 设置环境变量 (如 API 地址)"
echo "   3. 测试应用功能"
echo ""
echo "📚 文档: DEPLOY_READY.md"
