/**
 * 分布式视频生成任务分发系统
 * 支持多服务器并行处理、任务队列、负载均衡
 */

import { getSupabaseClient } from '../storage/database/supabase-client.js';

const client = getSupabaseClient();

// 分布式配置
export const DISTRIBUTED_CONFIG = {
  // 集群配置
  cluster: {
    name: process.env.CLUSTER_NAME || 'default',
    nodeRole: process.env.NODE_ROLE || 'worker', // 'master' | 'worker'
    masterUrl: process.env.MASTER_URL || '',
    heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '10000'),
  },
  // 任务队列配置
  queue: {
    maxSize: parseInt(process.env.QUEUE_MAX_SIZE || '1000'),
    batchSize: parseInt(process.env.QUEUE_BATCH_SIZE || '10'),
    processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT || '300000'), // 5分钟
  },
  // 负载均衡配置
  loadBalancer: {
    strategy: (process.env.LB_STRATEGY || 'round_robin') as 'round_robin' | 'least_connections' | 'weighted',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
  },
};

// 节点状态
interface NodeStatus {
  id: string;
  role: 'master' | 'worker';
  status: 'online' | 'offline' | 'busy';
  ipAddress: string;
  port: number;
  capabilities: {
    gpu: boolean;
    maxConcurrent: number;
    currentLoad: number;
    avgProcessingTime: number;
    totalCompleted: number;
    totalFailed: number;
  };
  lastHeartbeat: number;
  registeredAt: number;
}

// 分布式任务
interface DistributedTask {
  id: string;
  type: 'video_generation' | 'scene_render' | 'batch_process';
  priority: 'high' | 'normal' | 'low';
  payload: {
    prompt?: string;
    style?: string;
    duration?: number;
    resolution?: string;
    projectId?: string;
    sceneIds?: number[];
    userId?: string;
    [key: string]: any;
  };
  status: 'queued' | 'assigned' | 'processing' | 'completed' | 'failed';
  assignedNode?: string;
  progress: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: {
    videoUrls: string[];
    errors?: string[];
  };
  retryCount: number;
  maxRetries: number;
}

// 任务队列
interface TaskQueue {
  high: DistributedTask[];
  normal: DistributedTask[];
  low: DistributedTask[];
}

// 分布式任务分发器
export class DistributedTaskDispatcher {
  private nodeId: string;
  private nodeRole: 'master' | 'worker';
  private nodes: Map<string, NodeStatus> = new Map();
  private taskQueue: TaskQueue = { high: [], normal: [], low: [] };
  private activeTasks: Map<string, DistributedTask> = new Map();
  private roundRobinIndex: number = 0;
  private isRunning: boolean = false;

  constructor() {
    this.nodeId = this.generateNodeId();
    this.nodeRole = DISTRIBUTED_CONFIG.cluster.nodeRole as 'master' | 'worker';
  }

  /**
   * 生成节点ID
   */
  private generateNodeId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动分布式服务
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`[Distributed] Starting ${this.nodeRole} node: ${this.nodeId}`);

    // 注册节点
    await this.registerNode();

    // 启动心跳
    this.startHeartbeat();

    // 启动任务处理器
    if (this.nodeRole === 'worker') {
      this.startTaskProcessor();
    }

    // 启动负载均衡器（仅master节点）
    if (this.nodeRole === 'master') {
      this.startLoadBalancer();
    }
  }

  /**
   * 停止分布式服务
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`[Distributed] Stopping node: ${this.nodeId}`);
  }

  /**
   * 注册节点
   */
  private async registerNode(): Promise<void> {
    const nodeStatus: NodeStatus = {
      id: this.nodeId,
      role: this.nodeRole,
      status: 'online',
      ipAddress: process.env.NODE_IP || '127.0.0.1',
      port: parseInt(process.env.NODE_PORT || '9091'),
      capabilities: {
        gpu: process.env.GPU_ENABLED === 'true',
        maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '5'),
        currentLoad: 0,
        avgProcessingTime: 60000,
        totalCompleted: 0,
        totalFailed: 0,
      },
      lastHeartbeat: Date.now(),
      registeredAt: Date.now(),
    };

    // 保存到数据库
    await client
      .from('distributed_nodes')
      .upsert([{
        node_id: this.nodeId,
        role: this.nodeRole,
        status: 'online',
        ip_address: nodeStatus.ipAddress,
        port: nodeStatus.port,
        capabilities: nodeStatus.capabilities,
        last_heartbeat: new Date().toISOString(),
      }])
      .then(({ error }) => {
        if (error) console.error('[Distributed] Failed to register node:', error);
      });

    console.log(`[Distributed] Node registered: ${this.nodeId}`);
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      // 更新心跳
      await client
        .from('distributed_nodes')
        .update({
          last_heartbeat: new Date().toISOString(),
          status: this.activeTasks.size > 0 ? 'busy' : 'online',
        })
        .eq('node_id', this.nodeId);

      // 同步节点列表
      await this.syncNodes();
    }, DISTRIBUTED_CONFIG.cluster.heartbeatInterval);
  }

  /**
   * 同步节点列表
   */
  private async syncNodes(): Promise<void> {
    const { data, error } = await client
      .from('distributed_nodes')
      .select('*')
      .eq('status', 'online');

    if (error) {
      console.error('[Distributed] Failed to sync nodes:', error);
      return;
    }

    this.nodes.clear();
    for (const node of data || []) {
      this.nodes.set(node.node_id, {
        id: node.node_id,
        role: node.role,
        status: node.status,
        ipAddress: node.ip_address,
        port: node.port,
        capabilities: node.capabilities,
        lastHeartbeat: new Date(node.last_heartbeat).getTime(),
        registeredAt: new Date(node.registered_at).getTime(),
      });
    }

    // 清理超时节点
    await this.cleanupStaleNodes();
  }

  /**
   * 清理超时节点
   */
  private async cleanupStaleNodes(): Promise<void> {
    const timeout = Date.now() - 60000; // 1分钟超时

    for (const [id, node] of this.nodes) {
      if (node.lastHeartbeat < timeout) {
        console.log(`[Distributed] Node ${id} timed out`);
        this.nodes.delete(id);

        await client
          .from('distributed_nodes')
          .update({ status: 'offline' })
          .eq('node_id', id);
      }
    }
  }

  /**
   * 提交任务
   */
  async submitTask(task: Omit<DistributedTask, 'id' | 'status' | 'progress' | 'createdAt' | 'retryCount'>): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newTask: DistributedTask = {
      ...task,
      id: taskId,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: task.maxRetries || 3,
    };

    // 加入队列
    this.taskQueue[task.priority].push(newTask);

    // 保存到数据库
    await client.from('distributed_tasks').insert([{
      task_id: taskId,
      type: task.type,
      priority: task.priority,
      payload: task.payload,
      status: 'queued',
      created_at: new Date().toISOString(),
    }]);

    console.log(`[Distributed] Task submitted: ${taskId}`);

    return taskId;
  }

  /**
   * 启动任务处理器（worker节点）
   */
  private startTaskProcessor(): void {
    setInterval(async () => {
      if (!this.isRunning || this.activeTasks.size >= DISTRIBUTED_CONFIG.queue.batchSize) return;

      // 从数据库获取待处理任务
      const { data: tasks } = await client
        .from('distributed_tasks')
        .select('*')
        .eq('status', 'assigned')
        .eq('assigned_node', this.nodeId)
        .order('priority', { ascending: false })
        .limit(DISTRIBUTED_CONFIG.queue.batchSize - this.activeTasks.size);

      for (const task of tasks || []) {
        await this.processTask(task);
      }
    }, 5000);
  }

  /**
   * 处理任务
   */
  private async processTask(taskData: any): Promise<void> {
    const task: DistributedTask = {
      id: taskData.task_id,
      type: taskData.type,
      priority: taskData.priority,
      payload: taskData.payload,
      status: 'processing',
      progress: 0,
      createdAt: new Date(taskData.created_at).getTime(),
      startedAt: Date.now(),
      retryCount: taskData.retry_count || 0,
      maxRetries: taskData.max_retries || 3,
    };

    this.activeTasks.set(task.id, task);

    // 更新状态
    await client
      .from('distributed_tasks')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('task_id', task.id);

    try {
      // 执行实际的视频生成
      const { multiModelGenerateVideo } = await import('./multi-model-video-generator.js');

      const result = await multiModelGenerateVideo({
        prompt: task.payload.prompt || '动漫场景',
        style: task.payload.style || '国风动漫',
        duration: task.payload.duration || 5,
        resolution: task.payload.resolution || '1080p',
      });

      // 更新完成状态
      await client
        .from('distributed_tasks')
        .update({
          status: 'completed',
          progress: 100,
          result: { videoUrls: [result.videoUrl] },
          completed_at: new Date().toISOString(),
        })
        .eq('task_id', task.id);

      console.log(`[Distributed] Task completed: ${task.id}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      // 检查是否需要重试
      if (task.retryCount < task.maxRetries) {
        await client
          .from('distributed_tasks')
          .update({
            status: 'queued',
            retry_count: task.retryCount + 1,
            assigned_node: null,
          })
          .eq('task_id', task.id);

        console.log(`[Distributed] Task retry ${task.retryCount + 1}/${task.maxRetries}: ${task.id}`);
      } else {
        await client
          .from('distributed_tasks')
          .update({
            status: 'failed',
            result: { errors: [errorMsg] },
            completed_at: new Date().toISOString(),
          })
          .eq('task_id', task.id);

        console.error(`[Distributed] Task failed: ${task.id} - ${errorMsg}`);
      }
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * 启动负载均衡器（master节点）
   */
  private startLoadBalancer(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      // 分配待处理任务
      const { data: tasks } = await client
        .from('distributed_tasks')
        .select('*')
        .eq('status', 'queued')
        .order('priority', { ascending: false })
        .limit(DISTRIBUTED_CONFIG.queue.batchSize);

      for (const task of tasks || []) {
        const node = this.selectNode();
        if (node) {
          await client
            .from('distributed_tasks')
            .update({ status: 'assigned', assigned_node: node.id })
            .eq('task_id', task.task_id);

          console.log(`[Distributed] Task ${task.task_id} assigned to ${node.id}`);
        }
      }
    }, DISTRIBUTED_CONFIG.loadBalancer.healthCheckInterval);
  }

  /**
   * 选择节点（负载均衡）
   */
  private selectNode(): NodeStatus | null {
    const workers = Array.from(this.nodes.values()).filter(
      (n) => n.role === 'worker' && n.status !== 'offline'
    );

    if (workers.length === 0) return null;

    switch (DISTRIBUTED_CONFIG.loadBalancer.strategy) {
      case 'round_robin':
        this.roundRobinIndex = (this.roundRobinIndex + 1) % workers.length;
        return workers[this.roundRobinIndex];

      case 'least_connections':
        return workers.reduce((best, node) =>
          node.capabilities.currentLoad < best.capabilities.currentLoad ? node : best
        );

      case 'weighted':
        // GPU节点权重更高
        return workers.reduce((best, node) => {
          const weight = node.capabilities.gpu ? 2 : 1;
          const bestWeight = best.capabilities.gpu ? 2 : 1;
          return node.capabilities.currentLoad * weight < best.capabilities.currentLoad * bestWeight
            ? node
            : best;
        });

      default:
        return workers[0];
    }
  }

  /**
   * 获取集群状态
   */
  getClusterStatus(): {
    nodes: number;
    onlineNodes: number;
    activeTasks: number;
    queuedTasks: number;
  } {
    const onlineNodes = Array.from(this.nodes.values()).filter((n) => n.status !== 'offline').length;

    return {
      nodes: this.nodes.size,
      onlineNodes,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.high.length + this.taskQueue.normal.length + this.taskQueue.low.length,
    };
  }
}

// 导出单例
export const distributedDispatcher = new DistributedTaskDispatcher();

/**
 * 快速提交分布式任务
 */
export async function submitDistributedTask(params: {
  type: 'video_generation' | 'scene_render' | 'batch_process';
  priority?: 'high' | 'normal' | 'low';
  payload: {
    prompt?: string;
    style?: string;
    duration?: number;
    resolution?: string;
    projectId?: string;
    sceneIds?: number[];
    userId?: string;
    [key: string]: any;
  };
}): Promise<string> {
  return distributedDispatcher.submitTask({
    type: params.type,
    priority: params.priority || 'normal',
    payload: params.payload,
    maxRetries: 3,
  });
}
