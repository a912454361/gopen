import express, { type Request, type Response } from 'express';
import db from '../db.js';
import { startScheduler, stopScheduler, executePromoTask } from '../promo-scheduler.js';
import { 
  generateSitemap, 
  generateRobotsTxt, 
  submitToSearchEngine, 
  submitAllLinksToSearchEngines,
  getSEOHistory 
} from '../seo-submitter.js';

const router = express.Router();

// ==================== 定时任务调度 ====================

// 启动调度器
router.post('/scheduler/start', async (req: Request, res: Response) => {
  try {
    startScheduler();
    res.json({ success: true, message: '调度器已启动' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 停止调度器
router.post('/scheduler/stop', async (req: Request, res: Response) => {
  try {
    stopScheduler();
    res.json({ success: true, message: '调度器已停止' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 调度器状态
router.get('/scheduler/status', async (req: Request, res: Response) => {
  try {
    const { data: tasks } = await db
      .from('promo_tasks')
      .select('id, name, status, schedule_type, next_run_at, last_run_at')
      .eq('status', 'active');

    res.json({ 
      success: true, 
      data: {
        running: true,
        active_tasks: tasks || [],
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SEO 管理 ====================

// 生成 sitemap
router.get('/seo/sitemap', async (req: Request, res: Response) => {
  try {
    const baseUrl = req.query.base_url as string || 'https://guotao.netlify.app';
    const sitemap = await generateSitemap(baseUrl);
    
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 生成 robots.txt
router.get('/seo/robots', async (req: Request, res: Response) => {
  try {
    const baseUrl = req.query.base_url as string || 'https://guotao.netlify.app';
    const robots = generateRobotsTxt(baseUrl);
    
    res.set('Content-Type', 'text/plain');
    res.send(robots);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 提交单个 URL 到搜索引擎
router.post('/seo/submit', async (req: Request, res: Response) => {
  try {
    const { url, engine, token, site } = req.body;
    const result = await submitToSearchEngine(url, engine, { token, site });
    res.json({ success: result.success, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量提交所有推广链接
router.post('/seo/submit-all', async (req: Request, res: Response) => {
  try {
    const result = await submitAllLinksToSearchEngines();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取 SEO 提交历史
router.get('/seo/history', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const history = await getSEOHistory(limit);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 推广内容库 ====================

// 创建推广内容
router.post('/contents', async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      content, 
      platform, 
      category, 
      tags, 
      status = 'active' 
    } = req.body;

    const { data, error } = await db
      .from('promo_contents')
      .insert({
        title,
        content,
        platform,
        category,
        tags: tags || [],
        status,
        use_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Create promo content error:', error);
    res.status(500).json({ success: false, error: '创建推广内容失败' });
  }
});

// 获取推广内容列表
router.get('/contents', async (req: Request, res: Response) => {
  try {
    const { platform, category, status, limit = 50 } = req.query;

    let query = db.from('promo_contents').select('*');

    if (platform) query = query.eq('platform', platform);
    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get promo contents error:', error);
    res.status(500).json({ success: false, error: '获取推广内容失败' });
  }
});

// 更新推广内容
router.put('/contents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await db
      .from('promo_contents')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Update promo content error:', error);
    res.status(500).json({ success: false, error: '更新推广内容失败' });
  }
});

// 删除推广内容
router.delete('/contents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await db.from('promo_contents').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete promo content error:', error);
    res.status(500).json({ success: false, error: '删除推广内容失败' });
  }
});

// 随机获取推广内容
router.get('/contents/random', async (req: Request, res: Response) => {
  try {
    const { platform } = req.query;

    let query = db.from('promo_contents').select('*').eq('status', 'active');
    if (platform) query = query.eq('platform', platform);

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      res.json({ success: false, message: '没有可用的推广内容' });
      return;
    }

    const randomContent = data[Math.floor(Math.random() * data.length)];

    // 更新使用次数
    await db.from('promo_contents')
      .update({ use_count: (randomContent.use_count || 0) + 1 })
      .eq('id', randomContent.id);

    res.json({ success: true, data: randomContent });
  } catch (error) {
    console.error('Get random content error:', error);
    res.status(500).json({ success: false, error: '获取推广内容失败' });
  }
});

export default router;
