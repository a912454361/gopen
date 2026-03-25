# G open 智能创作助手 - 企业官网

> 访问地址: https://woshiguotao.cn

## 部署指南

### 方案一：Vercel 部署（推荐）

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd website
   vercel --prod
   ```

4. **添加自定义域名**
   - 进入 Vercel Dashboard
   - 选择项目 → Settings → Domains
   - 添加 `woshiguotao.cn` 和 `www.woshiguotao.cn`

---

### 方案二：Netlify 部署

1. **安装 Netlify CLI**
   ```bash
   npm i -g netlify-cli
   ```

2. **登录 Netlify**
   ```bash
   netlify login
   ```

3. **部署项目**
   ```bash
   cd website
   netlify deploy --prod
   ```

4. **添加自定义域名**
   - 进入 Netlify Dashboard
   - Site settings → Domain management
   - 添加 `woshiguotao.cn`

---

### 方案三：GitHub Pages 部署

1. **创建 GitHub 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/gopen-website.git
   git push -u origin main
   ```

2. **启用 GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 `main` 分支
   - 保存后等待部署完成

3. **添加自定义域名**
   - 在 Pages 设置中添加自定义域名 `woshiguotao.cn`
   - GitHub 会自动生成 CNAME 文件

---

## 域名解析配置

### Vercel 解析配置

在域名服务商（如阿里云、腾讯云）添加以下解析记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

### Netlify 解析配置

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 75.2.60.5 |
| CNAME | www | 你的站点名.netlify.app |

### GitHub Pages 解析配置

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | 你的用户名.github.io |

---

## 国内访问优化

由于 Vercel/Netlify/GitHub Pages 服务器在海外，国内访问可能较慢。建议：

### 方案一：使用 Cloudflare CDN（免费）

1. 注册 Cloudflare 账号
2. 添加站点 `woshiguotao.cn`
3. 将域名 DNS 服务器改为 Cloudflare 提供的服务器
4. 在 Cloudflare 中配置解析记录指向 Vercel/Netlify

### 方案二：国内服务器 + ICP 备案

如需国内高速访问，需：
1. 购买国内服务器（阿里云、腾讯云等）
2. 进行 ICP 备案（约 10-20 天）
3. 部署网站到国内服务器

---

## 项目结构

```
website/
├── index.html      # 主页面
├── vercel.json     # Vercel 配置
├── netlify.toml    # Netlify 配置
└── README.md       # 部署说明
```

---

## 联系方式

- 网站: https://woshiguotao.cn
- GitHub: https://github.com/a912454361/gopen
- 邮箱: support@woshiguotao.cn
