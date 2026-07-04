/**
 * 免费模型整合 - 动漫创作服务
 * 整合 LLM + 图像生成 + 视频生成 + 音频处理
 */

import {
  LLMClient,
  ImageGenerationClient,
  VideoGenerationClient,
  TTSClient,
  Config,
  HeaderUtils,
} from 'coze-coding-dev-sdk';

// ============================================================
// 类型定义
// ============================================================

export interface AnimeStory {
  title: string;
  synopsis: string;
  genre: string;
  themes: string[];
  episodes: Episode[];
}

export interface Episode {
  episodeNumber: number;
  title: string;
  summary: string;
  scenes: Scene[];
}

export interface Scene {
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  description: string;
  characters: string[];
  dialogue: Dialogue[];
  action: string;
  mood: string;
}

export interface Character {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  appearance: string;
  personality: string;
  voiceType: string;
  characterImage?: string;
}

export interface Dialogue {
  character: string;
  line: string;
  emotion: string;
}

export interface AnimeCreationRequest {
  prompt: string;
  style?: 'japanese' | 'chinese' | 'korean' | 'western';
  genre?: string;
  episodeCount?: number;
  generateImages?: boolean;
  generateVideos?: boolean;
  generateAudio?: boolean;
}

export interface AnimeCreationResult {
  story: AnimeStory;
  characters: Map<string, Character>;
  sceneImages: Map<string, string>;
  videos: Map<string, string>;
  audioClips: Map<string, string>;
}

// ============================================================
// 常量定义
// ============================================================

const ANIME_STYLES: Record<string, string> = {
  japanese: '日式动漫风格，大眼睛、夸张表情、鲜艳色彩',
  chinese: '国风动漫风格，水墨元素、古典美学、细腻线条',
  korean: '韩式动漫风格，时尚感、细腻画工、现代都市',
  western: '西方动漫风格，写实比例、动感线条、多元风格',
};

const VOICE_MAPPING: Record<string, string> = {
  '少年': 'saturn_zh_male_shuanglangshaonian_tob',
  '少女': 'saturn_zh_female_keainvsheng_tob',
  '青年男性': 'zh_male_m191_uranus_bigtts',
  '青年女性': 'zh_female_vv_uranus_bigtts',
  '成熟男性': 'zh_male_dayi_saturn_bigtts',
  '成熟女性': 'zh_female_mizai_saturn_bigtts',
  '儿童': 'zh_female_xueayi_saturn_bigtts',
  '旁白': 'zh_male_ruyayichen_saturn_bigtts',
};

// ============================================================
// 主服务类
// ============================================================

export class FreeAnimeCreator {
  private llmClient: LLMClient;
  private imageClient: ImageGenerationClient;
  private videoClient: VideoGenerationClient;
  private ttsClient: TTSClient;
  private customHeaders?: Record<string, string>;

  constructor(customHeaders?: Record<string, string>) {
    const config = new Config();
    this.llmClient = new LLMClient(config, customHeaders);
    this.imageClient = new ImageGenerationClient(config, customHeaders);
    this.videoClient = new VideoGenerationClient(config, customHeaders);
    this.ttsClient = new TTSClient(config, customHeaders);
    this.customHeaders = customHeaders;
  }

  /**
   * 完整动漫创作流程
   */
  async createAnime(request: AnimeCreationRequest): Promise<AnimeCreationResult> {
    console.log('[FreeAnimeCreator] 开始创作动漫:', request.prompt);

    // Step 1: 生成故事大纲
    const story = await this.generateStory(request);
    console.log('[FreeAnimeCreator] 故事大纲生成完成:', story.title);

    // Step 2: 生成角色设计
    const characters = await this.generateCharacters(story, request.style || 'japanese');
    console.log('[FreeAnimeCreator] 角色设计完成:', characters.size, '个角色');

    // Step 3: 生成场景图像（可选）
    const sceneImages = new Map<string, string>();
    if (request.generateImages) {
      for (const episode of story.episodes) {
        for (const scene of episode.scenes) {
          const imageKey = `e${episode.episodeNumber}s${scene.sceneNumber}`;
          const imageUrl = await this.generateSceneImage(scene, request.style || 'japanese');
          if (imageUrl) {
            sceneImages.set(imageKey, imageUrl);
          }
        }
      }
      console.log('[FreeAnimeCreator] 场景图像生成完成:', sceneImages.size, '张');
    }

    // Step 4: 生成视频（可选）
    const videos = new Map<string, string>();
    if (request.generateVideos && request.generateImages) {
      for (const episode of story.episodes) {
        for (const scene of episode.scenes) {
          const imageKey = `e${episode.episodeNumber}s${scene.sceneNumber}`;
          const imageUrl = sceneImages.get(imageKey);
          if (imageUrl) {
            const videoKey = `e${episode.episodeNumber}s${scene.sceneNumber}`;
            const videoUrl = await this.generateSceneVideo(scene, imageUrl);
            if (videoUrl) {
              videos.set(videoKey, videoUrl);
            }
          }
        }
      }
      console.log('[FreeAnimeCreator] 视频生成完成:', videos.size, '个');
    }

    // Step 5: 生成配音（可选）
    const audioClips = new Map<string, string>();
    if (request.generateAudio) {
      for (const episode of story.episodes) {
        for (const scene of episode.scenes) {
          for (const dialogue of scene.dialogue) {
            const character = characters.get(dialogue.character);
            if (character) {
              const audioKey = `e${episode.episodeNumber}s${scene.sceneNumber}_${dialogue.character}`;
              const audioUrl = await this.generateDialogueAudio(dialogue, character);
              if (audioUrl) {
                audioClips.set(audioKey, audioUrl);
              }
            }
          }
        }
      }
      console.log('[FreeAnimeCreator] 配音生成完成:', audioClips.size, '段');
    }

    return {
      story,
      characters,
      sceneImages,
      videos,
      audioClips,
    };
  }

  /**
   * Step 1: 生成故事大纲
   */
  private async generateStory(request: AnimeCreationRequest): Promise<AnimeStory> {
    const systemPrompt = `你是一位专业的动漫编剧，擅长创作引人入胜的故事。
请根据用户的需求创作一个完整的动漫故事大纲。
故事应该包含：
1. 引人入胜的标题
2. 精彩的剧情简介
3. 鲜明的题材和主题
4. 多个剧集，每集包含多个场景
5. 丰富的角色对话和动作描述

请用JSON格式输出，格式如下：
{
  "title": "故事标题",
  "synopsis": "剧情简介",
  "genre": "题材类型",
  "themes": ["主题1", "主题2"],
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "剧集标题",
      "summary": "本集摘要",
      "scenes": [
        {
          "sceneNumber": 1,
          "location": "场景地点",
          "timeOfDay": "时间",
          "description": "场景描述",
          "characters": ["角色名"],
          "dialogue": [
            {
              "character": "角色名",
              "line": "台词内容",
              "emotion": "情绪"
            }
          ],
          "action": "动作描述",
          "mood": "氛围"
        }
      ]
    }
  ]
}`;

    const userPrompt = `请创作一个动漫故事，风格为${ANIME_STYLES[request.style || 'japanese']}。
主题：${request.prompt}
${request.genre ? `题材：${request.genre}` : ''}
${request.episodeCount ? `剧集数：${request.episodeCount}` : '请创作2-3集的故事'}

请直接输出JSON，不要有其他内容。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const response = await this.llmClient.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    // 解析JSON
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse story JSON');
    }

    return JSON.parse(jsonMatch[0]) as AnimeStory;
  }

  /**
   * Step 2: 生成角色设计
   */
  private async generateCharacters(story: AnimeStory, style: string): Promise<Map<string, Character>> {
    const characters = new Map<string, Character>();

    // 从故事中提取所有角色名
    const characterNames = new Set<string>();
    for (const episode of story.episodes) {
      for (const scene of episode.scenes) {
        scene.characters.forEach((charName: string) => characterNames.add(charName));
        scene.dialogue.forEach(d => characterNames.add(d.character));
      }
    }

    // 为每个角色生成详细设计
    for (const name of characterNames) {
      const character = await this.designCharacter(name, story, style);
      characters.set(name, character);
    }

    return characters;
  }

  /**
   * 设计单个角色
   */
  private async designCharacter(name: string, story: AnimeStory, style: string): Promise<Character> {
    const systemPrompt = `你是一位专业的动漫角色设计师。
请为角色生成详细的设计文档，包括：
1. 角色定位（主角/反派/配角）
2. 外貌描述
3. 性格特点
4. 声音类型

请用JSON格式输出：
{
  "name": "角色名",
  "role": "protagonist|antagonist|supporting",
  "appearance": "详细的外貌描述",
  "personality": "性格特点",
  "voiceType": "少年|少女|青年男性|青年女性|成熟男性|成熟女性|儿童|旁白"
}`;

    const userPrompt = `故事标题：${story.title}
故事简介：${story.synopsis}

请为角色"${name}"设计详细设定，风格为${ANIME_STYLES[style]}。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const response = await this.llmClient.invoke(messages, {
      model: 'doubao-seed-1-6-lite-251015',
      temperature: 0.7,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // 返回默认角色
      return {
        name,
        role: 'supporting',
        appearance: '普通外貌',
        personality: '普通性格',
        voiceType: '青年男性',
      };
    }

    return JSON.parse(jsonMatch[0]) as Character;
  }

  /**
   * Step 3: 生成场景图像
   */
  private async generateSceneImage(scene: Scene, style: string): Promise<string | null> {
    try {
      const styleDesc = ANIME_STYLES[style];
      const prompt = `${styleDesc}，${scene.description}，${scene.location}，${scene.timeOfDay}，${scene.mood}氛围，高质量，精美细节`;

      const response = await this.imageClient.generate({
        prompt,
        size: '2K',
        watermark: false,
      });

      const helper = this.imageClient.getResponseHelper(response);
      if (helper.success && helper.imageUrls.length > 0) {
        return helper.imageUrls[0];
      }

      return null;
    } catch (error) {
      console.error('[FreeAnimeCreator] Scene image generation error:', error);
      return null;
    }
  }

  /**
   * Step 4: 生成场景视频
   */
  private async generateSceneVideo(scene: Scene, imageUrl: string): Promise<string | null> {
    try {
      const content = [
        {
          type: 'image_url' as const,
          image_url: { url: imageUrl },
          role: 'first_frame' as const,
        },
        {
          type: 'text' as const,
          text: `${scene.action}，${scene.mood}氛围，流畅的镜头运动`,
        },
      ];

      const response = await this.videoClient.videoGeneration(content, {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: 5,
        ratio: '16:9',
        resolution: '720p',
        generateAudio: true,
        watermark: false,
      });

      return response.videoUrl;
    } catch (error) {
      console.error('[FreeAnimeCreator] Scene video generation error:', error);
      return null;
    }
  }

  /**
   * Step 5: 生成对话配音
   */
  private async generateDialogueAudio(dialogue: Dialogue, character: Character): Promise<string | null> {
    try {
      const voiceId = VOICE_MAPPING[character.voiceType] || VOICE_MAPPING['青年男性'];

      const response = await this.ttsClient.synthesize({
        uid: 'anime_creator',
        text: dialogue.line,
        speaker: voiceId,
        audioFormat: 'mp3',
        sampleRate: 24000,
      });

      return response.audioUri;
    } catch (error) {
      console.error('[FreeAnimeCreator] Dialogue audio generation error:', error);
      return null;
    }
  }

  /**
   * 流式生成故事（用于实时预览）
   */
  async *streamStory(request: AnimeCreationRequest): AsyncGenerator<string> {
    const systemPrompt = `你是一位专业的动漫编剧。
请根据用户的需求创作一个动漫故事大纲。
格式要求：
1. 标题
2. 剧情简介
3. 主要角色
4. 故事大纲（分集描述）

请用中文输出，格式清晰。`;

    const userPrompt = `创作一个动漫故事，风格：${ANIME_STYLES[request.style || 'japanese']}
主题：${request.prompt}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const stream = this.llmClient.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content.toString();
      }
    }
  }

  /**
   * 生成角色立绘
   */
  async generateCharacterPortrait(character: Character, style: string): Promise<string | null> {
    try {
      const styleDesc = ANIME_STYLES[style];
      const prompt = `${styleDesc}动漫角色立绘，${character.name}，${character.appearance}，全身图，白色背景，高质量，精美细节`;

      const response = await this.imageClient.generate({
        prompt,
        size: '2K',
        watermark: false,
      });

      const helper = this.imageClient.getResponseHelper(response);
      if (helper.success && helper.imageUrls.length > 0) {
        return helper.imageUrls[0];
      }

      return null;
    } catch (error) {
      console.error('[FreeAnimeCreator] Character portrait generation error:', error);
      return null;
    }
  }

  /**
   * 快速生成动漫概念（轻量级）
   */
  async quickConcept(prompt: string, style: string = 'japanese'): Promise<{
    title: string;
    synopsis: string;
    mainCharacters: string[];
    keyScenes: string[];
  }> {
    const systemPrompt = `你是一位动漫创意顾问。
请快速生成一个动漫概念，包括：
1. 标题
2. 一句话简介
3. 主要角色（3-4个，只返回角色名）
4. 关键场景（3-4个，只返回场景描述）

用JSON格式输出，必须使用英文字段名：
{
  "title": "故事标题",
  "synopsis": "一句话简介",
  "mainCharacters": ["角色名1", "角色名2"],
  "keyScenes": ["场景描述1", "场景描述2"]
}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `主题：${prompt}\n风格：${ANIME_STYLES[style]}` },
    ];

    const response = await this.llmClient.invoke(messages, {
      model: 'doubao-seed-1-6-lite-251015',
      temperature: 0.9,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        title: '未命名故事',
        synopsis: prompt,
        mainCharacters: ['主角'],
        keyScenes: ['开场'],
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 处理中文字段名映射
      const result = {
        title: parsed.title || parsed['标题'] || '未命名故事',
        synopsis: parsed.synopsis || parsed['一句话简介'] || prompt,
        mainCharacters: [] as string[],
        keyScenes: [] as string[],
      };

      // 提取角色名
      if (Array.isArray(parsed.mainCharacters)) {
        result.mainCharacters = parsed.mainCharacters.map((c: any) => 
          typeof c === 'string' ? c : (c.name || c['姓名'] || '未知角色')
        );
      } else if (Array.isArray(parsed['主要角色'])) {
        result.mainCharacters = parsed['主要角色'].map((c: any) => 
          typeof c === 'string' ? c : (c.name || c['姓名'] || '未知角色')
        );
      }

      // 提取场景描述
      if (Array.isArray(parsed.keyScenes)) {
        result.keyScenes = parsed.keyScenes.map((s: any) => 
          typeof s === 'string' ? s : (s.description || s['描述'] || '未知场景')
        );
      } else if (Array.isArray(parsed['关键场景'])) {
        result.keyScenes = parsed['关键场景'].map((s: any) => 
          typeof s === 'string' ? s : (s.description || s['描述'] || '未知场景')
        );
      }

      return result;
    } catch (e) {
      console.error('[FreeAnimeCreator] JSON parse error:', e);
      return {
        title: '未命名故事',
        synopsis: prompt,
        mainCharacters: ['主角'],
        keyScenes: ['开场'],
      };
    }
  }
}

// 导出单例工厂函数
export function createAnimeCreator(customHeaders?: Record<string, string>): FreeAnimeCreator {
  return new FreeAnimeCreator(customHeaders);
}
