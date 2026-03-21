import cron from 'node-cron';
import db from './db.js';

// 任务调度器状态
let schedulerRunning = false;
const scheduledTasks: Map<string, ReturnType<typeof cron.schedule>> = new Map();

// 推广任务执行函数
async function executePromoTask(taskId: string) {
  console.log(`[Promo Scheduler] Executing task: ${taskId}`);
  
  try {
    // 获取任务详情
    const { data: task, error: taskError } = await db
      .from('promo_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('status', 'active')
      .single();

    if (taskError || !task) {
      console.log(`[Promo Scheduler] Task not found or inactive: ${taskId}`);
      return;
    }

    // 检查是否在执行时间内
    const now = new Date();
    const nextRun = task.next_run_at ? new Date(task.next_run_at) : null;
    
    if (nextRun && now < nextRun) {
      console.log(`[Promo Scheduler] Task scheduled for later: ${nextRun}`);
      return;
    }

    // 获取推广链接
    const linkIds = task.link_ids || [];
    const { data: links } = linkIds.length > 0 
      ? await db.from('promo_links').select('*').in('id', linkIds)
      : { data: [] };

    // 创建执行记录
    const { data: execution, error: execError } = await db
      .from('promo_executions')
      .insert({
        task_id: taskId,
        platform: 'multi',
        action: task.type,
        status: 'running',
        started_at: now.toISOString(),
      })
      .select()
      .single();

    if (execError) {
      console.error('[Promo Scheduler] Failed to create execution record:', execError);
      return;
    }

    // 执行推广
    const platforms = task.platforms || [];
    const riskControl = task.risk_control || {};
    let successCount = 0;
    let failCount = 0;
    const logs: any[] = [];

    for (const platform of platforms) {
      // 风控：随机延迟
      const minDelay = riskControl.min_delay || 5000;
      const maxDelay = riskControl.max_delay || 30000;
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        const result = await executePlatformPromotion(platform, links || [], task.content_template);
        
        if (result.success) {
          successCount++;
          logs.push({ platform, status: 'success', message: result.message, timestamp: new Date().toISOString() });
        } else {
          failCount++;
          logs.push({ platform, status: 'failed', message: result.message, timestamp: new Date().toISOString() });
        }
      } catch (err: any) {
        failCount++;
        logs.push({ platform, status: 'error', message: err.message, timestamp: new Date().toISOString() });
      }

      // 频率限制
      if (riskControl.max_per_hour && successCount + failCount >= riskControl.max_per_hour) {
        logs.push({ status: 'info', message: '达到频率限制', timestamp: new Date().toISOString() });
        break;
      }
    }

    // 更新执行记录
    await db.from('promo_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        success_count: successCount,
        fail_count: failCount,
        logs,
      })
      .eq('id', execution.id);

    // 更新任务统计
    await db.from('promo_tasks')
      .update({
        run_count: (task.run_count || 0) + 1,
        success_count: (task.success_count || 0) + successCount,
        fail_count: (task.fail_count || 0) + failCount,
        last_run_at: now.toISOString(),
        next_run_at: calculateNextRun(task.schedule_type),
      })
      .eq('id', taskId);

    console.log(`[Promo Scheduler] Task completed: ${taskId}, success: ${successCount}, fail: ${failCount}`);

  } catch (error) {
    console.error('[Promo Scheduler] Task execution error:', error);
  }
}

// 平台推广执行
async function executePlatformPromotion(platform: string, links: any[], contentTemplate: string) {
  const link = links.length > 0 ? links[Math.floor(Math.random() * links.length)] : null;
  const promoUrl = link?.promo_url || 'https://guotao.netlify.app';
  
  // 实际推广逻辑 - 目前为模拟
  // TODO: 接入真实平台 API
  const platformConfigs: Record<string, { name: string; apiEndpoint?: string }> = {
    weibo: { name: '微博' },
    wechat: { name: '微信' },
    douyin: { name: '抖音' },
    xiaohongshu: { name: '小红书' },
    zhihu: { name: '知乎' },
    bilibili: { name: 'B站' },
  };

  const config = platformConfigs[platform];
  if (!config) {
    return { success: false, message: `未知平台: ${platform}` };
  }

  // 模拟推广成功
  return { 
    success: true, 
    message: `${config.name}推广成功，链接: ${promoUrl}` 
  };
}

// 计算下次执行时间
function calculateNextRun(scheduleType: string): string {
  const now = new Date();
  
  switch (scheduleType) {
    case 'hourly':
      now.setHours(now.getHours() + 1);
      break;
    case 'daily':
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0); // 每天早上9点
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      now.setHours(9, 0, 0, 0);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      now.setDate(1);
      now.setHours(9, 0, 0, 0);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  
  return now.toISOString();
}

// 加载并调度所有活跃任务
async function loadScheduledTasks() {
  try {
    const { data: tasks, error } = await db
      .from('promo_tasks')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    for (const task of tasks || []) {
      scheduleTask(task);
    }

    console.log(`[Promo Scheduler] Loaded ${tasks?.length || 0} tasks`);
  } catch (error) {
    console.error('[Promo Scheduler] Failed to load tasks:', error);
  }
}

// 调度单个任务
function scheduleTask(task: any) {
  // 如果已存在，先取消
  if (scheduledTasks.has(task.id)) {
    scheduledTasks.get(task.id)?.stop();
  }

  // 根据调度类型设置 cron 表达式
  let cronExpression: string;
  
  switch (task.schedule_type) {
    case 'hourly':
      cronExpression = '0 * * * *'; // 每小时
      break;
    case 'daily':
      cronExpression = '0 9 * * *'; // 每天9点
      break;
    case 'weekly':
      cronExpression = '0 9 * * 1'; // 每周一9点
      break;
    case 'monthly':
      cronExpression = '0 9 1 * *'; // 每月1号9点
      break;
    default:
      cronExpression = '0 9 * * *'; // 默认每天
  }

  const scheduledTask = cron.schedule(cronExpression, () => {
    executePromoTask(task.id);
  }, {
    timezone: 'Asia/Shanghai',
  });

  scheduledTasks.set(task.id, scheduledTask);
  console.log(`[Promo Scheduler] Scheduled task: ${task.name} (${task.schedule_type})`);
}

// 启动调度器
export function startScheduler() {
  if (schedulerRunning) {
    console.log('[Promo Scheduler] Already running');
    return;
  }

  // 加载任务
  loadScheduledTasks();

  // 每小时检查新任务
  cron.schedule('0 * * * *', () => {
    console.log('[Promo Scheduler] Reloading tasks...');
    loadScheduledTasks();
  });

  schedulerRunning = true;
  console.log('[Promo Scheduler] Started');
}

// 停止调度器
export function stopScheduler() {
  for (const task of scheduledTasks.values()) {
    task.stop();
  }
  scheduledTasks.clear();
  schedulerRunning = false;
  console.log('[Promo Scheduler] Stopped');
}

// 手动触发任务
export { executePromoTask };
