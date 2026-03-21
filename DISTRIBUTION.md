# G open 应用分发指南

## 当前状态

- **Web版**: 已可用，访问 `http://localhost:5000` 或部署后的域名
- **Expo Go**: 可用于开发测试和快速体验

---

## 方式一：Web版分发（推荐）

### 优点
- 无需安装，用户直接访问网页
- 跨平台兼容（手机、平板、电脑）
- 更新即时生效

### 部署方式

#### 1. 静态托管部署（推荐）
```bash
# 构建Web版本
cd /workspace/projects/client
npx expo export --platform web

# 生成的 dist 目录可部署到：
# - Vercel: vercel --prod
# - Netlify: netlify deploy --prod --dir=dist
# - GitHub Pages: 复制 dist 内容到 gh-pages 分支
# - 阿里云OSS / 腾讯云COS 静态托管
```

#### 2. 分享链接
部署后，用户访问：`https://你的域名/`

#### 3. 落地页推广
- 访问 `/download` 查看应用下载页
- 访问 `/invite` 使用邀请功能

---

## 方式二：Expo Go 体验

### 适用场景
- 开发测试
- 快速演示
- 内测用户

### 使用步骤

#### 1. 用户安装 Expo Go
- **iOS**: App Store 搜索 "Expo Go"
- **Android**: Play Store 搜索 "Expo Go"

#### 2. 分享开发链接
当前开发服务器地址：`exp://localhost:8081`

#### 3. 发布到 Expo（远程访问）
```bash
# 需要先登录 Expo 账号
npx expo login

# 发布更新
npx expo update --branch preview

# 获取分享链接
npx expo url --tunnel
```

#### 4. 生成分享链接和二维码
```bash
# 使用 ngrok 暴露本地服务
npx expo start --tunnel

# 会生成类似链接：
# exp://exp.host/@username/gopen
```

---

## 方式三：原生应用发布（正式版）

### Android APK
```bash
# 使用 EAS Build
cd /workspace/projects/client
eas build --platform android --profile preview

# 或本地构建
npx expo prebuild
cd android && ./gradlew assembleRelease
```

### iOS App Store
```bash
# 使用 EAS Build
eas build --platform ios --profile preview

# 提交审核
eas submit --platform ios
```

---

## 推荐分发策略

| 阶段 | 方式 | 目标用户 |
|------|------|----------|
| 开发测试 | Expo Go | 内部团队、测试用户 |
| 内测阶段 | Web版 + Expo Go | 种子用户、内测用户 |
| 正式发布 | Web版 + APK + App Store | 所有用户 |

---

## 当前可用的访问地址

1. **Web开发版**: http://localhost:5000
2. **下载页**: http://localhost:5000/download
3. **邀请页**: http://localhost:5000/invite
4. **设置页**: http://localhost:5000/settings

---

## 快速分享操作

### 分享Web链接
直接将访问链接发送给用户即可体验。

### 分享Expo Go链接
1. 确保开发服务正在运行
2. 运行 `npx expo start --tunnel` 获取外网链接
3. 用户在 Expo Go 中输入链接即可体验
