/**
 * 奖励路由
 * 处理签到、任务、奖励等API
 */

import { Router } from 'express';
import { rewardService } from '../services/reward-service.js';

const router = Router();

/**
 * POST /api/v1/rewards/sign-in
 * 用户签到
 * Body: { userId: string }
 */
router.post('/sign-in', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }
    
    const result = await rewardService.signIn(userId);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ success: false, error: '签到失败' });
  }
});

/**
 * GET /api/v1/rewards/sign-in/status
 * 获取签到状态
 * Query: userId
 */
router.get('/sign-in/status', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }
    
    const data = await rewardService.getSignInStatus(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get sign-in status error:', error);
    res.status(500).json({ success: false, error: '获取签到状态失败' });
  }
});

/**
 * GET /api/v1/rewards/tasks
 * 获取任务列表
 * Query: userId
 */
router.get('/tasks', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }
    
    const tasks = await rewardService.getTasks(userId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, error: '获取任务列表失败' });
  }
});

/**
 * POST /api/v1/rewards/tasks/complete
 * 完成任务
 * Body: { userId: string, taskCode: string }
 */
router.post('/tasks/complete', async (req, res) => {
  try {
    const { userId, taskCode } = req.body;
    
    if (!userId || !taskCode) {
      return res.status(400).json({ success: false, error: '参数不完整' });
    }
    
    const result = await rewardService.completeTask(userId, taskCode);
    
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ success: false, error: '完成任务失败' });
  }
});

/**
 * GET /api/v1/rewards/records
 * 获取奖励记录
 * Query: userId, type?, limit?, offset?
 */
router.get('/records', async (req, res) => {
  try {
    const { userId, type, limit, offset } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }
    
    const records = await rewardService.getRewardRecords(userId, {
      type: type as string | undefined,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
    
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get reward records error:', error);
    res.status(500).json({ success: false, error: '获取奖励记录失败' });
  }
});

/**
 * GET /api/v1/rewards/stats
 * 获取奖励统计
 * Query: userId
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: '缺少用户ID' });
    }
    
    const stats = await rewardService.getRewardStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get reward stats error:', error);
    res.status(500).json({ success: false, error: '获取奖励统计失败' });
  }
});

export default router;
