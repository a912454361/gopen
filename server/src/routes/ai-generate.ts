/**
 * AI内容生成路由
 * 用于游戏工作台和动漫工作台的AI生成功能
 * 支持所有厂商模型
 */
import express from 'express';
import type { Request, Response } from 'express';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  AVAILABLE_MODELS,
  isProviderAvailable,
  getModelPricing,
  type ModelConfig,
} from '../config/model-providers.js';
import ModelService from '../services/model-service.js';

const router = express.Router();
const config = new Config();

/**
 * POST /api/v1/ai/generate
 * AI生成游戏/动漫内容
 * 
 * Body:
 * - type: 'character' | 'scene' | 'item' | 'script' | 'anime_character' | 'anime_scene'
 * - prompt: 描述文本
 * - style?: 动漫风格 (anime, comic, chibi, realistic, watercolor)
 * - projectId?: 项目ID
 * - model?: 模型代码（可选，默认使用豆包）
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { type, prompt, style, projectId, model: modelCode } = req.body;

    if (!type || !prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'type 和 prompt 是必需参数' 
      });
    }

    // 根据类型构建不同的系统提示
    let systemPrompt = '';

    switch (type) {
      case 'character':
        systemPrompt = `你是一个专业的游戏角色设计师。根据用户描述，设计一个游戏角色。
你需要返回JSON格式的数据：
{
  "name": "角色名称",
  "description": "角色描述（50-100字）",
  "attributes": {
    "hp": 生命值(50-200),
    "attack": 攻击力(20-100),
    "defense": 防御力(20-100),
    "speed": 速度(10-50)
  },
  "skills": [
    {
      "id": "skill_1",
      "name": "技能名称",
      "description": "技能描述",
      "damage": 伤害值(10-80),
      "cost": 消耗(10-50),
      "cooldown": 冷却回合(1-5)
    }
  ]
}`;
        break;

      case 'anime_character':
        systemPrompt = `你是一个专业的动漫角色设计师。根据用户描述，设计一个${style || '日式动漫'}风格的角色。
你需要返回JSON格式的数据：
{
  "name": "角色名称",
  "description": "角色描述（50-100字）",
  "traits": ["性格特点1", "性格特点2"],
  "background": "角色背景故事",
  "appearance": "外貌特征描述",
  "expressions": ["开心", "悲伤", "愤怒", "惊讶", "平静"]
}`;
        break;

      case 'scene':
        systemPrompt = `你是一个专业的游戏场景设计师。根据用户描述，设计一个游戏场景。
你需要返回JSON格式的数据：
{
  "name": "场景名称",
  "description": "场景描述（50-100字）",
  "background": "背景颜色或主题",
  "atmosphere": "氛围描述",
  "elements": ["场景元素1", "场景元素2"]
}`;
        break;

      case 'anime_scene':
        systemPrompt = `你是一个专业的动漫场景设计师。根据用户描述，设计一个${style || '日式动漫'}风格的场景。
你需要返回JSON格式的数据：
{
  "name": "场景名称",
  "description": "场景描述（50-100字）",
  "timeOfDay": "时间(morning/afternoon/evening/night)",
  "weather": "天气(sunny/cloudy/rainy/snowy)",
  "background": "背景描述",
  "atmosphere": "氛围描述"
}`;
        break;

      case 'item':
        systemPrompt = `你是一个专业的游戏道具设计师。根据用户描述，设计一个游戏道具。
你需要返回JSON格式的数据：
{
  "name": "道具名称",
  "type": "类型(weapon/armor/consumable/key)",
  "description": "道具描述（50-100字）",
  "rarity": "稀有度(common/rare/epic/legendary)",
  "attributes": {
    "属性名": 属性值
  },
  "effect": "使用效果描述"
}`;
        break;

      case 'script':
        systemPrompt = `你是一个专业的游戏剧情编剧。根据用户描述，编写一个游戏剧情脚本。
你需要返回JSON格式的数据：
{
  "name": "剧情标题",
  "content": "剧情内容",
  "triggers": ["触发条件1", "触发条件2"],
  "choices": [
    {
      "text": "选项文本",
      "consequence": "选择后果"
    }
  ],
  "rewards": {
    "gold": 金币奖励,
    "exp": 经验奖励
  }
}`;
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: '不支持的生成类型' 
        });
    }

    // 调用LLM生成内容
    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请根据以下描述生成${type === 'character' ? '游戏角色' : type === 'anime_character' ? '动漫角色' : type === 'scene' ? '游戏场景' : type === 'anime_scene' ? '动漫场景' : type === 'item' ? '游戏道具' : '剧情脚本'}：\n\n${prompt}` }
    ];

    let fullResponse = '';
    let usedModel = 'coze-default';

    try {
      // 如果指定了模型，尝试使用模型服务
      if (modelCode) {
        const modelConfig = AVAILABLE_MODELS.find(m => m.code === modelCode);
        if (modelConfig && isProviderAvailable(modelConfig.provider)) {
          usedModel = modelCode;
          const response = await ModelService.chat({
            model: modelCode,
            messages: llmMessages,
            temperature: 0.7,
          });
          fullResponse = response.content;
        } else {
          // 模型不可用，使用 Coze SDK
          console.log(`模型 ${modelCode} 不可用，使用默认模型`);
        }
      }

      // 如果没有指定模型或模型不可用，使用 Coze SDK
      if (!fullResponse) {
        const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
        const client = new LLMClient(config, customHeaders);
        
        const stream = client.stream(llmMessages, {
          temperature: 0.7,
        });

        for await (const chunk of stream) {
          const content = chunk.content;
          if (typeof content === 'string') {
            fullResponse += content;
          } else if (content && typeof content === 'object' && 'content' in content) {
            fullResponse += (content as any).content;
          }
        }
      }
    } catch (llmError) {
      console.error('LLM调用失败:', llmError);
      // 返回示例数据
      return res.json({
        success: true,
        name: type.includes('character') ? '神秘角色' : type.includes('scene') ? '神秘场景' : '神秘道具',
        description: prompt,
        image: '',
        attributes: type === 'character' ? { hp: 100, attack: 50, defense: 30, speed: 20 } : undefined,
        skills: type === 'character' ? [{ id: 'skill_1', name: '基础攻击', description: '普通攻击', damage: 30, cost: 10, cooldown: 1 }] : undefined,
        timeOfDay: type === 'anime_scene' ? 'afternoon' : undefined,
        weather: type === 'anime_scene' ? 'sunny' : undefined,
      });
    }

    // 解析JSON响应
    try {
      // 提取JSON部分
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return res.json({
          success: true,
          ...result,
          image: '', // 图片需要单独生成
          model: usedModel,
        });
      }
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
    }

    // 如果解析失败，返回文本响应
    return res.json({
      success: true,
      name: type.includes('character') ? '创作角色' : type.includes('scene') ? '创作场景' : '创作内容',
      description: fullResponse.substring(0, 200),
      image: '',
      model: usedModel,
    });

  } catch (error) {
    console.error('AI生成失败:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'AI生成失败，请稍后重试' 
    });
  }
});

/**
 * POST /api/v1/ai/generate-stream
 * AI生成内容（流式输出）
 * 
 * Body:
 * - type: 'character' | 'scene' | 'item' | 'script' | 'anime_character' | 'anime_scene'
 * - prompt: 描述文本
 * - style?: 动漫风格
 * - model?: 模型代码（可选）
 */
router.post('/generate-stream', async (req: Request, res: Response) => {
  try {
    const { type, prompt, style, model: modelCode } = req.body;

    if (!type || !prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'type 和 prompt 是必需参数' 
      });
    }

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
    res.setHeader('Connection', 'keep-alive');

    // 根据类型构建系统提示
    let systemPrompt = '';
    
    switch (type) {
      case 'character':
        systemPrompt = '你是专业的游戏角色设计师，请根据用户描述设计角色，返回JSON格式数据。';
        break;
      case 'anime_character':
        systemPrompt = `你是专业的${style || '日式动漫'}风格角色设计师，请根据用户描述设计角色，返回JSON格式数据。`;
        break;
      case 'scene':
        systemPrompt = '你是专业的游戏场景设计师，请根据用户描述设计场景，返回JSON格式数据。';
        break;
      case 'anime_scene':
        systemPrompt = `你是专业的${style || '日式动漫'}风格场景设计师，请根据用户描述设计场景，返回JSON格式数据。`;
        break;
      case 'item':
        systemPrompt = '你是专业的游戏道具设计师，请根据用户描述设计道具，返回JSON格式数据。';
        break;
      case 'script':
        systemPrompt = '你是专业的游戏剧情编剧，请根据用户描述编写剧情，返回JSON格式数据。';
        break;
      default:
        res.write(`data: ${JSON.stringify({ error: '不支持的生成类型' })}\n\n`);
        res.end();
        return;
    }

    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    try {
      // 如果指定了模型且可用，使用模型服务
      if (modelCode) {
        const modelConfig = AVAILABLE_MODELS.find(m => m.code === modelCode);
        if (modelConfig && isProviderAvailable(modelConfig.provider)) {
          await ModelService.chatStream(
            { model: modelCode, messages: llmMessages },
            (chunk) => {
              res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            },
            () => {
              res.write('data: [DONE]\n\n');
              res.end();
            },
            (error) => {
              console.error('Stream error:', error);
              res.write(`data: ${JSON.stringify({ error: '处理失败' })}\n\n`);
              res.end();
            }
          );
          return;
        }
      }

      // 使用 Coze SDK
      const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
      const client = new LLMClient(config, customHeaders);

      const stream = client.stream(llmMessages, {
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content: content.toString() })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (streamError) {
      console.error('Stream error:', streamError);
      res.write(`data: ${JSON.stringify({ error: '处理失败' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('AI生成失败:', error);
    res.write(`data: ${JSON.stringify({ error: 'AI生成失败' })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/v1/ai/generate-image
 * AI生成图片（角色/场景）
 */
router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const { type, prompt, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'prompt 是必需参数' 
      });
    }

    // 这里可以调用图片生成API
    // 暂时返回占位图
    return res.json({
      success: true,
      image: '',
      message: '图片生成功能开发中',
    });

  } catch (error) {
    console.error('图片生成失败:', error);
    return res.status(500).json({ 
      success: false, 
      error: '图片生成失败' 
    });
  }
});

/**
 * GET /api/v1/ai/models
 * 获取可用的AI模型列表
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    const models = AVAILABLE_MODELS
      .filter(m => m.type === 'chat')
      .map(m => ({
        code: m.code,
        name: m.name,
        provider: m.provider,
        providerName: MODEL_PROVIDERS[m.provider]?.name || m.provider,
        description: m.description,
        isAvailable: isProviderAvailable(m.provider),
        pricing: getModelPricing(m),
        tags: m.tags,
      }));

    res.json({
      success: true,
      models,
    });
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({ success: false, error: '获取模型列表失败' });
  }
});

// 导入 MODEL_PROVIDERS
import { MODEL_PROVIDERS } from '../config/model-providers.js';

export default router;
