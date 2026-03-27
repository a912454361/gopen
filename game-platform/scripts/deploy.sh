#!/bin/bash

# 万古长夜游戏平台 - 多平台部署脚本
# 支持：阿里云、腾讯云、Coze Cloud

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GOLD='\033[0;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GAME_PLATFORM_DIR="$PROJECT_ROOT/game-platform"
SERVER_DIR="$PROJECT_ROOT/server"

# 帮助信息
show_help() {
    echo -e "${GOLD}万古长夜游戏平台 - 部署脚本${NC}"
    echo ""
    echo "用法: ./scripts/deploy.sh [平台] [操作]"
    echo ""
    echo "平台:"
    echo "  aliyun    部署到阿里云"
    echo "  tencent   部署到腾讯云"
    echo "  coze      部署到 Coze Cloud（当前平台）"
    echo "  all       部署到所有平台"
    echo ""
    echo "操作:"
    echo "  build     构建应用"
    echo "  deploy    部署应用"
    echo "  start     启动服务"
    echo "  stop      停止服务"
    echo "  logs      查看日志"
    echo "  status    查看状态"
    echo ""
    echo "示例:"
    echo "  ./scripts/deploy.sh aliyun build    # 构建阿里云版本"
    echo "  ./scripts/deploy.sh tencent deploy  # 部署到腾讯云"
    echo "  ./scripts/deploy.sh coze start      # 启动 Coze Cloud 服务"
}

# 构建应用
build_app() {
    local platform=$1
    echo -e "${GOLD}正在构建 $platform 版本...${NC}"
    
    cd "$GAME_PLATFORM_DIR"
    
    # 设置平台特定环境变量
    case $platform in
        aliyun)
            export EXPO_PUBLIC_BACKEND_BASE_URL="https://api.wangu.aliyun.game.com"
            ;;
        tencent)
            export EXPO_PUBLIC_BACKEND_BASE_URL="https://api.wangu.tencent.game.com"
            ;;
        coze)
            export EXPO_PUBLIC_BACKEND_BASE_URL="https://916c8e51-dd88-40fc-81e0-5de9e61eded7.dev.coze.site/api/v1"
            ;;
    esac
    
    # 安装依赖
    echo -e "${YELLOW}安装依赖...${NC}"
    npm install --legacy-peer-deps
    
    # 构建 Web 版本
    echo -e "${YELLOW}构建 Web 版本...${NC}"
    npx expo export --platform web
    
    echo -e "${GREEN}✓ $platform 版本构建完成${NC}"
}

# 部署到阿里云
deploy_aliyun() {
    echo -e "${GOLD}部署到阿里云...${NC}"
    
    # 检查是否安装阿里云 CLI
    if ! command -v aliyun &> /dev/null; then
        echo -e "${RED}错误: 未安装阿里云 CLI${NC}"
        echo "请运行: pip install aliyun-python-sdk-core"
        exit 1
    fi
    
    # 上传到 OSS
    echo -e "${YELLOW}上传静态文件到 OSS...${NC}"
    aliyun oss cp "$GAME_PLATFORM_DIR/dist" oss://wangu-game-assets/ --recursive
    
    # 构建 Docker 镜像
    echo -e "${YELLOW}构建 Docker 镜像...${NC}"
    cd "$SERVER_DIR"
    docker build -t wangu-api:latest .
    docker tag wangu-api:latest registry.cn-hangzhou.aliyuncs.com/wangu/api:latest
    
    # 推送镜像
    echo -e "${YELLOW}推送镜像到 ACR...${NC}"
    docker push registry.cn-hangzhou.aliyuncs.com/wangu/api:latest
    
    # 更新 ECS 服务
    echo -e "${YELLOW}更新 ECS 服务...${NC}"
    kubectl set image deployment/wangu-api wangu-api=registry.cn-hangzhou.aliyuncs.com/wangu/api:latest
    
    echo -e "${GREEN}✓ 阿里云部署完成${NC}"
    echo -e "访问地址: ${GOLD}https://wangu.aliyun.game.com${NC}"
}

# 部署到腾讯云
deploy_tencent() {
    echo -e "${GOLD}部署到腾讯云...${NC}"
    
    # 检查是否安装腾讯云 CLI
    if ! command -v tccli &> /dev/null; then
        echo -e "${RED}错误: 未安装腾讯云 CLI${NC}"
        echo "请运行: pip install tccli"
        exit 1
    fi
    
    # 上传到 COS
    echo -e "${YELLOW}上传静态文件到 COS...${NC}"
    coscmd upload -r "$GAME_PLATFORM_DIR/dist" /wangu-game-assets/
    
    # 构建 Docker 镜像
    echo -e "${YELLOW}构建 Docker 镜像...${NC}"
    cd "$SERVER_DIR"
    docker build -t wangu-api:latest .
    docker tag wangu-api:latest ccr.ccs.tencentyun.com/wangu/api:latest
    
    # 推送镜像
    echo -e "${YELLOW}推送镜像到 TCR...${NC}"
    docker push ccr.ccs.tencentyun.com/wangu/api:latest
    
    # 更新 TKE 服务
    echo -e "${YELLOW}更新 TKE 服务...${NC}"
    kubectl set image deployment/wangu-api wangu-api=ccr.ccs.tencentyun.com/wangu/api:latest
    
    echo -e "${GREEN}✓ 腾讯云部署完成${NC}"
    echo -e "访问地址: ${GOLD}https://wangu.tencent.game.com${NC}"
}

# 部署到 Coze Cloud（当前平台）
deploy_coze() {
    echo -e "${GOLD}部署到 Coze Cloud...${NC}"
    
    # Coze Cloud 使用自动部署，这里只做构建
    build_app "coze"
    
    echo -e "${GREEN}✓ Coze Cloud 版本已准备就绪${NC}"
    echo -e "访问地址: ${GOLD}https://916c8e51-dd88-40fc-81e0-5de9e61eded7.dev.coze.site/game/${NC}"
}

# 启动本地服务
start_services() {
    echo -e "${GOLD}启动本地服务...${NC}"
    
    # 停止旧服务
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "node proxy-server" 2>/dev/null || true
    
    sleep 2
    
    # 启动后端
    echo -e "${YELLOW}启动后端服务...${NC}"
    cd "$SERVER_DIR"
    pnpm run dev &
    sleep 3
    
    # 启动游戏平台
    echo -e "${YELLOW}启动游戏平台...${NC}"
    cd "$GAME_PLATFORM_DIR"
    npx expo start --web --port 5001 &
    sleep 5
    
    # 启动反向代理
    echo -e "${YELLOW}启动反向代理...${NC}"
    cd "$PROJECT_ROOT"
    node proxy-server.js &
    
    echo -e "${GREEN}✓ 所有服务已启动${NC}"
    echo ""
    echo -e "访问地址:"
    echo -e "  Gopen 主应用: ${GOLD}http://localhost:5002${NC}"
    echo -e "  万古长夜游戏: ${GOLD}http://localhost:5001${NC}"
    echo -e "  统一入口: ${GOLD}http://localhost:5000${NC}"
}

# 停止服务
stop_services() {
    echo -e "${GOLD}停止服务...${NC}"
    
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "node proxy-server" 2>/dev/null || true
    pkill -f "pnpm run dev" 2>/dev/null || true
    
    echo -e "${GREEN}✓ 服务已停止${NC}"
}

# 查看日志
view_logs() {
    echo -e "${GOLD}查看日志...${NC}"
    tail -f /app/work/logs/bypass/app.log
}

# 查看状态
check_status() {
    echo -e "${GOLD}服务状态${NC}"
    echo ""
    
    # 检查后端
    if curl -s http://localhost:9091/api/v1/health > /dev/null 2>&1; then
        echo -e "后端服务: ${GREEN}✓ 运行中${NC}"
    else
        echo -e "后端服务: ${RED}✗ 未运行${NC}"
    fi
    
    # 检查游戏平台
    if curl -s http://localhost:5001 > /dev/null 2>&1; then
        echo -e "游戏平台: ${GREEN}✓ 运行中${NC}"
    else
        echo -e "游戏平台: ${RED}✗ 未运行${NC}"
    fi
    
    # 检查反向代理
    if curl -s http://localhost:5000 > /dev/null 2>&1; then
        echo -e "反向代理: ${GREEN}✓ 运行中${NC}"
    else
        echo -e "反向代理: ${RED}✗ 未运行${NC}"
    fi
}

# 主函数
main() {
    local platform=${1:-help}
    local action=${2:-build}
    
    case $platform in
        help|--help|-h)
            show_help
            ;;
        aliyun)
            case $action in
                build) build_app "aliyun" ;;
                deploy) build_app "aliyun" && deploy_aliyun ;;
                *) echo -e "${RED}未知操作: $action${NC}" ;;
            esac
            ;;
        tencent)
            case $action in
                build) build_app "tencent" ;;
                deploy) build_app "tencent" && deploy_tencent ;;
                *) echo -e "${RED}未知操作: $action${NC}" ;;
            esac
            ;;
        coze)
            case $action in
                build) build_app "coze" ;;
                deploy) deploy_coze ;;
                start) start_services ;;
                stop) stop_services ;;
                logs) view_logs ;;
                status) check_status ;;
                *) echo -e "${RED}未知操作: $action${NC}" ;;
            esac
            ;;
        all)
            echo -e "${GOLD}部署到所有平台...${NC}"
            build_app "aliyun" && deploy_aliyun
            build_app "tencent" && deploy_tencent
            deploy_coze
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        status)
            check_status
            ;;
        *)
            echo -e "${RED}未知平台: $platform${NC}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
