/**
 * 厂商管理API
 * 管理AI模型厂商配置和同步状态
 */

import { Router, type Request, type Response } from 'express';
import { MODEL_PROVIDERS, getProviderApiKey } from '../config/model-providers.js';
import { modelSyncService } from '../services/model-sync-service.js';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

/**
 * 获取所有厂商列表
 * GET /api/v1/providers
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // 获取厂商统计信息
    const stats = await modelSyncService.getProviderStats();
    const statsMap = new Map(stats.map(s => [s.provider, s]));
    
    // 获取同步状态
    const syncStatuses = modelSyncService.getSyncStatus();
    const statusMap = new Map(syncStatuses.map(s => [s.provider, s]));
    
    // 组合厂商信息
    const providers = Object.entries(MODEL_PROVIDERS).map(([id, provider]) => {
      const stat = statsMap.get(id);
      const status = statusMap.get(id);
      const hasApiKey = !!getProviderApiKey(id);
      
      return {
        id,
        name: provider.name,
        nameEn: provider.nameEn,
        icon: provider.icon,
        website: provider.website,
        docs: provider.docs,
        status: provider.status,
        categories: provider.categories,
        features: provider.features,
        // 统计信息
        totalModels: stat?.totalModels || 0,
        activeModels: stat?.activeModels || 0,
        freeModels: stat?.freeModels || 0,
        // 配置状态
        hasApiKey,
        apiKeyConfigured: hasApiKey,
        // 同步状态
        syncStatus: status?.status || 'idle',
        lastSync: status?.lastSync || null,
        lastSyncError: status?.error || null,
      };
    });

    res.json({
      success: true,
      data: {
        providers,
        total: providers.length,
        configured: providers.filter(p => p.hasApiKey).length,
        active: providers.filter(p => p.status === 'active').length,
      },
    });
  } catch (error) {
    console.error('[Providers] Get providers error:', error);
    res.status(500).json({ error: '获取厂商列表失败' });
  }
});

/**
 * 获取单个厂商详情
 * GET /api/v1/providers/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const provider = MODEL_PROVIDERS[id];
    
    if (!provider) {
      return res.status(404).json({ error: '厂商不存在' });
    }

    // 获取该厂商的模型列表
    const { data: models, error: dbError } = await client
      .from('ai_models')
      .select('*')
      .eq('provider', id)
      .order('status', { ascending: true })
      .order('sort_order', { ascending: true });

    if (dbError) {
      return res.status(500).json({ error: '获取模型列表失败' });
    }

    // 获取同步状态
    const syncStatuses = modelSyncService.getSyncStatus();
    const syncStatus = syncStatuses.find(s => s.provider === id);

    res.json({
      success: true,
      data: {
        provider: {
          ...provider,
          id,
          hasApiKey: !!getProviderApiKey(id),
        },
        models: models || [],
        syncStatus,
        stats: {
          total: models?.length || 0,
          active: models?.filter(m => m.status === 'active').length || 0,
          free: models?.filter(m => m.sell_input_price === 0).length || 0,
        },
      },
    });
  } catch (error) {
    console.error('[Providers] Get provider error:', error);
    res.status(500).json({ error: '获取厂商详情失败' });
  }
});

/**
 * 同步单个厂商模型
 * POST /api/v1/providers/:id/sync
 */
router.post('/:id/sync', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    if (!MODEL_PROVIDERS[id]) {
      return res.status(404).json({ error: '厂商不存在' });
    }

    const result = await modelSyncService.syncProviderModels(id);

    res.json({
      success: result.success,
      message: result.success 
        ? `同步完成: 新增 ${result.modelsAdded}, 更新 ${result.modelsUpdated}, 下线 ${result.modelsDeactivated}`
        : `同步失败: ${result.error}`,
      data: result,
    });
  } catch (error) {
    console.error('[Providers] Sync provider error:', error);
    res.status(500).json({ error: '同步失败' });
  }
});

/**
 * 同步所有厂商模型
 * POST /api/v1/providers/sync-all
 */
router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    console.log('[Providers] Starting full sync...');
    
    const results = await modelSyncService.syncAllProviders();
    
    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      modelsAdded: results.reduce((sum, r) => sum + r.modelsAdded, 0),
      modelsUpdated: results.reduce((sum, r) => sum + r.modelsUpdated, 0),
      modelsDeactivated: results.reduce((sum, r) => sum + r.modelsDeactivated, 0),
    };

    res.json({
      success: true,
      message: `同步完成: ${summary.success}/${summary.total} 个厂商成功`,
      data: {
        summary,
        results,
      },
    });
  } catch (error) {
    console.error('[Providers] Sync all error:', error);
    res.status(500).json({ error: '同步失败' });
  }
});

/**
 * 获取同步状态
 * GET /api/v1/providers/sync/status
 */
router.get('/sync/status', (req: Request, res: Response) => {
  const statuses = modelSyncService.getSyncStatus();
  
  res.json({
    success: true,
    data: statuses,
  });
});

/**
 * 获取同步日志
 * GET /api/v1/providers/sync/logs
 */
router.get('/sync/logs', async (req: Request, res: Response) => {
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
    console.error('[Providers] Get logs error:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
});

/**
 * 批量上线模型
 * POST /api/v1/providers/:id/models/batch-activate
 */
router.post('/:id/models/batch-activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { modelCodes } = req.body;
    
    if (!Array.isArray(modelCodes) || modelCodes.length === 0) {
      return res.status(400).json({ error: '请提供模型列表' });
    }

    const { error } = await client
      .from('ai_models')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .in('code', modelCodes)
      .eq('provider', id);

    if (error) {
      return res.status(500).json({ error: '批量上线失败' });
    }

    res.json({
      success: true,
      message: `已上线 ${modelCodes.length} 个模型`,
    });
  } catch (error) {
    console.error('[Providers] Batch activate error:', error);
    res.status(500).json({ error: '批量上线失败' });
  }
});

/**
 * 批量下线模型
 * POST /api/v1/providers/:id/models/batch-deactivate
 */
router.post('/:id/models/batch-deactivate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { modelCodes } = req.body;
    
    if (!Array.isArray(modelCodes) || modelCodes.length === 0) {
      return res.status(400).json({ error: '请提供模型列表' });
    }

    const { error } = await client
      .from('ai_models')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .in('code', modelCodes)
      .eq('provider', id);

    if (error) {
      return res.status(500).json({ error: '批量下线失败' });
    }

    res.json({
      success: true,
      message: `已下线 ${modelCodes.length} 个模型`,
    });
  } catch (error) {
    console.error('[Providers] Batch deactivate error:', error);
    res.status(500).json({ error: '批量下线失败' });
  }
});

/**
 * 更新模型价格
 * PUT /api/v1/providers/:id/models/:code/price
 */
router.put('/:id/models/:code/price', async (req: Request, res: Response) => {
  try {
    const { id, code } = req.params;
    const { sellInputPrice, sellOutputPrice } = req.body;
    
    if (!sellInputPrice || !sellOutputPrice) {
      return res.status(400).json({ error: '请提供价格信息' });
    }

    const { error } = await client
      .from('ai_models')
      .update({
        sell_input_price: sellInputPrice,
        sell_output_price: sellOutputPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('code', code)
      .eq('provider', id);

    if (error) {
      return res.status(500).json({ error: '更新价格失败' });
    }

    res.json({
      success: true,
      message: '价格更新成功',
    });
  } catch (error) {
    console.error('[Providers] Update price error:', error);
    res.status(500).json({ error: '更新价格失败' });
  }
});

/**
 * 获取厂商分类统计
 * GET /api/v1/providers/stats/categories
 */
router.get('/stats/categories', async (req: Request, res: Response) => {
  try {
    const { data, error } = await client
      .from('ai_models')
      .select('provider, category, status');

    if (error) {
      return res.status(500).json({ error: '获取统计失败' });
    }

    // 按类别统计
    const categoryStats = new Map<string, { total: number; active: number; providers: Set<string> }>();
    
    for (const model of data || []) {
      const cat = model.category || 'other';
      const existing = categoryStats.get(cat) || { total: 0, active: 0, providers: new Set() };
      existing.total++;
      if (model.status === 'active') existing.active++;
      existing.providers.add(model.provider);
      categoryStats.set(cat, existing);
    }

    const result = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      totalModels: stats.total,
      activeModels: stats.active,
      providerCount: stats.providers.size,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Providers] Get category stats error:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

export default router;
