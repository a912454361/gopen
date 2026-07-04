# GitHub 自动部署指南

## 当前状态

✅ 代码已提交到本地
✅ 已推送到 Gitee (https://gitee.com/a912454361/gopen.git)
❌ GitHub 推送失败（需要手动认证）

---

## 手动推送 GitHub 步骤

### 方法一：在本地终端执行

```bash
# 1. 克隆或拉取最新代码
git clone https://gitee.com/a912454361/gopen.git
# 或
git pull origin main

# 2. 添加 GitHub 远程仓库
git remote add github https://github.com/a912454361/gopen.git

# 3. 推送到 GitHub
git push github main

# 4. 输入 GitHub 用户名和密码（或 Personal Access Token）
```

### 方法二：GitHub 网页导入

1. 访问 https://github.com/new
2. 创建新仓库 `gopen`
3. 访问 https://github.com/new/import
4. 输入 Gitee 仓库地址：`https://gitee.com/a912454361/gopen.git`
5. 点击 "Begin import"

---

## 配置 GitHub Secrets（首次部署必须）

推送成功后，在 GitHub 仓库设置中添加 Secrets：

### 步骤：
1. 访问 `https://github.com/a912454361/gopen/settings/secrets/actions`
2. 点击 "New repository secret"
3. 添加以下 Secrets：

| Name | Value | 获取方式 |
|------|-------|----------|
| `NETLIFY_AUTH_TOKEN` | 你的 Netlify Token | https://app.netlify.com/user/applications#personal-access-tokens |
| `NETLIFY_SITE_ID` | 你的站点 ID | Netlify 站点设置 > General > Site details |

### 获取 Netlify Token：
1. 登录 https://app.netlify.com
2. 点击头像 > User settings > Applications
3. 点击 "New access token"
4. 复制生成的 Token

### 获取 Site ID：
1. 在 Netlify 创建一个新站点（或使用已有站点）
2. 站点设置 > General > Site details > API ID

---

## 触发自动部署

配置完成后，每次推送到 `main` 分支都会自动触发部署：

```bash
# 任何提交都会触发
git commit --allow-empty -m "trigger deploy"
git push github main
```

---

## 查看部署状态

- GitHub Actions: https://github.com/a912454361/gopen/actions
- Netlify Dashboard: https://app.netlify.com

---

## 待推送的提交（37个）

最新提交：
```
1793143 chore: 准备生产部署配置和指南
63f1be5 build: 生产环境构建完成，准备部署
0a8bed6 feat: 收款码管理页面新增银联和银行转账支付方式
97e91fa fix: 修复模型市场页面价格字段映射错误
767a379 fix: 修复模型计费价格单位不一致问题
...
```

---

## 快速命令（复制到本地终端执行）

```bash
# 一键推送
git clone https://gitee.com/a912454361/gopen.git && cd gopen && git remote add github https://github.com/a912454361/gopen.git && git push github main
```
