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

// ==================== 推广佣金计算 ====================

/**
 * 计算并记录推广佣金
 * 在用户消费成功后调用
 */
const calculatePromotionCommission = async (
  userId: string,
  amount: number,
  orderId: string
): Promise<void> => {
  try {
    // 1. 查找该用户的推广转化记录
    const { data: conversion } = await client
      .from('promotion_conversions')
      .select('id, promoter_id, commission_rate')
      .eq('converted_user_id', userId)
      .eq('status', 'active')
      .single();

    if (!conversion) {
      return;
    }

    // 2. 获取推广员的分成比例
    const { data: promoter } = await client
      .from('promoters')
      .select('commission_rate, status')
      .eq('id', conversion.promoter_id)
      .single();

    if (!promoter || promoter.status !== 'active') {
      return;
    }

    // 3. 计算佣金
    const commissionRate = promoter.commission_rate || 0.10;
    const commission = Math.floor(amount * commissionRate);

    if (commission <= 0) {
      return;
    }

    // 4. 创建佣金记录
    const { error } = await client
      .from('promotion_earnings')
      .insert([{
        promoter_id: conversion.promoter_id,
        conversion_id: conversion.id,
        order_id: orderId,
        user_id: userId,
        amount: amount,
        commission_rate: commissionRate,
        commission: commission,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      }]);

    if (!error) {
      console.log(`[Promotion] Created commission: ¥${(commission / 100).toFixed(2)} for promoter ${conversion.promoter_id}`);

      // 5. 更新转化记录
      await client
        .from('promotion_conversions')
        .update({
          total_spent: amount,
          total_commission: commission,
        })
        .eq('id', conversion.id);
    }
  } catch (error) {
    console.error('Calculate promotion commission error:', error);
  }
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
        
        // 计算推广佣金
        await calculatePromotionCommission(order.user_id, order.amount, order.id);
        
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
      .select('id, member_level, created_at');
    
    const totalUsers = users?.length || 0;
    const memberUsers = users?.filter(u => u.member_level !== 'free').length || 0;
    const superMemberUsers = users?.filter(u => u.member_level === 'super').length || 0;
    const normalMemberUsers = users?.filter(u => u.member_level === 'member').length || 0;

    // 获取订单统计
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayOrders } = await client
      .from('pay_orders')
      .select('amount, pay_type')
      .eq('status', 'paid')
      .gte('paid_at', today);
    
    const todayOrderCount = todayOrders?.length || 0;
    const todayAmount = todayOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    const todayAlipayAmount = todayOrders?.filter(o => o.pay_type === 'alipay').reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    const todayWechatAmount = todayOrders?.filter(o => o.pay_type === 'wechat').reduce((sum, o) => sum + (o.amount || 0), 0) || 0;

    const { data: pendingOrders } = await client
      .from('pay_orders')
      .select('id, amount, pay_type, confirmed_at')
      .eq('status', 'confirming');
    
    const { data: totalOrders } = await client
      .from('pay_orders')
      .select('amount, pay_type');
    
    const totalRevenue = totalOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    
    // 已支付订单统计
    const { data: paidOrders } = await client
      .from('pay_orders')
      .select('amount, pay_type')
      .eq('status', 'paid');
    
    const totalPaidRevenue = paidOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    const totalAlipayRevenue = paidOrders?.filter(o => o.pay_type === 'alipay').reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    const totalWechatRevenue = paidOrders?.filter(o => o.pay_type === 'wechat').reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    const totalPaidCount = paidOrders?.length || 0;

    // 计算待审核订单中超时的数量
    const timeoutMinutes = 30;
    const timeoutDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    const timeoutPendingCount = pendingOrders?.filter(o => 
      o.confirmed_at && new Date(o.confirmed_at) < timeoutDate
    ).length || 0;

    // 获取最近订单（包含收款账户信息）
    const { data: recentOrders } = await client
      .from('pay_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const recentOrdersWithAccount = (recentOrders || []).map(order => ({
      ...order,
      paymentAccount: PAYMENT_ACCOUNTS[order.pay_type as keyof typeof PAYMENT_ACCOUNTS] || null,
    }));

    // 获取本月统计
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const { data: monthOrders } = await client
      .from('pay_orders')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', monthStart.toISOString());
    
    const monthRevenue = monthOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
    const monthOrderCount = monthOrders?.length || 0;

    // 获取新增用户统计
    const { data: newUsersToday } = await client
      .from('users')
      .select('id')
      .gte('created_at', today);
    
    const { data: newUsersMonth } = await client
      .from('users')
      .select('id')
      .gte('created_at', monthStart.toISOString());

    res.json({
      success: true,
      data: {
        // 用户统计
        totalUsers,
        memberUsers,
        superMemberUsers,
        normalMemberUsers,
        newUsersToday: newUsersToday?.length || 0,
        newUsersMonth: newUsersMonth?.length || 0,
        
        // 订单统计
        todayOrders: todayOrderCount,
        todayAmount,
        todayAlipayAmount,
        todayWechatAmount,
        monthOrders: monthOrderCount,
        monthRevenue,
        
        // 待处理
        pendingOrders: pendingOrders?.length || 0,
        timeoutPendingCount,
        
        // 总计
        totalRevenue: totalPaidRevenue,
        totalAlipayRevenue,
        totalWechatRevenue,
        totalPaidCount,
        
        // 收款账户信息
        paymentAccounts: PAYMENT_ACCOUNTS,
        
        // 最近订单
        recentOrders: recentOrdersWithAccount,
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

// 收款账户配置（与payment.ts保持一致）
const PAYMENT_ACCOUNTS = {
  alipay: {
    name: '支付宝收款',
    account: '18321337942',
    realName: '郭涛',
    qrcodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=HTTPS://QR.ALIPAY.COM/18321337942',
  },
  wechat: {
    name: '微信收款',
    account: 'a912454361',
    realName: '郭涛',
    qrcodeUrl: 'https://coze-coding-project.tos.coze.site/coze_storage_7618582774739501102/payment/wechat-qrcode_ea8df637.png?sign=1805653498-44ee782e41-0-6bde1ac4211ab525a9419f80135ce7deb9250047907fdd28ddcd8d8d43dd7d93',
  },
  unionpay: {
    name: '银联收款',
    account: '6216****7932',
    realName: '郭涛',
    qrcodeUrl: 'https://coze-coding-project.tos.coze.site/coze_storage_7618582774739501102/payment/unionpay-qrcode_e1c61a35.png?sign=1805653583-2d0669e23c-0-39f08b1673e207d6461e0a60acc8404d0fc600012a5216924634610aa28e8283',
  },
  jdpay: {
    name: '京东支付',
    account: '',
    realName: '郭涛',
  },
  bank: {
    name: '银行转账',
    account: '6216600800003247932',
    realName: '郭涛',
    bankName: '中国银行',
    bankBranch: '上海市黄渡支行',
  },
};

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

    // 为每个订单添加收款账户信息
    const ordersWithAccount = (orders || []).map(order => ({
      ...order,
      paymentAccount: PAYMENT_ACCOUNTS[order.pay_type as keyof typeof PAYMENT_ACCOUNTS] || null,
    }));

    res.json({ success: true, data: ordersWithAccount });
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

/**
 * 获取利润统计面板
 * GET /api/v1/admin/profit
 */
router.get('/profit', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    
    if (!verifyAdmin(key)) {
      return res.status(403).json({ error: '无权限' });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 本月开始
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // 本周开始
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // ==================== 消费记录统计 ====================
    const { data: todayConsumption } = await client
      .from('consumption_records')
      .select('sell_total, cost_total, profit')
      .gte('created_at', todayStr);
    
    const { data: weekConsumption } = await client
      .from('consumption_records')
      .select('sell_total, cost_total, profit')
      .gte('created_at', weekStart.toISOString());
    
    const { data: monthConsumption } = await client
      .from('consumption_records')
      .select('sell_total, cost_total, profit')
      .gte('created_at', monthStart.toISOString());
    
    const { data: totalConsumption } = await client
      .from('consumption_records')
      .select('sell_total, cost_total, profit');

    // 聚合计算
    const calcStats = (data: any[] | null | undefined) => {
      if (!data || data.length === 0) return { revenue: 0, cost: 0, profit: 0, margin: 0 };
      const revenue = data.reduce((sum, r) => sum + (r.sell_total || 0), 0);
      const cost = data.reduce((sum, r) => sum + (r.cost_total || 0), 0);
      const profit = data.reduce((sum, r) => sum + (r.profit || 0), 0);
      return {
        revenue: revenue / 100, // 转为元
        cost: cost / 100,
        profit: profit / 100,
        margin: revenue > 0 ? (profit / revenue * 100) : 0,
      };
    };

    // ==================== 按模型分类统计 ====================
    const { data: modelStats } = await client
      .from('consumption_records')
      .select('resource_name, consumption_type, sell_total, cost_total, profit, input_tokens, output_tokens')
      .gte('created_at', monthStart.toISOString());
    
    const modelAggregation: Record<string, any> = {};
    (modelStats || []).forEach(record => {
      const key = record.resource_name || 'unknown';
      if (!modelAggregation[key]) {
        modelAggregation[key] = {
          name: key,
          type: record.consumption_type,
          calls: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          inputTokens: 0,
          outputTokens: 0,
        };
      }
      modelAggregation[key].calls++;
      modelAggregation[key].revenue += record.sell_total || 0;
      modelAggregation[key].cost += record.cost_total || 0;
      modelAggregation[key].profit += record.profit || 0;
      modelAggregation[key].inputTokens += record.input_tokens || 0;
      modelAggregation[key].outputTokens += record.output_tokens || 0;
    });

    const topModels = Object.values(modelAggregation)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((m: any) => ({
        ...m,
        revenue: m.revenue / 100,
        cost: m.cost / 100,
        profit: m.profit / 100,
        margin: m.revenue > 0 ? (m.profit / m.revenue * 100) : 0,
      }));

    // ==================== 按用户分类统计 ====================
    const { data: userStats } = await client
      .from('consumption_records')
      .select('user_id, sell_total, profit')
      .gte('created_at', monthStart.toISOString());
    
    const userAggregation: Record<string, any> = {};
    (userStats || []).forEach(record => {
      const key = record.user_id;
      if (!userAggregation[key]) {
        userAggregation[key] = {
          userId: key,
          calls: 0,
          revenue: 0,
          profit: 0,
        };
      }
      userAggregation[key].calls++;
      userAggregation[key].revenue += record.sell_total || 0;
      userAggregation[key].profit += record.profit || 0;
    });

    const topUsers = Object.values(userAggregation)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // ==================== 利润趋势（近7天） ====================
    const profitTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const { data: dayRecords } = await client
        .from('consumption_records')
        .select('sell_total, cost_total, profit')
        .gte('created_at', dateStr)
        .lt('created_at', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);
      
      const stats = calcStats(dayRecords);
      profitTrend.push({
        date: dateStr,
        ...stats,
      });
    }

    // ==================== 会员收入统计 ====================
    const { data: memberPayments } = await client
      .from('pay_orders')
      .select('amount, product_type')
      .eq('status', 'paid')
      .gte('paid_at', monthStart.toISOString());
    
    const memberRevenue = {
      total: 0,
      normal: 0,
      super: 0,
    };
    
    (memberPayments || []).forEach(payment => {
      const amount = payment.amount || 0;
      memberRevenue.total += amount;
      if (payment.product_type === 'membership') {
        memberRevenue.normal += amount;
      } else if (payment.product_type === 'super_member') {
        memberRevenue.super += amount;
      }
    });

    res.json({
      success: true,
      data: {
        // 概览统计
        overview: {
          today: calcStats(todayConsumption),
          week: calcStats(weekConsumption),
          month: calcStats(monthConsumption),
          total: calcStats(totalConsumption),
        },
        
        // 会员收入（本月）
        memberRevenue: {
          total: memberRevenue.total / 100,
          normal: memberRevenue.normal / 100,
          super: memberRevenue.super / 100,
        },
        
        // 模型排行
        topModels,
        
        // 用户排行
        topUsers: topUsers.map((u: any) => ({
          ...u,
          revenue: u.revenue / 100,
          profit: u.profit / 100,
        })),
        
        // 利润趋势
        profitTrend,
        
        // AI 调用统计
        aiCalls: {
          today: todayConsumption?.length || 0,
          week: weekConsumption?.length || 0,
          month: monthConsumption?.length || 0,
          total: totalConsumption?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get profit stats error:', error);
    res.status(500).json({ error: '获取利润统计失败' });
  }
});

/**
 * 获取利润图表数据
 * GET /api/v1/admin/profit-chart
 */
router.get('/profit-chart', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    const type = (req.query.type as string) || 'daily'; // daily, weekly, monthly
    
    if (!verifyAdmin(key)) {
      return res.status(403).json({ error: '无权限' });
    }

    const chartData = [];
    const labels = ['日', '一', '二', '三', '四', '五', '六'];
    
    // 获取近7天数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const { data: records } = await client
        .from('consumption_records')
        .select('sell_total, cost_total, profit')
        .gte('created_at', dateStr)
        .lt('created_at', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);
      
      const revenue = (records || []).reduce((sum, r) => sum + (r.sell_total || 0), 0) / 100;
      const cost = (records || []).reduce((sum, r) => sum + (r.cost_total || 0), 0) / 100;
      const profit = (records || []).reduce((sum, r) => sum + (r.profit || 0), 0) / 100;
      
      chartData.push({
        label: `周${labels[date.getDay()]}`,
        revenue,
        cost,
        profit,
      });
    }

    res.json({
      success: true,
      data: {
        chartData,
      },
    });
  } catch (error) {
    console.error('Get profit chart error:', error);
    res.status(500).json({ error: '获取图表数据失败' });
  }
});

// ==================== 推广中心 API ====================

/**
 * 获取推广统计数据
 * GET /api/v1/admin/promotion/stats
 */
router.get('/promotion/stats', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    
    if (!verifyAdmin(key)) {
      return res.status(403).json({ error: '无权限' });
    }

    // 获取今日日期
    const today = new Date().toISOString().split('T')[0];

    // 获取推广员总数
    const { data: promoters } = await client
      .from('promoters')
      .select('id, status, total_clicks, total_conversions, total_earnings, promoter_code');

    const totalPromoters = promoters?.length || 0;
    const activePromoters = promoters?.filter(p => p.status === 'active').length || 0;

    // 获取总点击和转化
    const totalClicks = promoters?.reduce((sum, p) => sum + (p.total_clicks || 0), 0) || 0;
    const totalConversions = promoters?.reduce((sum, p) => sum + (p.total_conversions || 0), 0) || 0;
    const totalEarnings = promoters?.reduce((sum, p) => sum + (p.total_earnings || 0), 0) || 0;

    // 获取今日点击
    const { data: todayClicks } = await client
      .from('promotion_clicks')
      .select('id')
      .gte('click_time', today);

    // 获取今日转化
    const { data: todayConversions } = await client
      .from('promotion_conversions')
      .select('id')
      .gte('conversion_time', today);

    // 获取今日佣金
    const { data: todayEarnings } = await client
      .from('promotion_earnings')
      .select('commission')
      .gte('earned_at', today);

    const todayEarningsTotal = (todayEarnings || []).reduce((sum, e) => sum + (e.commission || 0), 0);

    // 获取待处理提现数量
    const { data: pendingWithdrawals } = await client
      .from('promotion_withdrawals')
      .select('id')
      .eq('status', 'pending');

    // 获取TOP推广员
    const topPromoters = (promoters || [])
      .sort((a, b) => (b.total_earnings || 0) - (a.total_earnings || 0))
      .slice(0, 5);

    // 获取最近收益记录
    const { data: recentEarnings } = await client
      .from('promotion_earnings')
      .select('id, amount, commission, created_at')
      .order('earned_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalPromoters,
        activePromoters,
        totalClicks,
        totalConversions,
        totalEarnings,
        todayClicks: todayClicks?.length || 0,
        todayConversions: todayConversions?.length || 0,
        todayEarnings: todayEarningsTotal,
        pendingWithdrawals: pendingWithdrawals?.length || 0,
        topPromoters: topPromoters.map(p => ({
          id: p.id,
          promoter_code: p.promoter_code,
          total_clicks: p.total_clicks || 0,
          total_conversions: p.total_conversions || 0,
          total_earnings: p.total_earnings || 0,
        })),
        recentEarnings: (recentEarnings || []).map(e => ({
          id: e.id,
          amount: e.amount,
          commission: e.commission,
          created_at: e.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Get promotion stats error:', error);
    res.status(500).json({ error: '获取推广统计失败' });
  }
});

/**
 * 记录推广发布
 * POST /api/v1/admin/promotion/publish
 */
router.post('/promotion/publish', async (req: Request, res: Response) => {
  try {
    const { adminKey, platform, contentId, content } = req.body;
    
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    // 尝试记录到数据库
    try {
      await client.from('promotion_publishes').insert([{
        platform,
        content_id: contentId,
        content: content || '',
        published_at: new Date().toISOString(),
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      }]);
    } catch (err) {
      // 表不存在，忽略错误
      console.log('Promotion publishes table not exists, skipping record');
    }

    // 记录操作日志
    try {
      await client.from('admin_logs').insert([{
        action: 'promotion_publish',
        target: platform,
        operator: 'admin',
        details: `在${platform}平台发布推广内容: ${contentId}`,
      }]);
    } catch (err) {
      // 忽略错误
    }

    res.json({ 
      success: true, 
      message: '发布记录已保存',
      data: {
        platform,
        contentId,
        publishedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Record promotion publish error:', error);
    res.status(500).json({ error: '记录发布失败' });
  }
});

/**
 * 更新推广统计数据（用于模拟或实际统计）
 * POST /api/v1/admin/promotion/update-stats
 */
router.post('/promotion/update-stats', async (req: Request, res: Response) => {
  try {
    const { adminKey, platform, views, clicks, conversions, revenue } = req.body;
    
    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    try {
      await client.from('promotion_stats').insert([{
        platform,
        views: views || 0,
        clicks: clicks || 0,
        conversions: conversions || 0,
        revenue: revenue || 0,
        created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      console.log('Promotion stats table not exists');
    }

    res.json({ success: true, message: '统计数据已更新' });
  } catch (error) {
    console.error('Update promotion stats error:', error);
    res.status(500).json({ error: '更新统计失败' });
  }
});

// 生成模拟推广统计数据
function generateMockPromotionStats() {
  return {
    totalViews: 12580,
    totalClicks: 3245,
    totalConversions: 186,
    totalRevenue: 5380,
    platformStats: [
      { platform: 'xiaohongshu', views: 5200, clicks: 1450, conversions: 78, revenue: 2250, publishCount: 12 },
      { platform: 'douyin', views: 3800, clicks: 980, conversions: 52, revenue: 1500, publishCount: 8 },
      { platform: 'weibo', views: 2100, clicks: 520, conversions: 32, revenue: 920, publishCount: 15 },
      { platform: 'zhihu', views: 980, clicks: 195, conversions: 14, revenue: 410, publishCount: 6 },
      { platform: 'bilibili', views: 500, clicks: 100, conversions: 10, revenue: 300, publishCount: 4 },
    ],
  };
}

// 聚合推广统计数据
function aggregatePromotionStats(stats: any[]) {
  const platformData: Record<string, any> = {};
  let totalViews = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  stats.forEach(stat => {
    const platform = stat.platform;
    if (!platformData[platform]) {
      platformData[platform] = {
        platform,
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        publishCount: 0,
      };
    }
    platformData[platform].views += stat.views || 0;
    platformData[platform].clicks += stat.clicks || 0;
    platformData[platform].conversions += stat.conversions || 0;
    platformData[platform].revenue += stat.revenue || 0;
    platformData[platform].publishCount++;

    totalViews += stat.views || 0;
    totalClicks += stat.clicks || 0;
    totalConversions += stat.conversions || 0;
    totalRevenue += stat.revenue || 0;
  });

  return {
    totalViews,
    totalClicks,
    totalConversions,
    totalRevenue,
    platformStats: Object.values(platformData),
  };
}

export default router;
