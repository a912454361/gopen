/**
 * 创作任务路由
 * 管理AI生成任务的状态和进度
 */

import express, { type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = express.Router();
const client = getSupabaseClient();

// 特权用户ID
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

/**
 * 创建创作任务
 * POST /api/v1/generation-tasks
 * Body: { user_id, task_type, prompt?, model?, parameters? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, task_type, prompt, model, parameters } = req.body;

    if (!user_id || !task_type) {
      return res.status(400).json({ error: 'user_id and task_type are required' });
    }

    // 验证任务类型
    const validTypes = ['chat', 'image', 'audio', 'video', 'anime', 'game'];
    if (!validTypes.includes(task_type)) {
      return res.status(400).json({ error: `Invalid task_type. Must be one of: ${validTypes.join(', ')}` });
    }

    // 检查是否是特权用户
    const isPrivileged = user_id === PRIVILEGED_USER_ID;

    // 创建任务
    const { data, error } = await client
      .from('generation_tasks')
      .insert([{
        user_id,
        task_type,
        prompt: prompt || '',
        model: model || null,
        parameters: parameters || {},
        status: 'pending',
        progress: 0,
        is_privileged: isPrivileged,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('[GenerationTasks] Create error:', error);
      return res.status(500).json({ error: 'Failed to create task' });
    }

    console.log(`[GenerationTasks] Task created: ${data.id} (${task_type}) for user ${user_id}`);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[GenerationTasks] Create error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取用户的创作任务列表
 * GET /api/v1/generation-tasks/user/:userId
 * Query: status?, limit?, offset?
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = client
      .from('generation_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // 按状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[GenerationTasks] Get list error:', error);
      return res.status(500).json({ error: 'Failed to get tasks' });
    }

    res.json({
      success: true,
      data: data || [],
      total: count,
    });
  } catch (error) {
    console.error('[GenerationTasks] Get list error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取单个任务详情
 * GET /api/v1/generation-tasks/:taskId
 */
router.get('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const { data, error } = await client
      .from('generation_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('[GenerationTasks] Get error:', error);
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[GenerationTasks] Get error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 更新任务状态和进度
 * PUT /api/v1/generation-tasks/:taskId
 * Body: { status?, progress?, result_url?, result_data?, error_message?, admin_key? }
 */
router.put('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status, progress, result_url, result_data, error_message, admin_key } = req.body;

    // 验证管理员权限（只有管理员可以更新任务状态）
    const ADMIN_KEY = process.env.ADMIN_KEY || 'GtAdmin2024SecretKey8888';
    if (admin_key !== ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 构建更新对象
    const updateData: Record<string, any> = {};
    
    if (status) {
      updateData.status = status;
      if (status === 'processing') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    
    if (typeof progress === 'number') {
      updateData.progress = Math.min(100, Math.max(0, progress));
    }
    
    if (result_url !== undefined) {
      updateData.result_url = result_url;
    }
    
    if (result_data !== undefined) {
      updateData.result_data = result_data;
    }
    
    if (error_message !== undefined) {
      updateData.error_message = error_message;
    }

    // 更新任务
    const { data, error } = await client
      .from('generation_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('[GenerationTasks] Update error:', error);
      return res.status(500).json({ error: 'Failed to update task' });
    }

    console.log(`[GenerationTasks] Task ${taskId} updated: status=${data.status}, progress=${data.progress}%`);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[GenerationTasks] Update error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取用户进行中的任务
 * GET /api/v1/generation-tasks/user/:userId/active
 */
router.get('/user/:userId/active', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data, error } = await client
      .from('generation_tasks')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GenerationTasks] Get active error:', error);
      return res.status(500).json({ error: 'Failed to get active tasks' });
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[GenerationTasks] Get active error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 删除任务
 * DELETE /api/v1/generation-tasks/:taskId
 * Query: admin_key
 */
router.delete('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { admin_key, user_id } = req.query;

    // 验证权限（管理员或任务所有者）
    const ADMIN_KEY = process.env.ADMIN_KEY || 'GtAdmin2024SecretKey8888';
    
    if (admin_key !== ADMIN_KEY) {
      // 检查是否是任务所有者
      const { data: task } = await client
        .from('generation_tasks')
        .select('user_id')
        .eq('id', taskId)
        .single();

      if (!task || task.user_id !== user_id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    const { error } = await client
      .from('generation_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('[GenerationTasks] Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete task' });
    }

    console.log(`[GenerationTasks] Task ${taskId} deleted`);

    res.json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error) {
    console.error('[GenerationTasks] Delete error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
