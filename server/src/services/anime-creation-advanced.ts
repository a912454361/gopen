/**
 * 智能动漫创作服务 - 多模型协作
 * 支持并行创作、质量控制、快速生成
 */

import { getSupabaseClient } from '../storage/database/supabase-client.js';
import axios from 'axios';

const client = getSupabaseClient();

// 模型配置
export const MODELS = {
  // 剧本创作模型（中文能力排序）
  script: {
    premium: 'kimi-k2.5',           // 顶级：Kimi K2
    high: 'deepseek-chat',          // 高级：DeepSeek V3
    normal: 'qwen-max',             // 中级：通义千问
    free: 'glm-4-flash',            // 免费：GLM-4 Flash
  },
  // 角色创作模型
  character: {
    premium: 'kimi-k2.5',
    high: 'deepseek-chat',
    normal: 'qwen-plus',
    free: 'glm-4-flash',
  },
  // 视觉描述模型
  visual: {
    premium: 'qwen-vl-max',         // 视觉语言模型
    high: 'doubao-vision-pro-32k',
    normal: 'qwen-vl-plus',
    free: 'glm-4v',
  },
};

// 创作任务类型
interface CreationTask {
  id: string;
  type: 'script' | 'character' | 'scene' | 'dialogue' | 'storyboard';
  model: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

/**
 * 智能选择最佳模型
 * 根据用户等级和任务类型自动选择
 */
export function selectBestModel(
  taskType: 'script' | 'character' | 'scene' | 'dialogue' | 'storyboard' | 'visual',
  userLevel: 'premium' | 'high' | 'normal' | 'free'
): string {
  const modelCategory = taskType === 'visual' ? 'visual' : 
                        taskType === 'character' ? 'character' : 'script';
  return MODELS[modelCategory][userLevel] || MODELS[modelCategory].free;
}

/**
 * 并行创作管理器
 * 同时启动多个创作任务，加速整体进度
 */
export class ParallelCreationManager {
  private tasks: Map<string, CreationTask> = new Map();
  private results: Map<string, any> = new Map();
  private userId: string;
  private userLevel: 'premium' | 'high' | 'normal' | 'free';

  constructor(userId: string, isPrivileged: boolean = false) {
    this.userId = userId;
    this.userLevel = isPrivileged ? 'premium' : 'normal';
  }

  /**
   * 添加创作任务
   */
  addTask(id: string, type: CreationTask['type'], prompt: string): void {
    const model = selectBestModel(type, this.userLevel);
    this.tasks.set(id, {
      id,
      type,
      model,
      prompt,
      status: 'pending',
    });
  }

  /**
   * 并行执行所有任务
   */
  async executeAll(): Promise<Map<string, any>> {
    const promises: Promise<void>[] = [];

    for (const [id, task] of this.tasks) {
      promises.push(this.executeTask(id));
    }

    await Promise.all(promises);
    return this.results;
  }

  /**
   * 执行单个任务
   */
  private async executeTask(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) return;

    task.status = 'processing';
    
    try {
      // 调用模型API
      const result = await this.callModel(task.model, task.prompt, task.type);
      task.result = result;
      task.status = 'completed';
      this.results.set(id, result);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * 调用模型API
   */
  private async callModel(model: string, prompt: string, type: string): Promise<any> {
    // 根据模型类型选择API
    const apiUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';
    
    const response = await axios.post(`${apiUrl}/api/v1/chat/completions`, {
      model,
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(type),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.8,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    return response.data.choices?.[0]?.message?.content || response.data;
  }

  /**
   * 获取系统提示词
   */
  private getSystemPrompt(type: string): string {
    const prompts: Record<string, string> = {
      script: '你是一位专业的动漫编剧，擅长创作引人入胜的故事情节。请创作详细、生动的剧本内容。',
      character: '你是一位角色设计专家，擅长创造立体、有深度的角色形象。请提供详细的角色设定。',
      scene: '你是一位场景设计师，擅长营造氛围感强烈的场景描述。请描述画面细节、光影效果和情感基调。',
      dialogue: '你是一位对话编剧，擅长写出生动、有个性的角色对话。请确保对话符合角色性格。',
      storyboard: '你是一位分镜师，擅长将剧本转化为分镜脚本。请详细描述每个镜头的画面构图、运镜方式和时长。',
    };
    return prompts[type] || prompts.script;
  }

  /**
   * 获取任务状态
   */
  getStatus(): { total: number; completed: number; failed: number; pending: number } {
    let completed = 0, failed = 0, pending = 0;
    for (const task of this.tasks.values()) {
      if (task.status === 'completed') completed++;
      else if (task.status === 'failed') failed++;
      else if (task.status === 'pending') pending++;
    }
    return { total: this.tasks.size, completed, failed, pending };
  }
}

/**
 * 快速动漫创作
 * 一键生成完整动漫项目（剧本+角色+场景）
 */
export async function quickAnimeCreation(params: {
  userId: string;
  title: string;
  genre: string;
  style: string;
  episodeCount: number;
  isPrivileged: boolean;
}): Promise<{
  projectId: string;
  script: any;
  characters: any[];
  scenes: any[];
}> {
  const { userId, title, genre, style, episodeCount, isPrivileged } = params;
  
  // 创建并行任务管理器
  const manager = new ParallelCreationManager(userId, isPrivileged);

  // 1. 主线故事
  manager.addTask('main_story', 'script', 
    `创作一部${style}风格的${genre}动漫《${title}》，共${episodeCount}集。
    请提供：
    1. 故事梗概（200字以内）
    2. 核心冲突
    3. 世界观设定`);

  // 2. 主要角色（3-5个）
  manager.addTask('characters', 'character',
    `为动漫《${title}》设计5个主要角色：
    1. 主角
    2. 重要配角 × 2
    3. 反派/对立角色
    4. 喜剧角色/吉祥物
    每个角色包含：姓名、性格、外貌、背景故事、口头禅`);

  // 3. 主要场景
  manager.addTask('scenes', 'scene',
    `为动漫《${title}》设计6个主要场景：
    包含场景名称、环境描述、氛围基调、适合发生的剧情类型`);

  // 并行执行
  const results = await manager.executeAll();

  // 整合结果
  const script = results.get('main_story');
  const characters = parseCharacters(results.get('characters'));
  const scenes = parseScenes(results.get('scenes'));

  // 保存到数据库
  const { data: project } = await client
    .from('anime_projects')
    .insert([{
      user_id: userId,
      title,
      synopsis: script?.substring(0, 500),
      characters,
      scenes,
      style,
      theme: genre,
      created_at: new Date().toISOString(),
    }])
    .select('id')
    .single();

  return {
    projectId: project?.id || '',
    script,
    characters,
    scenes,
  };
}

/**
 * 解析角色数据
 */
function parseCharacters(text: string): any[] {
  if (!text) return [];
  // 简单解析，实际可使用更复杂的NLP
  const characters = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  let currentChar: any = null;
  for (const line of lines) {
    if (line.includes('：') || line.includes(':')) {
      const [key, value] = line.split(/[:：]/, 2);
      if (currentChar && key.trim() && value?.trim()) {
        currentChar[key.trim()] = value.trim();
      }
    } else if (line.match(/^[0-9]+[.、]/)) {
      if (currentChar) characters.push(currentChar);
      currentChar = { name: line.replace(/^[0-9]+[.、]\s*/, '').trim() };
    }
  }
  if (currentChar) characters.push(currentChar);
  
  return characters;
}

/**
 * 解析场景数据
 */
function parseScenes(text: string): any[] {
  if (!text) return [];
  const scenes = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  let currentScene: any = null;
  for (const line of lines) {
    if (line.match(/^[0-9]+[.、]/)) {
      if (currentScene) scenes.push(currentScene);
      currentScene = {
        sceneId: scenes.length + 1,
        location: line.replace(/^[0-9]+[.、]\s*/, '').trim(),
        description: '',
        mood: 'neutral',
      };
    } else if (currentScene) {
      currentScene.description += line + ' ';
    }
  }
  if (currentScene) scenes.push(currentScene);
  
  return scenes;
}

/**
 * 批量分集创作
 * 为大型动漫项目快速生成多集剧本
 */
export async function batchEpisodeCreation(params: {
  projectId: string;
  episodeCount: number;
  outline: string;
  characters: any[];
  userId: string;
  isPrivileged: boolean;
}): Promise<any[]> {
  const { projectId, episodeCount, outline, characters, userId, isPrivileged } = params;
  
  const manager = new ParallelCreationManager(userId, isPrivileged);
  
  // 为每集创建任务
  for (let i = 1; i <= episodeCount; i++) {
    manager.addTask(`episode_${i}`, 'script',
      `基于以下大纲创作第${i}集剧本：

大纲：${outline}

主要角色：
${characters.map(c => `- ${c.name || c}：${c.role || ''}`).join('\n')}

请提供：
1. 本集标题
2. 本集剧情梗概（100字）
3. 开场、发展、高潮、结尾四段剧情描述
4. 关键对话片段（3-5句）`);
  }

  // 并行执行所有分集
  const results = await manager.executeAll();
  
  // 整理结果
  const episodes = [];
  for (let i = 1; i <= episodeCount; i++) {
    const content = results.get(`episode_${i}`);
    episodes.push({
      episodeNumber: i,
      title: extractTitle(content) || `第${i}集`,
      summary: content?.substring(0, 200),
      content,
    });
  }

  // 更新项目
  await client
    .from('anime_projects')
    .update({ episodes })
    .eq('id', projectId);

  return episodes;
}

/**
 * 从文本中提取标题
 */
function extractTitle(text: string): string | null {
  if (!text) return null;
  const match = text.match(/标题[：:]\s*(.+?)(\n|$)/);
  return match?.[1]?.trim() || null;
}

/**
 * 质量检查
 * 检测剧本中的问题
 */
export async function qualityCheck(content: {
  script: string;
  characters: any[];
  scenes: any[];
}): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
}> {
  const { script, characters, scenes } = content;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // 基础检查
  if (script.length < 500) {
    issues.push('剧本内容过短，建议补充更多细节');
  }

  if (characters.length < 3) {
    issues.push('角色数量较少，建议增加角色丰富剧情');
  }

  if (scenes.length < 5) {
    issues.push('场景数量较少，建议增加场景变化');
  }

  // 检查角色名一致性
  const charNames = characters.map(c => c.name).filter(Boolean);
  for (const name of charNames) {
    if (script && !script.includes(name)) {
      issues.push(`角色「${name}」在剧本中未出现`);
    }
  }

  // 计算质量分数
  let score = 100;
  score -= issues.length * 15;
  score = Math.max(0, score);

  // 生成建议
  if (score < 80) {
    suggestions.push('建议使用更高级的模型重新生成部分内容');
  }
  if (characters.some(c => !c.description)) {
    suggestions.push('部分角色缺少详细描述，建议补充');
  }

  return { score, issues, suggestions };
}
