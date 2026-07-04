#!/bin/bash
# iOS 本地构建脚本 (需要 Mac)

set -e

echo "=========================================="
echo "  G open - iOS IPA 构建"
echo "=========================================="
echo ""

# 检测操作系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "[错误] iOS 构建需要 macOS 系统"
    echo "请使用 EAS 云端构建: eas build --platform ios"
    exit 1
fi

cd /workspace/projects/client

# 检查 Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "[错误] 未安装 Xcode"
    echo "请从 App Store 安装 Xcode"
    exit 1
fi

echo "[1/4] 清理旧构建..."
rm -rf ios

echo "[2/4] 生成 iOS 项目..."
npx expo prebuild --platform ios --clean

echo "[3/4] 构建 iOS Archive..."
cd ios
xcodebuild -workspace gopen.xcworkspace \
           -scheme gopen \
           -configuration Release \
           -archivePath build/gopen.xcarchive \
           archive

echo "[4/4] 导出 IPA..."
xcodebuild -exportArchive \
           -archivePath build/gopen.xcarchive \
           -exportPath /workspace/projects/release-package/ios \
           -exportOptionsPlist ExportOptions.plist

echo ""
echo "=========================================="
echo "  IPA 构建完成！"
echo "=========================================="
echo "文件: /workspace/projects/release-package/ios/gopen.ipa"
