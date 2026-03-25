/**
 * 服务端文件：server/src/services/production-queue-service.ts
 * 生产任务队列服务
 * 
 * 功能：
 * - 内存任务队列（替代 Promise.all）
 * - 并发控制
 * - 失败重试机制
 * - 任务状态追踪
 */

import EventEmitter from 'events';

// ============================================================
// 类型定义
// ============================================================

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

interface Task<T = unknown> {
  id: string;
  name: string;
  type: string;
  priority: number;
  status: TaskStatus;
  retries: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: T;
  execute: () => Promise<T>;
}

interface QueueConfig {
  maxConcurrency: number;
  defaultTimeout: number;
  defaultMaxRetries: number;
  defaultRetryDelay: number;
}

interface QueueStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  retrying: number;
}

interface TaskEvent {
  taskId: string;
  taskName: string;
  status: TaskStatus;
  result?: unknown;
  error?: string;
  timestamp: Date;
}

// ============================================================
// 任务队列类
// ============================================================

class ProductionQueueService extends EventEmitter {
  private queues: Map<string, Task[]> = new Map();
  private running: Map<string, Set<string>> = new Map();
  private config: QueueConfig;
  private isProcessing: Map<string, boolean> = new Map();

  constructor(config?: Partial<QueueConfig>) {
    super();
    this.config = {
      maxConcurrency: config?.maxConcurrency || 8,
      defaultTimeout: config?.defaultTimeout || 300000, // 5分钟
      defaultMaxRetries: config?.defaultMaxRetries || 3,
      defaultRetryDelay: config?.defaultRetryDelay || 5000, // 5秒
    };
  }

  // ============================================================
  // 公共方法
  // ============================================================

  /**
   * 创建或获取队列
   */
  getOrCreateQueue(queueId: string): void {
    if (!this.queues.has(queueId)) {
      this.queues.set(queueId, []);
      this.running.set(queueId, new Set());
      this.isProcessing.set(queueId, false);
    }
  }

  /**
   * 添加任务
   */
  addTask<T>(
    queueId: string,
    task: {
      id: string;
      name: string;
      type: string;
      priority?: number;
      timeout?: number;
      maxRetries?: number;
      execute: () => Promise<T>;
    }
  ): string {
    this.getOrCreateQueue(queueId);

    const fullTask: Task<T> = {
      id: task.id,
      name: task.name,
      type: task.type,
      priority: task.priority || 0,
      status: 'pending',
      retries: 0,
      maxRetries: task.maxRetries ?? this.config.defaultMaxRetries,
      retryDelay: this.config.defaultRetryDelay,
      timeout: task.timeout ?? this.config.defaultTimeout,
      createdAt: new Date(),
      execute: task.execute,
    };

    const queue = this.queues.get(queueId)!;
    queue.push(fullTask);

    // 按优先级排序
    queue.sort((a, b) => b.priority - a.priority);

    this.emitTaskEvent(queueId, fullTask, 'pending');
    this.processQueue(queueId);

    return task.id;
  }

  /**
   * 批量添加任务
   */
  addTasks<T>(
    queueId: string,
    tasks: Array<{
      id: string;
      name: string;
      type: string;
      priority?: number;
      execute: () => Promise<T>;
    }>
  ): string[] {
    return tasks.map(task => this.addTask(queueId, task));
  }

  /**
   * 等待队列完成
   */
  async waitForCompletion(queueId: string, timeout?: number): Promise<QueueStats> {
    const startTime = Date.now();
    const maxWait = timeout || 3600000; // 默认1小时

    return new Promise((resolve) => {
      const check = () => {
        const stats = this.getStats(queueId);
        
        if (stats.running === 0 && stats.pending === 0) {
          resolve(stats);
          return;
        }

        if (Date.now() - startTime > maxWait) {
          resolve(stats);
          return;
        }

        setTimeout(check, 1000);
      };

      check();
    });
  }

  /**
   * 获取队列统计
   */
  getStats(queueId: string): QueueStats {
    const queue = this.queues.get(queueId) || [];
    
    return {
      total: queue.length,
      pending: queue.filter(t => t.status === 'pending').length,
      running: queue.filter(t => t.status === 'running').length,
      completed: queue.filter(t => t.status === 'completed').length,
      failed: queue.filter(t => t.status === 'failed').length,
      retrying: queue.filter(t => t.status === 'retrying').length,
    };
  }

  /**
   * 获取任务状态
   */
  getTask(queueId: string, taskId: string): Task | undefined {
    const queue = this.queues.get(queueId) || [];
    return queue.find(t => t.id === taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(queueId: string): Task[] {
    return this.queues.get(queueId) || [];
  }

  /**
   * 取消任务
   */
  cancelTask(queueId: string, taskId: string): boolean {
    const queue = this.queues.get(queueId) || [];
    const task = queue.find(t => t.id === taskId);
    
    if (task && task.status === 'pending') {
      task.status = 'failed';
      task.error = 'Cancelled';
      this.emitTaskEvent(queueId, task, 'failed');
      return true;
    }
    
    return false;
  }

  /**
   * 清空队列
   */
  clearQueue(queueId: string): void {
    this.queues.set(queueId, []);
    this.running.set(queueId, new Set());
    this.isProcessing.set(queueId, false);
  }

  // ============================================================
  // 私有方法
  // ============================================================

  private async processQueue(queueId: string): Promise<void> {
    if (this.isProcessing.get(queueId)) {
      return;
    }

    this.isProcessing.set(queueId, true);

    try {
      while (true) {
        const queue = this.queues.get(queueId) || [];
        const runningSet = this.running.get(queueId) || new Set();

        // 找到下一个可执行的任务
        const nextTask = queue.find(
          t => t.status === 'pending' && !runningSet.has(t.id)
        );

        if (!nextTask || runningSet.size >= this.config.maxConcurrency) {
          break;
        }

        // 标记为运行中
        runningSet.add(nextTask.id);
        this.executeTask(queueId, nextTask);
      }
    } finally {
      this.isProcessing.set(queueId, false);
    }
  }

  private async executeTask<T>(queueId: string, task: Task<T>): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date();
    this.emitTaskEvent(queueId, task, 'running');

    try {
      // 执行任务（带超时）
      const result = await this.executeWithTimeout(task);
      
      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date();
      this.emitTaskEvent(queueId, task, 'completed', result);
    } catch (error: any) {
      await this.handleTaskError(queueId, task, error);
    } finally {
      const runningSet = this.running.get(queueId);
      if (runningSet) {
        runningSet.delete(task.id);
      }
      this.processQueue(queueId);
    }
  }

  private async executeWithTimeout<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Task timeout after ${task.timeout}ms`));
      }, task.timeout);

      task.execute()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async handleTaskError<T>(queueId: string, task: Task<T>, error: Error): Promise<void> {
    task.error = error.message;

    if (task.retries < task.maxRetries) {
      // 重试
      task.retries++;
      task.status = 'retrying';
      this.emitTaskEvent(queueId, task, 'retrying');

      console.log(`[Queue] Retrying task ${task.name} (${task.retries}/${task.maxRetries})`);

      // 等待重试延迟
      await this.sleep(task.retryDelay * task.retries); // 指数退避

      // 重新执行
      try {
        const result = await this.executeWithTimeout(task);
        task.status = 'completed';
        task.result = result;
        task.completedAt = new Date();
        this.emitTaskEvent(queueId, task, 'completed', result);
      } catch (retryError: any) {
        task.error = retryError.message;
        await this.handleTaskError(queueId, task, retryError);
      }
    } else {
      // 最终失败
      task.status = 'failed';
      task.completedAt = new Date();
      this.emitTaskEvent(queueId, task, 'failed', undefined, error.message);
      
      console.error(`[Queue] Task ${task.name} failed after ${task.retries} retries:`, error.message);
    }
  }

  private emitTaskEvent(
    queueId: string,
    task: Task,
    status: TaskStatus,
    result?: unknown,
    error?: string
  ): void {
    const event: TaskEvent = {
      taskId: task.id,
      taskName: task.name,
      status,
      result,
      error,
      timestamp: new Date(),
    };

    this.emit(`task:${queueId}`, event);
    this.emit(`task:${queueId}:${task.id}`, event);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
// 单例
// ============================================================

let queueInstance: ProductionQueueService | null = null;

export function getProductionQueue(): ProductionQueueService {
  if (!queueInstance) {
    queueInstance = new ProductionQueueService({
      maxConcurrency: 8,
      defaultMaxRetries: 3,
      defaultRetryDelay: 5000,
      defaultTimeout: 300000,
    });
  }
  return queueInstance;
}

export default ProductionQueueService;
