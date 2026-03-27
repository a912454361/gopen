/**
 * AI内容生成路由
 * 用于游戏工作台和动漫工作台的AI生成功能
 */
import express from 'express';
import type { Request, Response } from 'express';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

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
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { type, prompt, style, projectId } = req.body;

    if (!type || !prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'type 和 prompt 是必需参数' 
      });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const client = new LLMClient(config, customHeaders);

    // 根据类型构建不同的系统提示
    let systemPrompt = '';
    let responseFormat = '';

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
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `请根据以下描述生成${type === 'character' ? '游戏角色' : type === 'anime_character' ? '动漫角色' : type === 'scene' ? '游戏场景' : type === 'anime_scene' ? '动漫场景' : type === 'item' ? '游戏道具' : '剧情脚本'}：\n\n${prompt}` }
    ];

    let fullResponse = '';

    try {
      const stream = await client.stream({
        messages,
        model: 'doubao-pro-32k',
      });

      for await (const chunk of stream) {
        if (chunk.choices?.[0]?.delta?.content) {
          fullResponse += chunk.choices[0].delta.content;
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

export default router;
