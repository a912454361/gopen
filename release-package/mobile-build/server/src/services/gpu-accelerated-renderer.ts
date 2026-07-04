/**
 * GPU加速视频渲染服务
 * 支持本地GPU渲染和云端GPU调度
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const exec = promisify(execCallback);
const client = getSupabaseClient();

// GPU配置
export const GPU_CONFIG = {
  // 本地GPU配置
  local: {
    enabled: process.env.GPU_ENABLED === 'true',
    device: process.env.GPU_DEVICE || 'cuda:0',
    memory: parseInt(process.env.GPU_MEMORY || '8192'), // MB
    maxConcurrent: parseInt(process.env.GPU_MAX_CONCURRENT || '2'),
  },
  // 云端GPU配置
  cloud: {
    enabled: process.env.CLOUD_GPU_ENABLED === 'true',
    providers: ['auto', 'aws', 'gcp', 'azure'],
    maxInstances: parseInt(process.env.CLOUD_GPU_MAX_INSTANCES || '5'),
  },
};

// GPU状态
interface GPUStatus {
  available: boolean;
  device: string;
  memoryUsed: number;
  memoryTotal: number;
  utilization: number;
  temperature?: number;
}

// 渲染任务
interface RenderTask {
  id: string;
  type: 'particle' | 'scene' | 'character' | 'effect';
  input: {
    prompt: string;
    style: string;
    params: Record<string, any>;
  };
  output?: {
    videoUrl: string;
    duration: number;
    resolution: string;
  };
  status: 'pending' | 'rendering' | 'completed' | 'failed';
  progress: number;
  gpuDevice?: string;
  startTime?: number;
  endTime?: number;
}

// GPU渲染器
export class GPURenderer {
  private availableDevices: string[] = [];
  private activeRenders: Map<string, RenderTask> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * 初始化GPU环境
   */
  async initialize(): Promise<void> {
    try {
      // 检测本地GPU
      if (GPU_CONFIG.local.enabled) {
        await this.detectLocalGPU();
      }

      this.isInitialized = true;
      console.log(`[GPU] Initialized with ${this.availableDevices.length} devices`);
    } catch (error) {
      console.warn('[GPU] Initialization failed:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 检测本地GPU设备
   */
  private async detectLocalGPU(): Promise<void> {
    try {
      // 尝试运行nvidia-smi检测GPU
      const { stdout } = await exec('nvidia-smi --query-gpu=index,name,memory.total --format=csv,noheader', {
        timeout: 5000,
      });

      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const [index, name, memory] = line.split(',').map((s) => s.trim());
        this.availableDevices.push(`cuda:${index}`);
        console.log(`[GPU] Detected: ${name} (${memory})`);
      }
    } catch (error) {
      // 没有本地GPU
      console.log('[GPU] No local GPU detected');
      this.availableDevices = [];
    }
  }

  /**
   * 获取GPU状态
   */
  async getGPUStatus(device?: string): Promise<GPUStatus | null> {
    if (!this.isInitialized || this.availableDevices.length === 0) {
      return null;
    }

    const targetDevice = device || this.availableDevices[0];

    try {
      const { stdout } = await exec(
        `nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits -i ${targetDevice.replace('cuda:', '')}`,
        { timeout: 5000 }
      );

      const [memoryUsed, memoryTotal, utilization, temperature] = stdout
        .trim()
        .split(',')
        .map((s) => parseFloat(s.trim()));

      return {
        available: true,
        device: targetDevice,
        memoryUsed,
        memoryTotal,
        utilization,
        temperature,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 选择最佳GPU设备
   */
  async selectBestDevice(): Promise<string | null> {
    if (this.availableDevices.length === 0) {
      return null;
    }

    if (this.availableDevices.length === 1) {
      return this.availableDevices[0];
    }

    // 选择利用率最低的GPU
    let bestDevice = this.availableDevices[0];
    let lowestUtilization = 100;

    for (const device of this.availableDevices) {
      const status = await this.getGPUStatus(device);
      if (status && status.utilization < lowestUtilization) {
        lowestUtilization = status.utilization;
        bestDevice = device;
      }
    }

    return bestDevice;
  }

  /**
   * GPU渲染粒子特效
   */
  async renderParticleEffect(params: {
    type: 'flame' | 'lightning' | 'ice' | 'spirit' | 'dark' | 'golden';
    intensity: number;
    duration: number;
    resolution: string;
    outputFormat: string;
  }): Promise<{ videoUrl: string; renderTime: number }> {
    const { type, intensity, duration, resolution, outputFormat } = params;
    const startTime = Date.now();

    // 检查GPU可用性
    const device = await this.selectBestDevice();
    if (!device) {
      throw new Error('No GPU available for rendering');
    }

    console.log(`[GPU] Rendering ${type} particle effect on ${device}`);

    // 模拟GPU渲染（实际项目中会调用真实的渲染引擎）
    // 如: Blender、Unreal Engine、Unity、After Effects等
    const renderTime = await this.simulateGPURender(type, duration, device);

    // 生成视频URL（实际项目中会上传到对象存储）
    const videoUrl = `https://storage.example.com/gpu-render/${type}_${Date.now()}.${outputFormat}`;

    return { videoUrl, renderTime };
  }

  /**
   * 模拟GPU渲染过程
   */
  private async simulateGPURender(
    type: string,
    duration: number,
    device: string
  ): Promise<number> {
    // 模拟渲染时间：实际GPU渲染会快很多
    const baseTime = duration * 1000; // 1秒渲染时间/视频秒
    const gpuAcceleration = 10; // GPU加速倍数
    const renderTime = Math.floor(baseTime / gpuAcceleration);

    await new Promise((resolve) => setTimeout(resolve, Math.min(renderTime, 1000)));

    return Date.now() - (Date.now() - renderTime);
  }

  /**
   * 检查是否支持GPU加速
   */
  isAvailable(): boolean {
    return this.isInitialized && this.availableDevices.length > 0;
  }

  /**
   * 获取可用设备数
   */
  getDeviceCount(): number {
    return this.availableDevices.length;
  }
}

// 云端GPU调度器
export class CloudGPUScheduler {
  private activeInstances: number = 0;
  private taskQueue: RenderTask[] = [];

  /**
   * 请求云端GPU实例
   */
  async requestInstance(params: {
    type: 'render' | 'inference' | 'training';
    gpuType?: 'T4' | 'V100' | 'A100' | 'H100';
    duration?: number; // 预估使用时长（分钟）
  }): Promise<{ instanceId: string; endpoint: string }> {
    const { type, gpuType = 'T4', duration = 60 } = params;

    if (this.activeInstances >= GPU_CONFIG.cloud.maxInstances) {
      throw new Error('Maximum cloud GPU instances reached');
    }

    // 模拟创建云端实例
    const instanceId = `gpu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const endpoint = `https://${instanceId}.gpu.cloud/api/v1/render`;

    this.activeInstances++;

    console.log(`[CloudGPU] Created instance ${instanceId} (${gpuType})`);

    return { instanceId, endpoint };
  }

  /**
   * 释放云端GPU实例
   */
  async releaseInstance(instanceId: string): Promise<void> {
    this.activeInstances--;
    console.log(`[CloudGPU] Released instance ${instanceId}`);
  }

  /**
   * 提交渲染任务到云端
   */
  async submitRenderTask(task: RenderTask): Promise<{ taskId: string; estimatedTime: number }> {
    // 如果没有可用实例，创建新实例
    if (this.activeInstances < GPU_CONFIG.cloud.maxInstances) {
      await this.requestInstance({ type: 'render' });
    }

    const taskId = task.id || `task-${Date.now()}`;
    const estimatedTime = this.estimateRenderTime(task);

    this.taskQueue.push({ ...task, id: taskId, status: 'pending' });

    return { taskId, estimatedTime };
  }

  /**
   * 估算渲染时间
   */
  private estimateRenderTime(task: RenderTask): number {
    const baseTime = {
      particle: 30,
      scene: 60,
      character: 90,
      effect: 45,
    };

    return baseTime[task.type] || 60;
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): { pending: number; active: number; maxInstances: number } {
    return {
      pending: this.taskQueue.filter((t) => t.status === 'pending').length,
      active: this.activeInstances,
      maxInstances: GPU_CONFIG.cloud.maxInstances,
    };
  }
}

// 导出实例
export const gpuRenderer = new GPURenderer();
export const cloudGPUScheduler = new CloudGPUScheduler();

/**
 * 智能GPU加速渲染
 * 自动选择本地GPU或云端GPU
 */
export async function acceleratedRender(params: {
  type: 'particle' | 'scene' | 'character' | 'effect';
  prompt: string;
  style: string;
  duration: number;
  resolution: string;
  preferLocal?: boolean;
}): Promise<{
  videoUrl: string;
  renderTime: number;
  renderType: 'local_gpu' | 'cloud_gpu' | 'cpu_fallback';
}> {
  const { type, prompt, style, duration, resolution, preferLocal = true } = params;
  const startTime = Date.now();

  // 优先使用本地GPU
  if (preferLocal && gpuRenderer.isAvailable()) {
    try {
      const result = await gpuRenderer.renderParticleEffect({
        type: type as any,
        intensity: 0.8,
        duration,
        resolution,
        outputFormat: 'mp4',
      });

      return {
        videoUrl: result.videoUrl,
        renderTime: Date.now() - startTime,
        renderType: 'local_gpu',
      };
    } catch (error) {
      console.warn('[GPU] Local render failed:', error);
    }
  }

  // 尝试云端GPU
  if (GPU_CONFIG.cloud.enabled) {
    try {
      const { taskId, estimatedTime } = await cloudGPUScheduler.submitRenderTask({
        id: `render-${Date.now()}`,
        type,
        input: { prompt, style, params: { duration, resolution } },
        status: 'pending',
        progress: 0,
      });

      // 等待云端渲染完成
      // 实际项目中会通过回调或轮询获取结果

      return {
        videoUrl: `https://storage.example.com/cloud-render/${taskId}.mp4`,
        renderTime: estimatedTime * 1000,
        renderType: 'cloud_gpu',
      };
    } catch (error) {
      console.warn('[GPU] Cloud render failed:', error);
    }
  }

  // CPU回退（使用API服务）
  return {
    videoUrl: '',
    renderTime: 0,
    renderType: 'cpu_fallback',
  };
}
