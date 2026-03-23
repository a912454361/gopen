/**
 * 动漫视频生成路由
 * 将动漫剧本转化为视频
 */

import express, { type Request, type Response } from 'express';
import { VideoGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

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

    // 异步生成所有场景
    generateProjectScenes({
      userId: user_id,
      projectId: anime_project_id,
      scenes,
      style: style || project.style || '日系动漫',
      resolution: resolution || privilege.resolution,
      mainTaskId,
      isPrivileged: privilege.isPrivileged,
    }).catch(err => {
      console.error('[AnimeVideo] Background scene generation error:', err);
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
 * 后台生成项目所有场景
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

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const scenePrompt = scene.imagePrompt || `${scene.location}，${scene.description}`;
    
    try {
      // 更新主任务进度
      const progress = Math.floor((i / scenes.length) * 100);
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
            scene_id: scene.sceneId,
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
            
            const fileName = `场景${i + 1}_${scene.location || '未命名'}.mp4`;
            await driveClient.syncGeneratedFile(response.videoUrl, fileName, 'anime');
          } catch (err) {
            console.error('[AnimeVideo] AliyunDrive sync error:', err);
          }
        }

        console.log(`[AnimeVideo] Scene ${i + 1}/${scenes.length} generated`);
      } else {
        errors.push(`Scene ${i + 1}: ${response.response?.error_message || 'Unknown error'}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Scene ${i + 1}: ${errorMsg}`);
      console.error(`[AnimeVideo] Scene ${i + 1} error:`, err);
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

  // 更新项目
  await client
    .from('anime_projects')
    .update({
      video_urls: videoUrls,
      video_status: errors.length === scenes.length ? 'failed' : 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  console.log(`[AnimeVideo] Project ${projectId} completed: ${videoUrls.length}/${scenes.length} videos`);
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

export default router;
