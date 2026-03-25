import express, { type Request, type Response } from 'express';
import db from '../db.js';

const router = express.Router();

// 获取用户作品列表
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.from('works').select('*').eq('user_id', userId);
    if (type) {
      query = query.eq('project_type', type);
    }

    const { data: works, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const { count, error: countError } = await db
      .from('works')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    res.json({
      success: true,
      data: works,
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get works error:', error);
    res.status(500).json({ success: false, error: '获取作品列表失败' });
  }
});

// 获取单个作品详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: work, error } = await db
      .from('works')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !work) {
      res.status(404).json({ success: false, error: '作品不存在' });
      return;
    }

    res.json({ success: true, data: work });
  } catch (error) {
    console.error('Get work error:', error);
    res.status(500).json({ success: false, error: '获取作品详情失败' });
  }
});

// 创建作品
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      project_id,
      project_title,
      project_type,
      service_type,
      service_name,
      content,
      content_type = 'text',
      image_url,
    } = req.body;

    const { data: work, error } = await db
      .from('works')
      .insert({
        user_id,
        project_id,
        project_title,
        project_type,
        service_type,
        service_name,
        content,
        content_type,
        image_url,
      })
      .select()
      .single();

    if (error) throw error;

    // 更新用户统计 (使用upsert)
    const { error: statsError } = await db
      .from('user_stats')
      .upsert(
        { user_id, total_works: 1, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    // 忽略统计更新的错误，不影响主流程
    if (statsError) {
      console.error('Update stats error:', statsError);
    }

    res.json({ success: true, data: work });
  } catch (error) {
    console.error('Create work error:', error);
    res.status(500).json({ success: false, error: '保存作品失败' });
  }
});

// 更新作品
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, image_url, is_public } = req.body;

    const { data: work, error } = await db
      .from('works')
      .update({
        content,
        image_url,
        is_public,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !work) {
      res.status(404).json({ success: false, error: '作品不存在' });
      return;
    }

    res.json({ success: true, data: work });
  } catch (error) {
    console.error('Update work error:', error);
    res.status(500).json({ success: false, error: '更新作品失败' });
  }
});

// 删除作品
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: work, error: fetchError } = await db
      .from('works')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !work) {
      res.status(404).json({ success: false, error: '作品不存在' });
      return;
    }

    const { error: deleteError } = await db.from('works').delete().eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete work error:', error);
    res.status(500).json({ success: false, error: '删除作品失败' });
  }
});

// 获取公开作品（社区）
router.get('/public/list', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, sort = 'latest' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db
      .from('works')
      .select('*')
      .eq('is_public', true)
      .not('content', 'is', null);

    if (type) {
      query = query.eq('project_type', type);
    }

    // 排序
    if (sort === 'popular') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: works, error } = await query.range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const { count, error: countError } = await db
      .from('works')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    if (countError) throw countError;

    res.json({
      success: true,
      data: works,
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get public works error:', error);
    res.status(500).json({ success: false, error: '获取公开作品失败' });
  }
});

// 点赞作品
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    // 检查是否已点赞
    const { data: existing, error: fetchError } = await db
      .from('work_likes')
      .select('*')
      .eq('work_id', id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      // 取消点赞
      await db.from('work_likes').delete().eq('work_id', id).eq('user_id', user_id);
      
      // 获取当前点赞数并减1
      const { data: work } = await db.from('works').select('likes_count').eq('id', id).single();
      await db.from('works').update({ likes_count: Math.max((work?.likes_count || 1) - 1, 0) }).eq('id', id);
      
      res.json({ success: true, liked: false });
    } else {
      // 添加点赞
      await db.from('work_likes').insert({ work_id: id, user_id });
      
      // 获取当前点赞数并加1
      const { data: work } = await db.from('works').select('likes_count').eq('id', id).single();
      await db.from('works').update({ likes_count: (work?.likes_count || 0) + 1 }).eq('id', id);
      
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Like work error:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

export default router;
