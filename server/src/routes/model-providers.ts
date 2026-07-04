/**
 * 厂商模型统一对接路由
 * 提供所有厂商模型的统一调用接口
 */
import express from 'express';
import type { Request, Response } from 'express';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  MODEL_PROVIDERS,
  AVAILABLE_MODELS,
  getProviderApiKey,
  isProviderAvailable,
  getAvailableModels,
  getModelsByCategory,
  getModelsByProvider,
  getModelPricing,
  type ModelProvider,
  type ModelConfig,
} from '../config/model-providers.js';
import ModelService from '../services/model-service.js';

const router = express.Router();
const config = new Config();

// ==================== 厂商管理 ====================

/**
 * GET /api/v1/model-providers
 * 获取所有厂商列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const providers = Object.values(MODEL_PROVIDERS).map(provider => ({
      id: provider.id,
      name: provider.name,
      nameEn: provider.nameEn,
      icon: provider.icon,
      website: provider.website,
      docs: provider.docs,
      status: provider.status,
      categories: provider.categories,
      features: provider.features,
      isAvailable: isProviderAvailable(provider.id),
    }));

    res.json({
      success: true,
      providers,
      total: providers.length,
    });
  } catch (error) {
    console.error('获取厂商列表失败:', error);
    res.status(500).json({ success: false, error: '获取厂商列表失败' });
  }
});

/**
 * GET /api/v1/model-providers/:providerId
 * 获取单个厂商详情
 */
router.get('/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const provider = MODEL_PROVIDERS[providerId];

    if (!provider) {
      return res.status(404).json({ success: false, error: '厂商不存在' });
    }

    const models = getModelsByProvider(providerId);

    res.json({
      success: true,
      provider: {
        ...provider,
        isAvailable: isProviderAvailable(providerId),
      },
      models: models.map(m => ({
        id: m.id,
        code: m.code,
        name: m.name,
        description: m.description,
        category: m.category,
        type: m.type,
        contextWindow: m.contextWindow,
        maxOutputTokens: m.maxOutputTokens,
        features: m.features,
        status: m.status,
        tags: m.tags,
        pricing: getModelPricing(m),
      })),
    });
  } catch (error) {
    console.error('获取厂商详情失败:', error);
    res.status(500).json({ success: false, error: '获取厂商详情失败' });
  }
});

// ==================== 模型管理 ====================

/**
 * GET /api/v1/model-providers/models/all
 * 获取所有可用模型列表
 */
router.get('/models/all', async (req: Request, res: Response) => {
  try {
    const { category, provider, available } = req.query;

    let models = AVAILABLE_MODELS;

    // 按类别筛选
    if (category && typeof category === 'string') {
      models = models.filter(m => m.category === category);
    }

    // 按厂商筛选
    if (provider && typeof provider === 'string') {
      models = models.filter(m => m.provider === provider);
    }

    // 只显示可用的模型
    if (available === 'true') {
      models = models.filter(m => isProviderAvailable(m.provider));
    }

    res.json({
      success: true,
      models: models.map(m => ({
        id: m.id,
        code: m.code,
        name: m.name,
        provider: m.provider,
        providerName: MODEL_PROVIDERS[m.provider]?.name || m.provider,
        description: m.description,
        category: m.category,
        type: m.type,
        contextWindow: m.contextWindow,
        maxOutputTokens: m.maxOutputTokens,
        features: m.features,
        status: m.status,
        tags: m.tags,
        isAvailable: isProviderAvailable(m.provider),
        pricing: getModelPricing(m),
      })),
      total: models.length,
    });
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({ success: false, error: '获取模型列表失败' });
  }
});

/**
 * GET /api/v1/model-providers/models/categories
 * 获取模型类别统计
 */
router.get('/models/categories', async (req: Request, res: Response) => {
  try {
    const categories: Record<string, number> = {};

    AVAILABLE_MODELS.forEach(model => {
      categories[model.category] = (categories[model.category] || 0) + 1;
    });

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('获取模型类别失败:', error);
    res.status(500).json({ success: false, error: '获取模型类别失败' });
  }
});

// ==================== 模型测试 ====================

/**
 * POST /api/v1/model-providers/test/:providerId
 * 测试厂商连接
 */
router.post('/test/:providerId', async (req: Request, res: Response) => {
  try {
    const { providerId } = req.params;
    const { apiKey } = req.body;

    const provider = MODEL_PROVIDERS[providerId];
    if (!provider) {
      return res.status(404).json({ success: false, error: '厂商不存在' });
    }

    // 使用用户提供的API密钥或环境变量中的密钥
    const testApiKey = apiKey || getProviderApiKey(providerId);

    if (!testApiKey) {
      return res.status(400).json({
        success: false,
        error: '未配置API密钥',
        hint: `请在环境变量中设置 ${provider.apiKeyEnv} 或在请求中提供 apiKey 参数`,
      });
    }

    // 获取该厂商的一个模型进行测试
    const testModel = AVAILABLE_MODELS.find(m => m.provider === providerId && m.type === 'chat');

    if (!testModel) {
      return res.json({
        success: true,
        message: '厂商连接测试通过（无可用的聊天模型进行测试）',
        provider: providerId,
      });
    }

    // 尝试调用模型
    const testMessage = '你好，这是一个连接测试。请简单回复"测试成功"。';

    try {
      // 使用统一的模型服务
      const result = await ModelService.chat({
        model: testModel.code,
        messages: [{ role: 'user', content: testMessage }],
        temperature: 0.7,
        maxTokens: 100,
      });

      res.json({
        success: true,
        message: '厂商连接测试成功',
        provider: providerId,
        model: testModel.code,
        response: result.content,
        usage: result.usage,
      });
    } catch (modelError) {
      // 如果模型调用失败，尝试使用 coze-coding-dev-sdk
      try {
        const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
        const client = new LLMClient(config, customHeaders);

        const response = await client.invoke([
          { role: 'user', content: testMessage },
        ], { temperature: 0.7 });

        res.json({
          success: true,
          message: '厂商连接测试成功（通过Coze SDK）',
          provider: 'coze',
          response: response.content,
        });
      } catch (sdkError) {
        res.json({
          success: false,
          error: '模型调用失败',
          provider: providerId,
          model: testModel.code,
          details: modelError instanceof Error ? modelError.message : String(modelError),
        });
      }
    }
  } catch (error) {
    console.error('测试厂商连接失败:', error);
    res.status(500).json({ success: false, error: '测试厂商连接失败' });
  }
});

/**
 * POST /api/v1/model-providers/models/test/:modelCode
 * 测试特定模型
 */
router.post('/models/test/:modelCode', async (req: Request, res: Response) => {
  try {
    const { modelCode } = req.params;
    const { message, apiKey } = req.body;

    const model = AVAILABLE_MODELS.find(m => m.code === modelCode);
    if (!model) {
      return res.status(404).json({ success: false, error: '模型不存在' });
    }

    // 检查厂商是否可用
    if (!isProviderAvailable(model.provider) && !apiKey) {
      return res.status(400).json({
        success: false,
        error: '未配置该厂商的API密钥',
        provider: model.provider,
        hint: `请在环境变量中设置 ${MODEL_PROVIDERS[model.provider]?.apiKeyEnv}`,
      });
    }

    const testMessage = message || '你好，这是一个模型测试。请简单介绍一下你自己。';

    // 使用模型服务调用
    const result = await ModelService.chat({
      model: modelCode,
      messages: [{ role: 'user', content: testMessage }],
      temperature: 0.7,
      maxTokens: 500,
    });

    res.json({
      success: true,
      model: modelCode,
      modelName: model.name,
      provider: model.provider,
      response: result.content,
      usage: result.usage,
    });
  } catch (error) {
    console.error('测试模型失败:', error);
    res.status(500).json({
      success: false,
      error: '测试模型失败',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ==================== 统一聊天接口 ====================

/**
 * POST /api/v1/model-providers/chat
 * 统一聊天接口（支持所有厂商模型）
 * 
 * Body:
 * - model: 模型代码（必需）
 * - messages: 消息数组（必需）
 * - temperature?: 温度参数
 * - maxTokens?: 最大输出token数
 * - stream?: 是否流式输出
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { model: modelCode, messages, temperature, maxTokens, stream = true } = req.body;

    if (!modelCode || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'model 和 messages 是必需参数',
      });
    }

    const model = AVAILABLE_MODELS.find(m => m.code === modelCode);
    if (!model) {
      return res.status(404).json({ success: false, error: '模型不存在' });
    }

    // 检查厂商是否可用
    if (!isProviderAvailable(model.provider)) {
      // 尝试使用 Coze SDK
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
      const client = new LLMClient(config, customHeaders);

      if (stream) {
        // 流式响应
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
        res.setHeader('Connection', 'keep-alive');

        try {
          const streamIterator = client.stream(messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })), { temperature: temperature ?? 0.7 });

          for await (const chunk of streamIterator) {
            if (chunk.content) {
              res.write(`data: ${JSON.stringify({ content: chunk.content.toString() })}\n\n`);
            }
          }

          res.write('data: [DONE]\n\n');
          res.end();
        } catch (streamError) {
          console.error('Stream error:', streamError);
          res.write(`data: ${JSON.stringify({ error: '处理失败' })}\n\n`);
          res.end();
        }
      } else {
        // 非流式响应
        const response = await client.invoke(messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })), { temperature: temperature ?? 0.7 });

        res.json({
          success: true,
          model: 'coze-default',
          content: response.content,
        });
      }
      return;
    }

    // 使用模型服务
    const request = {
      model: modelCode,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      maxTokens,
    };

    if (stream) {
      // 流式响应
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
      res.setHeader('Connection', 'keep-alive');

      await ModelService.chatStream(
        request,
        (chunk) => {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        },
        () => {
          res.write('data: [DONE]\n\n');
          res.end();
        },
        (error) => {
          console.error('Chat stream error:', error);
          res.write(`data: ${JSON.stringify({ error: '处理失败' })}\n\n`);
          res.end();
        }
      );
    } else {
      // 非流式响应
      const response = await ModelService.chat(request);

      res.json({
        success: true,
        model: modelCode,
        modelName: model.name,
        provider: model.provider,
        content: response.content,
        usage: response.usage,
      });
    }
  } catch (error) {
    console.error('聊天请求失败:', error);
    res.status(500).json({
      success: false,
      error: '聊天请求失败',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;