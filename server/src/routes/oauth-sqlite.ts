/**
 * OAuth 认证路由 - SQLite 版本
 * 完全独立，不依赖任何第三方服务
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  queryAll,
  queryOne,
  execute,
  transaction,
  generateUUID,
} from '../storage/database/sqlite-client.js';

const router = Router();

// ==================== 平台配置 ====================

const PLATFORMS: Record<string, { name: string; icon: string }> = {
  wechat: { name: '微信', icon: 'wechat' },
  alipay: { name: '支付宝', icon: 'alipay' },
  douyin: { name: '抖音', icon: 'tiktok' },
  qq: { name: 'QQ', icon: 'qq' },
  weibo: { name: '微博', icon: 'weibo' },
  github: { name: 'GitHub', icon: 'github' },
  google: { name: 'Google', icon: 'google' },
  apple: { name: 'Apple', icon: 'apple' },
};

// ==================== OAuth 回调处理 ====================

const callbackSchema = z.object({
  platform: z.string().min(1),
  code: z.string().min(1),
});

/**
 * OAuth 回调处理
 * POST /api/v1/oauth/callback
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const body = callbackSchema.parse(req.body);
    const { platform, code } = body;

    // 验证平台
    if (!PLATFORMS[platform]) {
      return res.status(400).json({ error: '不支持的平台' });
    }

    // 模拟OAuth流程 - 在实际应用中这里会调用第三方API
    // 由于是完全独立的系统，我们使用模拟的open_id
    const mockOpenId = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 检查是否已有绑定
    const existingBinding = queryOne<{ user_id: string; nickname: string }>(
      'SELECT user_id, nickname FROM oauth_bindings WHERE platform = ? AND open_id = ?',
      [platform, mockOpenId]
    );

    let userId: string;
    let isNewUser = false;

    if (existingBinding) {
      // 已绑定，直接登录
      userId = existingBinding.user_id;
    } else {
      // 新用户，创建账号
      isNewUser = true;
      userId = generateUUID();
      const nickname = `${PLATFORMS[platform].name}用户`;

      transaction(() => {
        // 创建用户
        execute(
          `INSERT INTO users (id, nickname, member_level, balance, g_points) VALUES (?, ?, 'free', 0, 0)`,
          [userId, nickname]
        );

        // 创建余额记录
        execute(
          `INSERT INTO user_balances (user_id, balance, g_points, total_recharged, total_consumed) VALUES (?, 0, 0, 0, 0)`,
          [userId]
        );

        // 创建OAuth绑定
        execute(
          `INSERT INTO oauth_bindings (id, user_id, platform, open_id, nickname) VALUES (?, ?, ?, ?, ?)`,
          [generateUUID(), userId, platform, mockOpenId, nickname]
        );
      });
    }

    // 获取用户信息
    const user = queryOne<{
      nickname: string | null;
      avatar: string | null;
      member_level: string;
      member_expire_at: string | null;
    }>(
      'SELECT nickname, avatar, member_level, member_expire_at FROM users WHERE id = ?',
      [userId]
    );

    // 创建会话token
    const sessionToken = generateUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7天有效期

    execute(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [generateUUID(), userId, sessionToken, expiresAt]
    );

    console.log(`[OAuth] 用户登录成功: ${userId} via ${platform}`);

    res.json({
      success: true,
      data: {
        userId,
        nickname: user?.nickname || '用户',
        avatar: user?.avatar,
        memberLevel: user?.member_level || 'free',
        memberExpireAt: user?.member_expire_at,
        isNewUser,
        sessionToken,
        expiresIn: 7 * 24 * 60 * 60,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '登录失败' });
  }
});

// ==================== 获取用户绑定列表 ====================

/**
 * 获取用户OAuth绑定列表
 * GET /api/v1/oauth/bindings/:userId
 */
router.get('/bindings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const bindings = queryAll<{
      id: string;
      platform: string;
      open_id: string;
      nickname: string | null;
      avatar: string | null;
    }>(
      'SELECT id, platform, open_id, nickname, avatar FROM oauth_bindings WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: bindings.map((b) => ({
        ...b,
        platformName: PLATFORMS[b.platform]?.name || b.platform,
      })),
    });
  } catch (error) {
    console.error('Get bindings error:', error);
    res.status(500).json({ error: '获取绑定列表失败' });
  }
});

// ==================== 绑定第三方账号 ====================

const bindSchema = z.object({
  userId: z.string().min(1),
  platform: z.string().min(1),
});

/**
 * 绑定第三方账号
 * POST /api/v1/oauth/bind
 */
router.post('/bind', async (req: Request, res: Response) => {
  try {
    const body = bindSchema.parse(req.body);
    const { userId, platform } = body;

    if (!PLATFORMS[platform]) {
      return res.status(400).json({ error: '不支持的平台' });
    }

    // 检查是否已绑定
    const existingBinding = queryOne<{ id: string }>(
      'SELECT id FROM oauth_bindings WHERE user_id = ? AND platform = ?',
      [userId, platform]
    );

    if (existingBinding) {
      return res.status(400).json({ error: '该平台已绑定' });
    }

    // 模拟绑定
    const mockOpenId = `${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const bindingId = generateUUID();

    execute(
      'INSERT INTO oauth_bindings (id, user_id, platform, open_id, nickname) VALUES (?, ?, ?, ?, ?)',
      [bindingId, userId, platform, mockOpenId, `${PLATFORMS[platform].name}用户`]
    );

    res.json({
      success: true,
      message: '绑定成功',
      data: { bindingId },
    });
  } catch (error) {
    console.error('Bind error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '绑定失败' });
  }
});

// ==================== 解绑第三方账号 ====================

const unbindSchema = z.object({
  userId: z.string().min(1),
  platform: z.string().min(1),
});

/**
 * 解绑第三方账号
 * POST /api/v1/oauth/unbind
 */
router.post('/unbind', async (req: Request, res: Response) => {
  try {
    const body = unbindSchema.parse(req.body);
    const { userId, platform } = body;

    // 检查绑定数量，至少保留一个登录方式
    const bindings = queryAll<{ platform: string }>(
      'SELECT platform FROM oauth_bindings WHERE user_id = ?',
      [userId]
    );

    if (bindings.length <= 1) {
      return res.status(400).json({ error: '至少需要保留一个登录方式' });
    }

    execute(
      'DELETE FROM oauth_bindings WHERE user_id = ? AND platform = ?',
      [userId, platform]
    );

    res.json({
      success: true,
      message: '解绑成功',
    });
  } catch (error) {
    console.error('Unbind error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '解绑失败' });
  }
});

// ==================== 验证会话 ====================

/**
 * 验证会话token
 * POST /api/v1/oauth/verify
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: '缺少token' });
    }

    const session = queryOne<{
      user_id: string;
      expires_at: string;
    }>(
      'SELECT user_id, expires_at FROM sessions WHERE token = ?',
      [token]
    );

    if (!session) {
      return res.status(401).json({ error: '无效的token' });
    }

    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: 'token已过期' });
    }

    const user = queryOne<{
      id: string;
      nickname: string | null;
      avatar: string | null;
      member_level: string;
      member_expire_at: string | null;
    }>(
      'SELECT id, nickname, avatar, member_level, member_expire_at FROM users WHERE id = ?',
      [session.user_id]
    );

    res.json({
      success: true,
      data: {
        userId: user?.id,
        nickname: user?.nickname,
        avatar: user?.avatar,
        memberLevel: user?.member_level,
        memberExpireAt: user?.member_expire_at,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

// ==================== 登出 ====================

/**
 * 登出
 * POST /api/v1/oauth/logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (token) {
      execute('DELETE FROM sessions WHERE token = ?', [token]);
    }

    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: '登出失败' });
  }
});

export default router;
