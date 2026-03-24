# Windows 安装程序构建包

## 文件说明

| 文件 | 大小 | 说明 |
|------|------|------|
| `electron-app-build.tar.gz` | ~12MB | 完整的 Electron 构建包 |

## 使用方法

### 步骤 1：下载并解压

将 `electron-app-build.tar.gz` 下载到 Windows 电脑，解压到任意目录。

### 步骤 2：运行构建脚本

双击运行 `build-installer.bat`

脚本将自动：
- 检查 Node.js 环境
- 安装 pnpm
- 安装项目依赖
- 构建 Windows 安装程序

### 步骤 3：获取安装程序

构建完成后，在 `release/` 目录下生成：

- `G Open AI助手 Setup 1.0.0.exe` - 一键安装程序
- `G Open AI助手-1.0.0-Portable.exe` - 便携版（无需安装）

## 环境要求

- Windows 10/11 (64位)
- Node.js 18.x 或更高版本

## 详细说明

参见 `BUILD-GUIDE.md`
