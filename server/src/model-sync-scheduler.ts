/**
 * 模型同步定时任务
 * 定期自动同步所有商家模型
 */

import cron from 'node-cron';
import { modelSyncService } from './services/model-sync-service.js';
import { getSupabaseClient } from './storage/database/supabase-client.js';

const client = getSupabaseClient();

// 同步任务状态
let isSyncing = false;
let lastSyncTime: Date | null = null;

/**
 * 执行模型同步
 */
async function runModelSync(): Promise<void> {
  if (isSyncing) {
    console.log('[ModelSyncScheduler] Sync already in progress, skipping...');
    return;
  }

  try {
    isSyncing = true;
    console.log('[ModelSyncScheduler] Starting scheduled model sync...');
    
    const results = await modelSyncService.syncAllProviders();
    
    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      modelsAdded: results.reduce((sum, r) => sum + r.modelsAdded, 0),
      modelsUpdated: results.reduce((sum, r) => sum + r.modelsUpdated, 0),
      modelsDeactivated: results.reduce((sum, r) => sum + r.modelsDeactivated, 0),
    };

    lastSyncTime = new Date();
    
    console.log('[ModelSyncScheduler] Sync completed:', summary);
    
    // 如果有价格变更，发送通知
    const priceChanges = results.flatMap(r => r.priceChanges);
    if (priceChanges.length > 0) {
      await notifyPriceChanges(priceChanges);
    }
    
  } catch (error) {
    console.error('[ModelSyncScheduler] Sync error:', error);
  } finally {
    isSyncing = false;
  }
}

/**
 * 通知价格变更
 */
async function notifyPriceChanges(
  changes: Array<{
    model: string;
    oldPrice: { input: number; output: number };
    newPrice: { input: number; output: number };
  }>
): Promise<void> {
  try {
    // 创建系统通知
    for (const change of changes) {
      await client.from('notifications').insert({
        id: crypto.randomUUID(),
        user_id: 'system',
        type: 'price_change',
        title: '模型价格变更',
        content: `${change.model} 价格已更新`,
        data: JSON.stringify({
          model: change.model,
          oldPrice: change.oldPrice,
          newPrice: change.newPrice,
        }),
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
    
    console.log(`[ModelSyncScheduler] Created ${changes.length} price change notifications`);
  } catch (error) {
    console.error('[ModelSyncScheduler] Failed to create notifications:', error);
  }
}

/**
 * 启动模型同步定时任务
 */
export function startModelSyncScheduler(): void {
  console.log('[ModelSyncScheduler] Starting model sync scheduler...');
  
  // 每6小时同步一次
  cron.schedule('0 */6 * * *', async () => {
    console.log('[ModelSyncScheduler] Triggered scheduled sync (every 6 hours)');
    await runModelSync();
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 每天凌晨3点执行完整同步
  cron.schedule('0 3 * * *', async () => {
    console.log('[ModelSyncScheduler] Triggered daily full sync');
    await runModelSync();
  }, {
    timezone: 'Asia/Shanghai',
  });
  
  // 启动后延迟5分钟执行首次同步
  setTimeout(async () => {
    console.log('[ModelSyncScheduler] Running initial sync after 5 minutes...');
    await runModelSync();
  }, 5 * 60 * 1000);
  
  console.log('[ModelSyncScheduler] Scheduler started');
  console.log('[ModelSyncScheduler] - Sync every 6 hours');
  console.log('[ModelSyncScheduler] - Full sync daily at 3:00 AM');
}

/**
 * 手动触发同步
 */
export async function triggerManualSync(): Promise<{
  success: boolean;
  message: string;
  lastSyncTime: Date | null;
}> {
  if (isSyncing) {
    return {
      success: false,
      message: '同步正在进行中，请稍后再试',
      lastSyncTime,
    };
  }
  
  await runModelSync();
  
  return {
    success: true,
    message: '同步已完成',
    lastSyncTime,
  };
}

/**
 * 获取同步状态
 */
export function getSyncSchedulerStatus(): {
  isSyncing: boolean;
  lastSyncTime: Date | null;
} {
  return {
    isSyncing,
    lastSyncTime,
  };
}
