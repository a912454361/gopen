# 🚀 G open 官网部署指南

## GitHub 用户: a912454361
## 域名: woshiguotao.cn

---

## ⚡ 快速部署（3 步完成）

### 步骤 1: 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写信息:
   - Repository name: `gopen-website`
   - Description: `G open 智能创作助手官网`
   - 选择 **Public**
   - **不要勾选** Add README/add .gitignore/choose license
3. 点击 **Create repository**

### 步骤 2: 推送代码

在终端执行:

```bash
# 下载网站文件后，进入目录
cd website

# 推送到 GitHub（会提示输入 GitHub 用户名和密码）
git push -u origin main
```

⚠️ **注意**: 如果使用密码认证失败，需要使用 Personal Access Token:
1. 访问 https://github.com/settings/tokens
2. Generate new token (classic)
3. 勾选 `repo` 权限
4. 生成后用 token 作为密码

### 步骤 3: 启用 GitHub Pages

1. 访问 https://github.com/a912454361/gopen-website/settings/pages
2. Source 选择: **Deploy from a branch**
3. Branch 选择: **main** / **root**
4. 点击 **Save**
5. 等待 1-2 分钟

---

## 🌐 配置域名解析

在域名服务商（阿里云/腾讯云）添加以下记录:

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | a912454361.github.io |

### 阿里云操作步骤

1. 登录 https://dns.console.aliyun.com
2. 找到 `woshiguotao.cn` → 解析设置
3. 点击「添加记录」，按上表逐条添加
4. 等待 10 分钟生效

### 腾讯云操作步骤

1. 登录 https://console.cloud.tencent.com/cns
2. 找到 `woshiguotao.cn` → 解析
3. 按上表添加记录
4. 等待 10 分钟生效

---

## ✅ 验证部署

部署完成后（约 10 分钟），访问:

- https://woshiguotao.cn
- https://www.woshiguotao.cn
- https://a912454361.github.io/gopen-website

---

## 📁 网站文件结构

```
website/
├── index.html      # 主页
├── CNAME           # 自定义域名配置
├── README.md       # 部署说明
├── vercel.json     # Vercel 配置（备用）
├── netlify.toml    # Netlify 配置（备用）
└── .git/           # Git 仓库（已配置远程地址）
```

---

## 🔧 常见问题

### Q: 推送时提示 "Support for password authentication was removed"

**A**: GitHub 已禁用密码认证，需要使用 Personal Access Token:
1. 访问 https://github.com/settings/tokens
2. Generate new token (classic)
3. 勾选 `repo` 权限
4. 复制 token
5. 推送时用 token 代替密码

### Q: 域名解析后仍无法访问

**A**: 等待 DNS 生效（最多 48 小时，通常 10 分钟）
检查命令: `nslookup woshiguotao.cn`

### Q: GitHub Pages 显示 404

**A**: 检查 Settings → Pages 是否正确配置
确保仓库是 **Public** 且已启用 Pages

---

## 📞 需要帮助?

- GitHub: https://github.com/a912454361
- 邮箱: support@woshiguotao.cn
