# 阿里云部署执行指南

## 服务器信息
- **公网IP**: 8.136.229.243
- **实例ID**: i-bp1hzaym43wbogomh2iu
- **域名**: woshiguotao.cn

---

## 第一步：SSH 连接服务器

### Windows 用户
使用 PowerShell 或 CMD：
```bash
ssh root@8.136.229.243
```

### Mac/Linux 用户
```bash
ssh root@8.136.229.243
```

> 输入密码后进入服务器（密码在阿里云控制台设置或查看）

---

## 第二步：一键部署

**复制以下命令，在服务器上执行：**

```bash
# 下载并执行一键部署脚本
curl -fsSL https://gitee.com/a912454361/gopen/raw/main/deploy/aliyun-install.sh | bash
```

> 脚本会自动安装 Docker、Nginx、克隆代码、配置服务

---

## 第三步：配置域名解析

登录 [阿里云域名控制台](https://dc.console.aliyun.com/)：

### 添加 DNS 记录

| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| **A** | @ | 8.136.229.243 | 600 |
| **A** | www | 8.136.229.243 | 600 |
| **A** | api | 8.136.229.243 | 600 |

### 操作步骤：
1. 进入域名控制台
2. 点击 `woshiguotao.cn` → 解析设置
3. 添加记录 → 选择 A 记录
4. 填写主机记录和记录值
5. 保存

---

## 第四步：配置 HTTPS

### 方式一：阿里云免费证书（推荐）

1. **购买免费证书**
   - 登录 [SSL 证书控制台](https://yundunnext.console.aliyun.com/?p=cas)
   - 点击「购买证书」
   - 选择 **免费DV证书**（¥0）
   - 数量：1

2. **申请证书**
   - 填写域名：`woshiguotao.cn`
   - 勾选「自动添加DNS验证」
   - 提交申请

3. **下载证书**
   - 等待签发（约 10-30 分钟）
   - 下载 Nginx 格式证书
   - 解压得到 `.pem` 和 `.key` 文件

4. **上传证书到服务器**
   ```bash
   # 在服务器上创建 SSL 目录
   mkdir -p /var/www/gopen/deploy/ssl
   
   # 上传证书文件（在本地电脑执行）
   scp woshiguotao.cn.pem root@8.136.229.243:/var/www/gopen/deploy/ssl/
   scp woshiguotao.cn.key root@8.136.229.243:/var/www/gopen/deploy/ssl/
   ```

5. **重启 Nginx**
   ```bash
   # 在服务器上执行
   nginx -t && nginx -s reload
   ```

### 方式二：Let's Encrypt 自动证书

```bash
# 在服务器上执行
yum install -y certbot python3-certbot-nginx
certbot --nginx -d woshiguotao.cn -d www.woshiguotao.cn -d api.woshiguotao.cn
```

---

## 第五步：验证部署

### 在服务器上验证
```bash
# 检查服务状态
docker ps

# 测试后端 API
curl http://localhost:9091/api/v1/health

# 测试前端
curl -I http://localhost:5000
```

### 在本地电脑验证
```bash
# 测试 HTTP 访问
curl http://8.136.229.243:9091/api/v1/health

# 测试域名访问（DNS 生效后）
curl http://woshiguotao.cn
curl http://api.woshiguotao.cn/api/v1/health
```

---

## 常用管理命令

```bash
# 启动服务
/var/www/gopen/deploy/gopen.sh start

# 停止服务
/var/www/gopen/deploy/gopen.sh stop

# 重启服务
/var/www/gopen/deploy/gopen.sh restart

# 查看日志
/var/www/gopen/deploy/gopen.sh logs

# 查看状态
/var/www/gopen/deploy/gopen.sh status

# 更新代码
/var/www/gopen/deploy/gopen.sh update
```

---

## 访问地址

部署完成后访问：

| 地址 | 说明 |
|------|------|
| https://woshiguotao.cn | 官网首页 |
| https://api.woshiguotao.cn/api/v1/health | API 健康检查 |
| http://8.136.229.243:5000 | 直接 IP 访问前端 |
| http://8.136.229.243:9091/api/v1/health | 直接 IP 访问 API |

---

## 安全组配置

确保阿里云安全组已开放以下端口：

| 端口 | 协议 | 说明 |
|------|------|------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 5000 | TCP | 前端服务 |
| 9091 | TCP | 后端 API |

**配置路径**：ECS 控制台 → 实例 → 安全组 → 配置规则

---

## 故障排查

### 问题1：无法 SSH 连接
```bash
# 检查安全组是否开放 22 端口
# 在阿里云控制台检查实例状态是否为「运行中」
```

### 问题2：服务无法访问
```bash
# 检查服务状态
docker ps
systemctl status nginx

# 检查防火墙
firewall-cmd --list-ports
```

### 问题3：域名无法访问
```bash
# 检查 DNS 解析
nslookup woshiguotao.cn
dig woshiguotao.cn

# 应该返回 8.136.229.243
```
