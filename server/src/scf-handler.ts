/**
 * 腾讯云 SCF Web 函数入口适配器
 * 将 Express 应用适配为 SCF Web 函数格式
 * 
 * 部署方式：
 * 1. 在腾讯云 SCF 控制台创建 Web 函数
 * 2. 运行环境选择 Node.js 18/20
 * 3. 入口文件设置为 scf-handler.handler
 * 4. 配置函数 URL 和自定义域名 gopen.com.cn
 */

import type { Context } from 'node:http';

// Express 应用实例缓存
let expressApp: any = null;
let isInitialized = false;

/**
 * SCF Web 函数入口
 * 支持 API 网关事件和函数 URL 事件
 */
export const handler = async (event: any, context: Context): Promise<any> => {
  // 初始化 Express 应用（冷启动时执行一次）
  if (!isInitialized) {
    await initializeApp();
    isInitialized = true;
  }

  // 解析请求
  const method = event.httpMethod || event.method || 'GET';
  const path = event.path || event.requestContext?.http?.path || '/';
  const headers = event.headers || {};
  const queryString = event.queryStringParameters || event.query || {};
  const body = event.body || '';
  const isBase64Encoded = event.isBase64Encoded || false;

  // 构造模拟的请求和响应对象
  const req = {
    method,
    url: path,
    path,
    headers: normalizeHeaders(headers),
    query: queryString,
    body: isBase64Encoded ? Buffer.from(body, 'base64').toString() : body,
  };

  // 处理请求
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    const res = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      
      setHeader(key: string, value: any) {
        this.headers[key] = String(value);
      },
      
      getHeader(key: string) {
        return this.headers[key];
      },
      
      removeHeader(key: string) {
        delete this.headers[key];
      },
      
      writeHead(statusCode: number, headers?: Record<string, string>) {
        this.statusCode = statusCode;
        if (headers) {
          Object.assign(this.headers, headers);
        }
      },
      
      write(chunk: any) {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return true;
      },
      
      end(data?: any) {
        if (data) {
          chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
        }
        
        const body = Buffer.concat(chunks).toString('utf-8');
        
        // 返回 SCF 响应格式
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body,
          isBase64Encoded: false,
        });
      },
      
      json(data: any) {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(data));
      },
      
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      
      send(data: any) {
        if (typeof data === 'object') {
          this.json(data);
        } else {
          this.end(data);
        }
      },
    };

    // 路由请求到 Express
    try {
      handleRequest(req, res);
    } catch (error: any) {
      console.error('[SCF] Request handling error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  });
};

/**
 * 初始化 Express 应用
 */
async function initializeApp() {
  console.log('[SCF] Initializing Express app...');
  
  try {
    // 动态导入主应用
    const { createApp } = await import('./scf-app.js');
    expressApp = await createApp();
    console.log('[SCF] Express app initialized successfully');
  } catch (error: any) {
    console.error('[SCF] Failed to initialize Express app:', error);
    throw error;
  }
}

/**
 * 处理请求路由
 */
function handleRequest(req: any, res: any) {
  const { method, path } = req;
  
  // CORS 预检请求
  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Admin-Key, X-Player-Id');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(204).end();
    return;
  }
  
  // 健康检查
  if (path === '/api/v1/health' || path === '/health') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: 'tencent-scf',
    });
    return;
  }
  
  // 传递给 Express 应用
  if (expressApp) {
    // Express 处理逻辑
    handleExpressRequest(req, res);
  } else {
    res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Express app not initialized',
    });
  }
}

/**
 * 处理 Express 路由
 */
function handleExpressRequest(req: any, res: any) {
  const { method, path, headers, query, body } = req;
  
  // 基于路径路由到不同的处理函数
  // 这里需要根据实际 API 路由进行扩展
  
  // 默认 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  try {
    // 调用 Express 的路由处理
    expressApp.handle(req, res, (err: any) => {
      if (err) {
        console.error('[SCF] Express error:', err);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
        });
      }
    });
  } catch (error: any) {
    console.error('[SCF] Route error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * 规范化请求头
 */
function normalizeHeaders(headers: Record<string, any>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = String(value);
  }
  return normalized;
}

export default { handler };
