/**
 * 用户 API Key 管理 API
 * 用户自带 API Key，平台只收服务费
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// 加密配置
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').slice(0, 32);

// 加密API密钥
const encryptApiKey = (apiKey: string): { encrypted: string; iv: string } => {
  const iv = crypto.randomBytes(16).toString('hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv };
};

// 解密API密钥
const decryptApiKey = (encrypted: string, iv: string): string => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// 验证API Key格式
const validateApiKey = async (provider: string, apiKey: string): Promise<{ valid: boolean; message?: string }> => {
  try {
    switch (provider.toLowerCase()) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, message: 'OpenAI API Key 应以 sk- 开头' };
        }
        // 实际验证调用
        const openaiRes = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        return { valid: openaiRes.ok };
        
      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          return { valid: false, message: 'Anthropic API Key 应以 sk-ant- 开头' };
        }
        return { valid: true };
        
      case 'google':
        if (apiKey.length < 20) {
          return { valid: false, message: 'Google API Key 格式不正确' };
        }
        return { valid: true };
        
      case 'deepseek':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, message: 'DeepSeek API Key 应以 sk- 开头' };
        }
        return { valid: true };
        
      default:
        return { valid: true }; // 其他厂商默认通过
    }
  } catch (error) {
    console.error('Validate API key error:', error);
    return { valid: false, message: '验证失败，请检查网络' };
  }
};

// 掩码显示API Key
const maskApiKey = (apiKey: string): string => {
  if (apiKey.length <= 8) return '****';
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
};

// ==================== API Key 管理 ====================

const addApiKeySchema = z.object({
  userId: z.string(),
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  label: z.string().optional(),
});

/**
 * 添加用户 API Key
 * POST /api/v1/user/api-keys
 */
router.post('/api-keys', async (req: Request, res: Response) => {
  try {
    const data = addApiKeySchema.parse(req.body);

    // 验证 API Key 格式
    const validation = await validateApiKey(data.provider, data.apiKey);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: validation.message || 'API Key 验证失败' 
      });
    }

    // 加密存储
    const { encrypted, iv } = encryptApiKey(data.apiKey);

    // 检查是否已存在
    const { data: existing } = await client
      .from('user_api_keys')
      .select('id')
      .eq('user_id', data.userId)
      .eq('provider', data.provider)
      .single();

    if (existing) {
      // 更新
      const { error } = await client
        .from('user_api_keys')
        .update({
          api_key_encrypted: encrypted,
          api_key_iv: iv,
          api_key_masked: maskApiKey(data.apiKey),
          is_valid: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // 新增
      const { error } = await client
        .from('user_api_keys')
        .insert([{
          user_id: data.userId,
          provider: data.provider,
          api_key_encrypted: encrypted,
          api_key_iv: iv,
          api_key_masked: maskApiKey(data.apiKey),
          is_valid: true,
          label: data.label,
        }]);

      if (error) throw error;
    }

    // 记录日志
    await client.from('api_key_logs').insert([{
      user_id: data.userId,
      action: existing ? 'update' : 'add',
      provider: data.provider,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    }]);

    res.json({ 
      success: true, 
      message: 'API Key 添加成功' 
    });
  } catch (error) {
    console.error('Add API key error:', error);
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : '添加失败' 
    });
  }
});

/**
 * 获取用户 API Key 列表
 * GET /api/v1/user/api-keys
 */
router.get('/api-keys', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: '缺少用户ID' });
    }

    const { data: keys, error } = await client
      .from('user_api_keys')
      .select('id, provider, api_key_masked, is_valid, label, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ 
      success: true, 
      data: keys || [] 
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * 删除用户 API Key
 * DELETE /api/v1/user/api-keys/:id
 */
router.delete('/api-keys/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const { error } = await client
      .from('user_api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

/**
 * 解密获取 API Key（内部使用）
 * GET /api/v1/user/api-keys/:id/decrypt
 */
router.get('/api-keys/:id/decrypt', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, serviceId } = req.query;

    // 获取 API Key
    const { data: keyRecord, error } = await client
      .from('user_api_keys')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !keyRecord) {
      return res.status(404).json({ error: 'API Key 不存在' });
    }

    // 解密
    const decryptedKey = decryptApiKey(keyRecord.api_key_encrypted, keyRecord.api_key_iv);

    // 记录使用日志
    await client.from('api_key_usage_logs').insert([{
      user_id: userId as string,
      api_key_id: id,
      service_id: serviceId as string,
      action: 'decrypt',
    }]);

    res.json({ 
      success: true, 
      apiKey: decryptedKey 
    });
  } catch (error) {
    console.error('Decrypt API key error:', error);
    res.status(500).json({ error: '解密失败' });
  }
});

// ==================== 服务调用计费 ====================

/**
 * 计算服务费用
 * POST /api/v1/user/service/calculate-fee
 */
router.post('/service/calculate-fee', async (req: Request, res: Response) => {
  try {
    const { serviceId, inputTokens, outputTokens } = req.body;

    // 获取服务信息
    const { data: service, error } = await client
      .from('vendor_services')
      .select('*')
      .eq('id', serviceId)
      .eq('status', 'active')
      .single();

    if (error || !service) {
      return res.status(404).json({ error: '服务不存在' });
    }

    // 计算费用
    const inputCost = (inputTokens / 1000) * service.input_price;
    const outputCost = (outputTokens / 1000) * service.output_price;
    const totalCost = inputCost + outputCost;

    // 计算平台服务费（基于成本价）
    const platformFee = totalCost * service.platform_markup;
    const userPay = totalCost; // 用户支付总额（包含平台服务费）

    res.json({
      success: true,
      data: {
        inputCost: inputCost / 100, // 转为元
        outputCost: outputCost / 100,
        platformFee: platformFee / 100,
        userPay: userPay / 100,
        breakdown: {
          inputTokens,
          outputTokens,
          inputPricePerK: service.input_price / 100,
          outputPricePerK: service.output_price / 100,
          platformMarkup: service.platform_markup,
        },
      },
    });
  } catch (error) {
    console.error('Calculate fee error:', error);
    res.status(500).json({ error: '计算失败' });
  }
});

/**
 * 记录服务调用
 * POST /api/v1/user/service/log-call
 */
router.post('/service/log-call', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      serviceId,
      success,
      inputTokens,
      outputTokens,
      totalCost,
      platformFee,
      errorMessage,
    } = req.body;

    // 获取服务信息
    const { data: service } = await client
      .from('vendor_services')
      .select('vendor_id')
      .eq('id', serviceId)
      .single();

    // 记录调用日志
    const { error } = await client
      .from('service_call_logs')
      .insert([{
        user_id: userId,
        service_id: serviceId,
        vendor_id: service?.vendor_id,
        success,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_cost: totalCost, // 厘
        platform_fee: platformFee, // 厘
        error_message: errorMessage,
      }]);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Log call error:', error);
    res.status(500).json({ error: '记录失败' });
  }
});

// ==================== 公开服务列表 ====================

/**
 * 获取公开服务列表
 * GET /api/v1/vendor/services/public
 */
router.get('/vendor/services/public', async (req: Request, res: Response) => {
  try {
    const { type, search, limit = 50, offset = 0 } = req.query;

    let query = client
      .from('vendor_services')
      .select(`
        *,
        vendors (
          id,
          company_name,
          description,
          logo_url,
          rating
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (type) {
      query = query.eq('service_type', type);
    }

    if (search) {
      query = query.or(`service_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: services, error } = await query;

    if (error) throw error;

    // 处理返回数据，计算最终价格
    const processedServices = (services || []).map(s => ({
      ...s,
      final_input_price: Math.ceil(s.input_price * (1 + s.platform_markup)),
      final_output_price: Math.ceil(s.output_price * (1 + s.platform_markup)),
      api_key_encrypted: undefined,
      api_key_iv: undefined,
    }));

    res.json({ 
      success: true, 
      data: processedServices 
    });
  } catch (error) {
    console.error('Get public services error:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

export default router;
