#!/bin/bash
###############################################################
#                                                             #
#  G Open 一键部署脚本                                        #
#                                                             #
#  使用方法：                                                  #
#  ssh root@114.55.115.39                                     #
#  然后粘贴此脚本全部内容执行                                  #
#                                                             #
###############################################################

SERVER_IP="114.55.115.39"
PROJECT_DIR="/var/www/gopen"
LOG_DIR="/var/log/gopen"

clear
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           G Open 一键部署                                 ║"
echo "║                                                           ║"
echo "║  服务器: ${SERVER_IP}                                     ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
read -p "按 Enter 开始部署..." dummy

echo "[1/10] 更新系统..."
apt update -y && apt upgrade -y

echo "[2/10] 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "[3/10] 安装全局工具..."
npm install -g pnpm pm2

echo "[4/10] 安装 Nginx..."
apt install -y nginx

echo "[5/10] 配置防火墙..."
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

echo "[6/10] 创建目录..."
mkdir -p ${PROJECT_DIR}/server ${PROJECT_DIR}/client/dist ${LOG_DIR}

echo "[7/10] 配置 Nginx..."
cat > /etc/nginx/sites-available/gopen << 'EOF'
server {
    listen 80;
    server_name _;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    location / {
        root /var/www/gopen/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "[8/10] 创建环境变量..."
cat > ${PROJECT_DIR}/server/.env << EOF
NODE_ENV=production
PORT=9091
ADMIN_KEY=gopen_admin_2024
EOF

echo "[9/10] 创建 PM2 配置..."
cat > ${PROJECT_DIR}/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gopen-server',
    cwd: '/var/www/gopen/server',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    env_production: { NODE_ENV: 'production', PORT: 9091 },
    error_file: '/var/log/gopen/error.log',
    out_file: '/var/log/gopen/out.log',
    time: true
  }]
};
EOF

echo "[10/10] 创建快捷命令..."
cat > /usr/local/bin/gopen << 'EOF'
#!/bin/bash
case "$1" in
    start) pm2 start /var/www/gopen/ecosystem.config.js ;;
    stop) pm2 stop gopen-server ;;
    restart) pm2 restart gopen-server ;;
    logs) pm2 logs gopen-server ;;
    status) pm2 status ;;
    build)
        cd /var/www/gopen/server && pnpm build
        cd /var/www/gopen/client && npx expo export --platform web
        ;;
    *) echo "用法: gopen {start|stop|restart|logs|status|build}" ;;
esac
EOF
chmod +x /usr/local/bin/gopen

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ✅ 环境安装完成！                            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "下一步：请在本地电脑执行上传脚本"
echo ""
