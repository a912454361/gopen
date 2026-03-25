/**
 * 用户认证API
 * 支持注册、登录、忘记密码、修改密码、验证码发送
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import crypto from 'crypto';

const router = Router();
const client = getSupabaseClient();

// ==================== 工具函数 ====================

/**
 * 生成随机验证码
 */
const generateCode = (length: number = 6): string => {
  return Math.random().toString().slice(2, 2 + length);
};

/**
 * 密码哈希
 */
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password + 'gopen_salt_2024').digest('hex');
};

/**
 * 生成会话Token
 */
const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * 验证手机号格式
 */
const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 验证邮箱格式
 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ==================== 发送验证码 ====================

const sendCodeSchema = z.object({
  target: z.string(),  // 手机号或邮箱
  type: z.enum(['register', 'reset_password', 'change_password', 'login']),
});

/**
 * 发送验证码
 * POST /api/v1/auth/send-code
 * Body: { target: string, type: 'register' | 'reset_password' | 'change_password' | 'login' }
 */
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { target, type } = sendCodeSchema.parse(req.body);

    // 验证格式
    const isPhone = isValidPhone(target);
    const isEmail = isValidEmail(target);

    if (!isPhone && !isEmail) {
      return res.status(400).json({ error: '请输入正确的手机号或邮箱' });
    }

    // 检查发送频率（60秒内只能发一次）
    const { data: recentCodes } = await client
      .from('verification_codes')
      .select('*')
      .eq('target', target)
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentCodes && recentCodes.length > 0) {
      const waitTime = Math.ceil((60000 - (Date.now() - new Date(recentCodes[0].created_at).getTime())) / 1000);
      return res.status(429).json({ 
        error: `请等待 ${waitTime} 秒后再试`,
        waitTime 
      });
    }

    // 根据类型检查
    if (type === 'register') {
      // 注册时检查是否已存在
      const field = isPhone ? 'phone' : 'email';
      const { data: existingUser } = await client
        .from('users')
        .select('id')
        .eq(field, target)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: `该${isPhone ? '手机号' : '邮箱'}已注册` });
      }
    } else if (type === 'reset_password' || type === 'change_password') {
      // 重置密码时检查是否存在
      const field = isPhone ? 'phone' : 'email';
      const { data: existingUser } = await client
        .from('users')
        .select('id')
        .eq(field, target)
        .single();

      if (!existingUser) {
        return res.status(400).json({ error: `该${isPhone ? '手机号' : '邮箱'}未注册` });
      }
    }

    // 生成验证码
    const code = generateCode(6);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效

    // 保存验证码
    const { error: insertError } = await client
      .from('verification_codes')
      .insert([{
        target,
        code,
        type,
        expires_at: expiresAt.toISOString(),
        used: false,
      }]);

    if (insertError) {
      console.error('Insert code error:', insertError);
      return res.status(500).json({ error: '验证码发送失败' });
    }

    // 模拟发送（实际应调用短信/邮件服务）
    console.log(`[SMS/Email] 验证码已发送到 ${target}: ${code} (类型: ${type})`);

    // 开发环境返回验证码（生产环境应删除）
    const isDev = process.env.NODE_ENV === 'development';

    res.json({
      success: true,
      message: `验证码已发送到您的${isPhone ? '手机' : '邮箱'}`,
      ...(isDev && { code }), // 开发环境返回验证码
    });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '发送失败' });
  }
});

// ==================== 用户注册 ====================

const registerSchema = z.object({
  account: z.string(),  // 手机号或邮箱
  password: z.string().min(6, '密码至少6位'),
  code: z.string().length(6, '验证码为6位'),
  nickname: z.string().min(2, '昵称至少2个字符').max(20, '昵称最多20个字符').optional(),
});

/**
 * 用户注册
 * POST /api/v1/auth/register
 * Body: { account: string, password: string, code: string, nickname?: string }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { account, password, code, nickname } = registerSchema.parse(req.body);

    const isPhone = isValidPhone(account);
    const isEmail = isValidEmail(account);

    if (!isPhone && !isEmail) {
      return res.status(400).json({ error: '请输入正确的手机号或邮箱' });
    }

    // 验证验证码
    const { data: codeRecord } = await client
      .from('verification_codes')
      .select('*')
      .eq('target', account)
      .eq('code', code)
      .eq('type', 'register')
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!codeRecord) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 标记验证码已使用
    await client
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codeRecord.id);

    // 检查账号是否已存在
    const field = isPhone ? 'phone' : 'email';
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq(field, account)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: '该账号已注册' });
    }

    // 创建用户
    const passwordHash = hashPassword(password);
    const { data: newUser, error: createError } = await client
      .from('users')
      .insert([{
        [field]: account,
        password_hash: passwordHash,
        nickname: nickname || `用户${Date.now().toString().slice(-6)}`,
        member_level: 'free',
        [`${field}_verified`]: true,
      }])
      .select()
      .single();

    if (createError || !newUser) {
      console.error('Create user error:', createError);
      return res.status(500).json({ error: '注册失败' });
    }

    // 初始化支付限额
    await client
      .from('pay_limits')
      .insert([{ user_id: newUser.id }]);

    // 生成会话Token
    const token = generateToken();

    console.log(`[Auth] 新用户注册成功: ${account}`);

    res.json({
      success: true,
      message: '注册成功',
      data: {
        userId: newUser.id,
        nickname: newUser.nickname,
        phone: newUser.phone,
        email: newUser.email,
        memberLevel: newUser.member_level,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '注册失败' });
  }
});

// ==================== 用户登录 ====================

const loginSchema = z.object({
  account: z.string(),   // 手机号、邮箱或用户ID
  password: z.string().optional(),
  code: z.string().optional(),  // 快捷登录验证码
  loginType: z.enum(['password', 'code']).default('password'),
});

/**
 * 用户登录
 * POST /api/v1/auth/login
 * Body: { account: string, password?: string, code?: string, loginType: 'password' | 'code' }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { account, password, code, loginType } = loginSchema.parse(req.body);

    // 查找用户（支持手机号、邮箱、用户ID）
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .or(`phone.eq.${account},email.eq.${account},id.eq.${account}`)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: '账号不存在' });
    }

    if (loginType === 'password') {
      // 密码登录
      if (!password) {
        return res.status(400).json({ error: '请输入密码' });
      }

      // 检查是否设置过密码
      if (!user.password_hash) {
        return res.status(400).json({ error: '该账号未设置密码，请使用快捷登录或第三方登录' });
      }

      const passwordHash = hashPassword(password);
      if (passwordHash !== user.password_hash) {
        return res.status(401).json({ error: '密码错误' });
      }
    } else {
      // 验证码快捷登录
      if (!code) {
        return res.status(400).json({ error: '请输入验证码' });
      }

      // 验证验证码
      const target = user.phone || user.email;
      if (!target) {
        return res.status(400).json({ error: '账号未绑定手机或邮箱' });
      }

      const { data: codeRecord } = await client
        .from('verification_codes')
        .select('*')
        .eq('target', target)
        .eq('code', code)
        .eq('type', 'login')
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!codeRecord) {
        return res.status(400).json({ error: '验证码错误或已过期' });
      }

      // 标记验证码已使用
      await client
        .from('verification_codes')
        .update({ used: true })
        .eq('id', codeRecord.id);
    }

    // 生成会话Token
    const token = generateToken();

    console.log(`[Auth] 用户登录成功: ${account}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        userId: user.id,
        nickname: user.nickname,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        memberLevel: user.member_level,
        memberExpireAt: user.member_expire_at,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '登录失败' });
  }
});

// ==================== 忘记密码 ====================

const forgotPasswordSchema = z.object({
  account: z.string(),   // 手机号或邮箱
  code: z.string().length(6, '验证码为6位'),
  newPassword: z.string().min(6, '密码至少6位'),
});

/**
 * 忘记密码（重置密码）
 * POST /api/v1/auth/forgot-password
 * Body: { account: string, code: string, newPassword: string }
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { account, code, newPassword } = forgotPasswordSchema.parse(req.body);

    const isPhone = isValidPhone(account);
    const isEmail = isValidEmail(account);

    if (!isPhone && !isEmail) {
      return res.status(400).json({ error: '请输入正确的手机号或邮箱' });
    }

    // 验证验证码
    const { data: codeRecord } = await client
      .from('verification_codes')
      .select('*')
      .eq('target', account)
      .eq('code', code)
      .eq('type', 'reset_password')
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!codeRecord) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // 标记验证码已使用
    await client
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codeRecord.id);

    // 查找用户
    const field = isPhone ? 'phone' : 'email';
    const { data: user, error } = await client
      .from('users')
      .select('id')
      .eq(field, account)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 更新密码
    const passwordHash = hashPassword(newPassword);
    const { error: updateError } = await client
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update password error:', updateError);
      return res.status(500).json({ error: '密码重置失败' });
    }

    console.log(`[Auth] 密码重置成功: ${account}`);

    res.json({
      success: true,
      message: '密码重置成功，请使用新密码登录',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '重置失败' });
  }
});

// ==================== 修改密码 ====================

const changePasswordSchema = z.object({
  userId: z.string(),
  oldPassword: z.string().optional(),      // 旧密码（已登录用户）
  code: z.string().optional(),              // 验证码（未登录用户）
  newPassword: z.string().min(6, '密码至少6位'),
  changeType: z.enum(['password', 'code']).default('password'),
});

/**
 * 修改密码
 * POST /api/v1/auth/change-password
 * Body: { userId: string, oldPassword?: string, code?: string, newPassword: string, changeType: 'password' | 'code' }
 */
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { userId, oldPassword, code, newPassword, changeType } = changePasswordSchema.parse(req.body);

    // 查找用户
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (changeType === 'password') {
      // 用旧密码验证
      if (!oldPassword) {
        return res.status(400).json({ error: '请输入原密码' });
      }

      if (!user.password_hash) {
        return res.status(400).json({ error: '该账号未设置密码，请使用验证码方式修改' });
      }

      const oldHash = hashPassword(oldPassword);
      if (oldHash !== user.password_hash) {
        return res.status(401).json({ error: '原密码错误' });
      }
    } else {
      // 用验证码验证
      if (!code) {
        return res.status(400).json({ error: '请输入验证码' });
      }

      const target = user.phone || user.email;
      if (!target) {
        return res.status(400).json({ error: '账号未绑定手机或邮箱' });
      }

      const { data: codeRecord } = await client
        .from('verification_codes')
        .select('*')
        .eq('target', target)
        .eq('code', code)
        .eq('type', 'change_password')
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!codeRecord) {
        return res.status(400).json({ error: '验证码错误或已过期' });
      }

      // 标记验证码已使用
      await client
        .from('verification_codes')
        .update({ used: true })
        .eq('id', codeRecord.id);
    }

    // 更新密码
    const passwordHash = hashPassword(newPassword);
    const { error: updateError } = await client
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Update password error:', updateError);
      return res.status(500).json({ error: '密码修改失败' });
    }

    console.log(`[Auth] 密码修改成功: userId=${userId}`);

    res.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '修改失败' });
  }
});

// ==================== 检查账号是否存在 ====================

const checkAccountSchema = z.object({
  account: z.string(),
});

/**
 * 检查账号是否存在
 * GET /api/v1/auth/check-account?account=xxx
 */
router.get('/check-account', async (req: Request, res: Response) => {
  try {
    const { account } = checkAccountSchema.parse(req.query);

    const isPhone = isValidPhone(account);
    const isEmail = isValidEmail(account);

    if (!isPhone && !isEmail) {
      return res.json({ exists: false });
    }

    const field = isPhone ? 'phone' : 'email';
    const { data } = await client
      .from('users')
      .select('id')
      .eq(field, account)
      .single();

    res.json({
      exists: !!data,
    });
  } catch {
    res.json({ exists: false });
  }
});

// ==================== 获取用户登录方式 ====================

/**
 * 获取用户支持的登录方式
 * GET /api/v1/auth/login-methods?account=xxx
 */
router.get('/login-methods', async (req: Request, res: Response) => {
  try {
    const { account } = req.query;

    if (!account || typeof account !== 'string') {
      return res.status(400).json({ error: '请输入账号' });
    }

    const { data: user } = await client
      .from('users')
      .select('id, phone, email, password_hash, phone_verified, email_verified')
      .or(`phone.eq.${account},email.eq.${account},id.eq.${account}`)
      .single();

    if (!user) {
      return res.json({
        exists: false,
        methods: [],
      });
    }

    const methods: string[] = [];

    // 密码登录
    if (user.password_hash) {
      methods.push('password');
    }

    // 快捷登录（手机验证码）
    if (user.phone && user.phone_verified) {
      methods.push('phone_code');
    }

    // 快捷登录（邮箱验证码）
    if (user.email && user.email_verified) {
      methods.push('email_code');
    }

    // 第三方登录绑定
    const { data: bindings } = await client
      .from('oauth_bindings')
      .select('platform')
      .eq('user_id', user.id);

    if (bindings) {
      bindings.forEach(b => methods.push(`oauth_${b.platform}`));
    }

    res.json({
      exists: true,
      userId: user.id,
      phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null,
      email: user.email ? user.email.replace(/(.{2}).*(@.*)/, '$1****$2') : null,
      methods,
    });
  } catch {
    res.json({ exists: false, methods: [] });
  }
});

export default router;
