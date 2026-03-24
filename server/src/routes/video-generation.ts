/**
 * 服务端文件：server/src/routes/video-generation.ts
 * 视频生成 API 路由
 * 
 * 端点：
 * - POST /api/v1/video/generate - 生成单个视频
 * - POST /api/v1/video/batch - 批量生成视频
 * - POST /api/v1/video/image-to-video - 图生视频
 * - POST /api/v1/video/sequential - 连续视频生成
 * - GET /api/v1/video/task/:taskId - 查询任务状态
 * - GET /api/v1/video/tasks - 获取所有任务
 * - DELETE /api/v1/video/task/:taskId - 取消任务
 * - GET /api/v1/video/models - 获取模型状态
 */

import express, { type Request, type Response } from 'express';
import { createVideoServiceFromRequest, getVideoGenerationService } from '../services/video-generation-service.js';
import type { VideoGenerationOptions } from '../services/video-generation-service.js';

const router = express.Router();

// Helper: 从Request提取headers
function extractHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers[key] = value;
    } else if (Array.isArray(value)) {
      headers[key] = value[0];
    }
  }
  return headers;
}

// ============================================================
// POST /api/v1/video/generate - 生成单个视频
// ============================================================

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      imageUrl,
      lastFrameUrl,
      duration = 5,
      ratio = '16:9',
      resolution = '720p',
      generateAudio = true,
      watermark = false,
      seed,
      camerafixed,
      callbackUrl,
    } = req.body;

    // 参数校验
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: prompt',
      });
    }

    // 从请求头提取自定义headers
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value[0];
      }
    }
    
    const videoService = createVideoServiceFromRequest({ headers });

    const options: VideoGenerationOptions = {
      prompt,
      imageUrl,
      lastFrameUrl,
      duration,
      ratio,
      resolution,
      generateAudio,
      watermark,
      seed,
      camerafixed,
      callbackUrl,
    };

    console.log('[VideoAPI] Generating video:', {
      prompt: prompt.substring(0, 50),
      hasImage: !!imageUrl,
      duration,
      ratio,
      resolution,
    });

    const result = await videoService.generateVideo(options);

    if (result.success) {
      res.json({
        success: true,
        data: {
          taskId: result.taskId,
          videoUrl: result.videoUrl,
          lastFrameUrl: result.lastFrameUrl,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        taskId: result.taskId,
      });
    }
  } catch (error: any) {
    console.error('[VideoAPI] Generate error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/v1/video/batch - 批量生成视频
// ============================================================

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { items, concurrency = 2 } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: items (数组)',
      });
    }

    const videoService = createVideoServiceFromRequest({ headers: extractHeaders(req) });

    console.log(`[VideoAPI] Batch generating ${items.length} videos, concurrency: ${concurrency}`);

    const results = await videoService.generateBatch(items, concurrency);

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      data: {
        total: items.length,
        succeeded: successCount,
        failed: items.length - successCount,
        results,
      },
    });
  } catch (error: any) {
    console.error('[VideoAPI] Batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/v1/video/image-to-video - 图生视频
// ============================================================

router.post('/image-to-video', async (req: Request, res: Response) => {
  try {
    const {
      imageUrl,
      prompt,
      lastFrameUrl,
      duration = 5,
      ratio = '16:9',
      resolution = '720p',
      generateAudio = true,
    } = req.body;

    if (!imageUrl || !prompt) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: imageUrl, prompt',
      });
    }

    const videoService = createVideoServiceFromRequest({ headers: extractHeaders(req) });

    console.log('[VideoAPI] Image-to-video:', {
      imageUrl: imageUrl.substring(0, 60),
      prompt: prompt.substring(0, 50),
      hasLastFrame: !!lastFrameUrl,
    });

    let result;

    if (lastFrameUrl) {
      // 首尾帧控制
      result = await videoService.imageToVideoWithEndFrame(
        imageUrl,
        lastFrameUrl,
        prompt,
        { duration, ratio, resolution, generateAudio }
      );
    } else {
      // 仅首帧
      result = await videoService.imageToVideo(imageUrl, prompt, {
        duration,
        ratio,
        resolution,
        generateAudio,
      });
    }

    if (result.success) {
      res.json({
        success: true,
        data: {
          taskId: result.taskId,
          videoUrl: result.videoUrl,
          lastFrameUrl: result.lastFrameUrl,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('[VideoAPI] Image-to-video error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/v1/video/sequential - 连续视频生成（保持一致性）
// ============================================================

router.post('/sequential', async (req: Request, res: Response) => {
  try {
    const {
      prompts,
      duration = 5,
      ratio = '16:9',
      resolution = '720p',
    } = req.body;

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: prompts (数组)',
      });
    }

    const videoService = createVideoServiceFromRequest({ headers: extractHeaders(req) });

    console.log(`[VideoAPI] Sequential generation: ${prompts.length} videos`);

    const results = await videoService.generateSequential(prompts, {
      duration,
      ratio,
      resolution,
    });

    const videoUrls = results
      .filter(r => r.success && r.videoUrl)
      .map(r => r.videoUrl);

    res.json({
      success: true,
      data: {
        total: prompts.length,
        videoUrls,
        results,
      },
    });
  } catch (error: any) {
    console.error('[VideoAPI] Sequential error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/v1/video/task/:taskId - 查询任务状态
// ============================================================

router.get('/task/:taskId', (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const videoService = getVideoGenerationService();

  const task = videoService.getTaskStatus(taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      error: '任务不存在',
    });
  }

  res.json({
    success: true,
    data: task,
  });
});

// ============================================================
// GET /api/v1/video/tasks - 获取所有任务
// ============================================================

router.get('/tasks', (req: Request, res: Response) => {
  const videoService = getVideoGenerationService();

  const tasks = videoService.getAllTasks();

  res.json({
    success: true,
    data: {
      total: tasks.length,
      tasks,
    },
  });
});

// ============================================================
// DELETE /api/v1/video/task/:taskId - 取消任务
// ============================================================

router.delete('/task/:taskId', (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const videoService = getVideoGenerationService();

  const cancelled = videoService.cancelTask(taskId);

  if (cancelled) {
    res.json({
      success: true,
      message: '任务已取消',
    });
  } else {
    res.status(400).json({
      success: false,
      error: '无法取消任务（可能已在处理中或已完成）',
    });
  }
});

// ============================================================
// GET /api/v1/video/models - 获取模型状态
// ============================================================

router.get('/models', (req: Request, res: Response) => {
  const videoService = getVideoGenerationService();

  const models = videoService.getModelStatus();

  res.json({
    success: true,
    data: models,
  });
});

// ============================================================
// SSE 流式生成状态（可选）
// ============================================================

router.get('/stream/:taskId', (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const videoService = getVideoGenerationService();

  // 设置 SSE 头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const task = videoService.getTaskStatus(taskId);

  if (!task) {
    res.write(`data: ${JSON.stringify({ error: '任务不存在' })}\n\n`);
    res.end();
    return;
  }

  // 发送初始状态
  res.write(`data: ${JSON.stringify(task)}\n\n`);

  // 监听进度更新
  const progressHandler = (data: { taskId: string; progress: number }) => {
    if (data.taskId === taskId) {
      res.write(`data: ${JSON.stringify({ progress: data.progress })}\n\n`);
    }
  };

  const completedHandler = (completedTask: any) => {
    if (completedTask.id === taskId) {
      res.write(`data: ${JSON.stringify({ status: 'completed', videoUrl: completedTask.videoUrl })}\n\n`);
      res.end();
    }
  };

  const failedHandler = (data: { taskId: string; error: string }) => {
    if (data.taskId === taskId) {
      res.write(`data: ${JSON.stringify({ status: 'failed', error: data.error })}\n\n`);
      res.end();
    }
  };

  videoService.on('task_progress', progressHandler);
  videoService.on('task_completed', completedHandler);
  videoService.on('task_failed', failedHandler);

  // 清理
  req.on('close', () => {
    videoService.off('task_progress', progressHandler);
    videoService.off('task_completed', completedHandler);
    videoService.off('task_failed', failedHandler);
  });
});

export default router;
