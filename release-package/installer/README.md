# G open 智能创作助手 - Windows 安装程序

## 安装方式

### 方式1: GUI 图形界面安装（推荐）

1. 右键点击 `安装程序-GUI.ps1`
2. 选择"使用 PowerShell 运行"
3. 按照图形界面提示完成安装

### 方式2: 命令行安装

1. 双击运行 `安装程序.bat`
2. 按照命令行提示完成安装

### 方式3: 使用 NSIS 生成专业安装包

如果您需要生成专业的 .exe 安装程序：

1. 下载并安装 NSIS: https://nsis.sourceforge.io/
2. 准备资源文件：
   - `assets/icon.ico` - 应用图标
   - `assets/welcome.bmp` - 欢迎页面图片 (164x314)
   - `assets/header.bmp` - 头部图片 (150x57)
   - `LICENSE.txt` - 许可协议
3. 编译 `GOpen-Setup.nsi`

## 系统要求

- Windows 10/11 64位
- Node.js 20.x 或更高版本
- 约 500MB 磁盘空间

## 安装后启动

- **桌面快捷方式**: 双击 "G open 智能创作助手"
- **开始菜单**: 开始菜单 → G open → 启动 G open
- **命令行**: 运行 `[安装目录]\启动服务.bat`

## 访问地址

- 前端: http://localhost:5000
- 后端: http://localhost:9091

## 卸载

- 运行 `[安装目录]\卸载.bat`
- 或在"设置 → 应用"中找到"G open 智能创作助手"卸载

## 常见问题

### Q: 提示"未检测到 Node.js"？
A: 请先安装 Node.js，下载地址: https://nodejs.org/

### Q: 端口被占用？
A: 确保 5000 和 9091 端口未被其他程序占用

### Q: 安装依赖失败？
A: 检查网络连接，或手动在安装目录运行 `pnpm install`

## 技术支持

- GitHub: https://github.com/a912454361/gopen
- Issues: https://github.com/a912454361/gopen/issues
