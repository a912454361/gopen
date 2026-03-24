# G Open 部署与上架指南

## 第一阶段：正式部署上线（方案A）

### 一、准备工作清单

#### 1. 云服务器购买（推荐配置）

| 项目 | 推荐配置 | 预估费用 |
|------|----------|----------|
| **阿里云 ECS** | 2核4G / 40G SSD / 5M带宽 | ¥100-200/月 |
| **腾讯云 CVM** | 2核4G / 50G SSD / 5M带宽 | ¥100-200/月 |
| **华为云 ECS** | 2核4G / 40G SSD / 5M带宽 | ¥100-200/月 |

> 💡 新用户通常有优惠，首年可能只需 ¥50-100

#### 2. 域名购买

| 域名类型 | 示例 | 预估费用 |
|----------|------|----------|
| .com | gopenai.com | ¥55/年 |
| .cn | gopenai.cn | ¥29/年 |
| .app | gopen.app | ¥120/年 |

#### 3. SSL证书（免费方案）

- 阿里云免费SSL证书（每年20张）
- Let's Encrypt 免费证书（自动续期）
- 腾讯云免费SSL证书

---

### 二、部署步骤

#### 步骤 1：购买云服务器

**阿里云购买流程：**
```
1. 访问 https://www.aliyun.com/
2. 注册/登录账号
3. 产品 → 云服务器 ECS → 立即购买
4. 选择配置：
   - 地域：华东/华南（离用户近）
   - 实例：2核4G
   - 系统：Ubuntu 22.04 或 CentOS 8
   - 带宽：5Mbps
5. 付款并等待创建完成（约3-5分钟）
```

#### 步骤 2：购买域名

**阿里云域名购买：**
```
1. 产品 → 域名注册
2. 搜索想要的域名（如 gopenai.com）
3. 选择未注册的域名
4. 实名认证（需要身份证）
5. 付款购买
```

#### 步骤 3：域名备案（中国大陆必须）

```
1. 阿里云控制台 → 域名 → 域名备案
2. 填写主体信息（个人/企业）
3. 上传证件照片
4. 等待审核（通常 7-20 天）
5. 备案成功后才能绑定服务器
```

> ⚠️ 不想备案？可以选择：
> - 购买香港/海外服务器（无需备案，但速度稍慢）
> - 使用 .app/.io 等非国内域名

#### 步骤 4：服务器环境配置

登录服务器后执行：

```bash
# 1. 更新系统
sudo apt update && sudo apt upgrade -y

# 2. 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 安装 pnpm
npm install -g pnpm

# 4. 安装 Nginx
sudo apt install -y nginx

# 5. 安装 PM2（进程管理）
npm install -g pm2

# 6. 安装 Certbot（SSL证书）
sudo apt install -y certbot python3-certbot-nginx
```

#### 步骤 5：上传代码

**方式一：Git 拉取（推荐）**
```bash
# 在服务器上
cd /var/www
git clone <您的代码仓库地址> gopen
cd gopen
```

**方式二：SCP 上传**
```bash
# 在本地电脑执行
scp -r /workspace/projects/* root@您的服务器IP:/var/www/gopen/
```

#### 步骤 6：配置环境变量

```bash
# 创建环境变量文件
cd /var/www/gopen/server
nano .env.production

# 填写以下内容：
NODE_ENV=production
PORT=9091
ADMIN_KEY=gopen_admin_2024
# Supabase 配置（从 Supabase 控制台获取）
SUPABASE_URL=您的supabase_url
SUPABASE_ANON_KEY=您的supabase_key
```

#### 步骤 7：构建和启动

```bash
# 安装依赖
cd /var/www/gopen/server
pnpm install
pnpm build

# 启动后端服务
pm2 start dist/index.js --name "gopen-server"

# 构建前端
cd /var/www/gopen/client
pnpm install
pnpm build

# 构建产物在 client/dist/ 目录
```

#### 步骤 8：Nginx 配置

```bash
# 创建 Nginx 配置
sudo nano /etc/nginx/sites-available/gopen

# 写入以下内容：
server {
    listen 80;
    server_name 您的域名.com;

    # 前端
    location / {
        root /var/www/gopen/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:9091;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 启用配置
sudo ln -s /etc/nginx/sites-available/gopen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 步骤 9：配置 SSL 证书

```bash
# 使用 Let's Encrypt 免费证书
sudo certbot --nginx -d 您的域名.com

# 自动续期
sudo certbot renew --dry-run
```

#### 步骤 10：验证部署

```
访问 https://您的域名.com
- 首页应该正常显示
- 管理后台：https://您的域名.com/admin?key=gopen_admin_2024
```

---

### 三、部署完成后

用户可以通过以下方式访问：

| 访问方式 | 地址 |
|----------|------|
| Web 网页版 | https://您的域名.com |
| 管理后台 | https://您的域名.com/admin?key=xxx |
| iOS Safari | 添加到主屏幕（PWA） |
| Android Chrome | 添加到主屏幕（PWA） |

---

## 第二阶段：上架应用商店（方案B）

### 一、iOS App Store 上架

#### 准备材料

| 材料 | 说明 |
|------|------|
| Apple 开发者账号 | $99/年 |
| 企业营业执照 | 如以企业名义上架 |
| 隐私政策页面 | 必须 |
| 应用截图 | 6.5寸、5.5寸各一套 |
| App 图标 | 1024x1024 PNG |

#### 上架流程

```
1. 注册 Apple 开发者账号
   - 访问 https://developer.apple.com/
   - 选择个人/企业账号
   - 支付 $99/年

2. 准备应用资料
   - App 名称、描述、关键词
   - 应用截图（多种尺寸）
   - 隐私政策 URL

3. 使用 EAS Build 构建
   - 安装 EAS CLI: npm install -g eas-cli
   - 登录 Expo 账号
   - 执行: eas build --platform ios

4. 提交审核
   - 上传到 App Store Connect
   - 填写应用信息
   - 等待审核（通常 1-7 天）

5. 审核通过后上架
   - 用户可从 App Store 搜索下载
```

#### 构建命令

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo
eas login

# 构建 iOS 版本
eas build --platform ios

# 构建完成后，下载 .ipa 文件
# 上传到 App Store Connect
```

### 二、Android 应用市场上架

#### 国内应用市场

| 市场 | 开发者费用 | 审核时间 |
|------|------------|----------|
| 华为应用市场 | 免费 | 1-3天 |
| 小米应用商店 | 免费 | 1-3天 |
| OPPO 应用商店 | 免费 | 1-3天 |
| vivo 应用商店 | 免费 | 1-3天 |
| 腾讯应用宝 | 免费 | 1-3天 |
| 360 手机助手 | 免费 | 1-3天 |

#### Google Play（海外用户）

```
1. 注册 Google Play 开发者账号
   - 访问 https://play.google.com/console
   - 支付 $25 一次性费用

2. 创建应用
   - 填写应用信息
   - 上传 APK/AAB 文件

3. 提交审核
   - 通常 1-3 天

4. 上架后全球用户可下载
```

#### 构建命令

```bash
# 构建 Android APK（用于国内市场）
eas build --platform android --profile preview

# 构建 Android AAB（用于 Google Play）
eas build --platform android

# 构建完成后下载 APK 文件
# 分别提交到各应用市场
```

---

## 三、费用预算汇总

### 第一阶段费用（一次性）

| 项目 | 费用 |
|------|------|
| 云服务器首年 | ¥100-200 |
| 域名首年 | ¥30-120 |
| SSL 证书 | 免费 |
| **小计** | **¥130-320** |

### 第二阶段费用

| 项目 | 费用 |
|------|------|
| Apple 开发者账号 | $99/年 (约 ¥700) |
| Google Play 开发者 | $25 一次性 (约 ¥180) |
| 国内应用市场 | 免费 |
| **小计** | **¥880（首年）** |

---

## 四、时间预估

| 阶段 | 步骤 | 时间 |
|------|------|------|
| **方案A** | 购买服务器/域名 | 1天 |
| | 域名备案 | 7-20天 |
| | 部署上线 | 1天 |
| **方案B** | 注册开发者账号 | 1-3天 |
| | 构建应用 | 1天 |
| | iOS 审核 | 1-7天 |
| | Android 各市场审核 | 1-3天 |

---

## 五、我需要您提供的信息

### 立即需要（用于部署配置）

- [ ] 云服务器 IP 地址
- [ ] 域名
- [ ] Supabase 项目 URL 和 Key

### 上架时需要

- [ ] Apple 开发者账号（Apple ID）
- [ ] 企业营业执照（如以企业名义上架）
- [ ] 隐私政策页面 URL
- [ ] 应用图标（1024x1024）

---

## 六、下一步行动

**请告诉我：**

1. 您是否已有云服务器？（如果有，请提供 IP 地址）
2. 您是否已有域名？
3. 您想先完成哪个平台的上架？（iOS / Android / 都要）

**收到信息后，我可以：**

1. 帮您生成部署脚本
2. 配置服务器环境
3. 准备上架所需的配置文件
