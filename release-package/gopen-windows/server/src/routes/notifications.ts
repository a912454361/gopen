import express, { type Request, type Response } from 'express';
import db from '../db.js';

const router = express.Router();

// 通知类型
export type NotificationType = 
  | 'system'        // 系统通知
  | 'payment'       // 支付通知
  | 'membership'    // 会员通知
  | 'work'          // 作品通知
  | 'comment'       // 评论通知
  | 'like';         // 点赞通知

// 获取用户通知列表
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, unread_only } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.from('notifications').select('*').eq('user_id', userId);

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const { count: unreadCount, error: countError } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (countError) throw countError;

    res.json({
      success: true,
      data: notifications,
      unread_count: unreadCount || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: '获取通知列表失败' });
  }
});

// 获取未读通知数量
router.get('/unread/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { count, error } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, error: '获取未读数量失败' });
  }
});

// 标记通知为已读
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

// 标记所有通知为已读
router.put('/read-all/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { error } = await db
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ success: true, message: '全部标记为已读' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, error: '操作失败' });
  }
});

// 创建通知（内部使用）
router.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, type, title, content, data } = req.body;

    const { data: notification, error } = await db
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        content,
        data: data ? JSON.stringify(data) : null,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, error: '创建通知失败' });
  }
});

// 删除通知
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await db.from('notifications').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

export default router;
