#!/bin/bash

echo "========================================"
echo "  G open 官网部署脚本"
echo "========================================"
echo ""

# 检查是否安装了必要的工具
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 未安装"
        return 1
    else
        echo "✅ $1 已安装"
        return 0
    fi
}

echo "检查环境..."
check_tool "vercel"
check_tool "netlify"
check_tool "git"
echo ""

echo "请选择部署平台:"
echo "1. Vercel (推荐)"
echo "2. Netlify"
echo "3. GitHub Pages"
echo "4. 仅查看域名解析指南"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "部署到 Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
            echo ""
            echo "✅ 部署完成！"
            echo ""
            echo "请按以下步骤添加自定义域名:"
            echo "1. 访问 https://vercel.com/dashboard"
            echo "2. 选择项目 → Settings → Domains"
            echo "3. 添加 woshiguotao.cn"
            echo ""
            echo "域名解析配置:"
            echo "  A记录: @ → 76.76.21.21"
            echo "  CNAME: www → cname.vercel-dns.com"
        else
            echo "❌ 请先安装 Vercel CLI: npm i -g vercel"
        fi
        ;;
    2)
        echo ""
        echo "部署到 Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod
            echo ""
            echo "✅ 部署完成！"
            echo ""
            echo "请按以下步骤添加自定义域名:"
            echo "1. 访问 https://app.netlify.com"
            echo "2. Site settings → Domain management"
            echo "3. 添加 woshiguotao.cn"
            echo ""
            echo "域名解析配置:"
            echo "  A记录: @ → 75.2.60.5"
            echo "  CNAME: www → [你的站点名].netlify.app"
        else
            echo "❌ 请先安装 Netlify CLI: npm i -g netlify-cli"
        fi
        ;;
    3)
        echo ""
        echo "部署到 GitHub Pages..."
        if [ -d ".git" ]; then
            echo "Git 仓库已存在"
        else
            git init
            echo "已初始化 Git 仓库"
        fi
        git add .
        git commit -m "Deploy website"
        echo ""
        echo "请按以下步骤完成部署:"
        echo "1. 创建 GitHub 仓库"
        echo "2. git remote add origin https://github.com/你的用户名/gopen-website.git"
        echo "3. git push -u origin main"
        echo "4. 仓库 Settings → Pages → 选择 main 分支"
        echo ""
        echo "域名解析配置:"
        echo "  A记录: @ → 185.199.108.153"
        echo "  A记录: @ → 185.199.109.153"
        echo "  A记录: @ → 185.199.110.153"
        echo "  A记录: @ → 185.199.111.153"
        echo "  CNAME: www → 你的用户名.github.io"
        ;;
    4)
        echo ""
        echo "========================================"
        echo "  域名解析指南 (woshiguotao.cn)"
        echo "========================================"
        echo ""
        echo "请在域名服务商（阿里云/腾讯云等）添加以下解析记录:"
        echo ""
        echo "【Vercel 解析配置】"
        echo "  A记录: @ → 76.76.21.21"
        echo "  CNAME: www → cname.vercel-dns.com"
        echo ""
        echo "【Netlify 解析配置】"
        echo "  A记录: @ → 75.2.60.5"
        echo "  CNAME: www → [站点名].netlify.app"
        echo ""
        echo "【GitHub Pages 解析配置】"
        echo "  A记录: @ → 185.199.108.153"
        echo "  A记录: @ → 185.199.109.153"
        echo "  A记录: @ → 185.199.110.153"
        echo "  A记录: @ → 185.199.111.153"
        echo "  CNAME: www → [用户名].github.io"
        echo ""
        ;;
    *)
        echo "无效选项"
        ;;
esac
