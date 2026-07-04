/**
 * 反向代理服务器
 * 端口 5000 作为统一入口
 * /game/* → 游戏平台 (端口 5001)
 * 其他 → Gopen 主应用 (端口 5002)
 */

const http = require('http');
const httpProxy = require('http-proxy');
const net = require('net');

// 创建代理实例
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true, // 支持 WebSocket
});

// 目标服务器
const BACKEND_API = 'http://localhost:9091';     // 后端 API
const GAME_PLATFORM = 'http://localhost:5001';   // 游戏平台
const GOPEN_APP = 'http://localhost:5002';       // Gopen 主应用

const server = http.createServer((req, res) => {
  const { url, headers } = req;
  const host = headers.host || '';

  // 1. API 请求优先转发到后端
  if (url.startsWith('/api')) {
    console.log(`[API] ${req.method} ${url}`);
    proxy.web(req, res, { target: BACKEND_API }, (e) => {
      console.error('API proxy error:', e.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Backend API Unavailable');
    });
    return;
  }

  // 2. 判断是否是游戏平台请求
  // 规则：路径以 /game 开头，或者请求头中包含游戏平台标识
  const isGameRequest = url.startsWith('/game') || 
                        url.startsWith('/node_modules') && headers.referer?.includes('/game');

  // 静态资源判断（通过 referer）
  const referer = headers.referer || '';
  const isGameReferer = referer.includes('/game') || referer.includes(':5001');

  if (isGameRequest || (isGameReferer && !url.startsWith('/api'))) {
    // 游戏平台请求
    console.log(`[Game] ${req.method} ${url}`);
    
    // 如果是 /game 开头，需要重写路径
    if (url.startsWith('/game')) {
      req.url = url.replace('/game', '') || '/';
    }
    
    proxy.web(req, res, { target: GAME_PLATFORM }, (e) => {
      console.error('Game proxy error:', e.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Game Platform Unavailable');
    });
  } else {
    // Gopen 主应用请求
    console.log(`[Gopen] ${req.method} ${url}`);
    proxy.web(req, res, { target: GOPEN_APP }, (e) => {
      console.error('Gopen proxy error:', e.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Gopen App Unavailable');
    });
  }
});

// WebSocket 代理
server.on('upgrade', (req, socket, head) => {
  const { url } = req;
  const isGameRequest = url.startsWith('/game');

  if (isGameRequest) {
    console.log(`[Game WS] ${url}`);
    if (url.startsWith('/game')) {
      req.url = url.replace('/game', '') || '/';
    }
    proxy.ws(req, socket, head, { target: GAME_PLATFORM });
  } else {
    console.log(`[Gopen WS] ${url}`);
    proxy.ws(req, socket, head, { target: GOPEN_APP });
  }
});

// 错误处理
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error');
  }
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  反向代理服务器已启动`);
  console.log(`  端口: ${PORT}`);
  console.log(`========================================`);
  console.log(`  Gopen 主应用:  /          → :5002`);
  console.log(`  万古长夜游戏:  /game      → :5001`);
  console.log(`========================================\n`);
});
