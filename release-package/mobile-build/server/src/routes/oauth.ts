import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import crypto from 'crypto';

const router = Router();
const client = getSupabaseClient();

// ==================== OAuth 登录配置 ====================

const OAUTH_CONFIG = {
  // 国内平台
  alipay: {
    authUrl: 'https://openauth.alipay.com/oauth2/publicAppAuthorize.htm',
    tokenUrl: 'https://openapi.alipay.com/gateway.do',
    appId: process.env.ALIPAY_APP_ID || 'YOUR_ALIPAY_APP_ID',
    scope: 'auth_user',
    icon: 'alipay',
    color: '#1677FF',
    name: '支付宝',
  },
  wechat: {
    authUrl: 'https://open.weixin.qq.com/connect/qrconnect',
    tokenUrl: 'https://api.weixin.qq.com/sns/oauth2/access_token',
    appId: process.env.WECHAT_APP_ID || 'YOUR_WECHAT_APPID',
    scope: 'snsapi_login',
    icon: 'wechat',
    color: '#07C160',
    name: '微信',
  },
  douyin: {
    authUrl: 'https://open.douyin.com/platform/oauth/connect/',
    tokenUrl: 'https://open.douyin.com/oauth/access_token/',
    appId: process.env.DOUYIN_APP_ID || 'YOUR_DOUYIN_APPID',
    scope: 'user_info',
    icon: 'tiktok',
    color: '#000000',
    name: '抖音',
  },
  qq: {
    authUrl: 'https://graph.qq.com/oauth2.0/authorize',
    tokenUrl: 'https://graph.qq.com/oauth2.0/token',
    appId: process.env.QQ_APP_ID || 'YOUR_QQ_APPID',
    scope: 'get_user_info',
    icon: 'qq',
    color: '#12B7F5',
    name: 'QQ',
  },
  weibo: {
    authUrl: 'https://api.weibo.com/oauth2/authorize',
    tokenUrl: 'https://api.weibo.com/oauth2/access_token',
    appId: process.env.WEIBO_APP_KEY || 'YOUR_WEIBO_APPKEY',
    scope: 'all',
    icon: 'weibo',
    color: '#E6162D',
    name: '微博',
  },
  // 国际平台
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    appId: process.env.GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',
    scope: 'read:user user:email',
    icon: 'github',
    color: '#24292F',
    name: 'GitHub',
  },
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    appId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    scope: 'openid email profile',
    icon: 'google',
    color: '#4285F4',
    name: 'Google',
  },
  apple: {
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    appId: process.env.APPLE_CLIENT_ID || 'YOUR_APPLE_CLIENT_ID',
    scope: 'email name',
    icon: 'apple',
    color: '#000000',
    name: 'Apple',
  },
  microsoft: {
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    appId: process.env.MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID',
    scope: 'openid email profile',
    icon: 'microsoft',
    color: '#00A4EF',
    name: 'Microsoft',
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    appId: process.env.TWITTER_CLIENT_ID || 'YOUR_TWITTER_CLIENT_ID',
    scope: 'tweet.read users.read',
    icon: 'x-twitter',
    color: '#000000',
    name: 'Twitter/X',
  },
  discord: {
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    appId: process.env.DISCORD_CLIENT_ID || 'YOUR_DISCORD_CLIENT_ID',
    scope: 'identify email',
    icon: 'discord',
    color: '#5865F2',
    name: 'Discord',
  },
  telegram: {
    authUrl: 'https://oauth.telegram.org/auth',
    tokenUrl: 'https://api.telegram.org',
    appId: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN',
    scope: 'login',
    icon: 'telegram',
    color: '#26A5E4',
    name: 'Telegram',
  },
};

// 支持的平台列表
const SUPPORTED_PLATFORMS = Object.keys(OAUTH_CONFIG) as (keyof typeof OAUTH_CONFIG)[];

// ==================== 生成授权URL ====================

const generateAuthUrlSchema = z.object({
  platform: z.enum(SUPPORTED_PLATFORMS as [string, ...string[]]),
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
    const platform = body.platform as keyof typeof OAUTH_CONFIG;
    const config = OAUTH_CONFIG[platform];
    
    // 生成state参数（用于防CSRF攻击）
    const state = body.state || crypto.randomBytes(16).toString('hex');
    
    let authUrl = '';
    
    switch (platform) {
      // 国内平台
      case 'alipay':
        authUrl = `${config.authUrl}?app_id=${config.appId}&scope=${config.scope}&redirect_uri=${encodeURIComponent(body.redirectUri)}&state=${state}`;
        break;
      case 'wechat':
        authUrl = `${config.authUrl}?appid=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${config.scope}&state=${state}#wechat_redirect`;
        break;
      case 'douyin':
        authUrl = `${config.authUrl}?app_id=${config.appId}&scope=${config.scope}&redirect_uri=${encodeURIComponent(body.redirectUri)}&state=${state}`;
        break;
      case 'qq':
        authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${config.scope}&state=${state}`;
        break;
      case 'weibo':
        authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${config.scope}&state=${state}`;
        break;
      // 国际平台
      case 'github':
        authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&scope=${encodeURIComponent(config.scope)}&state=${state}`;
        break;
      case 'google':
        authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${state}`;
        break;
      case 'apple':
        authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${state}`;
        break;
      case 'microsoft':
        authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${state}`;
        break;
      case 'twitter':
        authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${state}&code_challenge=plain&code_challenge_method=plain`;
        break;
      case 'discord':
        authUrl = `${config.authUrl}?client_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&response_type=code&scope=${encodeURIComponent(config.scope)}&state=${state}`;
        break;
      case 'telegram':
        authUrl = `${config.authUrl}?bot_id=${config.appId}&redirect_uri=${encodeURIComponent(body.redirectUri)}&state=${state}`;
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
  platform: z.enum(SUPPORTED_PLATFORMS as [string, ...string[]]),
  code: z.string(),
  state: z.string().optional(),
  referrerCode: z.string().optional(), // 推广码，用于推广追踪
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
  platform: z.enum(SUPPORTED_PLATFORMS as [string, ...string[]]),
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
  platform: z.enum(SUPPORTED_PLATFORMS as [string, ...string[]]),
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
  platform: z.enum(SUPPORTED_PLATFORMS as [string, ...string[]]),
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

// ==================== 获取支持的平台列表 ====================

/**
 * 获取所有支持的OAuth登录平台
 * GET /api/v1/oauth/platforms
 */
router.get('/platforms', async (req: Request, res: Response) => {
  try {
    const platforms = Object.entries(OAUTH_CONFIG).map(([key, config]) => ({
      id: key,
      name: config.name,
      icon: config.icon,
      color: config.color,
    }));

    // 分类返回
    const domesticPlatforms = platforms.filter(p => 
      ['alipay', 'wechat', 'douyin', 'qq', 'weibo'].includes(p.id)
    );
    
    const internationalPlatforms = platforms.filter(p => 
      ['github', 'google', 'apple', 'microsoft', 'twitter', 'discord', 'telegram'].includes(p.id)
    );

    res.json({
      success: true,
      data: {
        all: platforms,
        domestic: domesticPlatforms,
        international: internationalPlatforms,
      },
    });
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({ error: 'Failed to get platforms' });
  }
});

export default router;
