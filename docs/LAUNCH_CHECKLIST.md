# G open 上线检查清单

## 当前状态总览

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 后端服务 | ✅ 正常 | 端口 9091 运行中 |
| 前端服务 | ✅ 正常 | 端口 5000 运行中 |
| Web 构建 | ✅ 完成 | `client/dist/` 已生成 |
| API 接口 | ✅ 正常 | 健康检查通过，模型列表可访问 |
| 应用图标 | ✅ 已配置 | icon.png, adaptive-icon.png, favicon.png |
| 启动图 | ✅ 已配置 | splash-icon.png |

---

## 上线前必做事项

### 1. 准备应用商店素材 ⚠️ 必需

#### Google Play 需要的素材：
- [ ] **应用图标**：512x512 PNG（32-bit，无透明）
- [ ] **特色图**：1024x500 PNG
- [ ] **手机截图**：至少 2 张（16:9 比例）
- [ ] **平板截图**：可选，7寸/10寸各至少 1 张
- [ ] **宣传视频**：可选，YouTube 链接

#### App Store 需要的素材：
- [ ] **应用图标**：1024x1024 PNG（无透明通道）
- [ ] **6.7" iPhone 截图**：1290x2796（至少 1 张）
- [ ] **6.5" iPhone 截图**：1284x2778（至少 1 张）
- [ ] **5.5" iPhone 截图**：1242x2208（至少 1 张）
- [ ] **12.9" iPad 截图**：2048x2732（可选）

### 2. 准备商店文案 ⚠️ 必需

```
应用名称：G open 智能创作助手（最多 30 字符）
简短描述：AI 驱动的游戏动漫创作助手（最多 80 字符）
完整描述：（最多 4000 字符，建议 500-1000 字）

建议内容：
G open 是一款专为游戏和动漫创作者设计的智能创作助手。

主要功能：
• 🤖 AI 对话创作 - 支持多种大模型，智能对话生成创意内容
• 🖼️ AI 图像生成 - 文字描述一键生成精美游戏动漫角色
• 🎵 AI 音频创作 - 语音合成、音乐生成，丰富你的作品
• 📱 项目管理 - 轻松管理你的创作项目
• 💎 会员特权 - 解锁更多高级功能

适合人群：
- 游戏开发者
- 动漫创作者
- 小说作家
- 角色设计师

关键词：AI,创作,游戏,动漫,写作,图像生成,智能助手
```

### 3. 准备隐私政策 ⚠️ 必需

需要创建并托管隐私政策页面，内容需包含：
- 收集的数据类型
- 数据使用方式
- 第三方服务（AI API、支付等）
- 用户权利
- 联系方式

### 4. 准备技术支持页面 ⚠️ 必需

需要提供技术支持 URL，可以是：
- 官方网站
- 帮助文档
- 客服邮箱

---

## 立即可执行的部署

### Web 版上线（最快）

```bash
# 已有构建产物，可直接部署
cd /workspace/projects/client

# 方案 A：Vercel（推荐）
npm install -g vercel
vercel --prod

# 方案 B：Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist

# 方案 C：自有服务器
# 将 dist/ 目录上传到服务器即可
```

**Web 版可以立即上线！** ✅

---

## Android/iOS 构建部署

### 第一步：登录 EAS
```bash
cd /workspace/projects/client
eas login
```

### 第二步：构建应用
```bash
# Android APK（测试分发）
eas build --platform android --profile preview

# Android AAB（Google Play 上架）
eas build --platform android --profile production

# iOS IPA（App Store 上架）
eas build --platform ios --profile production
```

### 第三步：下载构建产物
构建完成后，在 Expo 控制台下载：
https://expo.dev/accounts/[your-account]/projects/[project-name]/builds

---

## 费用清单

| 项目 | 费用 | 备注 |
|------|------|------|
| Expo 账号 | 免费 | - |
| EAS Build 免费额度 | 30次/月 | 足够测试使用 |
| Google Play 开发者 | $25 一次性 | Android 上架必需 |
| Apple Developer | $99/年 | iOS 上架必需 |
| 服务器 | 按需 | 推荐云服务器 |
| 域名 | 约 ¥50/年 | 可选 |

---

## 推荐上线顺序

1. **Web 版** ⭐ 立即可上线
   - 无需审核
   - 无需费用
   - 可作为下载入口

2. **Android APK** ⭐ 第二优先
   - 无需 Google Play 账号
   - 可直接分发
   - 适合测试和第三方市场

3. **Google Play** 需要素材准备
   - 需要 $25 开发者账号
   - 需要商店素材和文案
   - 审核周期 1-3 天

4. **App Store** 最后上线
   - 需要 $99/年 开发者账号
   - 需要商店素材和文案
   - 审核周期 1-7 天

---

## 当前可立即执行

### ✅ Web 版上线
```bash
cd /workspace/projects/client
vercel --prod
```

### ✅ Android 测试版分发
```bash
cd /workspace/projects/client
eas login
eas build --platform android --profile preview
```

---

## 还需要准备的内容

| 内容 | 状态 | 优先级 |
|------|------|--------|
| 商店截图 | ❌ 未准备 | 高 |
| 隐私政策页面 | ❌ 未准备 | 高 |
| 技术支持页面 | ❌ 未准备 | 高 |
| 商店文案 | ✅ 已有建议 | 中 |
| 特色宣传图 | ❌ 未准备 | 中 |
| 宣传视频 | ❌ 未准备 | 低 |

---

## 总结

**可以立即上线：**
- ✅ Web 版（无需审核，立即可用）
- ✅ Android APK 测试版（构建后即可分发）

**需要准备素材后上线：**
- ⏳ Google Play（需商店素材 + $25）
- ⏳ App Store（需商店素材 + $99/年）

**建议：先上线 Web 版，同时准备商店素材，再依次上线各平台应用商店。**
