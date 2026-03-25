/**
 * UE 5.7.4 引擎特权用户路由
 * 多模型协同动漫创作 API
 */

import express, { type Request, type Response } from 'express';
import {
  createUEEngineService,
  UEEngineService,
} from '../services/ue-engine-service.js';

const router = express.Router();

// 特权用户列表（实际应从数据库获取）
const PRIVILEGED_USERS = new Set(['郭涛', 'guotao', 'GTao']);

// 检查特权用户中间件
function checkPrivilegedUser(req: Request, res: Response, next: Function) {
  const userName = req.headers['x-user-name'] as string || req.body.userName;
  
  if (!userName || !PRIVILEGED_USERS.has(userName)) {
    return res.status(403).json({
      error: '此功能仅对特权用户开放',
      message: '请联系管理员获取访问权限',
    });
  }
  
  next();
}

/**
 * 获取 UE 引擎状态
 * GET /api/v1/ue-engine/status
 */
router.get('/status', checkPrivilegedUser, (req: Request, res: Response) => {
  try {
    const customHeaders = extractHeaders(req);
    const service = createUEEngineService(customHeaders);
    
    const status = service.getEngineStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('[UEEngine] Status error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 创建动漫项目
 * POST /api/v1/ue-engine/project
 * Body: name, style, prompt, userName
 */
router.post('/project', checkPrivilegedUser, async (req: Request, res: Response) => {
  try {
    const { name, style, prompt } = req.body;
    
    if (!name || !prompt) {
      return res.status(400).json({ error: 'Name and prompt are required' });
    }
    
    console.log(`[UEEngine] Creating project for privileged user:`, name);
    
    const customHeaders = extractHeaders(req);
    const service = createUEEngineService(customHeaders);
    
    const project = await service.createAnimeProject(
      name,
      style || 'japanese',
      prompt
    );
    
    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('[UEEngine] Project creation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 协同渲染场景
 * POST /api/v1/ue-engine/render
 * Body: projectId, sceneId, userName
 */
router.post('/render', checkPrivilegedUser, async (req: Request, res: Response) => {
  try {
    const { projectId, sceneId } = req.body;
    
    if (!projectId || !sceneId) {
      return res.status(400).json({ error: 'ProjectId and sceneId are required' });
    }
    
    console.log(`[UEEngine] Starting collaborative render:`, sceneId);
    
    const customHeaders = extractHeaders(req);
    const service = createUEEngineService(customHeaders);
    
    const task = await service.collaborativeRender(projectId, sceneId);
    
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('[UEEngine] Render error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 超高质量渲染
 * POST /api/v1/ue-engine/ultra-render
 * Body: projectId, options, userName
 */
router.post('/ultra-render', checkPrivilegedUser, async (req: Request, res: Response) => {
  try {
    const { projectId, options } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'ProjectId is required' });
    }
    
    console.log(`[UEEngine] Starting ultra quality render:`, projectId);
    
    const customHeaders = extractHeaders(req);
    const service = createUEEngineService(customHeaders);
    
    const result = await service.ultraQualityRender(projectId, {
      resolution: options?.resolution || '4K',
      frameRate: options?.frameRate || 30,
      rayTracing: options?.rayTracing ?? true,
      motionBlur: options?.motionBlur ?? true,
      depthOfField: options?.depthOfField ?? true,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[UEEngine] Ultra render error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取渲染队列状态
 * GET /api/v1/ue-engine/queue
 */
router.get('/queue', checkPrivilegedUser, (req: Request, res: Response) => {
  try {
    const customHeaders = extractHeaders(req);
    const service = createUEEngineService(customHeaders);
    
    const queue = service.getRenderQueueStatus();
    
    res.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    console.error('[UEEngine] Queue status error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取模型提供商列表
 * GET /api/v1/ue-engine/providers
 */
router.get('/providers', checkPrivilegedUser, (req: Request, res: Response) => {
  try {
    const customHeaders = extractHeaders(req);
    const service = createUEEngineService(customHeaders);
    
    const status = service.getEngineStatus();
    
    res.json({
      success: true,
      data: {
        providers: status.providers,
        totalModels: status.providers.length,
        activeModels: status.providers.filter(p => p.status === 'working').length,
      },
    });
  } catch (error) {
    console.error('[UEEngine] Providers error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 检查用户特权状态
 * GET /api/v1/ue-engine/check-access
 */
router.get('/check-access', (req: Request, res: Response) => {
  const userName = req.headers['x-user-name'] as string;
  
  const hasAccess = userName && PRIVILEGED_USERS.has(userName);
  
  res.json({
    success: true,
    data: {
      hasAccess,
      userName: userName || null,
      message: hasAccess 
        ? '欢迎使用 UE 5.7.4 引擎创作系统' 
        : '此功能仅对特权用户开放，请联系管理员',
    },
  });
});

// Helper function
function extractHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const forwardedHeaders = [
    'x-request-id',
    'x-user-id',
    'x-user-name',
    'x-session-id',
    'authorization',
  ];

  for (const key of forwardedHeaders) {
    const value = req.headers[key];
    if (value) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  return headers;
}

export default router;
