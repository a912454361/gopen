/**
 * 服务端文件：server/src/services/model-resilience-service.ts
 * 模型容错与备份服务
 */

import { Router, type Request, type Response } from 'express';
import EventEmitter from 'events';

// 模型状态
type ModelStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';

// 模型类型
type ModelType = 'llm' | 'image' | 'video' | 'audio';

// AI 模型配置
interface AIModel {
  id: string;
  name: string;
  type: ModelType;
  provider: string;
  priority: number; // 1=主模型, 2=备选, 3=兜底
  status: ModelStatus;
  latencyMs: number;
  successRate: number;
  consecutiveFailures: number;
  totalRequests: number;
  successfulRequests: number;
  lastCheck?: Date;
  apiEndpoint: string;
}

// 模型组
interface ModelGroup {
  type: ModelType;
  models: AIModel[];
  currentPrimary: string;
  failoverThreshold: number;
}

// 故障转移事件
interface FailoverEvent {
  modelType: ModelType;
  oldPrimary: string;
  newPrimary: string;
  reason: string;
  timestamp: Date;
}

class ModelResilienceService extends EventEmitter {
  private modelGroups: Map<ModelType, ModelGroup> = new Map();
  private healthCheckInterval?: ReturnType<typeof setInterval>;
  private isRunning: boolean = false;
  private failoverHistory: FailoverEvent[] = [];

  // 预配置的模型（每种类型多个备份）
  private readonly MODEL_CONFIGS: Record<ModelType, Partial<AIModel>[]> = {
    llm: [
      // 主模型
      { id: 'doubao-seed-pro', name: 'Doubao Seed Pro', provider: 'doubao', priority: 1 },
      { id: 'doubao-seed-lite', name: 'Doubao Seed Lite', provider: 'doubao', priority: 1 },
      // 备选 - DeepSeek
      { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'deepseek', priority: 2 },
      { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'deepseek', priority: 2 },
      // 备选 - Kimi
      { id: 'kimi-k2', name: 'Kimi K2', provider: 'moonshot', priority: 2 },
      { id: 'moonshot-v1', name: 'Moonshot V1', provider: 'moonshot', priority: 3 },
      // 备选 - 阿里
      { id: 'qwen-max', name: '通义千问 Max', provider: 'alibaba', priority: 2 },
      { id: 'qwen-plus', name: '通义千问 Plus', provider: 'alibaba', priority: 3 },
      // 备选 - 智谱
      { id: 'glm-4', name: '智谱 GLM-4', provider: 'zhipu', priority: 2 },
      { id: 'glm-4-plus', name: 'GLM-4 Plus', provider: 'zhipu', priority: 3 },
      // 兜底 - 国际
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', priority: 4 },
      { id: 'claude-3-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', priority: 4 },
      { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', priority: 4 },
    ],
    image: [
      // 主模型
      { id: 'image-gen-4k', name: 'Image Gen 4K', provider: 'doubao', priority: 1 },
      { id: 'image-gen-2k', name: 'Image Gen 2K', provider: 'doubao', priority: 1 },
      // 备选 - 通用
      { id: 'midjourney-v6', name: 'Midjourney V6', provider: 'midjourney', priority: 2 },
      { id: 'dall-e-3', name: 'DALL-E 3', provider: 'openai', priority: 2 },
      { id: 'flux-pro', name: 'Flux Pro', provider: 'flux', priority: 2 },
      // 备选 - 动漫专用
      { id: 'niji-v6', name: 'Niji V6 (动漫)', provider: 'midjourney', priority: 2 },
      { id: 'novelai-v3', name: 'NovelAI V3', provider: 'novelai', priority: 2 },
      { id: 'stable-diffusion-xl', name: 'SDXL', provider: 'stability', priority: 3 },
      { id: 'sdxl-turbo', name: 'SDXL Turbo', provider: 'stability', priority: 3 },
      // 国风专用
      { id: 'liblib-ai', name: 'LiblibAI (国风)', provider: 'liblib', priority: 2 },
      { id: 'tiamat', name: 'Tiamat', provider: 'tiamat', priority: 3 },
    ],
    video: [
      // 主模型
      { id: 'video-gen-1080p', name: 'Video Gen 1080p', provider: 'doubao', priority: 1 },
      { id: 'video-gen-720p', name: 'Video Gen 720p', provider: 'doubao', priority: 1 },
      // 备选 - 通用
      { id: 'runway-gen3', name: 'Runway Gen-3', provider: 'runway', priority: 2 },
      { id: 'runway-gen2', name: 'Runway Gen-2', provider: 'runway', priority: 3 },
      { id: 'pika-labs', name: 'Pika Labs', provider: 'pika', priority: 2 },
      { id: 'sora', name: 'Sora', provider: 'openai', priority: 2 },
      // 备选 - 国产
      { id: 'kling-v1', name: '可灵 AI', provider: 'kuaishou', priority: 2 },
      { id: 'kling-pro', name: '可灵 Pro', provider: 'kuaishou', priority: 2 },
      { id: 'hailuo-video', name: '海螺视频', provider: 'minimax', priority: 2 },
      { id: 'cogvideox', name: 'CogVideoX', provider: 'zhipu', priority: 3 },
      // 备选 - 其他
      { id: 'seedance', name: 'Seedance', provider: 'doubao', priority: 2 },
      { id: 'stable-video', name: 'Stable Video Diffusion', provider: 'stability', priority: 4 },
    ],
    audio: [
      // 主模型
      { id: 'tts-zh-pro', name: 'TTS Chinese Pro', provider: 'doubao', priority: 1 },
      { id: 'tts-jp-pro', name: 'TTS Japanese Pro', provider: 'doubao', priority: 1 },
      // 备选 - 通用
      { id: 'eleven-labs', name: 'ElevenLabs', provider: 'elevenlabs', priority: 2 },
      { id: 'azure-tts', name: 'Azure TTS', provider: 'microsoft', priority: 2 },
      { id: 'google-tts', name: 'Google Cloud TTS', provider: 'google', priority: 2 },
      { id: 'aws-polly', name: 'AWS Polly', provider: 'amazon', priority: 3 },
      // 备选 - 中文配音
      { id: 'gpt-sovits', name: 'GPT-SoVITS (配音)', provider: 'opensource', priority: 2 },
      { id: 'vits-chinese', name: 'VITS 中文', provider: 'opensource', priority: 3 },
      { id: 'bark', name: 'Suno Bark', provider: 'suno', priority: 3 },
      // 音乐生成
      { id: 'suno-music', name: 'Suno Music', provider: 'suno', priority: 2 },
      { id: 'udio', name: 'Udio', provider: 'udio', priority: 2 },
    ],
  };

  constructor() {
    super();
    this.initializeModelGroups();
  }

  private initializeModelGroups(): void {
    for (const [type, configs] of Object.entries(this.MODEL_CONFIGS)) {
      const models: AIModel[] = configs.map(config => ({
        id: config.id!,
        name: config.name!,
        type: type as ModelType,
        provider: config.provider!,
        priority: config.priority!,
        status: 'healthy' as ModelStatus,
        latencyMs: 0,
        successRate: 1.0,
        consecutiveFailures: 0,
        totalRequests: 0,
        successfulRequests: 0,
        apiEndpoint: `https://api.${config.provider}.com/v1`,
      }));

      const primaryModel = models.find(m => m.priority === 1) || models[0];

      this.modelGroups.set(type as ModelType, {
        type: type as ModelType,
        models,
        currentPrimary: primaryModel.id,
        failoverThreshold: 3,
      });
    }

    console.log(`[ModelResilience] Initialized ${this.modelGroups.size} model groups`);
  }

  startHealthMonitor(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.healthCheckInterval = setInterval(() => this.runHealthChecks(), 30000);

    console.log('[ModelResilience] Health monitor started');
  }

  stopHealthMonitor(): void {
    this.isRunning = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    console.log('[ModelResilience] Health monitor stopped');
  }

  private async runHealthChecks(): Promise<void> {
    for (const [type, group] of this.modelGroups) {
      for (const model of group.models) {
        await this.checkModelHealth(model);
      }
    }
  }

  private async checkModelHealth(model: AIModel): Promise<void> {
    try {
      const startTime = Date.now();

      // 模拟健康检查（实际应调用API）
      // const response = await fetch(`${model.apiEndpoint}/health`, { timeout: 5000 });
      const isHealthy = Math.random() > 0.02; // 98% 健康率模拟

      const latency = Date.now() - startTime;

      model.latencyMs = latency;
      model.lastCheck = new Date();

      if (isHealthy) {
        model.consecutiveFailures = 0;
        model.status = latency < 2000 ? 'healthy' : 'degraded';
      } else {
        model.consecutiveFailures++;
        if (model.consecutiveFailures >= 3) {
          model.status = 'unhealthy';
          this.triggerFailover(model);
        }
      }
    } catch (error) {
      model.consecutiveFailures++;
      model.status = model.consecutiveFailures >= 3 ? 'unhealthy' : 'degraded';
      console.warn(`[ModelResilience] Health check failed for ${model.id}: ${error}`);
    }
  }

  private triggerFailover(failedModel: AIModel): void {
    const group = this.modelGroups.get(failedModel.type);
    if (!group) return;

    const backupModels = group.models.filter(
      m => m.id !== failedModel.id && m.status === 'healthy'
    );

    if (backupModels.length === 0) {
      console.error(`[ModelResilience] No backup models available for ${failedModel.type}`);
      this.emit('failover_failed', { modelType: failedModel.type });
      return;
    }

    // 选择优先级最高的健康模型
    const newPrimary = backupModels.reduce((best, current) =>
      current.priority < best.priority ? current : best
    );

    const oldPrimary = group.currentPrimary;
    group.currentPrimary = newPrimary.id;

    const event: FailoverEvent = {
      modelType: failedModel.type,
      oldPrimary,
      newPrimary: newPrimary.id,
      reason: `Consecutive failures: ${failedModel.consecutiveFailures}`,
      timestamp: new Date(),
    };

    this.failoverHistory.push(event);
    this.emit('failover', event);

    console.log(`[ModelResilience] Failover: ${oldPrimary} -> ${newPrimary.id} (${failedModel.type})`);
  }

  getModel(modelType: ModelType): AIModel | null {
    const group = this.modelGroups.get(modelType);
    if (!group) return null;

    const primary = group.models.find(m => m.id === group.currentPrimary);
    if (primary?.status === 'healthy') return primary;

    // 返回健康的备选模型
    const healthy = group.models.find(m => m.status === 'healthy');
    return healthy || null;
  }

  getAllModels(modelType?: ModelType): AIModel[] {
    if (modelType) {
      const group = this.modelGroups.get(modelType);
      return group?.models || [];
    }

    const all: AIModel[] = [];
    for (const group of this.modelGroups.values()) {
      all.push(...group.models);
    }
    return all;
  }

  reportSuccess(modelId: string, latencyMs: number): void {
    for (const group of this.modelGroups.values()) {
      const model = group.models.find(m => m.id === modelId);
      if (model) {
        model.successfulRequests++;
        model.totalRequests++;
        model.successRate = model.successfulRequests / model.totalRequests;
        model.latencyMs = model.latencyMs * 0.9 + latencyMs * 0.1;
        model.consecutiveFailures = 0;
        return;
      }
    }
  }

  reportFailure(modelId: string): void {
    for (const group of this.modelGroups.values()) {
      const model = group.models.find(m => m.id === modelId);
      if (model) {
        model.totalRequests++;
        model.successRate = model.successfulRequests / model.totalRequests;
        model.consecutiveFailures++;

        if (model.consecutiveFailures >= group.failoverThreshold) {
          model.status = 'unhealthy';
          this.triggerFailover(model);
        }
        return;
      }
    }
  }

  getStatusReport(): Record<string, unknown> {
    const report = {
      timestamp: new Date().toISOString(),
      modelGroups: {} as Record<string, unknown>,
      summary: {
        totalModels: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
      },
      failoverHistory: this.failoverHistory.slice(-10),
    };

    for (const [type, group] of this.modelGroups) {
      const groupStatus = {
        currentPrimary: group.currentPrimary,
        models: group.models.map(m => ({
          id: m.id,
          name: m.name,
          provider: m.provider,
          priority: m.priority,
          status: m.status,
          latencyMs: Math.round(m.latencyMs),
          successRate: Math.round(m.successRate * 1000) / 10,
          consecutiveFailures: m.consecutiveFailures,
        })),
      };

      report.modelGroups[type] = groupStatus;

      for (const model of group.models) {
        report.summary.totalModels++;
        report.summary[model.status as keyof typeof report.summary]++;
      }
    }

    return report;
  }

  getBackupModels(modelType: ModelType): AIModel[] {
    const group = this.modelGroups.get(modelType);
    if (!group) return [];

    return group.models.filter(m => m.priority > 1 && m.status === 'healthy');
  }
}

// 单例
let resilienceInstance: ModelResilienceService | null = null;

function getResilienceService(): ModelResilienceService {
  if (!resilienceInstance) {
    resilienceInstance = new ModelResilienceService();
    resilienceInstance.startHealthMonitor();

    resilienceInstance.on('failover', (event: FailoverEvent) => {
      console.log(`[ModelResilience] Failover event: ${JSON.stringify(event)}`);
    });
  }
  return resilienceInstance;
}

// 路由
const router = Router();

router.get('/status', (req: Request, res: Response) => {
  const service = getResilienceService();
  res.json({ success: true, data: service.getStatusReport() });
});

router.get('/models/:type', (req: Request, res: Response) => {
  const modelType = req.params.type as ModelType;
  const service = getResilienceService();
  res.json({ success: true, data: service.getAllModels(modelType) });
});

router.get('/backups/:type', (req: Request, res: Response) => {
  const modelType = req.params.type as ModelType;
  const service = getResilienceService();
  res.json({ success: true, data: service.getBackupModels(modelType) });
});

router.post('/report/success', (req: Request, res: Response) => {
  const { modelId, latencyMs } = req.body;
  const service = getResilienceService();
  service.reportSuccess(modelId, latencyMs);
  res.json({ success: true });
});

router.post('/report/failure', (req: Request, res: Response) => {
  const { modelId } = req.body;
  const service = getResilienceService();
  service.reportFailure(modelId);
  res.json({ success: true });
});

export default router;
export { ModelResilienceService, getResilienceService };
