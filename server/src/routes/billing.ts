import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 用户余额 ====================

/**
 * 获取用户余额和消费统计
 * GET /api/v1/billing/balance/:userId
 */
router.get('/balance/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 获取或创建余额记录
    let { data: balance, error } = await client
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // 不存在则创建
      const { data: newBalance, error: createError } = await client
        .from('user_balances')
        .insert([{ user_id: userId }])
        .select()
        .single();
      
      if (createError) {
        return res.status(500).json({ error: 'Failed to create balance' });
      }
      balance = newBalance;
    } else if (error) {
      return res.status(500).json({ error: 'Failed to fetch balance' });
    }
    
    res.json({
      success: true,
      data: {
        balance: balance.balance, // 分
        balanceYuan: (balance.balance / 100).toFixed(2), // 元
        frozenBalance: balance.frozen_balance,
        totalRecharged: balance.total_recharged,
        totalConsumed: balance.total_consumed,
        monthlyConsumed: balance.monthly_consumed,
      },
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 充值
 * POST /api/v1/billing/recharge
 * Body: { userId, amount, paymentMethod }
 */
const rechargeSchema = z.object({
  userId: z.string(),
  amount: z.number().min(100), // 最低1元
  paymentMethod: z.enum(['alipay', 'wechat', 'balance']),
});

router.post('/recharge', async (req: Request, res: Response) => {
  try {
    const body = rechargeSchema.parse(req.body);
    
    // 创建充值订单
    const orderNo = `RCH${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // 这里应该调用支付接口，暂时模拟
    const { data: balance, error: balanceError } = await client
      .from('user_balances')
      .select('*')
      .eq('user_id', body.userId)
      .single();
    
    if (balanceError && balanceError.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch balance' });
    }
    
    // 更新余额
    const newBalance = (balance?.balance || 0) + body.amount;
    
    const { error: updateError } = await client
      .from('user_balances')
      .upsert({
        user_id: body.userId,
        balance: newBalance,
        total_recharged: (balance?.total_recharged || 0) + body.amount,
        updated_at: new Date().toISOString(),
      });
    
    if (updateError) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }
    
    // 记录账单
    await client.from('bills').insert([{
      bill_no: orderNo,
      user_id: body.userId,
      type: 'recharge',
      amount: body.amount,
      title: '账户充值',
      status: 'completed',
    }]);
    
    res.json({
      success: true,
      data: {
        orderNo,
        amount: body.amount,
        newBalance,
        message: '充值成功',
      },
    });
  } catch (error) {
    console.error('Recharge error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 消费扣费 ====================

/**
 * 扣费（内部调用）
 * POST /api/v1/billing/deduct
 * Body: { userId, modelId, inputTokens, outputTokens, gpuSeconds?, taskId? }
 */
const deductSchema = z.object({
  userId: z.string(),
  modelId: z.string(),
  inputTokens: z.number().default(0),
  outputTokens: z.number().default(0),
  gpuSeconds: z.number().optional(),
  storageBytes: z.number().optional(),
  taskId: z.string().optional(),
  projectId: z.string().optional(),
});

router.post('/deduct', async (req: Request, res: Response) => {
  try {
    const body = deductSchema.parse(req.body);
    
    // 获取模型价格
    const { data: model, error: modelError } = await client
      .from('ai_models')
      .select('*')
      .eq('id', body.modelId)
      .single();
    
    if (modelError || !model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    // 免费模型不扣费
    if (model.is_free) {
      return res.json({
        success: true,
        data: {
          deducted: false,
          reason: 'Free model',
          totalFee: 0,
        },
      });
    }
    
    // 计算成本价（后台）- 价格单位：厘/千tokens
    const costInputFee = Math.ceil((body.inputTokens / 1000) * model.cost_input_price);
    const costOutputFee = Math.ceil((body.outputTokens / 1000) * model.cost_output_price);
    const costGpuFee = body.gpuSeconds && model.cost_gpu_hour
      ? Math.ceil((body.gpuSeconds / 3600) * model.cost_gpu_hour)
      : 0;
    const costStorageFee = 0; // TODO: 存储费用计算
    const costTotal = costInputFee + costOutputFee + costGpuFee + costStorageFee;
    
    // 计算售价（用户付费）- 价格单位：厘/千tokens
    const sellInputFee = Math.ceil((body.inputTokens / 1000) * model.sell_input_price);
    const sellOutputFee = Math.ceil((body.outputTokens / 1000) * model.sell_output_price);
    const sellGpuFee = body.gpuSeconds && model.sell_gpu_hour
      ? Math.ceil((body.gpuSeconds / 3600) * model.sell_gpu_hour)
      : 0;
    const sellStorageFee = 0;
    const sellTotal = sellInputFee + sellOutputFee + sellGpuFee + sellStorageFee;
    
    // 计算利润
    const profit = sellTotal - costTotal;
    
    // 获取用户余额
    const { data: userBalance, error: balanceError } = await client
      .from('user_balances')
      .select('*')
      .eq('user_id', body.userId)
      .single();
    
    if (balanceError || !userBalance) {
      return res.status(400).json({ error: 'User balance not found' });
    }
    
    // 检查余额
    if (userBalance.balance < sellTotal) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        data: {
          balance: userBalance.balance,
          required: sellTotal,
        },
      });
    }
    
    // 扣除余额
    const { error: deductError } = await client
      .from('user_balances')
      .update({
        balance: userBalance.balance - sellTotal,
        total_consumed: userBalance.total_consumed + sellTotal,
        monthly_consumed: userBalance.monthly_consumed + sellTotal,
        total_compute_used: userBalance.total_compute_used + body.inputTokens + body.outputTokens,
        monthly_compute_used: userBalance.monthly_compute_used + body.inputTokens + body.outputTokens,
        total_gpu_used: userBalance.total_gpu_used + (body.gpuSeconds || 0),
        monthly_gpu_used: userBalance.monthly_gpu_used + (body.gpuSeconds || 0),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', body.userId);
    
    if (deductError) {
      return res.status(500).json({ error: 'Failed to deduct balance' });
    }
    
    // 记录消费
    const { data: consumption, error: consumptionError } = await client
      .from('consumption_records')
      .insert([{
        user_id: body.userId,
        consumption_type: 'model',
        resource_id: body.modelId,
        resource_name: model.name,
        input_tokens: body.inputTokens,
        output_tokens: body.outputTokens,
        gpu_seconds: body.gpuSeconds || 0,
        storage_bytes: body.storageBytes || 0,
        cost_input_fee: costInputFee,
        cost_output_fee: costOutputFee,
        cost_gpu_fee: costGpuFee,
        cost_storage_fee: costStorageFee,
        cost_total: costTotal,
        sell_input_fee: sellInputFee,
        sell_output_fee: sellOutputFee,
        sell_gpu_fee: sellGpuFee,
        sell_storage_fee: sellStorageFee,
        sell_total: sellTotal,
        profit,
        task_id: body.taskId,
        project_id: body.projectId,
      }])
      .select()
      .single();
    
    if (consumptionError) {
      console.error('Failed to record consumption:', consumptionError);
    }
    
    res.json({
      success: true,
      data: {
        deducted: true,
        totalFee: sellTotal,
        totalFeeYuan: (sellTotal / 100).toFixed(2),
        newBalance: userBalance.balance - sellTotal,
        consumptionId: consumption?.id,
        // 成本信息不对用户暴露
      },
    });
  } catch (error) {
    console.error('Deduct error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 消费记录 ====================

/**
 * 获取消费记录
 * GET /api/v1/billing/consumption/:userId
 * Query: page?, limit?, type?
 */
router.get('/consumption/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = client
      .from('consumption_records')
      .select('id, consumption_type, resource_name, input_tokens, output_tokens, gpu_seconds, sell_total, status, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);
    
    if (type) {
      query = query.eq('consumption_type', type);
    }
    
    const { data: records, count, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch consumption records' });
    }
    
    res.json({
      success: true,
      data: {
        records: records?.map(r => ({
          ...r,
          totalFeeYuan: (r.sell_total / 100).toFixed(2),
          // 不暴露sell_total原始值
          sell_total: undefined,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get consumption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== 存储费用 ====================

/**
 * 获取存储费用配置
 * GET /api/v1/billing/storage-pricing
 */
router.get('/storage-pricing', async (req: Request, res: Response) => {
  try {
    const { data: pricing, error } = await client
      .from('storage_pricing')
      .select('storage_type, sell_per_gb, sell_per_request, sell_traffic, free_quota_gb, free_quota_requests')
      .eq('status', 'active');
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch storage pricing' });
    }
    
    res.json({
      success: true,
      data: pricing?.map(p => ({
        ...p,
        pricePerGbYuan: (p.sell_per_gb / 100).toFixed(2),
        pricePerRequestYuan: (p.sell_per_request / 100).toFixed(4),
        priceTrafficYuan: (p.sell_traffic / 100).toFixed(4),
        sell_per_gb: undefined,
        sell_per_request: undefined,
        sell_traffic: undefined,
      })),
    });
  } catch (error) {
    console.error('Get storage pricing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== 收益统计（后台） ====================

/**
 * 获取平台收益统计（管理后台用）
 * GET /api/v1/billing/admin/profit
 * Query: startDate?, endDate?
 */
router.get('/admin/profit', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = client
      .from('consumption_records')
      .select('profit, sell_total, cost_total, created_at');
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data: records, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch profit data' });
    }
    
    const totalRevenue = records?.reduce((sum, r) => sum + (r.sell_total || 0), 0) || 0;
    const totalCost = records?.reduce((sum, r) => sum + (r.cost_total || 0), 0) || 0;
    const totalProfit = records?.reduce((sum, r) => sum + (r.profit || 0), 0) || 0;
    
    res.json({
      success: true,
      data: {
        totalRevenue, // 分
        totalRevenueYuan: (totalRevenue / 100).toFixed(2),
        totalCost,
        totalCostYuan: (totalCost / 100).toFixed(2),
        totalProfit,
        totalProfitYuan: (totalProfit / 100).toFixed(2),
        profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : '0',
        transactionCount: records?.length || 0,
      },
    });
  } catch (error) {
    console.error('Get profit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== G点系统 ====================

/**
 * 获取用户G点余额
 * GET /api/v1/billing/g-points/:userId
 */
router.get('/g-points/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 获取或创建余额记录
    let { data: balance, error } = await client
      .from('user_balances')
      .select('g_points')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // 不存在则创建
      const { data: newBalance, error: createError } = await client
        .from('user_balances')
        .insert([{ user_id: userId, g_points: 0 }])
        .select('g_points')
        .single();
      
      if (createError) {
        return res.status(500).json({ error: 'Failed to create balance' });
      }
      balance = newBalance;
    } else if (error) {
      return res.status(500).json({ error: 'Failed to fetch g_points' });
    }
    
    res.json({
      success: true,
      data: {
        gPoints: balance?.g_points || 0,
      },
    });
  } catch (error) {
    console.error('Get g_points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * G点充值
 * POST /api/v1/billing/g-points/recharge
 * Body: { userId, amount } // amount单位：元
 * 规则：1元 = 100G点
 */
const gPointRechargeSchema = z.object({
  userId: z.string(),
  amount: z.number().min(1), // 最低1元
});

router.post('/g-points/recharge', async (req: Request, res: Response) => {
  try {
    const body = gPointRechargeSchema.parse(req.body);
    
    // 计算G点：1元 = 100G点
    const gPoints = Math.floor(body.amount * 100);
    
    // 获取当前余额
    const { data: userBalance, error: balanceError } = await client
      .from('user_balances')
      .select('g_points')
      .eq('user_id', body.userId)
      .single();
    
    const balanceBefore = userBalance?.g_points || 0;
    const balanceAfter = balanceBefore + gPoints;
    
    // 更新G点余额 - 使用update而不是upsert
    const { error: updateError } = await client
      .from('user_balances')
      .update({
        g_points: balanceAfter,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', body.userId);
    
    if (updateError) {
      return res.status(500).json({ error: 'Failed to update g_points' });
    }
    
    // 记录G点充值
    await client.from('g_point_records').insert([{
      user_id: body.userId,
      type: 'recharge',
      amount: gPoints,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: `充值${body.amount}元，获得${gPoints}G点`,
    }]);
    
    res.json({
      success: true,
      data: {
        rechargeAmount: body.amount,
        gPointsReceived: gPoints,
        balanceBefore,
        balanceAfter,
        message: `充值成功，获得${gPoints}G点`,
      },
    });
  } catch (error) {
    console.error('G-point recharge error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

/**
 * G点扣费
 * POST /api/v1/billing/g-points/deduct
 * Body: { userId, gPoints, description, relatedType?, relatedId? }
 */
const gPointDeductSchema = z.object({
  userId: z.string(),
  gPoints: z.number().min(1),
  description: z.string(),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
});

router.post('/g-points/deduct', async (req: Request, res: Response) => {
  try {
    const body = gPointDeductSchema.parse(req.body);
    
    // 获取当前余额
    const { data: userBalance, error: balanceError } = await client
      .from('user_balances')
      .select('g_points')
      .eq('user_id', body.userId)
      .single();
    
    if (!userBalance) {
      return res.status(400).json({ error: 'User balance not found' });
    }
    
    const balanceBefore = userBalance.g_points || 0;
    
    // 检查余额是否充足
    if (balanceBefore < body.gPoints) {
      return res.status(400).json({
        error: 'Insufficient G-points',
        data: {
          balance: balanceBefore,
          required: body.gPoints,
          shortage: body.gPoints - balanceBefore,
        },
      });
    }
    
    const balanceAfter = balanceBefore - body.gPoints;
    
    // 扣除G点
    const { error: deductError } = await client
      .from('user_balances')
      .update({
        g_points: balanceAfter,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', body.userId);
    
    if (deductError) {
      return res.status(500).json({ error: 'Failed to deduct g_points' });
    }
    
    // 记录G点消费
    const { data: record, error: recordError } = await client
      .from('g_point_records')
      .insert([{
        user_id: body.userId,
        type: 'consume',
        amount: body.gPoints,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: body.description,
        related_type: body.relatedType,
        related_id: body.relatedId,
      }])
      .select()
      .single();
    
    if (recordError) {
      console.error('Failed to record g_point consumption:', recordError);
    }
    
    res.json({
      success: true,
      data: {
        deducted: true,
        gPointsDeducted: body.gPoints,
        balanceBefore,
        balanceAfter,
        recordId: record?.id,
        message: `成功扣除${body.gPoints}G点`,
      },
    });
  } catch (error) {
    console.error('G-point deduct error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

/**
 * 获取G点消费记录
 * GET /api/v1/billing/g-points/records/:userId
 * Query: page?, limit?, type?
 */
router.get('/g-points/records/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = client
      .from('g_point_records')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data: records, count, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch g_point records' });
    }
    
    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get g_point records error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
