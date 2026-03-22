# G open 智能创作助手 - 快速部署指南

## 🚀 Web 版部署（推荐：5分钟上线）

### 方案一：Netlify 拖放部署（最简单）

1. **下载构建产物**：
   - 从项目根目录获取 `gopen-web.tar.gz` 文件（约 6.2MB）
   - 解压得到 `dist` 文件夹

2. **拖放部署**：
   - 访问 [Netlify Drop](https://app.netlify.com/drop)
   - 登录/注册 Netlify 账号
   - 将 `dist` 文件夹拖放到页面上
   - 等待 1-2 分钟即可获得在线地址

3. **配置域名**（可选）：
   - Site settings → Domain management → Add custom domain
   - 例如：`gopen.netlify.app`（免费）或自定义域名

### 方案二：Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入项目目录
cd client

# 登录并部署
vercel --prod

# 按提示操作：
# 1. Link to existing project? No
# 2. Project name? gopen-app
# 3. Directory? dist
# 4. Settings? 默认即可
```

### 方案三：Cloudflare Pages

1. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 登录/注册 Cloudflare 账号
3. 点击 "Create a project" → "Direct Upload"
4. 上传 `dist` 文件夹
5. 等待部署完成

---

## 📱 Android APK 构建与分发

### 自动构建（推荐）

```bash
# 进入前端目录
cd client

# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 构建 APK（约 15-30 分钟）
eas build --platform android --profile apk

# 构建完成后下载 APK
# 访问 https://expo.dev/accounts/[你的用户名]/projects/gopen/builds
```

### 手动构建（备用）

```bash
# 生成原生代码
npx expo prebuild

# 使用 Android Studio 构建
# 或使用命令行：
cd android && ./gradlew assembleRelease
```

### 分发方式

1. **直接下载**：提供 APK 下载链接
2. **应用市场**：
   - 腾讯应用宝
   - 华为应用市场
   - 小米应用商店
   - Google Play（需开发者账号）

---

## 🍎 iOS 版构建（需要 Apple 开发者账号）

### 前置条件

- Apple 开发者账号（$99/年）
- 已配置 Bundle ID 和证书

### 构建步骤

```bash
# 构建 IPA
eas build --platform ios --profile ipa

# 或提交到 App Store
eas build --platform ios --profile production
eas submit --platform ios
```

---

## 🌐 后端服务部署

### 选项一：Railway（推荐）

```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录并部署
railway login
railway init
railway up

# 配置环境变量
railway variables set NODE_ENV=production
```

### 选项二：自托管服务器

```bash
# 使用 PM2 运行
npm install -g pm2
cd server
pm2 start npm --name "gopen-api" -- run start

# 配置 Nginx 反向代理
# /etc/nginx/sites-available/gopen.conf
```

---

## ✅ 部署检查清单

### Web 版上线前

- [ ] 前端构建成功（`dist` 目录存在）
- [ ] 静态资源加载正常
- [ ] API 接口可访问
- [ ] 支付功能测试
- [ ] 登录/注册测试

### 移动端上线前

- [ ] 签名配置正确
- [ ] 权限声明完整
- [ ] 图标和启动页正确
- [ ] 核心功能测试
- [ ] 不同设备兼容测试

---

## 🔧 常见问题

### Q1: Web 页面空白？

检查 `dist/index.html` 中的资源路径是否正确，确保是相对路径。

### Q2: API 请求失败？

1. 检查后端服务是否正常运行
2. 确认 CORS 配置正确
3. 验证环境变量配置

### Q3: APK 安装失败？

1. 检查手机是否允许安装未知来源应用
2. 确认 APK 签名正确
3. 检查最低 Android 版本要求（Android 6.0+）

---

## 📞 技术支持

如遇问题，请查阅：
- [Expo 官方文档](https://docs.expo.dev/)
- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [Netlify 文档](https://docs.netlify.com/)
