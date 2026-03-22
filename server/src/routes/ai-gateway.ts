/**
 * AI 网关路由（升级版）
 * 整合统一模型适配器架构，保留会员权限和计费逻辑
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import ModelService, { type ChatRequest } from '../services/model-service.js';
import { AVAILABLE_MODELS, MODEL_PROVIDERS } from '../config/model-providers.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 聊天补全 ====================

const chatSchema = z.object({
  userId: z.string(),
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.enum(['text', 'image_url']),
        text: z.string().optional(),
        image_url: z.object({ url: z.string() }).optional(),
      })),
    ]),
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
    const modelInfo = AVAILABLE_MODELS.find(m => m.code === body.model);
    if (!modelInfo) {
      return res.status(404).json({ error: 'Model not found' });
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
    
    // 根据会员等级限制
    if (modelInfo.superMemberOnly && !isSuperMember) {
      return res.status(403).json({ error: '此模型仅限超级会员使用' });
    }
    if (modelInfo.memberOnly && !isMember) {
      return res.status(403).json({ error: '此模型需要会员权限' });
    }
    
    // 3. 检查余额（平台抽成模式下所有模型都收费）
    // isFree 默认为 false，所有模型都需要付费
    const isFreeModel = modelInfo.isFree ?? false;
    if (!isFreeModel) {
      const { data: balance } = await client
        .from('user_balances')
        .select('balance')
        .eq('user_id', body.userId)
        .single();
      
      // 至少需要 1 元余额
      if (!balance || balance.balance < 100) {
        return res.status(402).json({ error: '余额不足，请充值' });
      }
    }
    
    // 4. 调用统一模型服务
    const request: ChatRequest = {
      model: body.model,
      messages: body.messages.map(m => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : m.content,
      })),
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      stream: body.stream,
    };
    
    if (body.stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
      res.setHeader('Connection', 'keep-alive');
      
      let inputTokens = 0;
      let outputTokens = 0;
      let fullContent = '';
      
      try {
        await ModelService.chatStream(
          request,
          (chunk) => {
            fullContent += chunk.content;
            outputTokens = Math.ceil(fullContent.length / 4);
            
            res.write(`data: ${JSON.stringify({
              content: chunk.content,
              model: body.model,
            })}\n\n`);
          },
          async () => {
            // 估算输入 token
            inputTokens = Math.ceil(JSON.stringify(body.messages).length / 4);
            
            // 扣费（平台抽成模式下所有模型都收费）
            if (!isFreeModel) {
              await deductFee(body.userId, modelInfo, inputTokens, outputTokens, body.projectId);
            }
            
            res.write('data: [DONE]\n\n');
            res.end();
          },
          (error) => {
            console.error('Stream error:', error);
            res.write(`data: ${JSON.stringify({ error: '处理失败' })}\n\n`);
            res.end();
          }
        );
      } catch (error) {
        console.error('Chat stream error:', error);
        res.write(`data: ${JSON.stringify({ error: '处理失败' })}\n\n`);
        res.end();
      }
    } else {
      // 非流式响应
      const response = await ModelService.chat(request);
      
      // 扣费（平台抽成模式下所有模型都收费）
      if (!isFreeModel) {
        await deductFee(
          body.userId, 
          modelInfo, 
          response.usage?.promptTokens || 0, 
          response.usage?.completionTokens || 0, 
          body.projectId
        );
      }
      
      res.json({
        success: true,
        data: response,
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '请求无效' });
  }
});

// ==================== 图像生成 ====================

const imageSchema = z.object({
  userId: z.string(),
  model: z.string(),
  prompt: z.string().min(1).max(4000),
  size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']).optional().default('1024x1024'),
  n: z.number().int().min(1).max(4).optional().default(1),
  quality: z.enum(['standard', 'hd']).optional().default('standard'),
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
    const modelInfo = AVAILABLE_MODELS.find(m => m.code === body.model && m.category === 'image');
    if (!modelInfo) {
      return res.status(404).json({ error: '图像模型未找到' });
    }
    
    // 2. 检查余额
    const { data: balance } = await client
      .from('user_balances')
      .select('balance')
      .eq('user_id', body.userId)
      .single();
    
    // 计算费用（每张图按模型定价）
    const feePerImage = modelInfo.sellOutputPrice || modelInfo.outputPrice || 100; // 默认 1 元/张
    const totalFee = feePerImage * body.n;
    
    if (!balance || balance.balance < totalFee) {
      return res.status(402).json({ error: '余额不足' });
    }
    
    // 3. 调用模型服务
    const adapter = ModelService.getAdapter(modelInfo.provider);
    const result = await adapter.imageGeneration(body.prompt, {
      model: body.model,
      size: body.size,
      n: body.n,
      quality: body.quality,
    });
    
    // 4. 扣费
    await deductFeeSimple(body.userId, totalFee, 'image', modelInfo.name, body.projectId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '请求无效' });
  }
});

// ==================== 语音识别 ====================

const audioTranscribeSchema = z.object({
  userId: z.string(),
  model: z.string().optional().default('whisper-1'),
  audioUrl: z.string().url(),
  language: z.string().optional(),
  projectId: z.string().optional(),
});

/**
 * 语音转文字
 * POST /api/v1/ai/audio/transcribe
 */
router.post('/audio/transcribe', async (req: Request, res: Response) => {
  try {
    const body = audioTranscribeSchema.parse(req.body);
    
    // 1. 获取模型配置
    const modelInfo = AVAILABLE_MODELS.find(m => m.code === body.model && m.category === 'audio');
    if (!modelInfo) {
      return res.status(404).json({ error: '音频模型未找到' });
    }
    
    // 2. 调用模型服务
    const adapter = ModelService.getAdapter(modelInfo.provider);
    const result = await adapter.audioTranscription(body.audioUrl, {
      model: body.model,
      language: body.language,
    });
    
    // 3. 计费（按时长，这里简化处理）
    const fee = 50; // 假设固定 0.5 元
    await deductFeeSimple(body.userId, fee, 'audio', modelInfo.name, body.projectId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Audio transcription error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '请求无效' });
  }
});

// ==================== 文字转语音 ====================

const ttsSchema = z.object({
  userId: z.string(),
  model: z.string().optional().default('tts-1'),
  text: z.string().min(1).max(4000),
  voice: z.string().optional().default('alloy'),
  projectId: z.string().optional(),
});

/**
 * 文字转语音
 * POST /api/v1/ai/audio/synthesize
 */
router.post('/audio/synthesize', async (req: Request, res: Response) => {
  try {
    const body = ttsSchema.parse(req.body);
    
    // 1. 获取模型配置
    const modelInfo = AVAILABLE_MODELS.find(m => m.code === body.model && m.category === 'audio');
    if (!modelInfo) {
      return res.status(404).json({ error: 'TTS 模型未找到' });
    }
    
    // 2. 调用模型服务
    const adapter = ModelService.getAdapter(modelInfo.provider);
    const audioBuffer = await adapter.textToSpeech(body.text, {
      model: body.model,
      voice: body.voice,
    });
    
    // 3. 计费
    const fee = Math.ceil(body.text.length / 100); // 每 100 字符 1 分钱
    await deductFeeSimple(body.userId, fee, 'tts', modelInfo.name, body.projectId);
    
    // 4. 返回音频数据
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : '请求无效' });
  }
});

// ==================== 模型列表 ====================

/**
 * 获取可用模型列表
 * GET /api/v1/ai/models
 * Query: type?: 'text' | 'image' | 'audio' | 'video' | 'embedding'
 * 
 * 从数据库获取模型列表，确保数据一致性
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const { type, provider } = req.query;
    
    // 从数据库获取模型
    let query = client
      .from('ai_models')
      .select('*')
      .eq('status', 'active')
      .eq('is_public', true)
      .order('sort_order', { ascending: true });
    
    // 按类型筛选
    if (type && typeof type === 'string') {
      query = query.eq('category', type);
    }
    
    // 按提供商筛选
    if (provider && typeof provider === 'string') {
      query = query.eq('provider', provider);
    }
    
    const { data: models, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: '获取模型列表失败' });
    }
    
    // 转换为前端友好格式（仅返回售价，不返回成本价）
    const result = models.map(m => ({
      code: m.code,
      name: m.name,
      provider: m.provider,
      providerName: MODEL_PROVIDERS[m.provider]?.name || m.provider,
      type: m.type,
      category: m.category,
      description: m.description || `${m.name} - ${m.provider}`,
      // 价格（厘/千tokens）- 数据库单位是厘/百万tokens，转换为厘/千tokens
      sellInputPrice: m.sell_input_price / 1000,
      sellOutputPrice: m.sell_output_price / 1000,
      // 上下文信息
      contextWindow: m.max_context_tokens,
      maxOutputTokens: m.max_output_tokens,
      // 标签
      tags: m.tags || [],
    }));
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: '获取模型列表失败' });
  }
});

/**
 * 获取所有提供商
 * GET /api/v1/ai/providers
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    // 从数据库获取提供商列表
    const { data: models, error } = await client
      .from('ai_models')
      .select('provider, code, name, type')
      .eq('status', 'active')
      .eq('is_public', true);
    
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: '获取提供商列表失败' });
    }
    
    // 按提供商分组
    const providerMap = new Map<string, { code: string; name: string; type: string }[]>();
    models.forEach(m => {
      if (!providerMap.has(m.provider)) {
        providerMap.set(m.provider, []);
      }
      providerMap.get(m.provider)!.push({
        code: m.code,
        name: m.name,
        type: m.type,
      });
    });
    
    const providers = Array.from(providerMap.entries()).map(([id, models]) => ({
      id,
      name: MODEL_PROVIDERS[id]?.name || id,
      models,
    }));
    
    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: '获取提供商列表失败' });
  }
});

// ==================== 辅助函数 ====================

/**
 * 扣费（详细）- 使用新的价格体系
 * 费用 = 平台售价（包含平台服务费）
 */
async function deductFee(
  userId: string,
  modelInfo: any,
  inputTokens: number,
  outputTokens: number,
  projectId?: string
) {
  // 计算费用（厘为单位）- 使用平台售价
  const inputFee = Math.ceil((inputTokens / 1000000) * (modelInfo.sellInputPrice || 0));
  const outputFee = Math.ceil((outputTokens / 1000000) * (modelInfo.sellOutputPrice || 0));
  const totalFee = inputFee + outputFee;
  
  // 计算成本（商家收费）
  const inputCost = Math.ceil((inputTokens / 1000000) * (modelInfo.costInputPrice || 0));
  const outputCost = Math.ceil((outputTokens / 1000000) * (modelInfo.costOutputPrice || 0));
  const totalCost = inputCost + outputCost;
  
  // 平台利润
  const platformProfit = totalFee - totalCost;
  
  if (totalFee <= 0) return;
  
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
        balance: Math.max(0, (balance as any).balance - totalFee),
        total_consumed: ((balance as any).total_consumed || 0) + totalFee,
        monthly_consumed: ((balance as any).monthly_consumed || 0) + totalFee,
      })
      .eq('user_id', userId);
  }
  
  // 记录消费（包含成本和平台利润）
  await client.from('consumption_records').insert([{
    user_id: userId,
    consumption_type: 'model',
    resource_id: modelInfo.code,
    resource_name: modelInfo.name,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    // 售价（用户支付）
    sell_input_fee: inputFee,
    sell_output_fee: outputFee,
    sell_total: totalFee,
    // 成本（商家收费）
    cost_input_fee: inputCost,
    cost_output_fee: outputCost,
    cost_total: totalCost,
    // 平台利润
    profit: platformProfit,
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
    await client
      .from('user_balances')
      .update({
        balance: Math.max(0, (balance as any).balance - fee),
        total_consumed: ((balance as any).total_consumed || 0) + fee,
      })
      .eq('user_id', userId);
  }
  
  // 记录消费
  await client.from('consumption_records').insert([{
    user_id: userId,
    consumption_type: type,
    resource_name: resourceName,
    sell_total: fee,
    project_id: projectId,
  }]);
}

export default router;
