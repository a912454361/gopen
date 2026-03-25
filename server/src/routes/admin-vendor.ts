/**
 * 管理员后台 - 厂商管理 API
 * 包含厂商审核、服务审核、平台定价等功能
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// 验证管理员权限
const verifyAdmin = (key: string): boolean => {
  const ADMIN_KEY = process.env.ADMIN_KEY || 'GtAdmin2024SecretKey8888';
  return key === ADMIN_KEY;
};

// ==================== 厂商管理 ====================

/**
 * 获取厂商列表
 * GET /api/v1/admin/vendors
 */
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const { adminKey, status } = req.query;

    if (!verifyAdmin(adminKey as string)) {
      return res.status(403).json({ error: '无权限' });
    }

    let query = client
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: vendors, error } = await query.limit(100);

    if (error) {
      console.error('Query vendors error:', error);
      return res.status(500).json({ error: '查询失败' });
    }

    res.json({ success: true, data: vendors || [] });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: '获取厂商列表失败' });
  }
});

/**
 * 获取厂商详情
 * GET /api/v1/admin/vendors/:id
 */
router.get('/vendors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminKey } = req.query;

    if (!verifyAdmin(adminKey as string)) {
      return res.status(403).json({ error: '无权限' });
    }

    const { data: vendor, error } = await client
      .from('vendors')
      .select(`
        *,
        users:user_id (id, nickname, phone, email, avatar, created_at)
      `)
      .eq('id', id)
      .single();

    if (error || !vendor) {
      return res.status(404).json({ error: '厂商不存在' });
    }

    // 获取厂商的服务统计
    const { data: services } = await client
      .from('vendor_services')
      .select('id, status, service_type, total_calls, total_revenue')
      .eq('vendor_id', id);

    const serviceStats = {
      total: services?.length || 0,
      active: services?.filter(s => s.status === 'active').length || 0,
      pending: services?.filter(s => s.status === 'pending').length || 0,
      totalCalls: services?.reduce((sum, s) => sum + (s.total_calls || 0), 0) || 0,
      totalRevenue: services?.reduce((sum, s) => sum + (s.total_revenue || 0), 0) || 0,
    };

    res.json({
      success: true,
      data: {
        ...vendor,
        serviceStats,
      },
    });
  } catch (error) {
    console.error('Get vendor detail error:', error);
    res.status(500).json({ error: '获取厂商详情失败' });
  }
});

/**
 * 审核厂商（通过/拒绝）
 * POST /api/v1/admin/vendors/:id/review
 */
router.post('/vendors/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminKey, action, reason } = req.body;

    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: '无效的操作' });
    }

    // 获取厂商信息
    const { data: vendor } = await client
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (!vendor) {
      return res.status(404).json({ error: '厂商不存在' });
    }

    // 更新状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updateData: any = {
      status: newStatus,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (action === 'reject' && reason) {
      updateData.reject_reason = reason;
    }

    const { error } = await client
      .from('vendors')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Update vendor status error:', error);
      return res.status(500).json({ error: '审核失败' });
    }

    // 如果拒绝，更新用户角色
    if (action === 'reject') {
      await client
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', vendor.user_id);
    }

    // 记录日志
    await client.from('admin_logs').insert([{
      operator_id: 'admin',
      operator_role: 'admin',
      action: `vendor_${action}`,
      target_type: 'vendor',
      target_id: id,
      details: action === 'approve' ? '厂商审核通过' : `厂商审核拒绝: ${reason}`,
    }]);

    res.json({
      success: true,
      message: action === 'approve' ? '厂商已通过审核' : '厂商已拒绝',
    });
  } catch (error) {
    console.error('Review vendor error:', error);
    res.status(500).json({ error: '审核失败' });
  }
});

/**
 * 暂停/恢复厂商
 * POST /api/v1/admin/vendors/:id/suspend
 */
router.post('/vendors/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminKey, reason } = req.body;

    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    const { error } = await client
      .from('vendors')
      .update({
        status: 'suspended',
        reject_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: '操作失败' });
    }

    // 下架所有服务
    await client
      .from('vendor_services')
      .update({ status: 'suspended' })
      .eq('vendor_id', id);

    // 记录日志
    await client.from('admin_logs').insert([{
      operator_id: 'admin',
      operator_role: 'admin',
      action: 'vendor_suspend',
      target_type: 'vendor',
      target_id: id,
      details: `暂停厂商: ${reason}`,
    }]);

    res.json({ success: true, message: '厂商已暂停' });
  } catch (error) {
    console.error('Suspend vendor error:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// ==================== 服务管理 ====================

/**
 * 获取待审核服务列表
 * GET /api/v1/admin/services/pending
 */
router.get('/services/pending', async (req: Request, res: Response) => {
  try {
    const { adminKey } = req.query;

    if (!verifyAdmin(adminKey as string)) {
      return res.status(403).json({ error: '无权限' });
    }

    const { data: services, error } = await client
      .from('vendor_services')
      .select(`
        *,
        vendors!inner(id, company_name, contact_name, status)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Query pending services error:', error);
      return res.status(500).json({ error: '查询失败' });
    }

    res.json({ success: true, data: services || [] });
  } catch (error) {
    console.error('Get pending services error:', error);
    res.status(500).json({ error: '获取待审核服务失败' });
  }
});

/**
 * 获取所有服务列表
 * GET /api/v1/admin/services
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const { adminKey, status, vendorId, type } = req.query;

    if (!verifyAdmin(adminKey as string)) {
      return res.status(403).json({ error: '无权限' });
    }

    let query = client
      .from('vendor_services')
      .select(`
        *,
        vendors!inner(id, company_name, contact_name)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    if (type && type !== 'all') {
      query = query.eq('service_type', type);
    }

    const { data: services, error } = await query.limit(200);

    if (error) {
      console.error('Query services error:', error);
      return res.status(500).json({ error: '查询失败' });
    }

    // 隐藏敏感信息
    const safeServices = (services || []).map(s => ({
      ...s,
      api_key_encrypted: undefined,
      api_key_iv: undefined,
    }));

    res.json({ success: true, data: safeServices });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: '获取服务列表失败' });
  }
});

/**
 * 审核服务（通过/拒绝）
 * POST /api/v1/admin/services/:id/review
 */
router.post('/services/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminKey, action, reason, platformMarkup, platformFixedFee } = req.body;

    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: '无效的操作' });
    }

    // 获取服务信息
    const { data: service } = await client
      .from('vendor_services')
      .select('*')
      .eq('id', id)
      .single();

    if (!service) {
      return res.status(404).json({ error: '服务不存在' });
    }

    // 计算最终价格
    const markup = platformMarkup ?? service.platform_markup ?? 30;
    const fixedFee = platformFixedFee ?? service.platform_fixed_fee ?? 0;

    const updateData: any = {
      status: action === 'approve' ? 'active' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'admin',
      updated_at: new Date().toISOString(),
      platform_markup: markup,
      platform_fixed_fee: fixedFee,
    };

    if (action === 'approve') {
      // 计算最终售价
      updateData.final_input_price = Math.ceil(service.input_price * (1 + markup / 100)) + fixedFee;
      updateData.final_output_price = Math.ceil(service.output_price * (1 + markup / 100)) + fixedFee;
    }

    if (action === 'reject' && reason) {
      updateData.reject_reason = reason;
    }

    const { error } = await client
      .from('vendor_services')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Update service status error:', error);
      return res.status(500).json({ error: '审核失败' });
    }

    // 更新厂商活跃服务数量
    if (action === 'approve') {
      // 获取活跃服务数量
      const { count: activeServicesCount } = await client
        .from('vendor_services')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', service.vendor_id)
        .eq('status', 'active');

      await client
        .from('vendors')
        .update({ active_services: activeServicesCount || 0 })
        .eq('id', service.vendor_id);
    }

    // 记录日志
    await client.from('admin_logs').insert([{
      operator_id: 'admin',
      operator_role: 'admin',
      action: `service_${action}`,
      target_type: 'service',
      target_id: id,
      details: action === 'approve' 
        ? `服务上架审核通过，加价${markup}%，固定费用${fixedFee}分` 
        : `服务审核拒绝: ${reason}`,
    }]);

    res.json({
      success: true,
      message: action === 'approve' ? '服务已上架' : '服务已拒绝',
      data: action === 'approve' ? {
        finalInputPrice: updateData.final_input_price,
        finalOutputPrice: updateData.final_output_price,
      } : undefined,
    });
  } catch (error) {
    console.error('Review service error:', error);
    res.status(500).json({ error: '审核失败' });
  }
});

/**
 * 更新服务定价（管理员强制修改）
 * PUT /api/v1/admin/services/:id/pricing
 */
router.put('/services/:id/pricing', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminKey, platformMarkup, platformFixedFee } = req.body;

    if (!verifyAdmin(adminKey)) {
      return res.status(403).json({ error: '无权限' });
    }

    // 获取服务信息
    const { data: service } = await client
      .from('vendor_services')
      .select('*')
      .eq('id', id)
      .single();

    if (!service) {
      return res.status(404).json({ error: '服务不存在' });
    }

    const markup = platformMarkup ?? service.platform_markup ?? 30;
    const fixedFee = platformFixedFee ?? service.platform_fixed_fee ?? 0;

    // 计算最终价格
    const finalInputPrice = Math.ceil(service.input_price * (1 + markup / 100)) + fixedFee;
    const finalOutputPrice = Math.ceil(service.output_price * (1 + markup / 100)) + fixedFee;

    const { error } = await client
      .from('vendor_services')
      .update({
        platform_markup: markup,
        platform_fixed_fee: fixedFee,
        final_input_price: finalInputPrice,
        final_output_price: finalOutputPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: '更新失败' });
    }

    // 记录日志
    await client.from('admin_logs').insert([{
      operator_id: 'admin',
      operator_role: 'admin',
      action: 'service_pricing_update',
      target_type: 'service',
      target_id: id,
      details: `更新定价: 加价${markup}%, 固定费用${fixedFee}分`,
    }]);

    res.json({
      success: true,
      message: '定价已更新',
      data: {
        finalInputPrice,
        finalOutputPrice,
      },
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// ==================== 统计面板 ====================

/**
 * 获取厂商平台统计
 * GET /api/v1/admin/vendor-stats
 */
router.get('/vendor-stats', async (req: Request, res: Response) => {
  try {
    const { adminKey } = req.query;

    if (!verifyAdmin(adminKey as string)) {
      return res.status(403).json({ error: '无权限' });
    }

    // 厂商统计
    const { data: vendors } = await client
      .from('vendors')
      .select('id, status');

    const vendorStats = {
      total: vendors?.length || 0,
      pending: vendors?.filter(v => v.status === 'pending').length || 0,
      approved: vendors?.filter(v => v.status === 'approved').length || 0,
      rejected: vendors?.filter(v => v.status === 'rejected').length || 0,
      suspended: vendors?.filter(v => v.status === 'suspended').length || 0,
    };

    // 服务统计
    const { data: services } = await client
      .from('vendor_services')
      .select('id, status, service_type, total_calls, total_revenue');

    const serviceStats = {
      total: services?.length || 0,
      pending: services?.filter(s => s.status === 'pending').length || 0,
      active: services?.filter(s => s.status === 'active').length || 0,
      byType: {
        llm: services?.filter(s => s.service_type === 'llm').length || 0,
        image: services?.filter(s => s.service_type === 'image').length || 0,
        video: services?.filter(s => s.service_type === 'video').length || 0,
        audio: services?.filter(s => s.service_type === 'audio').length || 0,
        embedding: services?.filter(s => s.service_type === 'embedding').length || 0,
      },
      totalCalls: services?.reduce((sum, s) => sum + (s.total_calls || 0), 0) || 0,
      totalRevenue: services?.reduce((sum, s) => sum + (s.total_revenue || 0), 0) || 0,
    };

    // 今日调用统计
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLogs } = await client
      .from('service_call_logs')
      .select('id, total_cost')
      .gte('created_at', today);

    const todayStats = {
      calls: todayLogs?.length || 0,
      revenue: todayLogs?.reduce((sum, l) => sum + (l.total_cost || 0), 0) || 0,
    };

    // 待处理事项
    const pendingItems = {
      vendors: vendorStats.pending,
      services: serviceStats.pending,
    };

    res.json({
      success: true,
      data: {
        vendorStats,
        serviceStats,
        todayStats,
        pendingItems,
      },
    });
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

/**
 * 获取平台收入统计
 * GET /api/v1/admin/platform-revenue
 */
router.get('/platform-revenue', async (req: Request, res: Response) => {
  try {
    const { adminKey, period } = req.query;

    if (!verifyAdmin(adminKey as string)) {
      return res.status(403).json({ error: '无权限' });
    }

    // 获取时间范围
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }

    // 获取调用日志
    const { data: logs } = await client
      .from('service_call_logs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    // 计算统计
    const totalCalls = logs?.length || 0;
    const successCalls = logs?.filter(l => l.success).length || 0;
    const totalRevenue = logs?.reduce((sum, l) => sum + (l.total_cost || 0), 0) || 0;
    const platformFee = logs?.reduce((sum, l) => sum + (l.platform_fee || 0), 0) || 0;
    const vendorRevenue = totalRevenue - platformFee;

    // 按厂商分组
    const vendorRevenueMap: Record<string, any> = {};
    logs?.forEach(log => {
      if (!vendorRevenueMap[log.vendor_id]) {
        vendorRevenueMap[log.vendor_id] = {
          vendorId: log.vendor_id,
          calls: 0,
          revenue: 0,
          platformFee: 0,
        };
      }
      vendorRevenueMap[log.vendor_id].calls++;
      vendorRevenueMap[log.vendor_id].revenue += log.total_cost || 0;
      vendorRevenueMap[log.vendor_id].platformFee += log.platform_fee || 0;
    });

    // 获取厂商名称
    const vendorIds = Object.keys(vendorRevenueMap);
    const { data: vendors } = await client
      .from('vendors')
      .select('id, company_name')
      .in('id', vendorIds);

    const vendorDetails = vendorIds.map(id => ({
      ...vendorRevenueMap[id],
      companyName: vendors?.find(v => v.id === id)?.company_name,
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalCalls,
          successCalls,
          successRate: totalCalls > 0 ? (successCalls / totalCalls * 100).toFixed(2) : 0,
          totalRevenue: totalRevenue / 100,
          platformFee: platformFee / 100,
          vendorRevenue: vendorRevenue / 100,
        },
        byVendor: vendorDetails.map(v => ({
          ...v,
          revenue: v.revenue / 100,
          platformFee: v.platformFee / 100,
        })),
      },
    });
  } catch (error) {
    console.error('Get platform revenue error:', error);
    res.status(500).json({ error: '获取收入统计失败' });
  }
});

export default router;
