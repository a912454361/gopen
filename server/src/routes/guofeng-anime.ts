/**
 * 国风动漫创作路由
 * 26集大型动漫 + 粒子特效视频
 */

import express, { type Request, type Response } from 'express';
import { createGuofengAnime, generateParticleVideo } from '../services/guofeng-anime-creator.js';

const router = express.Router();

// 特权用户ID
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

/**
 * 创建26集国风燃爆动漫
 * POST /api/v1/guofeng-anime/create
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { user_id, title } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({ error: 'user_id and title are required' });
    }

    // 检查权限
    if (user_id !== PRIVILEGED_USER_ID) {
      return res.status(403).json({ error: '此功能仅限特权用户使用' });
    }

    console.log(`[GuofengAnime] Creating 26-episode anime: ${title}`);

    // 创建动漫项目
    const result = await createGuofengAnime({
      userId: user_id,
      title,
      onProgress: (progress) => {
        console.log(`[GuofengAnime] ${progress.phase}: ${progress.current}/${progress.total} - ${progress.message}`);
      },
    });

    res.json({
      success: true,
      data: result,
      message: `🎉 成功创建26集国风燃爆动漫《${title}》！`,
    });
  } catch (error) {
    console.error('[GuofengAnime] Create error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 生成粒子特效视频
 * POST /api/v1/guofeng-anime/particle-video
 */
router.post('/particle-video', async (req: Request, res: Response) => {
  try {
    const { project_id, scene_id, scene_description, particle_type } = req.body;

    if (!project_id || !scene_description) {
      return res.status(400).json({ error: 'project_id and scene_description are required' });
    }

    console.log(`[GuofengAnime] Generating particle video for scene ${scene_id}`);

    const result = await generateParticleVideo({
      projectId: project_id,
      sceneId: scene_id || 1,
      sceneDescription: scene_description,
      particleType: particle_type || 'spirit',
    });

    res.json({
      success: true,
      data: result,
      message: '粒子特效视频生成成功',
    });
  } catch (error) {
    console.error('[GuofengAnime] Particle video error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取创作进度（SSE流式）
 * GET /api/v1/guofeng-anime/progress/:taskId
 */
router.get('/progress/:taskId', async (req: Request, res: Response) => {
  const { taskId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 模拟进度推送（实际应从任务队列获取）
  const phases = [
    { phase: '故事大纲', progress: 10, message: '🎬 正在创作核心故事线...' },
    { phase: '角色设定', progress: 20, message: '👥 正在设计主要角色...' },
    { phase: '场景设计', progress: 35, message: '🏞️ 正在构建世界观场景...' },
    { phase: '分集剧本', progress: 50, message: '📝 正在创作26集剧本...' },
    { phase: '保存项目', progress: 70, message: '💾 正在保存动漫项目...' },
    { phase: '完成', progress: 100, message: '✅ 动漫项目创作完成！' },
  ];

  for (const p of phases) {
    res.write(`data: ${JSON.stringify({
      taskId,
      ...p,
      timestamp: new Date().toISOString(),
    })}\n\n`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

export default router;
