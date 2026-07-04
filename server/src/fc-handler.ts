/**
 * 阿里云函数计算 FC 入口适配器
 * 将 Express 应用适配为 FC 事件函数格式
 */

import type { Context } from '@alicloud/fc2';
import { createProxyMiddleware } from 'http-proxy-middleware';

// 动态导入 Express 应用
let app: any = null;
let server: any = null;

export const handler = async (event: any, context: Context): Promise<any> => {
  // 初始化应用（只执行一次）
  if (!app) {
    const { default: express } = await import('express');
    const { default: cors } = await import('cors');
    
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // 健康检查
    app.get('/api/v1/health', (req: any, res: any) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // 加载路由
    try {
      const routes = await import('./routes/index.js');
      app.use('/api/v1', routes.default);
    } catch (error) {
      console.error('Failed to load routes:', error);
    }
    
    server = app;
  }
  
  // 解析事件
  const method = event.method || 'GET';
  const path = event.path || '/';
  const headers = event.headers || {};
  const query = event.queries || {};
  const body = event.body || '';
  
  // 模拟请求响应
  return new Promise((resolve) => {
    const req = {
      method,
      path,
      url: path,
      headers,
      query,
      body,
    };
    
    const res = {
      status: (code: number) => ({
        json: (data: any) => resolve({
          statusCode: code,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }),
        send: (data: any) => resolve({
          statusCode: code,
          headers: { 'Content-Type': 'text/plain' },
          body: data,
        }),
      }),
      json: (data: any) => resolve({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    };
    
    // 处理健康检查
    if (path === '/api/v1/health') {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
      return;
    }
    
    // 其他路由
    resolve({
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not Found' }),
    });
  });
};

export default { handler };
