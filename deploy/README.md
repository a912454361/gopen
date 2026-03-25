# G open 生产环境部署指南

## 快速开始

### 方式一：一键部署（推荐）

```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/a912454361/gopen/main/deploy/production-deploy.sh

# 添加执行权限
chmod +x production-deploy.sh

# 运行部署脚本
sudo ./production-deploy.sh
```

### 方式二：Docker 部署

```bash
# 克隆代码
git clone https://github.com/a912454361/gopen.git
cd gopen

# 配置环境变量
cp server/.env.example server/.env
nano server/.env  # 填写实际配置

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 方式三：手动部署

#### 1. 安装依赖

```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm pm2
```

#### 2. 克隆代码

```bash
git clone https://github.com/a912454361/gopen.git
cd gopen
```

#### 3. 配置环境变量

```bash
cp server/.env.example server/.env
nano server/.env
```

#### 4. 安装依赖

```bash
pnpm install
```

#### 5. 构建前端

```bash
cd client
pnpm exec expo export --platform web
```

#### 6. 启动后端

```bash
cd ../server
pm2 start pnpm --name "gopen-api" -- run start
pm2 save
pm2 startup
```

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 |
| `S3_ACCESS_KEY` | ✅ | 对象存储 Access Key |
| `S3_SECRET_KEY` | ✅ | 对象存储 Secret Key |
| `JWT_SECRET` | ✅ | JWT 加密密钥 |
| `DOUBAO_API_KEY` | ⬜ | 豆包 API 密钥 |
| `DEEPSEEK_API_KEY` | ⬜ | DeepSeek API 密钥 |
| `KIMI_API_KEY` | ⬜ | Kimi API 密钥 |

完整配置请参考 `server/.env.example`。

## Nginx 配置

### 配置文件位置

- 主配置：`/etc/nginx/nginx.conf`
- SSL 证书：`/etc/nginx/ssl/`

### 常用命令

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 查看状态
sudo systemctl status nginx
```

## SSL 证书

### 申请证书

```bash
sudo certbot certonly --nginx -d woshiguotao.cn -d www.woshiguotao.cn -d api.woshiguotao.cn
```

### 自动续期

```bash
# 添加定时任务
sudo crontab -e

# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## 监控与日志

### 查看服务状态

```bash
# PM2 状态
pm2 status

# 实时日志
pm2 logs gopen-api

# 健康检查
./deploy/health-check.sh
```

### 日志位置

| 日志类型 | 位置 |
|---------|------|
| API 日志 | `/var/log/gopen/` |
| Nginx 日志 | `/var/log/nginx/` |
| PM2 日志 | `~/.pm2/logs/` |

## 故障排查

### API 无法访问

```bash
# 1. 检查服务状态
pm2 status

# 2. 检查端口
netstat -tuln | grep 9091

# 3. 查看日志
pm2 logs gopen-api
```

### 数据库连接失败

```bash
# 检查环境变量
cat server/.env | grep SUPABASE

# 测试连接
curl -H "apikey: YOUR_KEY" https://your-project.supabase.co/rest/v1/
```

### 内存不足

```bash
# 检查内存使用
free -h

# 重启服务
pm2 restart gopen-api

# 添加 Swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 更新部署

```bash
cd /opt/gopen
git pull origin main
pnpm install
pm2 restart gopen-api
```

## 备份策略

```bash
# 备份配置
tar -czvf gopen-backup-$(date +%Y%m%d).tar.gz \
  server/.env \
  deploy/

# 备份数据库（如需）
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## 安全加固

1. **防火墙配置**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **禁用 root SSH 登录**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # PermitRootLogin no
   ```

3. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## 联系支持

- GitHub: https://github.com/a912454361/gopen
- Gitee: https://gitee.com/a912454361/gopen
- 官网: https://woshiguotao.cn
