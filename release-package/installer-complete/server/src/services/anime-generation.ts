/**
 * 动漫生成服务
 * 使用Kimi模型生成动漫剧本、角色设定、场景描述
 * 结合图像生成API生成动漫画面
 */

import axios from 'axios';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const client = getSupabaseClient();

// Kimi API配置 - 延迟读取环境变量
const getMoonshotApiKey = () => process.env.MOONSHOT_API_KEY || '';
const MOONSHOT_BASE_URL = 'https://api.moonshot.cn/v1';

// 特权用户ID
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

// 动漫风格配置
export const ANIME_STYLES = [
  { id: 'japanese', name: '日系动漫', desc: '经典日漫风格，大眼睛、彩色头发' },
  { id: 'chinese', name: '国风动漫', desc: '中国风动漫，水墨元素、古典美' },
  { id: 'korean', name: '韩系动漫', desc: '韩漫风格，细腻写实' },
  { id: 'chibi', name: 'Q版萌系', desc: '可爱Q版，大头小身' },
  { id: 'realistic', name: '写实动漫', desc: '接近真实的动漫风格' },
  { id: 'fantasy', name: '奇幻冒险', desc: '魔法、冒险主题风格' },
];

// 动漫题材配置
export const ANIME_THEMES = [
  { id: 'action', name: '热血战斗', desc: '激烈的战斗场面' },
  { id: 'romance', name: '恋爱日常', desc: '甜蜜的恋爱故事' },
  { id: 'fantasy', name: '奇幻冒险', desc: '魔法与冒险' },
  { id: 'scifi', name: '科幻未来', desc: '未来科技世界' },
  { id: 'slice', name: '治愈日常', desc: '温馨的日常生活' },
  { id: 'horror', name: '悬疑惊悚', desc: '紧张刺激的剧情' },
];

// 动漫角色类型
export const CHARACTER_TYPES = [
  { id: 'protagonist', name: '主角', desc: '故事的核心人物' },
  { id: 'heroine', name: '女主', desc: '女主角' },
  { id: 'villain', name: '反派', desc: '故事的反派角色' },
  { id: 'support', name: '配角', desc: '重要的支持角色' },
  { id: 'mentor', name: '导师', desc: '指引主角的智者' },
];

export interface AnimeGenerationRequest {
  userId: string;
  prompt: string; // 用户输入的动漫创意
  style?: string; // 动漫风格
  theme?: string; // 动漫题材
  characterCount?: number; // 角色数量
  sceneCount?: number; // 场景数量
  generateImages?: boolean; // 是否生成图像
  taskId?: string; // 任务ID（用于更新进度）
}

export interface AnimeScript {
  title: string;
  synopsis: string; // 故事梗概
  episodes: AnimeEpisode[];
  characters: AnimeCharacter[];
  scenes: AnimeScene[];
}

export interface AnimeEpisode {
  episode: number;
  title: string;
  synopsis: string;
  keyScenes: string[];
}

export interface AnimeCharacter {
  name: string;
  role: string;
  appearance: string;
  personality: string;
  background: string;
  imagePrompt?: string;
  imageUrl?: string;
}

export interface AnimeScene {
  sceneId: number;
  location: string;
  timeOfDay: string;
  description: string;
  mood: string;
  imagePrompt?: string;
  imageUrl?: string;
}

/**
 * 更新任务进度
 */
async function updateTaskProgress(taskId: string, progress: number, status: string, result?: any) {
  if (!taskId) return;
  
  const updateData: any = { progress, status };
  if (result) {
    updateData.result_data = result;
  }
  
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }
  
  await client
    .from('generation_tasks')
    .update(updateData)
    .eq('id', taskId);
}

/**
 * 调用Kimi API生成内容
 */
async function callKimiAPI(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = getMoonshotApiKey();
  if (!apiKey) {
    throw new Error('MOONSHOT_API_KEY is not configured');
  }

  const messages: any[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  console.log('[Anime] Calling Kimi API with prompt length:', prompt.length);

  try {
    const response = await axios.post(
      `${MOONSHOT_BASE_URL}/chat/completions`,
      {
        model: 'moonshot-v1-8k',
        messages,
        temperature: 0.8,
        max_tokens: 4000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    console.log('[Anime] Kimi API response received');
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('[Anime] Kimi API error:', error.response?.data || error.message);
    throw new Error(`Kimi API error: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * 生成动漫剧本
 */
export async function generateAnimeScript(request: AnimeGenerationRequest): Promise<AnimeScript> {
  const { prompt, style = 'japanese', theme = 'fantasy', characterCount = 3, sceneCount = 5, taskId } = request;

  console.log(`[Anime] Generating anime script for: ${prompt}`);

  // 更新进度：开始生成
  if (taskId) {
    await updateTaskProgress(taskId, 5, 'processing');
  }

  // 系统提示词：动漫编剧专家
  const systemPrompt = `你是一位专业的动漫编剧和创意总监，擅长创作各种风格的动漫剧本。
你需要根据用户提供的创意，生成完整的动漫设定，包括：
1. 吸引人的标题和故事梗概
2. 详细的角色设定（外貌、性格、背景）
3. 精彩的场景描述
4. 分集剧情大纲

请用JSON格式输出，确保内容完整、富有创意。`;

  // 生成提示词
  const styleName = ANIME_STYLES.find(s => s.id === style)?.name || '日系动漫';
  const themeName = ANIME_THEMES.find(t => t.id === theme)?.name || '奇幻冒险';

  const generationPrompt = `请根据以下创意生成一个完整的动漫剧本设定：

用户创意：${prompt}

要求：
- 动漫风格：${styleName}
- 题材类型：${themeName}
- 主要角色数量：${characterCount}个
- 场景数量：${sceneCount}个

请以JSON格式输出，结构如下：
{
  "title": "动漫标题",
  "synopsis": "故事梗概（100-200字）",
  "characters": [
    {
      "name": "角色名",
      "role": "主角/女主/反派/配角/导师",
      "appearance": "外貌描述（详细，用于AI绘画）",
      "personality": "性格特点",
      "background": "角色背景故事"
    }
  ],
  "scenes": [
    {
      "sceneId": 1,
      "location": "场景地点",
      "timeOfDay": "时间（清晨/正午/黄昏/夜晚等）",
      "description": "场景描述",
      "mood": "氛围（温馨/紧张/神秘等）"
    }
  ],
  "episodes": [
    {
      "episode": 1,
      "title": "第1集标题",
      "synopsis": "本集梗概",
      "keyScenes": ["关键场景1", "关键场景2"]
    }
  ]
}

请确保输出是有效的JSON格式。`;

  if (taskId) {
    await updateTaskProgress(taskId, 10, 'processing');
  }

  // 调用Kimi API生成剧本
  const result = await callKimiAPI(generationPrompt, systemPrompt);

  if (taskId) {
    await updateTaskProgress(taskId, 40, 'processing');
  }

  // 解析JSON结果
  let script: AnimeScript;
  try {
    // 尝试提取JSON部分
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      script = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No valid JSON found in response');
    }
  } catch (parseError) {
    console.error('[Anime] Failed to parse script:', parseError);
    // 创建默认结构
    script = {
      title: `${prompt} - 动漫企划`,
      synopsis: result.substring(0, 500),
      characters: [],
      scenes: [],
      episodes: [],
    };
  }

  // 为角色生成图像提示词
  script.characters = script.characters.map(char => ({
    ...char,
    imagePrompt: generateCharacterImagePrompt(char, styleName),
  }));

  // 为场景生成图像提示词
  script.scenes = script.scenes.map(scene => ({
    ...scene,
    imagePrompt: generateSceneImagePrompt(scene, styleName),
  }));

  console.log(`[Anime] Script generated: ${script.title}`);

  return script;
}

/**
 * 生成角色图像提示词
 */
function generateCharacterImagePrompt(character: AnimeCharacter, styleName: string): string {
  return `${styleName}风格动漫角色，${character.appearance}，${character.role}，高质量，精细线条，鲜艳色彩，动漫插画`;
}

/**
 * 生成场景图像提示词
 */
function generateSceneImagePrompt(scene: AnimeScene, styleName: string): string {
  return `${styleName}风格动漫场景，${scene.location}，${scene.timeOfDay}，${scene.description}，${scene.mood}氛围，高质量背景`;
}

/**
 * 生成动漫角色图像
 */
export async function generateCharacterImage(
  character: AnimeCharacter,
  style: string
): Promise<string | null> {
  const styleName = ANIME_STYLES.find(s => s.id === style)?.name || '日系动漫';
  const imagePrompt = character.imagePrompt || generateCharacterImagePrompt(character, styleName);

  console.log(`[Anime] Generating image for character: ${character.name}`);

  try {
    // 调用图像生成API
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    if (response.data?.data?.[0]?.url) {
      return response.data.data[0].url;
    }
  } catch (error) {
    console.error('[Anime] Failed to generate character image:', error);
  }

  return null;
}

/**
 * 完整的动漫生成流程
 */
export async function generateCompleteAnime(request: AnimeGenerationRequest): Promise<AnimeScript> {
  const { taskId, generateImages = true } = request;

  try {
    // 1. 生成剧本
    const script = await generateAnimeScript(request);

    // 2. 生成角色图像（如果需要）
    if (generateImages && script.characters.length > 0) {
      if (taskId) {
        await updateTaskProgress(taskId, 50, 'processing');
      }
      
      for (let i = 0; i < script.characters.length; i++) {
        const char = script.characters[i];
        const imageUrl = await generateCharacterImage(char, request.style || 'japanese');
        if (imageUrl) {
          script.characters[i].imageUrl = imageUrl;
        }
        
        // 更新进度
        const progress = 50 + Math.floor((i + 1) / script.characters.length * 30);
        if (taskId) {
          await updateTaskProgress(taskId, progress, 'processing');
        }
      }
    }

    // 3. 完成
    if (taskId) {
      await updateTaskProgress(taskId, 100, 'completed', script);
    }

    console.log(`[Anime] Complete anime generated: ${script.title}`);

    return script;
  } catch (error) {
    console.error('[Anime] Generation failed:', error);
    
    if (taskId) {
      await client
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Generation failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
    }

    throw error;
  }
}

/**
 * 快速生成动漫概念
 */
export async function generateAnimeConcept(prompt: string, style: string = 'japanese'): Promise<string> {
  const styleName = ANIME_STYLES.find(s => s.id === style)?.name || '日系动漫';

  const systemPrompt = `你是一位动漫创意顾问，擅长快速生成动漫概念和角色设定。`;
  
  const generationPrompt = `请为以下动漫创意生成一个简短的概念描述（100字以内）：

创意：${prompt}
风格：${styleName}

请包含：故事核心、主角设定、独特卖点。`;

  return await callKimiAPI(generationPrompt, systemPrompt);
}

/**
 * 生成动漫角色对话
 */
export async function generateCharacterDialogue(
  characters: AnimeCharacter[],
  scene: string
): Promise<string> {
  const charNames = characters.map(c => c.name).join('、');

  const systemPrompt = `你是一位动漫编剧，擅长创作生动的角色对话。`;
  
  const generationPrompt = `请为以下场景中的角色创作一段对话：

角色：${charNames}
场景：${scene}

角色设定：
${characters.map(c => `- ${c.name}(${c.role})：${c.personality}`).join('\n')}

请创作一段精彩的对话（200-300字），展现角色性格和剧情发展。`;

  return await callKimiAPI(generationPrompt, systemPrompt);
}

/**
 * 生成动漫分镜脚本
 */
export async function generateStoryboard(
  episode: AnimeEpisode,
  style: string = 'japanese'
): Promise<string[]> {
  const styleName = ANIME_STYLES.find(s => s.id === style)?.name || '日系动漫';

  const systemPrompt = `你是一位动漫分镜师，擅长将剧情转化为详细的分镜描述。`;
  
  const generationPrompt = `请为以下动漫剧情生成分镜脚本：

第${episode.episode}集：${episode.title}
剧情：${episode.synopsis}
关键场景：${episode.keyScenes.join('、')}

风格：${styleName}

请生成5-8个分镜，每个分镜包含：
- 镜头类型（特写/中景/远景/俯视等）
- 画面描述
- 角色动作/表情
- 台词或旁白（如有）

请以简洁的列表格式输出。`;

  const result = await callKimiAPI(generationPrompt, systemPrompt);
  
  // 按行分割成数组
  return result.split('\n').filter(line => line.trim());
}
