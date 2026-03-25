#!/bin/bash

# ============================================
# G open - 快速启动/停止脚本
# ============================================

cd /var/www/gopen

case "$1" in
    start)
        echo "启动 G open 服务..."
        docker-compose -f docker-compose.prod.yml up -d
        ;;
    stop)
        echo "停止 G open 服务..."
        docker-compose -f docker-compose.prod.yml down
        ;;
    restart)
        echo "重启 G open 服务..."
        docker-compose -f docker-compose.prod.yml restart
        ;;
    logs)
        docker-compose -f docker-compose.prod.yml logs -f ${2:-}
        ;;
    status)
        docker-compose -f docker-compose.prod.yml ps
        ;;
    build)
        echo "重新构建 G open 服务..."
        docker-compose -f docker-compose.prod.yml build --no-cache
        ;;
    update)
        echo "更新代码并重启..."
        git pull origin main
        docker-compose -f docker-compose.prod.yml build
        docker-compose -f docker-compose.prod.yml up -d
        ;;
    *)
        echo "用法: $0 {start|stop|restart|logs|status|build|update}"
        echo ""
        echo "命令说明:"
        echo "  start   - 启动服务"
        echo "  stop    - 停止服务"
        echo "  restart - 重启服务"
        echo "  logs    - 查看日志 (可指定服务名)"
        echo "  status  - 查看状态"
        echo "  build   - 重新构建"
        echo "  update  - 更新代码并重启"
        exit 1
        ;;
esac
