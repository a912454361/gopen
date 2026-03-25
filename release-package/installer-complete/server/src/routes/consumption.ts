/**
 * 消费记录路由
 * 用户消费明细查询
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// 消费类型映射
const CONSUMPTION_TYPE_NAMES: Record<string, string> = {
  model_chat: 'AI对话',
  model_image: '图像生成',
  model_audio: '音频生成',
  model_video: '视频生成',
  model_embedding: '向量嵌入',
  gpu_compute: 'GPU计算',
  storage: '云存储',
  ollama: '本地模型',
};

/**
 * 获取用户消费记录
 * GET /api/v1/consumption/user/:userId
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) 
      ? req.params.userId[0] 
      : req.params.userId;
    
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    let query = client
      .from('consumption_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (type) {
      query = query.eq('consumption_type', type);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data: records, error } = await query;
    
    if (error) {
      console.error('Get consumption records error:', error);
      return res.status(500).json({ error: '查询失败' });
    }
    
    // 格式化输出
    const formattedRecords = (records || []).map(record => ({
      id: record.id,
      type: record.consumption_type,
      typeName: CONSUMPTION_TYPE_NAMES[record.consumption_type] || record.consumption_type,
      resourceName: record.resource_name,
      
      // 用量
      inputTokens: record.input_tokens,
      outputTokens: record.output_tokens,
      storageBytes: record.storage_bytes,
      gpuSeconds: record.gpu_seconds,
      
      // 费用（分）
      sellInputFee: record.sell_input_fee,
      sellOutputFee: record.sell_output_fee,
      sellStorageFee: record.sell_storage_fee,
      sellGpuFee: record.sell_gpu_fee,
      sellTotal: record.sell_total,
      
      // 费用（元）
      sellTotalYuan: (record.sell_total / 100).toFixed(4),
      
      status: record.status,
      createdAt: record.created_at,
    }));
    
    res.json({
      success: true,
      data: formattedRecords,
    });
  } catch (error) {
    console.error('Get consumption records error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * 获取用户消费统计
 * GET /api/v1/consumption/stats/:userId
 */
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) 
      ? req.params.userId[0] 
      : req.params.userId;
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
    
    // 获取总消费
    const { data: allRecords } = await client
      .from('consumption_records')
      .select('sell_total, consumption_type')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    // 计算各时间段消费
    let totalConsumed = 0;
    const typeBreakdown: Record<string, number> = {};
    
    (allRecords || []).forEach(record => {
      totalConsumed += record.sell_total || 0;
      typeBreakdown[record.consumption_type] = (typeBreakdown[record.consumption_type] || 0) + (record.sell_total || 0);
    });
    
    // 今日消费
    const { data: todayRecords } = await client
      .from('consumption_records')
      .select('sell_total')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', todayStart);
    
    const todayConsumed = (todayRecords || []).reduce((sum, r) => sum + (r.sell_total || 0), 0);
    
    // 本月消费
    const { data: monthRecords } = await client
      .from('consumption_records')
      .select('sell_total')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', monthStart);
    
    const monthConsumed = (monthRecords || []).reduce((sum, r) => sum + (r.sell_total || 0), 0);
    
    // 本年消费
    const { data: yearRecords } = await client
      .from('consumption_records')
      .select('sell_total')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', yearStart);
    
    const yearConsumed = (yearRecords || []).reduce((sum, r) => sum + (r.sell_total || 0), 0);
    
    // 格式化类型统计
    const typeStats = Object.entries(typeBreakdown).map(([type, amount]) => ({
      type,
      typeName: CONSUMPTION_TYPE_NAMES[type] || type,
      amount,
      amountYuan: (amount / 100).toFixed(2),
      percentage: totalConsumed > 0 ? ((amount / totalConsumed) * 100).toFixed(1) : '0',
    })).sort((a, b) => b.amount - a.amount);
    
    res.json({
      success: true,
      data: {
        totalConsumed,
        totalConsumedYuan: (totalConsumed / 100).toFixed(2),
        todayConsumed,
        todayConsumedYuan: (todayConsumed / 100).toFixed(4),
        monthConsumed,
        monthConsumedYuan: (monthConsumed / 100).toFixed(2),
        yearConsumed,
        yearConsumedYuan: (yearConsumed / 100).toFixed(2),
        typeStats,
        requestCount: (allRecords || []).length,
      },
    });
  } catch (error) {
    console.error('Get consumption stats error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * 获取用户余额和消费概览
 * GET /api/v1/consumption/overview/:userId
 */
router.get('/overview/:userId', async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) 
      ? req.params.userId[0] 
      : req.params.userId;
    
    // 获取余额
    const { data: balance } = await client
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // 获取消费统计
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const { data: todayConsumption } = await client
      .from('consumption_records')
      .select('sell_total')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', todayStart);
    
    const todayConsumed = (todayConsumption || []).reduce((sum, r) => sum + (r.sell_total || 0), 0);
    
    // 获取最近消费记录
    const { data: recentRecords } = await client
      .from('consumption_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        balance: balance?.balance || 0,
        balanceYuan: ((balance?.balance || 0) / 100).toFixed(2),
        frozenBalance: balance?.frozen_balance || 0,
        totalRecharged: balance?.total_recharged || 0,
        totalConsumed: balance?.total_consumed || 0,
        todayConsumed,
        todayConsumedYuan: (todayConsumed / 100).toFixed(4),
        recentRecords: (recentRecords || []).map(r => ({
          id: r.id,
          type: r.consumption_type,
          typeName: CONSUMPTION_TYPE_NAMES[r.consumption_type] || r.consumption_type,
          resourceName: r.resource_name,
          sellTotal: r.sell_total,
          sellTotalYuan: (r.sell_total / 100).toFixed(4),
          createdAt: r.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Get consumption overview error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * 获取消费类型列表
 * GET /api/v1/consumption/types
 */
router.get('/types', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.entries(CONSUMPTION_TYPE_NAMES).map(([key, name]) => ({
      key,
      name,
    })),
  });
});

/**
 * 获取消费详情
 * GET /api/v1/consumption/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) 
      ? req.params.id[0] 
      : req.params.id;
    
    const { data: record, error } = await client
      .from('consumption_records')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json({
      success: true,
      data: {
        id: record.id,
        userId: record.user_id,
        type: record.consumption_type,
        typeName: CONSUMPTION_TYPE_NAMES[record.consumption_type] || record.consumption_type,
        resourceId: record.resource_id,
        resourceName: record.resource_name,
        
        inputTokens: record.input_tokens,
        outputTokens: record.output_tokens,
        storageBytes: record.storage_bytes,
        gpuSeconds: record.gpu_seconds,
        
        // 用户费用
        sellInputFee: record.sell_input_fee,
        sellOutputFee: record.sell_output_fee,
        sellStorageFee: record.sell_storage_fee,
        sellGpuFee: record.sell_gpu_fee,
        sellTotal: record.sell_total,
        sellTotalYuan: (record.sell_total / 100).toFixed(4),
        
        status: record.status,
        remark: record.remark,
        createdAt: record.created_at,
      },
    });
  } catch (error) {
    console.error('Get consumption detail error:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

export default router;
