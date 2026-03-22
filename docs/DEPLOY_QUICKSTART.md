# 快速部署指南

## 一键命令

### Web 部署
```bash
cd /workspace/projects/client
npx expo export --platform web
# 部署 dist/ 目录到任意静态托管服务
```

### Android APK（测试/分发）
```bash
cd /workspace/projects/client
eas login  # 首次需要登录
eas build --platform android --profile apk
```

### Android AAB（Google Play）
```bash
cd /workspace/projects/client
eas build --platform android --profile aab
eas submit --platform android
```

### iOS IPA（App Store）
```bash
cd /workspace/projects/client
eas build --platform ios --profile ipa
eas submit --platform ios
```

### 全平台一次性构建
```bash
cd /workspace/projects/client
eas build --platform all --profile production
```

---

## 当前项目状态

✅ **后端服务**：运行中（端口 9091）
✅ **前端服务**：运行中（端口 5000）
✅ **Web 构建**：已完成（client/dist/）
⏳ **Android 构建**：需执行 EAS Build
⏳ **iOS 构建**：需执行 EAS Build

---

## EAS Build 配置

已配置以下构建配置（eas.json）：

| 配置名 | 平台 | 用途 |
|--------|------|------|
| `apk` | Android | APK 分发 |
| `aab` | Android | Google Play 上架 |
| `ipa` | iOS | App Store 上架 |
| `preview` | All | 内部测试 |
| `production` | All | 生产发布 |

---

## 首次部署步骤

1. **登录 Expo 账号**
   ```bash
   eas login
   ```

2. **配置项目**
   ```bash
   eas build:configure
   ```

3. **构建应用**
   ```bash
   # Android
   eas build --platform android --profile apk
   
   # iOS
   eas build --platform ios --profile ipa
   ```

4. **下载并分发**
   - 登录 https://expo.dev 查看构建状态
   - 下载构建产物
   - 分发到应用市场或测试平台

---

## 应用商店素材要求

### Google Play
- 应用图标：512x512 PNG（32-bit）
- 特色图：1024x500 PNG
- 截图：至少 2 张（手机）
- 宣传视频：可选（YouTube 链接）

### App Store
- 应用图标：1024x1024 PNG（无透明通道）
- iPhone 截图：6.7" + 6.5" + 5.5"
- iPad 截图：12.9"（可选）
- 预览视频：可选

---

## 费用说明

- **Expo 账号**：免费
- **EAS Build**：
  - 免费额度：30 次/月（Android + iOS）
  - 付费版：$29/月起
- **Google Play 开发者**：$25（一次性）
- **Apple 开发者**：$99/年
- **服务器**：按需选择云服务商

---

## 技术支持

详细部署文档：[docs/DEPLOYMENT.md](./DEPLOYMENT.md)
