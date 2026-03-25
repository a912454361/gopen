# G open 智能创作助手 - 构建与发布指南

## 📋 目录

1. [环境准备](#环境准备)
2. [Android 构建](#android-构建)
3. [iOS 构建](#ios-构建)
4. [Windows 构建](#windows-构建)
5. [macOS 构建](#macos-构建)
6. [发布流程](#发布流程)
7. [常见问题](#常见问题)

---

## 环境准备

### 必需工具

```bash
# Node.js 20+
node --version  # v20.x.x

# pnpm
npm install -g pnpm

# EAS CLI (Expo Application Services)
npm install -g eas-cli

# 登录 Expo 账户
eas login
```

### 可选工具

```bash
# GitHub CLI (用于发布)
brew install gh  # macOS
# 或从 https://cli.github.com/ 下载

# NSIS (Windows 安装程序制作)
# 从 https://nsis.sourceforge.io/ 下载
```

---

## Android 构建

### 方式一：EAS Build（推荐）

```bash
cd client

# 构建 APK（用于测试）
eas build --platform android --profile android-apk

# 构建 AAB（用于 Google Play）
eas build --platform android --profile android-aab

# 下载构建产物
eas build:list --platform android --limit 1
```

### 方式二：本地构建

```bash
cd client

# 生成原生代码
npx expo prebuild --platform android

# 使用 Gradle 构建
cd android
./gradlew assembleRelease

# 输出位置
# android/app/build/outputs/apk/release/app-release.apk
```

### 签名配置

在 `client/eas.json` 中配置：

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "remote"
      }
    }
  }
}
```

---

## iOS 构建

### 方式一：EAS Build（推荐）

```bash
cd client

# 构建 IPA（Ad Hoc，用于测试）
eas build --platform ios --profile ios-adhoc

# 构建用于 App Store
eas build --platform ios --profile ios-store

# 下载构建产物
eas build:list --platform ios --limit 1
```

### 方式二：本地构建（需要 Mac）

```bash
cd client

# 生成原生代码
npx expo prebuild --platform ios

# 使用 Xcode 构建
open ios/gopen.xcworkspace

# 或使用命令行
cd ios
xcodebuild -workspace gopen.xcworkspace \
  -scheme gopen \
  -configuration Release \
  -archivePath build/gopen.xcarchive \
  archive
```

### App Store 配置

1. 在 [App Store Connect](https://appstoreconnect.apple.com) 创建应用
2. 配置 Bundle ID: `com.gopen.app`
3. 配置签名证书和 Provisioning Profile

---

## Windows 构建

### 方式一：Electron + NSIS

```bash
# 1. 构建 Web 版本
cd client
npx expo export --platform web --output-dir ../dist/web

# 2. 创建 Electron 应用
mkdir -p electron
cp -r dist/web electron/

# 3. 安装 Electron
cd electron
npm init -y
npm install electron --save-dev
npm install electron-builder --save-dev

# 4. 创建主进程文件 main.js
# (参考 scripts/installer/ 目录下的模板)

# 5. 构建 Windows 安装包
npx electron-builder --win --x64

# 输出位置
# electron/dist/gopen-1.0.5-setup.exe
```

### 方式二：使用 NSIS 脚本

```bash
# 1. 安装 NSIS
# 从 https://nsis.sourceforge.io/ 下载安装

# 2. 编译安装脚本
makensis scripts/installer/windows-installer.nsi

# 输出
# release/windows/gopen-1.0.5-setup.exe
```

### NSIS 安装向导特性

- 🎨 高档深色科技风界面
- 📁 自定义安装路径选择
- 🚀 创建桌面快捷方式
- 🔄 开机自启动选项
- 📝 完整的卸载程序
- 🌐 中英文双语支持

---

## macOS 构建

### 方式一：Electron + DMG

```bash
# 1. 构建 Web 版本
cd client
npx expo export --platform web --output-dir ../dist/web

# 2. 创建 Electron 应用
mkdir -p electron
cp -r dist/web electron/

# 3. 安装依赖
cd electron
npm init -y
npm install electron --save-dev
npm install electron-builder --save-dev

# 4. 构建 macOS 应用
npx electron-builder --mac --x64 --arm64

# 输出位置
# electron/dist/gopen-1.0.5.dmg
# electron/dist/gopen-1.0.5-arm64.dmg
```

### 方式二：使用 create-dmg 脚本

```bash
# 运行 DMG 创建脚本
chmod +x scripts/installer/create-dmg.sh
./scripts/installer/create-dmg.sh
```

### DMG 特性

- 🖼️ 精美的背景图片
- 📁 Applications 快捷方式
- 🎯 拖拽安装
- 📦 自动压缩优化

---

## 发布流程

### GitHub Releases

```bash
# 1. 创建标签
git tag -a v1.0.5 -m "Release v1.0.5"

# 2. 推送标签
git push origin v1.0.5

# 3. GitHub Actions 自动构建
# 或手动创建 Release

# 4. 使用 GitHub CLI 创建 Release
gh release create v1.0.5 \
  --title "G open v1.0.5" \
  --notes-file RELEASE_NOTES.md \
  release/android/*.apk \
  release/ios/*.ipa \
  release/windows/*.exe \
  release/macos/*.dmg
```

### 应用商店发布

#### Google Play Store

1. 创建 [Google Play Console](https://play.google.com/console) 账户
2. 创建应用并填写商店信息
3. 上传 AAB 文件
4. 提交审核

```bash
# 使用 EAS 提交
eas submit --platform android --profile production
```

#### Apple App Store

1. 创建 [App Store Connect](https://appstoreconnect.apple.com) 账户
2. 创建应用并填写商店信息
3. 上传 IPA 文件
4. 提交审核

```bash
# 使用 EAS 提交
eas submit --platform ios --profile production
```

#### 国内应用商店

- 华为应用市场: https://developer.huawei.com
- 小米应用商店: https://dev.mi.com
- OPPO 应用商店: https://open.oppomobile.com
- vivo 应用商店: https://dev.vivo.com.cn
- 腾讯应用宝: https://open.tencent.com

---

## 常见问题

### Q: 构建失败，提示证书问题？

**A**: 确保已正确配置签名证书：

```bash
# Android
eas credentials --platform android

# iOS
eas credentials --platform ios
```

### Q: Windows 安装包太大？

**A**: 使用 UPX 压缩可执行文件：

```bash
# 安装 UPX
brew install upx  # macOS
# 或从 https://upx.github.io/ 下载

# 压缩可执行文件
upx --best electron/dist/gopen.exe
```

### Q: iOS 构建需要多长时间？

**A**: EAS Build 通常需要 10-20 分钟。本地构建更快，但需要 Mac 环境。

### Q: 如何更新版本号？

**A**: 修改以下文件：
- `client/app.config.ts` - version 字段
- `client/package.json` - version 字段
- `server/package.json` - version 字段

### Q: 如何处理 GitHub Push Protection 阻止？

**A**: 确保敏感信息不在 Git 历史中：

```bash
# 从历史中删除敏感文件
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/sensitive/file' \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送
git push origin main --force
```

---

## 📞 获取帮助

- **文档**: https://woshiguotao.cn/docs
- **Issues**: https://github.com/a912454361/gopen/issues
- **邮箱**: support@woshiguotao.cn
