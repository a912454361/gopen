#!/bin/bash
# 万古长夜 - 一键安装脚本
# 在您的电脑上运行此脚本即可完成安装

set -e

echo "========================================"
echo "   万古长夜 - 一键安装"
echo "========================================"
echo ""

# 创建目录结构
echo "[1/6] 创建目录结构..."
mkdir -p wangu-server/server/src/routes
mkdir -p wangu-server/server/src/storage/database
mkdir -p wangu-server/server/data

# 创建 package.json
echo "[2/6] 创建 package.json..."
cat > wangu-server/server/package.json << 'PKGJSON'
{
  "name": "wangu-server",
  "version": "1.0.0",
  "description": "万古长夜 - 独立服务器",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "NODE_ENV=production PORT=18789 tsx src/index-independent.ts",
    "dev": "NODE_ENV=development PORT=18789 tsx src/index-independent.ts"
  },
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "cors": "^2.8.5",
    "express": "^4.22.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
PKGJSON

# 创建 tsconfig.json
echo "[3/6] 创建 tsconfig.json..."
cat > wangu-server/server/tsconfig.json << 'TSCONFIG'
{
  "$schema": "https://www.schemastore.org/tsconfig",
  "compilerOptions": {
    "lib": ["ES2024"],
    "module": "ESNext",
    "target": "ES2024",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
TSCONFIG

# 创建 .env
echo "[4/6] 创建 .env..."
cat > wangu-server/server/.env << 'ENVFILE'
NODE_ENV=development
PORT=18789
HOST=127.0.0.1
JWT_SECRET=wangu-independent-jwt-secret-key-2024
ADMIN_SECRET_KEY=WanguAdmin2024SecretKey
ENVFILE

# 创建 SQLite 客户端
echo "[5/6] 创建 SQLite 客户端..."
cat > wangu-server/server/src/storage/database/sqlite-client.ts << 'SQLITE'
/**
 * SQLite 本地数据库客户端
 * 完全独立，不依赖任何第三方服务
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../../../data/wangu.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

console.log(`[SQLite] 数据库已连接: ${DB_PATH}`);

// 初始化表结构
const initTables = db.transaction(() => {
  // 用户表
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT, email TEXT, nickname TEXT, avatar TEXT,
    password_hash TEXT, member_level TEXT DEFAULT 'free',
    member_expire_at TEXT, balance INTEGER DEFAULT 0,
    g_points INTEGER DEFAULT 0, is_super_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  )`);

  // OAuth绑定表
  db.exec(`CREATE TABLE IF NOT EXISTS oauth_bindings (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    platform TEXT NOT NULL, open_id TEXT NOT NULL,
    nickname TEXT, avatar TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(platform, open_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // 用户余额表
  db.exec(`CREATE TABLE IF NOT EXISTS user_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    balance INTEGER DEFAULT 0, g_points INTEGER DEFAULT 0,
    total_recharged INTEGER DEFAULT 0, total_consumed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // 充值记录表
  db.exec(`CREATE TABLE IF NOT EXISTS recharge_records (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    order_no TEXT NOT NULL UNIQUE, amount INTEGER NOT NULL,
    recharge_type TEXT NOT NULL, pay_method TEXT NOT NULL,
    transaction_id TEXT, proof_images TEXT, status TEXT DEFAULT 'pending',
    bonus_amount INTEGER DEFAULT 0, total_amount INTEGER,
    submit_at TEXT, review_at TEXT, reviewer_id TEXT,
    reject_reason TEXT, admin_remark TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // 会话表
  db.exec(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  console.log('[SQLite] 数据库表结构初始化完成');
});

initTables();

// 导出辅助函数
export function queryAll<T = unknown>(sql: string, params: unknown[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function queryOne<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function execute(sql: string, params: unknown[] = []): Database.RunResult {
  return db.prepare(sql).run(...params);
}

export function transaction<T>(fn: () => T): T {
  return db.transaction(fn)();
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateOrderNo(prefix: string = 'ORD'): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export { db };
export const DB_FILE_PATH = DB_PATH;
SQLITE

# 创建 OAuth 路由
echo "[5/6] 创建 OAuth 路由..."
cat > wangu-server/server/src/routes/oauth-sqlite.ts << 'OAUTH'
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { queryOne, execute, transaction, generateUUID } from '../storage/database/sqlite-client.js';

const router = Router();

const PLATFORMS: Record<string, { name: string }> = {
  wechat: { name: '微信' }, alipay: { name: '支付宝' },
  douyin: { name: '抖音' }, qq: { name: 'QQ' },
  weibo: { name: '微博' }, github: { name: 'GitHub' },
  google: { name: 'Google' }, apple: { name: 'Apple' },
};

router.post('/callback', async (req: Request, res: Response) => {
  try {
    const { platform, code } = req.body;
    if (!PLATFORMS[platform]) return res.status(400).json({ error: '不支持的平台' });

    const mockOpenId = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const existingBinding = queryOne<{ user_id: string }>(
      'SELECT user_id FROM oauth_bindings WHERE platform = ? AND open_id = ?',
      [platform, mockOpenId]
    );

    let userId: string;
    let isNewUser = false;

    if (existingBinding) {
      userId = existingBinding.user_id;
    } else {
      isNewUser = true;
      userId = generateUUID();
      const nickname = `${PLATFORMS[platform].name}用户`;

      transaction(() => {
        execute(`INSERT INTO users (id, nickname, member_level) VALUES (?, ?, 'free')`, [userId, nickname]);
        execute(`INSERT INTO user_balances (user_id) VALUES (?)`, [userId]);
        execute(`INSERT INTO oauth_bindings (id, user_id, platform, open_id, nickname) VALUES (?, ?, ?, ?, ?)`,
          [generateUUID(), userId, platform, mockOpenId, nickname]);
      });
    }

    const sessionToken = generateUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    execute('INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [generateUUID(), userId, sessionToken, expiresAt]);

    res.json({ success: true, data: { userId, nickname: PLATFORMS[platform].name + '用户', isNewUser, sessionToken, expiresIn: 604800 } });
  } catch (error) {
    res.status(400).json({ error: '登录失败' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: '缺少token' });

    const session = queryOne<{ user_id: string; expires_at: string }>(
      'SELECT user_id, expires_at FROM sessions WHERE token = ?', [token]);
    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: '无效或过期的token' });
    }

    const user = queryOne<{ id: string; nickname: string | null }>(
      'SELECT id, nickname FROM users WHERE id = ?', [session.user_id]);

    res.json({ success: true, data: { userId: user?.id, nickname: user?.nickname } });
  } catch (error) {
    res.status(500).json({ error: '验证失败' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (token) execute('DELETE FROM sessions WHERE token = ?', [token]);
  res.json({ success: true, message: '登出成功' });
});

export default router;
OAUTH

# 创建充值路由
cat > wangu-server/server/src/routes/recharge-sqlite.ts << 'RECHARGE'
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { queryAll, queryOne, execute, transaction, generateUUID, generateOrderNo } from '../storage/database/sqlite-client.js';

const router = Router();
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'WanguAdmin2024SecretKey';

const verifyAdmin = (req: Request): boolean => {
  const key = req.headers['x-admin-key'] as string || req.body?.adminKey;
  return key === ADMIN_KEY;
};

router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { userId, amount, rechargeType, payMethod, transactionId } = req.body;
    
    const user = queryOne<{ id: string }>('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const existing = queryOne<{ id: string }>(
      'SELECT id FROM recharge_records WHERE transaction_id = ?', [transactionId]);
    if (existing) return res.status(400).json({ error: '流水号已存在' });

    const recordId = generateUUID();
    const orderNo = generateOrderNo('RCH');

    execute(`INSERT INTO recharge_records (id, user_id, order_no, amount, recharge_type, pay_method, transaction_id, status, submit_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now', 'localtime'))`,
      [recordId, userId, orderNo, amount, rechargeType, payMethod, transactionId]);

    res.json({ success: true, data: { recordId, orderNo } });
  } catch (error) {
    res.status(400).json({ error: '提交失败' });
  }
});

router.get('/records/:userId', async (req: Request, res: Response) => {
  try {
    const records = queryAll('SELECT * FROM recharge_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [req.params.userId]);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ error: '获取记录失败' });
  }
});

router.get('/admin/pending', async (req: Request, res: Response) => {
  if (!verifyAdmin(req)) return res.status(403).json({ error: '无权限' });
  const records = queryAll(`SELECT r.*, u.nickname FROM recharge_records r LEFT JOIN users u ON r.user_id = u.id WHERE r.status = 'pending' ORDER BY r.created_at DESC`);
  res.json({ success: true, data: records });
});

router.post('/admin/approve', async (req: Request, res: Response) => {
  if (!verifyAdmin(req)) return res.status(403).json({ error: '无权限' });
  try {
    const { recordId } = req.body;
    const record = queryOne<{ user_id: string; amount: number }>('SELECT user_id, amount FROM recharge_records WHERE id = ?', [recordId]);
    if (!record) return res.status(404).json({ error: '记录不存在' });

    transaction(() => {
      execute('UPDATE user_balances SET balance = balance + ?, total_recharged = total_recharged + ? WHERE user_id = ?',
        [record.amount, record.amount, record.user_id]);
      execute(`UPDATE recharge_records SET status = 'approved', review_at = datetime('now', 'localtime') WHERE id = ?`, [recordId]);
    });

    res.json({ success: true, message: '审核通过' });
  } catch (error) {
    res.status(500).json({ error: '审核失败' });
  }
});

router.post('/admin/reject', async (req: Request, res: Response) => {
  if (!verifyAdmin(req)) return res.status(403).json({ error: '无权限' });
  const { recordId, reason } = req.body;
  execute(`UPDATE recharge_records SET status = 'rejected', reject_reason = ?, review_at = datetime('now', 'localtime') WHERE id = ?`, [reason, recordId]);
  res.json({ success: true, message: '已拒绝' });
});

export default router;
RECHARGE

# 创建支付路由
cat > wangu-server/server/src/routes/payment-sqlite.ts << 'PAYMENT'
import { Router, type Request, type Response } from 'express';

const router = Router();

const PAYMENT_ACCOUNTS = {
  alipay: { name: '支付宝收款', account: '请修改为您的账号', qrcodeUrl: '', realName: '请修改', desc: '支付宝扫码支付', color: '#1677FF' },
  wechat: { name: '微信收款', account: '请修改为您的账号', qrcodeUrl: '', realName: '请修改', desc: '微信扫码支付', color: '#07C160' },
  bank: { name: '银行转账', account: '请修改为您的账号', bankName: '银行名称', bankBranch: '支行', realName: '请修改', desc: '银行转账', color: '#C41230' },
};

router.get('/accounts', async (req: Request, res: Response) => {
  res.json({ success: true, data: PAYMENT_ACCOUNTS });
});

export default router;
PAYMENT

# 创建服务器入口
echo "[6/6] 创建服务器入口..."
cat > wangu-server/server/src/index-independent.ts << 'MAIN'
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import oauthRouter from './routes/oauth-sqlite.js';
import rechargeRouter from './routes/recharge-sqlite.js';
import paymentRouter from './routes/payment-sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 18789;
const HOST = process.env.HOST || '127.0.0.1';

console.log('========================================');
console.log('   万古长夜 - 独立服务器');
console.log('========================================');
console.log(`数据库: SQLite (本地文件)`);
console.log(`端口: ${PORT}`);
console.log('========================================');

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'SQLite', version: '1.0.0-independent' });
});

app.use('/api/v1/oauth', oauthRouter);
app.use('/api/v1/recharge', rechargeRouter);
app.use('/api/v1/payment', paymentRouter);

app.get('/api/v1/user/balance/:userId', async (req: Request, res: Response) => {
  try {
    const { queryOne } = await import('./storage/database/sqlite-client.js');
    const balance = queryOne('SELECT balance, g_points, total_recharged FROM user_balances WHERE user_id = ?', [req.params.userId]);
    res.json({ success: true, data: balance || { balance: 0, g_points: 0, total_recharged: 0 } });
  } catch (error) {
    res.status(500).json({ error: '获取余额失败' });
  }
});

app.get('/api/v1/user/info/:userId', async (req: Request, res: Response) => {
  try {
    const { queryOne } = await import('./storage/database/sqlite-client.js');
    const user = queryOne('SELECT id, nickname, avatar, member_level FROM users WHERE id = ?', [req.params.userId]);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

app.listen(Number(PORT), HOST, () => {
  console.log(`\n✅ 服务器已启动: http://localhost:${PORT}`);
  console.log(`✅ 健康检查: http://localhost:${PORT}/api/v1/health\n`);
});

export default app;
MAIN

# 创建启动脚本
cat > wangu-server/start.sh << 'STARTSH'
#!/bin/bash
cd "$(dirname "$0")/server"
[ ! -d "node_modules" ] && npm install
mkdir -p data
npm run dev
STARTSH
chmod +x wangu-server/start.sh

cat > wangu-server/start.bat << 'STARTBAT'
@echo off
chcp 65001 >nul
cd /d "%~dp0server"
if not exist "node_modules" call npm install
if not exist "data" mkdir data
call npm run dev
pause
STARTBAT

echo ""
echo "========================================"
echo "   安装完成！"
echo "========================================"
echo ""
echo "目录: $(pwd)/wangu-server"
echo ""
echo "启动方式:"
echo "  Windows: 双击 start.bat"
echo "  Mac/Linux: ./start.sh"
echo ""
echo "或手动启动:"
echo "  cd wangu-server/server"
echo "  npm install"
echo "  npm run dev"
echo ""
