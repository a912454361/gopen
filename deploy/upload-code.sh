#!/bin/bash
# ============================================
# G Open 代码上传脚本
# 在您的本地电脑上运行
# ============================================

SERVER="114.55.115.39"
USER="root"
REMOTE_DIR="/var/www/gopen"

echo "=========================================="
echo "   G Open 代码上传"
echo "=========================================="
echo ""
echo "服务器: ${USER}@${SERVER}"
echo "目标目录: ${REMOTE_DIR}"
echo ""
echo "请确保您已配置 SSH 密钥或准备好密码"
echo ""
read -p "按 Enter 开始上传..." dummy

# 方法1: 使用 scp
echo "[方法1] 使用 scp 上传..."

# 上传后端
echo "上传后端代码..."
scp -r server/package.json server/tsconfig.json server/src ${USER}@${SERVER}:${REMOTE_DIR}/server/

# 上传前端
echo "上传前端代码..."
scp -r client/package.json client/tsconfig.json client/app client/screens client/components client/constants client/hooks client/utils ${USER}@${SERVER}:${REMOTE_DIR}/client/

# 上传资源（如果有）
if [ -d "client/assets" ]; then
    echo "上传资源文件..."
    scp -r client/assets ${USER}@${SERVER}:${REMOTE_DIR}/client/
fi

# 上传配置
echo "上传配置文件..."
scp package.json ${USER}@${SERVER}:${REMOTE_DIR}/

echo ""
echo "=========================================="
echo "   ✅ 上传完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "  1. ssh ${USER}@${SERVER}"
echo "  2. 执行构建命令"
echo ""
