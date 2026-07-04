# G open 智能创作助手 - 自动部署指南

## 当前状态

✅ **Web 构建产物已准备就绪**：`client/dist/` 目录
✅ **后端服务运行中**：端口 9091
✅ **前端服务运行中**：端口 5000（本地访问）
⏳ **需要手动操作的部署步骤**

---

## 方案一：Web 版上线（推荐 3 种方式）

### 🚀 方式 A：Netlify Drop（最简单，5分钟）

**步骤**：

1. **下载构建产物**
   - 位置：`/workspace/projects/client/dist/` 目录
   - 或下载压缩包：`gopen-web-deploy.tar.gz`

2. **拖放部署**
   - 访问：https://app.netlify.com/drop
   - 注册/登录 Netlify 账号（支持 GitHub/Google 登录）
   - 将 `dist` 文件夹拖放到页面
   - 等待 1-2 分钟

3. **获取访问地址**
   - 自动分配地址如：`https://gopen-app-xxx.netlify.app`
   - 可自定义域名

---

### 🚀 方式 B：Vercel 部署

**已创建项目**：`gopen-app`（项目 ID: `prj_Io30zfRQ4trfImLWpALZOml59Z0g`）

**步骤**：

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录并部署**
   ```bash
   cd /workspace/projects/client
   vercel login
   vercel --prod
   ```

3. **选择部署目录**
   - 当提示 "Which directory?" 时，输入 `dist`

---

### 🚀 方式 C：Cloudflare Pages

**步骤**：

1. 访问：https://pages.cloudflare.com/
2. 登录/注册 Cloudflare 账号
3. 点击 "Create a project" → "Direct Upload"
4. 上传 `dist` 文件夹
5. 等待部署完成

---

## 方案二：Android APK 构建

### 前置条件

需要 Expo 账号（免费注册：https://expo.dev）

### 方式 A：EAS Build（推荐）

**步骤**：

```bash
# 1. 进入前端目录
cd /workspace/projects/client

# 2. 登录 Expo 账号
eas login
# 输入用户名和密码

# 3. 构建 APK
eas build --platform android --profile preview

# 4. 查看构建状态
# 访问 https://expo.dev/accounts/[你的用户名]/projects/gopen/builds
```

**构建时间**：约 15-30 分钟

**构建配置**（已配置在 `eas.json`）：
- `preview` 配置：APK 格式，内部分发
- `production` 配置：AAB 格式，用于 Google Play

---

### 方式 B：本地构建（需要 Android SDK）

**前置条件**：
- Android SDK
- Java JDK 17+

```bash
# 1. 生成原生代码
cd /workspace/projects/client
npx expo prebuild

# 2. 使用 Gradle 构建
cd android
./gradlew assembleRelease

# 3. APK 位置
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 当前服务状态

| 服务 | 端口 | 状态 | 访问方式 |
|------|------|------|----------|
| 前端 (Expo Web) | 5000 | ✅ 运行中 | http://localhost:5000 |
| 后端 (Express) | 9091 | ✅ 运行中 | http://localhost:9091/api/v1/health |

---

## 构建产物清单

| 产物 | 位置 | 大小 | 用途 |
|------|------|------|------|
| Web 静态文件 | `client/dist/` | 11MB | Web 部署 |
| Web 压缩包 | `gopen-web-deploy.tar.gz` | 6.2MB | 下载部署 |
| APK | 待构建 | - | Android 安装包 |
| IPA | 待构建 | - | iOS 安装包 |

---

## 推荐部署顺序

1. **Web 版上线**（立即可做）
   - 使用 Netlify Drop 最快（5分钟）
   - 获得公网访问地址

2. **Android APK 构建**
   - 需要 Expo 账号登录
   - 构建时间约 15-30 分钟

3. **iOS IPA 构建**
   - 需要 Apple 开发者账号（$99/年）
   - 构建时间约 20-40 分钟

---

## 注意事项

1. **Web 部署后记得更新后端 API 地址**
   - 在环境变量中设置 `EXPO_PUBLIC_BACKEND_BASE_URL`
   - 指向你的后端服务地址

2. **Android APK 签名**
   - EAS Build 会自动处理签名
   - 本地构建需要配置签名密钥

3. **iOS 上架**
   - 需要 Apple 开发者账号
   - 需要配置 Bundle ID 和证书

---

**文档版本**: 1.0
**生成时间**: 2024年3月23日
