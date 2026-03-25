# 🚀 快速部署指南

## 方式一：一键部署（推荐）

### 步骤 1: 获取 GitHub Token

1. 访问 https://github.com/settings/tokens/new
2. 填写:
   - Note: `gopen-website-deploy`
   - Expiration: `No expiration` 或选择一个期限
   - 勾选: `repo`（所有 repo 相关权限）
3. 点击 **Generate token**
4. **立即复制 token**（只显示一次）

### 步骤 2: 运行部署命令

在终端中执行（将 `YOUR_TOKEN` 替换为你的 token）:

```bash
# 下载并部署
cd /workspace/projects/website
GITHUB_TOKEN='YOUR_TOKEN' bash deploy-github.sh
```

---

## 方式二：手动部署

### 步骤 1: 创建 GitHub 仓库

访问 https://github.com/new 创建:
- Repository name: `gopen-website`
- 选择 **Public**
- **不要**勾选任何初始化选项

### 步骤 2: 推送代码

```bash
cd /workspace/projects/website

# 如果需要认证，使用 token 作为密码
git push -u origin main
```

### 步骤 3: 启用 Pages

访问 https://github.com/a912454361/gopen-website/settings/pages:
- Source: Deploy from a branch
- Branch: main / root
- Save

---

## 域名解析配置

在域名服务商添加:

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | a912454361.github.io |

---

## 预期结果

- https://woshiguotao.cn
- https://www.woshiguotao.cn
