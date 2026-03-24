const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// 安全配置
const SECURITY_CONFIG = {
  // 应用ID校验
  APP_ID: 'com.gopen.ai-assistant',
  // 允许的协议
  ALLOWED_PROTOCOLS: ['https:', 'http:'],
  // 安全头
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:;",
  // 应用版本
  VERSION: '1.0.0'
};

// 安全管理器
class SecurityManager {
  constructor() {
    this.appHash = null;
    this.isSecure = true;
  }

  // 初始化安全检查
  async initialize() {
    console.log('[Security] 初始化安全管理器...');
    
    // 计算应用完整性哈希
    await this.calculateAppHash();
    
    // 检查运行环境
    this.checkEnvironment();
    
    // 设置安全策略
    this.setupSecurityPolicies();
    
    console.log('[Security] 安全管理器初始化完成');
    return this.isSecure;
  }

  // 计算应用文件哈希（完整性校验）
  async calculateAppHash() {
    try {
      const mainJsPath = __dirname;
      const files = ['main.js', 'preload.js', 'package.json'];
      const hash = crypto.createHash('sha256');
      
      for (const file of files) {
        const filePath = path.join(mainJsPath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath);
          hash.update(content);
        }
      }
      
      this.appHash = hash.digest('hex').substring(0, 16);
      console.log(`[Security] 应用指纹: ${this.appHash}`);
    } catch (error) {
      console.error('[Security] 计算应用哈希失败:', error.message);
    }
  }

  // 检查运行环境
  checkEnvironment() {
    // 检查是否在开发模式
    const isDev = process.env.NODE_ENV === 'development' || 
                  process.defaultApp ||
                  /[\\/]electron/.test(process.execPath);
    
    if (isDev) {
      console.log('[Security] 开发模式运行');
    } else {
      console.log('[Security] 生产模式运行');
    }

    // 检查是否被修改
    const appPath = app.getAppPath();
    if (appPath.includes('app.asar')) {
      console.log('[Security] 应用已打包（asar）');
    }
  }

  // 设置安全策略
  setupSecurityPolicies() {
    // 禁用远程模块
    app.disableHardwareAcceleration();
    
    // 设置命令行参数
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
    app.commandLine.appendSwitch('enable-features', 'PlatformHEVCDecoderSupport');
  }

  // 验证URL安全性
  validateUrl(url) {
    try {
      const parsedUrl = new URL(url);
      if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        console.warn(`[Security] 阻止不安全协议: ${parsedUrl.protocol}`);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('[Security] 无效URL:', url);
      return false;
    }
  }

  // 获取安全状态
  getSecurityStatus() {
    return {
      isSecure: this.isSecure,
      appHash: this.appHash,
      version: SECURITY_CONFIG.VERSION,
      platform: process.platform,
      electronVersion: process.versions.electron
    };
  }
}

const securityManager = new SecurityManager();

// 防止多实例运行
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Security] 检测到另一个实例正在运行，退出');
  app.quit();
  process.exit(0);
}

// 主窗口引用
let mainWindow = null;

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'G Open AI助手',
    icon: path.join(__dirname, 'assets/icons/win/icon.ico'),
    backgroundColor: '#1a1a2e',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载应用
  const startUrl = `file://${path.join(__dirname, 'dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  // 窗口准备就绪时显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[App] 窗口已显示');
  });

  // 安全处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (securityManager.validateUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // 阻止导航到不安全的URL
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (!url.startsWith('file://') && !securityManager.validateUrl(url)) {
      event.preventDefault();
      console.warn('[Security] 阻止导航到:', url);
    }
  });

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 窗口关闭处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用准备就绪
app.whenReady().then(async () => {
  // 初始化安全管理器
  await securityManager.initialize();
  
  // 创建窗口
  createWindow();

  // macOS 激活处理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出（Windows & Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 第二个实例启动时聚焦主窗口
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

// 安全处理外部协议
app.on('web-contents-created', (event, contents) => {
  // 禁用导航到不安全URL
  contents.on('will-navigate', (event, navigationUrl) => {
    if (!securityManager.validateUrl(navigationUrl)) {
      event.preventDefault();
    }
  });

  // 禁用新窗口创建
  contents.setWindowOpenHandler(({ url }) => {
    if (securityManager.validateUrl(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
});

// IPC 处理
ipcMain.handle('get-security-status', () => {
  return securityManager.getSecurityStatus();
});

ipcMain.handle('get-app-version', () => {
  return {
    version: SECURITY_CONFIG.VERSION,
    electron: process.versions.electron,
    node: process.versions.node,
    platform: process.platform
  };
});

// 导出安全管理器供其他模块使用
module.exports = { securityManager, SECURITY_CONFIG };
