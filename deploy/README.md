# 阿里云部署快速指南

## 一、准备工作

### 1. 购买阿里云 ECS 服务器

**推荐配置：**
- 实例规格：2核4G (ecs.c6.large)
- 操作系统：CentOS 7.9 64位
- 存储：40GB 高效云盘
- 带宽：5Mbps

**购买地址：** https://ecs.console.aliyun.com/

### 2. 配置安全组

在 ECS 控制台，添加安全组规则：

| 端口 | 协议 | 授权对象 | 说明 |
|------|------|----------|------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 5000 | TCP | 0.0.0.0/0 | 前端服务 |
| 9091 | TCP | 0.0.0.0/0 | 后端 API |

---

## 二、一键部署

### 方式一：使用一键部署脚本（推荐）

```bash
# SSH 连接到服务器
ssh root@你的服务器IP

# 下载并执行一键部署脚本
curl -fsSL https://raw.githubusercontent.com/a912454361/gopen/main/deploy/aliyun-install.sh | bash
```

### 方式二：手动部署

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
systemctl start docker && systemctl enable docker

# 2. 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 3. 克隆代码
mkdir -p /var/www/gopen && cd /var/www/gopen
git clone https://gitee.com/a912454361/gopen.git .  # 国内使用 Gitee

# 4. 配置环境变量
cp server/.env.example server/.env
vi server/.env  # 编辑配置

# 5. 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

---

## 三、配置域名解析

### 1. 添加 DNS 记录

登录 [阿里云域名控制台](https://dc.console.aliyun.com/)：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 你的服务器公网IP |
| A | www | 你的服务器公网IP |
| A | api | 你的服务器公网IP |

### 2. 等待 DNS 生效（通常 10 分钟内）

```bash
# 验证 DNS 解析
ping woshiguotao.cn
```

---

## 四、配置 HTTPS

### 方式一：阿里云免费证书（推荐）

1. 登录 [SSL 证书控制台](https://yundunnext.console.aliyun.com/?p=cas)
2. 购买证书 → 选择 **免费DV证书**（每年¥0）
3. 填写域名：`woshiguotao.cn`
4. 验证域名（添加 DNS TXT 记录）
5. 等待签发（1-24 小时）
6. 下载 Nginx 格式证书
7. 上传到服务器：

```bash
# 创建 SSL 目录
mkdir -p /var/www/gopen/deploy/ssl

# 上传证书文件
# woshiguotao.cn.pem
# woshiguotao.cn.key
```

### 方式二：Let's Encrypt（免费自动）

```bash
# 安装 Certbot
yum install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d woshiguotao.cn -d www.woshiguotao.cn -d api.woshiguotao.cn

# 自动续期
echo "0 3 * * * /usr/bin/certbot renew --quiet" | crontab -
```

---

## 五、验证部署

```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 测试 API
curl http://localhost:9091/api/v1/health

# 测试前端
curl -I http://localhost:5000

# 测试 HTTPS
curl https://woshiguotao.cn
curl https://api.woshiguotao.cn/api/v1/health
```

---

## 六、常用命令

```bash
# 启动服务
./deploy/gopen.sh start

# 停止服务
./deploy/gopen.sh stop

# 重启服务
./deploy/gopen.sh restart

# 查看日志
./deploy/gopen.sh logs

# 查看状态
./deploy/gopen.sh status

# 更新代码
./deploy/gopen.sh update
```

---

## 七、监控与维护

### 查看日志

```bash
# 所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 指定服务日志
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f frontend

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 监控资源

```bash
# 系统资源
htop

# Docker 容器资源
docker stats

# 磁盘使用
df -h
```

### 备份数据

```bash
# 备份上传文件
tar -czf backup_$(date +%Y%m%d).tar.gz /var/www/gopen/uploads

# 备份到 OSS
# aliyun oss cp backup_xxx.tar.gz oss://your-bucket/backups/
```

---

## 八、故障排查

### 问题 1：容器无法启动

```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs

# 检查端口占用
netstat -tlnp | grep -E "5000|9091"

# 重启 Docker
systemctl restart docker
```

### 问题 2：Nginx 502 错误

```bash
# 检查后端服务
curl http://localhost:9091/api/v1/health

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### 问题 3：DNS 解析问题

```bash
# 检查 DNS
nslookup woshiguotao.cn
dig woshiguotao.cn

# 刷新 DNS 缓存
systemctl restart nscd  # CentOS
```

---

## 九、费用估算

### 最小配置（月费用）

| 项目 | 费用 |
|------|------|
| ECS 2核4G | ¥100-150 |
| 域名 .cn | ¥4/月 |
| SSL 证书 | ¥0（免费） |
| OSS 存储 | ¥5-10 |
| **总计** | **¥110-165/月** |

---

## 十、联系支持

- GitHub: https://github.com/a912454361/gopen
- Gitee: https://gitee.com/a912454361/gopen
- 部署文档: docs/ALIYUN_DEPLOYMENT.md
