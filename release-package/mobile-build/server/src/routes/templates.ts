import express, { type Request, type Response } from 'express';
import db from '../db.js';

const router = express.Router();

// 获取模板列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.from('templates').select('*').eq('is_public', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query
      .order('use_count', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const { count, error: countError } = await db
      .from('templates')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    if (countError) throw countError;

    res.json({
      success: true,
      data: templates,
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ success: false, error: '获取模板列表失败' });
  }
});

// 获取单个模板
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: template, error } = await db
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !template) {
      res.status(404).json({ success: false, error: '模板不存在' });
      return;
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ success: false, error: '获取模板失败' });
  }
});

// 使用模板（增加使用次数）
router.post('/:id/use', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data: template, error: fetchError } = await db
      .from('templates')
      .select('use_count')
      .eq('id', id)
      .single();

    if (fetchError || !template) {
      res.status(404).json({ success: false, error: '模板不存在' });
      return;
    }

    const { error: updateError } = await db
      .from('templates')
      .update({ use_count: (template.use_count || 0) + 1 })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true, message: '使用次数已更新' });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({ success: false, error: '更新使用次数失败' });
  }
});

// 获取模板分类
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const { data: templates, error } = await db
      .from('templates')
      .select('category')
      .eq('is_public', true);

    if (error) throw error;

    const categorySet = new Set<string>();
    templates?.forEach((t: { category: string | null }) => {
      if (t.category) {
        categorySet.add(t.category);
      }
    });

    const categoryList = Array.from(categorySet);

    res.json({ success: true, data: categoryList });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: '获取分类失败' });
  }
});

export default router;
