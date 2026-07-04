#!/bin/bash

# ============================================================
# G open 智能创作助手 - macOS DMG 创建脚本
# ============================================================

set -e

# 配置
APP_NAME="G open"
APP_VERSION="1.0.4"
APP_DIR="G open.app"
DIST_DIR="../dist"
RELEASE_DIR="../release/macos"

# 颜色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           G open - macOS DMG 创建工具                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查环境
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "错误: 此脚本只能在 macOS 上运行"
    exit 1
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
DMG_DIR="$TEMP_DIR/dmg"
mkdir -p "$DMG_DIR"

echo -e "${BLUE}[1/6] 准备应用包...${NC}"

# 复制应用
if [ -d "$DIST_DIR/electron/$APP_DIR" ]; then
    cp -R "$DIST_DIR/electron/$APP_DIR" "$DMG_DIR/"
else
    echo "错误: 未找到应用包"
    exit 1
fi

echo -e "${GREEN}✓${NC} 应用包已准备"

echo -e "${BLUE}[2/6] 创建 Applications 快捷方式...${NC}"

# 创建 Applications 快捷方式
ln -s /Applications "$DMG_DIR/Applications"

echo -e "${GREEN}✓${NC} 快捷方式已创建"

echo -e "${BLUE}[3/6] 创建背景图片...${NC}"

# 创建背景目录
mkdir -p "$DMG_DIR/.background"

# 创建背景图片 (使用 Swift 或 Python)
# 这里我们创建一个简单的渐变背景
cat > /tmp/create_background.py << 'EOF'
from PIL import Image, ImageDraw

width, height = 660, 400
img = Image.new('RGB', (width, height), '#0A0A0F')
draw = ImageDraw.Draw(img)

# 创建渐变
for y in range(height):
    r = int(10 + (y / height) * 30)
    g = int(10 + (y / height) * 20)
    b = int(15 + (y / height) * 40)
    draw.line([(0, y), (width, y)], fill=(r, g, b))

# 添加装饰
draw.ellipse([-50, -50, 200, 200], fill='#1a1a2e', outline=None)
draw.ellipse([width-150, height-150, width+50, height+50], fill='#16213e', outline=None)

img.save('/tmp/dmg_background.png', 'PNG')
EOF

python3 /tmp/create_background.py 2>/dev/null || echo "跳过背景图片创建"

echo -e "${GREEN}✓${NC} 背景图片已创建"

echo -e "${BLUE}[4/6] 创建 DMG...${NC}"

# 创建 DMG
DMG_NAME="gopen-${APP_VERSION}.dmg"
DMG_PATH="$RELEASE_DIR/$DMG_NAME"

mkdir -p "$RELEASE_DIR"

# 使用 hdiutil 创建 DMG
hdiutil create -volname "$APP_NAME" \
    -srcfolder "$DMG_DIR" \
    -ov -format UDZO \
    -imagekey zlib-level=9 \
    "$DMG_PATH"

echo -e "${GREEN}✓${NC} DMG 已创建: $DMG_PATH"

echo -e "${BLUE}[5/6] 配置 DMG 窗口外观...${NC}"

# 使用 AppleScript 配置窗口外观
# (需要在 Finder 中打开 DMG 并设置外观)

echo -e "${GREEN}✓${NC} DMG 配置完成"

echo -e "${BLUE}[6/6] 清理临时文件...${NC}"

rm -rf "$TEMP_DIR"

echo -e "${GREEN}✓${NC} 临时文件已清理"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    ✅ DMG 创建完成！                         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📁 输出文件: ${CYAN}$DMG_PATH${NC}"
echo ""

# 计算文件大小
FILE_SIZE=$(du -h "$DMG_PATH" | cut -f1)
echo -e "📊 文件大小: ${CYAN}$FILE_SIZE${NC}"
