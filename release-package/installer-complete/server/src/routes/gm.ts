/**
 * GM管理后台API
 * 用户管理、充值发放、数值调整
 */

import express, { type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import crypto from 'crypto';

const router = express.Router();
const supabase = getSupabaseClient();

// GM密钥
const GM_SECRET = process.env.GM_SECRET || 'jianpo_gm_secret_2024';

// 充值配置（内联定义）
const RECHARGE_PACKAGES = [
  { id: 'pack_1', price: 6, items: [{ type: 'gold', amount: 1200 }, { type: 'gem', amount: 60 }] },
  { id: 'pack_6', price: 6, items: [{ type: 'gold', amount: 720 }, { type: 'gem', amount: 30 }] },
  { id: 'pack_18', price: 18, items: [{ type: 'gold', amount: 2700 }, { type: 'gem', amount: 180 }] },
  { id: 'pack_30', price: 30, items: [{ type: 'gold', amount: 6000 }, { type: 'gem', amount: 300 }] },
  { id: 'pack_68', price: 68, items: [{ type: 'gold', amount: 17000 }, { type: 'gem', amount: 1000 }] },
  { id: 'pack_128', price: 128, items: [{ type: 'gold', amount: 38400 }, { type: 'gem', amount: 2560 }] },
  { id: 'pack_328', price: 328, items: [{ type: 'gold', amount: 131200 }, { type: 'gem', amount: 10000 }] },
  { id: 'pack_648', price: 648, items: [{ type: 'gold', amount: 388800 }, { type: 'gem', amount: 25000 }] }
];

// 验证GM权限
const verifyGM = (req: Request, res: Response, next: Function) => {
  const token = req.headers['x-gm-token'] || req.body?.gmToken;
  
  if (!token || token !== GM_SECRET) {
    return res.status(403).json({ error: 'GM权限验证失败' });
  }
  
  next();
};

/**
 * 用户表结构（简化版）
 * - uid: 用户ID
 * - nickname: 昵称
 * - level: 等级
 * - vip: VIP等级
 * - gold: 元宝
 * - gem: 灵石
 * - energy: 体力
 * - power: 战力
 * - chapter: 章节
 * - data: JSON格式的扩展数据
 */

// 确保用户表存在
const ensureUserTable = async () => {
  // 使用Supabase，表通过SQL创建
};

/**
 * GM登录验证
 * POST /api/v1/gm/login
 */
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  // 简单验证（生产环境应该用数据库存储GM账号）
  if (username === 'admin' && password === GM_SECRET) {
    const token = crypto.createHash('sha256').update(`${username}:${Date.now()}`).digest('hex');
    
    res.json({
      success: true,
      token: GM_SECRET, // 返回GM Token
      message: '登录成功'
    });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

/**
 * 获取用户列表
 * GET /api/v1/gm/users
 */
router.get('/users', verifyGM, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    let query = supabase
      .from('game_users')
      .select('uid, nickname, level, vip, gold, gem, power, chapter, created_at, last_login', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);
    
    if (search) {
      query = query.or(`nickname.ilike.%${search}%,uid.eq.${search}`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      success: true,
      users: data,
      total: count,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取用户详情
 * GET /api/v1/gm/user/:uid
 */
router.get('/user/:uid', verifyGM, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    const { data, error } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', uid)
      .single();
    
    if (error) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 修改用户数值
 * POST /api/v1/gm/user/:uid/modify
 * Body: { field, value, operation: 'set' | 'add' | 'reduce' }
 */
router.post('/user/:uid/modify', verifyGM, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { field, value, operation = 'set' } = req.body;
    
    // 允许修改的字段
    const allowedFields = ['gold', 'gem', 'energy', 'level', 'vip', 'exp', 'power', 'chapter', 'hp', 'atk', 'def'];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: '不允许修改该字段' });
    }
    
    // 获取当前值
    const { data: user, error: fetchError } = await supabase
      .from('game_users')
      .select(field)
      .eq('uid', uid)
      .single();
    
    if (fetchError) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    let newValue: number = Number(value);
    const currentValue = Number(user[field]) || 0;
    
    switch (operation) {
      case 'add':
        newValue = currentValue + Number(value);
        break;
      case 'reduce':
        newValue = Math.max(0, currentValue - Number(value));
        break;
      case 'set':
      default:
        newValue = Number(value);
    }
    
    // 更新数据
    const { error: updateError } = await supabase
      .from('game_users')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('uid', uid);
    
    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
    
    // 记录GM操作日志
    await supabase.from('gm_logs').insert({
      action: 'modify_user',
      target_uid: uid,
      field,
      old_value: currentValue,
      new_value: newValue,
      operation,
      created_at: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: '修改成功',
      oldValue: currentValue,
      newValue
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 批量发放奖励
 * POST /api/v1/gm/reward/batch
 * Body: { uids: [], rewards: [{ type, amount }] }
 */
router.post('/reward/batch', verifyGM, async (req: Request, res: Response) => {
  try {
    const { uids, rewards, title, content } = req.body;
    
    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      return res.status(400).json({ error: '请选择用户' });
    }
    
    if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
      return res.status(400).json({ error: '请设置奖励' });
    }
    
    let successCount = 0;
    let failCount = 0;
    
    for (const uid of uids) {
      try {
        // 获取用户数据
        const { data: user, error: fetchError } = await supabase
          .from('game_users')
          .select('*')
          .eq('uid', uid)
          .single();
        
        if (fetchError || !user) {
          failCount++;
          continue;
        }
        
        // 发放奖励
        const updates: Record<string, number> = {};
        for (const reward of rewards) {
          const field = reward.type; // gold, gem, energy, etc.
          if (field in user) {
            updates[field] = (user[field] || 0) + Number(reward.amount);
          }
        }
        
        // 更新用户数据
        const { error: updateError } = await supabase
          .from('game_users')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('uid', uid);
        
        if (updateError) {
          failCount++;
        } else {
          successCount++;
          
          // 发送邮件通知
          await supabase.from('game_mails').insert({
            uid,
            title: title || 'GM奖励',
            content: content || '您收到了GM发放的奖励',
            rewards: rewards,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      } catch (e) {
        failCount++;
      }
    }
    
    // 记录GM操作
    await supabase.from('gm_logs').insert({
      action: 'batch_reward',
      target_uids: uids,
      rewards,
      success_count: successCount,
      fail_count: failCount,
      created_at: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `发放完成：成功${successCount}个，失败${failCount}个`,
      successCount,
      failCount
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 全服公告
 * POST /api/v1/gm/announcement
 */
router.post('/announcement', verifyGM, async (req: Request, res: Response) => {
  try {
    const { title, content, type = 'normal', startTime, endTime } = req.body;
    
    const { error } = await supabase
      .from('game_announcements')
      .insert({
        title,
        content,
        type, // normal, important, emergency
        start_time: startTime || new Date().toISOString(),
        end_time: endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, message: '公告发布成功' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取GM操作日志
 * GET /api/v1/gm/logs
 */
router.get('/logs', verifyGM, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const { data, error, count } = await supabase
      .from('gm_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      success: true,
      logs: data,
      total: count
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 充值回调处理
 * POST /api/v1/gm/payment/callback
 */
router.post('/payment/callback', async (req: Request, res: Response) => {
  try {
    const { uid, packageId, orderId, amount } = req.body;
    
    // 验证订单（实际应验证支付平台签名）
    
    // 使用内联配置
    const pkg = RECHARGE_PACKAGES.find((p: any) => p.id === packageId);
    
    if (!pkg) {
      return res.status(400).json({ error: '无效的充值包' });
    }
    
    // 获取用户
    const { data: user, error: fetchError } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', uid)
      .single();
    
    if (fetchError || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 发放奖励
    const updates: Record<string, number> = {};
    for (const item of pkg.items) {
      if (item.type === 'vip') {
        // VIP经验
        updates.vip_exp = (user.vip_exp || 0) + amount * 10;
      } else {
        const field = item.type;
        const itemAmount = item.amount || 0;
        updates[field] = (Number(user[field]) || 0) + itemAmount;
      }
    }
    
    // 更新用户
    await supabase
      .from('game_users')
      .update({
        ...updates,
        total_recharge: (user.total_recharge || 0) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('uid', uid);
    
    // 记录充值日志
    await supabase.from('payment_logs').insert({
      uid,
      order_id: orderId,
      package_id: packageId,
      amount,
      rewards: pkg.items,
      status: 'completed',
      created_at: new Date().toISOString()
    });
    
    res.json({ success: true, message: '充值成功' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取统计数据
 * GET /api/v1/gm/stats
 */
router.get('/stats', verifyGM, async (req: Request, res: Response) => {
  try {
    // 总用户数
    const { count: totalUsers } = await supabase
      .from('game_users')
      .select('*', { count: 'exact', head: true });
    
    // 今日新增
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayNew } = await supabase
      .from('game_users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    // 总充值金额
    const { data: rechargeData } = await supabase
      .from('game_users')
      .select('total_recharge');
    
    const totalRecharge = rechargeData?.reduce((sum, u) => sum + (u.total_recharge || 0), 0) || 0;
    
    // VIP用户数
    const { count: vipUsers } = await supabase
      .from('game_users')
      .select('*', { count: 'exact', head: true })
      .gt('vip', 0);
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        todayNew,
        totalRecharge,
        vipUsers,
        avgRecharge: totalUsers ? Math.floor(totalRecharge / totalUsers) : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
