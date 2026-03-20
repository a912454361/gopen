import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== AI 提供商配置 ====================

interface AIProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
}

const AI_PROVIDERS: Record<string, AIProviderConfig> = {
  doubao: {
    name: '豆包',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: process.env.DOUBAO_API_KEY || '',
    models: ['doubao-pro-32k', 'doubao-lite-4k', 'doubao-pro-128k'],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
};

// ==================== 聊天补全 ====================

const chatSchema = z.object({
  userId: z.string(),
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(128000).optional().default(4096),
  stream: z.boolean().optional().default(true),
  projectId: z.string().optional(),
});

/**
 * AI 聊天补全（流式）
 * POST /api/v1/ai/chat
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const body = chatSchema.parse(req.body);
    
    // 1. 获取模型配置
    const { data: modelConfig, error: modelError } = await client
      .from('ai_models')
      .select('*')
      .eq('code', body.model)
      .eq('status', 'active')
      .single();
    
    if (modelError || !modelConfig) {
      return res.status(404).json({ error: 'Model not found or unavailable' });
    }
    
    // 2. 检查用户会员权限
    const { data: user } = await client
      .from('users')
      .select('member_level, member_expire_at')
      .eq('id', body.userId)
      .single();
    
    const isMember = user?.member_level !== 'free' && 
      (!user?.member_expire_at || new Date(user.member_expire_at) > new Date());
    const isSuperMember = user?.member_level === 'super';
    
    if (modelConfig.super_member_only && !isSuperMember) {
      return res.status(403).json({ error: 'This model requires Super Member' });
    }
    if (modelConfig.member_only && !isMember) {
      return res.status(403).json({ error: 'This model requires Member' });
    }
    
    // 3. 检查余额（非免费模型）
    if (!modelConfig.is_free) {
      const { data: balance } = await client
        .from('user_balances')
        .select('balance')
        .eq('user_id', body.userId)
        .single();
      
      if (!balance || balance.balance < 100) { // 至少1元
        return res.status(402).json({ error: 'Insufficient balance' });
      }
    }
    
    // 4. 获取提供商配置
    const provider = AI_PROVIDERS[modelConfig.provider];
    if (!provider || !provider.apiKey) {
      return res.status(503).json({ error: 'AI provider not configured' });
    }
    
    // 5. 调用 AI API
    const requestBody = {
      model: modelConfig.code,
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      stream: body.stream,
    };
    
    if (body.stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      let inputTokens = 0;
      let outputTokens = 0;
      let fullContent = '';
      
      try {
        const response = await fetch(`${provider.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }
        
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                res.write('data: [DONE]\n\n');
              } else {
                try {
                  const json = JSON.parse(data);
                  const content = json.choices?.[0]?.delta?.content || '';
                  fullContent += content;
                  
                  // 估算 token
                  outputTokens = Math.ceil(fullContent.length / 4);
                  
                  // 转发给客户端
                  res.write(`data: ${JSON.stringify({
                    content,
                    model: body.model,
                  })}\n\n`);
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
        }
        
        // 估算输入 token
        inputTokens = Math.ceil(JSON.stringify(body.messages).length / 4);
        
        // 扣费
        if (!modelConfig.is_free) {
          await deductFee(body.userId, modelConfig, inputTokens, outputTokens, body.projectId);
        }
        
        res.end();
      } catch (error) {
        console.error('Stream error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        res.end();
      }
    } else {
      // 非流式响应
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'AI API error' });
      }
      
      const data = await response.json() as any;
      
      // 提取 token 使用量
      const inputTokens = (data as any).usage?.prompt_tokens || 0;
      const outputTokens = (data as any).usage?.completion_tokens || 0;
      
      // 扣费
      if (!modelConfig.is_free) {
        await deductFee(body.userId, modelConfig, inputTokens, outputTokens, body.projectId);
      }
      
      res.json({
        success: true,
        data: {
          content: (data as any).choices[0].message.content,
          model: body.model,
          usage: {
            inputTokens,
            outputTokens,
          },
        },
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 图像生成 ====================

const imageSchema = z.object({
  userId: z.string(),
  model: z.string(),
  prompt: z.string().min(1).max(4000),
  size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).optional().default('1024x1024'),
  n: z.number().int().min(1).max(4).optional().default(1),
  projectId: z.string().optional(),
});

/**
 * AI 图像生成
 * POST /api/v1/ai/image
 */
router.post('/image', async (req: Request, res: Response) => {
  try {
    const body = imageSchema.parse(req.body);
    
    // 1. 获取模型配置
    const { data: modelConfig } = await client
      .from('ai_models')
      .select('*')
      .eq('code', body.model)
      .eq('category', 'image')
      .eq('status', 'active')
      .single();
    
    if (!modelConfig) {
      return res.status(404).json({ error: 'Image model not found' });
    }
    
    // 2. 检查权限和余额
    const { data: balance } = await client
      .from('user_balances')
      .select('balance')
      .eq('user_id', body.userId)
      .single();
    
    if (!balance || balance.balance < modelConfig.sell_input_price) {
      return res.status(402).json({ error: 'Insufficient balance' });
    }
    
    // 3. 调用图像生成 API
    const provider = AI_PROVIDERS[modelConfig.provider];
    
    const response = await fetch(`${provider.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: body.model,
        prompt: body.prompt,
        size: body.size,
        n: body.n,
      }),
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Image generation failed' });
    }
    
    const data = await response.json() as any;
    
    // 4. 扣费
    const fee = modelConfig.sell_input_price * body.n;
    await deductFeeSimple(body.userId, fee, 'image', modelConfig.name, body.projectId);
    
    res.json({
      success: true,
      data: {
        images: (data as any).data.map((img: any) => ({
          url: img.url,
          revisedPrompt: img.revised_prompt,
        })),
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 语音识别 ====================

const audioTranscribeSchema = z.object({
  userId: z.string(),
  model: z.string().optional().default('whisper-1'),
  audioUrl: z.string().url(),
  projectId: z.string().optional(),
});

/**
 * 语音转文字
 * POST /api/v1/ai/audio/transcribe
 */
router.post('/audio/transcribe', async (req: Request, res: Response) => {
  try {
    const body = audioTranscribeSchema.parse(req.body);
    
    // 获取音频文件
    const audioResponse = await fetch(body.audioUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    
    // 调用 Whisper API
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), 'audio.mp3');
    formData.append('model', body.model);
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Transcription failed' });
    }
    
    const data = await response.json() as any;
    
    // 计算费用（按时长或文件大小）
    const audioSize = audioBuffer.byteLength;
    const fee = Math.ceil(audioSize / 1024 / 1024 * 42); // ¥0.42/MB
    
    await deductFeeSimple(body.userId, fee, 'audio', 'Whisper', body.projectId);
    
    res.json({
      success: true,
      data: {
        text: (data as any).text,
        duration: (data as any).duration,
      },
    });
  } catch (error) {
    console.error('Audio transcription error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 辅助函数 ====================

/**
 * 扣费（详细）
 */
async function deductFee(
  userId: string,
  modelConfig: any,
  inputTokens: number,
  outputTokens: number,
  projectId?: string
) {
  // 计算成本价
  const costInputFee = Math.ceil((inputTokens / 1000000) * modelConfig.cost_input_price);
  const costOutputFee = Math.ceil((outputTokens / 1000000) * modelConfig.cost_output_price);
  const costTotal = costInputFee + costOutputFee;
  
  // 计算售价
  const sellInputFee = Math.ceil((inputTokens / 1000000) * modelConfig.sell_input_price);
  const sellOutputFee = Math.ceil((outputTokens / 1000000) * modelConfig.sell_output_price);
  const sellTotal = sellInputFee + sellOutputFee;
  
  // 利润
  const profit = sellTotal - costTotal;
  
  // 扣除余额
  await client
    .from('user_balances')
    .update({
      balance: client.rpc('decrement_balance', { amount: sellTotal }),
      total_consumed: client.rpc('increment', { amount: sellTotal }),
      monthly_consumed: client.rpc('increment', { amount: sellTotal }),
    })
    .eq('user_id', userId);
  
  // 记录消费
  await client.from('consumption_records').insert([{
    user_id: userId,
    consumption_type: 'model',
    resource_id: modelConfig.id,
    resource_name: modelConfig.name,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_input_fee: costInputFee,
    cost_output_fee: costOutputFee,
    cost_total: costTotal,
    sell_input_fee: sellInputFee,
    sell_output_fee: sellOutputFee,
    sell_total: sellTotal,
    profit,
    project_id: projectId,
  }]);
}

/**
 * 简单扣费
 */
async function deductFeeSimple(
  userId: string,
  fee: number,
  type: string,
  resourceName: string,
  projectId?: string
) {
  // 扣除余额
  const { data: balance } = await client
    .from('user_balances')
    .select('balance, total_consumed')
    .eq('user_id', userId)
    .single();
  
  if (balance) {
    const currentBalance = (balance as any).balance || 0;
    const currentConsumed = (balance as any).total_consumed || 0;
    
    await client
      .from('user_balances')
      .update({
        balance: currentBalance - fee,
        total_consumed: currentConsumed + fee,
      })
      .eq('user_id', userId);
  }
  
  // 记录消费
  await client.from('consumption_records').insert([{
    user_id: userId,
    consumption_type: type,
    resource_name: resourceName,
    sell_total: fee,
    profit: Math.ceil(fee * 0.3), // 假设30%利润率
    project_id: projectId,
  }]);
}

// ==================== 模型列表 ====================

/**
 * 获取可用模型列表（带调用状态）
 * GET /api/v1/ai/models
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const { data: models, error } = await client
      .from('ai_models')
      .select('id, code, name, provider, category, is_free, member_only, super_member_only, status')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('sort_order');
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch models' });
    }
    
    // 标记可用性
    const availableModels = models?.map(m => ({
      ...m,
      available: AI_PROVIDERS[m.provider]?.apiKey ? true : false,
    }));
    
    res.json({
      success: true,
      data: availableModels,
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
