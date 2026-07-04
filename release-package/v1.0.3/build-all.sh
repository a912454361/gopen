#!/bin/bash

echo "========================================"
echo "  G open v1.0.3 全平台构建脚本"
echo "========================================"
echo ""

VERSION="1.0.3"
RELEASE_DIR="/workspace/projects/release-package/v1.0.3"

# 创建输出目录
mkdir -p "$RELEASE_DIR/output"

# 检查是否在项目目录
if [ ! -d "/workspace/projects/client" ]; then
    echo "错误: 未找到 client 目录"
    exit 1
fi

cd /workspace/projects

echo "[1/6] 更新版本号..."
# 更新 package.json 版本
cd client
if [ -f "package.json" ]; then
    sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
fi
cd ..

echo "[2/6] 准备 Windows 包..."
# 复制 Windows 安装程序
cp -r "$RELEASE_DIR/windows" "$RELEASE_DIR/output/gopen-windows-v$VERSION"
# 复制客户端和服务端代码
cp -r client "$RELEASE_DIR/output/gopen-windows-v$VERSION/client"
cp -r server "$RELEASE_DIR/output/gopen-windows-v$VERSION/server"
# 复制配置文件
cp -r .cozeproj "$RELEASE_DIR/output/gopen-windows-v$VERSION/" 2>/dev/null || true
cp package.json "$RELEASE_DIR/output/gopen-windows-v$VERSION/" 2>/dev/null || true
# 打包
cd "$RELEASE_DIR/output"
tar -czvf "gopen-windows-v$VERSION.tar.gz" "gopen-windows-v$VERSION"
rm -rf "gopen-windows-v$VERSION"
echo "✅ Windows 包已创建: gopen-windows-v$VERSION.tar.gz"

echo "[3/6] 准备 Android 包..."
mkdir -p "$RELEASE_DIR/output/gopen-android-v$VERSION"
cp -r client "$RELEASE_DIR/output/gopen-android-v$VERSION/client"
cp -r server "$RELEASE_DIR/output/gopen-android-v$VERSION/server"
cp -r "$RELEASE_DIR/android/Android构建指南.md" "$RELEASE_DIR/output/gopen-android-v$VERSION/"
cd "$RELEASE_DIR/output"
tar -czvf "gopen-android-v$VERSION.tar.gz" "gopen-android-v$VERSION"
rm -rf "gopen-android-v$VERSION"
echo "✅ Android 包已创建: gopen-android-v$VERSION.tar.gz"

echo "[4/6] 准备 iOS 包..."
mkdir -p "$RELEASE_DIR/output/gopen-ios-v$VERSION"
cp -r client "$RELEASE_DIR/output/gopen-ios-v$VERSION/client"
cp -r server "$RELEASE_DIR/output/gopen-ios-v$VERSION/server"
cp -r "$RELEASE_DIR/ios/iOS构建指南.md" "$RELEASE_DIR/output/gopen-ios-v$VERSION/"
cd "$RELEASE_DIR/output"
tar -czvf "gopen-ios-v$VERSION.tar.gz" "gopen-ios-v$VERSION"
rm -rf "gopen-ios-v$VERSION"
echo "✅ iOS 包已创建: gopen-ios-v$VERSION.tar.gz"

echo "[5/6] 准备 macOS 包..."
mkdir -p "$RELEASE_DIR/output/gopen-macos-v$VERSION"
cp -r client "$RELEASE_DIR/output/gopen-macos-v$VERSION/client"
cp -r server "$RELEASE_DIR/output/gopen-macos-v$VERSION/server"
cp -r "$RELEASE_DIR/macos/macOS构建指南.md" "$RELEASE_DIR/output/gopen-macos-v$VERSION/"
cd "$RELEASE_DIR/output"
tar -czvf "gopen-macos-v$VERSION.tar.gz" "gopen-macos-v$VERSION"
rm -rf "gopen-macos-v$VERSION"
echo "✅ macOS 包已创建: gopen-macos-v$VERSION.tar.gz"

echo "[6/6] 准备 Linux 包..."
mkdir -p "$RELEASE_DIR/output/gopen-linux-v$VERSION"
cp -r client "$RELEASE_DIR/output/gopen-linux-v$VERSION/client"
cp -r server "$RELEASE_DIR/output/gopen-linux-v$VERSION/server"
cp -r "$RELEASE_DIR/linux/Linux构建指南.md" "$RELEASE_DIR/output/gopen-linux-v$VERSION/"
cd "$RELEASE_DIR/output"
tar -czvf "gopen-linux-v$VERSION.tar.gz" "gopen-linux-v$VERSION"
rm -rf "gopen-linux-v$VERSION"
echo "✅ Linux 包已创建: gopen-linux-v$VERSION.tar.gz"

echo ""
echo "========================================"
echo "  构建完成！"
echo "========================================"
echo ""
echo "输出目录: $RELEASE_DIR/output"
ls -la "$RELEASE_DIR/output"
echo ""
echo "各平台安装包:"
echo "  - Windows: gopen-windows-v$VERSION.tar.gz"
echo "  - Android: gopen-android-v$VERSION.tar.gz"
echo "  - iOS:     gopen-ios-v$VERSION.tar.gz"
echo "  - macOS:   gopen-macos-v$VERSION.tar.gz"
echo "  - Linux:   gopen-linux-v$VERSION.tar.gz"
echo ""
