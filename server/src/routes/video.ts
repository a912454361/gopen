/**
 * 视频生成路由
 * 使用 coze-coding-dev-sdk 的 VideoGenerationClient
 */

import express, { type Request, type Response } from 'express';
import { VideoGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = express.Router();
const client = getSupabaseClient();

// 视频生成配置
const VIDEO_CONFIG = {
  model: 'doubao-seedance-1-5-pro-251215',
  defaultDuration: 5,
  maxDuration: 12,
  resolutions: ['480p', '720p', '1080p'] as const,
  ratios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', 'adaptive'] as const,
};

// 特权用户配置
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca'; // 郭涛

// 高质量选项（仅特权用户可用）
const PRIVILEGED_QUALITY_OPTIONS = ['480p', '720p', '1080p', '2K', '4K', '8K'];
const PRIVILEGED_EFFECTS = ['none', 'particle', 'cinematic', 'anime', 'realistic'];

/**
 * 检查用户是否有视频特权
 */
async function checkVideoPrivilege(userId: string): Promise<{
  isPrivileged: boolean;
  privileges?: {
    freeGenerate: boolean;
    unlimitedDuration: boolean;
    maxDuration: number;
    qualityOptions: string[];
    effects: string[];
    priority: string;
  };
}> {
  if (userId === PRIVILEGED_USER_ID) {
    return {
      isPrivileged: true,
      privileges: {
        freeGenerate: true,
        unlimitedDuration: true,
        maxDuration: 3600,
        qualityOptions: PRIVILEGED_QUALITY_OPTIONS,
        effects: PRIVILEGED_EFFECTS,
        priority: 'highest',
      },
    };
  }

  // 从数据库检查用户特权
  const { data: user } = await client
    .from('users')
    .select('special_privileges')
    .eq('id', userId)
    .single();

  if (user?.special_privileges?.video) {
    return {
      isPrivileged: true,
      privileges: user.special_privileges.video,
    };
  }

  return { isPrivileged: false };
}

/**
 * 视频生成接口
 * POST /api/v1/video/generate
 * Body: { prompt, duration?, ratio?, resolution?, user_id, model? }
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, duration, ratio, resolution, user_id, model, generate_audio, image_url, image_role, effect } = req.body;

    if (!prompt && !image_url) {
      return res.status(400).json({ error: 'Prompt or image_url is required' });
    }

    // 检查用户特权
    const privilegeCheck = await checkVideoPrivilege(user_id);
    const isPrivileged = privilegeCheck.isPrivileged;
    const privileges = privilegeCheck.privileges;

    console.log(`[Video] User ${user_id} privileged: ${isPrivileged}`, privileges);

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    
    // 创建视频生成客户端
    const config = new Config();
    const videoClient = new VideoGenerationClient(config, customHeaders);

    // 构建内容数组
    const contentItems: any[] = [];

    // 如果有图片URL，添加到内容中
    if (image_url) {
      contentItems.push({
        type: 'image_url',
        image_url: { url: image_url },
        role: image_role || 'first_frame',
      });
    }

    // 添加文本提示
    if (prompt) {
      contentItems.push({
        type: 'text',
        text: prompt,
      });
    }

    // 计算视频时长（秒）
    const requestedDuration = duration || VIDEO_CONFIG.defaultDuration;
    
    // 特权用户无时长限制，普通用户最大12秒
    const maxAllowedDuration = isPrivileged && privileges?.unlimitedDuration 
      ? privileges.maxDuration 
      : VIDEO_CONFIG.maxDuration;
    
    // 由于视频生成API只支持4-12秒，需要分段生成
    // 特权用户可以生成超长视频（后端自动分段）
    const actualDuration = Math.min(Math.max(requestedDuration, 4), maxAllowedDuration);

    // 特权用户可使用更高质量
    const allowedResolutions = isPrivileged && privileges?.qualityOptions 
      ? privileges.qualityOptions 
      : VIDEO_CONFIG.resolutions;
    const actualResolution = allowedResolutions.includes(resolution || '720p') 
      ? resolution || '720p' 
      : '720p';

    console.log(`[Video] Generating video for user ${user_id}, duration: ${actualDuration}s, resolution: ${actualResolution}, privileged: ${isPrivileged}`);

    // 调用视频生成API
    const response = await videoClient.videoGeneration(contentItems, {
      model: model || VIDEO_CONFIG.model,
      duration: actualDuration,
      ratio: (ratio as any) || '16:9',
      resolution: (actualResolution as any),
      generateAudio: generate_audio !== false, // 默认生成音频
      watermark: false,
      // 特权用户可添加特效
      ...(isPrivileged && effect && privileges?.effects?.includes(effect) && { effect }),
    });

    if (response.videoUrl) {
      // 扣除G点（特权用户免费）
      if (user_id && !isPrivileged) {
        const gPointsCost = actualDuration; // 1秒=1G点
        const { error: deductError } = await client.rpc('deduct_g_points', {
          p_user_id: user_id,
          p_amount: gPointsCost,
          p_description: `视频生成 ${actualDuration}秒`,
        });
        if (deductError) {
          console.error('[Video] Failed to deduct G points:', deductError);
        }
      }

      // 保存生成记录到数据库
      if (user_id) {
        const { error } = await client.from('video_generations').insert([{
          user_id,
          prompt: prompt || '',
          video_url: response.videoUrl,
          duration: actualDuration,
          model: model || VIDEO_CONFIG.model,
          status: 'completed',
          is_privileged: isPrivileged,
          effect: isPrivileged ? effect : null,
          created_at: new Date().toISOString(),
        }]);
        if (error) console.error('[Video] Failed to save record:', error);
      }

      console.log(`[Video] Video generated successfully: ${response.videoUrl}`);

      return res.json({
        success: true,
        data: {
          video_url: response.videoUrl,
          duration: actualDuration,
          model: model || VIDEO_CONFIG.model,
          task_id: response.response?.id,
          privileged: isPrivileged,
          charged: !isPrivileged,
        },
      });
    } else {
      console.error('[Video] Generation failed:', response.response?.error_message);
      
      return res.status(500).json({
        error: response.response?.error_message || 'Video generation failed',
      });
    }
  } catch (error) {
    console.error('[Video] Generate error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 长视频生成接口（分段生成）
 * POST /api/v1/video/generate-long
 * Body: { prompt, duration, ratio?, resolution?, user_id, model? }
 * 
 * 对于超过12秒的视频，分段生成并记录
 */
router.post('/generate-long', async (req: Request, res: Response) => {
  try {
    const { prompt, duration, ratio, resolution, user_id, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!duration || duration < 30) {
      return res.status(400).json({ error: 'Duration must be at least 30 seconds' });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const config = new Config();
    const videoClient = new VideoGenerationClient(config, customHeaders);

    // 计算需要生成的段数（每段最大12秒）
    const segmentDuration = VIDEO_CONFIG.maxDuration;
    const segments = Math.ceil(duration / segmentDuration);
    const actualDurationPerSegment = Math.min(duration / segments, segmentDuration);

    console.log(`[Video] Generating long video for user ${user_id}, total: ${duration}s, segments: ${segments}`);

    // 生成第一段
    const firstSegment = await videoClient.videoGeneration([
      { type: 'text', text: prompt }
    ], {
      model: model || VIDEO_CONFIG.model,
      duration: actualDurationPerSegment,
      ratio: (ratio as any) || '16:9',
      resolution: (resolution as any) || '720p',
      returnLastFrame: segments > 1, // 多段时需要返回最后一帧
    });

    if (!firstSegment.videoUrl) {
      return res.status(500).json({ error: 'First segment generation failed' });
    }

    const videoUrls: string[] = [firstSegment.videoUrl];
    let lastFrameUrl = firstSegment.lastFrameUrl;

    // 生成后续段
    for (let i = 1; i < segments && lastFrameUrl; i++) {
      const segmentPrompt = i === segments - 1 
        ? `${prompt} (conclusion)` 
        : prompt;

      const contentItems: any[] = [
        {
          type: 'image_url',
          image_url: { url: lastFrameUrl },
          role: 'first_frame',
        },
        { type: 'text', text: segmentPrompt },
      ];

      const segment = await videoClient.videoGeneration(contentItems, {
        model: model || VIDEO_CONFIG.model,
        duration: actualDurationPerSegment,
        ratio: (ratio as any) || '16:9',
        resolution: (resolution as any) || '720p',
        returnLastFrame: i < segments - 1,
      });

      if (segment.videoUrl) {
        videoUrls.push(segment.videoUrl);
        lastFrameUrl = segment.lastFrameUrl;
      } else {
        console.warn(`[Video] Segment ${i + 1} generation failed`);
        break;
      }
    }

    // 保存记录
    if (user_id) {
      await client.from('video_generations').insert([{
        user_id,
        prompt,
        video_url: videoUrls[0], // 主视频URL
        video_urls: videoUrls, // 所有段URL
        duration: duration,
        segments: videoUrls.length,
        model: model || VIDEO_CONFIG.model,
        status: 'completed',
        created_at: new Date().toISOString(),
      }]);
    }

    return res.json({
      success: true,
      data: {
        video_url: videoUrls[0],
        video_urls: videoUrls,
        total_duration: videoUrls.length * actualDurationPerSegment,
        segments: videoUrls.length,
        model: model || VIDEO_CONFIG.model,
      },
    });
  } catch (error) {
    console.error('[Video] Long video generate error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取视频生成记录
 * GET /api/v1/video/history/:userId
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const { data, error, count } = await client
      .from('video_generations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range((Number(page) - 1) * Number(limit), Number(page) * Number(limit) - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch history' });
    }

    res.json({
      success: true,
      data: {
        videos: data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('[Video] Fetch history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 获取支持的视频生成模型
 * GET /api/v1/video/models
 */
router.get('/models', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'doubao-seedance-1-5-pro-251215',
        name: 'Seedance 1.5 Pro',
        provider: 'ByteDance',
        description: '专业视频生成模型，支持文本生成视频、图片生成视频、音频同步',
        features: ['text-to-video', 'image-to-video', 'audio-generation', 'first-last-frame'],
        maxDuration: 12,
        resolutions: ['480p', '720p', '1080p'],
        ratios: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', 'adaptive'],
      },
    ],
  });
});

export default router;
