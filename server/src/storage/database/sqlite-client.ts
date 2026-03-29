/**
 * SQLite 本地数据库客户端
 * 完全独立，不依赖任何第三方服务
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module 环境下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径 - 存储在项目根目录的 data 文件夹
const DB_PATH = path.join(__dirname, '../../../data/wangu.db');

// 确保数据目录存在
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 启用 WAL 模式（提高并发性能）
db.pragma('journal_mode = WAL');

console.log(`[SQLite] 数据库已连接: ${DB_PATH}`);

// ==================== 数据库表结构初始化 ====================

const initTables = db.transaction(() => {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT,
      email TEXT,
      nickname TEXT,
      avatar TEXT,
      password_hash TEXT,
      member_level TEXT DEFAULT 'free',
      member_expire_at TEXT,
      balance INTEGER DEFAULT 0,
      g_points INTEGER DEFAULT 0,
      is_super_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // OAuth绑定表
  db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_bindings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      open_id TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(platform, open_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 用户余额表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      balance INTEGER DEFAULT 0,
      g_points INTEGER DEFAULT 0,
      total_recharged INTEGER DEFAULT 0,
      total_consumed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 充值记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS recharge_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_no TEXT NOT NULL UNIQUE,
      amount INTEGER NOT NULL,
      recharge_type TEXT NOT NULL,
      pay_method TEXT NOT NULL,
      transaction_id TEXT,
      proof_images TEXT,
      status TEXT DEFAULT 'pending',
      bonus_amount INTEGER DEFAULT 0,
      total_amount INTEGER,
      submit_at TEXT,
      review_at TEXT,
      reviewer_id TEXT,
      reject_reason TEXT,
      admin_remark TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 管理员日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target TEXT,
      operator TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 支付订单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS pay_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      product_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      pay_method TEXT,
      transaction_id TEXT,
      paid_at TEXT,
      confirmed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 会话表（用于登录态管理）
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 游戏道具表
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      rarity TEXT DEFAULT 'common',
      price INTEGER DEFAULT 0,
      effects TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 用户背包表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES game_items(id)
    )
  `);

  // 卡牌表
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      faction TEXT,
      rarity TEXT DEFAULT 'common',
      attack INTEGER DEFAULT 0,
      defense INTEGER DEFAULT 0,
      skill TEXT,
      description TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 用户卡牌收藏表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      quantity INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id)
    )
  `);

  console.log('[SQLite] 数据库表结构初始化完成');
});

// 执行初始化
initTables();

// ==================== 数据库操作辅助函数 ====================

/**
 * 执行查询，返回所有结果
 */
export function queryAll<T = unknown>(sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * 执行查询，返回单条结果
 */
export function queryOne<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

/**
 * 执行插入/更新/删除操作
 */
export function execute(sql: string, params: unknown[] = []): Database.RunResult {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

/**
 * 执行事务
 */
export function transaction<T>(fn: () => T): T {
  return db.transaction(fn)();
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成订单号
 */
export function generateOrderNo(prefix: string = 'ORD'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// 导出数据库实例（用于高级操作）
export { db };

// 导出数据库路径
export const DB_FILE_PATH = DB_PATH;

// 默认导出
export default {
  queryAll,
  queryOne,
  execute,
  transaction,
  generateUUID,
  generateOrderNo,
  db,
};
