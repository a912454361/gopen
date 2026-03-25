import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 离线操作队列 ====================

/**
 * 添加离线操作到队列
 * POST /api/v1/offline/queue
 */
const addToQueueSchema = z.object({
  userId: z.string(),
  operationType: z.enum(['deduct', 'payment', 'refund', 'sync']),
  operationData: z.record(z.string(), z.any()),
});

router.post('/queue', async (req: Request, res: Response) => {
  try {
    const body = addToQueueSchema.parse(req.body);
    
    const { data: queueItem, error } = await client
      .from('offline_queue')
      .insert([{
        user_id: body.userId,
        operation_type: body.operationType,
        operation_data: body.operationData,
        status: 'pending',
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to add to queue' });
    }
    
    res.json({
      success: true,
      data: queueItem,
    });
  } catch (error) {
    console.error('Add to queue error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 获取待同步队列 ====================

/**
 * 获取用户待同步的操作
 * GET /api/v1/offline/pending/:userId
 */
router.get('/pending/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: pendingItems, error } = await client
      .from('offline_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get pending items' });
    }
    
    res.json({
      success: true,
      data: pendingItems || [],
    });
  } catch (error) {
    console.error('Get pending error:', error);
    res.status(500).json({ error: 'Failed to get pending items' });
  }
});

// ==================== 同步单个操作 ====================

/**
 * 同步单个离线操作
 * POST /api/v1/offline/sync/:itemId
 */
router.post('/sync/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    
    const { data: queueItem, error: findError } = await client
      .from('offline_queue')
      .select('*')
      .eq('id', itemId)
      .single();
    
    if (findError || !queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }
    
    // 模拟同步操作（实际应调用对应的业务逻辑）
    const syncSuccess = Math.random() > 0.2; // 80%成功率
    
    if (syncSuccess) {
      // 更新状态为已同步
      await client
        .from('offline_queue')
        .update({
          status: 'synced',
          sync_attempts: queueItem.sync_attempts + 1,
          last_sync_attempt: new Date().toISOString(),
          synced_at: new Date().toISOString(),
          sync_result: { success: true, message: 'Operation synced successfully' },
        })
        .eq('id', itemId);
      
      res.json({
        success: true,
        message: 'Operation synced successfully',
        data: { itemId, status: 'synced' },
      });
    } else {
      // 同步失败
      await client
        .from('offline_queue')
        .update({
          status: 'failed',
          sync_attempts: queueItem.sync_attempts + 1,
          last_sync_attempt: new Date().toISOString(),
          error_message: 'Sync failed (simulated)',
        })
        .eq('id', itemId);
      
      res.json({
        success: false,
        message: 'Sync failed, will retry later',
        data: { itemId, status: 'failed', attempts: queueItem.sync_attempts + 1 },
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync' });
  }
});

// ==================== 批量同步 ====================

/**
 * 批量同步用户的所有待处理操作
 * POST /api/v1/offline/sync-all/:userId
 */
router.post('/sync-all/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: pendingItems, error } = await client
      .from('offline_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (!pendingItems || pendingItems.length === 0) {
      return res.json({
        success: true,
        message: 'No pending items to sync',
        data: { synced: 0, failed: 0 },
      });
    }
    
    let synced = 0;
    let failed = 0;
    
    for (const item of pendingItems) {
      const syncSuccess = Math.random() > 0.2;
      
      if (syncSuccess) {
        await client
          .from('offline_queue')
          .update({
            status: 'synced',
            sync_attempts: item.sync_attempts + 1,
            last_sync_attempt: new Date().toISOString(),
            synced_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        synced++;
      } else {
        await client
          .from('offline_queue')
          .update({
            status: 'failed',
            sync_attempts: item.sync_attempts + 1,
            last_sync_attempt: new Date().toISOString(),
            error_message: 'Sync failed (simulated)',
          })
          .eq('id', item.id);
        failed++;
      }
    }
    
    res.json({
      success: true,
      message: `Synced ${synced} items, failed ${failed} items`,
      data: { synced, failed, total: pendingItems.length },
    });
  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({ error: 'Failed to sync all' });
  }
});

// ==================== 获取同步历史 ====================

/**
 * 获取同步历史
 * GET /api/v1/offline/history/:userId
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const { data: history, error } = await client
      .from('offline_queue')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get history' });
    }
    
    res.json({
      success: true,
      data: history || [],
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// ==================== 清理已同步记录 ====================

/**
 * 清理已同步的记录
 * POST /api/v1/offline/cleanup/:userId
 */
router.post('/cleanup/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const olderThan = req.query.olderThan 
      ? new Date(req.query.olderThan as string) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 默认清理7天前的
    
    const { error } = await client
      .from('offline_queue')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'synced')
      .lt('synced_at', olderThan.toISOString());
    
    if (error) {
      return res.status(500).json({ error: 'Failed to cleanup' });
    }
    
    res.json({
      success: true,
      message: 'Cleaned up synced records',
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup' });
  }
});

export default router;
