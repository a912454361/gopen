#!/bin/bash
# Android 本地构建脚本

set -e

echo "=========================================="
echo "  G open - Android APK 构建"
echo "=========================================="
echo ""

cd /workspace/projects/client

# 检查 Java
if ! command -v java &> /dev/null; then
    echo "[错误] 未安装 Java JDK 17"
    echo "请安装: brew install openjdk@17 或 apt install openjdk-17-jdk"
    exit 1
fi

# 检查 ANDROID_HOME
if [ -z "$ANDROID_HOME" ]; then
    echo "[警告] ANDROID_HOME 未设置"
    echo "请设置: export ANDROID_HOME=$HOME/Android/Sdk"
fi

echo "[1/4] 清理旧构建..."
rm -rf android

echo "[2/4] 生成 Android 项目..."
npx expo prebuild --platform android --clean

echo "[3/4] 构建 Release APK..."
cd android
./gradlew assembleRelease

echo "[4/4] 复制 APK..."
cp app/build/outputs/apk/release/app-release.apk \
   /workspace/projects/release-package/android/gopen-android-v1.0.1.apk

echo ""
echo "=========================================="
echo "  APK 构建完成！"
echo "=========================================="
echo "文件: /workspace/projects/release-package/android/gopen-android-v1.0.1.apk"
