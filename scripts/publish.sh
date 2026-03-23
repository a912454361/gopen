#!/bin/bash

# 《剑破苍穹》微信小程序发布脚本
# 使用方法：bash scripts/publish.sh

echo "================================"
echo "《剑破苍穹》发布准备脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查项目目录
echo -e "${YELLOW}[1/6] 检查项目目录...${NC}"
if [ ! -d "miniprogram" ]; then
    echo -e "${RED}错误: miniprogram 目录不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 项目目录检查通过${NC}"
echo ""

# 检查必要文件
echo -e "${YELLOW}[2/6] 检查必要文件...${NC}"
required_files=(
    "miniprogram/app.json"
    "miniprogram/app.js"
    "miniprogram/project.config.json"
)
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}错误: $file 不存在${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ 必要文件检查通过${NC}"
echo ""

# 检查页面文件
echo -e "${YELLOW}[3/6] 检查页面文件...${NC}"
pages=$(grep -o '"pages/[^"]*"' miniprogram/app.json | sed 's/"//g' | sed 's/pages\///')
for page in $pages; do
    if [ ! -f "miniprogram/pages/${page}/${page##*/}.js" ]; then
        echo -e "${RED}警告: 页面 $page 文件不完整${NC}"
    fi
done
echo -e "${GREEN}✓ 页面文件检查完成${NC}"
echo ""

# 检查代码规范
echo -e "${YELLOW}[4/6] 检查代码规范...${NC}"
# 检查是否有console.log
console_count=$(grep -r "console\.log" miniprogram --include="*.js" | wc -l)
if [ "$console_count" -gt 0 ]; then
    echo -e "${YELLOW}警告: 发现 $console_count 处 console.log，建议清理${NC}"
else
    echo -e "${GREEN}✓ 无console.log调试代码${NC}"
fi

# 检查是否有TODO
todo_count=$(grep -r "TODO" miniprogram --include="*.js" | wc -l)
if [ "$todo_count" -gt 0 ]; then
    echo -e "${YELLOW}警告: 发现 $todo_count 处 TODO，建议处理${NC}"
else
    echo -e "${GREEN}✓ 无TODO未完成项${NC}"
fi
echo ""

# 检查图片资源
echo -e "${YELLOW}[5/6] 检查图片资源...${NC}"
image_count=$(find miniprogram -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | wc -l)
echo "图片资源数量: $image_count"

# 检查大图片
large_images=$(find miniprogram -name "*.png" -size +500k -o -name "*.jpg" -size +500k)
if [ -n "$large_images" ]; then
    echo -e "${YELLOW}警告: 发现大于500KB的图片，建议压缩${NC}"
    echo "$large_images"
else
    echo -e "${GREEN}✓ 图片大小合理${NC}"
fi
echo ""

# 生成发布清单
echo -e "${YELLOW}[6/6] 生成发布清单...${NC}"
echo ""
echo "================================"
echo "发布清单"
echo "================================"
echo ""
echo "📦 代码上传:"
echo "   1. 打开微信开发者工具"
echo "   2. 导入项目: miniprogram/"
echo "   3. 填写AppID"
echo "   4. 点击右上角「上传」"
echo "   5. 版本号: 1.0.0"
echo "   6. 备注: 首发版本 - 横屏3D粒子仙侠游戏"
echo ""
echo "🔍 提交审核:"
echo "   1. 登录微信公众平台: https://mp.weixin.qq.com/"
echo "   2. 管理 → 版本管理 → 开发版本"
echo "   3. 点击「提交审核」"
echo "   4. 填写功能描述 (参考: docs/APP_DESCRIPTION.md)"
echo "   5. 上传截图 (参考: docs/SCREENSHOT_GUIDE.md)"
echo ""
echo "🌐 服务器域名配置:"
echo "   1. 开发 → 开发管理 → 开发设置 → 服务器域名"
echo "   2. request合法域名: https://your-domain.com"
echo "   3. uploadFile合法域名: https://your-domain.com"
echo "   4. downloadFile合法域名: https://your-domain.com"
echo ""
echo "📸 截图准备:"
echo "   参考: docs/SCREENSHOT_GUIDE.md"
echo "   需要5张截图，尺寸750x1334或更大"
echo ""
echo "📝 功能描述:"
echo "   参考: docs/APP_DESCRIPTION.md"
echo "   详细功能描述已准备"
echo ""
echo "================================"
echo -e "${GREEN}发布准备完成！${NC}"
echo "================================"
echo ""
echo "⚠️  重要提示:"
echo "   1. 确保已修改 project.config.json 中的 AppID"
echo "   2. 确保服务器域名已配置HTTPS"
echo "   3. 确保SSL证书有效"
echo "   4. iOS端需要隐藏虚拟支付入口"
echo ""
echo "📚 文档参考:"
echo "   - 发布指南: docs/WECHAT_PUBLISH_GUIDE.md"
echo "   - 截图指南: docs/SCREENSHOT_GUIDE.md"
echo "   - 功能描述: docs/APP_DESCRIPTION.md"
echo "   - 发布流程: docs/RELEASE_GUIDE.md"
echo ""
