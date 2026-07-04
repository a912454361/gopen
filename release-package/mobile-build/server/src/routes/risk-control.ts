import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 风控配置 ====================

const RISK_CONFIG = {
  // 单笔限额（分）
  singleLimit: {
    free: 10000,    // 免费用户：100元
    member: 50000,  // 普通会员：500元
    super: 100000,  // 超级会员：1000元
  },
  // 每日限额（分）
  dailyLimit: {
    free: 50000,    // 免费用户：500元
    member: 200000, // 普通会员：2000元
    super: 500000,  // 超级会员：5000元
  },
  // 每月限额（分）
  monthlyLimit: {
    free: 200000,   // 免费用户：2000元
    member: 1000000, // 普通会员：10000元
    super: 5000000, // 超级会员：50000元
  },
  // 未成年人限额（分）
  minorLimit: {
    daily: 1000,    // 每日10元
    monthly: 5000,  // 每月50元
    single: 500,    // 单笔5元
  },
};

// ==================== 获取用户支付限额 ====================

/**
 * 获取用户支付限额配置
 * GET /api/v1/risk/limits/:userId
 */
router.get('/limits/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 获取用户信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 获取或创建支付限额配置
    let { data: limits, error: limitsError } = await client
      .from('pay_limits')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!limits) {
      // 创建默认配置
      const memberLevel = user.member_level || 'free';
      const { data: newLimits, error: createError } = await client
        .from('pay_limits')
        .insert([{
          user_id: userId,
          daily_limit: RISK_CONFIG.dailyLimit[memberLevel as keyof typeof RISK_CONFIG.dailyLimit] || RISK_CONFIG.dailyLimit.free,
          monthly_limit: RISK_CONFIG.monthlyLimit[memberLevel as keyof typeof RISK_CONFIG.monthlyLimit] || RISK_CONFIG.monthlyLimit.free,
          single_limit: RISK_CONFIG.singleLimit[memberLevel as keyof typeof RISK_CONFIG.singleLimit] || RISK_CONFIG.singleLimit.free,
        }])
        .select()
        .single();
      
      if (createError) {
        return res.status(500).json({ error: 'Failed to create limits' });
      }
      
      limits = newLimits;
    }
    
    // 重置每日/每月限额
    limits = await resetLimitsIfNeeded(limits);
    
    res.json({
      success: true,
      data: {
        singleLimit: limits.single_limit,
        dailyLimit: limits.daily_limit,
        monthlyLimit: limits.monthly_limit,
        dailyUsed: limits.daily_used,
        monthlyUsed: limits.monthly_used,
        dailyRemaining: Math.max(0, limits.daily_limit - limits.daily_used),
        monthlyRemaining: Math.max(0, limits.monthly_limit - limits.monthly_used),
        isMinor: limits.is_minor,
        minorDailyLimit: limits.minor_daily_limit,
      },
    });
  } catch (error) {
    console.error('Get limits error:', error);
    res.status(500).json({ error: 'Failed to get limits' });
  }
});

// ==================== 风控检查 ====================

const riskCheckSchema = z.object({
  userId: z.string(),
  amount: z.number().int().positive(),
  orderNo: z.string().optional(),
});

/**
 * 支付前风控检查
 * POST /api/v1/risk/check
 * Body: { userId, amount, orderNo? }
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const body = riskCheckSchema.parse(req.body);
    
    // 获取用户信息
    const { data: user, error: userError } = await client
      .from('users')
      .select('*')
      .eq('id', body.userId)
      .single();
    
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 获取限额配置
    const { data: limits, error: limitsError } = await client
      .from('pay_limits')
      .select('*')
      .eq('user_id', body.userId)
      .single();
    
    if (!limits) {
      return res.status(500).json({ error: 'Limits not configured' });
    }
    
    // 重置并获取最新限额
    const latestLimits = await resetLimitsIfNeeded(limits);
    
    const riskResult = {
      passed: true,
      risks: [] as string[],
      warnings: [] as string[],
    };
    
    // 1. 未成年人检查
    if (latestLimits.is_minor) {
      if (body.amount > latestLimits.minor_daily_limit) {
        riskResult.passed = false;
        riskResult.risks.push('未成年人单笔支付超过限额');
      }
    }
    
    // 2. 单笔限额检查
    const singleLimit = latestLimits.is_minor 
      ? latestLimits.minor_daily_limit 
      : latestLimits.single_limit;
    
    if (body.amount > singleLimit) {
      riskResult.passed = false;
      riskResult.risks.push(`单笔支付超过限额 ¥${(singleLimit / 100).toFixed(2)}`);
    }
    
    // 3. 每日限额检查
    const dailyLimit = latestLimits.is_minor 
      ? latestLimits.minor_daily_limit 
      : latestLimits.daily_limit;
    
    if (latestLimits.daily_used + body.amount > dailyLimit) {
      riskResult.passed = false;
      riskResult.risks.push(`超过每日支付限额 ¥${(dailyLimit / 100).toFixed(2)}`);
    }
    
    // 4. 每月限额检查
    const monthlyLimit = latestLimits.is_minor 
      ? RISK_CONFIG.minorLimit.monthly 
      : latestLimits.monthly_limit;
    
    if (latestLimits.monthly_used + body.amount > monthlyLimit) {
      riskResult.passed = false;
      riskResult.risks.push(`超过每月支付限额 ¥${(monthlyLimit / 100).toFixed(2)}`);
    }
    
    // 5. 高额支付警告
    if (body.amount > 50000) { // 超过500元
      riskResult.warnings.push('单笔金额较大，请确认支付');
    }
    
    // 记录风控日志
    await client.from('risk_logs').insert([{
      user_id: body.userId,
      order_no: body.orderNo,
      risk_type: riskResult.passed ? 'check_passed' : 'limit_exceeded',
      risk_level: riskResult.passed ? 'low' : 'high',
      action: riskResult.passed ? 'pass' : 'block',
      detail: {
        amount: body.amount,
        risks: riskResult.risks,
        warnings: riskResult.warnings,
        limits: {
          daily_used: latestLimits.daily_used,
          monthly_used: latestLimits.monthly_used,
        },
      },
    }]);
    
    res.json({
      success: true,
      data: {
        passed: riskResult.passed,
        risks: riskResult.risks,
        warnings: riskResult.warnings,
        limits: {
          dailyUsed: latestLimits.daily_used,
          monthlyUsed: latestLimits.monthly_used,
          dailyRemaining: Math.max(0, dailyLimit - latestLimits.daily_used),
          monthlyRemaining: Math.max(0, monthlyLimit - latestLimits.monthly_used),
        },
      },
    });
  } catch (error) {
    console.error('Risk check error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 更新支付限额使用 ====================

const updateUsedSchema = z.object({
  userId: z.string(),
  amount: z.number().int().positive(),
  operation: z.enum(['add', 'subtract']), // 增加/减少（退款）
});

/**
 * 更新限额使用量
 * POST /api/v1/risk/update-used
 * Body: { userId, amount, operation }
 */
router.post('/update-used', async (req: Request, res: Response) => {
  try {
    const body = updateUsedSchema.parse(req.body);
    
    const { data: limits, error } = await client
      .from('pay_limits')
      .select('*')
      .eq('user_id', body.userId)
      .single();
    
    if (!limits) {
      return res.status(404).json({ error: 'Limits not found' });
    }
    
    const latestLimits = await resetLimitsIfNeeded(limits);
    
    let newDailyUsed = latestLimits.daily_used;
    let newMonthlyUsed = latestLimits.monthly_used;
    
    if (body.operation === 'add') {
      newDailyUsed += body.amount;
      newMonthlyUsed += body.amount;
    } else {
      newDailyUsed = Math.max(0, newDailyUsed - body.amount);
      newMonthlyUsed = Math.max(0, newMonthlyUsed - body.amount);
    }
    
    await client
      .from('pay_limits')
      .update({
        daily_used: newDailyUsed,
        monthly_used: newMonthlyUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', latestLimits.id);
    
    res.json({
      success: true,
      data: {
        dailyUsed: newDailyUsed,
        monthlyUsed: newMonthlyUsed,
      },
    });
  } catch (error) {
    console.error('Update used error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 设置未成年人状态 ====================

const setMinorSchema = z.object({
  userId: z.string(),
  isMinor: z.boolean(),
  birthDate: z.string().optional(),
});

/**
 * 设置未成年人状态（实名认证后调用）
 * POST /api/v1/risk/set-minor
 * Body: { userId, isMinor, birthDate? }
 */
router.post('/set-minor', async (req: Request, res: Response) => {
  try {
    const body = setMinorSchema.parse(req.body);
    
    // 更新用户信息
    await client
      .from('users')
      .update({
        is_adult: !body.isMinor,
        birth_date: body.birthDate ? new Date(body.birthDate).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.userId);
    
    // 更新限额配置
    const { error } = await client
      .from('pay_limits')
      .upsert({
        user_id: body.userId,
        is_minor: body.isMinor,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    
    if (error) {
      return res.status(500).json({ error: 'Failed to update minor status' });
    }
    
    // 记录风控日志
    await client.from('risk_logs').insert([{
      user_id: body.userId,
      risk_type: 'minor_status_change',
      risk_level: body.isMinor ? 'medium' : 'low',
      action: 'pass',
      detail: {
        is_minor: body.isMinor,
        birth_date: body.birthDate,
      },
    }]);
    
    res.json({
      success: true,
      message: body.isMinor 
        ? '已设置为未成年人，将应用消费限额保护' 
        : '已设置为成年人',
      data: {
        isMinor: body.isMinor,
        minorDailyLimit: body.isMinor ? RISK_CONFIG.minorLimit.daily : null,
      },
    });
  } catch (error) {
    console.error('Set minor error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 获取风控日志 ====================

/**
 * 获取用户风控日志
 * GET /api/v1/risk/logs/:userId
 */
router.get('/logs/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const { data: logs, error } = await client
      .from('risk_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get logs' });
    }
    
    res.json({
      success: true,
      data: logs || [],
    });
  } catch (error) {
    console.error('Get risk logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// ==================== 辅助函数 ====================

async function resetLimitsIfNeeded(limits: any) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  let needsUpdate = false;
  const updates: any = {};
  
  // 检查是否需要重置每日限额
  const lastDailyReset = limits.last_daily_reset ? new Date(limits.last_daily_reset) : null;
  if (!lastDailyReset || lastDailyReset < today) {
    updates.daily_used = 0;
    updates.last_daily_reset = now.toISOString();
    needsUpdate = true;
  }
  
  // 检查是否需要重置每月限额
  const lastMonthlyReset = limits.last_monthly_reset ? new Date(limits.last_monthly_reset) : null;
  if (!lastMonthlyReset || lastMonthlyReset < thisMonth) {
    updates.monthly_used = 0;
    updates.last_monthly_reset = now.toISOString();
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    const { data, error } = await client
      .from('pay_limits')
      .update(updates)
      .eq('id', limits.id)
      .select()
      .single();
    
    if (!error && data) {
      return data;
    }
  }
  
  return limits;
}

export default router;
