#!/bin/bash
# G open 智能创作助手 - 全平台构建脚本

set -e

VERSION="1.0.1"
PROJECT_DIR="/workspace/projects"
CLIENT_DIR="$PROJECT_DIR/client"
OUTPUT_DIR="$PROJECT_DIR/release-package"

echo "=========================================="
echo "  G open 智能创作助手 v$VERSION"
echo "  全平台构建脚本"
echo "=========================================="
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR/android"
mkdir -p "$OUTPUT_DIR/ios"
mkdir -p "$OUTPUT_DIR/macos"

cd "$CLIENT_DIR"

# 检查 EAS CLI
if ! command -v eas &> /dev/null; then
    echo "[提示] 正在安装 EAS CLI..."
    npm install -g eas-cli
fi

echo ""
echo "请选择构建方式:"
echo "  1) EAS 云端构建 (推荐)"
echo "  2) 本地构建 (需要对应环境)"
echo "  3) 仅生成配置文件"
echo ""
read -p "请输入选项 (1/2/3): " choice

case $choice in
    1)
        echo ""
        echo "=========================================="
        echo "  EAS 云端构建"
        echo "=========================================="
        
        # 检查登录状态
        if ! eas whoami &> /dev/null; then
            echo "[提示] 请登录 Expo 账号"
            eas login
        fi
        
        echo ""
        echo "[1/3] 构建 Android APK..."
        eas build --platform android --profile preview --non-interactive || echo "Android 构建失败"
        
        echo ""
        echo "[2/3] 构建 iOS IPA..."
        eas build --platform ios --profile preview --non-interactive || echo "iOS 构建失败"
        
        echo ""
        echo "[3/3] 构建 macOS App..."
        eas build --platform mac --profile production --non-interactive || echo "macOS 构建失败"
        
        echo ""
        echo "构建完成！请访问 Expo 控制台下载安装包:"
        echo "https://expo.dev/accounts/[your-account]/projects/gopen/builds"
        ;;
        
    2)
        echo ""
        echo "=========================================="
        echo "  本地构建"
        echo "=========================================="
        
        echo ""
        echo "[1/3] 生成 Android 项目..."
        npx expo prebuild --platform android --clean || echo "Android 预构建失败"
        
        echo ""
        echo "[2/3] 生成 iOS 项目..."
        npx expo prebuild --platform ios --clean || echo "iOS 预构建失败"
        
        echo ""
        echo "本地项目已生成，请手动构建:"
        echo "  Android: cd android && ./gradlew assembleRelease"
        echo "  iOS: 打开 ios/gopen.xcworkspace 使用 Xcode 构建"
        ;;
        
    3)
        echo ""
        echo "=========================================="
        echo "  生成配置文件"
        echo "=========================================="
        
        echo "配置文件已存在于:"
        echo "  - app.config.ts"
        echo "  - eas.json"
        ;;
        
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "  构建流程结束"
echo "=========================================="
