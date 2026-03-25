# G open 智能创作助手 - 移动端构建指南

## 版本信息
- **版本**: v1.0.1
- **支持平台**: Android, iOS, macOS

---

## 一、Android APK 构建

### 方式1: 使用 EAS Build（推荐）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 构建 Android APK
cd client
eas build --platform android --profile preview

# 构建 Android App Bundle (用于上架Google Play)
eas build --platform android --profile production
```

### 方式2: 本地构建

```bash
cd client

# 生成 Android 项目
npx expo prebuild --platform android

# 构建 APK
cd android && ./gradlew assembleRelease

# APK 输出位置
# android/app/build/outputs/apk/release/app-release.apk
```

### Android 构建要求
- Node.js 20+
- Java JDK 17
- Android SDK (API 34)
- Gradle 8.x

---

## 二、iOS IPA 构建

### 方式1: 使用 EAS Build（推荐）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 构建 iOS (需要 Apple Developer 账号)
cd client
eas build --platform ios --profile preview

# 构建 App Store 版本
eas build --platform ios --profile production
```

### 方式2: 本地构建（需要 Mac）

```bash
cd client

# 生成 iOS 项目
npx expo prebuild --platform ios

# 使用 Xcode 构建
# 打开 ios/gopen.xcworkspace
# Product -> Archive -> Distribute App
```

### iOS 构建要求
- Mac 电脑 (Apple Silicon 或 Intel)
- Xcode 15+
- Apple Developer 账号 ($99/年)
- iOS 15.0+ 设备

---

## 三、macOS App 构建

### 方式1: 使用 EAS Build

```bash
# 构建 macOS 应用
eas build --platform mac --profile production
```

### 方式2: 本地构建（需要 Mac）

```bash
cd client

# 使用 Electron 打包
npx expo export --platform web
# 然后使用 Electron 打包工具
```

### macOS 构建要求
- Mac 电脑 (Apple Silicon 或 Intel)
- macOS 13+
- Xcode 15+

---

## 四、快速构建脚本

```bash
# 一键构建所有平台
./build-all.sh
```

---

## 五、下载地址

发布页面: https://github.com/a912454361/gopen/releases

---

## 六、常见问题

### Q: Android APK 安装失败？
A: 确保开启了"允许安装未知来源应用"

### Q: iOS 无法安装？
A: 需要使用 Apple Developer 账号签名，或使用 TestFlight 分发

### Q: macOS 提示"无法验证开发者"？
A: 系统偏好设置 -> 安全性与隐私 -> 允许从以下位置下载的App -> 仍要打开

---

## 七、技术支持

- GitHub: https://github.com/a912454361/gopen
- Expo 文档: https://docs.expo.dev
- EAS Build 文档: https://docs.expo.dev/build/introduction
