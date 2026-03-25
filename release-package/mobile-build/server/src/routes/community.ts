import express, { type Request, type Response } from 'express';
import db from '../db.js';

const router = express.Router();

// 获取社区帖子列表
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, sort = 'latest' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 使用Supabase查询
    let query = db
      .from('community_posts')
      .select(`
        *,
        works:work_id (
          project_title,
          project_type,
          content,
          image_url
        )
      `)
      .order('created_at', { ascending: false });

    if (sort === 'popular') {
      query = query.order('likes_count', { ascending: false });
    }

    const { data: posts, error } = await query.range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const { count, error: countError } = await db
      .from('community_posts')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    res.json({
      success: true,
      data: posts,
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, error: '获取帖子列表失败' });
  }
});

// 获取单个帖子详情
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: post, error } = await db
      .from('community_posts')
      .select(`
        *,
        works:work_id (
          project_title,
          project_type,
          content,
          image_url
        )
      `)
      .eq('id', id)
      .single();

    if (error || !post) {
      res.status(404).json({ success: false, error: '帖子不存在' });
      return;
    }

    // 获取评论
    const { data: comments, error: commentsError } = await db
      .from('post_comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (commentsError) throw commentsError;

    res.json({ success: true, data: { ...post, comments } });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, error: '获取帖子详情失败' });
  }
});

// 创建帖子（分享作品）
router.post('/posts', async (req: Request, res: Response) => {
  try {
    const { user_id, work_id, title, content, images } = req.body;

    const { data: post, error } = await db
      .from('community_posts')
      .insert({
        user_id,
        work_id,
        title,
        content,
        images: images ? JSON.stringify(images) : null,
      })
      .select()
      .single();

    if (error) throw error;

    // 更新作品为公开
    if (work_id) {
      await db.from('works').update({ is_public: true }).eq('id', work_id);
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, error: '创建帖子失败' });
  }
});

// 删除帖子
router.delete('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.from('post_comments').delete().eq('post_id', id);
    await db.from('post_likes').delete().eq('post_id', id);
    await db.from('community_posts').delete().eq('id', id);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

// 点赞帖子
router.post('/posts/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const { data: existing, error: fetchError } = await db
      .from('post_likes')
      .select('*')
      .eq('post_id', id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      await db.from('post_likes').delete().eq('post_id', id).eq('user_id', user_id);
      
      const { data: post } = await db.from('community_posts').select('likes_count').eq('id', id).single();
      await db.from('community_posts').update({ likes_count: Math.max((post?.likes_count || 1) - 1, 0) }).eq('id', id);
      
      res.json({ success: true, liked: false });
    } else {
      await db.from('post_likes').insert({ post_id: id, user_id });
      
      const { data: post } = await db.from('community_posts').select('likes_count').eq('id', id).single();
      await db.from('community_posts').update({ likes_count: (post?.likes_count || 0) + 1 }).eq('id', id);
      
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

// 添加评论
router.post('/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, content } = req.body;

    const { data: comment, error } = await db
      .from('post_comments')
      .insert({
        post_id: Number(id),
        user_id,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: post } = await db.from('community_posts').select('comments_count').eq('id', id).single();
    await db.from('community_posts').update({ comments_count: (post?.comments_count || 0) + 1 }).eq('id', id);

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: '评论失败' });
  }
});

// 删除评论
router.delete('/comments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: comment, error: fetchError } = await db
      .from('post_comments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !comment) {
      res.status(404).json({ success: false, error: '评论不存在' });
      return;
    }

    await db.from('post_comments').delete().eq('id', id);
    
    const { data: post } = await db.from('community_posts').select('comments_count').eq('id', comment.post_id).single();
    await db.from('community_posts').update({ comments_count: Math.max((post?.comments_count || 1) - 1, 0) }).eq('id', comment.post_id);

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

export default router;
