/**
 * 服务端文件：server/src/services/video-generation-service.ts
 * 视频生成服务 - 自有模型
 * 
 * 功能：
 * - 文生视频（Text-to-Video）
 * - 图生视频（Image-to-Video）
 * - 批量视频生成
 * - 任务队列管理
 * - 模型故障转移
 * - 模拟模式（返回真实可用视频）
 */

import EventEmitter from 'events';
import { VideoGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSceneVideo } from './mock-video-service.js';

// 模拟模式开关 - 设为true时返回真实可用的视频
const MOCK_MODE = true;

// ============================================================
// 类型定义
// ============================================================

export interface VideoGenerationOptions {
  prompt: string;
  imageUrl?: string;
  lastFrameUrl?: string;
  duration?: number; // 4-12秒
  ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9' | 'adaptive';
  resolution?: '480p' | '720p' | '1080p';
  generateAudio?: boolean;
  watermark?: boolean;
  seed?: number;
  camerafixed?: boolean;
  callbackUrl?: string;
}

export interface VideoTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  prompt: string;
  videoUrl?: string;
  lastFrameUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface VideoGenerationResult {
  success: boolean;
  taskId: string;
  videoUrl?: string;
  lastFrameUrl?: string;
  error?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  successRate: number;
  avgDuration: number;
}

// ============================================================
// 视频生成服务类
// ============================================================

class VideoGenerationService extends EventEmitter {
  private client: VideoGenerationClient;
  private config: Config;
  private tasks: Map<string, VideoTask> = new Map();
  private taskQueue: string[] = [];
  private isProcessing: boolean = false;
  private maxConcurrent: number = 2;
  private activeCount: number = 0;

  // 可用模型配置
  private readonly MODELS: ModelConfig[] = [
    { id: 'doubao-seedance-1-5-pro-251215', name: 'Seedance 1.5 Pro', priority: 1, enabled: true, successRate: 0.95, avgDuration: 45000 },
  ];

  constructor(customHeaders?: Record<string, string>) {
    super();
    this.config = new Config();
    this.client = new VideoGenerationClient(this.config, customHeaders);
  }

  // ============================================================
  // 公共 API
  // ============================================================

  /**
   * 生成单个视频
   */
  async generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    const taskId = crypto.randomUUID();

    // 创建任务
    const task: VideoTask = {
      id: taskId,
      status: 'pending',
      progress: 0,
      prompt: options.prompt,
      createdAt: new Date(),
      metadata: {
        duration: options.duration || 5,
        ratio: options.ratio || '16:9',
        resolution: options.resolution || '720p',
      },
    };

    this.tasks.set(taskId, task);
    this.emit('task_created', task);

    // 模拟模式
    if (MOCK_MODE) {
      return this.generateMockVideo(taskId, options);
    }

    try {
      // 更新状态
      task.status = 'processing';
      task.progress = 10;
      this.emit('task_progress', { taskId, progress: 10 });

      // 构建内容
      const content = this.buildContent(options);

      // 调用视频生成
      const startTime = Date.now();
      
      const response = await this.client.videoGeneration(content as any, {
        model: this.getBestModel().id,
        duration: options.duration || 5,
        ratio: options.ratio || '16:9',
        resolution: options.resolution || '720p',
        generateAudio: options.generateAudio ?? true,
        watermark: options.watermark ?? false,
        seed: options.seed,
        camerafixed: options.camerafixed,
        callbackUrl: options.callbackUrl,
      });

      const duration = Date.now() - startTime;

      // 处理结果
      if (response.videoUrl) {
        task.status = 'completed';
        task.progress = 100;
        task.videoUrl = response.videoUrl;
        task.lastFrameUrl = response.lastFrameUrl || undefined;
        task.completedAt = new Date();
        task.duration = duration;

        this.emit('task_completed', task);
        
        return {
          success: true,
          taskId,
          videoUrl: response.videoUrl,
          lastFrameUrl: response.lastFrameUrl || undefined,
        };
      } else {
        throw new Error('视频生成失败：未返回视频URL');
      }
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      task.completedAt = new Date();

      this.emit('task_failed', { taskId, error: error.message });

      return {
        success: false,
        taskId,
        error: error.message,
      };
    }
  }

  /**
   * 批量生成视频
   */
  async generateBatch(
    optionsList: VideoGenerationOptions[],
    concurrency: number = 2
  ): Promise<VideoGenerationResult[]> {
    const results: VideoGenerationResult[] = [];
    this.maxConcurrent = concurrency;

    // 分批处理
    for (let i = 0; i < optionsList.length; i += concurrency) {
      const batch = optionsList.slice(i, i + concurrency);
      
      const batchPromises = batch.map(options => this.generateVideo(options));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 图生视频（首帧控制）
   */
  async imageToVideo(
    imageUrl: string,
    prompt: string,
    options?: Partial<VideoGenerationOptions>
  ): Promise<VideoGenerationResult> {
    return this.generateVideo({
      prompt,
      imageUrl,
      ...options,
    });
  }

  /**
   * 图生视频（首尾帧控制）
   */
  async imageToVideoWithEndFrame(
    firstFrameUrl: string,
    lastFrameUrl: string,
    prompt: string,
    options?: Partial<VideoGenerationOptions>
  ): Promise<VideoGenerationResult> {
    return this.generateVideo({
      prompt,
      imageUrl: firstFrameUrl,
      lastFrameUrl,
      ...options,
    });
  }

  /**
   * 连续视频生成（保持视觉一致性）
   */
  async generateSequential(
    prompts: string[],
    options?: Partial<VideoGenerationOptions>
  ): Promise<VideoGenerationResult[]> {
    const results: VideoGenerationResult[] = [];
    let lastFrameUrl: string | undefined;

    for (const prompt of prompts) {
      const videoOptions: VideoGenerationOptions = {
        prompt,
        ...options,
      };

      // 如果有上一帧，用作首帧
      if (lastFrameUrl) {
        videoOptions.imageUrl = lastFrameUrl;
      }

      const result = await this.generateVideo({
        ...videoOptions,
        // 请求返回最后一帧
      } as VideoGenerationOptions);

      results.push(result);

      // 保存最后一帧用于下一个视频
      if (result.success && result.lastFrameUrl) {
        lastFrameUrl = result.lastFrameUrl;
      }
    }

    return results;
  }

  /**
   * 查询任务状态
   */
  getTaskStatus(taskId: string): VideoTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): VideoTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取模型状态
   */
  getModelStatus(): ModelConfig[] {
    return this.MODELS;
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'pending') {
      task.status = 'failed';
      task.error = '用户取消';
      task.completedAt = new Date();
      this.emit('task_cancelled', { taskId });
      return true;
    }
    return false;
  }

  // ============================================================
  // 私有方法
  // ============================================================

  private buildContent(options: VideoGenerationOptions) {
    const content: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string }; role?: string }> = [];

    // 添加首帧图片
    if (options.imageUrl) {
      content.push({
        type: 'image_url' as const,
        image_url: { url: options.imageUrl },
        role: 'first_frame',
      });
    }

    // 添加尾帧图片
    if (options.lastFrameUrl) {
      content.push({
        type: 'image_url' as const,
        image_url: { url: options.lastFrameUrl },
        role: 'last_frame',
      });
    }

    // 添加文本提示
    content.push({
      type: 'text' as const,
      text: options.prompt,
    });

    return content;
  }

  private getBestModel(): ModelConfig {
    // 返回优先级最高且启用的模型
    const enabledModels = this.MODELS.filter(m => m.enabled);
    return enabledModels.sort((a, b) => a.priority - b.priority)[0];
  }

  /**
   * 模拟视频生成（返回真实可用的视频）
   */
  private async generateMockVideo(taskId: string, options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return { success: false, taskId, error: '任务不存在' };
    }

    console.log(`[VideoGen] Generating video for: ${options.prompt.substring(0, 50)}...`);

    // 模拟处理延迟（真实视频生成需要时间）
    const processingTime = 1500 + Math.random() * 2000; // 1.5-3.5秒
    
    task.status = 'processing';
    task.progress = 20;
    this.emit('task_progress', { taskId, progress: 20 });

    // 进度更新
    await new Promise(resolve => setTimeout(resolve, processingTime / 2));
    task.progress = 60;
    this.emit('task_progress', { taskId, progress: 60 });

    await new Promise(resolve => setTimeout(resolve, processingTime / 2));

    // 获取真实可用的视频URL
    const { videoUrl, lastFrameUrl } = getSceneVideo(options.prompt, taskId);

    // 更新任务状态
    task.status = 'completed';
    task.progress = 100;
    task.videoUrl = videoUrl;
    task.lastFrameUrl = lastFrameUrl;
    task.completedAt = new Date();
    task.duration = processingTime;

    this.emit('task_completed', task);

    console.log(`[VideoGen] Video generated: ${videoUrl}`);

    return {
      success: true,
      taskId,
      videoUrl,
      lastFrameUrl,
    };
  }

  // ============================================================
  // Express 请求头转发
  // ============================================================

  /**
   * 从 Express 请求创建客户端
   */
  static createFromRequest(req: { headers: Record<string, string> }): VideoGenerationService {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers);
    return new VideoGenerationService(customHeaders);
  }
}

// ============================================================
// 单例
// ============================================================

let videoServiceInstance: VideoGenerationService | null = null;

export function getVideoGenerationService(customHeaders?: Record<string, string>): VideoGenerationService {
  if (!videoServiceInstance) {
    videoServiceInstance = new VideoGenerationService(customHeaders);
  }
  return videoServiceInstance;
}

export function createVideoServiceFromRequest(req: { headers: Record<string, string> }): VideoGenerationService {
  return VideoGenerationService.createFromRequest(req);
}

export default VideoGenerationService;
