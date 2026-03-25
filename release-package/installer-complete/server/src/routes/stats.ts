import express, { type Request, type Response } from 'express';
import db from '../db.js';

const router = express.Router();

// 获取用户统计数据
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // 获取或创建用户统计
    const { data: stats, error: statsError } = await db
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    let userStats = stats;

    if (statsError || !userStats) {
      // 计算实际数据
      const { count: worksCount } = await db
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { data: newStats, error: insertError } = await db
        .from('user_stats')
        .insert({
          user_id: Number(userId),
          total_works: worksCount || 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      userStats = newStats;
    }

    // 获取本周/本月创作统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: weeklyWorks, error: weeklyError } = await db
      .from('works')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: monthlyWorks, error: monthlyError } = await db
      .from('works')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    // 获取各类型作品数量
    const { data: typeStats, error: typeError } = await db
      .from('works')
      .select('project_type')
      .eq('user_id', userId);

    const typeCount: Record<string, number> = {};
    typeStats?.forEach((t: { project_type: string }) => {
      typeCount[t.project_type] = (typeCount[t.project_type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        ...userStats,
        weekly_works: weeklyWorks || 0,
        monthly_works: monthlyWorks || 0,
        type_stats: Object.entries(typeCount).map(([type, count]) => ({ project_type: type, count })),
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

// 更新用户对话次数
router.post('/user/:userId/chat', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const { data: existing, error: fetchError } = await db
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await db
        .from('user_stats')
        .update({ 
          total_chats: (existing.total_chats || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      await db
        .from('user_stats')
        .insert({ user_id: Number(userId), total_chats: 1 });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update chat count error:', error);
    res.status(500).json({ success: false, error: '更新失败' });
  }
});

// 获取管理员统计数据
router.get('/admin', async (req: Request, res: Response) => {
  try {
    // 总用户数
    const { count: totalUsers } = await db
      .from('users')
      .select('*', { count: 'exact', head: true });

    // 总作品数
    const { count: totalWorks } = await db
      .from('works')
      .select('*', { count: 'exact', head: true });

    // 今日新增作品
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todayWorks } = await db
      .from('works')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 本周新增作品
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: weeklyWorks } = await db
      .from('works')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // 各类型作品统计
    const { data: worksByType, error: typeError } = await db
      .from('works')
      .select('project_type');

    const typeCount: Record<string, number> = {};
    worksByType?.forEach((w: { project_type: string }) => {
      typeCount[w.project_type] = (typeCount[w.project_type] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total_users: totalUsers || 0,
        total_works: totalWorks || 0,
        today_works: todayWorks || 0,
        weekly_works: weeklyWorks || 0,
        works_by_type: Object.entries(typeCount).map(([type, count]) => ({ project_type: type, count })),
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

export default router;
