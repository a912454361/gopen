# G Open 服务器部署指南

## 服务器信息

| 项目 | 值 |
|------|-----|
| 主服务器 | 114.55.115.39 |
| 备用服务器 | 121.41.198.107 |
| 域名 | 审核中 |

---

## 快速部署（3步完成）

### 第一步：SSH 登录服务器

在您的电脑终端执行：

```bash
ssh root@114.55.115.39
```

> 首次登录会提示确认指纹，输入 `yes` 然后输入服务器密码

### 第二步：在服务器上执行环境安装

复制以下命令，在服务器上执行：

```bash
# 创建目录
mkdir -p /var/www/gopen/server /var/www/gopen/client /var/log/gopen

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 pnpm 和 pm2
npm install -g pnpm pm2

# 安装 Nginx
apt install -y nginx

# 配置防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 配置 Nginx
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
    }
}
EOF

ln -sf /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo "环境安装完成！"
```

### 第三步：上传代码并启动

在您的本地电脑（开发环境）执行：

```bash
# 进入项目目录
cd /workspace/projects

# 上传后端代码
scp -r server/package.json server/tsconfig.json server/src root@114.55.115.39:/var/www/gopen/server/

# 上传前端代码
scp -r client/package.json client/tsconfig.json client/app client/screens client/components client/constants client/hooks client/utils client/assets root@114.55.115.39:/var/www/gopen/client/

# 上传配置文件
scp .coze package.json root@114.55.115.39:/var/www/gopen/
```

### 第四步：在服务器上构建和启动

SSH 登录服务器后执行：

```bash
# 创建环境变量
cat > /var/www/gopen/server/.env << 'EOF'
NODE_ENV=production
PORT=9091
ADMIN_KEY=gopen_admin_2024
EOF

# 构建后端
cd /var/www/gopen/server
pnpm install
pnpm build

# 构建前端
cd /var/www/gopen/client
pnpm install
npx expo export --platform web

# 启动服务
cd /var/www/gopen/server
pm2 start dist/index.js --name gopen-server
pm2 save
pm2 startup
```

---

## 一键部署命令（完整版）

直接复制以下内容，在服务器上执行：

```bash
#!/bin/bash
# 在服务器上执行此脚本

# 1. 安装依赖
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx
npm install -g pnpm pm2

# 2. 创建目录
mkdir -p /var/www/gopen/{server,client}
mkdir -p /var/log/gopen

# 3. 配置防火墙
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable

# 4. 配置 Nginx
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
    }
}
EOF
ln -sf /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "✅ 环境准备完成！请上传代码后执行构建命令。"
```

---

## 验证部署

部署完成后，访问以下地址验证：

| 项目 | 地址 |
|------|------|
| 应用首页 | http://114.55.115.39 |
| 健康检查 | http://114.55.115.39/api/v1/health |
| 管理后台 | http://114.55.115.39/admin?key=gopen_admin_2024 |

---

## 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs gopen-server

# 重启服务
pm2 restart gopen-server

# 停止服务
pm2 stop gopen-server

# 查看 Nginx 状态
systemctl status nginx

# 重启 Nginx
systemctl restart nginx
```

---

## 域名绑定（域名审核通过后）

### 1. 修改 Nginx 配置

```bash
nano /etc/nginx/sites-available/gopen
```

将 `server_name _;` 改为 `server_name 您的域名.com;`

### 2. 申请 SSL 证书

```bash
# 安装 certbot
apt install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d 您的域名.com

# 自动续期
certbot renew --dry-run
```

### 3. 重启 Nginx

```bash
systemctl restart nginx
```

---

## 故障排查

### 无法访问

1. 检查服务是否运行：`pm2 status`
2. 检查端口是否监听：`netstat -tlnp | grep 9091`
3. 检查防火墙：`ufw status`
4. 查看 Nginx 错误日志：`tail -f /var/log/nginx/error.log`

### 前端页面空白

1. 检查前端构建：`ls /var/www/gopen/client/dist/`
2. 重新构建：`cd /var/www/gopen/client && npx expo export --platform web`

### API 请求失败

1. 检查后端服务：`pm2 logs gopen-server`
2. 检查环境变量：`cat /var/www/gopen/server/.env`
