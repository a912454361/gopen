# SSL 证书部署指南

## 问题诊断

### 腾讯云服务器 (1.15.55.132)
- 状态：SSH 端口开放，支持密码认证
- 问题：密码验证失败
- 可能原因：
  1. 密码不正确
  2. 账户被锁定
  3. 服务器配置了只允许密钥登录

### 阿里云服务器 (8.136.229.243)
- 状态：SSH 端口拒绝连接
- 问题：SSH 服务未运行或端口未开放
- 解决方案：
  1. 登录阿里云控制台
  2. 检查安全组是否放行 22 端口
  3. 通过 VNC 登录服务器执行 `systemctl start sshd`

## 手动部署步骤

### 步骤 1：获取阿里云私钥文件

阿里云密钥对 ID: `38faf6875f74d4d3d973e158127b376f`

请从阿里云控制台下载对应的 `.pem` 私钥文件：
1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 进入「网络与安全」→「密钥对」
3. 找到密钥对 `38faf6875f74d4d3d973e158127b376f`
4. 如果已创建，私钥只能在创建时下载一次
5. 如果丢失，需要创建新密钥对并重新绑定实例

### 步骤 2：配置腾讯云服务器

#### 方法 A：通过控制台重置密码
1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入「云服务器」→ 找到实例
3. 点击「更多」→「密码/密钥」→「重置密码」
4. 设置新密码后重启实例
5. 使用新密码执行部署脚本

#### 方法 B：使用密钥登录
如果服务器已绑定密钥对：
```bash
# 使用私钥登录
ssh -i /path/to/your-key.pem root@1.15.55.132
```

### 步骤 3：手动部署命令

#### 腾讯云 (使用密码)
```bash
# 设置密码环境变量
export SSHPASS='你的密码'

# 创建目录
sshpass -e ssh -o StrictHostKeyChecking=no root@1.15.55.132 "mkdir -p /etc/nginx/ssl"

# 上传证书
sshpass -e scp -o StrictHostKeyChecking=no \
    docs/ssl/gopen.com.cn_bundle.crt \
    docs/ssl/gopen.com.cn.key \
    root@1.15.55.132:/etc/nginx/ssl/

# 配置 Nginx
sshpass -e ssh -o StrictHostKeyChecking=no root@1.15.55.132 'cat > /etc/nginx/conf.d/gopen.conf << EOF
server {
    listen 80;
    server_name gopen.com.cn api.gopen.com.cn;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gopen.com.cn api.gopen.com.cn;
    
    ssl_certificate /etc/nginx/ssl/gopen.com.cn_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/gopen.com.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF'

# 重载 Nginx
sshpass -e ssh -o StrictHostKeyChecking=no root@1.15.55.132 "nginx -t && nginx -s reload"
```

#### 阿里云 (使用密钥)
```bash
# 设置密钥权限
chmod 600 /path/to/38faf6875f74d4d3d973e158127b376f.pem

# 创建目录
ssh -i /path/to/key.pem -o StrictHostKeyChecking=no root@8.136.229.243 "mkdir -p /etc/nginx/ssl"

# 上传证书
scp -i /path/to/key.pem -o StrictHostKeyChecking=no \
    docs/ssl/woshiguotao/woshiguotao.cn.pem \
    docs/ssl/woshiguotao/woshiguotao.cn.key \
    root@8.136.229.243:/etc/nginx/ssl/

# 配置 Nginx
ssh -i /path/to/key.pem -o StrictHostKeyChecking=no root@8.136.229.243 'cat > /etc/nginx/conf.d/woshiguotao.conf << EOF
server {
    listen 80;
    server_name woshiguotao.cn api.woshiguotao.cn;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name woshiguotao.cn api.woshiguotao.cn;
    
    ssl_certificate /etc/nginx/ssl/woshiguotao.cn.pem;
    ssl_certificate_key /etc/nginx/ssl/woshiguotao.cn.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF'

# 重载 Nginx
ssh -i /path/to/key.pem -o StrictHostKeyChecking=no root@8.136.229.243 "nginx -t && nginx -s reload"
```

### 步骤 4：验证部署

```bash
# 验证腾讯云
curl -I https://gopen.com.cn/api/v1/health
curl https://gopen.com.cn/api/v1/health

# 验证阿里云
curl -I https://woshiguotao.cn/api/v1/health
curl https://woshiguotao.cn/api/v1/health
```

## DNS 配置

### 腾讯云 DNSPod
| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 1.15.55.132 |
| A | api | 1.15.55.132 |

### 阿里云 DNS
| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 8.136.229.243 |
| A | api | 8.136.229.243 |

## 常见问题

### Q: 密码正确但无法登录？
A: 检查是否开启了 MFA 多因素认证，或账户是否被锁定

### Q: 阿里云 SSH 端口拒绝连接？
A: 
1. 检查安全组规则是否放行 22 端口
2. 通过阿里云控制台 VNC 登录
3. 执行 `systemctl start sshd` 启动服务
4. 检查防火墙 `firewall-cmd --list-ports`

### Q: 如何重新生成阿里云密钥？
A: 
1. 阿里云控制台 → 密钥对
2. 创建新密钥对
3. 绑定到 ECS 实例
4. 重启实例生效
