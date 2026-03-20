/**
 * 推广系统 API 路由
 * 包含：推广员管理、推广链接、点击追踪、转化追踪、收益计算、提现
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// 生成推广码
const generatePromoterCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GOP_';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ==================== 推广员相关 ====================

/**
 * 申请成为推广员
 * POST /api/v1/promotion/apply
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { userId, paymentMethod, paymentAccount, paymentName } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 检查用户是否存在
    const { data: user } = await client
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 检查是否已经是推广员
    const { data: existingPromoter } = await client
      .from('promoters')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingPromoter) {
      return res.json({ 
        success: true, 
        message: '已经是推广员',
        data: existingPromoter 
      });
    }

    // 创建推广员
    const promoterCode = generatePromoterCode();
    const { data: promoter, error } = await client
      .from('promoters')
      .insert([{
        user_id: userId,
        promoter_code: promoterCode,
        status: 'active',
        commission_rate: 0.10, // 默认10%分成
      }])
      .select()
      .single();

    if (error) {
      console.error('Create promoter error:', error);
      return res.status(500).json({ error: '创建推广员失败' });
    }

    res.json({ 
      success: true, 
      message: '申请成功',
      data: promoter 
    });
  } catch (error) {
    console.error('Apply promoter error:', error);
    res.status(500).json({ error: '申请失败' });
  }
});

/**
 * 获取推广员信息
 * GET /api/v1/promotion/info
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    const { data: promoter, error } = await client
      .from('promoters')
      .select(`
        *,
        users:id!promoters_user_id_fkey (device_id, member_level)
      `)
      .eq('user_id', userId)
      .single();

    if (error || !promoter) {
      return res.json({ 
        success: false, 
        isPromoter: false,
        message: '还不是推广员' 
      });
    }

    // 获取可提现金额
    const { data: earnings } = await client
      .from('promotion_earnings')
      .select('commission')
      .eq('promoter_id', promoter.id)
      .eq('status', 'confirmed');

    const availableEarnings = (earnings || []).reduce((sum, e) => sum + (e.commission || 0), 0);

    res.json({ 
      success: true, 
      isPromoter: true,
      data: {
        ...promoter,
        available_earnings: availableEarnings,
        available_earnings_yuan: (availableEarnings / 100).toFixed(2),
      }
    });
  } catch (error) {
    console.error('Get promoter info error:', error);
    res.status(500).json({ error: '获取信息失败' });
  }
});

/**
 * 获取推广链接
 * GET /api/v1/promotion/link
 */
router.get('/link', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    const { data: promoter } = await client
      .from('promoters')
      .select('promoter_code, status')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.status(404).json({ error: '不是推广员' });
    }

    // 生成推广链接
    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://gopen.ai';
    const promoterLink = `${baseUrl}?ref=${promoter.promoter_code}`;

    res.json({
      success: true,
      data: {
        code: promoter.promoter_code,
        link: promoterLink,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(promoterLink)}`,
        status: promoter.status,
      }
    });
  } catch (error) {
    console.error('Get promotion link error:', error);
    res.status(500).json({ error: '获取链接失败' });
  }
});

// ==================== 点击追踪 ====================

/**
 * 记录推广点击
 * POST /api/v1/promotion/click
 */
router.post('/click', async (req: Request, res: Response) => {
  try {
    const { ref, visitorIp, visitorDevice, visitorUa, referrer } = req.body;

    if (!ref) {
      return res.status(400).json({ error: '缺少推广码' });
    }

    // 查找推广员
    const { data: promoter } = await client
      .from('promoters')
      .select('id, status')
      .eq('promoter_code', ref)
      .single();

    if (!promoter) {
      return res.status(404).json({ error: '推广码无效' });
    }

    if (promoter.status !== 'active') {
      return res.status(400).json({ error: '推广员状态异常' });
    }

    // 记录点击
    const { data: click, error } = await client
      .from('promotion_clicks')
      .insert([{
        promoter_id: promoter.id,
        visitor_ip: visitorIp,
        visitor_device: visitorDevice,
        visitor_ua: visitorUa,
        referrer: referrer,
      }])
      .select()
      .single();

    if (error) {
      console.error('Record click error:', error);
      return res.status(500).json({ error: '记录点击失败' });
    }

    res.json({ 
      success: true, 
      clickId: click.id,
      message: '点击已记录' 
    });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: '追踪失败' });
  }
});

/**
 * 验证推广码
 * GET /api/v1/promotion/verify/:code
 */
router.get('/verify/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const { data: promoter } = await client
      .from('promoters')
      .select('id, promoter_code, status')
      .eq('promoter_code', code)
      .single();

    if (!promoter) {
      return res.json({ 
        success: false, 
        valid: false,
        message: '推广码无效' 
      });
    }

    if (promoter.status !== 'active') {
      return res.json({ 
        success: false, 
        valid: false,
        message: '推广码已失效' 
      });
    }

    res.json({ 
      success: true, 
      valid: true,
      promoterCode: promoter.promoter_code
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: '验证失败' });
  }
});

// ==================== 转化追踪 ====================

/**
 * 记录转化（用户注册时调用）
 * POST /api/v1/promotion/convert
 */
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { userId, promoterCode, clickId } = req.body;

    if (!userId || !promoterCode) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 查找推广员
    const { data: promoter } = await client
      .from('promoters')
      .select('id')
      .eq('promoter_code', promoterCode)
      .single();

    if (!promoter) {
      return res.json({ success: false, message: '推广码无效' });
    }

    // 检查用户是否已被转化
    const { data: existingConversion } = await client
      .from('promotion_conversions')
      .select('id')
      .eq('converted_user_id', userId)
      .single();

    if (existingConversion) {
      return res.json({ success: false, message: '用户已被转化' });
    }

    // 创建转化记录
    const { data: conversion, error } = await client
      .from('promotion_conversions')
      .insert([{
        promoter_id: promoter.id,
        click_id: clickId,
        converted_user_id: userId,
      }])
      .select()
      .single();

    if (error) {
      console.error('Create conversion error:', error);
      return res.status(500).json({ error: '创建转化记录失败' });
    }

    // 更新点击记录为已转化
    if (clickId) {
      await client
        .from('promotion_clicks')
        .update({ converted: true, converted_user_id: userId })
        .eq('id', clickId);
    }

    res.json({ 
      success: true, 
      conversionId: conversion.id,
      message: '转化记录成功' 
    });
  } catch (error) {
    console.error('Record conversion error:', error);
    res.status(500).json({ error: '记录转化失败' });
  }
});

// ==================== 收益相关 ====================

/**
 * 获取收益明细
 * GET /api/v1/promotion/earnings
 */
router.get('/earnings', async (req: Request, res: Response) => {
  try {
    const { userId, page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 获取推广员ID
    const { data: promoter } = await client
      .from('promoters')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.status(404).json({ error: '不是推广员' });
    }

    // 获取收益记录
    const offset = (Number(page) - 1) * Number(pageSize);
    const { data: earnings, count } = await client
      .from('promotion_earnings')
      .select(`
        *,
        users:user_id (device_id)
      `, { count: 'exact' })
      .eq('promoter_id', promoter.id)
      .order('earned_at', { ascending: false })
      .range(offset, offset + Number(pageSize) - 1);

    // 统计
    const { data: stats } = await client
      .from('promotion_earnings')
      .select('commission, status')
      .eq('promoter_id', promoter.id);

    const totalCommission = (stats || []).reduce((sum, e) => sum + (e.commission || 0), 0);
    const pendingCommission = (stats || []).filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.commission || 0), 0);
    const confirmedCommission = (stats || []).filter(e => e.status === 'confirmed').reduce((sum, e) => sum + (e.commission || 0), 0);

    res.json({
      success: true,
      data: {
        list: earnings || [],
        total: count || 0,
        stats: {
          totalCommission,
          totalCommissionYuan: (totalCommission / 100).toFixed(2),
          pendingCommission,
          pendingCommissionYuan: (pendingCommission / 100).toFixed(2),
          confirmedCommission,
          confirmedCommissionYuan: (confirmedCommission / 100).toFixed(2),
        }
      }
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: '获取收益失败' });
  }
});

/**
 * 获取推广用户列表
 * GET /api/v1/promotion/users
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { userId, page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 获取推广员ID
    const { data: promoter } = await client
      .from('promoters')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.status(404).json({ error: '不是推广员' });
    }

    // 获取转化的用户
    const offset = (Number(page) - 1) * Number(pageSize);
    const { data: conversions, count } = await client
      .from('promotion_conversions')
      .select(`
        *,
        converted_user:users!promotion_conversions_converted_user_id_fkey (
          id,
          device_id,
          member_level,
          created_at
        )
      `, { count: 'exact' })
      .eq('promoter_id', promoter.id)
      .order('conversion_time', { ascending: false })
      .range(offset, offset + Number(pageSize) - 1);

    res.json({
      success: true,
      data: {
        list: conversions || [],
        total: count || 0,
      }
    });
  } catch (error) {
    console.error('Get promotion users error:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// ==================== 提现相关 ====================

/**
 * 申请提现
 * POST /api/v1/promotion/withdraw
 */
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { userId, amount, paymentMethod, paymentAccount, paymentName } = req.body;

    if (!userId || !amount || !paymentMethod || !paymentAccount || !paymentName) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 最低提现金额 10元
    if (amount < 1000) {
      return res.status(400).json({ error: '最低提现金额为10元' });
    }

    // 获取推广员信息
    const { data: promoter } = await client
      .from('promoters')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.status(404).json({ error: '不是推广员' });
    }

    // 检查可提现金额
    const { data: confirmedEarnings } = await client
      .from('promotion_earnings')
      .select('commission')
      .eq('promoter_id', promoter.id)
      .eq('status', 'confirmed');

    const availableAmount = (confirmedEarnings || []).reduce((sum, e) => sum + (e.commission || 0), 0);

    if (amount > availableAmount) {
      return res.status(400).json({ error: `可提现金额不足，当前可提现: ¥${(availableAmount / 100).toFixed(2)}` });
    }

    // 创建提现申请
    const { data: withdrawal, error } = await client
      .from('promotion_withdrawals')
      .insert([{
        promoter_id: promoter.id,
        amount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_account: paymentAccount,
        payment_name: paymentName,
      }])
      .select()
      .single();

    if (error) {
      console.error('Create withdrawal error:', error);
      return res.status(500).json({ error: '申请提现失败' });
    }

    // 标记收益为已支付
    // 按时间顺序标记
    const { data: earningsToPay } = await client
      .from('promotion_earnings')
      .select('id, commission')
      .eq('promoter_id', promoter.id)
      .eq('status', 'confirmed')
      .order('earned_at', { ascending: true });

    let remaining = amount;
    for (const earning of (earningsToPay || [])) {
      if (remaining <= 0) break;
      
      await client
        .from('promotion_earnings')
        .update({ status: 'paid' })
        .eq('id', earning.id);
      
      remaining -= earning.commission;
    }

    res.json({ 
      success: true, 
      data: withdrawal,
      message: '提现申请已提交，预计1-3个工作日到账' 
    });
  } catch (error) {
    console.error('Apply withdrawal error:', error);
    res.status(500).json({ error: '申请提现失败' });
  }
});

/**
 * 获取提现记录
 * GET /api/v1/promotion/withdrawals
 */
router.get('/withdrawals', async (req: Request, res: Response) => {
  try {
    const { userId, page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 获取推广员ID
    const { data: promoter } = await client
      .from('promoters')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.status(404).json({ error: '不是推广员' });
    }

    const offset = (Number(page) - 1) * Number(pageSize);
    const { data: withdrawals, count } = await client
      .from('promotion_withdrawals')
      .select('*', { count: 'exact' })
      .eq('promoter_id', promoter.id)
      .order('applied_at', { ascending: false })
      .range(offset, offset + Number(pageSize) - 1);

    res.json({
      success: true,
      data: {
        list: withdrawals || [],
        total: count || 0,
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: '获取提现记录失败' });
  }
});

// ==================== 统计相关 ====================

/**
 * 获取推广统计数据
 * GET /api/v1/promotion/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 获取推广员信息
    const { data: promoter } = await client
      .from('promoters')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.json({ 
        success: false, 
        isPromoter: false,
        message: '还不是推广员' 
      });
    }

    // 获取今日统计
    const today = new Date().toISOString().split('T')[0];
    const { data: todayClicks } = await client
      .from('promotion_clicks')
      .select('id')
      .eq('promoter_id', promoter.id)
      .gte('click_time', today);

    const { data: todayConversions } = await client
      .from('promotion_conversions')
      .select('id')
      .eq('promoter_id', promoter.id)
      .gte('conversion_time', today);

    const { data: todayEarnings } = await client
      .from('promotion_earnings')
      .select('commission')
      .eq('promoter_id', promoter.id)
      .gte('earned_at', today);

    const todayEarningsAmount = (todayEarnings || []).reduce((sum, e) => sum + (e.commission || 0), 0);

    // 获取本月统计
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: monthClicks } = await client
      .from('promotion_clicks')
      .select('id')
      .eq('promoter_id', promoter.id)
      .gte('click_time', monthStart.toISOString());

    const { data: monthConversions } = await client
      .from('promotion_conversions')
      .select('id')
      .eq('promoter_id', promoter.id)
      .gte('conversion_time', monthStart.toISOString());

    const { data: monthEarnings } = await client
      .from('promotion_earnings')
      .select('commission')
      .eq('promoter_id', promoter.id)
      .gte('earned_at', monthStart.toISOString());

    const monthEarningsAmount = (monthEarnings || []).reduce((sum, e) => sum + (e.commission || 0), 0);

    // 可提现金额
    const { data: confirmedEarnings } = await client
      .from('promotion_earnings')
      .select('commission')
      .eq('promoter_id', promoter.id)
      .eq('status', 'confirmed');

    const availableAmount = (confirmedEarnings || []).reduce((sum, e) => sum + (e.commission || 0), 0);

    res.json({
      success: true,
      isPromoter: true,
      data: {
        promoterCode: promoter.promoter_code,
        status: promoter.status,
        commissionRate: promoter.commission_rate,
        
        // 总计
        totalClicks: promoter.total_clicks || 0,
        totalConversions: promoter.total_conversions || 0,
        totalEarnings: promoter.total_earnings || 0,
        totalEarningsYuan: ((promoter.total_earnings || 0) / 100).toFixed(2),
        availableEarnings: availableAmount,
        availableEarningsYuan: (availableAmount / 100).toFixed(2),
        withdrawnEarnings: promoter.withdrawn_earnings || 0,
        
        // 今日
        todayClicks: todayClicks?.length || 0,
        todayConversions: todayConversions?.length || 0,
        todayEarnings: todayEarningsAmount,
        todayEarningsYuan: (todayEarningsAmount / 100).toFixed(2),
        
        // 本月
        monthClicks: monthClicks?.length || 0,
        monthConversions: monthConversions?.length || 0,
        monthEarnings: monthEarningsAmount,
        monthEarningsYuan: (monthEarningsAmount / 100).toFixed(2),
        
        // 转化率
        conversionRate: promoter.total_clicks > 0 
          ? ((promoter.total_conversions / promoter.total_clicks) * 100).toFixed(2) + '%'
          : '0%',
      }
    });
  } catch (error) {
    console.error('Get promotion stats error:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

export default router;
