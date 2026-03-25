import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 模型市场 ====================

/**
 * 获取可用模型列表
 * GET /api/v1/models
 * Query: category?, provider?, memberOnly?
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, provider, memberOnly } = req.query;
    
    let query = client
      .from('ai_models')
      .select('id, code, name, provider, category, sell_input_price, sell_output_price, max_context_tokens, max_output_tokens, is_free, member_only, super_member_only, description, icon_url, sort_order')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('sort_order', { ascending: true });
    
    if (category) {
      query = query.eq('category', category);
    }
    if (provider) {
      query = query.eq('provider', provider);
    }
    if (memberOnly === 'true') {
      query = query.eq('member_only', true);
    }
    
    const { data: models, error } = await query;
    
    if (error) {
      console.error('Models query error:', error);
      return res.status(500).json({ error: 'Failed to fetch models' });
    }
    
    // 隐藏成本价，只返回售价
    const publicModels = models?.map(model => ({
      ...model,
      // 价格格式化为：元/百万tokens
      // 数据库存储：厘/千tokens，直接返回数值即为元/百万tokens
      inputPrice: model.sell_input_price != null ? Number(model.sell_input_price.toFixed(2)) : null,
      outputPrice: model.sell_output_price != null ? Number(model.sell_output_price.toFixed(2)) : null,
      max_tokens: model.max_output_tokens,
      // 不暴露成本价
      sell_input_price: undefined,
      sell_output_price: undefined,
    }));
    
    res.json({
      success: true,
      data: publicModels,
    });
  } catch (error) {
    console.error('Fetch models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 获取模型详情（含用量预估）
 * GET /api/v1/models/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data: model, error } = await client
      .from('ai_models')
      .select('id, code, name, provider, category, sell_input_price, sell_output_price, sell_gpu_hour, max_tokens, context_window, is_free, member_only, super_member_only, description, icon, model_params')
      .eq('id', id)
      .eq('status', 'active')
      .single();
    
    if (error || !model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    res.json({
      success: true,
      data: {
        ...model,
        inputPrice: model.sell_input_price != null ? Number(model.sell_input_price.toFixed(2)) : null,
        outputPrice: model.sell_output_price != null ? Number(model.sell_output_price.toFixed(2)) : null,
        gpuHourPrice: model.sell_gpu_hour != null ? Number(model.sell_gpu_hour.toFixed(2)) : null,
      },
    });
  } catch (error) {
    console.error('Fetch model error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 费用预估
 * POST /api/v1/models/estimate
 * Body: { modelId, inputTokens, outputTokens, gpuSeconds? }
 */
const estimateSchema = z.object({
  modelId: z.string(),
  inputTokens: z.number().optional().default(1000),
  outputTokens: z.number().optional().default(500),
  gpuSeconds: z.number().optional(),
});

router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const body = estimateSchema.parse(req.body);
    
    const { data: model, error } = await client
      .from('ai_models')
      .select('sell_input_price, sell_output_price, sell_gpu_hour, is_free')
      .eq('id', body.modelId)
      .single();
    
    if (error || !model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    if (model.is_free) {
      return res.json({
        success: true,
        data: {
          inputTokens: body.inputTokens,
          outputTokens: body.outputTokens,
          gpuSeconds: body.gpuSeconds || 0,
          totalFee: 0,
          feeBreakdown: {
            inputFee: 0,
            outputFee: 0,
            gpuFee: 0,
          },
        },
      });
    }
    
    // 计算费用（厘）- 价格单位：厘/千tokens
    const inputFee = Math.ceil((body.inputTokens / 1000) * model.sell_input_price);
    const outputFee = Math.ceil((body.outputTokens / 1000) * model.sell_output_price);
    const gpuFee = body.gpuSeconds && model.sell_gpu_hour 
      ? Math.ceil((body.gpuSeconds / 3600) * model.sell_gpu_hour) 
      : 0;
    
    const totalFee = inputFee + outputFee + gpuFee;
    
    res.json({
      success: true,
      data: {
        inputTokens: body.inputTokens,
        outputTokens: body.outputTokens,
        gpuSeconds: body.gpuSeconds || 0,
        totalFee, // 分
        totalFeeYuan: Number((totalFee / 100).toFixed(2)), // 元
        feeBreakdown: {
          inputFee,
          outputFee,
          gpuFee,
        },
      },
    });
  } catch (error) {
    console.error('Estimate error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

/**
 * 模型对比
 * POST /api/v1/models/compare
 * Body: { modelIds: string[] }
 */
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const { modelIds } = req.body;
    
    if (!Array.isArray(modelIds) || modelIds.length === 0) {
      return res.status(400).json({ error: 'modelIds is required' });
    }
    
    const { data: models, error } = await client
      .from('ai_models')
      .select('id, code, name, provider, category, sell_input_price, sell_output_price, max_tokens, context_window, is_free, member_only, description')
      .in('id', modelIds)
      .eq('status', 'active');
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch models' });
    }
    
    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error('Compare models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
