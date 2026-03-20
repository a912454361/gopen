import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import crypto from 'crypto';

const router = Router();
const client = getSupabaseClient();

// ==================== OAuth 登录配置 ====================

const OAUTH_CONFIG = {
  alipay: {
    authUrl: 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm',
    tokenUrl: 'https://openapi.alipay.com/gateway.do',
    appId: process.env.ALIPAY_APP_ID || 'YOUR_ALIPAY_APP_ID',
    scope: 'auth_user',
  },
  wechat: {
    authUrl: 'https://open.weixin.qq.com/connect/qrconnect',
    tokenUrl: 'https://api.weixin.qq.com/sns/oauth2/access_token',
    appId: process.env.WECHAT_APP_ID || 'YOUR_WECHAT_APPID',
    scope: 'snsapi_login',
  },
  douyin: {
    authUrl: 'https://open.douyin.com/platform/oauth/connect/',
    tokenUrl: 'https://open.douyin.com/oauth/access_token/',
    appId: process.env.DOUYIN_APP_ID || 'YOUR_DOUYIN_APPID',
    scope: 'user_info',
  },
};

// ==================== 生成授权URL ====================

const generateAuthUrlSchema = z.object({
  platform: z.enum(['alipay', 'wechat', 'douyin']),
  redirectUri: z.string().url(),
  state: z.string().optional(),
});

/**
 * 生成OAuth授权URL
 * POST /api/v1/oauth/auth-url
 * Body: { platform, redirectUri, state? }
 */
router.post('/auth-url', async (req: Request, res: Response) => {
  try {
    const body = generateAuthUrlSchema.parse(req.body);
    const config = OAUTH_CONFIG[body.platform];
    
    // 生成state参数（用于防CSRF攻击）
    const state = body.state || crypto.randomBytes(16).toString('hex');
    
    let authUrl = '';
    
    switch (body.platform) {
      case 'alipay':
        authUrl = `${config.authUrl}?app_id=${config.appId}&scope=${config.scope}&redirect_uri=${encodeURIComponent(body.redirectUri)}&state=${state}`;
        break;
      case 'wechat':
        authUrl = `${config.authUrl}?appid=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${config.scope}&state=${state}#wechat_redirect`;
        break;
      case 'douyin':
        authUrl = `${config.authUrl}?app_id=${config.appId}&scope=${config.scope}&redirect_uri=${encodeURIComponent(body.redirectUri)}&state=${state}`;
        break;
    }
    
    res.json({
      success: true,
      data: {
        authUrl,
        state,
        expiresIn: 300, // 5分钟有效期
      },
    });
  } catch (error) {
    console.error('Generate auth URL error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== OAuth 回调处理 ====================

const callbackSchema = z.object({
  platform: z.enum(['alipay', 'wechat', 'douyin']),
  code: z.string(),
  state: z.string().optional(),
});

/**
 * OAuth回调处理
 * POST /api/v1/oauth/callback
 * Body: { platform, code, state? }
 */
router.post('/callback', async (req: Request, res: Response) => {
  try {
    const body = callbackSchema.parse(req.body);
    
    // 模拟获取access_token（实际应调用各平台API）
    const mockOpenId = `${body.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const mockAccessToken = `access_${crypto.randomBytes(32).toString('hex')}`;
    const mockRefreshToken = `refresh_${crypto.randomBytes(32).toString('hex')}`;
    const expiresIn = 7200; // 2小时
    
    // 检查是否已有绑定
    const { data: existingBinding } = await client
      .from('oauth_bindings')
      .select('*, users(*)')
      .eq('platform', body.platform)
      .eq('open_id', mockOpenId)
      .single();
    
    let user;
    let isNewUser = false;
    
    if (existingBinding && existingBinding.users) {
      // 已绑定，更新token
      user = Array.isArray(existingBinding.users) ? existingBinding.users[0] : existingBinding.users;
      
      await client
        .from('oauth_bindings')
        .update({
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
          expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBinding.id);
    } else {
      // 新用户，创建用户和绑定
      isNewUser = true;
      
      const { data: newUser, error: userError } = await client
        .from('users')
        .insert([{
          nickname: `${body.platform}用户`,
          member_level: 'free',
        }])
        .select()
        .single();
      
      if (userError || !newUser) {
        return res.status(500).json({ error: 'Failed to create user' });
      }
      
      user = newUser;
      
      // 创建OAuth绑定
      await client
        .from('oauth_bindings')
        .insert([{
          user_id: user.id,
          platform: body.platform,
          open_id: mockOpenId,
          access_token: mockAccessToken,
          refresh_token: mockRefreshToken,
          expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        }]);
      
      // 初始化支付限额
      await client
        .from('pay_limits')
        .insert([{
          user_id: user.id,
        }]);
      
      // 推广转化追踪
      if (body.referrerCode) {
        try {
          // 验证推广码
          const { data: promoter } = await client
            .from('promoters')
            .select('id, status')
            .eq('promoter_code', body.referrerCode)
            .single();
          
          if (promoter && promoter.status === 'active') {
            // 创建转化记录
            await client
              .from('promotion_conversions')
              .insert([{
                promoter_id: promoter.id,
                converted_user_id: user.id,
              }]);
            
            console.log(`[Promotion] User ${user.id} converted by promoter ${promoter.id}`);
          }
        } catch (error) {
          console.error('Promotion conversion error:', error);
        }
      }
    }
    
    // 生成本地会话token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      data: {
        userId: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        memberLevel: user.member_level,
        memberExpireAt: user.member_expire_at,
        isNewUser,
        sessionToken,
        expiresIn,
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 绑定第三方账号 ====================

const bindAccountSchema = z.object({
  userId: z.string(),
  platform: z.enum(['alipay', 'wechat', 'douyin']),
  code: z.string(),
});

/**
 * 绑定第三方账号
 * POST /api/v1/oauth/bind
 * Body: { userId, platform, code }
 */
router.post('/bind', async (req: Request, res: Response) => {
  try {
    const body = bindAccountSchema.parse(req.body);
    
    // 检查用户是否存在
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', body.userId)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 模拟获取平台信息
    const mockOpenId = `${body.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // 检查是否已绑定其他账号
    const { data: existingBinding } = await client
      .from('oauth_bindings')
      .select('*')
      .eq('platform', body.platform)
      .eq('open_id', mockOpenId)
      .single();
    
    if (existingBinding && existingBinding.user_id !== body.userId) {
      return res.status(400).json({ error: 'This account is already bound to another user' });
    }
    
    // 检查当前用户是否已绑定该平台
    const { data: userBinding } = await client
      .from('oauth_bindings')
      .select('*')
      .eq('user_id', body.userId)
      .eq('platform', body.platform)
      .single();
    
    if (userBinding) {
      return res.status(400).json({ error: 'Already bound to this platform' });
    }
    
    // 创建绑定
    const { error: bindError } = await client
      .from('oauth_bindings')
      .insert([{
        user_id: body.userId,
        platform: body.platform,
        open_id: mockOpenId,
        access_token: `access_${crypto.randomBytes(32).toString('hex')}`,
        refresh_token: `refresh_${crypto.randomBytes(32).toString('hex')}`,
        expires_at: new Date(Date.now() + 7200 * 1000).toISOString(),
      }]);
    
    if (bindError) {
      return res.status(500).json({ error: 'Failed to bind account' });
    }
    
    res.json({
      success: true,
      message: 'Account bound successfully',
      data: {
        platform: body.platform,
        boundAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Bind account error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 解绑第三方账号 ====================

const unbindAccountSchema = z.object({
  userId: z.string(),
  platform: z.enum(['alipay', 'wechat', 'douyin']),
});

/**
 * 解绑第三方账号
 * POST /api/v1/oauth/unbind
 * Body: { userId, platform }
 */
router.post('/unbind', async (req: Request, res: Response) => {
  try {
    const body = unbindAccountSchema.parse(req.body);
    
    // 检查绑定数量，至少保留一种登录方式
    const { data: bindings } = await client
      .from('oauth_bindings')
      .select('*')
      .eq('user_id', body.userId);
    
    if (!bindings || bindings.length <= 1) {
      return res.status(400).json({ error: 'Cannot unbind the last login method' });
    }
    
    // 删除绑定
    const { error } = await client
      .from('oauth_bindings')
      .delete()
      .eq('user_id', body.userId)
      .eq('platform', body.platform);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to unbind account' });
    }
    
    res.json({
      success: true,
      message: 'Account unbound successfully',
    });
  } catch (error) {
    console.error('Unbind account error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 获取用户绑定列表 ====================

/**
 * 获取用户绑定列表
 * GET /api/v1/oauth/bindings/:userId
 */
router.get('/bindings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: bindings, error } = await client
      .from('oauth_bindings')
      .select('id, platform, open_id, nickname, avatar, created_at')
      .eq('user_id', userId);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get bindings' });
    }
    
    res.json({
      success: true,
      data: bindings || [],
    });
  } catch (error) {
    console.error('Get bindings error:', error);
    res.status(500).json({ error: 'Failed to get bindings' });
  }
});

// ==================== 刷新Token ====================

const refreshTokenSchema = z.object({
  userId: z.string(),
  platform: z.enum(['alipay', 'wechat', 'douyin']),
});

/**
 * 刷新OAuth Token
 * POST /api/v1/oauth/refresh
 * Body: { userId, platform }
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const body = refreshTokenSchema.parse(req.body);
    
    const { data: binding, error } = await client
      .from('oauth_bindings')
      .select('*')
      .eq('user_id', body.userId)
      .eq('platform', body.platform)
      .single();
    
    if (error || !binding) {
      return res.status(404).json({ error: 'Binding not found' });
    }
    
    // 模拟刷新token（实际应调用各平台API）
    const newAccessToken = `access_${crypto.randomBytes(32).toString('hex')}`;
    const expiresIn = 7200;
    
    await client
      .from('oauth_bindings')
      .update({
        access_token: newAccessToken,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', binding.id);
    
    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

export default router;
