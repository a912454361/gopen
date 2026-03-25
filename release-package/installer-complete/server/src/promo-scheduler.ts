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
  
  // 平台配置 - 全面支持国内外主流平台
  const platformConfigs: Record<string, { 
    name: string; 
    category: string;
    icon?: string;
    color?: string;
    apiEndpoint?: string;
    requiresAuth?: boolean;
  }> = {
    // ========== 国内社交平台 ==========
    weibo: { name: '微博', category: 'social', icon: 'weibo', color: '#E6162D' },
    wechat: { name: '微信', category: 'social', icon: 'wechat', color: '#07C160' },
    wechat_moments: { name: '朋友圈', category: 'social', icon: 'comments', color: '#07C160' },
    wechat_mp: { name: '公众号', category: 'social', icon: 'newspaper', color: '#07C160' },
    
    // ========== 国内短视频/直播 ==========
    douyin: { name: '抖音', category: 'video', icon: 'tiktok', color: '#000000' },
    kuaishou: { name: '快手', category: 'video', icon: 'video', color: '#FF4906' },
    bilibili: { name: 'B站', category: 'video', icon: 'tv', color: '#FB7299' },
    shipinhao: { name: '视频号', category: 'video', icon: 'video', color: '#07C160' },
    
    // ========== 国内内容社区 ==========
    xiaohongshu: { name: '小红书', category: 'community', icon: 'book', color: '#FE2C55' },
    zhihu: { name: '知乎', category: 'community', icon: 'zhihu', color: '#0084FF' },
    tieba: { name: '贴吧', category: 'community', icon: 'users', color: '#4879BD' },
    douban: { name: '豆瓣', category: 'community', icon: 'leaf', color: '#00B51D' },
    
    // ========== 国内自媒体平台 ==========
    toutiao: { name: '今日头条', category: 'media', icon: 'newspaper', color: '#F85959' },
    baijiahao: { name: '百家号', category: 'media', icon: 'pen', color: '#2932E1' },
    dayuhao: { name: '大鱼号', category: 'media', icon: 'fish', color: '#FF6A00' },
    souhuhao: { name: '搜狐号', category: 'media', icon: 'newspaper', color: '#FF6600' },
    wangyihao: { name: '网易号', category: 'media', icon: 'newspaper', color: '#D43C33' },
    qiehao: { name: '企鹅号', category: 'media', icon: 'qq', color: '#12B7F5' },
    yidianzixun: { name: '一点资讯', category: 'media', icon: 'circle-info', color: '#FF0000' },
    
    // ========== 国内电商/生活平台 ==========
    xianyu: { name: '闲鱼', category: 'ecommerce', icon: 'shopping-bag', color: '#FFE14D' },
    zhuanzhuan: { name: '转转', category: 'ecommerce', icon: 'recycle', color: '#FFC800' },
    meituan: { name: '美团', category: 'lifestyle', icon: 'shop', color: '#FFD000' },
    dianping: { name: '大众点评', category: 'lifestyle', icon: 'star', color: '#FF6633' },
    xiecheng: { name: '携程', category: 'travel', icon: 'plane', color: '#2577E3' },
    mafengwo: { name: '马蜂窝', category: 'travel', icon: 'location-dot', color: '#FF9900' },
    
    // ========== 国内财经/专业平台 ==========
    xueqiu: { name: '雪球', category: 'finance', icon: 'chart-line', color: '#0078FF' },
    eastmoney: { name: '东方财富', category: 'finance', icon: 'coins', color: '#FF6600' },
    jianshu: { name: '简书', category: 'community', icon: 'pen', color: '#EA6F5A' },
    
    // ========== 国际社交平台 ==========
    twitter: { name: 'Twitter/X', category: 'international', icon: 'x-twitter', color: '#000000' },
    facebook: { name: 'Facebook', category: 'international', icon: 'facebook', color: '#1877F2' },
    instagram: { name: 'Instagram', category: 'international', icon: 'instagram', color: '#E4405F' },
    tiktok_global: { name: 'TikTok', category: 'international', icon: 'tiktok', color: '#000000' },
    youtube: { name: 'YouTube', category: 'international', icon: 'youtube', color: '#FF0000' },
    linkedin: { name: 'LinkedIn', category: 'international', icon: 'linkedin', color: '#0A66C2' },
    pinterest: { name: 'Pinterest', category: 'international', icon: 'pinterest', color: '#BD081C' },
    reddit: { name: 'Reddit', category: 'international', icon: 'reddit', color: '#FF4500' },
    medium: { name: 'Medium', category: 'international', icon: 'medium', color: '#000000' },
    quora: { name: 'Quora', category: 'international', icon: 'quora', color: '#B92B27' },
    discord: { name: 'Discord', category: 'international', icon: 'discord', color: '#5865F2' },
    telegram: { name: 'Telegram', category: 'international', icon: 'telegram', color: '#26A5E4' },
    
    // ========== SEO/搜索引擎 ==========
    baidu_seo: { name: '百度收录', category: 'seo', icon: 'magnifying-glass', color: '#2932E1' },
    google_seo: { name: 'Google收录', category: 'seo', icon: 'google', color: '#4285F4' },
    bing_seo: { name: 'Bing收录', category: 'seo', icon: 'microsoft', color: '#00809D' },
    sogou_seo: { name: '搜狗收录', category: 'seo', icon: 'magnifying-glass', color: '#FF6600' },
    so_seo: { name: '360搜索收录', category: 'seo', icon: 'magnifying-glass', color: '#19B955' },
    
    // ========== 论坛/社区 ==========
    forum: { name: '论坛', category: 'forum', icon: 'comments', color: '#6B7280' },
    community: { name: '社区', category: 'forum', icon: 'users', color: '#8B5CF6' },
    blog: { name: '博客', category: 'forum', icon: 'pen', color: '#F59E0B' },
  };

  const config = platformConfigs[platform];
  if (!config) {
    return { success: false, message: `未知平台: ${platform}` };
  }

  // 模拟推广成功 - TODO: 接入真实平台 API
  return { 
    success: true, 
    message: `[${config.category}] ${config.name}推广成功，链接: ${promoUrl}` 
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
