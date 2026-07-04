/**
 * 项目管理API
 * 功能：项目创建、保存、列表、状态更新、素材管理
 */

import express, { type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { S3Storage } from 'coze-coding-dev-sdk';
import multer from 'multer';

const router = express.Router();
const client = getSupabaseClient();

// 初始化对象存储（用于项目素材）
const s3Storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 配置 multer 用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 限制50MB
});

// 项目类型配置
const PROJECT_TYPES = [
  '古风场景', '国风热血', '唯美风', '仙侠唯美',
  '水墨场景', '古风角色', '国风城池', '仙侠场景', '古风剧情',
];

// 项目状态
const PROJECT_STATUS = ['pending', 'active', 'completed', 'archived'];

// ==================== 项目CRUD ====================

/**
 * 创建项目
 * POST /api/v1/projects
 * Body: { userId, title, type, description?, coverImage?, settings? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, title, type, description, coverImage, settings } = req.body;

    if (!userId || !title || !type) {
      return res.status(400).json({ error: 'userId, title and type are required' });
    }

    if (!PROJECT_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid project type. Valid types: ${PROJECT_TYPES.join(', ')}` });
    }

    const { data, error } = await client
      .from('projects')
      .insert([{
        user_id: userId,
        title,
        type,
        description: description || '',
        cover_image: coverImage,
        settings: settings || {},
        status: 'pending',
        progress: 0,
        assets_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      return res.status(500).json({ error: 'Failed to create project' });
    }

    // 记录活动
    await client.from('project_activities').insert([{
      project_id: data.id,
      user_id: userId,
      action: 'create',
      description: `创建项目: ${title}`,
      created_at: new Date().toISOString(),
    }]);

    res.json({
      success: true,
      data,
      message: '项目创建成功',
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 获取项目列表
 * GET /api/v1/projects
 * Query: userId (required), status?, type?, page?, limit?
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, status, type, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let query = client
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // 按状态过滤
    if (status && PROJECT_STATUS.includes(status as string)) {
      query = query.eq('status', status);
    }

    // 按类型过滤
    if (type && PROJECT_TYPES.includes(type as string)) {
      query = query.eq('type', type);
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Get projects error:', error);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }

    // 计算统计信息
    const stats = await calculateProjectStats(userId as string);

    res.json({
      success: true,
      data: {
        projects: data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit)),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 获取单个项目详情
 * GET /api/v1/projects/:projectId
 */
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // 获取项目素材
    const { data: assets } = await client
      .from('project_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // 获取最近活动
    const { data: activities } = await client
      .from('project_activities')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        project: data,
        assets: assets || [],
        activities: activities || [],
      },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 更新项目
 * PUT /api/v1/projects/:projectId
 * Body: { title?, description?, status?, progress?, coverImage?, settings? }
 */
router.put('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, progress, coverImage, settings, userId } = req.body;

    // 构建更新对象
    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined && PROJECT_STATUS.includes(status)) updateData.status = status;
    if (progress !== undefined) updateData.progress = Math.min(100, Math.max(0, progress));
    if (coverImage !== undefined) updateData.cover_image = coverImage;
    if (settings !== undefined) updateData.settings = settings;

    const { data, error } = await client
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update project' });
    }

    // 记录活动
    if (userId) {
      await client.from('project_activities').insert([{
        project_id: projectId,
        user_id: userId,
        action: 'update',
        description: `更新项目: ${Object.keys(updateData).filter(k => k !== 'updated_at').join(', ')}`,
        created_at: new Date().toISOString(),
      }]);
    }

    res.json({
      success: true,
      data,
      message: '项目更新成功',
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 删除项目
 * DELETE /api/v1/projects/:projectId
 */
router.delete('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.query;

    // 先删除素材（级联删除会自动处理，但手动删除更安全）
    await client.from('project_assets').delete().eq('project_id', projectId);
    await client.from('project_activities').delete().eq('project_id', projectId);

    // 删除项目
    const { error } = await client.from('projects').delete().eq('id', projectId);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete project' });
    }

    res.json({
      success: true,
      message: '项目已删除',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 更新项目进度（根据素材自动计算）
 * POST /api/v1/projects/:projectId/update-progress
 */
router.post('/:projectId/update-progress', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // 获取项目素材数量
    const { count: assetsCount } = await client
      .from('project_assets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    // 获取项目当前状态
    const { data: project } = await client
      .from('projects')
      .select('type, assets_count')
      .eq('id', projectId)
      .single();

    // 根据素材数量计算进度（简单算法，可根据需求调整）
    // 假设每个类型项目完成需要不同数量的素材
    const targetAssets: Record<string, number> = {
      '古风场景': 50,
      '国风热血': 60,
      '唯美风': 40,
      '仙侠唯美': 50,
      '水墨场景': 30,
      '古风角色': 40,
      '国风城池': 70,
      '仙侠场景': 50,
      '古风剧情': 30,
    };

    const target = targetAssets[project?.type || ''] || 50;
    const progress = Math.min(100, Math.round(((assetsCount || 0) / target) * 100));

    // 确定状态
    let status = 'pending';
    if (progress >= 100) {
      status = 'completed';
    } else if (progress > 0) {
      status = 'active';
    }

    // 更新项目
    const { data, error } = await client
      .from('projects')
      .update({
        progress,
        status,
        assets_count: assetsCount || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update progress' });
    }

    res.json({
      success: true,
      data: {
        progress,
        status,
        assetsCount,
      },
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== 素材管理 ====================

/**
 * 添加素材到项目
 * POST /api/v1/projects/:projectId/assets
 * Body: { userId, type, name?, url?, content?, metadata? }
 */
router.post('/:projectId/assets', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { userId, type, name, url, content, metadata } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required' });
    }

    const { data, error } = await client
      .from('project_assets')
      .insert([{
        project_id: projectId,
        user_id: userId,
        type,
        name: name || `${type}_${Date.now()}`,
        url,
        content,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to add asset' });
    }

    // 更新项目进度
    await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091'}/api/v1/projects/${projectId}/update-progress`, {
      method: 'POST',
    });

    // 记录活动
    await client.from('project_activities').insert([{
      project_id: projectId,
      user_id: userId,
      action: 'add_asset',
      description: `添加素材: ${name || type}`,
      metadata: { assetId: data.id, assetType: type },
      created_at: new Date().toISOString(),
    }]);

    res.json({
      success: true,
      data,
      message: '素材添加成功',
    });
  } catch (error) {
    console.error('Add asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 上传素材文件
 * POST /api/v1/projects/:projectId/assets/upload
 */
router.post('/:projectId/assets/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { userId, type, name } = req.body;
    const file = req.file;

    if (!userId || !file) {
      return res.status(400).json({ error: 'userId and file are required' });
    }

    // 上传到对象存储
    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const fileName = `projects/${projectId}/${type || 'assets'}/${Date.now()}.${fileExtension}`;

    const objectKey = await s3Storage.uploadFile({
      fileContent: file.buffer,
      fileName,
      contentType: file.mimetype,
    });

    // 生成签名URL
    const signedUrl = await s3Storage.generatePresignedUrl({ key: objectKey, expireTime: 86400 * 30 });

    // 保存素材记录
    const { data, error } = await client
      .from('project_assets')
      .insert([{
        project_id: projectId,
        user_id: userId,
        type: type || 'file',
        name: name || file.originalname,
        url: signedUrl,
        metadata: {
          objectKey,
          mimeType: file.mimetype,
          size: file.size,
        },
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to save asset' });
    }

    // 更新项目进度
    await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091'}/api/v1/projects/${projectId}/update-progress`, {
      method: 'POST',
    });

    res.json({
      success: true,
      data: {
        ...data,
        url: signedUrl, // 返回可访问的URL
      },
      message: '文件上传成功',
    });
  } catch (error) {
    console.error('Upload asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 获取项目素材列表
 * GET /api/v1/projects/:projectId/assets
 */
router.get('/:projectId/assets', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type } = req.query;

    let query = client
      .from('project_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch assets' });
    }

    res.json({
      success: true,
      data: { assets: data },
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 删除素材
 * DELETE /api/v1/projects/:projectId/assets/:assetId
 */
router.delete('/:projectId/assets/:assetId', async (req: Request, res: Response) => {
  try {
    const { projectId, assetId } = req.params;

    const { error } = await client
      .from('project_assets')
      .delete()
      .eq('id', assetId)
      .eq('project_id', projectId);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete asset' });
    }

    // 更新项目进度
    await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091'}/api/v1/projects/${projectId}/update-progress`, {
      method: 'POST',
    });

    res.json({
      success: true,
      message: '素材已删除',
    });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== 辅助函数 ====================

/**
 * 计算项目统计信息
 */
async function calculateProjectStats(userId: string) {
  const { data: projects } = await client
    .from('projects')
    .select('status')
    .eq('user_id', userId);

  const stats = {
    total: projects?.length || 0,
    active: 0,
    pending: 0,
    completed: 0,
    archived: 0,
  };

  projects?.forEach(p => {
    if (p.status === 'active') stats.active++;
    else if (p.status === 'pending') stats.pending++;
    else if (p.status === 'completed') stats.completed++;
    else if (p.status === 'archived') stats.archived++;
  });

  return stats;
}

/**
 * 获取项目类型列表
 * GET /api/v1/projects/types/list
 */
router.get('/types/list', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: PROJECT_TYPES.map(type => ({
      id: type,
      name: type,
    })),
  });
});

/**
 * 获取项目活动记录
 * GET /api/v1/projects/:projectId/activities
 */
router.get('/:projectId/activities', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { data, error, count } = await client
      .from('project_activities')
      .select('*', { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }

    res.json({
      success: true,
      data: {
        activities: data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
