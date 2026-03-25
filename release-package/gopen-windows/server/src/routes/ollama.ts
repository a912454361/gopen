import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== Ollama 服务管理 ====================

/**
 * 获取可用的Ollama模型列表
 * GET /api/v1/ollama/models
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    // 获取Ollama服务的模型
    const { data: ollamaModels, error } = await client
      .from('ai_models')
      .select('id, code, name, ollama_model, sell_input_price, sell_output_price, is_free, max_tokens, description')
      .eq('is_ollama', true)
      .eq('status', 'active')
      .eq('is_public', true);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch Ollama models' });
    }
    
    // 检查Ollama服务状态
    const { data: services } = await client
      .from('ollama_services')
      .select('*')
      .eq('status', 'active');
    
    const availableServices = services || [];
    
    res.json({
      success: true,
      data: {
        models: ollamaModels?.map(m => ({
          ...m,
          inputPrice: m.is_free ? 0 : (m.sell_input_price / 100).toFixed(4),
          outputPrice: m.is_free ? 0 : (m.sell_output_price / 100).toFixed(4),
          sell_input_price: undefined,
          sell_output_price: undefined,
        })),
        servicesAvailable: availableServices.length > 0,
        totalModels: ollamaModels?.length || 0,
      },
    });
  } catch (error) {
    console.error('Get Ollama models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Ollama 聊天补全（流式）
 * POST /api/v1/ollama/chat
 * Body: { userId, model, messages, stream?: boolean }
 */
const chatSchema = z.object({
  userId: z.string(),
  model: z.string(), // 模型code
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  stream: z.boolean().optional().default(true),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().optional(),
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const body = chatSchema.parse(req.body);
    
    // 获取模型配置
    const { data: modelConfig, error: modelError } = await client
      .from('ai_models')
      .select('*')
      .eq('code', body.model)
      .eq('is_ollama', true)
      .eq('status', 'active')
      .single();
    
    if (modelError || !modelConfig) {
      return res.status(404).json({ error: 'Model not found or not available' });
    }
    
    // 获取Ollama服务
    const { data: service, error: serviceError } = await client
      .from('ollama_services')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (serviceError || !service) {
      return res.status(503).json({ error: 'Ollama service unavailable' });
    }
    
    // 检查余额（非免费模型）
    if (!modelConfig.is_free) {
      const { data: balance } = await client
        .from('user_balances')
        .select('balance')
        .eq('user_id', body.userId)
        .single();
      
      if (!balance || balance.balance < 100) { // 最低1元
        return res.status(400).json({ 
          error: 'Insufficient balance',
          message: '余额不足，请先充值',
        });
      }
    }
    
    const ollamaUrl = `http://${service.host}:${service.port}/api/chat`;
    
    if (body.stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
      res.setHeader('Connection', 'keep-alive');
      
      // 调用Ollama API
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelConfig.ollama_model,
          messages: body.messages,
          stream: true,
          options: {
            temperature: body.temperature,
            num_predict: body.maxTokens || modelConfig.max_tokens,
          },
        }),
      });
      
      if (!response.ok) {
        res.write(`data: ${JSON.stringify({ error: 'Ollama API error' })}\n\n`);
        res.end();
        return;
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let totalTokens = 0;
      
      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  totalTokens += 1; // 粗略估算
                  res.write(`data: ${JSON.stringify({ content: data.message.content })}\n\n`);
                }
                if (data.done) {
                  // 流结束，记录消费
                  if (!modelConfig.is_free && totalTokens > 0) {
                    // 异步记录消费，不阻塞响应
                    recordOllamaConsumption(body.userId, modelConfig, totalTokens).catch(console.error);
                  }
                  res.write('data: [DONE]\n\n');
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
      
      res.end();
    } else {
      // 非流式响应
      const response = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelConfig.ollama_model,
          messages: body.messages,
          stream: false,
          options: {
            temperature: body.temperature,
            num_predict: body.maxTokens || modelConfig.max_tokens,
          },
        }),
      });
      
      if (!response.ok) {
        return res.status(500).json({ error: 'Ollama API error' });
      }
      
      const data = await response.json() as { eval_count?: number; prompt_eval_count?: number; message?: { content?: string } };
      const totalTokens = data.eval_count || data.prompt_eval_count || 0;
      
      // 记录消费
      if (!modelConfig.is_free && totalTokens > 0) {
        await recordOllamaConsumption(body.userId, modelConfig, totalTokens);
      }
      
      res.json({
        success: true,
        data: {
          content: data.message?.content || '',
          model: body.model,
          tokens: totalTokens,
        },
      });
    }
  } catch (error) {
    console.error('Ollama chat error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// 记录Ollama消费
async function recordOllamaConsumption(userId: string, modelConfig: any, tokens: number) {
  try {
    // 计算费用（按token计费）
    const sellTotal = Math.ceil((tokens / 1000) * modelConfig.sell_output_price);
    const costTotal = Math.ceil((tokens / 1000) * modelConfig.cost_output_price);
    const profit = sellTotal - costTotal;
    
    // 扣除余额
    const { data: balance } = await client
      .from('user_balances')
      .select('balance, total_consumed, monthly_consumed')
      .eq('user_id', userId)
      .single();
    
    if (balance) {
      await client
        .from('user_balances')
        .update({
          balance: Math.max(0, balance.balance - sellTotal),
          total_consumed: balance.total_consumed + sellTotal,
          monthly_consumed: balance.monthly_consumed + sellTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }
    
    // 记录消费
    await client
      .from('consumption_records')
      .insert([{
        user_id: userId,
        consumption_type: 'ollama',
        resource_id: modelConfig.id,
        resource_name: modelConfig.name,
        output_tokens: tokens,
        cost_output_fee: costTotal,
        cost_total: costTotal,
        sell_output_fee: sellTotal,
        sell_total: sellTotal,
        profit,
      }]);
  } catch (error) {
    console.error('Record Ollama consumption error:', error);
  }
}

/**
 * 检查Ollama服务状态
 * GET /api/v1/ollama/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { data: services, error } = await client
      .from('ollama_services')
      .select('*')
      .eq('status', 'active');
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch Ollama status' });
    }
    
    const statusChecks = await Promise.all(
      (services || []).map(async (service) => {
        try {
          const response = await fetch(`http://${service.host}:${service.port}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });
          return {
            id: service.id,
            name: service.name,
            host: service.host,
            isFree: service.is_free,
            healthy: response.ok,
          };
        } catch {
          return {
            id: service.id,
            name: service.name,
            host: service.host,
            isFree: service.is_free,
            healthy: false,
          };
        }
      })
    );
    
    const healthyCount = statusChecks.filter(s => s.healthy).length;
    
    res.json({
      success: true,
      data: {
        available: healthyCount > 0,
        healthyServices: healthyCount,
        totalServices: statusChecks.length,
        services: statusChecks,
      },
    });
  } catch (error) {
    console.error('Check Ollama status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
