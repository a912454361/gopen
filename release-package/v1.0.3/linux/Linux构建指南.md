# G open Linux 构建指南

## 版本信息
- 版本号: v1.0.3
- 支持架构: x64, arm64
- 支持格式: AppImage, DEB, RPM

## 系统要求

### 支持的发行版
- Ubuntu 18.04+
- Debian 10+
- Fedora 30+
- CentOS 8+
- Arch Linux

### 硬件要求
- x64 或 arm64 处理器
- 至少 4GB 内存
- 至少 10GB 可用空间

## 构建方式

### 方式一：AppImage（推荐）

```bash
# 1. 安装依赖
sudo apt update
sudo apt install -y nodejs npm

# 安装 pnpm
npm install -g pnpm

# 2. 解压源码
tar -xzvf gopen-linux-v1.0.3.tar.gz
cd gopen-linux

# 3. 安装依赖
cd client && pnpm install

# 4. 构建 Web 版本
pnpm build:web

# 5. 创建 AppImage
# 使用 electron-builder 或手动创建
```

### 方式二：DEB 包（Ubuntu/Debian）

```bash
# 安装打包工具
sudo apt install -y dpkg-dev fakeroot

# 创建 DEB 包结构
mkdir -p gopen_1.0.3_amd64/DEBIAN
mkdir -p gopen_1.0.3_amd64/opt/gopen
mkdir -p gopen_1.0.3_amd64/usr/share/applications
mkdir -p gopen_1.0.3_amd64/usr/bin

# 复制文件
cp -r dist/* gopen_1.0.3_amd64/opt/gopen/

# 创建控制文件
cat > gopen_1.0.3_amd64/DEBIAN/control << EOF
Package: gopen
Version: 1.0.3
Section: utils
Priority: optional
Architecture: amd64
Maintainer: G Open Team <support@woshiguotao.cn>
Description: G open 智能创作助手
 AI驱动的游戏与动漫内容创作平台
EOF

# 构建 DEB
dpkg-deb --build gopen_1.0.3_amd64
```

### 方式三：RPM 包（Fedora/CentOS）

```bash
# 安装打包工具
sudo dnf install -y rpm-build rpmdevtools

# 创建 RPM 包
# ... 参考 RPM 打包规范
```

## 安装方式

### AppImage
```bash
# 下载
wget https://github.com/a912454361/gopen/releases/download/v1.0.3/gopen-1.0.3-x86_64.AppImage

# 添加执行权限
chmod +x gopen-1.0.3-x86_64.AppImage

# 运行
./gopen-1.0.3-x86_64.AppImage
```

### DEB
```bash
# 安装
sudo dpkg -i gopen_1.0.3_amd64.deb

# 安装依赖（如有缺失）
sudo apt --fix-broken install

# 运行
gopen
```

### RPM
```bash
# 安装
sudo rpm -i gopen-1.0.3-1.x86_64.rpm

# 运行
gopen
```

## 桌面集成

创建桌面文件 `/usr/share/applications/gopen.desktop`:

```ini
[Desktop Entry]
Name=G open
Comment=AI驱动的游戏与动漫内容创作平台
Exec=/opt/gopen/gopen %U
Icon=/opt/gopen/icon.png
Terminal=false
Type=Application
Categories=Development;IDE;
StartupWMClass=GOpen
```

## 权限配置

```bash
# 网络权限（通常默认允许）
# 如使用 Snap，需配置：
# snap connect gopen:network

# 文件权限
# 用户主目录读写权限通常默认允许
```

## 问题排查

### 运行失败
```bash
# 检查依赖
ldd /opt/gopen/gopen

# 检查日志
journalctl -xe
```

### 权限问题
```bash
# 给予执行权限
chmod +x /opt/gopen/gopen

# 或使用 sudo 运行（不推荐）
sudo /opt/gopen/gopen
```

## 联系支持

- GitHub: https://github.com/a912454361/gopen
- 问题反馈: https://github.com/a912454361/gopen/issues
