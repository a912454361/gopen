# G open iOS 构建指南

## 版本信息
- 版本号: v1.0.3
- Bundle ID: com.gopen.app
- 最低版本: iOS 13.0

## 构建要求

### 硬件要求
- Mac 电脑（Intel 或 Apple Silicon）
- 至少 8GB 内存
- 至少 30GB 可用空间

### 软件要求
- macOS 12.0+
- Xcode 14.0+
- Node.js 18+
- pnpm 8+
- CocoaPods

### 安装依赖

```bash
# 安装 Homebrew（如未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node

# 安装 pnpm
npm install -g pnpm

# 安装 CocoaPods
sudo gem install cocoapods

# 安装 EAS CLI
npm install -g eas-cli
```

## 构建方式

### 方式一：本地构建（推荐）

```bash
# 1. 解压源码包
tar -xzvf gopen-ios-v1.0.3.tar.gz
cd gopen-ios

# 2. 安装依赖
cd client
pnpm install

# 3. 生成原生项目
npx expo prebuild --platform ios

# 4. 安装 iOS 依赖
cd ios
pod install

# 5. 打开 Xcode
open GOpen.xcworkspace

# 6. 在 Xcode 中构建
# 选择目标设备 -> Product -> Archive
```

### 方式二：EAS 云端构建

```bash
# 1. 登录 EAS
eas login

# 2. 配置 Apple Developer 凭证
eas credentials

# 3. 构建测试版
eas build --platform ios --profile development

# 4. 构建生产版
eas build --platform ios --profile production
```

### 方式三：TestFlight 分发

```bash
# 1. 构建并上传
eas build --platform ios --profile production --auto-submit

# 2. 在 App Store Connect 配置 TestFlight
```

## 签名配置

### Apple Developer 账号
- 个人账号: $99/年
- 企业账号: $299/年

### 配置步骤

1. 在 Apple Developer 创建 App ID
2. 创建开发/发布证书
3. 创建 Provisioning Profile
4. 在 Xcode 中配置签名

```bash
# 使用 EAS 自动管理签名
eas credentials
```

## 权限说明

应用需要以下权限（已在 Info.plist 配置）：
- `NSCameraUsageDescription` - 相机权限
- `NSPhotoLibraryUsageDescription` - 相册权限
- `NSMicrophoneUsageDescription` - 麦克风权限
- `NSLocationWhenInUseUsageDescription` - 位置权限
- `NSFaceIDUsageDescription` - Face ID 权限

## 上架 App Store

### 准备工作
1. 准备应用截图（各尺寸）
2. 准备应用图标（1024x1024）
3. 准备应用描述
4. 准备隐私政策链接
5. 准备支持网站链接

### 提交流程

```bash
# 1. 构建
eas build --platform ios --profile production

# 2. 提交审核
eas submit --platform ios

# 3. 在 App Store Connect 完善信息
```

### 审核时间
- 通常 1-3 个工作日
- 首次提交可能需要更长时间

## 问题排查

### Pod install 失败
```bash
# 更新 CocoaPods 仓库
pod repo update

# 清理缓存
pod cache clean --all
pod install
```

### 签名错误
```bash
# 检查证书
security find-identity -v -p codesigning

# 重新生成凭证
eas credentials --platform ios
```

### Xcode 版本不兼容
```bash
# 更新 Xcode
xcode-select --install

# 或从 App Store 更新
```

## 联系支持

- GitHub: https://github.com/a912454361/gopen
- 问题反馈: https://github.com/a912454361/gopen/issues
