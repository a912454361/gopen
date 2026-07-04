# 阿里云部署指南

## 一、部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                    阿里云部署架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户访问                                                    │
│     ↓                                                       │
│  woshiguotao.cn (域名)                                      │
│     ↓                                                       │
│  阿里云 CDN (可选)                                           │
│     ↓                                                       │
│  阿里云 SLB 负载均衡 (可选)                                   │
│     ↓                                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ECS 云服务器                             │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Nginx 反向代理 (SSL/HTTPS)                    │ │  │
│  │  │  - 前端: woshiguotao.cn → localhost:5000      │ │  │
│  │  │  - 后端: api.woshiguotao.cn → localhost:9091  │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Docker 容器服务                               │ │  │
│  │  │  ├─ gopen-frontend (Expo Web)                 │ │  │
│  │  │  └─ gopen-backend (Express API)               │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│     ↓                     ↓                                 │
│  阿里云 RDS            阿里云 OSS                           │
│  (或使用 Supabase)      (或使用 S3)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、阿里云资源准备

### 2.1 必需资源

| 资源类型 | 推荐配置 | 月费用估算 | 用途 |
|---------|---------|-----------|------|
| **ECS 云服务器** | 2核4G / CentOS 7.9 | ¥100-200 | 运行应用 |
| **域名** | woshiguotao.cn | ¥50/年 | 已有 |
| **SSL证书** | 免费DV证书 | ¥0 | HTTPS |
| **OSS对象存储** | 标准型 40GB | ¥5 | 文件存储 |

### 2.2 可选资源

| 资源类型 | 用途 | 月费用 |
|---------|------|--------|
| CDN加速 | 静态资源加速 | ¥10-50 |
| SLB负载均衡 | 高可用 | ¥50 |
| RDS数据库 | 替代Supabase | ¥100+ |

---

## 三、服务器购买与配置

### 3.1 购买 ECS 服务器

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 创建实例：
   - **地域**：华东1（杭州）或 华北2（北京）
   - **实例规格**：ecs.c6.large (2核4G)
   - **镜像**：CentOS 7.9 64位
   - **存储**：40GB 高效云盘
   - **带宽**：5Mbps
   - **安全组**：开放 22(SSH), 80(HTTP), 443(HTTPS), 5000, 9091

### 3.2 连接服务器

```bash
# SSH 连接
ssh root@你的服务器公网IP

# 或使用阿里云控制台的远程连接
```

---

## 四、服务器环境配置

### 4.1 安装 Docker

```bash
# 更新系统
yum update -y

# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

# 启动 Docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 4.2 安装 Nginx

```bash
# 安装 Nginx
yum install -y nginx

# 启动 Nginx
systemctl start nginx
systemctl enable nginx

# 验证
nginx -v
```

### 4.3 安装 Git 和 Node.js

```bash
# 安装 Git
yum install -y git

# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 验证
node --version
pnpm --version
```

---

## 五、部署应用代码

### 5.1 克隆代码

```bash
# 创建应用目录
mkdir -p /var/www/gopen
cd /var/www/gopen

# 克隆代码
git clone https://github.com/a912454361/gopen.git .

# 或从 Gitee 克隆（国内更快）
git clone https://gitee.com/a912454361/gopen.git .
```

### 5.2 配置环境变量

```bash
# 创建环境变量文件
cat > /var/www/gopen/server/.env << 'EOF'
# 服务端口
PORT=9091

# 数据库 (使用 Supabase)
DATABASE_URL=你的Supabase数据库URL

# JWT 密钥
JWT_SECRET=你的JWT密钥

# 管理员密钥
ADMIN_KEY=GtAdmin2024SecretKey8888

# AI API 配置
OPENAI_API_KEY=你的OpenAI密钥（如需）
DEEPSEEK_API_KEY=你的DeepSeek密钥（如需）

# 对象存储
OSS_ACCESS_KEY=你的OSS密钥
OSS_SECRET_KEY=你的OSS密钥密码
OSS_BUCKET=你的OSS桶名
OSS_REGION=oss-cn-hangzhou
EOF

# 设置权限
chmod 600 /var/www/gopen/server/.env
```

### 5.3 使用 Docker Compose 部署

```bash
cd /var/www/gopen

# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 查看容器状态
docker-compose ps
```

---

## 六、配置 Nginx 反向代理

### 6.1 创建 Nginx 配置

```bash
# 备份原配置
cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak

# 创建新配置
cat > /etc/nginx/conf.d/gopen.conf << 'EOF'
# 后端 API 服务
upstream backend {
    server 127.0.0.1:9091;
    keepalive 64;
}

# 前端 Web 服务
upstream frontend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name woshiguotao.cn api.woshiguotao.cn;
    
    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - 主站
server {
    listen 443 ssl http2;
    server_name woshiguotao.cn;
    
    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/woshiguotao.cn.pem;
    ssl_certificate_key /etc/nginx/ssl/woshiguotao.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    # 前端静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 前端请求
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTPS - API 服务
server {
    listen 443 ssl http2;
    server_name api.woshiguotao.cn;
    
    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/woshiguotao.cn.pem;
    ssl_certificate_key /etc/nginx/ssl/woshiguotao.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # API 请求
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 增加超时时间（用于 AI 生成等长时间操作）
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# 测试配置
nginx -t

# 重载配置
systemctl reload nginx
```

---

## 七、配置 SSL 证书

### 7.1 方案一：使用阿里云免费证书（推荐）

1. 登录 [阿里云 SSL 证书控制台](https://yundunnext.console.aliyun.com/?p=cas)
2. 购买证书 → 选择 **免费DV证书**
3. 填写域名：`woshiguotao.cn` 和 `api.woshiguotao.cn`
4. 验证域名所有权（添加 DNS TXT 记录）
5. 等待签发（通常 1-24 小时）
6. 下载证书（选择 Nginx 格式）

```bash
# 创建 SSL 目录
mkdir -p /etc/nginx/ssl

# 上传证书文件
# 将下载的证书文件上传到 /etc/nginx/ssl/
# woshiguotao.cn.pem (证书)
# woshiguotao.cn.key (私钥)

# 设置权限
chmod 600 /etc/nginx/ssl/*
```

### 7.2 方案二：使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
yum install -y certbot python2-certbot-nginx

# 申请证书
certbot --nginx -d woshiguotao.cn -d api.woshiguotao.cn

# 自动续期
crontab -e
# 添加以下行：
0 3 * * * /usr/bin/certbot renew --quiet
```

---

## 八、域名解析配置

### 8.1 添加 DNS 解析记录

登录 [阿里云域名控制台](https://dc.console.aliyun.com/)：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 你的服务器公网IP | 600 |
| A | www | 你的服务器公网IP | 600 |
| A | api | 你的服务器公网IP | 600 |

---

## 九、启动服务

### 9.1 启动 Docker 服务

```bash
cd /var/www/gopen

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看容器状态
docker-compose ps
```

### 9.2 验证服务

```bash
# 检查端口
netstat -tlnp | grep -E "5000|9091"

# 测试后端 API
curl http://localhost:9091/api/v1/health

# 测试前端
curl http://localhost:5000

# 测试 HTTPS
curl -k https://woshiguotao.cn
curl -k https://api.woshiguotao.cn/api/v1/health
```

---

## 十、自动化部署脚本

### 10.1 创建部署脚本

```bash
cat > /var/www/gopen/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "================================"
echo "  G open 自动部署脚本"
echo "================================"

cd /var/www/gopen

# 1. 拉取最新代码
echo "[1/5] 拉取最新代码..."
git pull origin main

# 2. 安装依赖
echo "[2/5] 安装依赖..."
cd server && pnpm install
cd ../client && pnpm install

# 3. 构建前端
echo "[3/5] 构建前端..."
pnpm run build

# 4. 重启服务
echo "[4/5] 重启服务..."
cd /var/www/gopen
docker-compose restart

# 5. 清理旧镜像
echo "[5/5] 清理旧镜像..."
docker image prune -f

echo "================================"
echo "  部署完成！"
echo "================================"
echo "前端: https://woshiguotao.cn"
echo "后端: https://api.woshiguotao.cn"
echo "================================"
EOF

chmod +x /var/www/gopen/deploy.sh
```

### 10.2 设置自动部署（可选）

```bash
# 安装 Webhook 工具
yum install -y webhook

# 创建 Webhook 配置
cat > /etc/webhook/hooks.json << 'EOF'
[
  {
    "id": "gopen-deploy",
    "execute-command": "/var/www/gopen/deploy.sh",
    "command-working-directory": "/var/www/gopen",
    "response-message": "Deploy started"
  }
]
EOF

# 启动 Webhook 服务
systemctl start webhook
systemctl enable webhook

# 在 GitHub/Gitee 设置 Webhook:
# URL: http://你的服务器IP:9000/hooks/gopen-deploy
```

---

## 十一、监控与维护

### 11.1 日志管理

```bash
# 查看应用日志
docker-compose logs -f

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 日志轮转配置
cat > /etc/logrotate.d/gopen << 'EOF'
/var/www/gopen/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF
```

### 11.2 性能监控

```bash
# 安装 htop
yum install -y htop

# 查看系统资源
htop

# 查看 Docker 容器资源
docker stats
```

### 11.3 备份策略

```bash
# 创建备份脚本
cat > /var/www/gopen/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/www/gopen/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
# pg_dump -h localhost -U postgres gopen > $BACKUP_DIR/db_$DATE.sql

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/gopen/uploads

# 删除 7 天前的备份
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /var/www/gopen/backup.sh

# 设置每日备份
crontab -e
# 添加：
0 2 * * * /var/www/gopen/backup.sh
```

---

## 十二、故障排查

### 12.1 常见问题

**问题1：容器无法启动**
```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
netstat -tlnp | grep -E "5000|9091"

# 重启 Docker
systemctl restart docker
```

**问题2：Nginx 502 错误**
```bash
# 检查后端服务
curl http://localhost:9091/api/v1/health

# 检查 SELinux
setenforce 0  # 临时关闭

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

**问题3：SSL 证书错误**
```bash
# 检查证书文件
ls -la /etc/nginx/ssl/

# 测试 SSL
openssl s_client -connect woshiguotao.cn:443
```

---

## 十三、费用估算

### 13.1 月度费用（最小配置）

| 项目 | 配置 | 费用 |
|------|------|------|
| ECS 服务器 | 2核4G | ¥100-150 |
| 域名 | .cn | ¥4/月 |
| SSL证书 | 免费DV | ¥0 |
| OSS存储 | 40GB | ¥5 |
| CDN | 按流量 | ¥10-30 |
| **总计** | - | **¥120-190/月** |

### 13.2 年度费用

- **基础版**：¥1,500/年
- **标准版**：¥2,500/年（含CDN）

---

## 十四、安全加固

### 14.1 防火墙配置

```bash
# 安装 firewalld
yum install -y firewalld
systemctl start firewalld
systemctl enable firewalld

# 开放端口
firewall-cmd --permanent --add-port=22/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp

# 重载配置
firewall-cmd --reload
```

### 14.2 SSH 加固

```bash
# 修改 SSH 配置
vi /etc/ssh/sshd_config

# 修改以下配置：
Port 2222              # 更改默认端口
PermitRootLogin no     # 禁止 root 登录
PasswordAuthentication no  # 禁用密码登录

# 重启 SSH
systemctl restart sshd
```

---

## 十五、完成检查清单

- [ ] ECS 服务器已购买并配置
- [ ] Docker 和 Docker Compose 已安装
- [ ] Nginx 已安装并配置
- [ ] SSL 证书已申请并配置
- [ ] 域名解析已配置
- [ ] 代码已克隆到服务器
- [ ] 环境变量已配置
- [ ] Docker 服务已启动
- [ ] 网站可以正常访问
- [ ] HTTPS 正常工作
- [ ] API 接口正常响应
- [ ] 日志和监控已配置

---

## 十六、联系支持

如有问题，请检查：
1. 服务状态：`docker-compose ps`
2. 日志文件：`docker-compose logs`
3. Nginx 日志：`/var/log/nginx/`
4. 系统资源：`htop`

**部署完成后访问**：
- 官网：https://woshiguotao.cn
- API：https://api.woshiguotao.cn/api/v1/health
