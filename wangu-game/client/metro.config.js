const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 配置开发服务器代理
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // 将 /api/* 请求代理到后端服务
      if (req.url && req.url.startsWith('/api/')) {
        const http = require('http');
        
        const proxyReq = http.request(
          {
            hostname: 'localhost',
            port: 6091,
            path: req.url,
            method: req.method,
            headers: {
              ...req.headers,
              host: 'localhost:6091',
            },
          },
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
            proxyRes.pipe(res);
          }
        );

        proxyReq.on('error', (e) => {
          console.error('Proxy error:', e.message);
          res.writeHead(502);
          res.end('Bad Gateway');
        });

        req.pipe(proxyReq);
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
