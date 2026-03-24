// Preload 脚本 - 提供安全的渲染进程与主进程通信
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 平台信息
  platform: process.platform,
  
  // 应用版本
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // 打开外部链接
  openExternal: (url) => ipcRenderer.send('open-external', url),
  
  // 退出应用
  quit: () => ipcRenderer.send('quit-app')
});

// 安全日志
console.log('Preload script loaded successfully');
