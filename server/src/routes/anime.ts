/**
 * 动漫生成路由
 * 提供动漫创作相关API
 */

import express, { type Request, type Response } from 'express';
import {
  generateAnimeScript,
  generateCompleteAnime,
  generateAnimeConcept,
  generateCharacterDialogue,
  generateStoryboard,
  ANIME_STYLES,
  ANIME_THEMES,
  CHARACTER_TYPES,
  type AnimeGenerationRequest,
} from '../services/anime-generation.js';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = express.Router();
const client = getSupabaseClient();

// 特权用户ID
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

/**
 * 获取动漫风格配置
 * GET /api/v1/anime/styles
 */
router.get('/styles', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: ANIME_STYLES,
  });
});

/**
 * 获取动漫题材配置
 * GET /api/v1/anime/themes
 */
router.get('/themes', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: ANIME_THEMES,
  });
});

/**
 * 获取角色类型配置
 * GET /api/v1/anime/character-types
 */
router.get('/character-types', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: CHARACTER_TYPES,
  });
});

/**
 * 快速生成动漫概念
 * POST /api/v1/anime/concept
 * Body: { prompt, style? }
 */
router.post('/concept', async (req: Request, res: Response) => {
  try {
    const { prompt, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`[Anime] Generating concept for: ${prompt}`);

    const concept = await generateAnimeConcept(prompt, style);

    res.json({
      success: true,
      data: { concept },
    });
  } catch (error) {
    console.error('[Anime] Concept generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 生成动漫剧本
 * POST /api/v1/anime/script
 * Body: { user_id, prompt, style?, theme?, character_count?, scene_count? }
 */
router.post('/script', async (req: Request, res: Response) => {
  try {
    const { user_id, prompt, style, theme, character_count, scene_count } = req.body;

    if (!user_id || !prompt) {
      return res.status(400).json({ error: 'user_id and prompt are required' });
    }

    console.log(`[Anime] Generating script for user ${user_id}: ${prompt}`);

    // 创建任务记录
    const { data: taskData } = await client
      .from('generation_tasks')
      .insert([{
        user_id,
        task_type: 'anime',
        prompt,
        model: 'kimi-moonshot',
        parameters: { style, theme, character_count, scene_count },
        status: 'processing',
        progress: 0,
        started_at: new Date().toISOString(),
        is_privileged: user_id === PRIVILEGED_USER_ID,
      }])
      .select('id')
      .single();

    const taskId = taskData?.id;

    // 生成剧本
    const request: AnimeGenerationRequest = {
      userId: user_id,
      prompt,
      style: style || 'japanese',
      theme: theme || 'fantasy',
      characterCount: character_count || 3,
      sceneCount: scene_count || 5,
      generateImages: false,
      taskId,
    };

    const script = await generateAnimeScript(request);

    // 更新任务完成
    if (taskId) {
      await client
        .from('generation_tasks')
        .update({
          status: 'completed',
          progress: 100,
          result_data: script,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);
    }

    // 保存到动漫项目表
    await client.from('anime_projects').insert([{
      user_id,
      title: script.title,
      synopsis: script.synopsis,
      characters: script.characters,
      scenes: script.scenes,
      episodes: script.episodes,
      style: style || 'japanese',
      theme: theme || 'fantasy',
      task_id: taskId,
      created_at: new Date().toISOString(),
    }]).then(({ error }) => {
      if (error) console.error('[Anime] Failed to save project:', error);
    });

    res.json({
      success: true,
      data: {
        task_id: taskId,
        script,
      },
    });
  } catch (error) {
    console.error('[Anime] Script generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 完整动漫生成（含图像）
 * POST /api/v1/anime/generate
 * Body: { user_id, prompt, style?, theme?, character_count?, scene_count?, generate_images? }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { user_id, prompt, style, theme, character_count, scene_count, generate_images } = req.body;

    if (!user_id || !prompt) {
      return res.status(400).json({ error: 'user_id and prompt are required' });
    }

    const isPrivileged = user_id === PRIVILEGED_USER_ID;

    console.log(`[Anime] Complete generation for user ${user_id} (privileged: ${isPrivileged})`);

    // 创建任务记录
    const { data: taskData } = await client
      .from('generation_tasks')
      .insert([{
        user_id,
        task_type: 'anime',
        prompt,
        model: 'kimi-moonshot+dalle',
        parameters: { style, theme, character_count, scene_count, generate_images },
        status: 'processing',
        progress: 0,
        started_at: new Date().toISOString(),
        is_privileged: isPrivileged,
      }])
      .select('id')
      .single();

    const taskId = taskData?.id;

    // 异步生成（立即返回任务ID）
    generateCompleteAnime({
      userId: user_id,
      prompt,
      style: style || 'japanese',
      theme: theme || 'fantasy',
      characterCount: character_count || 3,
      sceneCount: scene_count || 5,
      generateImages: generate_images !== false && isPrivileged, // 特权用户默认生成图像
      taskId,
    }).then(async (script) => {
      // 保存到动漫项目表
      await client.from('anime_projects').insert([{
        user_id,
        title: script.title,
        synopsis: script.synopsis,
        characters: script.characters,
        scenes: script.scenes,
        episodes: script.episodes,
        style: style || 'japanese',
        theme: theme || 'fantasy',
        task_id: taskId,
        created_at: new Date().toISOString(),
      }]);
    }).catch(error => {
      console.error('[Anime] Background generation error:', error);
    });

    res.json({
      success: true,
      data: {
        task_id: taskId,
        message: '动漫生成任务已启动，请轮询进度',
      },
    });
  } catch (error) {
    console.error('[Anime] Generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 生成角色对话
 * POST /api/v1/anime/dialogue
 * Body: { characters, scene }
 */
router.post('/dialogue', async (req: Request, res: Response) => {
  try {
    const { characters, scene } = req.body;

    if (!characters || !scene) {
      return res.status(400).json({ error: 'characters and scene are required' });
    }

    console.log(`[Anime] Generating dialogue for ${characters.length} characters`);

    const dialogue = await generateCharacterDialogue(characters, scene);

    res.json({
      success: true,
      data: { dialogue },
    });
  } catch (error) {
    console.error('[Anime] Dialogue generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 生成分镜脚本
 * POST /api/v1/anime/storyboard
 * Body: { episode, style? }
 */
router.post('/storyboard', async (req: Request, res: Response) => {
  try {
    const { episode, style } = req.body;

    if (!episode) {
      return res.status(400).json({ error: 'episode is required' });
    }

    console.log(`[Anime] Generating storyboard for episode ${episode.episode}`);

    const storyboard = await generateStoryboard(episode, style);

    res.json({
      success: true,
      data: { storyboard },
    });
  } catch (error) {
    console.error('[Anime] Storyboard generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取用户的动漫项目列表
 * GET /api/v1/anime/projects/:userId
 */
router.get('/projects/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error, count } = await client
      .from('anime_projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error('[Anime] Get projects error:', error);
      return res.status(500).json({ error: 'Failed to get projects' });
    }

    res.json({
      success: true,
      data: data || [],
      total: count,
    });
  } catch (error) {
    console.error('[Anime] Get projects error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取单个动漫项目详情
 * GET /api/v1/anime/project/:projectId
 */
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await client
      .from('anime_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('[Anime] Get project error:', error);
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Anime] Get project error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
