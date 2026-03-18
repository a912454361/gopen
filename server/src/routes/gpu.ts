import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== GPU 实例管理 ====================

/**
 * 获取可用GPU实例列表
 * GET /api/v1/gpu/instances
 */
router.get('/instances', async (req: Request, res: Response) => {
  try {
    const { data: instances, error } = await client
      .from('gpu_instances')
      .select('id, code, name, gpu_model, vram_gb, sell_per_hour, available_instances, total_instances, description, icon')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch GPU instances' });
    }
    
    res.json({
      success: true,
      data: instances?.map(i => ({
        ...i,
        pricePerHour: (i.sell_per_hour / 100).toFixed(2), // 元/小时
        sell_per_hour: undefined, // 隐藏原始价格
      })),
    });
  } catch (error) {
    console.error('Get GPU instances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 获取GPU实例详情
 * GET /api/v1/gpu/instances/:id
 */
router.get('/instances/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data: instance, error } = await client
      .from('gpu_instances')
      .select('id, code, name, gpu_model, vram_gb, sell_per_hour, cuda_cores, tensor_cores, bandwidth, available_instances, total_instances, description, icon')
      .eq('id', id)
      .eq('status', 'active')
      .single();
    
    if (error || !instance) {
      return res.status(404).json({ error: 'GPU instance not found' });
    }
    
    res.json({
      success: true,
      data: {
        ...instance,
        pricePerHour: (instance.sell_per_hour / 100).toFixed(2),
        sell_per_hour: undefined,
      },
    });
  } catch (error) {
    console.error('Get GPU instance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 费用预估
 * POST /api/v1/gpu/estimate
 * Body: { instanceId, estimatedSeconds }
 */
const estimateGpuSchema = z.object({
  instanceId: z.string(),
  estimatedSeconds: z.number().min(1),
});

router.post('/estimate', async (req: Request, res: Response) => {
  try {
    const body = estimateGpuSchema.parse(req.body);
    
    const { data: instance, error } = await client
      .from('gpu_instances')
      .select('sell_per_hour, name')
      .eq('id', body.instanceId)
      .single();
    
    if (error || !instance) {
      return res.status(404).json({ error: 'GPU instance not found' });
    }
    
    const estimatedFee = Math.ceil((body.estimatedSeconds / 3600) * instance.sell_per_hour);
    
    res.json({
      success: true,
      data: {
        instanceName: instance.name,
        estimatedSeconds: body.estimatedSeconds,
        estimatedMinutes: Math.ceil(body.estimatedSeconds / 60),
        estimatedFee, // 分
        estimatedFeeYuan: (estimatedFee / 100).toFixed(2), // 元
      },
    });
  } catch (error) {
    console.error('GPU estimate error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== GPU 任务管理 ====================

/**
 * 创建GPU任务
 * POST /api/v1/gpu/tasks
 * Body: { userId, instanceId, taskType, taskName, inputParams, estimatedSeconds? }
 */
const createTaskSchema = z.object({
  userId: z.string(),
  instanceId: z.string(),
  taskType: z.enum(['render', 'train', 'inference']),
  taskName: z.string(),
  inputParams: z.record(z.string(), z.any()).optional(),
  inputData: z.record(z.string(), z.any()).optional(),
  estimatedSeconds: z.number().optional(),
});

router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const body = createTaskSchema.parse(req.body);
    
    // 获取GPU实例信息
    const { data: instance, error: instanceError } = await client
      .from('gpu_instances')
      .select('*')
      .eq('id', body.instanceId)
      .single();
    
    if (instanceError || !instance) {
      return res.status(404).json({ error: 'GPU instance not found' });
    }
    
    if (instance.available_instances <= 0) {
      return res.status(400).json({ error: 'No available GPU instances' });
    }
    
    // 预估费用
    const estimatedSeconds = body.estimatedSeconds || 3600; // 默认1小时
    const estimatedFee = Math.ceil((estimatedSeconds / 3600) * instance.sell_per_hour);
    
    // 检查用户余额
    const { data: balance } = await client
      .from('user_balances')
      .select('balance, frozen_balance')
      .eq('user_id', body.userId)
      .single();
    
    if (!balance || balance.balance < estimatedFee) {
      return res.status(400).json({
        error: 'Insufficient balance',
        data: {
          balance: balance?.balance || 0,
          required: estimatedFee,
        },
      });
    }
    
    // 冻结余额
    await client
      .from('user_balances')
      .update({
        balance: balance.balance - estimatedFee,
        frozen_balance: (balance.frozen_balance || 0) + estimatedFee,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', body.userId);
    
    // 创建任务
    const { data: task, error: taskError } = await client
      .from('gpu_tasks')
      .insert([{
        user_id: body.userId,
        gpu_instance_id: body.instanceId,
        task_type: body.taskType,
        task_name: body.taskName,
        input_params: body.inputParams,
        input_data: body.inputData,
        estimated_cost: Math.ceil((estimatedSeconds / 3600) * instance.cost_per_hour),
        estimated_sell: estimatedFee,
        status: 'pending',
      }])
      .select()
      .single();
    
    if (taskError) {
      // 回滚冻结
      await client
        .from('user_balances')
        .update({
          balance: balance.balance,
          frozen_balance: (balance.frozen_balance || 0) - estimatedFee,
        })
        .eq('user_id', body.userId);
      
      return res.status(500).json({ error: 'Failed to create GPU task' });
    }
    
    // 减少可用实例数
    await client
      .from('gpu_instances')
      .update({
        available_instances: instance.available_instances - 1,
      })
      .eq('id', body.instanceId);
    
    res.json({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        estimatedFee,
        estimatedFeeYuan: (estimatedFee / 100).toFixed(2),
        message: 'GPU任务已创建，等待执行',
      },
    });
  } catch (error) {
    console.error('Create GPU task error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

/**
 * 获取GPU任务状态
 * GET /api/v1/gpu/tasks/:taskId
 */
router.get('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    
    const { data: task, error } = await client
      .from('gpu_tasks')
      .select('*, gpu_instances(name, gpu_model)')
      .eq('id', taskId)
      .single();
    
    if (error || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({
      success: true,
      data: {
        taskId: task.id,
        taskName: task.task_name,
        taskType: task.task_type,
        status: task.status,
        startTime: task.start_time,
        endTime: task.end_time,
        duration: task.duration,
        actualFee: task.actual_sell,
        actualFeeYuan: task.actual_sell ? (task.actual_sell / 100).toFixed(2) : null,
        gpuInstance: task.gpu_instances,
        errorMessage: task.error_message,
        outputData: task.output_data,
      },
    });
  } catch (error) {
    console.error('Get GPU task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 完成GPU任务（内部调用）
 * POST /api/v1/gpu/tasks/:taskId/complete
 * Body: { outputData, actualSeconds }
 */
router.post('/tasks/:taskId/complete', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { outputData, actualSeconds } = req.body;
    
    const { data: task, error: taskError } = await client
      .from('gpu_tasks')
      .select('*, gpu_instances(*)')
      .eq('id', taskId)
      .single();
    
    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const instance = task.gpu_instances as any;
    const actualCost = Math.ceil((actualSeconds / 3600) * instance.cost_per_hour);
    const actualSell = Math.ceil((actualSeconds / 3600) * instance.sell_per_hour);
    const profit = actualSell - actualCost;
    
    // 更新任务状态
    await client
      .from('gpu_tasks')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        duration: actualSeconds,
        output_data: outputData,
        actual_cost: actualCost,
        actual_sell: actualSell,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);
    
    // 获取用户余额
    const { data: balance } = await client
      .from('user_balances')
      .select('frozen_balance')
      .eq('user_id', task.user_id)
      .single();
    
    if (balance) {
      // 解冻并结算
      const frozenAmount = balance.frozen_balance || 0;
      const refund = task.estimated_sell - actualSell;
      
      await client
        .from('user_balances')
        .update({
          frozen_balance: Math.max(0, frozenAmount - task.estimated_sell),
          balance: refund > 0 ? balance.balance + refund : balance.balance, // 退还多扣部分
          total_consumed: actualSell,
          total_gpu_used: actualSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', task.user_id);
    }
    
    // 记录消费
    await client
      .from('consumption_records')
      .insert([{
        user_id: task.user_id,
        consumption_type: 'gpu',
        resource_id: instance.id,
        resource_name: instance.name,
        gpu_seconds: actualSeconds,
        cost_gpu_fee: actualCost,
        cost_total: actualCost,
        sell_gpu_fee: actualSell,
        sell_total: actualSell,
        profit,
        task_id: taskId,
      }]);
    
    // 恢复可用实例数
    await client
      .from('gpu_instances')
      .update({
        available_instances: instance.available_instances + 1,
      })
      .eq('id', instance.id);
    
    res.json({
      success: true,
      data: {
        taskId,
        status: 'completed',
        actualSeconds,
        actualFee: actualSell,
        actualFeeYuan: (actualSell / 100).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Complete GPU task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 获取用户GPU任务列表
 * GET /api/v1/gpu/user-tasks/:userId
 */
router.get('/user-tasks/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = client
      .from('gpu_tasks')
      .select('*, gpu_instances(name, gpu_model, vram_gb)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: tasks, count, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch GPU tasks' });
    }
    
    res.json({
      success: true,
      data: {
        tasks: tasks?.map(t => ({
          taskId: t.id,
          taskName: t.task_name,
          taskType: t.task_type,
          status: t.status,
          duration: t.duration,
          fee: t.actual_sell,
          feeYuan: t.actual_sell ? (t.actual_sell / 100).toFixed(2) : null,
          gpuInstance: t.gpu_instances,
          createdAt: t.created_at,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get user GPU tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
