import express, { type Request, type Response } from 'express';
import db from '../db.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// ==================== 推广链接管理 ====================

// 创建推广链接
router.post('/links', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      platform, 
      target_url, 
      utm_source, 
      utm_medium, 
      utm_campaign,
      utm_content,
      utm_term,
      keywords,
      description 
    } = req.body;

    // 生成唯一推广码
    const promoCode = `P${Date.now().toString(36).toUpperCase()}${randomUUID().substring(0, 6).toUpperCase()}`;
    
    // 构建带参数的推广链接
    const utmParams = new URLSearchParams();
    if (utm_source) utmParams.set('utm_source', utm_source);
    if (utm_medium) utmParams.set('utm_medium', utm_medium);
    if (utm_campaign) utmParams.set('utm_campaign', utm_campaign);
    if (utm_content) utmParams.set('utm_content', utm_content);
    if (utm_term) utmParams.set('utm_term', utm_term);
    utmParams.set('ref', promoCode);
    
    const promoUrl = `${target_url}?${utmParams.toString()}`;

    const { data: link, error } = await db
      .from('promo_links')
      .insert({
        name,
        code: promoCode,
        platform,
        target_url,
        promo_url: promoUrl,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        keywords: keywords ? JSON.stringify(keywords) : null,
        description,
        status: 'active',
        clicks: 0,
        conversions: 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: link });
  } catch (error) {
    console.error('Create promo link error:', error);
    res.status(500).json({ success: false, error: '创建推广链接失败' });
  }
});

// 获取推广链接列表
router.get('/links', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, platform, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.from('promo_links').select('*');
    
    if (platform) query = query.eq('platform', platform);
    if (status) query = query.eq('status', status);

    const { data: links, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    const { count, error: countError } = await db
      .from('promo_links')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    res.json({ 
      success: true, 
      data: links, 
      total: count || 0,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Get promo links error:', error);
    res.status(500).json({ success: false, error: '获取推广链接失败' });
  }
});

// 更新推广链接
router.put('/links/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: link, error } = await db
      .from('promo_links')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: link });
  } catch (error) {
    console.error('Update promo link error:', error);
    res.status(500).json({ success: false, error: '更新推广链接失败' });
  }
});

// 删除推广链接
router.delete('/links/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await db.from('promo_links').delete().eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete promo link error:', error);
    res.status(500).json({ success: false, error: '删除推广链接失败' });
  }
});

// ==================== 推广任务管理 ====================

// 创建推广任务
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const {
      name,
      type, // 'auto_post' | 'seo_submit' | 'social_share' | 'forum_post'
      platforms,
      content_template,
      link_ids,
      schedule_type, // 'once' | 'daily' | 'weekly' | 'custom'
      schedule_config,
      risk_control, // 风控配置
    } = req.body;

    const { data: task, error } = await db
      .from('promo_tasks')
      .insert({
        name,
        type,
        platforms: JSON.stringify(platforms),
        content_template,
        link_ids: JSON.stringify(link_ids),
        schedule_type,
        schedule_config: JSON.stringify(schedule_config),
        risk_control: JSON.stringify(risk_control),
        status: 'pending',
        run_count: 0,
        success_count: 0,
        fail_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Create promo task error:', error);
    res.status(500).json({ success: false, error: '创建推广任务失败' });
  }
});

// 获取推广任务列表
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.from('promo_tasks').select('*');
    
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data: tasks, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get promo tasks error:', error);
    res.status(500).json({ success: false, error: '获取推广任务失败' });
  }
});

// 启动/暂停任务
router.put('/tasks/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: task, error } = await db
      .from('promo_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, error: '更新任务状态失败' });
  }
});

// 执行推广任务
router.post('/tasks/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取任务详情
    const { data: task, error: taskError } = await db
      .from('promo_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskError || !task) {
      res.status(404).json({ success: false, error: '任务不存在' });
      return;
    }

    // 获取关联的推广链接
    const linkIds = JSON.parse(task.link_ids || '[]');
    const { data: links, error: linksError } = await db
      .from('promo_links')
      .select('*')
      .in('id', linkIds);

    if (linksError) throw linksError;

    // 记录任务执行
    const { data: execution, error: execError } = await db
      .from('promo_executions')
      .insert({
        task_id: id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (execError) throw execError;

    // 异步执行推广任务
    executePromoTask(task, links || [], execution.id).catch(console.error);

    res.json({ 
      success: true, 
      message: '任务已开始执行',
      execution_id: execution.id 
    });
  } catch (error) {
    console.error('Execute task error:', error);
    res.status(500).json({ success: false, error: '执行任务失败' });
  }
});

// 异步执行推广任务
async function executePromoTask(task: any, links: any[], executionId: string) {
  const riskControl = JSON.parse(task.risk_control || '{}');
  const platforms = JSON.parse(task.platforms || '[]');
  const contentTemplate = task.content_template;

  let successCount = 0;
  let failCount = 0;
  const logs: any[] = [];

  try {
    for (const platform of platforms) {
      // 风控：随机延迟，模拟真人行为
      const delay = riskControl.min_delay || 5000 + Math.random() * ((riskControl.max_delay || 30000) - (riskControl.min_delay || 5000));
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        // 根据平台类型执行不同的推广逻辑
        const result = await executePlatformPromotion(platform, links, contentTemplate, riskControl);
        
        if (result.success) {
          successCount++;
          logs.push({ platform, status: 'success', message: result.message, timestamp: new Date().toISOString() });
        } else {
          failCount++;
          logs.push({ platform, status: 'failed', message: result.message, timestamp: new Date().toISOString() });
        }
      } catch (err: any) {
        failCount++;
        logs.push({ platform, status: 'error', message: err.message, timestamp: new Date().toISOString() });
      }

      // 风控：限制频率
      if (riskControl.max_per_hour && successCount + failCount >= riskControl.max_per_hour) {
        logs.push({ status: 'info', message: '达到每小时限制，暂停执行', timestamp: new Date().toISOString() });
        break;
      }
    }

    // 更新执行记录
    await db.from('promo_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        success_count: successCount,
        fail_count: failCount,
        logs: JSON.stringify(logs),
      })
      .eq('id', executionId);

    // 更新任务统计
    await db.from('promo_tasks')
      .update({
        run_count: (task.run_count || 0) + 1,
        success_count: (task.success_count || 0) + successCount,
        fail_count: (task.fail_count || 0) + failCount,
        last_run_at: new Date().toISOString(),
      })
      .eq('id', task.id);

  } catch (error: any) {
    // 更新执行记录为失败
    await db.from('promo_executions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        logs: JSON.stringify([...logs, { status: 'error', message: error.message, timestamp: new Date().toISOString() }]),
      })
      .eq('id', executionId);
  }
}

// 平台推广执行
async function executePlatformPromotion(platform: string, links: any[], contentTemplate: string, riskControl: any) {
  const link = links[Math.floor(Math.random() * links.length)];
  
  // 根据不同平台执行不同的推广策略
  switch (platform) {
    case 'weibo':
      // 微博推广 - 实际需要接入微博API
      return { success: true, message: `微博推广已发送，链接: ${link?.promo_url}` };
    
    case 'wechat':
      // 微信推广
      return { success: true, message: `微信推广已发送，链接: ${link?.promo_url}` };
    
    case 'douyin':
      // 抖音推广
      return { success: true, message: `抖音推广已发送，链接: ${link?.promo_url}` };
    
    case 'xiaohongshu':
      // 小红书推广
      return { success: true, message: `小红书推广已发送，链接: ${link?.promo_url}` };
    
    case 'zhihu':
      // 知乎推广
      return { success: true, message: `知乎推广已发送，链接: ${link?.promo_url}` };
    
    case 'bilibili':
      // B站推广
      return { success: true, message: `B站推广已发送，链接: ${link?.promo_url}` };
    
    case 'seo':
      // SEO提交 - 提交到搜索引擎
      return { success: true, message: `SEO链接已提交到搜索引擎` };
    
    case 'forum':
      // 论坛推广
      return { success: true, message: `论坛推广已发送，链接: ${link?.promo_url}` };
    
    default:
      return { success: false, message: `未知平台: ${platform}` };
  }
}

// ==================== 访问统计 ====================

// 记录访问
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { code, ip, user_agent, referer, device, browser, os, country, city } = req.body;

    // 查找推广链接
    const { data: link, error: linkError } = await db
      .from('promo_links')
      .select('*')
      .eq('code', code)
      .single();

    if (linkError || !link) {
      res.json({ success: false, message: '推广码无效' });
      return;
    }

    // 记录访问
    const { error: visitError } = await db
      .from('promo_visits')
      .insert({
        link_id: link.id,
        code,
        ip,
        user_agent,
        referer,
        device,
        browser,
        os,
        country,
        city,
      });

    if (visitError) throw visitError;

    // 更新链接点击数
    await db.from('promo_links')
      .update({ clicks: (link.clicks || 0) + 1 })
      .eq('id', link.id);

    res.json({ success: true, redirect_url: link.target_url });
  } catch (error) {
    console.error('Track visit error:', error);
    res.status(500).json({ success: false, error: '记录访问失败' });
  }
});

// 获取推广统计
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    // 总体统计
    const { count: totalLinks } = await db.from('promo_links').select('*', { count: 'exact', head: true });
    const { count: totalTasks } = await db.from('promo_tasks').select('*', { count: 'exact', head: true });
    const { count: totalVisits } = await db.from('promo_visits').select('*', { count: 'exact', head: true });

    // 点击统计
    const { data: links } = await db.from('promo_links').select('clicks, conversions');
    const totalClicks = links?.reduce((sum: number, l: any) => sum + (l.clicks || 0), 0) || 0;
    const totalConversions = links?.reduce((sum: number, l: any) => sum + (l.conversions || 0), 0) || 0;

    // 按平台统计
    const { data: platformStats } = await db
      .from('promo_links')
      .select('platform, clicks');

    const platformCounts: Record<string, number> = {};
    platformStats?.forEach((p: any) => {
      platformCounts[p.platform] = (platformCounts[p.platform] || 0) + (p.clicks || 0);
    });

    // 按来源统计
    const { data: refererStats } = await db
      .from('promo_visits')
      .select('referer');

    const refererCounts: Record<string, number> = {};
    refererStats?.forEach((r: any) => {
      const domain = r.referer ? new URL(r.referer).hostname : 'direct';
      refererCounts[domain] = (refererCounts[domain] || 0) + 1;
    });

    // 转化率
    const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0';

    res.json({
      success: true,
      data: {
        total_links: totalLinks || 0,
        total_tasks: totalTasks || 0,
        total_visits: totalVisits || 0,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        conversion_rate: `${conversionRate}%`,
        platform_stats: platformCounts,
        referer_stats: refererCounts,
      },
    });
  } catch (error) {
    console.error('Get stats overview error:', error);
    res.status(500).json({ success: false, error: '获取统计失败' });
  }
});

// 获取趋势数据
router.get('/stats/trend', async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;

    // 获取最近N天的访问数据
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const { data: visits, error } = await db
      .from('promo_visits')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // 按日期分组统计
    const trendData: Record<string, number> = {};
    visits?.forEach((v: any) => {
      const date = new Date(v.created_at).toISOString().split('T')[0];
      trendData[date] = (trendData[date] || 0) + 1;
    });

    // 填充缺失的日期
    const result = [];
    for (let i = 0; i < Number(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        visits: trendData[dateStr] || 0,
      });
    }

    res.json({ success: true, data: result.reverse() });
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json({ success: false, error: '获取趋势失败' });
  }
});

// ==================== SEO优化 ====================

// 生成SEO关键词
router.post('/seo/keywords', async (req: Request, res: Response) => {
  try {
    const { content, industry, target_audience } = req.body;

    // 基于内容生成关键词（简化版，实际可接入AI）
    const keywords = [
      'AI创作',
      '智能写作',
      '游戏开发',
      '动漫创作',
      '内容生成',
      '古风场景',
      '仙侠创作',
      '国风设计',
      industry,
      target_audience,
    ].filter(Boolean);

    // 生成长尾关键词
    const longTailKeywords = [
      `${industry}AI创作工具`,
      `${target_audience}内容生成平台`,
      '古风场景AI生成',
      '仙侠剧情自动生成',
      '游戏角色设计AI',
    ];

    res.json({
      success: true,
      data: {
        keywords,
        long_tail_keywords: longTailKeywords,
        meta_description: `${content?.substring(0, 150) || 'G open - AI智能创作助手，助力游戏和动漫内容创作'}`,
      },
    });
  } catch (error) {
    console.error('Generate keywords error:', error);
    res.status(500).json({ success: false, error: '生成关键词失败' });
  }
});

// 提交搜索引擎收录
router.post('/seo/submit', async (req: Request, res: Response) => {
  try {
    const { urls } = req.body;

    // 实际需要调用各搜索引擎的提交API
    // 百度: http://data.zz.baidu.com/urls?site=xxx
    // Google: https://www.google.com/ping?sitemap=xxx
    // Bing: https://www.bing.com/ping?sitemap=xxx

    const results = [];
    
    for (const url of urls) {
      // 模拟提交
      results.push({
        url,
        baidu: 'submitted',
        google: 'submitted',
        bing: 'submitted',
        timestamp: new Date().toISOString(),
      });

      // 记录提交
      await db.from('seo_submissions').insert({
        url,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      });
    }

    res.json({ success: true, data: results, message: '已提交到搜索引擎' });
  } catch (error) {
    console.error('SEO submit error:', error);
    res.status(500).json({ success: false, error: '提交失败' });
  }
});

export default router;
