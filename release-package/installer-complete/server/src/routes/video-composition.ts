/**
 * 服务端文件：server/src/routes/video-composition.ts
 * 视频合成API路由
 * 
 * 功能：
 * - 一集视频完整合成
 * - 任务状态查询
 * - 配置预设
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { 
  getVideoCompositionService,
  DEFAULT_EPISODE_CONFIG
} from '../services/video-composition-service.js';
import type { 
  EpisodeConfig, 
  SceneData
} from '../services/video-composition-service.js';

const router = Router();

// ============================================================
// 类型定义
// ============================================================

interface ComposeEpisodeRequest {
  episodeNumber: number;
  title: string;
  scenes: Array<{
    description: string;
    subtitle?: string;
    duration?: number;
  }>;
  config?: Partial<EpisodeConfig>;
}

// ============================================================
// API 路由
// ============================================================

/**
 * @api {post} /api/v1/compose/episode 合成一集完整视频
 * @apiName ComposeEpisode
 * @apiGroup VideoComposition
 * 
 * @apiBody {number} episodeNumber 集数
 * @apiBody {string} title 标题
 * @apiBody {Array} scenes 场景列表
 * @apiBody {Object} [config] 配置选项
 * 
 * @apiSuccess {boolean} success 是否成功
 * @apiSuccess {string} taskId 任务ID
 */
router.post('/episode', async (req: Request, res: Response) => {
  try {
    const { episodeNumber, title, scenes, config } = req.body as ComposeEpisodeRequest;

    // 参数验证
    if (!episodeNumber || !title || !scenes || !Array.isArray(scenes)) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：episodeNumber, title, scenes',
      });
    }

    if (scenes.length === 0) {
      return res.status(400).json({
        success: false,
        error: '场景列表不能为空',
      });
    }

    const service = getVideoCompositionService();

    // 生成场景视频URL（使用mock-video-service）
    const { getSceneVideo } = await import('../services/mock-video-service.js');
    
    const sceneDataList: SceneData[] = scenes.map((scene, index) => {
      const { videoUrl } = getSceneVideo(scene.description);
      return {
        id: crypto.randomUUID(),
        order: index,
        videoUrl,
        duration: scene.duration || 30,
        description: scene.description,
        subtitle: scene.subtitle,
      };
    });

    // 合并配置
    const finalConfig: Partial<EpisodeConfig> = {
      episodeNumber,
      title,
      ...config,
    };

    // 创建合成任务
    const result = await service.composeEpisode(sceneDataList, finalConfig);

    res.json({
      success: result.success,
      taskId: result.taskId,
      message: result.success ? '合成任务已创建，请通过任务ID查询进度' : result.error,
    });
  } catch (error: any) {
    console.error('[VideoComposition] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @api {post} /api/v1/compose/episode-sync 同步合成一集视频（等待完成）
 * @apiName ComposeEpisodeSync
 * @apiGroup VideoComposition
 * 
 * @apiSuccess {boolean} success 是否成功
 * @apiSuccess {string} taskId 任务ID
 * @apiSuccess {string} outputUrl 输出文件路径
 * @apiSuccess {number} duration 处理时长（毫秒）
 * @apiSuccess {number} fileSize 文件大小（字节）
 */
router.post('/episode-sync', async (req: Request, res: Response) => {
  try {
    const { episodeNumber, title, scenes, config } = req.body as ComposeEpisodeRequest;

    // 参数验证
    if (!episodeNumber || !title || !scenes || !Array.isArray(scenes)) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：episodeNumber, title, scenes',
      });
    }

    const service = getVideoCompositionService();

    // 生成场景视频URL
    const { getSceneVideo } = await import('../services/mock-video-service.js');
    
    const sceneDataList: SceneData[] = scenes.map((scene, index) => {
      const { videoUrl } = getSceneVideo(scene.description);
      return {
        id: crypto.randomUUID(),
        order: index,
        videoUrl,
        duration: scene.duration || 30,
        description: scene.description,
        subtitle: scene.subtitle,
      };
    });

    // 合并配置
    const finalConfig: Partial<EpisodeConfig> = {
      episodeNumber,
      title,
      ...config,
    };

    // 同步合成
    const result = await service.composeEpisodeSync(sceneDataList, finalConfig);

    res.json({
      success: result.success,
      taskId: result.taskId,
      outputUrl: result.outputUrl,
      duration: result.duration,
      fileSize: result.fileSize,
      error: result.error,
    });
  } catch (error: any) {
    console.error('[VideoComposition] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @api {get} /api/v1/compose/task/:taskId 查询任务状态
 * @apiName GetTaskStatus
 * @apiGroup VideoComposition
 * 
 * @apiParam {string} taskId 任务ID
 * 
 * @apiSuccess {boolean} success 是否成功
 * @apiSuccess {Object} task 任务详情
 */
router.get('/task/:taskId', (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId as string;
    const service = getVideoCompositionService();
    const task = service.getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: '任务不存在',
      });
    }

    res.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        progress: task.progress,
        currentStep: task.currentStep,
        outputUrl: task.outputUrl,
        error: task.error,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        config: task.config,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @api {get} /api/v1/compose/tasks 获取所有任务
 * @apiName GetAllTasks
 * @apiGroup VideoComposition
 */
router.get('/tasks', (req: Request, res: Response) => {
  try {
    const service = getVideoCompositionService();
    const tasks = service.getAllTasks();

    res.json({
      success: true,
      tasks: tasks.map(t => ({
        id: t.id,
        status: t.status,
        progress: t.progress,
        currentStep: t.currentStep,
        outputUrl: t.outputUrl,
        error: t.error,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @api {get} /api/v1/compose/presets 获取配置预设
 * @apiName GetPresets
 * @apiGroup VideoComposition
 */
router.get('/presets', (req: Request, res: Response) => {
  res.json({
    success: true,
    presets: {
      default: DEFAULT_EPISODE_CONFIG,
      shortVideo: {
        ...DEFAULT_EPISODE_CONFIG,
        introDuration: 5,
        mainDuration: 60,
        outroDuration: 5,
        sceneCount: 10,
        sceneDuration: 6,
      },
      documentary: {
        ...DEFAULT_EPISODE_CONFIG,
        introDuration: 15,
        mainDuration: 3000,
        outroDuration: 15,
        sceneCount: 100,
        sceneDuration: 30,
        enableBGM: false,
      },
    },
  });
});

/**
 * @api {post} /api/v1/compose/demo 演示合成（简化版）
 * @apiName DemoCompose
 * @apiGroup VideoComposition
 * 
 * @apiBody {number} [episodeNumber=1] 集数
 * @apiBody {string} [title="剑破苍穹"] 标题
 * @apiBody {number} [sceneCount=5] 场景数量（演示用，默认5个）
 */
router.post('/demo', async (req: Request, res: Response) => {
  try {
    const { 
      episodeNumber = 1, 
      title = '剑破苍穹',
      sceneCount = 5 
    } = req.body;

    // 生成演示场景
    const demoScenes = [];
    for (let i = 0; i < sceneCount; i++) {
      const sceneDescriptions = [
        '清晨，青阳城林家杂役房，少年林渊擦拭锈剑',
        '黄昏，后山破庙，林渊打开古朴剑匣，金色光芒闪烁',
        '正午，林家演武场，剑气纵横，少年持剑而立',
        '夜幕，悬崖之巅，林渊面对狂风，剑意暴涨',
        '黎明，竹林深处，林渊挥剑练习，剑影重重',
        '午后，藏书阁，林渊翻阅古籍，发现秘密',
        '傍晚，河边小屋，林渊疗伤修炼',
        '深夜，密室之中，林渊突破境界',
        '清晨，山门广场，林渊准备出发',
        '黄昏，远方城池，林渊踏上征程',
      ];
      
      demoScenes.push({
        description: sceneDescriptions[i % sceneDescriptions.length],
        subtitle: `场景${i + 1}`,
        duration: 10, // 演示用，每个场景10秒
      });
    }

    const service = getVideoCompositionService();

    // 生成场景视频URL
    const { getSceneVideo } = await import('../services/mock-video-service.js');
    
    const sceneDataList: SceneData[] = demoScenes.map((scene, index) => {
      const { videoUrl } = getSceneVideo(scene.description);
      return {
        id: crypto.randomUUID(),
        order: index,
        videoUrl,
        duration: scene.duration || 10,
        description: scene.description,
        subtitle: scene.subtitle,
      };
    });

    // 演示配置
    const demoConfig: Partial<EpisodeConfig> = {
      episodeNumber,
      title,
      introDuration: 3,
      mainDuration: sceneCount * 10,
      outroDuration: 3,
      sceneDuration: 10,
      transitionDuration: 0.5,
      resolution: '1080p', // 演示用1080p，更快
    };

    // 创建合成任务
    const result = await service.composeEpisode(sceneDataList, demoConfig);

    res.json({
      success: result.success,
      taskId: result.taskId,
      message: result.success ? '演示合成任务已创建' : result.error,
      config: demoConfig,
      scenes: demoScenes,
    });
  } catch (error: any) {
    console.error('[VideoComposition] Demo error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
