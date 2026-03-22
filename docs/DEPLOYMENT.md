# G open 智能创作助手 - 部署指南

本文档提供完整的部署流程，覆盖 Web、Android 和 iOS 三大平台。

---

## 目录

1. [前置条件](#前置条件)
2. [Web 部署](#web-部署)
3. [Android 部署](#android-部署)
4. [iOS 部署](#ios-部署)
5. [后端服务部署](#后端服务部署)
6. [环境变量配置](#环境变量配置)
7. [常见问题](#常见问题)

---

## 前置条件

### 必需账号
- [Expo 账号](https://expo.dev/signup)（免费）
- [Google Play 开发者账号](https://play.google.com/console/signup)（$25 一次性费用，用于 Android 上架）
- [Apple 开发者账号](https://developer.apple.com/programs/)（$99/年，用于 iOS 上架）

### 必需工具
- Node.js 18+ LTS
- pnpm（包管理器）
- EAS CLI（Expo Application Services）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login
```

---

## Web 部署

### 方案一：静态托管（推荐）

#### 1. 构建 Web 版本
```bash
cd client
npx expo export --platform web
```

构建产物位于 `client/dist/` 目录。

#### 2. 部署选项

**选项 A：Vercel（推荐）**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
cd client
vercel --prod

# 或通过 GitHub 仓库自动部署
```

**选项 B：Netlify**
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 部署
cd client
netlify deploy --prod --dir=dist
```

**选项 C：GitHub Pages**
```bash
# 在项目根目录创建 GitHub Actions 工作流
# .github/workflows/deploy-web.yml
```

**选项 D：自有服务器**
```bash
# 将 dist 目录上传到服务器
scp -r dist/* user@server:/var/www/gopen/
```

### 方案二：服务端渲染（SSR）

如需 SEO 优化，可使用 Expo 的 SSR 模式：
```bash
cd client
npx expo export --platform web --output-dir server
```

---

## Android 部署

### 快速分发（APK）

适用于测试、内部分发或第三方应用市场。

#### 1. 构建 APK
```bash
cd client

# 使用 EAS 构建 APK
eas build --platform android --profile apk

# 或使用预览配置（开发测试）
eas build --platform android --profile preview
```

#### 2. 下载 APK
构建完成后，在 Expo 控制台下载 APK 文件：
- 控制台地址：https://expo.dev/accounts/[your-account]/projects/[project-name]/builds

#### 3. 分发方式
- 直接分享 APK 下载链接
- 上传到第三方应用市场（如：酷安、豌豆荚）
- 使用 Firebase App Distribution 进行内部分发

### Google Play 上架（AAB）

适用于 Google Play 官方上架。

#### 1. 配置应用信息
确保 `app.config.ts` 中包含完整信息：
```typescript
android: {
  package: "com.gopen.app",
  versionCode: 1,
  permissions: [...],
  googleServicesFile: "./google-services.json" // Firebase 配置（可选）
}
```

#### 2. 构建 AAB
```bash
cd client

# 构建用于 Google Play 的 AAB
eas build --platform android --profile aab
```

#### 3. 提交到 Google Play
```bash
# 自动提交（需配置 Google Service Account）
eas submit --platform android --profile production

# 或手动上传到 Google Play Console
```

#### 4. Google Play Console 配置
1. 登录 [Google Play Console](https://play.google.com/console)
2. 创建新应用
3. 填写商店信息：
   - 应用名称：G open 智能创作助手
   - 简短描述：AI 驱动的游戏动漫创作助手
   - 完整描述：（参考应用介绍）
   - 应用图标：512x512 PNG
   - 截图：至少 2 张（手机、平板）
   - 分类：工具 / 效率
   - 内容分级：填写问卷获取分级
4. 上传 AAB 文件
5. 设置定价（免费/付费）
6. 提交审核

---

## iOS 部署

### TestFlight 分发（测试）

#### 1. 构建 iOS 应用
```bash
cd client

# 构建用于 TestFlight 的 IPA
eas build --platform ios --profile preview
```

#### 2. 提交到 TestFlight
```bash
# 自动提交
eas submit --platform ios --profile production

# 或通过 App Store Connect 手动上传
```

#### 3. TestFlight 配置
1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 创建新应用
3. 上传构建版本
4. 添加内部/外部测试员
5. 分发测试版本

### App Store 上架

#### 1. 配置应用信息
确保 `app.config.ts` 中包含完整信息：
```typescript
ios: {
  bundleIdentifier: "com.gopen.app",
  buildNumber: "1",
  supportsTablet: true,
  infoPlist: {
    NSCameraUsageDescription: "G open 需要访问相机以拍摄照片和视频",
    NSPhotoLibraryUsageDescription: "G open 需要访问相册以上传和保存图片",
    NSMicrophoneUsageDescription: "G open 需要访问麦克风以录制视频声音"
  }
}
```

#### 2. 构建 IPA
```bash
cd client

# 构建 App Store 版本
eas build --platform ios --profile ipa
```

#### 3. 提交审核
```bash
# 自动提交
eas submit --platform ios --profile production
```

#### 4. App Store Connect 配置
1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 填写应用信息：
   - 名称：G open 智能创作助手
   - 副标题：AI 创作，无限可能
   - 描述：（参考应用介绍）
   - 关键词：AI,创作,游戏,动漫,写作,图像
   - 技术支持 URL
   - 隐私政策 URL
3. 上传截图（必需尺寸）：
   - 6.7" iPhone（1290x2796）
   - 6.5" iPhone（1284x2778）
   - 5.5" iPhone（1242x2208）
   - 12.9" iPad（2048x2732）
4. 选择构建版本
5. 提交审核

---

## 后端服务部署

### 方案一：云服务器部署

#### 1. 准备服务器
- 推荐配置：2核 CPU / 4GB 内存 / 50GB 存储
- 操作系统：Ubuntu 22.04 LTS

#### 2. 安装依赖
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2（进程管理）
npm install -g pm2
```

#### 3. 部署代码
```bash
# 克隆代码
git clone [repository-url] /var/www/gopen
cd /var/www/gopen/server

# 安装依赖
pnpm install

# 构建生产版本
pnpm run build

# 配置环境变量
cp .env.example .env
nano .env
```

#### 4. 启动服务
```bash
# 使用 PM2 启动
pm2 start npm --name "gopen-api" -- run start:prod

# 设置开机自启
pm2 startup
pm2 save
```

#### 5. 配置 Nginx 反向代理
```nginx
server {
    listen 80;
    server_name api.gopen.com;

    location / {
        proxy_pass http://localhost:9091;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 方案二：Docker 部署

#### 1. 创建 Dockerfile
```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 9091

CMD ["pnpm", "run", "start:prod"]
```

#### 2. 构建并运行
```bash
docker build -t gopen-api .
docker run -d -p 9091:9091 --env-file .env gopen-api
```

### 方案三：云平台部署

#### Vercel / Railway / Render
适合快速部署，支持自动 CI/CD：
```bash
# 连接 GitHub 仓库
# 配置构建命令：pnpm run build
# 配置启动命令：pnpm run start:prod
# 添加环境变量
```

---

## 环境变量配置

### 后端环境变量（.env）

```bash
# 服务配置
NODE_ENV=production
PORT=9091

# 数据库
DATABASE_URL=postgresql://...

# 对象存储
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
S3_REGION=auto
S3_ENDPOINT=...

# AI 服务
COZE_API_KEY=...

# 支付
WECHAT_PAY_APP_ID=...
ALIPAY_APP_ID=...

# OAuth
GOOGLE_CLIENT_ID=...
APPLE_CLIENT_ID=...
```

### 前端环境变量

```bash
# 自动注入
EXPO_PUBLIC_BACKEND_BASE_URL=https://api.gopen.com
```

---

## 常见问题

### Q1: EAS 构建失败怎么办？

查看构建日志：
```bash
eas build:view [BUILD_ID]
```

常见原因：
- 环境变量未配置
- 依赖版本冲突
- 原生模块配置错误

### Q2: iOS 构建需要 Mac 吗？

不需要。EAS 在云端 Mac 服务器上构建，无需本地 Mac。

### Q3: 如何更新应用版本？

```bash
# 更新版本号
# app.config.ts: version: "1.0.1"

# 构建新版本
eas build --platform all --profile production

# 提交更新
eas submit --platform all --profile production
```

### Q4: 如何实现热更新？

Expo 支持通过 Update API 实现热更新：
```bash
# 发布更新
eas update --branch production --message "修复bug"
```

### Q5: 应用签名如何管理？

EAS 自动管理签名，首次构建会自动生成：
- Android: Keystore
- iOS: Certificates & Provisioning Profiles

---

## 部署清单

### Web 部署
- [ ] 执行 Web 构建
- [ ] 配置域名和 SSL
- [ ] 部署到托管平台
- [ ] 验证访问正常

### Android 部署
- [ ] 配置应用签名
- [ ] 构建 APK（测试）/ AAB（上架）
- [ ] 准备商店素材
- [ ] 提交到 Google Play

### iOS 部署
- [ ] 配置 Apple 开发者账号
- [ ] 配置 Bundle ID 和签名
- [ ] 构建 IPA
- [ ] 准备商店素材
- [ ] 提交到 App Store

### 后端部署
- [ ] 配置服务器环境
- [ ] 部署后端服务
- [ ] 配置数据库
- [ ] 配置域名和 SSL
- [ ] 验证 API 可访问

---

## 联系支持

如有问题，请联系开发团队或在 GitHub 提交 Issue。
