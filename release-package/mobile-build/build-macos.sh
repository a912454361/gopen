#!/bin/bash
# macOS 应用构建脚本 (需要 Mac)

set -e

echo "=========================================="
echo "  G open - macOS App 构建"
echo "=========================================="
echo ""

# 检测操作系统
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "[错误] macOS 构建需要 macOS 系统"
    echo "请使用 EAS 云端构建: eas build --platform mac"
    exit 1
fi

cd /workspace/projects/client

echo "[1/3] 导出 Web 版本..."
npx expo export --platform web --output-dir dist

echo "[2/3] 创建 macOS 应用包..."
mkdir -p /workspace/projects/release-package/macos/G\ open.app/Contents/MacOS
mkdir -p /workspace/projects/release-package/macos/G\ open.app/Contents/Resources

# 复制 Web 资源
cp -r dist/* /workspace/projects/release-package/macos/G\ open.app/Contents/Resources/

echo "[3/3] 创建 Info.plist..."
cat > /workspace/projects/release-package/macos/G\ open.app/Contents/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>G open</string>
    <key>CFBundleDisplayName</key>
    <string>G open</string>
    <key>CFBundleIdentifier</key>
    <string>com.gopen.app</string>
    <key>CFBundleVersion</key>
    <string>1.0.1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.1</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
</dict>
</plist>
EOF

echo ""
echo "=========================================="
echo "  macOS App 构建完成！"
echo "=========================================="
echo "文件: /workspace/projects/release-package/macos/G open.app"
