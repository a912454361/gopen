#!/bin/bash
# ============================================
# G open 智能创作助手 - 健康检查脚本
# ============================================

# 配置
API_URL=${API_URL:-"http://localhost:9091"}
DOMAIN=${DOMAIN:-"woshiguotao.cn"}

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "============================================"
echo "  G open 健康检查"
echo "============================================"

# 检查 API 服务
echo -e "\n${YELLOW}[1] API 服务检查${NC}"
if curl -sf "$API_URL/api/v1/health" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} API 服务正常 ($API_URL)"
else
    echo -e "  ${RED}✗${NC} API 服务异常"
fi

# 检查 Nginx
echo -e "\n${YELLOW}[2] Nginx 服务检查${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "  ${GREEN}✓${NC} Nginx 运行中"
else
    echo -e "  ${RED}✗${NC} Nginx 未运行"
fi

# 检查 PM2 进程
echo -e "\n${YELLOW}[3] PM2 进程检查${NC}"
if pm2 list | grep -q "gopen-api.*online"; then
    echo -e "  ${GREEN}✓${NC} gopen-api 进程正常"
else
    echo -e "  ${RED}✗${NC} gopen-api 进程异常"
fi

# 检查 HTTPS
echo -e "\n${YELLOW}[4] HTTPS 证书检查${NC}"
CERT_FILE="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
if [ -f "$CERT_FILE" ]; then
    EXPIRE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
    echo -e "  ${GREEN}✓${NC} 证书到期时间: $EXPIRE"
else
    echo -e "  ${YELLOW}!${NC} 未找到 SSL 证书"
fi

# 检查磁盘空间
echo -e "\n${YELLOW}[5] 磁盘空间检查${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "  ${GREEN}✓${NC} 磁盘使用率: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "  ${YELLOW}!${NC} 磁盘使用率: ${DISK_USAGE}% (警告)"
else
    echo -e "  ${RED}✗${NC} 磁盘使用率: ${DISK_USAGE}% (严重)"
fi

# 检查内存
echo -e "\n${YELLOW}[6] 内存使用检查${NC}"
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
if [ "$MEM_USAGE" -lt 80 ]; then
    echo -e "  ${GREEN}✓${NC} 内存使用率: ${MEM_USAGE}%"
elif [ "$MEM_USAGE" -lt 90 ]; then
    echo -e "  ${YELLOW}!${NC} 内存使用率: ${MEM_USAGE}% (警告)"
else
    echo -e "  ${RED}✗${NC} 内存使用率: ${MEM_USAGE}% (严重)"
fi

# 检查端口
echo -e "\n${YELLOW}[7] 端口检查${NC}"
for PORT in 80 443 9091; do
    if netstat -tuln | grep -q ":$PORT "; then
        echo -e "  ${GREEN}✓${NC} 端口 $PORT 监听中"
    else
        echo -e "  ${RED}✗${NC} 端口 $PORT 未监听"
    fi
done

echo -e "\n============================================"
echo "  检查完成"
echo "============================================"
