# 沙盒退出后任务指南

本文档提供退出沙盒后需要完成的各项任务的详细操作步骤。

---

## 一、GitHub 镜像同步

### 目标
将代码同步到 GitHub，以便使用 GitHub Releases 功能分发安装包。

### 问题说明
GitHub Push Protection 检测到历史提交中包含敏感信息，阻止了推送。需要清理后重新推送。

### 解决方案

#### 方案 A：允许该密钥（推荐，简单快捷）

1. 访问以下链接：
   ```
   https://github.com/a912454361/gopen/security/secret-scanning/unblock-secret/3BQhIRzWa0hOORH66Nl1iyvesK4
   ```

2. 点击 "Allow secret" 按钮

3. 重新推送：
   ```bash
   cd /workspace/projects
   git push github main
   ```

#### 方案 B：清理敏感文件（安全，但会改变 Git 历史）

```bash
# 1. 使用 BFG Repo-Cleaner 清理
# 安装 BFG（需要 Java）
brew install bfg  # macOS
# 或下载: https://rtyley.github.io/bfg-repo-cleaner/

# 2. 清理敏感文件
bfg --delete-files push.sh

# 3. 强制推送
git push github main --force
```

#### 方案 C：新建仓库重新推送

```bash
# 1. 在 GitHub 创建新仓库：gopen-release

# 2. 添加新远程
git remote add github-new https://github.com/a912454361/gopen-release.git

# 3. 推送到新仓库
git push github-new main
```

### 创建 GitHub Release

推送成功后：

1. 访问：https://github.com/a912454361/gopen/releases/new

2. 填写 Release 信息：
   - Tag: `v1.0.3`
   - Title: `G open v1.0.3 - 用户账号系统`
   - Description:
     ```markdown
     ## 新增功能
     - 完整用户账号系统（注册、登录、找回密码、修改密码）
     - 支持密码登录和快捷登录（验证码）
     - 第三方登录（微信、支付宝、GitHub、Google等）
     
     ## 下载
     | 平台 | 文件 |
     |------|------|
     | Windows | gopen-windows-v1.0.3.tar.gz |
     | Android | gopen-android-v1.0.3.tar.gz |
     | iOS | gopen-ios-v1.0.3.tar.gz |
     | macOS | gopen-macos-v1.0.3.tar.gz |
     | Linux | gopen-linux-v1.0.3.tar.gz |
     | Web | gopen-web-v1.0.3.tar.gz |
     ```

3. 上传发布包：
   ```
   release-package/v1.0.3/output/*.tar.gz
   ```

---

## 二、应用商店上架

### 2.1 Android 上架

#### 准备材料

| 材料 | 说明 | 状态 |
|------|------|------|
| APK/AAB 文件 | 需本地构建 | ⏳ 待构建 |
| 应用图标 | 512x512 PNG | ✅ 已有 |
| 应用截图 | 至少 2 张 | ✅ 已有 |
| 软件著作权 | 部分平台需要 | ⏳ 待申请 |
| ICP 备案 | 部分平台需要 | ⏳ 待备案 |

#### 构建步骤

```bash
# 1. 进入客户端目录
cd /workspace/projects/client

# 2. 配置 EAS（如已配置可跳过）
eas login
eas build:configure

# 3. 构建 APK（预览版，用于测试）
eas build --platform android --profile preview

# 4. 构建 AAB（正式版，用于上架）
eas build --platform android --profile production
```

#### 上架平台清单

| 平台 | 是否需要软著 | 上架难度 | 说明 |
|------|-------------|---------|------|
| **应用宝** | 需要 | ⭐⭐⭐ | 腾讯应用商店，流量大 |
| **华为应用市场** | 需要 | ⭐⭐ | 华为手机预装 |
| **小米应用商店** | 需要 | ⭐⭐ | 小米手机预装 |
| **OPPO 应用商店** | 需要 | ⭐⭐ | OPPO 手机预装 |
| **vivo 应用商店** | 需要 | ⭐⭐ | vivo 手机预装 |
| **百度手机助手** | 不需要 | ⭐ | 流量较小 |
| **360 手机助手** | 不需要 | ⭐ | 流量较小 |
| **豌豆荚** | 不需要 | ⭐ | 阿里旗下 |

#### 上架流程（以应用宝为例）

1. 注册开发者账号：https://open.tencent.com/
2. 实名认证（个人/企业）
3. 创建应用，填写基本信息
4. 上传 APK 和截图
5. 提交审核（通常 1-3 个工作日）

### 2.2 iOS 上架

#### 准备材料

| 材料 | 说明 | 状态 |
|------|------|------|
| Apple Developer 账号 | $99/年 | ⏳ 需购买 |
| IPA 文件 | 需 Mac 构建 | ⏳ 待构建 |
| App Store 截图 | 各尺寸至少 5 张 | ⏳ 待准备 |
| 隐私政策链接 | 必须 | ✅ 已有 |

#### 构建步骤

```bash
# 需要 Mac + Xcode 环境

# 1. 安装 Xcode 命令行工具
xcode-select --install

# 2. 登录 Apple ID
eas login

# 3. 配置 Bundle ID
eas build:configure

# 4. 构建 iOS 应用
eas build --platform ios --profile production

# 5. 提交到 App Store Connect
eas submit --platform ios
```

#### 上架流程

1. 购买 Apple Developer 账号
2. 创建 App ID（Bundle Identifier）
3. 创建证书和描述文件
4. 构建 IPA 并上传
5. 在 App Store Connect 填写信息
6. 提交审核（通常 2-7 个工作日）

---

## 三、域名备案

### 是否需要备案

| 服务器位置 | 是否需要备案 | 说明 |
|-----------|-------------|------|
| 中国大陆 | ✅ 需要 | 必须备案才能解析 |
| 香港 | ❌ 不需要 | 可直接使用 |
| 海外 | ❌ 不需要 | 可直接使用 |

### 当前状态
- 域名：woshiguotao.cn
- 当前部署：GitHub Pages（美国服务器）
- 是否备案：❌ 未备案

### 备案流程（如需国内服务器）

```
1. 购买国内服务器（阿里云/腾讯云/华为云）
   ↓
2. 登录服务商备案系统
   ↓
3. 填写主体信息（个人/企业）
   ↓
4. 填写网站信息
   ↓
5. 上传材料（身份证、手持照片等）
   ↓
6. 服务商初审（1-2天）
   ↓
7. 管局审核（5-20个工作日）
   ↓
8. 备案完成，获取备案号
```

### 备案所需材料

**个人备案：**
- 身份证正反面照片
- 手持身份证照片
- 域名证书

**企业备案：**
- 营业执照
- 法人身份证
- 网站负责人身份证
- 授权书（如非法人操作）

---

## 四、生产部署

### 架构说明

```
┌─────────────────────────────────────────────────────────┐
│                      用户请求                            │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  CDN / 负载均衡                          │
└─────────────────────┬───────────────────────────────────┘
                      ▼
┌──────────────┬──────────────┬──────────────────────────┐
│   Web 前端    │   API 服务   │      静态资源            │
│  (Expo Web)  │  (Express)   │     (对象存储)           │
└──────────────┴──────────────┴──────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ Supabase│  │ 对象存储  │  │  AI API  │
   │ (数据库) │  │  (S3)    │  │ (各厂商) │
   └─────────┘  └──────────┘  └──────────┘
```

### 部署选项

#### 选项 A：云服务器部署（推荐）

**推荐配置：**
- CPU: 2核
- 内存: 4GB
- 带宽: 5Mbps
- 系统: Ubuntu 22.04

**部署步骤：**

```bash
# 1. 连接服务器
ssh root@your-server-ip

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 安装 PM2（进程管理）
npm install -g pm2

# 4. 克隆代码
git clone https://gitee.com/a912454361/gopen.git
cd gopen

# 5. 安装依赖
npm install -g pnpm
pnpm install

# 6. 配置环境变量
cp server/.env.example server/.env
nano server/.env  # 填写实际配置

# 7. 启动服务
cd server
pm2 start pnpm --name "gopen-api" -- run dev

# 8. 配置 Nginx 反向代理
sudo apt install nginx
sudo nano /etc/nginx/sites-available/gopen.conf
```

**Nginx 配置：**
```nginx
server {
    listen 80;
    server_name api.woshiguotao.cn;

    location / {
        proxy_pass http://localhost:9091;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 选项 B：Serverless 部署

**Vercel 部署（前端）：**
```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 部署
cd client
vercel --prod
```

**Railway 部署（后端）：**
```bash
# 1. 安装 Railway CLI
npm i -g @railway/cli

# 2. 登录并部署
railway login
railway init
railway up
```

---

## 五、用户测试（Beta）

### 测试阶段规划

| 阶段 | 用户数量 | 测试周期 | 目标 |
|------|---------|---------|------|
| Alpha | 10-20 | 1周 | 功能验证、Bug 修复 |
| Beta | 100-500 | 2-4周 | 性能测试、体验优化 |
| 公测 | 不限 | 持续 | 收集反馈、迭代优化 |

### Beta 测试方案

#### Android 测试分发

**方式 1：内部测试链接**
```bash
# 使用 EAS Update 分发
eas update --branch preview --message "Beta v1.0.3"
```

**方式 2：蒲公英/Fir.im**
```bash
# 上传 APK 到蒲公英
# 获取测试链接分享给用户
```

#### iOS 测试分发

**TestFlight：**
```bash
# 1. 在 App Store Connect 添加测试用户
# 2. 上传构建版本
# 3. 分发到 TestFlight
# 4. 用户通过邀请链接加入测试
```

### 反馈收集

**建议工具：**
- 问卷：腾讯问卷 / 金数据
- 反馈：用户反馈 SDK（如腾讯 Bugly）
- 社群：微信群 / QQ 群 / Discord

---

## 六、任务优先级建议

```
优先级排序：

1. 🔴 高优先级
   ├── GitHub 镜像同步（发布下载链接）
   └── 生产部署（服务上线）

2. 🟡 中优先级
   ├── 用户 Beta 测试（验证产品）
   └── Android 上架（扩大用户群）

3. 🟢 低优先级
   ├── iOS 上架（需购买开发者账号）
   └── 域名备案（如需国内服务器）
```

---

## 联系支持

如有问题，可通过以下方式获取帮助：

- 项目仓库：https://gitee.com/a912454361/gopen
- 官网：https://woshiguotao.cn
- GitHub：https://github.com/a912454361/gopen

---

**文档版本**: v1.0  
**最后更新**: 2025年3月
