#!/bin/bash

# G open 软件著作权源代码生成脚本
# 用于生成前30页+后30页源代码文档

PROJECT_ROOT="/workspace/projects"
OUTPUT_DIR="$PROJECT_ROOT/docs/software-copyright"
TEMP_FILE="$OUTPUT_DIR/source-code-temp.txt"
FINAL_FILE="$OUTPUT_DIR/source-code.doc"

# 清理旧文件
rm -f "$TEMP_FILE" "$FINAL_FILE"

echo "======================================"
echo "G open 源代码文档生成工具"
echo "======================================"
echo ""

# 函数：添加文件头
add_header() {
    echo "" >> "$TEMP_FILE"
    echo "======================================================================" >> "$TEMP_FILE"
    echo "文件：$1" >> "$TEMP_FILE"
    echo "======================================================================" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"
}

# 函数：添加空行
add_empty_lines() {
    for i in {1..3}; do
        echo "" >> "$TEMP_FILE"
    done
}

# 收集前端源代码
echo "📦 收集前端源代码..."
FRONTEND_FILES=(
    "client/app/_layout.tsx"
    "client/app/(tabs)/_layout.tsx"
    "client/app/(tabs)/index.tsx"
    "client/screens/home/index.tsx"
    "client/screens/home/styles.ts"
    "client/screens/models/index.tsx"
    "client/screens/models/styles.ts"
    "client/screens/projects/index.tsx"
    "client/screens/projects/styles.ts"
    "client/screens/settings/index.tsx"
    "client/screens/settings/styles.ts"
    "client/screens/payment/index.tsx"
    "client/screens/payment/styles.ts"
    "client/screens/membership/index.tsx"
    "client/screens/membership/styles.ts"
    "client/screens/cloud-storage/index.tsx"
    "client/screens/cloud-storage/styles.ts"
    "client/screens/api-keys/index.tsx"
    "client/screens/api-keys/styles.ts"
    "client/screens/privacy-settings/index.tsx"
    "client/screens/privacy-settings/styles.ts"
    "client/screens/privacy-policy/index.tsx"
    "client/screens/terms-of-service/index.tsx"
    "client/contexts/MembershipContext.tsx"
    "client/hooks/useTheme.ts"
    "client/hooks/useSafeRouter.ts"
    "client/components/Screen.tsx"
    "client/components/ThemedText.tsx"
    "client/components/ThemedView.tsx"
    "client/components/Avatar.tsx"
    "client/constants/theme.ts"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        add_header "$file"
        cat "$PROJECT_ROOT/$file" >> "$TEMP_FILE"
        add_empty_lines
        echo "  ✓ $file"
    fi
done

# 收集后端源代码
echo ""
echo "📦 收集后端源代码..."
BACKEND_FILES=(
    "server/src/index.ts"
    "server/src/routes/auth.ts"
    "server/src/routes/payment.ts"
    "server/src/routes/models.ts"
    "server/src/routes/projects.ts"
    "server/src/routes/user.ts"
    "server/src/routes/cloud-storage.ts"
    "server/src/routes/model-sync.ts"
    "server/src/storage/database/supabase-client.ts"
)

for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
        add_header "$file"
        cat "$PROJECT_ROOT/$file" >> "$TEMP_FILE"
        add_empty_lines
        echo "  ✓ $file"
    fi
done

echo ""
echo "📊 统计代码行数..."
TOTAL_LINES=$(wc -l < "$TEMP_FILE")
echo "  总行数：$TOTAL_LINES 行"

# 计算每页约50行
LINES_PER_PAGE=50
TOTAL_PAGES=$((TOTAL_LINES / LINES_PER_PAGE + 1))

echo "  预计页数：$TOTAL_PAGES 页"

# 提取前30页
echo ""
echo "📄 提取前30页代码..."
head -n $((30 * LINES_PER_PAGE)) "$TEMP_FILE" > "$OUTPUT_DIR/front-30-pages.txt"

# 提取后30页
echo "📄 提取后30页代码..."
tail -n $((30 * LINES_PER_PAGE)) "$TEMP_FILE" > "$OUTPUT_DIR/back-30-pages.txt"

# 合并生成最终文档
echo ""
echo "📝 生成最终文档..."
{
    echo "===================================================================="
    echo "G open 智能创作助手系统 V1.0"
    echo "源程序代码文档"
    echo "===================================================================="
    echo ""
    echo "【前30页】"
    echo ""
    cat "$OUTPUT_DIR/front-30-pages.txt"
    echo ""
    echo ""
    echo "===================================================================="
    echo "【后30页】"
    echo ""
    cat "$OUTPUT_DIR/back-30-pages.txt"
    echo ""
    echo ""
    echo "===================================================================="
    echo "文档生成时间：$(date '+%Y年%m月%d日 %H:%M:%S')"
    echo "总代码行数：$TOTAL_LINES 行"
    echo "===================================================================="
} > "$FINAL_FILE"

# 清理临时文件
rm -f "$TEMP_FILE" "$OUTPUT_DIR/front-30-pages.txt" "$OUTPUT_DIR/back-30-pages.txt"

echo ""
echo "✅ 源代码文档生成完成！"
echo ""
echo "📄 文件位置：$FINAL_FILE"
echo "📊 文件大小：$(du -h "$FINAL_FILE" | cut -f1)"
echo ""
echo "⚠️  注意事项："
echo "1. 请使用 Word 打开该文件，调整格式"
echo "2. 设置页边距：上下左右各 2.5cm"
echo "3. 字体：宋体 10号"
echo "4. 行距：固定值 15磅"
echo "5. 如页数不足60页，需补充更多源文件"
echo ""
