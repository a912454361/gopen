/**
 * 模型同步管理API
 * 管理商家模型的自动同步
 */

import { Router, type Request, type Response } from 'express';
import { modelSyncService } from '../services/model-sync-service.js';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

/**
 * 手动触发同步所有商家模型
 * POST /api/v1/model-sync/sync-all
 */
router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    console.log('[ModelSync] Starting full sync...');
    
    const results = await modelSyncService.syncAllProviders();
    
    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      modelsAdded: results.reduce((sum, r) => sum + r.modelsAdded, 0),
      modelsUpdated: results.reduce((sum, r) => sum + r.modelsUpdated, 0),
      modelsDeactivated: results.reduce((sum, r) => sum + r.modelsDeactivated, 0),
      priceChanges: results.flatMap(r => r.priceChanges),
    };

    res.json({
      success: true,
      message: `同步完成: ${summary.success}/${summary.total} 个商家`,
      data: {
        summary,
        details: results,
      },
    });
  } catch (error) {
    console.error('[ModelSync] Sync all error:', error);
    res.status(500).json({ error: '同步失败' });
  }
});

/**
 * 手动同步单个商家模型
 * POST /api/v1/model-sync/sync/:provider
 */
router.post('/sync/:provider', async (req: Request, res: Response) => {
  try {
    const provider = Array.isArray(req.params.provider) 
      ? req.params.provider[0] 
      : req.params.provider;
    
    console.log(`[ModelSync] Syncing provider: ${provider}`);
    
    const result = await modelSyncService.syncProviderModels(provider);
    
    res.json({
      success: result.success,
      message: result.success 
        ? `同步完成: 新增 ${result.modelsAdded}, 更新 ${result.modelsUpdated}, 下线 ${result.modelsDeactivated}`
        : `同步失败: ${result.error}`,
      data: result,
    });
  } catch (error) {
    console.error('[ModelSync] Sync provider error:', error);
    res.status(500).json({ error: '同步失败' });
  }
});

/**
 * 获取同步状态
 * GET /api/v1/model-sync/status
 */
router.get('/status', (req: Request, res: Response) => {
  const status = modelSyncService.getSyncStatus();
  
  res.json({
    success: true,
    data: status,
  });
});

/**
 * 获取同步日志
 * GET /api/v1/model-sync/logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { provider, limit = 50 } = req.query;
    
    let query = client
      .from('model_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit));
    
    if (provider) {
      query = query.eq('provider', provider);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: '获取日志失败' });
    }
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[ModelSync] Get logs error:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
});

/**
 * 获取价格变更历史
 * GET /api/v1/model-sync/price-changes
 */
router.get('/price-changes', async (req: Request, res: Response) => {
  try {
    const { modelCode, limit = 30 } = req.query;
    
    let query = client
      .from('model_price_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit));
    
    if (modelCode) {
      query = query.eq('model_code', modelCode);
    }
    
    const { data, error } = await query;
    
    if (error) {
      // 表可能不存在，返回空数据
      return res.json({
        success: true,
        data: [],
        message: '暂无价格变更记录',
      });
    }
    
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[ModelSync] Get price changes error:', error);
    res.status(500).json({ error: '获取价格变更历史失败' });
  }
});

/**
 * 手动更新模型价格
 * PUT /api/v1/model-sync/models/:code/price
 */
router.put('/models/:code/price', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { costInputPrice, costOutputPrice, platformMarkup } = req.body;
    
    // 计算平台售价
    const sellInputPrice = Math.round(costInputPrice * (1 + (platformMarkup || 0.20)));
    const sellOutputPrice = Math.round(costOutputPrice * (1 + (platformMarkup || 0.20)));
    
    // 更新模型价格
    const { error } = await client
      .from('ai_models')
      .update({
        cost_input_price: costInputPrice,
        cost_output_price: costOutputPrice,
        sell_input_price: sellInputPrice,
        sell_output_price: sellOutputPrice,
        platform_markup: platformMarkup || 0.20,
        updated_at: new Date().toISOString(),
      })
      .eq('code', code);
    
    if (error) {
      return res.status(500).json({ error: '更新价格失败' });
    }
    
    res.json({
      success: true,
      message: '价格更新成功',
      data: {
        code,
        costInputPrice,
        costOutputPrice,
        sellInputPrice,
        sellOutputPrice,
      },
    });
  } catch (error) {
    console.error('[ModelSync] Update price error:', error);
    res.status(500).json({ error: '更新价格失败' });
  }
});

/**
 * 上线/下线模型
 * PUT /api/v1/model-sync/models/:code/status
 */
router.put('/models/:code/status', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }
    
    const { error } = await client
      .from('ai_models')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('code', code);
    
    if (error) {
      return res.status(500).json({ error: '更新状态失败' });
    }
    
    res.json({
      success: true,
      message: `模型已${status === 'active' ? '上线' : '下线'}`,
    });
  } catch (error) {
    console.error('[ModelSync] Update status error:', error);
    res.status(500).json({ error: '更新状态失败' });
  }
});

/**
 * 批量更新模型状态
 * POST /api/v1/model-sync/batch-status
 */
router.post('/batch-status', async (req: Request, res: Response) => {
  try {
    const { modelCodes, status } = req.body;
    
    if (!Array.isArray(modelCodes) || modelCodes.length === 0) {
      return res.status(400).json({ error: '请提供模型列表' });
    }
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }
    
    const { error } = await client
      .from('ai_models')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .in('code', modelCodes);
    
    if (error) {
      return res.status(500).json({ error: '批量更新失败' });
    }
    
    res.json({
      success: true,
      message: `已${status === 'active' ? '上线' : '下线'} ${modelCodes.length} 个模型`,
    });
  } catch (error) {
    console.error('[ModelSync] Batch update error:', error);
    res.status(500).json({ error: '批量更新失败' });
  }
});

export default router;
