/**
 * AI 模型自动同步服务
 * 从各提供商 API 自动同步最新模型列表和定价
 */

import { Router, type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 提供商配置 ====================

interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  modelsEndpoint: string;
  parseModels: (data: any) => Array<{
    code: string;
    name: string;
    category: string;
    inputPrice: number;
    outputPrice: number;
    contextWindow: number;
    description: string;
  }>;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    modelsEndpoint: '/models',
    parseModels: (data: any) => {
      // OpenAI 不返回定价，使用预设定价
      const pricing: Record<string, { input: number; output: number }> = {
        'gpt-4o': { input: 2500, output: 10000 },
        'gpt-4o-mini': { input: 150, output: 600 },
        'gpt-4-turbo': { input: 1000, output: 3000 },
        'gpt-4': { input: 3000, output: 6000 },
        'gpt-3.5-turbo': { input: 50, output: 150 },
        'dall-e-3': { input: 4000, output: 0 },
        'dall-e-2': { input: 2000, output: 0 },
        'whisper-1': { input: 100, output: 0 },
        'tts-1': { input: 150, output: 0 },
        'tts-1-hd': { input: 300, output: 0 },
      };

      const contextWindows: Record<string, number> = {
        'gpt-4o': 128000,
        'gpt-4o-mini': 128000,
        'gpt-4-turbo': 128000,
        'gpt-4': 8192,
        'gpt-3.5-turbo': 16385,
      };

      return (data.data || [])
        .filter((model: any) => model.id.includes('gpt') || model.id.includes('dall') || model.id.includes('whisper') || model.id.includes('tts'))
        .filter((model: any) => !model.id.includes('-instruct') && !model.id.includes('-preview') && !model.id.includes('-0301') && !model.id.includes('-0314'))
        .map((model: any) => {
          const price = pricing[model.id] || { input: 500, output: 500 };
          return {
            code: model.id,
            name: model.id.toUpperCase().replace(/-/g, ' '),
            category: model.id.includes('dall') ? 'image' : model.id.includes('whisper') ? 'audio' : model.id.includes('tts') ? 'audio' : 'chat',
            inputPrice: price.input,
            outputPrice: price.output,
            contextWindow: contextWindows[model.id] || 4096,
            description: `OpenAI ${model.id}`,
          };
        });
    },
  },

  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    modelsEndpoint: '/models',
    parseModels: (data: any) => {
      const pricing: Record<string, { input: number; output: number }> = {
        'claude-3-opus': { input: 1500, output: 7500 },
        'claude-3-sonnet': { input: 300, output: 1500 },
        'claude-3-haiku': { input: 25, output: 125 },
        'claude-3-5-sonnet': { input: 300, output: 1500 },
        'claude-3-5-haiku': { input: 100, output: 500 },
      };

      const contextWindows: Record<string, number> = {
        'claude-3-opus': 200000,
        'claude-3-sonnet': 200000,
        'claude-3-haiku': 200000,
        'claude-3-5-sonnet': 200000,
        'claude-3-5-haiku': 200000,
      };

      return (data.data || [])
        .map((model: any) => {
          const price = pricing[model.id] || { input: 500, output: 500 };
          return {
            code: model.id,
            name: model.display_name || model.id,
            category: 'chat',
            inputPrice: price.input,
            outputPrice: price.output,
            contextWindow: contextWindows[model.id] || 200000,
            description: model.description || `Anthropic ${model.id}`,
          };
        });
    },
  },

  doubao: {
    name: '豆包',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: process.env.DOUBAO_API_KEY || '',
    modelsEndpoint: '/models',
    parseModels: (data: any) => {
      // 豆包定价（单位：分/百万token）
      const pricing: Record<string, { input: number; output: number }> = {
        'doubao-pro-32k': { input: 500, output: 1000 },
        'doubao-lite-4k': { input: 50, output: 100 },
        'doubao-pro-128k': { input: 500, output: 1000 },
        'doubao-pro-256k': { input: 800, output: 1500 },
      };

      const contextWindows: Record<string, number> = {
        'doubao-pro-32k': 32768,
        'doubao-lite-4k': 4096,
        'doubao-pro-128k': 131072,
        'doubao-pro-256k': 262144,
      };

      return (data.data || [])
        .filter((model: any) => model.id.includes('doubao'))
        .map((model: any) => {
          const price = pricing[model.id] || { input: 500, output: 500 };
          return {
            code: model.id,
            name: model.name || model.id,
            category: 'chat',
            inputPrice: price.input,
            outputPrice: price.output,
            contextWindow: contextWindows[model.id] || 4096,
            description: model.description || `豆包 ${model.id}`,
          };
        });
    },
  },
};

// ==================== 同步接口 ====================

/**
 * 同步单个提供商的模型
 * POST /api/v1/model-sync/sync/:provider
 */
router.post('/sync/:provider', async (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as string;
    const config = PROVIDERS[provider];

    if (!config) {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    if (!config.apiKey) {
      return res.status(400).json({ error: `API key not configured for ${config.name}` });
    }

    // 调用提供商 API
    const response = await fetch(`${config.baseUrl}${config.modelsEndpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${config.name}] API error:`, errorText);
      return res.status(response.status).json({ 
        error: `Failed to fetch models from ${config.name}`,
        details: errorText,
      });
    }

    const data = await response.json();
    const models = config.parseModels(data);

    // 更新数据库
    let added = 0;
    let updated = 0;

    for (const model of models) {
      // 检查模型是否存在
      const { data: existing } = await client
        .from('ai_models')
        .select('id')
        .eq('code', model.code)
        .single();

      if (existing) {
        // 更新现有模型
        const { error } = await client
          .from('ai_models')
          .update({
            name: model.name,
            cost_input_price: model.inputPrice,
            cost_output_price: model.outputPrice,
            max_context_tokens: model.contextWindow,
            description: model.description,
            updated_at: new Date().toISOString(),
          })
          .eq('code', model.code);

        if (!error) updated++;
      } else {
        // 插入新模型
        const { error } = await client
          .from('ai_models')
          .insert([{
            code: model.code,
            name: model.name,
            provider: provider,
            category: model.category,
            cost_input_price: model.inputPrice,
            cost_output_price: model.outputPrice,
            sell_input_price: Math.ceil(model.inputPrice * 1.5), // 默认加价50%
            sell_output_price: Math.ceil(model.outputPrice * 1.5),
            max_context_tokens: model.contextWindow,
            description: model.description,
            status: 'active',
            is_public: true,
          }]);

        if (!error) added++;
      }
    }

    // 记录同步日志
    await client.from('model_sync_logs').insert([{
      provider: provider,
      models_found: models.length,
      models_added: added,
      models_updated: updated,
      status: 'success',
      details: JSON.stringify({ models: models.map((m: any) => m.code) }),
    }]);

    res.json({
      success: true,
      data: {
        provider: config.name,
        total: models.length,
        added,
        updated,
        models: models.map((m: any) => m.code),
      },
    });
  } catch (error) {
    console.error('Model sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 同步所有提供商的模型
 * POST /api/v1/model-sync/sync-all
 */
router.post('/sync-all', async (req: Request, res: Response) => {
  try {
    const results: Record<string, any> = {};
    const errors: string[] = [];

    for (const [provider, config] of Object.entries(PROVIDERS)) {
      if (!config.apiKey) {
        results[provider] = { skipped: true, reason: 'API key not configured' };
        continue;
      }

      try {
        const response = await fetch(`${config.baseUrl}${config.modelsEndpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          results[provider] = { error: `HTTP ${response.status}` };
          errors.push(`${config.name}: HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();
        const models = config.parseModels(data);

        let added = 0;
        let updated = 0;

        for (const model of models) {
          const { data: existing } = await client
            .from('ai_models')
            .select('id')
            .eq('code', model.code)
            .single();

          if (existing) {
            await client
              .from('ai_models')
              .update({
                name: model.name,
                cost_input_price: model.inputPrice,
                cost_output_price: model.outputPrice,
                max_context_tokens: model.contextWindow,
                description: model.description,
                updated_at: new Date().toISOString(),
              })
              .eq('code', model.code);
            updated++;
          } else {
            await client
              .from('ai_models')
              .insert([{
                code: model.code,
                name: model.name,
                provider: provider,
                category: model.category,
                cost_input_price: model.inputPrice,
                cost_output_price: model.outputPrice,
                sell_input_price: Math.ceil(model.inputPrice * 1.5),
                sell_output_price: Math.ceil(model.outputPrice * 1.5),
                max_context_tokens: model.contextWindow,
                description: model.description,
                status: 'active',
                is_public: true,
              }]);
            added++;
          }
        }

        results[provider] = {
          total: models.length,
          added,
          updated,
          models: models.map((m: any) => m.code),
        };

        // 记录同步日志
        await client.from('model_sync_logs').insert([{
          provider: provider,
          models_found: models.length,
          models_added: added,
          models_updated: updated,
          status: 'success',
        }]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results[provider] = { error: errorMsg };
        errors.push(`${config.name}: ${errorMsg}`);

        await client.from('model_sync_logs').insert([{
          provider: provider,
          status: 'failed',
          error_message: errorMsg,
        }]);
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Sync all models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 获取同步日志
 * GET /api/v1/model-sync/logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { data, error } = await client
      .from('model_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // 表可能不存在
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get sync logs error:', error);
    res.json({ success: true, data: [] });
  }
});

/**
 * 获取提供商配置状态
 * GET /api/v1/model-sync/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = Object.entries(PROVIDERS).map(([key, config]) => ({
      provider: key,
      name: config.name,
      configured: !!config.apiKey,
      apiKeyPreview: config.apiKey ? `${config.apiKey.slice(0, 8)}...` : null,
    }));

    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
