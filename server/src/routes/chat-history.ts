/**
 * 对话历史路由
 */

import { Router, type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

/**
 * 获取用户对话历史列表
 * GET /api/v1/chat-history/user/:userId
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 尝试从数据库获取
    const { data: sessions, error } = await client
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('Get chat sessions error:', error);
      // 返回空数据而不是错误
      return res.json({
        success: true,
        data: [],
      });
    }

    res.json({
      success: true,
      data: sessions || [],
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: '获取对话历史失败' });
  }
});

/**
 * 获取单个对话详情
 * GET /api/v1/chat-history/:sessionId
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const { data: session, error } = await client
      .from('chat_sessions')
      .select(`
        *,
        messages:chat_messages(*)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return res.status(404).json({ error: '对话不存在' });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Get session detail error:', error);
    res.status(500).json({ error: '获取对话详情失败' });
  }
});

/**
 * 创建新对话
 * POST /api/v1/chat-history
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, title, model, modelName, provider } = req.body;

    const { data: session, error } = await client
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || '新对话',
        model,
        model_name: modelName,
        provider,
        message_count: 0,
        last_message: '',
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Create session error:', error);
      return res.status(500).json({ error: '创建对话失败' });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: '创建对话失败' });
  }
});

/**
 * 更新对话
 * PUT /api/v1/chat-history/:sessionId
 */
router.put('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { title, lastMessage, messageCount } = req.body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (lastMessage) {
      updateData.last_message = lastMessage;
      updateData.last_message_at = new Date().toISOString();
    }
    if (messageCount !== undefined) updateData.message_count = messageCount;

    const { data: session, error } = await client
      .from('chat_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Update session error:', error);
      return res.status(500).json({ error: '更新对话失败' });
    }

    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: '更新对话失败' });
  }
});

/**
 * 删除对话
 * DELETE /api/v1/chat-history/:sessionId
 */
router.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // 删除关联的消息
    await client.from('chat_messages').delete().eq('session_id', sessionId);

    // 删除对话
    const { error } = await client
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Delete session error:', error);
      return res.status(500).json({ error: '删除对话失败' });
    }

    res.json({
      success: true,
      message: '对话已删除',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: '删除对话失败' });
  }
});

export default router;
