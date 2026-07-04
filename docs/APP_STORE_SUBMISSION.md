# iOS & Mac App Store 上架指南

## 前置条件

### 1. Apple Developer 账号
- 注册地址：https://developer.apple.com
- 费用：$99/年（个人/公司）或 $299/年（企业）
- 需要准备：
  - 个人：身份证、信用卡
  - 公司：营业执照、邓白氏编码(D-U-N-S)

### 2. App Store Connect 配置
- 登录：https://appstoreconnect.apple.com
- 创建App ID：`com.gopen.app`
- 创建应用记录

---

## 一、iOS 上架流程

### 步骤 1：更新应用配置

```typescript
// client/app.config.ts
ios: {
  supportsTablet: true,
  bundleIdentifier: "com.gopen.app",
  buildNumber: "1", // 每次更新需要递增
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false,
    NSCameraUsageDescription: "允许 G open 使用相机拍照上传",
    NSPhotoLibraryUsageDescription: "允许 G open 访问相册选择图片",
    NSMicrophoneUsageDescription: "允许 G open 使用麦克风录音",
    NSLocationWhenInUseUsageDescription: "G open 需要位置信息提供服务",
    // ... 其他权限描述
  }
}
```

### 步骤 2：配置 EAS Build

```bash
# 安装 EAS CLI（如未安装）
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 配置 iOS 凭证
eas credentials

# 选择 platform: ios
# 选择 action: Set up new credentials
```

### 步骤 3：构建 iOS 应用

```bash
cd client

# 构建生产版本
eas build --platform ios --profile production

# 等待构建完成（约10-30分钟）
# 构建成功后会显示下载链接和提交链接
```

### 步骤 4：提交到 App Store Connect

```bash
# 方式1：通过 EAS 自动提交
eas submit --platform ios --latest

# 方式2：手动下载 .ipa 后上传
# 使用 Transporter 应用上传
```

### 步骤 5：App Store Connect 配置

登录 App Store Connect，完成以下配置：

1. **App 信息**
   - 名称：G open 智能创作助手
   - 副标题：AI驱动的游戏动漫创作平台
   - 主要语言：简体中文
   - 类别：效率 / 娱乐
   - 内容评级：4+

2. **隐私政策 URL**
   - 示例：https://woshiguotao.cn/privacy

3. **截图上传**（必需）
   - iPhone 6.7" (iPhone 15 Pro Max)：至少3张
   - iPhone 6.5" (iPhone 14 Plus)：至少3张
   - iPad Pro 12.9"：至少3张（支持iPad必须提供）

4. **App 预览**（可选）
   - 视频演示应用功能

5. **描述文本**
   ```
   G open 智能创作助手
   
   一款面向游戏和动漫创作者的AI辅助创作平台，支持：
   
   • AI智能对话与创作
   • 图像生成与编辑
   • 视频制作与处理
   • 音频处理与转换
   • 24小时极速制作系统
   • 多种AI模型自由切换
   
   无论是策划、设计还是后期制作，G open都能助您一臂之力。
   
   会员特权：
   • 无限对话次数
   • 优先访问最新模型
   • 专属客服支持
   ```

### 步骤 6：提交审核

```bash
# 在 App Store Connect 中点击"提交审核"
# 审核时间通常为 1-3 天
```

---

## 二、Mac App Store 上架流程

### 方案选择

Expo React Native 项目有两种上架 Mac App Store 的方式：

#### 方案 A：Mac Catalyst（推荐）
将 iPad 版本适配到 Mac，无需额外开发

```typescript
// client/app.config.ts
ios: {
  supportsTablet: true,
  // Mac Catalyst 自动支持
}
```

**优点**：
- 无需额外开发
- 共享同一份代码
- 维护成本低

**缺点**：
- 界面可能不够原生
- 某些功能可能受限

#### 方案 B：原生 macOS 应用
使用 react-native-macos 开发独立版本

**优点**：
- 原生体验
- 完整 macOS 功能

**缺点**：
- 需要额外开发
- 维护成本高

### Mac Catalyst 上架步骤

#### 步骤 1：更新 EAS 配置

```json
// client/eas.json
{
  "build": {
    "production": {
      "distribution": "store",
      "ios": {
        "autoIncrement": true,
        "supportsTablet": true,
        "macosCatalystEnabled": true
      }
    }
  }
}
```

#### 步骤 2：配置 Mac App Store

1. 在 App Store Connect 创建新的 macOS App
2. Bundle ID：`com.gopen.app`（与 iOS 相同）
3. 或使用不同的 Bundle ID：`com.gopen.app.macos`

#### 步骤 3：构建与提交

```bash
# Mac Catalyst 需要通过 Xcode 构建
# 1. 使用 EAS 导出 Xcode 项目
eas build --platform ios --profile production --local

# 2. 下载 .tar.gz 并解压
# 3. 用 Xcode 打开 .xcworkspace 文件
# 4. 选择 "Mac" 作为目标设备
# 5. Archive 并上传到 App Store Connect
```

---

## 三、必备配置清单

### App Store Connect 必填信息

| 项目 | 内容 | 状态 |
|------|------|------|
| App 名称 | G open 智能创作助手 | ✅ |
| Bundle ID | com.gopen.app | ✅ |
| 版本号 | 1.0.3 | ✅ |
| 隐私政策 URL | 需提供 | ⏳ |
| 用户协议 URL | 需提供 | ⏳ |
| 技术支持 URL | 需提供 | ⏳ |
| 截图 | 需拍摄 | ⏳ |
| App 图标 | 1024x1024 | ⏳ |
| 描述文本 | 需编写 | ⏳ |
| 关键词 | 需填写 | ⏳ |

### 敏感权限说明（已配置）

| 权限 | 用途说明 |
|------|----------|
| 相机 | 拍照上传 |
| 相册 | 选择图片/保存图片 |
| 麦克风 | 录音功能 |
| 位置 | 周边服务 |

### 第三方SDK声明

需要在 App Store Connect 中声明使用的SDK：

- WeChat SDK（微信登录/支付）
- Alipay SDK（支付宝支付）
- UnionPay SDK（银联支付）

---

## 四、常见问题处理

### 1. 审核被拒常见原因

**问题：元数据被拒**
- 截图与实际功能不符
- 描述中包含竞品名称
- 关键词堆砌

**问题：功能问题**
- 登录功能异常
- 支付流程不完整
- 隐私政策链接无效

**问题：设计问题**
- 界面过于简陋
- 未适配 iPad
- 横屏适配问题

### 2. 解决方案

```bash
# 测试生产构建
eas build --platform ios --profile preview

# 在 TestFlight 分发测试
eas submit --platform ios --profile preview
```

---

## 五、快速上架命令汇总

```bash
# 1. 安装依赖
npm install -g eas-cli

# 2. 登录
eas login

# 3. 配置凭证
eas credentials

# 4. 构建 iOS
cd client
eas build --platform ios --profile production

# 5. 提交 iOS
eas submit --platform ios --latest

# 6. 查看 Build 状态
eas build:list

# 7. 查看 Submit 状态
eas submit:list
```

---

## 六、后续维护

### 版本更新流程

```bash
# 1. 更新版本号
# app.config.ts: version: "1.0.4", ios.buildNumber: "2"

# 2. 构建新版本
eas build --platform ios --profile production

# 3. 提交审核
eas submit --platform ios --latest
```

### 监控与反馈

- TestFlight 内部测试
- App Store Connect 分析数据
- 用户评价监控

---

## 联系支持

如有问题，请联系：
- Apple Developer Support: https://developer.apple.com/contact/
- Expo Discord: https://chat.expo.dev
