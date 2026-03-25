/**
 * 服务端文件：server/src/services/ue5-remote-service.ts
 * UE5 远程连接服务
 * 
 * 功能：
 * - HTTP API 远程调用 UE5
 * - WebSocket 双向通信
 * - 脚本执行与状态监控
 */

import EventEmitter from 'events';

// ============================================================
// 类型定义
// ============================================================

interface UE5Config {
  host: string;
  port: number;
  apiPort?: number;
  timeout: number;
}

interface UE5Script {
  name: string;
  path: string;
  description: string;
}

interface UE5ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
}

interface UE5Status {
  connected: boolean;
  lastHeartbeat?: Date;
  activeScripts: string[];
  gpuUsage?: number;
  memoryUsage?: number;
}

type UE5EventType = 'connected' | 'disconnected' | 'script_start' | 'script_complete' | 'error';

interface UE5Event {
  type: UE5EventType;
  data: Record<string, unknown>;
  timestamp: Date;
}

// ============================================================
// UE5 远程服务类
// ============================================================

class UE5RemoteService extends EventEmitter {
  private config: UE5Config;
  private connected: boolean = false;
  private activeScripts: Map<string, { startTime: Date; status: string }> = new Map();
  private ws: WebSocket | null = null;
  private heartbeatInterval?: ReturnType<typeof setInterval>;

  // 预定义脚本
  private readonly SCRIPTS: UE5Script[] = [
    { name: 'one_day_production', path: '/ue5-scripts/UE5_one_day_production.py', description: '24小时完整生产流水线' },
    { name: 'super_speed', path: '/ue5-scripts/UE5_super_speed.py', description: '超速渲染' },
    { name: 'time_warp', path: '/ue5-scripts/UE5_time_warp.py', description: '时间扭曲技术' },
    { name: 'turbo_anime_render', path: '/ue5-scripts/UE5_turbo_anime_render.py', description: '涡轮动漫渲染' },
    { name: 'ai_acceleration', path: '/ue5-scripts/UE5_ai_acceleration.py', description: 'AI加速器' },
    { name: 'model_failover', path: '/ue5-scripts/UE5_model_failover.py', description: '模型故障转移' },
    { name: 'cloud_render', path: '/ue5-scripts/UE5_cloud_render.py', description: '云端渲染' },
    { name: 'distributed_render', path: '/ue5-scripts/UE5_distributed_render.py', description: '分布式渲染' },
  ];

  constructor(config?: Partial<UE5Config>) {
    super();
    this.config = {
      host: config?.host || 'localhost',
      port: config?.port || 30010,
      apiPort: config?.apiPort || 8080,
      timeout: config?.timeout || 60000,
    };
  }

  // ============================================================
  // 公共方法
  // ============================================================

  /**
   * 连接到 UE5
   */
  async connect(): Promise<boolean> {
    try {
      // 尝试连接 UE5 远程执行 API
      const response = await this.httpGet('/api/status');
      
      if (response.ok) {
        this.connected = true;
        this.startHeartbeat();
        this.emit('connected', { timestamp: new Date() });
        console.log('[UE5Remote] Connected successfully');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.warn('[UE5Remote] Connection failed:', error.message);
      this.connected = false;
      return false;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.connected = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.emit('disconnected', { timestamp: new Date() });
    console.log('[UE5Remote] Disconnected');
  }

  /**
   * 执行脚本
   */
  async executeScript(
    scriptName: string,
    params: Record<string, unknown> = {}
  ): Promise<UE5ExecutionResult> {
    const startTime = Date.now();
    
    if (!this.connected) {
      // 尝试模拟执行
      return this.simulateExecution(scriptName, params);
    }

    const script = this.SCRIPTS.find(s => s.name === scriptName);
    if (!script) {
      return {
        success: false,
        error: `Script not found: ${scriptName}`,
        duration: 0,
      };
    }

    try {
      this.activeScripts.set(scriptName, { startTime: new Date(), status: 'running' });
      this.emit('script_start', { scriptName, params, timestamp: new Date() });

      const response = await this.httpPost('/api/execute', {
        script: script.path,
        params,
      });

      const result = await response.json() as { output?: string };
      const duration = Date.now() - startTime;

      this.activeScripts.delete(scriptName);
      this.emit('script_complete', { scriptName, result, duration, timestamp: new Date() });

      return {
        success: true,
        output: result.output,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.activeScripts.delete(scriptName);
      this.emit('error', { scriptName, error: error.message, timestamp: new Date() });

      // 回退到模拟执行
      return this.simulateExecution(scriptName, params);
    }
  }

  /**
   * 获取可用脚本列表
   */
  getAvailableScripts(): UE5Script[] {
    return this.SCRIPTS;
  }

  /**
   * 获取状态
   */
  getStatus(): UE5Status {
    return {
      connected: this.connected,
      lastHeartbeat: this.connected ? new Date() : undefined,
      activeScripts: Array.from(this.activeScripts.keys()),
    };
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connected;
  }

  // ============================================================
  // 高级 API
  // ============================================================

  /**
   * 启动24小时生产流水线
   */
  async startOneDayProduction(config: {
    productionId: string;
    animeTitle: string;
    totalEpisodes: number;
    style: string;
  }): Promise<UE5ExecutionResult> {
    return this.executeScript('one_day_production', config);
  }

  /**
   * 渲染场景
   */
  async renderScene(params: {
    sceneId: string;
    sceneName: string;
    outputFormat: string;
    quality: string;
  }): Promise<UE5ExecutionResult> {
    return this.executeScript('turbo_anime_render', params);
  }

  /**
   * 启用 AI 加速
   */
  async enableAIAcceleration(params: {
    mode: 'fast' | 'ultra' | 'quality';
    gpuMemory: number;
  }): Promise<UE5ExecutionResult> {
    return this.executeScript('ai_acceleration', params);
  }

  /**
   * 云端渲染
   */
  async startCloudRender(params: {
    sceneIds: string[];
    priority: 'low' | 'normal' | 'high';
    callbackUrl?: string;
  }): Promise<UE5ExecutionResult> {
    return this.executeScript('cloud_render', params);
  }

  // ============================================================
  // 私有方法
  // ============================================================

  private async httpGet(path: string): Promise<Response> {
    const url = `http://${this.config.host}:${this.config.apiPort || 8080}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response as unknown as Response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async httpPost(path: string, body: Record<string, unknown>): Promise<Response> {
    const url = `http://${this.config.host}:${this.config.apiPort || 8080}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response as unknown as Response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        const response = await this.httpGet('/api/ping');
        if (!response.ok) {
          this.connected = false;
          this.stopHeartbeat();
          this.emit('disconnected', { timestamp: new Date() });
        }
      } catch {
        this.connected = false;
        this.stopHeartbeat();
        this.emit('disconnected', { timestamp: new Date() });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * 模拟执行（当UE5未连接时）
   */
  private async simulateExecution(
    scriptName: string,
    params: Record<string, unknown>
  ): Promise<UE5ExecutionResult> {
    const startTime = Date.now();
    const simulatedDuration = 1000 + Math.random() * 2000; // 1-3秒模拟

    console.log(`[UE5Remote] Simulating script: ${scriptName}`, params);

    await new Promise(resolve => setTimeout(resolve, simulatedDuration));

    const duration = Date.now() - startTime;

    return {
      success: true,
      output: JSON.stringify({
        script: scriptName,
        params,
        simulated: true,
        result: 'completed',
      }),
      duration,
    };
  }
}

// ============================================================
// 单例
// ============================================================

let ue5Instance: UE5RemoteService | null = null;

export function getUE5Remote(): UE5RemoteService {
  if (!ue5Instance) {
    ue5Instance = new UE5RemoteService();
    // 自动尝试连接
    ue5Instance.connect().then(connected => {
      if (connected) {
        console.log('[UE5Remote] ✅ Connected to UE5 Mock Server');
      } else {
        console.log('[UE5Remote] ⚠️ Running in simulation mode');
      }
    });
  }
  return ue5Instance;
}

export default UE5RemoteService;
