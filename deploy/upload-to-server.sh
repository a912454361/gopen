#!/bin/bash
# G Open 代码上传脚本
# 在本地电脑执行

SERVER_IP="114.55.115.39"
SERVER_USER="root"
PROJECT_DIR="/workspace/projects"

echo "=========================================="
echo "   上传代码到服务器"
echo "=========================================="

# 上传后端代码
echo "上传后端代码..."
rsync -avz --exclude 'node_modules' --exclude 'dist' \
    ${PROJECT_DIR}/server/ \
    ${SERVER_USER}@${SERVER_IP}:/var/www/gopen/server/

# 上传前端代码
echo "上传前端代码..."
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.expo' \
    ${PROJECT_DIR}/client/ \
    ${SERVER_USER}@${SERVER_IP}:/var/www/gopen/client/

# 上传配置文件
echo "上传配置文件..."
rsync -avz ${PROJECT_DIR}/package.json ${SERVER_USER}@${SERVER_IP}:/var/www/gopen/
rsync -avz ${PROJECT_DIR}/.coze ${SERVER_USER}@${SERVER_IP}:/var/www/gopen/ 2>/dev/null || true

echo ""
echo "=========================================="
echo "   上传完成！"
echo "=========================================="
echo ""
echo "请在服务器上执行："
echo "  chmod +x /var/www/gopen/deploy-start.sh"
echo "  /var/www/gopen/deploy-start.sh"
echo ""
