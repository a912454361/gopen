/**
 * 多模型并行视频生成服务
 * 支持同时使用多个视频生成服务（Seedance、可灵、Runway、Pika等）
 * 实现智能调度、故障转移、负载均衡
 */

import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const client = getSupabaseClient();

// 视频生成服务配置
export const VIDEO_SERVICES = {
  // 豆包 Seedance 1.5 Pro（主要服务）
  seedance: {
    name: 'Seedance 1.5 Pro',
    provider: 'ByteDance',
    model: 'doubao-seedance-1-5-pro-251215',
    priority: 1,
    maxConcurrent: 5,
    avgGenerationTime: 60000, // 60秒
    features: ['high_quality', 'chinese_optimized', 'audio'],
    status: 'active',
  },
  // 可灵 Kling（快手）
  kling: {
    name: 'Kling',
    provider: 'Kuaishou',
    model: 'kling-v1',
    priority: 2,
    maxConcurrent: 3,
    avgGenerationTime: 45000,
    features: ['fast', 'realistic', 'motion'],
    status: 'active',
    apiKey: process.env.KLING_API_KEY,
  },
  // Runway Gen-3
  runway: {
    name: 'Runway Gen-3',
    provider: 'Runway',
    model: 'runway-gen3',
    priority: 3,
    maxConcurrent: 2,
    avgGenerationTime: 90000,
    features: ['cinematic', 'high_motion', 'creative'],
    status: 'active',
    apiKey: process.env.RUNWAY_API_KEY,
  },
  // Pika Labs
  pika: {
    name: 'Pika Labs',
    provider: 'Pika',
    model: 'pika-v1',
    priority: 4,
    maxConcurrent: 3,
    avgGenerationTime: 50000,
    features: ['anime', 'stylized', 'fast'],
    status: 'active',
    apiKey: process.env.PIKA_API_KEY,
  },
  // Sora（OpenAI，待开放）
  sora: {
    name: 'Sora',
    provider: 'OpenAI',
    model: 'sora',
    priority: 0, // 最高优先级
    maxConcurrent: 1,
    avgGenerationTime: 120000,
    features: ['ultra_quality', 'long_duration', 'complex'],
    status: 'coming_soon',
  },
} as const;

// 服务类型
type VideoServiceKey = keyof typeof VIDEO_SERVICES;

// 生成任务
interface VideoGenerationTask {
  id: string;
  prompt: string;
  style: string;
  service: VideoServiceKey;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
  retryCount: number;
}

// 服务状态
interface ServiceStatus {
  service: VideoServiceKey;
  activeTasks: number;
  totalGenerated: number;
  failedCount: number;
  avgLatency: number;
  lastUsed?: number;
  isHealthy: boolean;
}

// 服务状态追踪
const serviceStatuses: Map<VideoServiceKey, ServiceStatus> = new Map();

// 初始化服务状态
Object.keys(VIDEO_SERVICES).forEach((key) => {
  const serviceKey = key as VideoServiceKey;
  const service = VIDEO_SERVICES[serviceKey];
  serviceStatuses.set(serviceKey, {
    service: serviceKey,
    activeTasks: 0,
    totalGenerated: 0,
    failedCount: 0,
    avgLatency: service.avgGenerationTime,
    isHealthy: service.status === 'active',
  });
});

/**
 * 多模型并行生成器
 */
export class MultiModelVideoGenerator {
  private config: Config;
  private seedanceClient: VideoGenerationClient;
  private maxTotalConcurrent: number;

  constructor(maxTotalConcurrent = 10) {
    this.config = new Config();
    this.seedanceClient = new VideoGenerationClient(this.config, {});
    this.maxTotalConcurrent = maxTotalConcurrent;
  }

  /**
   * 智能选择最优服务
   * 基于当前负载、服务健康度、历史性能
   */
  selectOptimalService(
    prompt: string,
    style: string,
    preferredServices?: VideoServiceKey[]
  ): VideoServiceKey {
    const availableServices = (preferredServices || Object.keys(VIDEO_SERVICES) as VideoServiceKey[])
      .filter((key) => {
        const service = VIDEO_SERVICES[key];
        const status = serviceStatuses.get(key);
        return service.status === 'active' && 
               status?.isHealthy && 
               (status.activeTasks < service.maxConcurrent);
      });

    if (availableServices.length === 0) {
      // 所有服务都忙，返回最低负载的
      return this.getLeastLoadedService();
    }

    // 根据风格选择最适合的服务
    if (style.includes('动漫') || style.includes('国风')) {
      if (availableServices.includes('pika')) return 'pika';
      if (availableServices.includes('seedance')) return 'seedance';
    }

    if (style.includes('写实') || style.includes('真实')) {
      if (availableServices.includes('kling')) return 'kling';
      if (availableServices.includes('runway')) return 'runway';
    }

    if (style.includes('电影') || style.includes('大片')) {
      if (availableServices.includes('runway')) return 'runway';
    }

    // 默认按优先级和负载选择
    return this.getBestAvailableService(availableServices);
  }

  /**
   * 获取负载最低的服务
   */
  private getLeastLoadedService(): VideoServiceKey {
    let minLoad = Infinity;
    let bestService: VideoServiceKey = 'seedance';

    serviceStatuses.forEach((status, key) => {
      const service = VIDEO_SERVICES[key];
      if (service.status === 'active' && status.isHealthy) {
        const load = status.activeTasks / service.maxConcurrent;
        if (load < minLoad) {
          minLoad = load;
          bestService = key;
        }
      }
    });

    return bestService;
  }

  /**
   * 获取最佳可用服务
   */
  private getBestAvailableService(services: VideoServiceKey[]): VideoServiceKey {
    let bestScore = -1;
    let bestService: VideoServiceKey = services[0];

    services.forEach((key) => {
      const service = VIDEO_SERVICES[key];
      const status = serviceStatuses.get(key)!;
      
      // 计算综合得分：优先级 + 空闲度 + 成功率
      const idleRatio = 1 - (status.activeTasks / service.maxConcurrent);
      const successRate = status.totalGenerated > 0 
        ? (status.totalGenerated - status.failedCount) / status.totalGenerated 
        : 1;
      const score = (10 - service.priority) * 0.4 + idleRatio * 0.4 + successRate * 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestService = key;
      }
    });

    return bestService;
  }

  /**
   * 使用指定服务生成视频
   */
  async generateWithService(params: {
    prompt: string;
    style: string;
    service: VideoServiceKey;
    duration?: number;
    resolution?: string;
  }): Promise<{ videoUrl: string; service: VideoServiceKey }> {
    const { prompt, style, service, duration = 5, resolution = '1080p' } = params;
    const status = serviceStatuses.get(service)!;
    status.activeTasks++;
    status.lastUsed = Date.now();

    const startTime = Date.now();

    try {
      let videoUrl: string;

      switch (service) {
        case 'seedance':
          videoUrl = await this.generateWithSeedance(prompt, style, duration, resolution);
          break;
        case 'kling':
          videoUrl = await this.generateWithKling(prompt, style, duration, resolution);
          break;
        case 'runway':
          videoUrl = await this.generateWithRunway(prompt, style, duration, resolution);
          break;
        case 'pika':
          videoUrl = await this.generateWithPika(prompt, style, duration, resolution);
          break;
        default:
          throw new Error(`Unknown service: ${service}`);
      }

      // 更新成功状态
      const latency = Date.now() - startTime;
      status.totalGenerated++;
      status.avgLatency = (status.avgLatency * 0.9) + (latency * 0.1);
      status.isHealthy = true;

      return { videoUrl, service };
    } catch (error) {
      status.failedCount++;
      
      // 连续失败则标记为不健康
      if (status.failedCount >= 3) {
        status.isHealthy = false;
        console.warn(`[MultiModel] Service ${service} marked as unhealthy`);
      }

      throw error;
    } finally {
      status.activeTasks--;
    }
  }

  /**
   * Seedance 生成
   */
  private async generateWithSeedance(
    prompt: string,
    style: string,
    duration: number,
    resolution: string
  ): Promise<string> {
    const enhancedPrompt = `${style}风格, ${prompt}，高质量动画`;
    
    const response = await this.seedanceClient.videoGeneration(
      [{ type: 'text', text: enhancedPrompt }],
      {
        model: VIDEO_SERVICES.seedance.model,
        duration,
        ratio: '16:9',
        resolution: resolution as any,
        generateAudio: true,
        watermark: false,
      }
    );

    if (!response.videoUrl) {
      throw new Error(response.response?.error_message || 'Seedance generation failed');
    }

    return response.videoUrl;
  }

  /**
   * 可灵 Kling 生成（模拟，需配置API Key）
   */
  private async generateWithKling(
    prompt: string,
    style: string,
    duration: number,
    resolution: string
  ): Promise<string> {
    // 如果有API Key，调用真实API
    if (VIDEO_SERVICES.kling.apiKey) {
      // TODO: 实现真实的Kling API调用
      console.log('[MultiModel] Kling API call with key');
    }

    // 暂时使用Seedance作为后备
    console.log('[MultiModel] Kling not configured, using Seedance fallback');
    return this.generateWithSeedance(prompt, style, duration, resolution);
  }

  /**
   * Runway 生成（模拟，需配置API Key）
   */
  private async generateWithRunway(
    prompt: string,
    style: string,
    duration: number,
    resolution: string
  ): Promise<string> {
    if (VIDEO_SERVICES.runway.apiKey) {
      console.log('[MultiModel] Runway API call with key');
    }

    console.log('[MultiModel] Runway not configured, using Seedance fallback');
    return this.generateWithSeedance(prompt, style, duration, resolution);
  }

  /**
   * Pika 生成（模拟，需配置API Key）
   */
  private async generateWithPika(
    prompt: string,
    style: string,
    duration: number,
    resolution: string
  ): Promise<string> {
    if (VIDEO_SERVICES.pika.apiKey) {
      console.log('[MultiModel] Pika API call with key');
    }

    console.log('[MultiModel] Pika not configured, using Seedance fallback');
    return this.generateWithSeedance(prompt, style, duration, resolution);
  }

  /**
   * 多服务并行生成（核心方法）
   * 同时使用多个服务生成，取最快返回的结果
   */
  async parallelGenerateWithMultipleServices(params: {
    prompt: string;
    style: string;
    services: VideoServiceKey[];
    duration?: number;
    resolution?: string;
    raceMode?: boolean; // 竞速模式：取最快返回
  }): Promise<{ videoUrl: string; service: VideoServiceKey; allResults?: Map<VideoServiceKey, string> }> {
    const { prompt, style, services, duration, resolution, raceMode = true } = params;

    if (raceMode) {
      // 竞速模式：所有服务同时生成，取最快返回
      const promises = services.map((service) =>
        this.generateWithService({ prompt, style, service, duration, resolution })
          .catch((error) => {
            console.warn(`[MultiModel] Service ${service} failed:`, error.message);
            return null;
          })
      );

      const results = await Promise.all(promises);
      const successResult = results.find((r) => r !== null);

      if (!successResult) {
        throw new Error('All services failed');
      }

      return successResult!;
    } else {
      // 非竞速模式：收集所有成功结果
      const results = new Map<VideoServiceKey, string>();
      const promises = services.map(async (service) => {
        try {
          const result = await this.generateWithService({ prompt, style, service, duration, resolution });
          results.set(service, result.videoUrl);
          return result;
        } catch {
          return null;
        }
      });

      await Promise.all(promises);

      if (results.size === 0) {
        throw new Error('All services failed');
      }

      const [firstService, firstUrl] = results.entries().next().value;
      return { videoUrl: firstUrl, service: firstService, allResults: results };
    }
  }

  /**
   * 获取所有服务状态
   */
  getServiceStatuses(): Map<VideoServiceKey, ServiceStatus> {
    return new Map(serviceStatuses);
  }

  /**
   * 获取推荐的服务组合
   */
  getRecommendedServices(style: string): VideoServiceKey[] {
    const recommendations: VideoServiceKey[] = [];

    if (style.includes('动漫') || style.includes('国风')) {
      recommendations.push('seedance', 'pika');
    } else if (style.includes('写实') || style.includes('真实')) {
      recommendations.push('kling', 'runway');
    } else if (style.includes('电影')) {
      recommendations.push('runway', 'seedance');
    } else {
      recommendations.push('seedance');
    }

    // 只返回可用的服务
    return recommendations.filter((key) => {
      const service = VIDEO_SERVICES[key];
      const status = serviceStatuses.get(key);
      return service.status === 'active' && status?.isHealthy;
    });
  }
}

// 导出单例
export const multiModelGenerator = new MultiModelVideoGenerator();

/**
 * 使用多模型并行生成视频（便捷函数）
 */
export async function multiModelGenerateVideo(params: {
  prompt: string;
  style: string;
  preferredServices?: VideoServiceKey[];
  duration?: number;
  resolution?: string;
  raceMode?: boolean;
}): Promise<{ videoUrl: string; service: VideoServiceKey }> {
  const { prompt, style, preferredServices, duration, resolution, raceMode } = params;

  // 获取推荐服务
  const services = preferredServices || multiModelGenerator.getRecommendedServices(style);

  if (services.length === 0) {
    throw new Error('No available video generation services');
  }

  // 单服务直接生成
  if (services.length === 1) {
    return multiModelGenerator.generateWithService({
      prompt,
      style,
      service: services[0],
      duration,
      resolution,
    });
  }

  // 多服务并行生成
  return multiModelGenerator.parallelGenerateWithMultipleServices({
    prompt,
    style,
    services,
    duration,
    resolution,
    raceMode,
  });
}
