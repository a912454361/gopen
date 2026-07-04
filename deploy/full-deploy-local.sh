#!/bin/bash
###############################################################
#                                                             #
#  G Open 完整部署脚本 - 本地端                                #
#                                                             #
#  使用方法：                                                  #
#  chmod +x full-deploy-local.sh && ./full-deploy-local.sh    #
#                                                             #
###############################################################

set -e

# ======================= 配置区域 =======================
SERVER_IP="114.55.115.39"
SERVER_USER="root"
PROJECT_DIR="/var/www/gopen"
LOCAL_DIR="/workspace/projects"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${YELLOW}[STEP]${NC} $1"; }

clear
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           G Open 完整部署 - 本地端                        ║"
echo "║                                                           ║"
echo "║  服务器: ${SERVER_USER}@${SERVER_IP}                      ║"
echo "║  本地目录: ${LOCAL_DIR}                                   ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# 检查本地项目目录
if [ ! -d "${LOCAL_DIR}" ]; then
    log_error "本地项目目录不存在: ${LOCAL_DIR}"
    exit 1
fi

# 检查 SSH 连接
log_step "检查 SSH 连接..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} "echo 'connected'" &>/dev/null; then
    log_error "无法连接到服务器，请检查："
    echo "  1. 服务器 IP 是否正确"
    echo "  2. SSH 密钥是否配置"
    echo "  3. 服务器是否可达"
    exit 1
fi
log_success "SSH 连接正常"

# ==================== 步骤 1: 上传后端代码 ====================
log_step "【1/4】上传后端代码..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude '*.log' \
    ${LOCAL_DIR}/server/ \
    ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/server/
log_success "后端代码上传完成"

# ==================== 步骤 2: 上传前端代码 ====================
log_step "【2/4】上传前端代码..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude '.expo' \
    --exclude '*.log' \
    --exclude '.git' \
    ${LOCAL_DIR}/client/package.json \
    ${LOCAL_DIR}/client/tsconfig.json \
    ${LOCAL_DIR}/client/app.json \
    ${LOCAL_DIR}/client/app \
    ${LOCAL_DIR}/client/screens \
    ${LOCAL_DIR}/client/components \
    ${LOCAL_DIR}/client/constants \
    ${LOCAL_DIR}/client/hooks \
    ${LOCAL_DIR}/client/utils \
    ${LOCAL_DIR}/client/context \
    ${LOCAL_DIR}/client/types \
    ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/client/

# 上传 assets（如果存在）
if [ -d "${LOCAL_DIR}/client/assets" ]; then
    rsync -avz --progress ${LOCAL_DIR}/client/assets/ ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/client/assets/
fi

log_success "前端代码上传完成"

# ==================== 步骤 3: 上传配置文件 ====================
log_step "【3/4】上传配置文件..."
rsync -avz ${LOCAL_DIR}/package.json ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/ 2>/dev/null || true
rsync -avz ${LOCAL_DIR}/.coze ${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/ 2>/dev/null || true
log_success "配置文件上传完成"

# ==================== 步骤 4: 远程构建和启动 ====================
log_step "【4/4】远程构建和启动..."

ssh ${SERVER_USER}@${SERVER_IP} << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

PROJECT_DIR="/var/www/gopen"
LOG_DIR="/var/log/gopen"

echo ">>> 安装后端依赖..."
cd ${PROJECT_DIR}/server
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo ">>> 构建后端..."
pnpm build

echo ">>> 安装前端依赖..."
cd ${PROJECT_DIR}/client
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo ">>> 构建前端..."
npx expo export --platform web

echo ">>> 启动服务..."
cd ${PROJECT_DIR}
pm2 delete gopen-server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ">>> 检查服务状态..."
sleep 2
pm2 status

echo ">>> 检查 API..."
curl -s http://127.0.0.1:9091/api/v1/health || echo "API 未响应"
REMOTE_SCRIPT

log_success "远程构建和启动完成"

# ==================== 验证部署 ====================
log_step "验证部署..."
sleep 3

echo ""
echo "检查服务状态..."
curl -s -I http://${SERVER_IP}/api/v1/health | head -3 || echo "服务未响应"

# ==================== 显示完成信息 ====================
clear
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║              ✅ 部署完成！                                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 访问地址："
echo ""
echo "  应用首页:    http://${SERVER_IP}"
echo "  健康检查:    http://${SERVER_IP}/api/v1/health"
echo "  管理后台:    http://${SERVER_IP}/admin?key=gopen_admin_2024"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 常用命令（在服务器上执行）："
echo ""
echo "  gopen status   - 查看服务状态"
echo "  gopen logs     - 查看日志"
echo "  gopen restart  - 重启服务"
echo "  gopen stop     - 停止服务"
echo "  gopen start    - 启动服务"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 日志位置："
echo ""
echo "  服务日志: ${LOG_DIR}/combined.log"
echo "  错误日志: ${LOG_DIR}/error.log"
echo "  Nginx日志: /var/log/nginx/gopen.access.log"
echo ""
