/**
 * 万古长夜 - 独立服务器入口
 * 完全独立，不依赖任何第三方服务
 * 
 * 数据库: SQLite (本地文件)
 * 端口: 18789
 */

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入SQLite版本的路由
import oauthRouter from './routes/oauth-sqlite.js';
import rechargeRouter from './routes/recharge-sqlite.js';
import paymentRouter from './routes/payment-sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 配置 ====================

const PORT = process.env.PORT || 18789;
const HOST = process.env.HOST || '0.0.0.0';

console.log('========================================');
console.log('   万古长夜 - 独立服务器');
console.log('========================================');
console.log(`数据库: SQLite (本地文件)`);
console.log(`端口: ${PORT}`);
console.log('依赖: 无第三方服务依赖');
console.log('========================================');

// ==================== 创建Express应用 ====================

const app = express();

// CORS配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
}));

// 解析JSON请求体
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// ==================== API 路由 ====================

// 健康检查
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    version: '1.0.0-independent',
  });
});

// 挂载路由
app.use('/api/v1/oauth', oauthRouter);
app.use('/api/v1/recharge', rechargeRouter);
app.use('/api/v1/payment', paymentRouter);

// ==================== 用户余额接口 ====================

app.get('/api/v1/user/balance/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 动态导入SQLite客户端
    const { queryOne } = await import('./storage/database/sqlite-client.js');
    
    const balance = queryOne<{
      balance: number;
      g_points: number;
      total_recharged: number;
      total_consumed: number;
    }>(
      'SELECT balance, g_points, total_recharged, total_consumed FROM user_balances WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: balance || { balance: 0, g_points: 0, total_recharged: 0, total_consumed: 0 },
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: '获取余额失败' });
  }
});

// ==================== 用户信息接口 ====================

app.get('/api/v1/user/info/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { queryOne } = await import('./storage/database/sqlite-client.js');
    
    const user = queryOne<{
      id: string;
      nickname: string | null;
      avatar: string | null;
      member_level: string;
      member_expire_at: string | null;
    }>(
      'SELECT id, nickname, avatar, member_level, member_expire_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// ==================== 错误处理 ====================

app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

// 404处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: '接口不存在' });
});

// ==================== 启动服务器 ====================

app.listen(Number(PORT), HOST, () => {
  console.log(`\n✅ 服务器已启动: http://localhost:${PORT}`);
  console.log(`✅ API文档: http://localhost:${PORT}/api/v1/health`);
  console.log('\n按 Ctrl+C 停止服务器\n');
});

export default app;
