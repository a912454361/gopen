/**
 * 并行视频生成服务
 * 支持同时生成多个视频，大幅提升生成速度
 */

import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const client = getSupabaseClient();

// 并行生成配置
export const PARALLEL_CONFIG = {
  // 默认并发数（特权用户5个，普通用户3个）
  defaultConcurrency: 3,
  privilegedConcurrency: 5,
  // 视频生成模型
  model: 'doubao-seedance-1-5-pro-251215',
  // 默认参数
  defaultDuration: 5,
  defaultRatio: '16:9' as const,
};

// 生成任务状态
interface SceneTask {
  sceneId: number;
  scene: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

// 进度回调
type ProgressCallback = (progress: {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  percent: number;
  currentScenes: number[];
  estimatedTimeRemaining?: number;
}) => void;

/**
 * 并行生成视频
 * 使用并发控制同时生成多个视频
 */
export async function parallelGenerateVideos(params: {
  userId: string;
  projectId: string;
  scenes: any[];
  style: string;
  resolution: string;
  mainTaskId: string;
  isPrivileged: boolean;
  concurrency?: number;
  onProgress?: ProgressCallback;
}): Promise<{
  success: number;
  failed: number;
  videoUrls: string[];
  errors: string[];
  totalTime: number;
}> {
  const {
    userId,
    projectId,
    scenes,
    style,
    resolution,
    mainTaskId,
    isPrivileged,
    concurrency = isPrivileged ? PARALLEL_CONFIG.privilegedConcurrency : PARALLEL_CONFIG.defaultConcurrency,
    onProgress,
  } = params;

  const config = new Config();
  const videoClient = new VideoGenerationClient(config, {});

  const startTime = Date.now();
  
  // 获取已存在的场景视频
  const { data: existingVideos } = await client
    .from('anime_scene_videos')
    .select('scene_id, video_url')
    .eq('project_id', projectId);
  
  const existingSceneIds = new Set((existingVideos || []).map(v => v.scene_id));
  const existingVideoMap = new Map((existingVideos || []).map(v => [v.scene_id, v.video_url]));
  
  console.log(`[ParallelVideo] Found ${existingSceneIds.size} existing videos, will skip them`);

  // 过滤出需要生成的场景
  const scenesToGenerate = scenes.filter((scene, index) => {
    const sceneId = scene.sceneId || index + 1;
    return !existingSceneIds.has(sceneId);
  });

  console.log(`[ParallelVideo] Generating ${scenesToGenerate.length} scenes with concurrency ${concurrency}`);

  // 任务队列
  const tasks: SceneTask[] = scenesToGenerate.map((scene, index) => ({
    sceneId: scene.sceneId || scenes.indexOf(scene) + 1,
    scene,
    status: 'pending',
  }));

  const completedVideos: string[] = [...(existingVideos || []).map(v => v.video_url)];
  const errors: string[] = [];
  let completedCount = existingSceneIds.size;

  // 并发执行器
  async function processTask(task: SceneTask): Promise<void> {
    task.status = 'processing';
    task.startTime = Date.now();

    const scenePrompt = task.scene.imagePrompt || 
      `${task.scene.location}，${task.scene.description || ''}，${task.scene.particles || ''}`;

    try {
      const enhancedPrompt = `${style}风格动漫, ${scenePrompt}，高质量动画，流畅动作，精美画面`;

      const response = await videoClient.videoGeneration(
        [{ type: 'text', text: enhancedPrompt }],
        {
          model: PARALLEL_CONFIG.model,
          duration: PARALLEL_CONFIG.defaultDuration,
          ratio: PARALLEL_CONFIG.defaultRatio,
          resolution: resolution as any,
          generateAudio: true,
          watermark: false,
        }
      );

      if (response.videoUrl) {
        task.videoUrl = response.videoUrl;
        task.status = 'completed';
        task.endTime = Date.now();

        // 保存到数据库
        await client
          .from('anime_scene_videos')
          .insert([{
            project_id: projectId,
            scene_id: task.sceneId,
            video_url: response.videoUrl,
            duration: PARALLEL_CONFIG.defaultDuration,
            created_at: new Date().toISOString(),
          }]);

        completedVideos.push(response.videoUrl);
        console.log(`[ParallelVideo] Scene ${task.sceneId} completed in ${task.endTime - task.startTime}ms`);
      } else {
        throw new Error(response.response?.error_message || 'No video URL returned');
      }
    } catch (err) {
      task.status = 'failed';
      task.error = err instanceof Error ? err.message : 'Unknown error';
      task.endTime = Date.now();
      errors.push(`Scene ${task.sceneId}: ${task.error}`);
      console.error(`[ParallelVideo] Scene ${task.sceneId} failed:`, task.error);
    }

    completedCount++;
    
    // 更新进度
    const processingTasks = tasks.filter(t => t.status === 'processing');
    const percent = Math.floor((completedCount / scenes.length) * 100);
    
    await client
      .from('generation_tasks')
      .update({ progress: percent })
      .eq('id', mainTaskId);

    onProgress?.({
      total: scenes.length,
      completed: completedCount,
      processing: processingTasks.length,
      failed: errors.length,
      percent,
      currentScenes: processingTasks.map(t => t.sceneId),
      estimatedTimeRemaining: estimateTimeRemaining(tasks, completedCount, startTime),
    });
  }

  // 并发控制执行
  async function runWithConcurrency() {
    const pending = [...tasks];
    const executing: Promise<void>[] = [];

    while (pending.length > 0 || executing.length > 0) {
      // 填充执行队列
      while (executing.length < concurrency && pending.length > 0) {
        const task = pending.shift()!;
        const promise = processTask(task).then(() => {
          executing.splice(executing.indexOf(promise), 1);
        });
        executing.push(promise);
      }

      // 等待任意一个完成
      if (executing.length > 0) {
        await Promise.race(executing);
      }
    }
  }

  await runWithConcurrency();

  const totalTime = Date.now() - startTime;

  // 更新主任务状态
  await client
    .from('generation_tasks')
    .update({
      status: errors.length === scenesToGenerate.length ? 'failed' : 'completed',
      progress: 100,
      result_data: {
        video_count: completedVideos.length,
        video_urls: completedVideos,
        errors: errors.length > 0 ? errors : undefined,
        total_time_ms: totalTime,
        concurrency_used: concurrency,
      },
      completed_at: new Date().toISOString(),
    })
    .eq('id', mainTaskId);

  // 更新项目
  await client
    .from('anime_projects')
    .update({
      video_urls: completedVideos,
      video_status: errors.length === scenesToGenerate.length ? 'failed' : 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  console.log(`[ParallelVideo] Completed: ${completedVideos.length}/${scenes.length} videos in ${totalTime}ms`);

  return {
    success: completedVideos.length - existingSceneIds.size,
    failed: errors.length,
    videoUrls: completedVideos,
    errors,
    totalTime,
  };
}

/**
 * 估算剩余时间
 */
function estimateTimeRemaining(
  tasks: SceneTask[],
  completedCount: number,
  startTime: number
): number | undefined {
  const completed = tasks.filter(t => t.status === 'completed');
  if (completed.length < 2) return undefined;

  const avgTime = completed.reduce((sum, t) => {
    return sum + ((t.endTime || 0) - (t.startTime || 0));
  }, 0) / completed.length;

  const remaining = tasks.length - completedCount;
  return Math.round(avgTime * remaining / 1000); // 秒
}

/**
 * 批量提交视频生成任务
 * 不等待结果，仅提交任务
 */
export async function batchSubmitVideoTasks(params: {
  userId: string;
  projectId: string;
  scenes: any[];
  style: string;
  resolution: string;
}): Promise<{
  submittedCount: number;
  taskIds: string[];
}> {
  const { userId, projectId, scenes, style, resolution } = params;

  const config = new Config();
  const videoClient = new VideoGenerationClient(config, {});

  const taskIds: string[] = [];
  let submittedCount = 0;

  // 获取已存在的场景视频
  const { data: existingVideos } = await client
    .from('anime_scene_videos')
    .select('scene_id')
    .eq('project_id', projectId);
  
  const existingSceneIds = new Set((existingVideos || []).map(v => v.scene_id));

  // 批量提交（并发5个）
  const batchSize = 5;
  for (let i = 0; i < scenes.length; i += batchSize) {
    const batch = scenes.slice(i, i + batchSize);
    
    const promises = batch.map(async (scene, batchIndex) => {
      const sceneId = scene.sceneId || i + batchIndex + 1;
      
      if (existingSceneIds.has(sceneId)) {
        return null;
      }

      const scenePrompt = scene.imagePrompt || 
        `${scene.location}，${scene.description || ''}，${scene.particles || ''}`;
      const enhancedPrompt = `${style}风格动漫, ${scenePrompt}，高质量动画`;

      try {
        // 创建任务记录
        const { data: taskData } = await client
          .from('generation_tasks')
          .insert([{
            user_id: userId,
            task_type: 'anime',
            prompt: enhancedPrompt,
            model: PARALLEL_CONFIG.model,
            parameters: { project_id: projectId, scene_id: sceneId },
            status: 'pending',
          }])
          .select('id')
          .single();

        if (taskData?.id) {
          taskIds.push(taskData.id);
          submittedCount++;
        }

        return taskData?.id;
      } catch (err) {
        console.error(`[BatchSubmit] Scene ${sceneId} submit error:`, err);
        return null;
      }
    });

    await Promise.all(promises);
  }

  console.log(`[BatchSubmit] Submitted ${submittedCount} tasks for project ${projectId}`);

  return {
    submittedCount,
    taskIds,
  };
}

/**
 * 快速生成单个视频（用于即时预览）
 */
export async function quickGenerateVideo(params: {
  userId: string;
  prompt: string;
  style?: string;
  duration?: number;
  resolution?: string;
}): Promise<{
  videoUrl: string;
  taskId: string;
}> {
  const { userId, prompt, style = '国风动漫', duration = 5, resolution = '1080p' } = params;

  const config = new Config();
  const videoClient = new VideoGenerationClient(config, {});

  const enhancedPrompt = `${style}风格, ${prompt}，高质量动画`;

  // 创建任务记录
  const { data: taskData } = await client
    .from('generation_tasks')
    .insert([{
      user_id: userId,
      task_type: 'anime',
      prompt: enhancedPrompt,
      model: PARALLEL_CONFIG.model,
      status: 'processing',
      started_at: new Date().toISOString(),
    }])
    .select('id')
    .single();

  const taskId = taskData?.id;

  try {
    const response = await videoClient.videoGeneration(
      [{ type: 'text', text: enhancedPrompt }],
      {
        model: PARALLEL_CONFIG.model,
        duration,
        ratio: PARALLEL_CONFIG.defaultRatio,
        resolution: resolution as any,
        generateAudio: true,
        watermark: false,
      }
    );

    if (response.videoUrl) {
      // 更新任务状态
      await client
        .from('generation_tasks')
        .update({
          status: 'completed',
          progress: 100,
          result_url: response.videoUrl,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      return { videoUrl: response.videoUrl, taskId };
    } else {
      throw new Error('No video URL returned');
    }
  } catch (err) {
    // 更新任务失败状态
    await client
      .from('generation_tasks')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    throw err;
  }
}
