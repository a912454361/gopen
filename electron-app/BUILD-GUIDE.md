# G Open AI助手 - Windows 安装程序构建指南

## 快速开始

### 方式一：一键构建（推荐）

**Windows 用户**：双击运行 `build-installer.bat`

脚本将自动完成：
1. ✅ 检查 Node.js 环境
2. ✅ 安装 pnpm（如未安装）
3. ✅ 安装项目依赖
4. ✅ 构建安装程序

### 方式二：PowerShell 脚本

```powershell
# 构建所有版本
.\build-installer.ps1

# 仅构建便携版
.\build-installer.ps1 -PortableOnly

# 仅构建安装版
.\build-installer.ps1 -NSISOnly

# 跳过依赖安装
.\build-installer.ps1 -SkipDeps
```

### 方式三：手动构建

```bash
# 1. 安装依赖
pnpm install

# 2. 构建安装程序
pnpm run build:nsis     # NSIS 安装程序
pnpm run build:portable # 便携版
pnpm run build:all      # 所有版本
```

---

## 输出文件

构建完成后，在 `release/` 目录下生成：

| 文件 | 说明 | 使用场景 |
|------|------|----------|
| `G Open AI助手 Setup 1.0.0.exe` | 一键安装程序 | 正式分发，用户双击即可安装 |
| `G Open AI助手-1.0.0-Portable.exe` | 便携版 | 无需安装，双击即用，适合U盘携带 |

---

## 环境要求

| 软件 | 版本要求 | 下载地址 |
|------|----------|----------|
| Node.js | 18.x 或更高 | https://nodejs.org/ |
| pnpm | 自动安装 | - |

---

## 安装程序功能

### NSIS 安装程序特性

- ✅ **一键安装**：用户无需选择目录，自动安装到 Program Files
- ✅ **桌面快捷方式**：自动创建桌面图标
- ✅ **开始菜单**：自动添加到开始菜单
- ✅ **完整卸载**：卸载时自动清理所有数据
- ✅ **中文界面**：安装界面默认显示中文

### 便携版特性

- ✅ **无需安装**：双击即可运行
- ✅ **U盘友好**：可放在U盘随身携带
- ✅ **数据独立**：程序和数据在同一目录

---

## 分发建议

### 方式一：GitHub Releases

1. 将 `G Open AI助手 Setup 1.0.0.exe` 上传到 GitHub Releases
2. 用户下载后双击安装

### 方式二：网盘分发

- 百度网盘
- 阿里云盘
- 蓝奏云

### 方式三：官网下载

- 将安装程序部署到服务器
- 提供下载链接

---

## 常见问题

### Q: 构建失败提示 "wine is required"？
A: 此错误仅在 Linux 环境出现。请在 **Windows 电脑**上运行构建脚本。

### Q: 安装程序图标不显示？
A: 确保 `assets/icons/win/icon.ico` 文件存在且大小为 256x256 像素。

### Q: 如何修改安装目录？
A: 编辑 `package.json` 中的 `nsis.oneClick` 设为 `false`，并设置 `allowToChangeInstallationDirectory: true`。

---

## 联系支持

- GitHub: https://github.com/a912454361/gopen
- 问题反馈: https://github.com/a912454361/gopen/issues
