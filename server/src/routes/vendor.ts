/**
 * 厂商管理后台 API
 * 包含厂商注册、服务管理、权限验证等功能
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import crypto from 'crypto';

const router = Router();
const client = getSupabaseClient();

// ==================== 工具函数 ====================

/**
 * 验证管理员权限
 */
const verifyAdmin = (key: string): boolean => {
  const ADMIN_KEY = process.env.ADMIN_KEY || 'GtAdmin2024SecretKey8888';
  return key === ADMIN_KEY;
};

/**
 * 验证厂商权限
 */
const verifyVendor = async (userId: string): Promise<{ isVendor: boolean; vendorId?: string }> => {
  try {
    // 检查用户角色
    const { data: role } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!role || role.role !== 'vendor') {
      return { isVendor: false };
    }

    // 获取厂商信息
    const { data: vendor } = await client
      .from('vendors')
      .select('id, status')
      .eq('user_id', userId)
      .single();

    if (!vendor || vendor.status !== 'approved') {
      return { isVendor: false };
    }

    return { isVendor: true, vendorId: vendor.id };
  } catch {
    return { isVendor: false };
  }
};

/**
 * 生成API密钥
 */
const generateApiKey = (): string => {
  return `gopen_${crypto.randomBytes(32).toString('hex')}`;
};

/**
 * 加密API密钥
 */
const encryptApiKey = (apiKey: string): { encrypted: string; iv: string } => {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  const iv = crypto.randomBytes(16).toString('hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv };
};

/**
 * 解密API密钥
 */
const decryptApiKey = (encrypted: string, iv: string): string => {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// ==================== 厂商注册 ====================

const vendorRegisterSchema = z.object({
  userId: z.string(),  // 用户ID
  companyName: z.string().min(2, '公司名称至少2个字符'),
  contactName: z.string().min(2, '联系人至少2个字符'),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('请输入正确的邮箱').optional(),
  businessLicense: z.string().optional(),
  businessLicenseUrl: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankAccountName: z.string().optional(),
});

/**
 * 厂商注册申请
 * POST /api/v1/vendor/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = vendorRegisterSchema.parse(req.body);

    // 检查用户是否已是厂商
    const { data: existingVendor } = await client
      .from('vendors')
      .select('id')
      .eq('user_id', data.userId)
      .single();

    if (existingVendor) {
      return res.status(400).json({ error: '您已注册为厂商' });
    }

    // 创建厂商记录
    const { data: vendor, error: createError } = await client
      .from('vendors')
      .insert([{
        user_id: data.userId,
        company_name: data.companyName,
        contact_name: data.contactName,
        contact_phone: data.contactPhone,
        contact_email: data.contactEmail,
        business_license: data.businessLicense,
        business_license_url: data.businessLicenseUrl,
        description: data.description,
        website: data.website,
        address: data.address,
        bank_name: data.bankName,
        bank_account: data.bankAccount,
        bank_account_name: data.bankAccountName,
        status: 'pending',
      }])
      .select()
      .single();

    if (createError || !vendor) {
      console.error('Create vendor error:', createError);
      return res.status(500).json({ error: '注册失败' });
    }

    // 更新用户角色为厂商
    await client
      .from('user_roles')
      .upsert([{
        user_id: data.userId,
        role: 'vendor',
        permissions: {
          canManageServices: true,
          canViewRevenue: true,
          canManageAccount: true,
        },
      }], { onConflict: 'user_id' });

    // 记录日志
    await client.from('admin_logs').insert([{
      operator_id: data.userId,
      operator_role: 'vendor',
      action: 'vendor_register',
      target_type: 'vendor',
      target_id: vendor.id,
      details: `厂商注册申请: ${data.companyName}`,
    }]);

    res.json({
      success: true,
      message: '注册申请已提交，请等待审核',
      data: {
        vendorId: vendor.id,
        status: vendor.status,
      },
    });
  } catch (error) {
    console.error('Vendor register error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '注册失败' });
  }
});

// ==================== 厂商信息 ====================

/**
 * 获取厂商信息
 * GET /api/v1/vendor/profile
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    const { data: vendor, error } = await client
      .from('vendors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !vendor) {
      return res.status(404).json({ error: '厂商信息不存在' });
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({ error: '获取厂商信息失败' });
  }
});

/**
 * 更新厂商信息
 * PUT /api/v1/vendor/profile
 */
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const { userId, ...updateData } = req.body;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    // 验证厂商权限
    const { isVendor, vendorId } = await verifyVendor(userId);
    if (!isVendor) {
      return res.status(403).json({ error: '无权限' });
    }

    // 更新厂商信息
    const { error } = await client
      .from('vendors')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId);

    if (error) {
      console.error('Update vendor error:', error);
      return res.status(500).json({ error: '更新失败' });
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// ==================== 服务管理 ====================

const createServiceSchema = z.object({
  vendorId: z.string(),
  serviceCode: z.string().min(2, '服务代码至少2个字符'),
  serviceName: z.string().min(2, '服务名称至少2个字符'),
  serviceType: z.enum(['llm', 'image', 'video', 'audio', 'embedding']),
  category: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  documentation: z.string().optional(),
  apiEndpoint: z.string().url('请输入正确的API地址'),
  apiProtocol: z.enum(['openai', 'custom']).default('openai'),
  apiKey: z.string(), // API密钥（明文，会被加密存储）
  apiHeaders: z.record(z.string(), z.any()).optional(),
  apiParams: z.record(z.string(), z.any()).optional(),
  modelMapping: z.record(z.string(), z.any()).optional(),
  maxTokens: z.number().optional(),
  contextWindow: z.number().optional(),
  pricingType: z.enum(['token', 'request', 'second']).default('token'),
  inputPrice: z.number().min(0),
  outputPrice: z.number().min(0),
  requestPrice: z.number().optional(),
  secondPrice: z.number().optional(),
  minimumCharge: z.number().default(0),
  dailyQuota: z.number().optional(),
  rateLimit: z.number().default(60),
  timeout: z.number().default(30000),
});

/**
 * 创建服务
 * POST /api/v1/vendor/services
 */
router.post('/services', async (req: Request, res: Response) => {
  try {
    const data = createServiceSchema.parse(req.body);

    // 检查服务代码是否已存在
    const { data: existingService } = await client
      .from('vendor_services')
      .select('id')
      .eq('service_code', data.serviceCode)
      .single();

    if (existingService) {
      return res.status(400).json({ error: '服务代码已存在' });
    }

    // 加密API密钥
    const { encrypted, iv } = encryptApiKey(data.apiKey);

    // 计算最终价格（加上平台加价，默认30%）
    const { data: vendor } = await client
      .from('vendors')
      .select('id')
      .eq('id', data.vendorId)
      .single();

    if (!vendor) {
      return res.status(400).json({ error: '厂商不存在' });
    }

    // 创建服务
    const { data: service, error: createError } = await client
      .from('vendor_services')
      .insert([{
        vendor_id: data.vendorId,
        service_code: data.serviceCode,
        service_name: data.serviceName,
        service_type: data.serviceType,
        category: data.category,
        description: data.description,
        icon: data.icon,
        documentation: data.documentation,
        api_endpoint: data.apiEndpoint,
        api_protocol: data.apiProtocol,
        api_key_encrypted: encrypted,
        api_key_iv: iv,
        api_headers: data.apiHeaders,
        api_params: data.apiParams,
        model_mapping: data.modelMapping,
        max_tokens: data.maxTokens,
        context_window: data.contextWindow,
        pricing_type: data.pricingType,
        input_price: data.inputPrice,
        output_price: data.outputPrice,
        request_price: data.requestPrice,
        second_price: data.secondPrice,
        minimum_charge: data.minimumCharge,
        daily_quota: data.dailyQuota,
        rate_limit: data.rateLimit,
        timeout: data.timeout,
        status: 'draft', // 默认为草稿状态
      }])
      .select()
      .single();

    if (createError || !service) {
      console.error('Create service error:', createError);
      return res.status(500).json({ error: '创建服务失败' });
    }

    // 更新厂商服务数量
    await client
      .from('vendors')
      .update({
        total_services: (await client.from('vendor_services').select('id', { count: 'exact', head: true }).eq('vendor_id', data.vendorId)).count || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.vendorId);

    // 记录日志
    await client.from('admin_logs').insert([{
      operator_id: data.vendorId,
      operator_role: 'vendor',
      action: 'service_create',
      target_type: 'service',
      target_id: service.id,
      details: `创建服务: ${data.serviceName} (${data.serviceCode})`,
    }]);

    res.json({
      success: true,
      message: '服务创建成功',
      data: {
        serviceId: service.id,
        serviceCode: service.service_code,
        status: service.status,
      },
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '创建失败' });
  }
});

/**
 * 获取厂商服务列表
 * GET /api/v1/vendor/services
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const { vendorId, status, userId } = req.query;

    // 如果传入userId，先获取vendorId
    let targetVendorId = vendorId as string;
    if (!targetVendorId && userId) {
      const { data: vendor } = await client
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();
      targetVendorId = vendor?.id;
    }

    if (!targetVendorId) {
      return res.status(400).json({ error: '缺少厂商ID或用户ID' });
    }

    let query = client
      .from('vendor_services')
      .select('*')
      .eq('vendor_id', targetVendorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: services, error } = await query;

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
 * 获取服务详情
 * GET /api/v1/vendor/services/:id
 */
router.get('/services/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const { data: service, error } = await client
      .from('vendor_services')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !service) {
      return res.status(404).json({ error: '服务不存在' });
    }

    // 验证权限
    if (userId) {
      const { data: vendor } = await client
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendor || vendor.id !== service.vendor_id) {
        return res.status(403).json({ error: '无权限' });
      }
    }

    // 隐藏敏感信息
    const safeService = {
      ...service,
      api_key_encrypted: undefined,
      api_key_iv: undefined,
    };

    res.json({ success: true, data: safeService });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: '获取服务详情失败' });
  }
});

/**
 * 更新服务
 * PUT /api/v1/vendor/services/:id
 */
router.put('/services/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, ...updateData } = req.body;

    // 获取服务信息
    const { data: service } = await client
      .from('vendor_services')
      .select('*, vendors!inner(user_id)')
      .eq('id', id)
      .single();

    if (!service) {
      return res.status(404).json({ error: '服务不存在' });
    }

    // 验证权限
    const { isVendor, vendorId } = await verifyVendor(userId);
    if (!isVendor || vendorId !== service.vendor_id) {
      return res.status(403).json({ error: '无权限' });
    }

    // 处理API密钥加密
    if (updateData.apiKey) {
      const { encrypted, iv } = encryptApiKey(updateData.apiKey);
      updateData.api_key_encrypted = encrypted;
      updateData.api_key_iv = iv;
      delete updateData.apiKey;
    }

    // 更新服务
    const { error } = await client
      .from('vendor_services')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Update service error:', error);
      return res.status(500).json({ error: '更新失败' });
    }

    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * 上架服务（提交审核）
 * POST /api/v1/vendor/services/:id/submit
 */
router.post('/services/:id/submit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // 验证权限
    const { isVendor, vendorId } = await verifyVendor(userId);
    if (!isVendor) {
      return res.status(403).json({ error: '无权限' });
    }

    // 获取服务
    const { data: service } = await client
      .from('vendor_services')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .single();

    if (!service) {
      return res.status(404).json({ error: '服务不存在' });
    }

    if (service.status !== 'draft') {
      return res.status(400).json({ error: '只有草稿状态的服务可以提交审核' });
    }

    // 更新状态为待审核
    const { error } = await client
      .from('vendor_services')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: '提交失败' });
    }

    // 记录日志
    await client.from('admin_logs').insert([{
      operator_id: vendorId,
      operator_role: 'vendor',
      action: 'service_submit',
      target_type: 'service',
      target_id: id,
      details: `提交服务上架审核: ${service.service_name}`,
    }]);

    res.json({ success: true, message: '已提交审核，请等待管理员审批' });
  } catch (error) {
    console.error('Submit service error:', error);
    res.status(500).json({ error: '提交失败' });
  }
});

/**
 * 下架服务
 * POST /api/v1/vendor/services/:id/offline
 */
router.post('/services/:id/offline', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    // 验证权限
    const { isVendor, vendorId } = await verifyVendor(userId);
    if (!isVendor) {
      return res.status(403).json({ error: '无权限' });
    }

    // 更新状态
    const { error } = await client
      .from('vendor_services')
      .update({
        status: 'offline',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('vendor_id', vendorId);

    if (error) {
      return res.status(500).json({ error: '下架失败' });
    }

    // 记录日志
    await client.from('admin_logs').insert([{
      operator_id: vendorId,
      operator_role: 'vendor',
      action: 'service_offline',
      target_type: 'service',
      target_id: id,
      details: `下架服务: ${reason || '厂商主动下架'}`,
    }]);

    res.json({ success: true, message: '服务已下架' });
  } catch (error) {
    console.error('Offline service error:', error);
    res.status(500).json({ error: '下架失败' });
  }
});

// ==================== 收入统计 ====================

/**
 * 获取厂商收入统计
 * GET /api/v1/vendor/revenue
 */
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const { userId, period } = req.query;

    // 验证权限
    const { isVendor, vendorId } = await verifyVendor(userId as string);
    if (!isVendor) {
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
        startDate = new Date(0); // 全部
    }

    // 获取收入统计
    const { data: logs } = await client
      .from('service_call_logs')
      .select('*')
      .eq('vendor_id', vendorId)
      .gte('created_at', startDate.toISOString());

    // 计算统计数据
    const totalCalls = logs?.length || 0;
    const successCalls = logs?.filter(l => l.success).length || 0;
    const totalTokens = logs?.reduce((sum, l) => sum + (l.input_tokens || 0) + (l.output_tokens || 0), 0) || 0;
    const grossRevenue = logs?.reduce((sum, l) => sum + (l.total_cost || 0), 0) || 0;
    const platformFee = logs?.reduce((sum, l) => sum + (l.platform_fee || 0), 0) || 0;
    const netRevenue = grossRevenue - platformFee;

    // 按服务分组统计
    const serviceStats: Record<string, any> = {};
    logs?.forEach(log => {
      if (!serviceStats[log.service_id]) {
        serviceStats[log.service_id] = {
          serviceId: log.service_id,
          calls: 0,
          tokens: 0,
          revenue: 0,
        };
      }
      serviceStats[log.service_id].calls++;
      serviceStats[log.service_id].tokens += (log.input_tokens || 0) + (log.output_tokens || 0);
      serviceStats[log.service_id].revenue += log.total_cost || 0;
    });

    // 获取服务名称
    const serviceIds = Object.keys(serviceStats);
    const { data: services } = await client
      .from('vendor_services')
      .select('id, service_name, service_code')
      .in('id', serviceIds);

    const serviceDetails = serviceIds.map(id => ({
      ...serviceStats[id],
      serviceName: services?.find(s => s.id === id)?.service_name,
      serviceCode: services?.find(s => s.id === id)?.service_code,
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalCalls,
          successCalls,
          successRate: totalCalls > 0 ? (successCalls / totalCalls * 100).toFixed(2) : 0,
          totalTokens,
          grossRevenue: grossRevenue / 100, // 转为元
          platformFee: platformFee / 100,
          netRevenue: netRevenue / 100,
        },
        services: serviceDetails.map(s => ({
          ...s,
          revenue: s.revenue / 100,
        })),
      },
    });
  } catch (error) {
    console.error('Get vendor revenue error:', error);
    res.status(500).json({ error: '获取收入统计失败' });
  }
});

// ==================== 结算记录 ====================

/**
 * 获取结算记录
 * GET /api/v1/vendor/settlements
 */
router.get('/settlements', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    // 验证权限
    const { isVendor, vendorId } = await verifyVendor(userId as string);
    if (!isVendor) {
      return res.status(403).json({ error: '无权限' });
    }

    const { data: settlements, error } = await client
      .from('vendor_settlements')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: '查询失败' });
    }

    res.json({ success: true, data: settlements || [] });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({ error: '获取结算记录失败' });
  }
});

export default router;
