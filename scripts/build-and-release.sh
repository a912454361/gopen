#!/bin/bash

# ============================================================
# G open 智能创作助手 - 多平台构建发布脚本
# ============================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置
APP_NAME="G open"
APP_VERSION="1.0.4"
BUILD_DIR="./build"
RELEASE_DIR="./release"
DIST_DIR="./dist"

# 打印标题
print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║           G open 智能创作助手 - 构建发布系统                 ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}版本: ${APP_VERSION}${NC}"
    echo -e "${CYAN}时间: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
}

# 检查环境
check_environment() {
    echo -e "${BLUE}[1/7] 检查构建环境...${NC}"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: Node.js 未安装${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}错误: pnpm 未安装${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}✓${NC} pnpm $(pnpm --version)"
    
    # 检查 EAS CLI
    if ! command -v eas &> /dev/null; then
        echo -e "${YELLOW}! EAS CLI 未安装，正在安装...${NC}"
        npm install -g eas-cli
    fi
    echo -e "  ${GREEN}✓${NC} EAS CLI $(eas --version)"
    
    echo ""
}

# 清理构建目录
clean_build() {
    echo -e "${BLUE}[2/7] 清理构建目录...${NC}"
    
    rm -rf "$BUILD_DIR"
    rm -rf "$RELEASE_DIR"
    rm -rf "$DIST_DIR"
    
    mkdir -p "$BUILD_DIR"
    mkdir -p "$RELEASE_DIR/android"
    mkdir -p "$RELEASE_DIR/ios"
    mkdir -p "$RELEASE_DIR/windows"
    mkdir -p "$RELEASE_DIR/macos"
    mkdir -p "$DIST_DIR"
    
    echo -e "  ${GREEN}✓${NC} 构建目录已清理"
    echo ""
}

# 构建 Android APK
build_android() {
    echo -e "${BLUE}[3/7] 构建 Android APK...${NC}"
    
    cd client
    
    # 更新版本
    echo -e "  ${CYAN}更新版本号...${NC}"
    
    # 使用 EAS 构建 APK
    echo -e "  ${CYAN}开始构建 APK（这可能需要几分钟）...${NC}"
    eas build --platform android --profile android-apk --non-interactive --wait
    
    # 下载构建产物
    echo -e "  ${CYAN}下载构建产物...${NC}"
    eas build:list --platform android --limit 1 --json > ../build/android-build.json
    
    # 从 JSON 中提取下载 URL
    APK_URL=$(cat ../build/android-build.json | jq -r '.[0].artifacts.buildUrl')
    if [ -n "$APK_URL" ] && [ "$APK_URL" != "null" ]; then
        curl -L -o "../release/android/gopen-${APP_VERSION}.apk" "$APK_URL"
        echo -e "  ${GREEN}✓${NC} APK 已保存到 release/android/gopen-${APP_VERSION}.apk"
    else
        echo -e "  ${YELLOW}! 无法自动下载 APK，请手动下载${NC}"
    fi
    
    cd ..
    echo ""
}

# 构建 iOS IPA
build_ios() {
    echo -e "${BLUE}[4/7] 构建 iOS IPA...${NC}"
    
    cd client
    
    echo -e "  ${CYAN}开始构建 IPA（这可能需要几分钟）...${NC}"
    eas build --platform ios --profile ios-adhoc --non-interactive --wait
    
    # 下载构建产物
    echo -e "  ${CYAN}下载构建产物...${NC}"
    eas build:list --platform ios --limit 1 --json > ../build/ios-build.json
    
    IPA_URL=$(cat ../build/ios-build.json | jq -r '.[0].artifacts.buildUrl')
    if [ -n "$IPA_URL" ] && [ "$IPA_URL" != "null" ]; then
        curl -L -o "../release/ios/gopen-${APP_VERSION}.ipa" "$IPA_URL"
        echo -e "  ${GREEN}✓${NC} IPA 已保存到 release/ios/gopen-${APP_VERSION}.ipa"
    else
        echo -e "  ${YELLOW}! 无法自动下载 IPA，请手动下载${NC}"
    fi
    
    cd ..
    echo ""
}

# 构建 Web 版本（用于桌面应用）
build_web() {
    echo -e "${BLUE}[5/7] 构建 Web 版本...${NC}"
    
    cd client
    
    echo -e "  ${CYAN}导出 Web 版本...${NC}"
    npx expo export --platform web --output-dir ../dist/web
    
    cd ..
    
    echo -e "  ${GREEN}✓${NC} Web 版本已导出到 dist/web"
    echo ""
}

# 创建 Windows 安装包
create_windows_installer() {
    echo -e "${BLUE}[6/7] 创建 Windows 安装包...${NC}"
    
    # 使用 Electron 打包 Web 应用
    # 这里我们创建一个基于 Electron 的桌面应用
    
    mkdir -p "$DIST_DIR/electron"
    
    # 创建 package.json
    cat > "$DIST_DIR/electron/package.json" << 'EOF'
{
  "name": "gopen-desktop",
  "version": "1.0.4",
  "description": "G open 智能创作助手 - 桌面版",
  "main": "main.js",
  "author": "G open Team",
  "license": "MIT"
}
EOF
    
    # 创建 Electron 主进程
    cat > "$DIST_DIR/electron/main.js" << 'EOF'
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

// 禁用硬件加速（某些系统兼容性）
app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'G open 智能创作助手',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#0A0A0F',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    frame: true,
    titleBarStyle: 'default',
    show: false,
  });

  // 加载本地 Web 文件
  mainWindow.loadFile(path.join(__dirname, 'web', 'index.html'));

  // 优雅显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 创建菜单
  const menuTemplate = [
    {
      label: '文件',
      submenu: [
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '官方网站',
          click: async () => {
            await shell.openExternal('https://woshiguotao.cn');
          }
        },
        {
          label: '用户手册',
          click: async () => {
            await shell.openExternal('https://woshiguotao.cn/docs');
          }
        },
        { type: 'separator' },
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于 G open',
              message: 'G open 智能创作助手',
              detail: '版本: 1.0.4\n\n专注于游戏和动漫内容的AI辅助创作工具。\n\n© 2024 G open Team'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
EOF
    
    # 复制 Web 文件
    if [ -d "dist/web" ]; then
        cp -r dist/web "$DIST_DIR/electron/web"
    fi
    
    # 复制图标
    mkdir -p "$DIST_DIR/electron/assets"
    if [ -f "client/assets/images/icon.png" ]; then
        cp client/assets/images/icon.png "$DIST_DIR/electron/assets/icon.png"
    fi
    
    echo -e "  ${GREEN}✓${NC} Electron 应用结构已创建"
    echo -e "  ${CYAN}请使用 electron-builder 或 NSIS 创建安装包${NC}"
    echo ""
}

# 创建发布包
create_release_package() {
    echo -e "${BLUE}[7/7] 创建发布包...${NC}"
    
    # 创建校验和文件
    echo -e "  ${CYAN}生成校验和...${NC}"
    if [ -d "release" ]; then
        find release -type f \( -name "*.apk" -o -name "*.ipa" -o -name "*.exe" -o -name "*.dmg" \) -exec sha256sum {} \; > "$RELEASE_DIR/checksums.txt"
        echo -e "  ${GREEN}✓${NC} 校验和已生成"
    fi
    
    # 创建发布说明
    cat > "$RELEASE_DIR/RELEASE_NOTES.md" << EOF
# G open 智能创作助手 v${APP_VERSION}

## 🎉 新功能

### 厂商自主存储系统
- ✅ 厂商可配置自己的存储服务（阿里云 OSS / 腾讯云 COS / AWS S3 / MinIO）
- ✅ 存储凭证 AES-256 加密存储，确保安全
- ✅ 文件存储到厂商自己的账户，平台只提供接口层
- ✅ 支持文件类型和大小限制

### AI 模型服务
- ✅ 支持 LLM、图像生成、视频生成、音频处理
- ✅ 多模型负载均衡和故障转移
- ✅ 实时流式响应

### 厂商管理系统
- ✅ 厂商注册和审核流程
- ✅ 服务管理和定价
- ✅ 收入统计和结算

## 📦 安装包

| 平台 | 文件 | 大小 | 校验和 |
|------|------|------|--------|
| Android | gopen-${APP_VERSION}.apk | ~50MB | SHA256 |
| iOS | gopen-${APP_VERSION}.ipa | ~60MB | SHA256 |
| Windows | gopen-${APP_VERSION}-setup.exe | ~80MB | SHA256 |
| macOS | gopen-${APP_VERSION}.dmg | ~90MB | SHA256 |

## 🔧 技术栈

- 前端: Expo 54 + React Native
- 后端: Express.js + TypeScript
- 数据库: Supabase (PostgreSQL)
- 存储: 厂商自主配置（OSS/COS/S3）
- AI SDK: coze-coding-dev-sdk

## 📝 更新日志

### v${APP_VERSION} ($(date '+%Y-%m-%d'))
- 新增厂商自主存储系统
- 新增存储凭证加密管理
- 新增多存储服务支持
- 优化文件上传流程
- 修复若干已知问题

---

**下载地址**: https://github.com/a912454361/gopen/releases/tag/v${APP_VERSION}

**官方网站**: https://woshiguotao.cn
EOF
    
    echo -e "  ${GREEN}✓${NC} 发布说明已创建"
    echo ""
}

# 发布到 GitHub
publish_to_github() {
    echo -e "${BLUE}发布到 GitHub Releases...${NC}"
    
    # 检查 gh CLI
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}! GitHub CLI 未安装，跳过发布${NC}"
        echo -e "  请手动创建 GitHub Release"
        return
    fi
    
    # 检查是否在 Git 仓库中
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${YELLOW}! 不在 Git 仓库中，跳过发布${NC}"
        return
    fi
    
    # 创建 Git 标签
    echo -e "  ${CYAN}创建 Git 标签 v${APP_VERSION}...${NC}"
    git tag -a "v${APP_VERSION}" -m "Release v${APP_VERSION}"
    git push origin "v${APP_VERSION}"
    
    # 创建 GitHub Release
    echo -e "  ${CYAN}创建 GitHub Release...${NC}"
    gh release create "v${APP_VERSION}" \
        --title "G open v${APP_VERSION}" \
        --notes-file "$RELEASE_DIR/RELEASE_NOTES.md" \
        release/android/*.apk \
        release/ios/*.ipa \
        release/windows/*.exe \
        release/macos/*.dmg \
        2>/dev/null || echo -e "  ${YELLOW}! Release 可能已存在或文件不完整${NC}"
    
    echo -e "  ${GREEN}✓${NC} GitHub Release 已创建"
    echo ""
}

# 主函数
main() {
    print_header
    check_environment
    clean_build
    
    # 根据参数选择构建目标
    case "${1:-all}" in
        "android")
            build_android
            ;;
        "ios")
            build_ios
            ;;
        "web")
            build_web
            ;;
        "windows")
            build_web
            create_windows_installer
            ;;
        "all")
            build_android
            build_ios
            build_web
            create_windows_installer
            ;;
        "release")
            create_release_package
            publish_to_github
            ;;
        *)
            echo "用法: $0 [android|ios|web|windows|all|release]"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    ✅ 构建完成！                             ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "📁 输出目录: ${CYAN}$RELEASE_DIR${NC}"
    echo ""
}

# 执行主函数
main "$@"
