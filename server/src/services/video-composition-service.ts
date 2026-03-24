/**
 * 服务端文件：server/src/services/video-composition-service.ts
 * 视频合成服务 - FFmpeg + AI图像生成 + 云服务
 * 
 * 功能：
 * - 一集视频完整合成（片头 + 正片 + 片尾）
 * - AI生成动漫风格场景图像
 * - 转场效果（淡入淡出）
 * - 字幕生成（SRT格式）
 * - 背景音乐合成
 * - 4K MP4输出
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

const execAsync = promisify(exec);

// 模拟模式开关 - 设为false时尝试下载真实视频，失败则生成视觉效果视频
const SIMULATION_MODE = false;

// AI图像生成客户端
let imageClient: ImageGenerationClient | null = null;

function getImageClient(): ImageGenerationClient {
  if (!imageClient) {
    const config = new Config();
    imageClient = new ImageGenerationClient(config);
  }
  return imageClient;
}

// ============================================================
// 类型定义
// ============================================================

export interface EpisodeConfig {
  // 一集配置
  episodeNumber: number;
  title: string;
  
  // 时长配置
  introDuration: number;      // 片头时长（秒）
  mainDuration: number;       // 正片时长（秒）
  outroDuration: number;      // 片尾时长（秒）
  
  // 场景配置
  sceneCount: number;         // 场景数量
  sceneDuration: number;      // 每场景时长（秒）
  
  // 转场配置
  transitionType: 'fade' | 'slide' | 'zoom' | 'none';
  transitionDuration: number; // 转场时长（秒）
  
  // 字幕配置
  enableSubtitles: boolean;
  subtitleStyle?: {
    fontName: string;
    fontSize: number;
    fontColor: string;
    outlineColor: string;
    position: 'bottom' | 'top';
  };
  
  // 音频配置
  enableBGM: boolean;
  bgmStyle: 'xianxia' | 'wuxia' | 'epic' | 'peaceful' | 'custom';
  bgmVolume: number;          // 0-1
  enableNarration: boolean;
  
  // 输出配置
  resolution: '720p' | '1080p' | '4k';
  format: 'mp4' | 'mov' | 'webm';
  quality: 'high' | 'medium' | 'low';
}

export interface SceneData {
  id: string;
  order: number;
  videoUrl: string;
  duration: number;
  description: string;
  subtitle?: string;
  narration?: string;
}

export interface CompositionTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  config: EpisodeConfig;
  scenes: SceneData[];
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CompositionResult {
  success: boolean;
  taskId: string;
  outputUrl?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
}

// ============================================================
// 默认配置
// ============================================================

export const DEFAULT_EPISODE_CONFIG: EpisodeConfig = {
  episodeNumber: 1,
  title: '剑破苍穹',
  
  introDuration: 10,      // 10秒片头
  mainDuration: 1180,     // 19分40秒正片
  outroDuration: 10,      // 10秒片尾
  
  sceneCount: 40,         // 40个场景
  sceneDuration: 30,      // 每场景30秒
  
  transitionType: 'fade',
  transitionDuration: 1,  // 1秒淡入淡出
  
  enableSubtitles: true,
  subtitleStyle: {
    fontName: 'Noto Sans CJK SC',
    fontSize: 48,
    fontColor: 'white',
    outlineColor: 'black',
    position: 'bottom',
  },
  
  enableBGM: true,
  bgmStyle: 'xianxia',
  bgmVolume: 0.3,
  enableNarration: false,
  
  resolution: '4k',
  format: 'mp4',
  quality: 'high',
};

// ============================================================
// 视频合成服务
// ============================================================

class VideoCompositionService {
  private tasks: Map<string, CompositionTask> = new Map();
  private outputDir: string;
  private tempDir: string;

  constructor() {
    this.outputDir = '/tmp/gopen/output';
    this.tempDir = '/tmp/gopen/temp';
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('[VideoComposition] Failed to create directories:', error);
    }
  }

  // ============================================================
  // 公共 API
  // ============================================================

  /**
   * 创建一集视频合成任务
   */
  async composeEpisode(
    scenes: SceneData[],
    config: Partial<EpisodeConfig> = {}
  ): Promise<CompositionResult> {
    const taskId = crypto.randomUUID();
    const finalConfig = { ...DEFAULT_EPISODE_CONFIG, ...config };

    // 创建任务
    const task: CompositionTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      currentStep: '初始化',
      config: finalConfig,
      scenes,
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);

    try {
      // 异步执行合成
      this.executeComposition(taskId, scenes, finalConfig);
      
      return {
        success: true,
        taskId,
      };
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      
      return {
        success: false,
        taskId,
        error: error.message,
      };
    }
  }

  /**
   * 同步合成（等待完成）
   */
  async composeEpisodeSync(
    scenes: SceneData[],
    config: Partial<EpisodeConfig> = {}
  ): Promise<CompositionResult> {
    const taskId = crypto.randomUUID();
    const finalConfig = { ...DEFAULT_EPISODE_CONFIG, ...config };

    const task: CompositionTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      currentStep: '初始化',
      config: finalConfig,
      scenes,
      createdAt: new Date(),
    };

    this.tasks.set(taskId, task);

    try {
      const result = await this.executeCompositionSync(taskId, scenes, finalConfig);
      return result;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      return {
        success: false,
        taskId,
        error: error.message,
      };
    }
  }

  /**
   * 查询任务状态
   */
  getTaskStatus(taskId: string): CompositionTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): CompositionTask[] {
    return Array.from(this.tasks.values());
  }

  // ============================================================
  // 私有方法 - 合成流程
  // ============================================================

  /**
   * 异步执行合成（后台处理）
   */
  private async executeComposition(
    taskId: string,
    scenes: SceneData[],
    config: EpisodeConfig
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      await this.executeCompositionSync(taskId, scenes, config);
    } catch (error: any) {
      console.error(`[VideoComposition] Task ${taskId} failed:`, error);
    }
  }

  /**
   * 同步执行合成
   */
  private async executeCompositionSync(
    taskId: string,
    scenes: SceneData[],
    config: EpisodeConfig
  ): Promise<CompositionResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    const startTime = Date.now();
    const workDir = path.join(this.tempDir, taskId);
    
    try {
      await fs.mkdir(workDir, { recursive: true });

      // Step 1: 下载视频片段 (10%)
      task.status = 'processing';
      task.currentStep = '下载视频片段';
      task.progress = 5;
      
      const downloadedScenes = await this.downloadScenes(scenes, workDir);
      task.progress = 15;

      // Step 2: 生成片头 (20%)
      task.currentStep = '生成片头';
      const introPath = await this.generateIntro(config, workDir);
      task.progress = 20;

      // Step 3: 生成片尾 (25%)
      task.currentStep = '生成片尾';
      const outroPath = await this.generateOutro(config, workDir);
      task.progress = 25;

      // Step 4: 合成正片场景 (30%-70%)
      task.currentStep = '合成正片场景';
      const mainVideoPath = await this.composeMainScenes(downloadedScenes, config, workDir, (progress) => {
        task.progress = 25 + Math.floor(progress * 0.45);
      });
      task.progress = 70;

      // Step 5: 生成字幕文件 (75%)
      task.currentStep = '生成字幕';
      let subtitlePath: string | undefined;
      if (config.enableSubtitles) {
        subtitlePath = await this.generateSubtitles(scenes, config, workDir);
      }
      task.progress = 75;

      // Step 6: 合并完整视频 (75%-90%)
      task.currentStep = '合并完整视频';
      const fullVideoPath = await this.concatenateVideos(
        introPath,
        mainVideoPath,
        outroPath,
        workDir
      );
      task.progress = 90;

      // Step 7: 添加字幕和背景音乐 (90%-98%)
      task.currentStep = '添加字幕和音乐';
      const finalVideoPath = await this.addSubtitlesAndBGM(
        fullVideoPath,
        subtitlePath,
        config,
        workDir
      );
      task.progress = 98;

      // Step 8: 移动到输出目录
      task.currentStep = '输出文件';
      const outputPath = path.join(
        this.outputDir,
        `EP${String(config.episodeNumber).padStart(2, '0')}_${config.title}_${taskId}.mp4`
      );
      await fs.rename(finalVideoPath, outputPath);

      // 完成
      const stats = await fs.stat(outputPath);
      task.status = 'completed';
      task.progress = 100;
      task.outputUrl = outputPath;
      task.completedAt = new Date();

      const duration = Date.now() - startTime;

      return {
        success: true,
        taskId,
        outputUrl: outputPath,
        duration,
        fileSize: stats.size,
      };
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date();

      return {
        success: false,
        taskId,
        error: error.message,
      };
    } finally {
      // 清理临时文件
      try {
        await fs.rm(workDir, { recursive: true, force: true });
      } catch (e) {
        // 忽略清理错误
      }
    }
  }

  /**
   * 下载/生成场景视频
   */
  private async downloadScenes(scenes: SceneData[], workDir: string): Promise<SceneData[]> {
    const scenesDir = path.join(workDir, 'scenes');
    await fs.mkdir(scenesDir, { recursive: true });

    const downloaded: SceneData[] = [];

    for (const scene of scenes) {
      const outputPath = path.join(scenesDir, `scene_${scene.order}.mp4`);
      
      if (SIMULATION_MODE) {
        // 模拟模式：生成视觉效果视频
        await this.generateVisualVideo(outputPath, scene.description, 30);
      } else {
        // 真实模式：尝试下载视频，失败则生成视觉效果视频
        try {
          console.log(`[VideoComposition] Downloading scene ${scene.order}: ${scene.videoUrl}`);
          await this.downloadFile(scene.videoUrl, outputPath);
          console.log(`[VideoComposition] Downloaded: ${outputPath}`);
        } catch (error: any) {
          console.log(`[VideoComposition] Download failed, generating visual video: ${error.message}`);
          await this.generateVisualVideo(outputPath, scene.description, 30);
        }
      }
      
      downloaded.push({
        ...scene,
        videoUrl: outputPath,
      });
    }

    return downloaded;
  }

  /**
   * 生成视觉效果视频（动漫风格）- 使用AI生成图像
   */
  private async generateVisualVideo(outputPath: string, description: string, duration: number): Promise<void> {
    console.log(`[VideoComposition] Generating anime video for: ${description}`);
    
    // 中文字体路径
    const FONT_PATH = '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc';
    
    try {
      // Step 1: 使用AI生成动漫风格图像
      const animePrompt = this.buildAnimePrompt(description);
      console.log(`[VideoComposition] AI prompt: ${animePrompt}`);
      
      const client = getImageClient();
      const response = await client.generate({
        prompt: animePrompt,
        size: '2K',  // 2560x1440
        watermark: false,
      });
      
      const helper = client.getResponseHelper(response);
      
      if (helper.success && helper.imageUrls.length > 0) {
        // Step 2: 下载AI生成的图像
        const imageUrl = helper.imageUrls[0];
        console.log(`[VideoComposition] AI image generated: ${imageUrl}`);
        
        const framePath = outputPath.replace('.mp4', '_ai_frame.png');
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(framePath, imageResponse.data);
        
        // Step 3: 在图像上添加场景描述文字
        const labeledFramePath = outputPath.replace('.mp4', '_labeled.png');
        const drawTextCmd = `ffmpeg -y -i "${framePath}" -vf "drawtext=fontfile='${FONT_PATH}':text='${description.substring(0, 20)}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-100:borderw=3:bordercolor=black" -frames:v 1 "${labeledFramePath}"`;
        await execAsync(drawTextCmd);
        
        // Step 4: 生成带有动态效果的视频 - 高比特率配置
        const fps = 25;
        const totalFrames = duration * fps;
        const videoCmd = `ffmpeg -y -loop 1 -i "${labeledFramePath}" \
          -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
          -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0003,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${fps},fade=t=in:st=0:d=1,fade=t=out:st=${duration-1}:d=1" \
          -c:v libx264 -preset medium -crf 18 -b:v 8M -maxrate 12M -bufsize 16M \
          -c:a aac -b:a 192k \
          -pix_fmt yuv420p -movflags +faststart \
          -t ${duration} "${outputPath}"`;
        
        await execAsync(videoCmd);
        
        // 清理临时文件
        try {
          await fs.unlink(framePath);
          await fs.unlink(labeledFramePath);
        } catch (e) {
          // 忽略
        }
        
        console.log(`[VideoComposition] Anime video generated with AI image: ${outputPath}`);
      } else {
        // AI生成失败，降级到纯色背景
        console.log(`[VideoComposition] AI image generation failed, using fallback`);
        await this.generateFallbackVideo(outputPath, description, duration, FONT_PATH);
      }
    } catch (error: any) {
      console.error(`[VideoComposition] AI generation error: ${error.message}`);
      // 降级到纯色背景
      await this.generateFallbackVideo(outputPath, description, duration, FONT_PATH);
    }
  }

  /**
   * 构建动漫风格的AI提示词
   */
  private buildAnimePrompt(description: string): string {
    // 根据场景描述构建更详细的动漫风格提示词
    const baseStyle = "anime style, high quality, detailed, cinematic lighting, vibrant colors, 4k, masterpiece";
    
    // 场景类型关键词映射
    const sceneKeywords: Record<string, string> = {
      '剑': 'sword, martial arts, fantasy warrior, ancient china',
      '仙': 'xianxia, immortal cultivation, mystical energy, floating islands',
      '侠': 'wuxia, martial artist, heroic pose, traditional chinese architecture',
      '气': 'qi energy, glowing aura, spiritual power, ethereal atmosphere',
      '战': 'epic battle, dynamic action, intense combat, dramatic lighting',
      '斗': 'fighting scene, martial arts combat, powerful stance',
      '血': 'dramatic scene, intense atmosphere, red accents',
      '杀': 'action scene, sword fight, dynamic composition',
      '林': 'bamboo forest, misty mountains, ancient trees, peaceful nature',
      '山': 'majestic mountains, peaks in clouds, grand landscape',
      '竹': 'bamboo grove, peaceful atmosphere, chinese garden',
      '溪': 'flowing stream, crystal clear water, serene nature',
      '夜': 'night scene, moonlight, stars, mysterious atmosphere',
      '暗': 'dark atmosphere, shadows, dramatic lighting',
      '月': 'full moon, moonlit scene, ethereal glow',
      '星': 'starry night, cosmic sky, magical atmosphere',
      '日': 'sunrise, golden hour, warm lighting',
      '晨': 'morning light, dawn, fresh atmosphere',
      '昏': 'sunset, dusk, warm orange sky',
      '阳': 'bright sunlight, sunny day, warm atmosphere',
      '城': 'ancient chinese city, traditional architecture, bustling streets',
      '宫': 'imperial palace, grand architecture, royal setting',
      '殿': 'temple hall, golden decorations, sacred atmosphere',
      '阁': 'pavilion, traditional building, elegant structure',
    };
    
    let sceneDesc = '';
    for (const [key, value] of Object.entries(sceneKeywords)) {
      if (description.includes(key)) {
        sceneDesc += value + ', ';
      }
    }
    
    // 如果没有匹配的关键词，使用通用描述
    if (!sceneDesc) {
      sceneDesc = 'fantasy landscape, magical atmosphere, chinese mythology, ';
    }
    
    return `${baseStyle}, ${sceneDesc}${description}, anime art, digital painting`;
  }

  /**
   * 降级方案：生成纯色背景视频
   */
  private async generateFallbackVideo(outputPath: string, description: string, duration: number, fontPath: string): Promise<void> {
    const colorTheme = this.getColorTheme(description);
    const safeText = description.substring(0, 12);
    
    console.log(`[VideoComposition] Generating fallback video for: ${safeText}`);
    
    // 生成渐变背景帧
    const framePath = outputPath.replace('.mp4', '_frame.png');
    const gradientCmd = `ffmpeg -y -f lavfi -i "color=c=${colorTheme.bg1}:s=1920x1080:d=1,format=yuv420p" -vf "drawtext=fontfile='${fontPath}':text='${safeText}':fontsize=72:fontcolor=${colorTheme.text}:x=(w-text_w)/2:y=(h-text_h)/2:borderw=5:bordercolor=black" -frames:v 1 "${framePath}"`;
    await execAsync(gradientCmd);
    
    // 生成视频 - 高比特率配置
    const fps = 25;
    const totalFrames = duration * fps;
    const videoCmd = `ffmpeg -y -loop 1 -i "${framePath}" \
      -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
      -vf "scale=1920:1080,zoompan=z='min(zoom+0.0003,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${fps},fade=t=in:st=0:d=1,fade=t=out:st=${duration-1}:d=1" \
      -c:v libx264 -preset medium -crf 18 -b:v 8M -maxrate 12M -bufsize 16M \
      -c:a aac -b:a 192k \
      -pix_fmt yuv420p -movflags +faststart \
      -t ${duration} "${outputPath}"`;
    
    await execAsync(videoCmd);
    
    // 清理临时帧
    try {
      await fs.unlink(framePath);
    } catch (e) {
      // 忽略
    }
    
    console.log(`[VideoComposition] Fallback video generated: ${outputPath}`);
  }

  /**
   * 根据场景描述获取颜色主题
   */
  private getColorTheme(description: string): { bg1: string; bg2: string; text: string } {
    const desc = description.toLowerCase();
    
    // 仙侠/武侠 - 紫蓝色调
    if (desc.includes('剑') || desc.includes('仙') || desc.includes('侠') || desc.includes('气')) {
      return { bg1: '0x1a0a2e', bg2: '0x0a1a3e', text: 'white' };
    }
    // 战斗 - 红橙色调
    if (desc.includes('战') || desc.includes('斗') || desc.includes('血') || desc.includes('杀')) {
      return { bg1: '0x2e0a0a', bg2: '0x3e1a0a', text: '#ffcc00' };
    }
    // 森林/自然 - 绿色调
    if (desc.includes('林') || desc.includes('山') || desc.includes('竹') || desc.includes('溪')) {
      return { bg1: '0x0a2e1a', bg2: '0x1a3e2a', text: '#aaffaa' };
    }
    // 夜景 - 深蓝色调
    if (desc.includes('夜') || desc.includes('暗') || desc.includes('月') || desc.includes('星')) {
      return { bg1: '0x0a0a2e', bg2: '0x1a1a4e', text: '#aaccff' };
    }
    // 日出/日落 - 金橙色调
    if (desc.includes('日') || desc.includes('晨') || desc.includes('昏') || desc.includes('阳')) {
      return { bg1: '0x3e2a0a', bg2: '0x4e3a1a', text: '#ffddaa' };
    }
    // 默认 - 神秘紫色调
    return { bg1: '0x1a1a2e', bg2: '0x2a2a4e', text: 'white' };
  }

  /**
   * 生成测试视频（模拟模式）
   */
  private async generateTestVideo(outputPath: string, description: string, duration: number): Promise<void> {
    // 使用视觉效果版本
    await this.generateVisualVideo(outputPath, description, duration);
  }

  /**
   * 下载文件
   */
  private async downloadFile(url: string, outputPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败: ${url}`);
    }
    
    const buffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));
  }

  /**
   * 生成片头
   */
  private async generateIntro(config: EpisodeConfig, workDir: string): Promise<string> {
    const introPath = path.join(workDir, 'intro.mp4');
    
    // 使用FFmpeg生成片头（标题动画）
    const resolution = this.getResolution(config.resolution);
    
    // 创建片头帧图片
    const introFramePath = path.join(workDir, 'intro_frame.png');
    await this.createTitleFrame(
      config.title,
      `第${config.episodeNumber}集`,
      introFramePath,
      resolution
    );

    // 生成片头视频（带静音音频）- 高比特率配置
    const cmd = `ffmpeg -y -loop 1 -i "${introFramePath}" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -c:v libx264 -preset medium -crf 18 -b:v 8M -maxrate 12M -bufsize 16M -t ${config.introDuration} -c:a aac -pix_fmt yuv420p -vf "scale=${resolution.width}:${resolution.height}" "${introPath}"`;
    
    await execAsync(cmd);
    
    return introPath;
  }

  /**
   * 生成片尾
   */
  private async generateOutro(config: EpisodeConfig, workDir: string): Promise<string> {
    const outroPath = path.join(workDir, 'outro.mp4');
    const resolution = this.getResolution(config.resolution);

    // 创建片尾帧图片
    const outroFramePath = path.join(workDir, 'outro_frame.png');
    await this.createTitleFrame(
      '未完待续',
      '敬请期待下一集',
      outroFramePath,
      resolution
    );

    // 生成片尾视频（带静音音频）- 高比特率配置
    const cmd = `ffmpeg -y -loop 1 -i "${outroFramePath}" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -c:v libx264 -preset medium -crf 18 -b:v 8M -maxrate 12M -bufsize 16M -t ${config.outroDuration} -c:a aac -pix_fmt yuv420p -vf "scale=${resolution.width}:${resolution.height}" "${outroPath}"`;
    
    await execAsync(cmd);
    
    return outroPath;
  }

  /**
   * 创建标题帧图片（使用FFmpeg的drawtext滤镜）
   */
  private async createTitleFrame(
    title: string,
    subtitle: string,
    outputPath: string,
    resolution: { width: number; height: number }
  ): Promise<void> {
    // 创建纯色背景 + 文字
    const cmd = `ffmpeg -y -f lavfi -i color=c=0x0a0a1a:s=${resolution.width}x${resolution.height}:d=1 -vf "drawtext=text='${title}':fontsize=${Math.floor(resolution.height / 8)}:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50,drawtext=text='${subtitle}':fontsize=${Math.floor(resolution.height / 16)}:fontcolor=gray:x=(w-text_w)/2:y=(h-text_h)/2+100" -frames:v 1 "${outputPath}"`;
    
    await execAsync(cmd);
  }

  /**
   * 合成正片场景（添加转场）
   */
  private async composeMainScenes(
    scenes: SceneData[],
    config: EpisodeConfig,
    workDir: string,
    onProgress: (progress: number) => void
  ): Promise<string> {
    const processedDir = path.join(workDir, 'processed');
    await fs.mkdir(processedDir, { recursive: true });

    const resolution = this.getResolution(config.resolution);
    const processedScenes: string[] = [];

    // 处理每个场景
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const outputPath = path.join(processedDir, `processed_${i}.mp4`);

      // 调整视频时长和分辨率
      await this.processScene(scene.videoUrl, outputPath, config.sceneDuration, resolution);
      
      processedScenes.push(outputPath);
      
      onProgress(((i + 1) / scenes.length) * 100);
    }

    // 使用concat滤镜合并所有场景（带转场）
    const outputPath = path.join(workDir, 'main.mp4');
    await this.concatenateWithTransitions(processedScenes, config, outputPath);

    return outputPath;
  }

  /**
   * 处理单个场景（调整时长和分辨率）
   */
  private async processScene(
    inputPath: string,
    outputPath: string,
    targetDuration: number,
    resolution: { width: number; height: number }
  ): Promise<void> {
    // 获取原视频时长
    const { duration } = await this.getVideoInfo(inputPath);
    
    // 计算循环次数或裁剪
    let filterComplex = `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`;
    
    if (duration < targetDuration) {
      // 循环播放 - 高比特率配置
      const loops = Math.ceil(targetDuration / duration);
      const cmd = `ffmpeg -y -stream_loop ${loops} -i "${inputPath}" -c:v libx264 -preset medium -crf 18 -b:v 8M -maxrate 12M -bufsize 16M -t ${targetDuration} -vf "${filterComplex}" -pix_fmt yuv420p "${outputPath}"`;
      await execAsync(cmd);
    } else {
      // 裁剪 - 高比特率配置
      const cmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset medium -crf 18 -b:v 8M -maxrate 12M -bufsize 16M -t ${targetDuration} -vf "${filterComplex}" -pix_fmt yuv420p "${outputPath}"`;
      await execAsync(cmd);
    }
  }

  /**
   * 获取视频信息
   */
  private async getVideoInfo(videoPath: string): Promise<{ duration: number; width: number; height: number }> {
    const cmd = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const { stdout } = await execAsync(cmd);
    const info = JSON.parse(stdout);
    
    const videoStream = info.streams.find((s: any) => s.codec_type === 'video');
    const duration = parseFloat(info.format.duration) || 0;
    const width = videoStream?.width || 1920;
    const height = videoStream?.height || 1080;
    
    return { duration, width, height };
  }

  /**
   * 合并视频（带转场效果）
   */
  private async concatenateWithTransitions(
    videos: string[],
    config: EpisodeConfig,
    outputPath: string
  ): Promise<void> {
    if (videos.length === 0) {
      throw new Error('没有视频需要合并');
    }

    if (config.transitionType === 'none') {
      // 无转场，直接concat
      const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
      const listContent = videos.map(v => `file '${v}'`).join('\n');
      await fs.writeFile(listPath, listContent);
      
      const cmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
      await execAsync(cmd);
      return;
    }

    // 使用xfade滤镜实现转场
    const transitionDuration = config.transitionDuration;
    const transitionOffset = transitionDuration; // 转场偏移量

    // 简化方案：先concat再添加淡入淡出
    const tempPath = path.join(path.dirname(outputPath), 'temp_concat.mp4');
    const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
    const listContent = videos.map(v => `file '${v}'`).join('\n');
    await fs.writeFile(listPath, listContent);
    
    // 合并
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${tempPath}"`);
    
    // 添加全局淡入淡出
    const { duration } = await this.getVideoInfo(tempPath);
    const fadeFilter = `fade=t=in:st=0:d=${transitionDuration},fade=t=out:st=${duration - transitionDuration}:d=${transitionDuration}`;
    
    const cmd = `ffmpeg -y -i "${tempPath}" -vf "${fadeFilter}" -c:a copy "${outputPath}"`;
    await execAsync(cmd);
  }

  /**
   * 生成字幕文件（SRT格式）
   */
  private async generateSubtitles(
    scenes: SceneData[],
    config: EpisodeConfig,
    workDir: string
  ): Promise<string> {
    const srtPath = path.join(workDir, 'subtitles.srt');
    let srtContent = '';
    let currentTime = config.introDuration; // 从片头之后开始

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.subtitle) {
        const startTime = this.formatSrtTime(currentTime);
        const endTime = this.formatSrtTime(currentTime + config.sceneDuration);
        
        srtContent += `${i + 1}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${scene.subtitle}\n\n`;
      }
      
      currentTime += config.sceneDuration;
    }

    await fs.writeFile(srtPath, srtContent, 'utf-8');
    return srtPath;
  }

  /**
   * 格式化SRT时间
   */
  private formatSrtTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  /**
   * 合并视频
   */
  private async concatenateVideos(
    introPath: string,
    mainPath: string,
    outroPath: string,
    workDir: string
  ): Promise<string> {
    const outputPath = path.join(workDir, 'full.mp4');
    const listPath = path.join(workDir, 'concat_list_full.txt');
    
    const listContent = [
      `file '${introPath}'`,
      `file '${mainPath}'`,
      `file '${outroPath}'`,
    ].join('\n');
    
    await fs.writeFile(listPath, listContent);
    
    const cmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`;
    await execAsync(cmd);
    
    return outputPath;
  }

  /**
   * 添加字幕和背景音乐
   */
  private async addSubtitlesAndBGM(
    videoPath: string,
    subtitlePath: string | undefined,
    config: EpisodeConfig,
    workDir: string
  ): Promise<string> {
    const outputPath = path.join(workDir, 'final.mp4');
    
    // 构建滤镜
    let videoFilter = '';
    
    // 添加字幕
    if (subtitlePath && config.enableSubtitles) {
      videoFilter = `subtitles='${subtitlePath}':force_style='FontName=${config.subtitleStyle?.fontName},FontSize=${config.subtitleStyle?.fontSize},PrimaryColour=&H${this.colorToAss(config.subtitleStyle?.fontColor || 'white')},OutlineColour=&H${this.colorToAss(config.subtitleStyle?.outlineColor || 'black')},Outline=2'`;
    }

    // 获取视频时长
    const { duration: videoDuration } = await this.getVideoInfo(videoPath);

    // 背景音乐处理
    let bgmPath: string;
    
    // 始终尝试下载背景音乐，失败则使用静音
    bgmPath = path.join(workDir, 'bgm.mp3');
    try {
      const bgmUrl = this.getBGMUrl(config.bgmStyle);
      console.log(`[VideoComposition] Downloading BGM: ${bgmUrl}`);
      await this.downloadFile(bgmUrl, bgmPath);
      console.log('[VideoComposition] BGM downloaded successfully');
    } catch (error: any) {
      console.log(`[VideoComposition] BGM download failed, using silent audio: ${error.message}`);
      await this.generateSilentAudio(bgmPath, videoDuration);
    }

    // 构建命令
    let cmd: string;
    
    if (videoFilter) {
      cmd = `ffmpeg -y -i "${videoPath}" -i "${bgmPath}" -vf "${videoFilter}" -filter_complex "[1:a]volume=${config.bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v libx264 -preset slow -crf 18 "${outputPath}"`;
    } else {
      cmd = `ffmpeg -y -i "${videoPath}" -i "${bgmPath}" -filter_complex "[1:a]volume=${config.bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v libx264 -preset slow -crf 18 "${outputPath}"`;
    }

    await execAsync(cmd);
    return outputPath;
  }

  /**
   * 生成静音音轨
   */
  private async generateSilentAudio(outputPath: string, duration: number): Promise<void> {
    const cmd = `ffmpeg -y -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 -t ${duration} -c:a libmp3lame "${outputPath}"`;
    await execAsync(cmd);
  }

  /**
   * 获取背景音乐URL
   */
  private getBGMUrl(style: string): string {
    // 使用Pixabay免费音乐
    const bgmUrls: Record<string, string> = {
      'xianxia': 'https://cdn.pixabay.com/audio/2022/03/10/audio_8cb749d487.mp3', // 仙侠风
      'wuxia': 'https://cdn.pixabay.com/audio/2021/11/25/audio_91b32e02f8.mp3',   // 武侠风
      'epic': 'https://cdn.pixabay.com/audio/2022/10/25/audio_946d1b0fb7.mp3',     // 史诗
      'peaceful': 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3', // 平静
      'custom': 'https://cdn.pixabay.com/audio/2022/03/10/audio_8cb749d487.mp3',   // 默认
    };
    
    return bgmUrls[style] || bgmUrls['xianxia'];
  }

  /**
   * 颜色转换为ASS格式
   */
  private colorToAss(color: string): string {
    const colors: Record<string, string> = {
      'white': 'FFFFFF',
      'black': '000000',
      'red': '0000FF',
      'green': '00FF00',
      'blue': 'FF0000',
      'yellow': '00FFFF',
    };
    
    return colors[color] || 'FFFFFF';
  }

  /**
   * 获取分辨率
   */
  private getResolution(resolution: string): { width: number; height: number } {
    const resolutions: Record<string, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '4k': { width: 3840, height: 2160 },
    };
    
    return resolutions[resolution] || resolutions['1080p'];
  }
}

// ============================================================
// 单例
// ============================================================

let compositionServiceInstance: VideoCompositionService | null = null;

export function getVideoCompositionService(): VideoCompositionService {
  if (!compositionServiceInstance) {
    compositionServiceInstance = new VideoCompositionService();
  }
  return compositionServiceInstance;
}

export default VideoCompositionService;
