# G open 全平台部署指南

## 一、Web 版上线（需你操作 1 分钟）

### 步骤：
1. 打开：https://gitee.com/a912454361/gopen/pages
2. 部署分支选择：`gh-pages`
3. 目录选择：`/`（根目录）
4. 点击「启动」或「更新」

### 访问地址：
```
https://a912454361.gitee.io/gopen
```

---

## 二、Android APK 构建

### 方式 A：提供 Expo 账号（推荐）

如果你有 Expo 账号，请提供：
- **邮箱**：
- **密码**：

我会自动登录并构建 APK。

### 方式 B：自己执行命令

```bash
# 1. 登录
eas login

# 2. 构建 APK
cd /workspace/projects/client
eas build --platform android --profile preview

# 3. 下载 APK
# 构建完成后在 https://expo.dev 查看下载
```

### 方式 C：注册新账号

如果没有 Expo 账号：
1. 访问 https://expo.dev/signup
2. 或终端执行：`eas register`

---

## 三、iOS IPA 构建

### 前提条件：
- Apple 开发者账号（$99/年）
- 已在 App Store Connect 创建应用

### 需要提供：
- Apple ID（邮箱）：
- App-Specific Password：（在 appleid.apple.com 生成）

### 构建命令：
```bash
eas build --platform ios --profile production
```

---

## 快速回复模板

### 如果有 Expo 账号：
```
Expo 账号：
邮箱：your@email.com
密码：yourpassword
```

### 如果有 Apple 开发者账号：
```
Apple 开发者：
Apple ID：your@email.com
App-Specific Password：xxxx-xxxx-xxxx-xxxx
```

### 如果都没有：
回复「注册」- 我会引导你注册 Expo 账号（免费，2分钟）
