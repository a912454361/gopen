# G open Android 构建指南

## 版本信息
- 版本号: v1.0.3
- 包名: com.gopen.app
- 最低SDK: Android 6.0 (API 23)

## 构建要求

### 环境要求
- Node.js 18+ 
- pnpm 8+
- Java JDK 17
- Android SDK (API 34)
- Android NDK (可选)

### 安装依赖

```bash
# 安装 pnpm
npm install -g pnpm

# 安装 EAS CLI（可选，用于云端构建）
npm install -g eas-cli
```

## 构建方式

### 方式一：本地构建（推荐）

```bash
# 1. 解压源码包
tar -xzvf gopen-android-v1.0.3.tar.gz
cd gopen-android

# 2. 安装依赖
cd client
pnpm install

# 3. 构建 APK（需要 Android SDK）
cd ..
npx expo prebuild --platform android
cd android
./gradlew assembleRelease

# 输出位置: android/app/build/outputs/apk/release/app-release.apk
```

### 方式二：EAS 云端构建

```bash
# 1. 登录 EAS
eas login

# 2. 构建 APK
eas build --platform android --profile preview

# 3. 构建 AAB（用于上架 Google Play）
eas build --platform android --profile production
```

### 方式三：使用 Expo Go 测试

```bash
# 1. 安装依赖
cd client && pnpm install

# 2. 启动开发服务器
pnpm start

# 3. 使用 Expo Go 扫码测试
```

## 签名配置

### 创建签名密钥

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore gopen.keystore \
  -alias gopen \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 配置签名

在 `android/app/build.gradle` 中添加:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../gopen.keystore')
            storePassword 'your-store-password'
            keyAlias 'gopen'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 权限说明

应用需要以下权限：
- `INTERNET` - 网络访问
- `CAMERA` - 相机（扫码、拍照）
- `READ_EXTERNAL_STORAGE` - 读取存储
- `WRITE_EXTERNAL_STORAGE` - 写入存储
- `RECORD_AUDIO` - 录音（语音功能）
- `ACCESS_FINE_LOCATION` - 位置（可选）

## 上架应用商店

### Google Play
1. 创建开发者账号 ($25 一次性费用)
2. 上传 AAB 文件
3. 填写应用信息
4. 提交审核

### 国内应用商店
- 华为应用市场
- 小米应用商店
- OPPO 应用商店
- vivo 应用商店
- 腾讯应用宝

## 问题排查

### Gradle 下载超时
```bash
# 使用国内镜像
# 编辑 android/gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.3-bin.zip
```

### SDK 未找到
```bash
# 设置 ANDROID_HOME
export ANDROID_HOME=/path/to/android-sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 联系支持

- GitHub: https://github.com/a912454361/gopen
- 问题反馈: https://github.com/a912454361/gopen/issues
