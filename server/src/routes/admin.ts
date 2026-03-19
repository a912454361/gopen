/**
 * 管理后台 API 路由
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// 管理员密钥
const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';

// 验证管理员权限
const verifyAdmin = (key: string): boolean => {
  return key === ADMIN_KEY;
};

/**
 * 自动审核超过30分钟的待审核订单
 */
const autoApproveTimeoutOrders = async () => {
  try {
    const timeoutMinutes = 30;
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    const { data: timeoutOrders } = await client
      .from('pay_orders')
      .select('*')
      .eq('status', 'confirming')
      .lt('confirmed_at', timeoutDate.toISOString());
    
    if (!timeoutOrders || timeoutOrders.length === 0) {
      return { processed: 0 };
    }
    
    let processed = 0;
    for (const order of timeoutOrders) {
      try {
        await client
          .from('pay_orders')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            admin_remark: '系统自动审核（超时30分钟）',
          })
          .eq('id', order.id);
        
        if (order.product_type === 'membership' || order.product_type === 'super_member') {
          const memberLevel = order.product_type === 'super_member' ? 'super' : 'member';
          const expireDate = new Date();
          expireDate.setMonth(expireDate.getMonth() + 1);
          
          await client
            .from('users')
            .update({
              member_level: memberLevel,
              member_expire_at: expireDate.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', order.user_id);
        }
        
        await client.from('admin_logs').insert([{
          action: 'auto_approve',
          target: order.order_no,
          operator: 'system',
          details: `订单超时30分钟自动审核通过，金额: ¥${(order.amount / 100).toFixed(2)}`,
        }]);
        
        processed++;
      } catch (err) {
        console.error(`[AutoApprove] Error:`, err);
      }
    }
    
    return { processed };
  } catch (error) {
    console.error('[AutoApprove] Error:', error);
    return { processed: 0 };
  }
};

/**
 * 验证管理员权限
 * GET /api/v1/admin/verify
 */
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    const isValid = verifyAdmin(key);
    
    res.json({ success: isValid });
  } catch (error) {
    console.error('Verify admin error:', error);
    res.json({ success: false });
  }
});

/**
 * 获取统计数据
 * GET /api/v1/admin/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!verifyAdmin(key)) {
      return res.status(403).json({ error: '无权限' });
    }

    // 先执行自动审核（超时30分钟的订单）
    await autoApproveTimeoutOrders();

    // 获取用户统计
    const { data: users } = await client
      .from('users')
      .select('id, member_level');
    
    const totalUsers = users?.length || 0;
    const memberUsers = users?.filter(u => u.member_level !== 'free').length || 0;

    // 获取订单统计
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayOrders } = await client
      .from('pay_orders')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', today);
    
    const todayOrderCount = todayOrders?.length || 0;
    const todayAmount = todayOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;

    const { data: pendingOrders } = await client
      .from('pay_orders')
      .select('id')
      .eq('status', 'confirming');
    
    const { data: totalOrders } = await client
      .from('pay_orders')
      .select('amount')
      .eq('status', 'paid');
    
    const totalRevenue = totalOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;

    // 获取最近订单
    const { data: recentOrders } = await client
      .from('pay_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalUsers,
        memberUsers,
        todayOrders: todayOrderCount,
        todayAmount,
        pendingOrders: pendingOrders?.length || 0,
        totalRevenue,
        recentOrders: recentOrders || [],
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

/**
 * 获取收入图表数据
 * GET /api/v1/admin/revenue-chart
 */
router.get('/revenue-chart', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    if (!verifyAdmin(key)) {
      return res.status(403).json({ error: '无权限' });
    }

    // 获取近7天数据
    const daily = [];
    const labels = ['日', '一', '二', '三', '四', '五', '六'];
    let maxAmount = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const { data: orders } = await client
        .from('pay_orders')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', dateStr)
        .lt('paid_at', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);
      
      const amount = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
      maxAmount = Math.max(maxAmount, amount);
      
      daily.push({
        label: `周${labels[date.getDay()]}`,
        amount: amount / 100, // 转为元
      });
    }

    res.json({
      success: true,
      data: {
        daily,
        maxAmount: Math.max(maxAmount / 100, 1), // 确保不为0
      },
    });
  } catch (error) {
    console.error('Get revenue chart error:', error);
    res.status(500).json({ error: '获取图表数据失败' });
  }
});

/**
 * 获取订单列表
 * GET /api/v1/admin/orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    const status = req.query.status as string;
    
    if (!verifyAdmin(key)) {
      return res.status(403).json({ error: '无权限' });
    }

    let query = client
      .from('pay_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.eq('status', 'confirming');
      } else {
        query = query.eq('status', status);
      }
    }

    const { data: orders, error } = await query.limit(100);

    if (error) {
      console.error('Query orders error:', error);
      return res.status(500).json({ error: '查询失败' });
    }

    res.json({ success: true, data: orders || [] });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: '获取订单失败' });
  }
});

/**
 * 获取用户列表
 * GET /api/v1/admin/users
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    const level = req.query.level as string;
    
    if (!verifyAdmin(key)) {
      return res.status(403).json({ error: '无权限' });
    }

    let query = client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (level && level !== 'all') {
      query = query.eq('member_level', level);
    }

    const { data: users, error } = await query.limit(100);

    if (error) {
      console.error('Query users error:', error);
      return res.status(500).json({ error: '查询失败' });
    }

    // 获取每个用户的订单统计
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        const { data: orders } = await client
          .from('pay_orders')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'paid');
        
        return {
          ...user,
          total_spent: orders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0,
          order_count: orders?.length || 0,
        };
      })
    );

    res.json({ success: true, data: usersWithStats });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户失败' });
  }
});

/**
 * 更新用户会员状态
 * POST /api/v1/admin/users/update
 */
router.post('/users/update', async (req: Request, res: Response) => {
  try {
    const { adminKey, userId, memberLevel, months } = req.body;
    
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    const updateData: any = {
      member_level: memberLevel,
      updated_at: new Date().toISOString(),
    };

    if (memberLevel !== 'free' && months > 0) {
      const expireDate = new Date();
      expireDate.setMonth(expireDate.getMonth() + months);
      updateData.member_expire_at = expireDate.toISOString();
    }

    const { error } = await client
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: '更新失败' });
    }

    // 记录操作日志
    await client.from('admin_logs').insert([{
      action: 'user_member_update',
      target: userId,
      operator: 'admin',
      details: `设置会员等级: ${memberLevel}, 月数: ${months}`,
    }]);

    res.json({ success: true, message: '用户会员已更新' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * 获取操作日志
 * GET /api/v1/admin/logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    
    if (!verifyAdmin(key)) {
      return res.status(403).json({ error: '无权限' });
    }

    const { data: logs, error } = await client
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      // 表可能不存在，返回空数组
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: logs || [] });
  } catch (error) {
    console.error('Get logs error:', error);
    res.json({ success: true, data: [] });
  }
});

export default router;
