# Netlify 自动部署配置

## 方式一：Netlify 连接 GitHub（推荐）

### 步骤

1. **将代码推送到 GitHub**
   ```bash
   cd /workspace/projects
   git add .
   git commit -m "feat: add netlify auto deploy"
   git push origin main
   ```

2. **在 Netlify 连接仓库**
   - 访问 https://app.netlify.com
   - 点击 **"Add new site"** → **"Import an existing project"**
   - 选择 **GitHub**，授权并选择你的仓库
   - 配置：
     - **Base directory**: `client`
     - **Build command**: `npx expo export --platform web`
     - **Publish directory**: `dist`
   - 点击 **"Deploy site"**

3. **获取部署地址**
   - 部署完成后，Netlify 会显示：`https://你的站点名.netlify.app`
   - 可在 Site settings 中修改站点名

---

## 方式二：GitHub Actions 自动部署

### 步骤

1. **获取 Netlify 凭证**
   - 访问 https://app.netlify.com/user/applications#personal-access-tokens
   - 创建一个新的 Personal Access Token
   - 复制 Token 值

2. **获取 Site ID**
   - 在 Netlify 站点设置页面，找到 **Site ID**

3. **配置 GitHub Secrets**
   - 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
   - 添加：
     - `NETLIFY_AUTH_TOKEN`: 你的 Netlify Token
     - `NETLIFY_SITE_ID`: 你的 Site ID

4. **推送代码触发部署**
   ```bash
   git push origin main
   ```

---

## 部署后地址格式

- 默认地址：`https://随机名称.netlify.app`
- 自定义域名：可在 Netlify Site settings → Domain management 中绑定

---

## 配置文件说明

| 文件 | 作用 |
|------|------|
| `client/netlify.toml` | Netlify 构建配置、路由重定向、缓存策略 |
| `.github/workflows/deploy-netlify.yml` | GitHub Actions 自动部署工作流 |
