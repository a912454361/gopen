# G open 双平台部署指南

## 📋 部署概览

```
┌─────────────────────────────────────────────────────────────┐
│                    双平台并行部署                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   阶段一（立即）        阶段二（1-3天）      阶段三（备案后） │
│                                                             │
│   阿里云 ECS           阿里云 ECS           腾讯云 SCF      │
│   IP 直连              + SSL                + 函数 URL      │
│   ↓                    ↓                    ↓               │
│   开发测试             正式上线             生产环境         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 阶段一：阿里云 ECS 部署（立即可用）

### 1.1 当前状态
- ✅ 后端服务运行中：`http://8.136.229.243:9091`
- ✅ 健康检查正常：`/api/v1/health`
- ⚠️ 无 HTTPS，需配置 SSL

### 1.2 快速使用（无需配置）
```bash
# 前端环境变量
EXPO_PUBLIC_BACKEND_BASE_URL=http://8.136.229.243:9091

# 测试 API
curl http://8.136.229.243:9091/api/v1/health
```

---

## 🔐 阶段二：阿里云 SSL 证书配置

### 2.1 申请 SSL 证书（阿里云）

1. 登录 [阿里云 SSL 证书控制台](https://yundun.console.aliyun.com/?p=cas)
2. 点击 **购买证书** → 选择 **免费证书**（DV 单域名）
3. 填写域名：`gopen.com.cn`
4. 选择 **DNS 验证**
5. 提交申请

### 2.2 添加 DNS 验证记录

在阿里云 DNS 解析中添加：

| 记录类型 | 主机记录 | 记录值 |
|----------|----------|--------|
| TXT | `_dnsauth` | `[阿里云提供的验证字符串]` |

### 2.3 下载并部署证书

证书签发后：
1. 下载 **Nginx** 格式证书
2. 上传到 ECS：

```bash
# 在本地执行
scp gopen.com.cn.pem root@8.136.229.243:/etc/nginx/ssl/
scp gopen.com.cn.key root@8.136.229.243:/etc/nginx/ssl/
```

### 2.4 配置 Nginx

```bash
# SSH 登录 ECS
ssh root@8.136.229.243

# 创建 SSL 目录
mkdir -p /etc/nginx/ssl

# 上传配置文件（从 docs/nginx/gopen-nginx.conf）
# 然后执行：
nginx -t
nginx -s reload
```

### 2.5 开放安全组端口

在阿里云 ECS 安全组中添加：

| 端口 | 协议 | 授权对象 |
|------|------|----------|
| 80 | TCP | 0.0.0.0/0 |
| 443 | TCP | 0.0.0.0/0 |
| 9091 | TCP | 0.0.0.0/0 |

---

## ☁️ 阶段三：腾讯云 SCF 部署

### 3.1 SSL 证书申请（腾讯云）

1. 登录 [腾讯云 SSL 证书控制台](https://console.cloud.tencent.com/ssl)
2. 点击 **申请免费证书**
3. 填写域名：`gopen.com.cn`
4. 选择 **DNS 验证**

### 3.2 添加 DNS 验证记录

**重要**：需要同时添加阿里云和腾讯云的验证记录

| 记录类型 | 主机记录 | 记录值 | 用途 |
|----------|----------|--------|------|
| TXT | `_dnsauth` | `[阿里云验证串]` | 阿里云 SSL |
| TXT | `_dnsauth.tencent` | `[腾讯云验证串]` | 腾讯云 SSL |

```bash
# 验证 DNS 记录
nslookup -type=TXT _dnsauth.gopen.com.cn
nslookup -type=TXT _dnsauth.tencent.gopen.com.cn
```

### 3.3 上传 SCF 代码

```bash
# 在本地执行
cd /workspace/projects/server
bash scripts/scf-package.sh

# 上传生成的 gopen-scf-package.tar.gz 到腾讯云 SCF
```

### 3.4 配置 SCF 函数

在腾讯云 SCF 控制台：

| 配置项 | 值 |
|--------|------|
| 函数名 | `express_demo-1774288018` |
| 运行环境 | Node.js 18 |
| 内存 | 512 MB |
| 超时 | 30 秒 |
| 入口文件 | `scf-handler.handler` |

### 3.5 配置环境变量

```
DATABASE_URL=your_database_url
ADMIN_KEY=your_admin_key
NODE_ENV=production
```

### 3.6 配置函数 URL

| 配置项 | 值 |
|--------|------|
| 域名 | `gopen.com.cn` |
| 路径映射 | `/*` → 函数 |
| HTTPS | 启用 |
| 证书 | 选择已申请的证书 |

---

## 🔄 DNS 解析切换

### 当前配置（阿里云 ECS）

```
记录类型: A
主机记录: @
记录值: 8.136.229.243
```

### 备案后切换（腾讯云 SCF）

```
记录类型: CNAME
主机记录: @
记录值: [腾讯云提供的函数 URL 域名]
```

### 推荐配置（子域名分流）

```
gopen.com.cn        → CNAME → 腾讯云 SCF（主站）
api.gopen.com.cn    → A      → 8.136.229.243（API）
test.gopen.com.cn   → A      → 8.136.229.243（测试）
prod.gopen.com.cn   → CNAME  → 腾讯云 SCF（生产）
```

---

## 📱 前端配置

### 开发环境
```env
EXPO_PUBLIC_BACKEND_BASE_URL=http://8.136.229.243:9091
```

### 生产环境
```env
EXPO_PUBLIC_BACKEND_BASE_URL=https://gopen.com.cn
```

---

## ✅ 检查清单

### 阿里云 ECS（阶段一）
- [ ] 确认后端服务运行正常
- [ ] 安全组开放 80/443/9091 端口
- [ ] 申请 SSL 证书
- [ ] 配置 Nginx 反向代理
- [ ] 测试 HTTPS 访问

### 腾讯云 SCF（阶段二）
- [ ] 上传 SCF 代码
- [ ] 配置环境变量
- [ ] 申请 SSL 证书
- [ ] 配置函数 URL
- [ ] 完成 ICP 备案
- [ ] 切换 DNS 解析

---

## 🔧 常用命令

```bash
# 测试 API
curl http://8.136.229.243:9091/api/v1/health
curl https://gopen.com.cn/api/v1/health

# 查看 DNS 解析
nslookup gopen.com.cn

# SSH 登录 ECS
ssh root@8.136.229.243

# 查看 Nginx 状态
nginx -t
nginx -s reload

# 查看 Node 服务日志
pm2 logs
```
