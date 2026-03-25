#!/bin/bash

echo "========================================"
echo "  一键部署到 GitHub Pages"
echo "========================================"
echo ""

# 配置
GITHUB_USER="a912454361"
REPO_NAME="gopen-website"

# 检查是否提供了 token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ 请设置 GITHUB_TOKEN 环境变量"
    echo ""
    echo "获取 Token 步骤:"
    echo "1. 访问 https://github.com/settings/tokens"
    echo "2. 点击 'Generate new token (classic)'"
    echo "3. 勾选 'repo' 权限"
    echo "4. 生成并复制 token"
    echo ""
    echo "然后运行:"
    echo "  export GITHUB_TOKEN='你的token'"
    echo "  ./deploy-github.sh"
    exit 1
fi

echo "✅ Token 已设置"

# 创建 GitHub 仓库
echo ""
echo "📦 创建 GitHub 仓库..."
curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"description\":\"G open 智能创作助手官网\",\"public\":true}" \
    || echo "仓库可能已存在，继续..."

# 配置 Git
cd "$(dirname "$0")"
git config user.email "$GITHUB_USER@users.noreply.github.com"
git config user.name "$GITHUB_USER"
git branch -M main

# 更新远程 URL（使用 token）
git remote set-url origin https://$GITHUB_TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git

# 提交并推送
echo ""
echo "📤 推送代码到 GitHub..."
git add .
git commit -m "Deploy G open website" 2>/dev/null || true
git push -u origin main --force

echo ""
echo "✅ 推送完成!"

# 启用 GitHub Pages
echo ""
echo "🌐 启用 GitHub Pages..."
curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/$GITHUB_USER/$REPO_NAME/pages \
    -d '{"source":{"branch":"main","path":"/"}}' \
    || echo "Pages 可能已启用"

echo ""
echo "========================================"
echo "  🎉 部署完成!"
echo "========================================"
echo ""
echo "访问地址:"
echo "  https://a912454361.github.io/$REPO_NAME"
echo ""
echo "下一步: 配置域名解析"
echo "  A记录: @ → 185.199.108.153"
echo "  A记录: @ → 185.199.109.153"
echo "  A记录: @ → 185.199.110.153"
echo "  A记录: @ → 185.199.111.153"
echo "  CNAME: www → a912454361.github.io"
echo ""
echo "配置后访问: https://woshiguotao.cn"
echo ""
