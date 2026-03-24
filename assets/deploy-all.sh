#!/bin/bash
# G open 全平台自动部署脚本

echo "=========================================="
echo "   G open 智能创作助手 - 全平台部署"
echo "=========================================="

# 进入项目目录
cd /workspace/projects/client

# 检查是否已登录
echo ""
echo "【步骤 1】登录 EAS"
echo "请输入以下信息："
echo "  邮箱: 873013856@qq.com"
echo "  密码: guo13816528465"
echo ""

# 登录
eas login

# 检查登录状态
echo ""
echo "【步骤 2】确认登录状态"
eas whoami

# 构建 Android APK
echo ""
echo "【步骤 3】构建 Android APK（约 5-10 分钟）"
eas build --platform android --profile preview

# 构建 iOS IPA（如果有 Apple 开发者账号）
echo ""
echo "【步骤 4】构建 iOS IPA（可选）"
echo "是否构建 iOS？(y/n)"
read -r build_ios
if [ "$build_ios" = "y" ]; then
    eas build --platform ios --profile production
fi

echo ""
echo "=========================================="
echo "   部署完成！"
echo "=========================================="
echo ""
echo "下载地址："
echo "  Android: https://expo.dev/accounts/[your-account]/projects/[project]/builds"
echo ""
