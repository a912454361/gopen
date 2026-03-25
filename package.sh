#!/bin/bash
# G open 智能创作助手 - Windows版本打包脚本
PROJECT_DIR="/workspace/projects"
ZIP_FILE="$PROJECT_DIR/release-package/gopen-windows-v1.0.0.zip"

cd "$PROJECT_DIR" || exit 1

# 创建输出目录
mkdir -p release-package

# 删除旧压缩包
rm -f "$ZIP_FILE"

echo "=========================================="
echo "G open 智能创作助手 v1.0.0 打包"
echo "=========================================="
echo ""

# 分批打包（降低资源占用）
echo "[1/8] 打包配置文件..."
zip -q "$ZIP_FILE" package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore .npmrc tsconfig.json app.json 2>/dev/null

echo "[2/8] 打包前端代码..."
cd client && zip -q -r "$ZIP_FILE" app screens components hooks contexts constants utils assets package.json tsconfig.json app.json 2>/dev/null; cd ..

echo "[3/8] 打包后端代码..."
cd server && zip -q -r "$ZIP_FILE" src package.json tsconfig.json 2>/dev/null; cd ..

echo "[4/8] 打包静态资源..."
zip -q -r "$ZIP_FILE" assets 2>/dev/null

echo "[5/8] 打包脚本..."
zip -q -r "$ZIP_FILE" .cozeproj scripts 2>/dev/null

echo "[6/8] 打包文档..."
zip -q "$ZIP_FILE" README.md BUILD_WINDOWS.md 2>/dev/null

echo "[7/8] 打包部署配置..."
zip -q -r "$ZIP_FILE" android docs 2>/dev/null

echo "[8/8] 打包其他资源..."
zip -q -r "$ZIP_FILE" ue5-scripts tools patches 2>/dev/null

echo ""
echo "=========================================="
if [ -f "$ZIP_FILE" ]; then
  SIZE=$(du -h "$ZIP_FILE" | cut -f1)
  echo "✅ 打包完成！"
  echo "   文件: $ZIP_FILE"
  echo "   大小: $SIZE"
else
  echo "❌ 打包失败！"
fi
echo "=========================================="
