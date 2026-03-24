# G Open AI助手 - 一键安装程序

## 🚀 快速获取安装包

### 方式一：GitHub Actions 自动构建（推荐）

1. 访问仓库：https://github.com/a912454361/gopen
2. 点击 **Actions** 标签
3. 选择 **Build Windows Installer**
4. 点击 **Run workflow** → **Run workflow**
5. 等待构建完成（约5分钟）
6. 在 **Artifacts** 区域下载：
   - `G-Open-Setup.exe` - 一键安装程序
   - `G-Open-Portable.exe` - 便携版

### 方式二：本地构建

**环境要求**：Windows 10/11 (64位) + Node.js 18+

```powershell
# 1. 克隆仓库
git clone https://github.com/a912454361/gopen.git
cd gopen/electron-app

# 2. 安装依赖
pnpm install

# 3. 构建安装程序
pnpm run build:nsis
```

---

## 🔒 安全功能

### 已实现的安全特性

| 功能 | 说明 |
|------|------|
| ✅ 单实例检测 | 防止多个实例同时运行 |
| ✅ 上下文隔离 | 渲染进程与主进程隔离 |
| ✅ 禁用远程模块 | 防止远程代码执行 |
| ✅ 沙盒模式 | 限制渲染进程权限 |
| ✅ URL验证 | 阻止不安全协议导航 |
| ✅ 应用完整性校验 | 启动时验证文件哈希 |
| ✅ CSP安全策略 | 防止XSS攻击 |

### 计划中的安全功能

| 功能 | 状态 |
|------|------|
| 🔲 代码签名 | 待添加证书 |
| 🔲 自动更新签名验证 | 待实现 |
| 🔲 数据加密存储 | 待实现 |

---

## 📦 安装包说明

### Setup.exe（一键安装程序）

- **安装方式**：双击运行，一键安装到 Program Files
- **快捷方式**：自动创建桌面和开始菜单快捷方式
- **卸载**：通过控制面板或开始菜单卸载
- **适用场景**：正式使用，长期安装

### Portable.exe（便携版）

- **使用方式**：双击运行，无需安装
- **数据存储**：程序所在目录
- **适用场景**：临时使用、U盘携带

---

## 🛡️ 安全检查清单

安装后首次运行，应用会自动执行以下安全检查：

- [ ] 验证应用完整性
- [ ] 检查运行环境
- [ ] 初始化安全策略
- [ ] 启动隔离沙盒

---

## ❓ 常见问题

### Q: 为什么显示"Windows 已保护你的电脑"？
A: 这是因为应用未进行代码签名。点击"更多信息" → "仍要运行" 即可。

### Q: 如何添加代码签名？
A: 需要购买代码签名证书，然后修改 `package.json`：
```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "your-password",
    "signingHashAlgorithms": ["sha256"]
  }
}
```

### Q: 安装后在哪里找到应用？
A: 
- 安装位置：`C:\Program Files\G Open AI助手\`
- 桌面快捷方式
- 开始菜单 → G Open AI助手

---

## 📞 技术支持

- GitHub Issues: https://github.com/a912454361/gopen/issues
- 官网: https://woshiguotao.cn
