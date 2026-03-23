/**
 * 动漫视频生成路由
 * 将动漫剧本转化为视频
 * 支持并行生成，大幅提升速度
 */

import express, { type Request, type Response } from 'express';
import { VideoGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { 
  parallelGenerateVideos, 
  quickGenerateVideo,
  PARALLEL_CONFIG 
} from '../services/parallel-video-generator.js';
import { 
  multiModelGenerateVideo,
  VIDEO_SERVICES,
  multiModelGenerator,
} from '../services/multi-model-video-generator.js';
import { 
  gpuRenderer,
  cloudGPUScheduler,
  acceleratedRender,
} from '../services/gpu-accelerated-renderer.js';
import {
  distributedDispatcher,
  submitDistributedTask,
} from '../services/distributed-task-dispatcher.js';

// 视频服务类型
type VideoServiceKey = keyof typeof VIDEO_SERVICES;

const router = express.Router();
const client = getSupabaseClient();

// 特权用户ID
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

// 动漫视频配置
const ANIME_VIDEO_CONFIG = {
  model: 'doubao-seedance-1-5-pro-251215',
  defaultDuration: 5,
  maxDuration: 12,
  resolutions: ['720p', '1080p', '2K', '4K'] as const,
  ratios: ['16:9', '9:16', '1:1'] as const,
};

/**
 * 检查用户动漫视频特权
 */
async function checkAnimeVideoPrivilege(userId: string): Promise<{
  isPrivileged: boolean;
  maxScenes: number;
  resolution: string;
}> {
  if (userId === PRIVILEGED_USER_ID) {
    return {
      isPrivileged: true,
      maxScenes: 50, // 特权用户可生成50个场景
      resolution: '1080p',
    };
  }

  // 检查会员等级
  const { data: user } = await client
    .from('users')
    .select('membership_level')
    .eq('id', userId)
    .single();

  if (user?.membership_level === 'super') {
    return {
      isPrivileged: true,
      maxScenes: 20,
      resolution: '1080p',
    };
  }

  if (user?.membership_level === 'normal') {
    return {
      isPrivileged: false,
      maxScenes: 5,
      resolution: '720p',
    };
  }

  return {
    isPrivileged: false,
    maxScenes: 3,
    resolution: '480p',
  };
}

/**
 * 为动漫场景生成视频
 * POST /api/v1/anime-video/scene
 * Body: { user_id, scene_prompt, style, duration?, resolution? }
 */
router.post('/scene', async (req: Request, res: Response) => {
  try {
    const { user_id, scene_prompt, style, duration, resolution } = req.body;

    if (!user_id || !scene_prompt) {
      return res.status(400).json({ error: 'user_id and scene_prompt are required' });
    }

    // 检查特权
    const privilege = await checkAnimeVideoPrivilege(user_id);

    console.log(`[AnimeVideo] Generating scene for user ${user_id}, privileged: ${privilege.isPrivileged}`);

    // 构建动漫风格提示词
    const stylePrefix = style ? `${style}风格动漫, ` : '日系动漫风格, ';
    const enhancedPrompt = `${stylePrefix}${scene_prompt}，高质量动画，流畅动作，精美画面`;

    // 创建任务记录
    const { data: taskData } = await client
      .from('generation_tasks')
      .insert([{
        user_id,
        task_type: 'anime',
        prompt: scene_prompt,
        model: ANIME_VIDEO_CONFIG.model,
        parameters: { style, duration: duration || 5, resolution: resolution || privilege.resolution },
        status: 'processing',
        progress: 10,
        started_at: new Date().toISOString(),
        is_privileged: privilege.isPrivileged,
      }])
      .select('id')
      .single();

    const taskId = taskData?.id;

    // 调用视频生成API
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const videoClient = new VideoGenerationClient(config, customHeaders);

    const videoDuration = Math.min(duration || 5, ANIME_VIDEO_CONFIG.maxDuration);
    const videoResolution = resolution || privilege.resolution;

    const contentItems = [
      {
        type: 'text' as const,
        text: enhancedPrompt,
      },
    ];

    const response = await videoClient.videoGeneration(contentItems, {
      model: ANIME_VIDEO_CONFIG.model,
      duration: videoDuration,
      ratio: '16:9',
      resolution: videoResolution as any,
      generateAudio: true,
      watermark: false,
    });

    if (response.videoUrl) {
      // 更新任务状态
      await client
        .from('generation_tasks')
        .update({
          status: 'completed',
          progress: 100,
          result_url: response.videoUrl,
          result_data: { duration: videoDuration, resolution: videoResolution },
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      // 特权用户同步到阿里云盘
      if (privilege.isPrivileged && user_id === PRIVILEGED_USER_ID) {
        try {
          const { getPrivilegedUserAliyunDriveClient } = await import('../services/aliyun-drive.js');
          const driveClient = getPrivilegedUserAliyunDriveClient();
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `动漫场景_${timestamp}.mp4`;
          
          driveClient.syncGeneratedFile(response.videoUrl, fileName, 'anime')
            .then(() => console.log(`[AnimeVideo] Synced to AliyunDrive: ${fileName}`))
            .catch(err => console.error('[AnimeVideo] Sync failed:', err));
        } catch (err) {
          console.error('[AnimeVideo] AliyunDrive sync error:', err);
        }
      }

      return res.json({
        success: true,
        data: {
          video_url: response.videoUrl,
          task_id: taskId,
          duration: videoDuration,
          resolution: videoResolution,
        },
      });
    } else {
      // 更新任务失败状态
      await client
        .from('generation_tasks')
        .update({
          status: 'failed',
          error_message: response.response?.error_message || 'Video generation failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      return res.status(500).json({
        error: response.response?.error_message || 'Video generation failed',
        task_id: taskId,
      });
    }
  } catch (error) {
    console.error('[AnimeVideo] Scene generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 为动漫项目生成所有场景视频
 * POST /api/v1/anime-video/project
 * Body: { user_id, anime_project_id, style?, resolution? }
 */
router.post('/project', async (req: Request, res: Response) => {
  try {
    const { user_id, anime_project_id, style, resolution } = req.body;

    if (!user_id || !anime_project_id) {
      return res.status(400).json({ error: 'user_id and anime_project_id are required' });
    }

    // 获取动漫项目
    const { data: project, error: projectError } = await client
      .from('anime_projects')
      .select('*')
      .eq('id', anime_project_id)
      .eq('user_id', user_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Anime project not found' });
    }

    // 检查特权
    const privilege = await checkAnimeVideoPrivilege(user_id);
    const scenes = project.scenes || [];

    if (scenes.length > privilege.maxScenes) {
      return res.status(400).json({ 
        error: `场景数量超出限制。您的等级最多生成 ${privilege.maxScenes} 个场景视频`,
        max_scenes: privilege.maxScenes,
        current_scenes: scenes.length,
      });
    }

    console.log(`[AnimeVideo] Generating ${scenes.length} scenes for project ${anime_project_id}`);

    // 创建主任务
    const { data: mainTask } = await client
      .from('generation_tasks')
      .insert([{
        user_id,
        task_type: 'anime',
        prompt: `动漫项目: ${project.title}`,
        model: ANIME_VIDEO_CONFIG.model,
        parameters: { project_id: anime_project_id, scene_count: scenes.length },
        status: 'processing',
        progress: 0,
        started_at: new Date().toISOString(),
        is_privileged: privilege.isPrivileged,
      }])
      .select('id')
      .single();

    const mainTaskId = mainTask?.id;

    // 异步并行生成所有场景（提速3-5倍）
    parallelGenerateVideos({
      userId: user_id,
      projectId: anime_project_id,
      scenes,
      style: style || project.style || '日系动漫',
      resolution: resolution || privilege.resolution,
      mainTaskId,
      isPrivileged: privilege.isPrivileged,
      concurrency: privilege.isPrivileged ? 5 : 3, // 并发数
    }).catch(err => {
      console.error('[AnimeVideo] Parallel generation error:', err);
    });

    res.json({
      success: true,
      data: {
        task_id: mainTaskId,
        scene_count: scenes.length,
        message: `已开始生成 ${scenes.length} 个场景视频，请查看进度面板`,
      },
    });
  } catch (error) {
    console.error('[AnimeVideo] Project generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 后台生成项目所有场景（支持续传：跳过已生成的场景）
 */
async function generateProjectScenes(params: {
  userId: string;
  projectId: string;
  scenes: any[];
  style: string;
  resolution: string;
  mainTaskId: string;
  isPrivileged: boolean;
}) {
  const { userId, projectId, scenes, style, resolution, mainTaskId, isPrivileged } = params;
  
  const config = new Config();
  const videoClient = new VideoGenerationClient(config, {});
  
  const videoUrls: string[] = [];
  const errors: string[] = [];
  let completedCount = 0;

  // 获取已存在的场景视频
  const { data: existingVideos } = await client
    .from('anime_scene_videos')
    .select('scene_id, video_url')
    .eq('project_id', projectId);
  
  const existingSceneIds = new Set((existingVideos || []).map(v => v.scene_id));
  const existingVideoMap = new Map((existingVideos || []).map(v => [v.scene_id, v.video_url]));
  
  console.log(`[AnimeVideo] Found ${existingSceneIds.size} existing videos, will skip them`);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneId = scene.sceneId || i + 1;
    
    // 检查是否已存在该场景视频
    if (existingSceneIds.has(sceneId)) {
      const existingUrl = existingVideoMap.get(sceneId);
      if (existingUrl) {
        videoUrls.push(existingUrl);
        completedCount++;
        console.log(`[AnimeVideo] Scene ${sceneId} already exists, skipping`);
        
        // 更新进度
        const progress = Math.floor((completedCount / scenes.length) * 100);
        await client
          .from('generation_tasks')
          .update({ progress })
          .eq('id', mainTaskId);
        continue;
      }
    }
    
    const scenePrompt = scene.imagePrompt || `${scene.location}，${scene.description}`;
    
    try {
      // 更新主任务进度（考虑已完成的数量）
      completedCount++;
      const progress = Math.floor((completedCount / scenes.length) * 100);
      await client
        .from('generation_tasks')
        .update({ progress })
        .eq('id', mainTaskId);

      // 生成场景视频
      const enhancedPrompt = `${style}风格动漫, ${scenePrompt}，${scene.mood || ''}氛围，高质量动画`;
      
      const response = await videoClient.videoGeneration(
        [{ type: 'text', text: enhancedPrompt }],
        {
          model: ANIME_VIDEO_CONFIG.model,
          duration: 5,
          ratio: '16:9',
          resolution: resolution as any,
          generateAudio: true,
          watermark: false,
        }
      );

      if (response.videoUrl) {
        videoUrls.push(response.videoUrl);
        
        // 保存场景视频记录
        await client
          .from('anime_scene_videos')
          .insert([{
            project_id: projectId,
            scene_id: sceneId,
            video_url: response.videoUrl,
            duration: 5,
            created_at: new Date().toISOString(),
          }])
          .then(({ error }) => {
            if (error) console.error('[AnimeVideo] Failed to save scene video:', error);
          });

        // 特权用户同步到阿里云盘
        if (isPrivileged && userId === PRIVILEGED_USER_ID) {
          try {
            const { getPrivilegedUserAliyunDriveClient } = await import('../services/aliyun-drive.js');
            const driveClient = getPrivilegedUserAliyunDriveClient();
            
            const fileName = `场景${sceneId}_${scene.location || '未命名'}.mp4`;
            await driveClient.syncGeneratedFile(response.videoUrl, fileName, 'anime');
          } catch (err) {
            console.error('[AnimeVideo] AliyunDrive sync error:', err);
          }
        }

        console.log(`[AnimeVideo] Scene ${sceneId}/${scenes.length} generated`);
      } else {
        errors.push(`Scene ${sceneId}: ${response.response?.error_message || 'Unknown error'}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Scene ${sceneId}: ${errorMsg}`);
      console.error(`[AnimeVideo] Scene ${sceneId} error:`, err);
    }
  }

  // 更新主任务完成状态
  await client
    .from('generation_tasks')
    .update({
      status: errors.length === scenes.length ? 'failed' : 'completed',
      progress: 100,
      result_url: videoUrls[0],
      result_data: { 
        video_count: videoUrls.length,
        video_urls: videoUrls,
        errors: errors.length > 0 ? errors : undefined,
      },
      completed_at: new Date().toISOString(),
    })
    .eq('id', mainTaskId);

  // 更新项目（合并已有视频和新视频）
  const allVideoUrls = [...(existingVideos || []).map(v => v.video_url), ...videoUrls.filter(url => !existingVideoMap.has(url))];
  await client
    .from('anime_projects')
    .update({
      video_urls: allVideoUrls,
      video_status: errors.length === scenes.length - existingSceneIds.size ? 'failed' : 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  console.log(`[AnimeVideo] Project ${projectId} completed: ${allVideoUrls.length}/${scenes.length} videos`);
}

/**
 * 获取动漫项目的视频列表
 * GET /api/v1/anime-video/project/:projectId/videos
 */
router.get('/project/:projectId/videos', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await client
      .from('anime_scene_videos')
      .select('*')
      .eq('project_id', projectId)
      .order('scene_id', { ascending: true });

    if (error) {
      console.error('[AnimeVideo] Get videos error:', error);
      return res.status(500).json({ error: 'Failed to get videos' });
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[AnimeVideo] Get videos error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 快速生成单个视频（即时预览）
 * POST /api/v1/anime-video/quick
 * Body: { user_id, prompt, style?, duration?, resolution? }
 */
router.post('/quick', async (req: Request, res: Response) => {
  try {
    const { user_id, prompt, style, duration, resolution } = req.body;

    if (!user_id || !prompt) {
      return res.status(400).json({ error: 'user_id and prompt are required' });
    }

    console.log(`[AnimeVideo] Quick generate for user ${user_id}: ${prompt.substring(0, 50)}...`);

    const result = await quickGenerateVideo({
      userId: user_id,
      prompt,
      style: style || '国风动漫',
      duration: duration || 5,
      resolution: resolution || '1080p',
    });

    res.json({
      success: true,
      data: {
        video_url: result.videoUrl,
        task_id: result.taskId,
      },
    });
  } catch (error) {
    console.error('[AnimeVideo] Quick generate error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 批量生成视频（指定并发数）
 * POST /api/v1/anime-video/batch
 * Body: { user_id, anime_project_id, style?, resolution?, concurrency? }
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { user_id, anime_project_id, style, resolution, concurrency } = req.body;

    if (!user_id || !anime_project_id) {
      return res.status(400).json({ error: 'user_id and anime_project_id are required' });
    }

    // 获取动漫项目
    const { data: project, error: projectError } = await client
      .from('anime_projects')
      .select('*')
      .eq('id', anime_project_id)
      .eq('user_id', user_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Anime project not found' });
    }

    // 检查特权
    const privilege = await checkAnimeVideoPrivilege(user_id);
    const scenes = project.scenes || [];

    if (scenes.length > privilege.maxScenes) {
      return res.status(400).json({ 
        error: `场景数量超出限制。您的等级最多生成 ${privilege.maxScenes} 个场景视频`,
        max_scenes: privilege.maxScenes,
        current_scenes: scenes.length,
      });
    }

    // 确定并发数
    const maxConcurrency = privilege.isPrivileged ? 5 : 3;
    const actualConcurrency = Math.min(concurrency || maxConcurrency, maxConcurrency);

    console.log(`[AnimeVideo] Batch generate ${scenes.length} scenes with concurrency ${actualConcurrency}`);

    // 创建主任务
    const { data: mainTask } = await client
      .from('generation_tasks')
      .insert([{
        user_id,
        task_type: 'anime',
        prompt: `批量生成: ${project.title}`,
        model: ANIME_VIDEO_CONFIG.model,
        parameters: { 
          project_id: anime_project_id, 
          scene_count: scenes.length,
          concurrency: actualConcurrency,
        },
        status: 'processing',
        progress: 0,
        started_at: new Date().toISOString(),
        is_privileged: privilege.isPrivileged,
      }])
      .select('id')
      .single();

    const mainTaskId = mainTask?.id;

    // 异步并行生成
    parallelGenerateVideos({
      userId: user_id,
      projectId: anime_project_id,
      scenes,
      style: style || project.style || '国风动漫',
      resolution: resolution || privilege.resolution,
      mainTaskId,
      isPrivileged: privilege.isPrivileged,
      concurrency: actualConcurrency,
    }).catch(err => {
      console.error('[AnimeVideo] Batch generation error:', err);
    });

    res.json({
      success: true,
      data: {
        task_id: mainTaskId,
        scene_count: scenes.length,
        concurrency: actualConcurrency,
        message: `已开始并行生成 ${scenes.length} 个场景视频（并发数: ${actualConcurrency}），速度提升${actualConcurrency}倍`,
      },
    });
  } catch (error) {
    console.error('[AnimeVideo] Batch generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取生成配置信息
 * GET /api/v1/anime-video/config
 */
router.get('/config', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      model: ANIME_VIDEO_CONFIG.model,
      default_duration: ANIME_VIDEO_CONFIG.defaultDuration,
      max_duration: ANIME_VIDEO_CONFIG.maxDuration,
      resolutions: ANIME_VIDEO_CONFIG.resolutions,
      ratios: ANIME_VIDEO_CONFIG.ratios,
      parallel_config: {
        default_concurrency: PARALLEL_CONFIG.defaultConcurrency,
        privileged_concurrency: PARALLEL_CONFIG.privilegedConcurrency,
      },
      multi_model: {
        services: Object.keys(VIDEO_SERVICES).map(key => ({
          key,
          name: VIDEO_SERVICES[key as VideoServiceKey].name,
          status: VIDEO_SERVICES[key as VideoServiceKey].status,
          maxConcurrent: VIDEO_SERVICES[key as VideoServiceKey].maxConcurrent,
        })),
      },
      distributed: {
        clusterStatus: distributedDispatcher.getClusterStatus(),
      },
    },
  });
});

/**
 * 多模型并行生成视频
 * POST /api/v1/anime-video/multi-model
 * Body: { user_id, prompt, style?, services?, race_mode? }
 */
router.post('/multi-model', async (req: Request, res: Response) => {
  try {
    const { user_id, prompt, style, services, race_mode } = req.body;

    if (!user_id || !prompt) {
      return res.status(400).json({ error: 'user_id and prompt are required' });
    }

    console.log(`[AnimeVideo] Multi-model generate for user ${user_id}`);

    const result = await multiModelGenerateVideo({
      prompt,
      style: style || '国风动漫',
      preferredServices: services as VideoServiceKey[],
      raceMode: race_mode !== false,
    });

    res.json({
      success: true,
      data: {
        video_url: result.videoUrl,
        service: result.service,
        service_name: VIDEO_SERVICES[result.service].name,
      },
    });
  } catch (error) {
    console.error('[AnimeVideo] Multi-model generate error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取多模型服务状态
 * GET /api/v1/anime-video/services/status
 */
router.get('/services/status', async (req: Request, res: Response) => {
  const statuses = multiModelGenerator.getServiceStatuses();
  const statusArray = Array.from(statuses.entries()).map(([key, status]) => ({
    service_key: key,
    name: VIDEO_SERVICES[key].name,
    provider: VIDEO_SERVICES[key].provider,
    status: VIDEO_SERVICES[key].status,
    maxConcurrent: VIDEO_SERVICES[key].maxConcurrent,
    activeTasks: status.activeTasks,
    totalGenerated: status.totalGenerated,
    isHealthy: status.isHealthy,
  }));

  res.json({
    success: true,
    data: statusArray,
  });
});

/**
 * GPU加速渲染
 * POST /api/v1/anime-video/gpu-render
 * Body: { user_id, type, prompt, style?, duration?, resolution? }
 */
router.post('/gpu-render', async (req: Request, res: Response) => {
  try {
    const { user_id, type, prompt, style, duration, resolution } = req.body;

    if (!user_id || !prompt) {
      return res.status(400).json({ error: 'user_id and prompt are required' });
    }

    // 检查GPU可用性
    const gpuStatus = await gpuRenderer.getGPUStatus();
    const gpuAvailable = gpuRenderer.isAvailable();

    console.log(`[AnimeVideo] GPU render request, available: ${gpuAvailable}`);

    if (!gpuAvailable) {
      // 降级到多模型生成
      const result = await multiModelGenerateVideo({
        prompt,
        style: style || '国风动漫',
        duration: duration || 5,
        resolution: resolution || '1080p',
      });

      return res.json({
        success: true,
        data: {
          video_url: result.videoUrl,
          render_type: 'api_fallback',
          message: 'GPU不可用，已使用API服务生成',
        },
      });
    }

    // 使用GPU加速渲染
    const result = await acceleratedRender({
      type: type || 'scene',
      prompt,
      style: style || '国风动漫',
      duration: duration || 5,
      resolution: resolution || '1080p',
    });

    res.json({
      success: true,
      data: {
        video_url: result.videoUrl,
        render_type: result.renderType,
        render_time: result.renderTime,
        gpu_status: gpuStatus,
      },
    });
  } catch (error) {
    console.error('[AnimeVideo] GPU render error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取GPU状态
 * GET /api/v1/anime-video/gpu/status
 */
router.get('/gpu/status', async (req: Request, res: Response) => {
  const gpuStatus = await gpuRenderer.getGPUStatus();
  const cloudQueueStatus = cloudGPUScheduler.getQueueStatus();

  res.json({
    success: true,
    data: {
      local_gpu: {
        available: gpuRenderer.isAvailable(),
        device_count: gpuRenderer.getDeviceCount(),
        status: gpuStatus,
      },
      cloud_gpu: cloudQueueStatus,
    },
  });
});

/**
 * 分布式任务提交
 * POST /api/v1/anime-video/distributed
 * Body: { user_id, type, priority, payload }
 */
router.post('/distributed', async (req: Request, res: Response) => {
  try {
    const { user_id, type, priority, payload } = req.body;

    if (!user_id || !payload) {
      return res.status(400).json({ error: 'user_id and payload are required' });
    }

    console.log(`[AnimeVideo] Distributed task submit from user ${user_id}`);

    const taskId = await submitDistributedTask({
      type: type || 'video_generation',
      priority: priority || 'normal',
      payload: {
        ...payload,
        userId: user_id,
      },
    });

    res.json({
      success: true,
      data: {
        task_id: taskId,
        cluster_status: distributedDispatcher.getClusterStatus(),
        message: '任务已提交到分布式集群',
      },
    });
  } catch (error) {
    console.error('[AnimeVideo] Distributed task error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取分布式集群状态
 * GET /api/v1/anime-video/cluster/status
 */
router.get('/cluster/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: distributedDispatcher.getClusterStatus(),
  });
});

/**
 * 超高速生成（多模型 + GPU + 分布式）
 * POST /api/v1/anime-video/turbo
 * Body: { user_id, anime_project_id, style?, resolution? }
 */
router.post('/turbo', async (req: Request, res: Response) => {
  try {
    const { user_id, anime_project_id, style, resolution } = req.body;

    if (!user_id || !anime_project_id) {
      return res.status(400).json({ error: 'user_id and anime_project_id are required' });
    }

    // 获取动漫项目
    const { data: project, error: projectError } = await client
      .from('anime_projects')
      .select('*')
      .eq('id', anime_project_id)
      .eq('user_id', user_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Anime project not found' });
    }

    // 检查特权
    const privilege = await checkAnimeVideoPrivilege(user_id);
    const scenes = project.scenes || [];

    // 创建主任务
    const { data: mainTask } = await client
      .from('generation_tasks')
      .insert([{
        user_id,
        task_type: 'anime',
        prompt: `Turbo生成: ${project.title}`,
        model: 'multi-model-turbo',
        parameters: {
          project_id: anime_project_id,
          scene_count: scenes.length,
          mode: 'turbo',
        },
        status: 'processing',
        progress: 0,
        started_at: new Date().toISOString(),
        is_privileged: privilege.isPrivileged,
      }])
      .select('id')
      .single();

    const mainTaskId = mainTask?.id;

    // 并行 + 多模型 + GPU加速
    const turboConfig = {
      concurrency: privilege.isPrivileged ? 5 : 3,
      services: ['seedance', 'pika', 'kling'] as VideoServiceKey[],
      useGPU: gpuRenderer.isAvailable(),
      distributed: false, // 单机模式下禁用分布式
    };

    console.log(`[AnimeVideo] Turbo mode: ${scenes.length} scenes, concurrency ${turboConfig.concurrency}, GPU ${turboConfig.useGPU}`);

    // 后台执行Turbo生成
    turboGenerateVideos({
      userId: user_id,
      projectId: anime_project_id,
      scenes,
      style: style || project.style || '国风动漫',
      resolution: resolution || privilege.resolution,
      mainTaskId,
      config: turboConfig,
    }).catch(err => {
      console.error('[AnimeVideo] Turbo generation error:', err);
    });

    res.json({
      success: true,
      data: {
        task_id: mainTaskId,
        scene_count: scenes.length,
        turbo_config: turboConfig,
        estimated_speedup: `${turboConfig.concurrency * (turboConfig.services.length)}x`,
        message: `Turbo模式启动，预计提速${turboConfig.concurrency * turboConfig.services.length}倍`,
      },
    });
  } catch (error) {
    console.error('[AnimeVideo] Turbo generate error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * Turbo生成核心逻辑
 */
async function turboGenerateVideos(params: {
  userId: string;
  projectId: string;
  scenes: any[];
  style: string;
  resolution: string;
  mainTaskId: string;
  config: {
    concurrency: number;
    services: VideoServiceKey[];
    useGPU: boolean;
    distributed: boolean;
  };
}): Promise<void> {
  const { userId, projectId, scenes, style, resolution, mainTaskId, config } = params;

  const startTime = Date.now();
  let completedCount = 0;

  // 获取已存在的场景视频
  const { data: existingVideos } = await client
    .from('anime_scene_videos')
    .select('scene_id, video_url')
    .eq('project_id', projectId);

  const existingSceneIds = new Set((existingVideos || []).map(v => v.scene_id));
  const videoUrls: string[] = (existingVideos || []).map(v => v.video_url);

  // 过滤需要生成的场景
  const scenesToGenerate = scenes.filter((scene, index) => {
    const sceneId = scene.sceneId || index + 1;
    return !existingSceneIds.has(sceneId);
  });

  console.log(`[Turbo] Generating ${scenesToGenerate.length} scenes`);

  // 并发生成（多模型）
  const batchSize = config.concurrency;
  for (let i = 0; i < scenesToGenerate.length; i += batchSize) {
    const batch = scenesToGenerate.slice(i, i + batchSize);

    const promises = batch.map(async (scene, batchIndex) => {
      const sceneId = scene.sceneId || scenes.indexOf(scene) + 1;
      const scenePrompt = scene.imagePrompt || `${scene.location || ''}，${scene.description || ''}` || '动漫场景';

      try {
        // 使用多模型生成
        const result = await multiModelGenerateVideo({
          prompt: scenePrompt,
          style,
          duration: 5,
          resolution,
          preferredServices: config.services,
          raceMode: true,
        });

        // 保存到数据库
        await client
          .from('anime_scene_videos')
          .insert([{
            project_id: projectId,
            scene_id: sceneId,
            video_url: result.videoUrl,
            duration: 5,
            created_at: new Date().toISOString(),
          }]);

        return { sceneId, videoUrl: result.videoUrl as string, service: result.service };
      } catch (err) {
        console.error(`[Turbo] Scene ${sceneId} failed:`, err);
        return { sceneId, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    });

    const results = await Promise.all(promises);

    // 更新进度
    completedCount += batch.length;
    const progress = Math.floor(((existingSceneIds.size + completedCount) / scenes.length) * 100);

    await client
      .from('generation_tasks')
      .update({ progress })
      .eq('id', mainTaskId);

    // 收集结果
    for (const result of results) {
      if (result && 'videoUrl' in result && result.videoUrl) {
        videoUrls.push(result.videoUrl);
      }
    }
  }

  // 更新任务完成
  const totalTime = Date.now() - startTime;
  await client
    .from('generation_tasks')
    .update({
      status: 'completed',
      progress: 100,
      result_data: {
        video_count: videoUrls.length,
        total_time_ms: totalTime,
        avg_time_per_scene: scenesToGenerate.length > 0 ? Math.floor(totalTime / scenesToGenerate.length) : 0,
      },
      completed_at: new Date().toISOString(),
    })
    .eq('id', mainTaskId);

  // 更新项目
  await client
    .from('anime_projects')
    .update({
      video_urls: videoUrls,
      video_status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  console.log(`[Turbo] Completed: ${videoUrls.length} videos in ${totalTime}ms`);
}

export default router;
