# G open 智能创作助手 - 移动端构建完整指南

## 当前状态

### EAS 云端构建
| 平台 | 状态 | 原因 |
|------|------|------|
| Android | ❌ 额度用完 | 免费计划本月构建次数已用完（4月1日重置） |
| iOS | ⚠️ 需交互 | 需要交互式模式设置证书 |
| macOS | ❌ 不支持 | EAS 不支持 macOS 构建 |

### 本地构建环境
- ✅ Java JDK 17 已安装
- ✅ Android SDK 已安装 (build-tools 34.0.0, platform 34)
- ❌ Gradle 下载超时（网络限制）

---

## 推荐方案：本地构建

### 一、Android APK 构建

#### 前置要求
- Node.js 20+
- Java JDK 17
- Android SDK (API 34)
- Gradle 8.x

#### 构建步骤

```bash
# 1. 克隆项目
git clone https://github.com/a912454361/gopen.git
cd gopen/client

# 2. 安装依赖
pnpm install

# 3. 生成 Android 项目
npx expo prebuild --platform android --clean

# 4. 构建 APK
cd android
./gradlew assembleRelease

# 5. APK 位置
# android/app/build/outputs/apk/release/app-release.apk
```

#### 环境变量设置
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=$JAVA_HOME
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/34.0.0
```

---

### 二、iOS IPA 构建（需要 Mac）

#### 前置要求
- Mac 电脑 (Apple Silicon 或 Intel)
- Xcode 15+
- Apple Developer 账号 ($99/年)

#### 构建步骤

```bash
# 1. 克隆项目
git clone https://github.com/a912454361/gopen.git
cd gopen/client

# 2. 安装依赖
pnpm install

# 3. 生成 iOS 项目
npx expo prebuild --platform ios --clean

# 4. 使用 Xcode 构建
# 打开 ios/gopen.xcworkspace
# Product -> Archive -> Distribute App
```

---

### 三、macOS App 构建（需要 Mac）

#### 构建步骤

```bash
cd gopen/client

# 导出 Web 版本
npx expo export --platform web --output-dir dist

# 使用 Electron 打包
npx electron-builder --mac
```

---

## 快速下载

### 已发布的构建包
- **Windows x64**: [gopen-windows-x64-v1.0.1.tar.gz](https://github.com/a912454361/gopen/releases/download/v1.0.1/gopen-windows-x64-v1.0.1.tar.gz)
- **移动端源码**: [gopen-mobile-v1.0.2.tar.gz](https://github.com/a912454361/gopen/releases/download/v1.0.2/gopen-mobile-v1.0.2.tar.gz)

---

## EAS 云端构建（额度恢复后）

等待 4 月 1 日额度重置后：

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录（使用 Token）
export EXPO_TOKEN=uWjtLE6nlWLuFCcwMNIZL4wxISxMNRp5t9eMPpNj

# 构建
cd client
eas build --platform android --profile preview  # Android
eas build --platform ios --profile preview      # iOS (需交互设置证书)
```

---

## 常见问题

### Q: Gradle 下载太慢？
A: 使用国内镜像：
```bash
# 编辑 android/gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.5-bin.zip
```

### Q: Android SDK 未找到？
A: 安装 Android Studio 或命令行工具：
```bash
# macOS
brew install android-commandlinetools

# Linux
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
```

### Q: iOS 构建需要什么？
A: 
- Apple Developer 账号 ($99/年)
- Mac 电脑
- Xcode 15+
- 有效的 Bundle ID

---

## 联系支持

- GitHub: https://github.com/a912454361/gopen
- Issues: https://github.com/a912454361/gopen/issues
