/**
 * 高级动漫创作路由
 * 支持快速创作、并行生成、批量分集
 */

import express, { type Request, type Response } from 'express';
import {
  quickAnimeCreation,
  batchEpisodeCreation,
  qualityCheck,
  selectBestModel,
  ParallelCreationManager,
  MODELS,
} from '../services/anime-creation-advanced.js';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = express.Router();
const client = getSupabaseClient();

// 特权用户ID
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

/**
 * 获取推荐的模型配置
 * GET /api/v1/anime-advanced/models
 */
router.get('/models', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      models: MODELS,
      recommendation: {
        premium: {
          label: '特权用户（郭涛）',
          models: ['Kimi K2', 'DeepSeek V3', 'Seedance 1.5 Pro'],
          speed: '最快',
          quality: '最高',
        },
        free: {
          label: '免费模式',
          models: ['DeepSeek V3', '通义千问 Max', 'GLM-4 Flash'],
          speed: '较快',
          quality: '良好',
        },
      },
    },
  });
});

/**
 * 快速动漫创作
 * 一键生成完整动漫项目（剧本+角色+场景并行生成）
 * POST /api/v1/anime-advanced/quick-create
 */
router.post('/quick-create', async (req: Request, res: Response) => {
  try {
    const { user_id, title, genre, style, episode_count } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({ error: 'user_id and title are required' });
    }

    const isPrivileged = user_id === PRIVILEGED_USER_ID;

    console.log(`[AnimeAdvanced] Quick creation for ${isPrivileged ? 'privileged' : 'normal'} user: ${title}`);

    const result = await quickAnimeCreation({
      userId: user_id,
      title,
      genre: genre || '冒险',
      style: style || '日系动漫',
      episodeCount: episode_count || 12,
      isPrivileged,
    });

    res.json({
      success: true,
      data: result,
      message: `已生成动漫项目「${title}」，包含${result.characters.length}个角色和${result.scenes.length}个场景`,
    });
  } catch (error) {
    console.error('[AnimeAdvanced] Quick create error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 批量分集创作
 * 并行生成多集剧本
 * POST /api/v1/anime-advanced/batch-episodes
 */
router.post('/batch-episodes', async (req: Request, res: Response) => {
  try {
    const { user_id, project_id, episode_count } = req.body;

    if (!user_id || !project_id) {
      return res.status(400).json({ error: 'user_id and project_id are required' });
    }

    // 获取项目信息
    const { data: project, error } = await client
      .from('anime_projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const isPrivileged = user_id === PRIVILEGED_USER_ID;

    console.log(`[AnimeAdvanced] Batch creating ${episode_count} episodes for ${project.title}`);

    const episodes = await batchEpisodeCreation({
      projectId: project_id,
      episodeCount: episode_count || project.episodes?.length || 12,
      outline: project.synopsis,
      characters: project.characters || [],
      userId: user_id,
      isPrivileged,
    });

    res.json({
      success: true,
      data: {
        episodes,
        count: episodes.length,
      },
      message: `已生成${episodes.length}集剧本`,
    });
  } catch (error) {
    console.error('[AnimeAdvanced] Batch episodes error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 质量检查
 * POST /api/v1/anime-advanced/quality-check
 */
router.post('/quality-check', async (req: Request, res: Response) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ error: 'project_id is required' });
    }

    // 获取项目
    const { data: project, error } = await client
      .from('anime_projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await qualityCheck({
      script: project.synopsis || '',
      characters: project.characters || [],
      scenes: project.scenes || [],
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[AnimeAdvanced] Quality check error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 并行创作任务
 * 自定义多任务并行执行
 * POST /api/v1/anime-advanced/parallel-create
 */
router.post('/parallel-create', async (req: Request, res: Response) => {
  try {
    const { user_id, tasks } = req.body;

    if (!user_id || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'user_id and tasks array are required' });
    }

    const isPrivileged = user_id === PRIVILEGED_USER_ID;
    const manager = new ParallelCreationManager(user_id, isPrivileged);

    // 添加所有任务
    for (const task of tasks) {
      manager.addTask(task.id, task.type, task.prompt);
    }

    // 并行执行
    const results = await manager.executeAll();
    const status = manager.getStatus();

    res.json({
      success: true,
      data: {
        results: Object.fromEntries(results),
        status,
      },
    });
  } catch (error) {
    console.error('[AnimeAdvanced] Parallel create error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 智能模型推荐
 * GET /api/v1/anime-advanced/recommend-model
 */
router.get('/recommend-model', (req: Request, res: Response) => {
  const { task_type, user_level } = req.query;

  const model = selectBestModel(
    task_type as 'script' | 'character' | 'scene' | 'dialogue' | 'visual',
    user_level as 'premium' | 'high' | 'normal' | 'free'
  );

  res.json({
    success: true,
    data: {
      recommended_model: model,
      task_type,
      user_level,
    },
  });
});

export default router;
