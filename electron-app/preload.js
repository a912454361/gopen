const { contextBridge, ipcRenderer } = require('electron');

// 安全的 API 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取安全状态
  getSecurityStatus: () => ipcRenderer.invoke('get-security-status'),
  
  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 安全日志
  log: (level, message) => {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
});

// 防止页面脚本篡改
Object.freeze(window.electronAPI);

// 注入安全标记
window.__SECURITY_INITIALIZED__ = true;
window.__APP_VERSION__ = '1.0.0';

console.log('[Preload] 安全上下文已初始化');
