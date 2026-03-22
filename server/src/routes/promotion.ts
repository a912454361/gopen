/**
 * 用户端推广API路由
 * 包含：申请推广员、获取推广信息、统计数据、提现等
 */

import express, { type Request, type Response, Router } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

/**
 * GET /api/v1/promotion/info
 * 获取推广员信息
 * Query: userId
 */
router.get('/info', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }

    // 检查是否是推广员
    const { data: promoter, error } = await client
      .from('promoters')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !promoter) {
      return res.json({
        success: true,
        isPromoter: false,
        data: null
      });
    }

    res.json({
      success: true,
      isPromoter: promoter.status === 'active',
      data: {
        id: promoter.id,
        promoter_code: promoter.promoter_code,
        status: promoter.status,
        total_clicks: promoter.total_clicks || 0,
        total_conversions: promoter.total_conversions || 0,
        total_earnings: promoter.total_earnings || 0,
        available_earnings: promoter.available_earnings || 0,
        commission_rate: promoter.commission_rate || 0.10,
      }
    });
  } catch (error) {
    console.error('Get promotion info error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * GET /api/v1/promotion/stats
 * 获取推广统计数据
 * Query: userId
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }

    // 获取推广员信息
    const { data: promoter } = await client
      .from('promoters')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.json({ success: false, error: '不是推广员' });
    }

    const promoterId = promoter.id;

    // 获取今日日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 获取本月日期范围
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartISO = monthStart.toISOString();

    // 今日点击
    const { count: todayClicks } = await client
      .from('promotion_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)
      .gte('click_time', todayISO);

    // 今日转化
    const { count: todayConversions } = await client
      .from('promotion_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)
      .gte('conversion_time', todayISO);

    // 今日收益
    const { data: todayEarningsData } = await client
      .from('promotion_earnings')
      .select('amount')
      .eq('promoter_id', promoterId)
      .gte('earned_at', todayISO);

    const todayEarnings = todayEarningsData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    // 本月点击
    const { count: monthClicks } = await client
      .from('promotion_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)
      .gte('click_time', monthStartISO);

    // 本月转化
    const { count: monthConversions } = await client
      .from('promotion_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)
      .gte('conversion_time', monthStartISO);

    // 本月收益
    const { data: monthEarningsData } = await client
      .from('promotion_earnings')
      .select('amount')
      .eq('promoter_id', promoterId)
      .gte('earned_at', monthStartISO);

    const monthEarnings = monthEarningsData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    // 总点击和转化（用于计算转化率）
    const { count: totalClicks } = await client
      .from('promotion_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId);

    const { count: totalConversions } = await client
      .from('promotion_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId);

    // 可提现金额
    const { data: promoterData } = await client
      .from('promoters')
      .select('available_earnings')
      .eq('id', promoterId)
      .single();

    const conversionRate = totalClicks ? ((totalConversions || 0) / totalClicks * 100).toFixed(1) : '0';

    res.json({
      success: true,
      data: {
        todayClicks: todayClicks || 0,
        todayConversions: todayConversions || 0,
        todayEarnings,
        todayEarningsYuan: (todayEarnings / 100).toFixed(2),
        monthClicks: monthClicks || 0,
        monthConversions: monthConversions || 0,
        monthEarnings,
        monthEarningsYuan: (monthEarnings / 100).toFixed(2),
        conversionRate: `${conversionRate}%`,
        availableEarnings: promoterData?.available_earnings || 0,
        availableEarningsYuan: ((promoterData?.available_earnings || 0) / 100).toFixed(2),
      }
    });
  } catch (error) {
    console.error('Get promotion stats error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * GET /api/v1/promotion/link
 * 获取推广链接和二维码
 * Query: userId
 */
router.get('/link', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }

    // 获取推广员信息
    const { data: promoter } = await client
      .from('promoters')
      .select('id, promoter_code')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.json({ success: false, error: '不是推广员' });
    }

    // 获取推广链接
    const { data: linkData } = await client
      .from('promo_links')
      .select('link, qr_code_url')
      .eq('promoter_id', promoter.id)
      .single();

    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://guotao.netlify.app';
    const promoterLink = linkData?.link || `${baseUrl}?ref=${promoter.promoter_code}`;
    const qrCodeUrl = linkData?.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(promoterLink)}`;

    res.json({
      success: true,
      data: {
        link: promoterLink,
        qrCode: qrCodeUrl,
      }
    });
  } catch (error) {
    console.error('Get promotion link error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * GET /api/v1/promotion/users
 * 获取推广用户列表
 * Query: userId, pageSize, page
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { userId, pageSize = '20', page = '1' } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }

    // 获取推广员信息
    const { data: promoter } = await client
      .from('promoters')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.json({ success: false, error: '不是推广员' });
    }

    const limit = parseInt(pageSize as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limit;

    // 获取推广转化记录
    const { data: conversions, error } = await client
      .from('promotion_conversions')
      .select(`
        id,
        conversion_time,
        total_spent,
        total_commission,
        converted_user:converted_user_id (
          id,
          device_id,
          member_level,
          created_at
        )
      `)
      .eq('promoter_id', promoter.id)
      .order('conversion_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get promotion users error:', error);
      return res.json({ success: true, data: { list: [] } });
    }

    res.json({
      success: true,
      data: {
        list: conversions || [],
        total: conversions?.length || 0,
      }
    });
  } catch (error) {
    console.error('Get promotion users error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * GET /api/v1/promotion/withdrawals
 * 获取提现记录
 * Query: userId, pageSize, page
 */
router.get('/withdrawals', async (req: Request, res: Response) => {
  try {
    const { userId, pageSize = '20', page = '1' } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }

    // 获取推广员信息
    const { data: promoter } = await client
      .from('promoters')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.json({ success: false, error: '不是推广员' });
    }

    const limit = parseInt(pageSize as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limit;

    // 获取提现记录
    const { data: withdrawals, error } = await client
      .from('promotion_withdrawals')
      .select('*')
      .eq('promoter_id', promoter.id)
      .order('applied_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get withdrawals error:', error);
      return res.json({ success: true, data: { list: [] } });
    }

    res.json({
      success: true,
      data: {
        list: withdrawals || [],
        total: withdrawals?.length || 0,
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * POST /api/v1/promotion/apply
 * 申请成为推广员
 * Body: userId
 */
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }

    // 检查是否已经是推广员
    const { data: existing } = await client
      .from('promoters')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.json({ success: true, message: '已经是推广员' });
    }

    // 生成推广码
    const promoterCode = `GO${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // 创建推广员记录
    const { data: promoter, error } = await client
      .from('promoters')
      .insert({
        user_id: userId,
        promoter_code: promoterCode,
        status: 'active',
        commission_rate: 0.10,
        total_clicks: 0,
        total_conversions: 0,
        total_earnings: 0,
        available_earnings: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Create promoter error:', error);
      return res.status(500).json({ success: false, error: '申请失败' });
    }

    // 创建推广链接
    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'https://guotao.netlify.app';
    const promoterLink = `${baseUrl}?ref=${promoterCode}`;

    await client
      .from('promo_links')
      .insert({
        promoter_id: promoter.id,
        link: promoterLink,
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(promoterLink)}`,
      });

    res.json({
      success: true,
      message: '申请成功',
      data: promoter
    });
  } catch (error) {
    console.error('Apply promoter error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * POST /api/v1/promotion/withdraw
 * 提交提现申请
 * Body: userId, amount, paymentMethod, paymentAccount, paymentName
 */
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { userId, amount, paymentMethod, paymentAccount, paymentName } = req.body;

    if (!userId || !amount || !paymentMethod || !paymentAccount || !paymentName) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    // 获取推广员信息
    const { data: promoter } = await client
      .from('promoters')
      .select('id, available_earnings')
      .eq('user_id', userId)
      .single();

    if (!promoter) {
      return res.json({ success: false, error: '不是推广员' });
    }

    // 检查余额
    if (amount > (promoter.available_earnings || 0)) {
      return res.json({ success: false, error: '余额不足' });
    }

    // 创建提现记录
    const { error: insertError } = await client
      .from('promotion_withdrawals')
      .insert({
        promoter_id: promoter.id,
        amount,
        status: 'pending',
        payment_method: paymentMethod,
        payment_account: paymentAccount,
        payment_name: paymentName,
        applied_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Create withdrawal error:', insertError);
      return res.status(500).json({ success: false, error: '申请失败' });
    }

    // 扣除可用余额
    await client
      .from('promoters')
      .update({
        available_earnings: (promoter.available_earnings || 0) - amount,
      })
      .eq('id', promoter.id);

    res.json({
      success: true,
      message: '提现申请已提交'
    });
  } catch (error) {
    console.error('Submit withdrawal error:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

/**
 * GET /api/v1/promotion/click
 * 记录推广点击（用于推广链接访问）
 * Query: ref (推广码)
 */
router.get('/click', async (req: Request, res: Response) => {
  try {
    const { ref } = req.query;

    if (!ref) {
      return res.redirect('/');
    }

    // 获取推广员ID
    const { data: promoter } = await client
      .from('promoters')
      .select('id')
      .eq('promoter_code', ref)
      .single();

    if (promoter) {
      // 记录点击
      await client
        .from('promotion_clicks')
        .insert({
          promoter_id: promoter.id,
          click_time: new Date().toISOString(),
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'] || '',
        });

      // 更新点击计数
      await client
        .from('promoters')
        .update({
          total_clicks: client.rpc('increment_clicks', { row_id: promoter.id }),
        })
        .eq('id', promoter.id);
    }

    // 重定向到首页
    res.redirect('/');
  } catch (error) {
    console.error('Record click error:', error);
    res.redirect('/');
  }
});

export default router;
