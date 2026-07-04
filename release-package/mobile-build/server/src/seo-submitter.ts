import db from './db.js';

// 搜索引擎提交配置
const SEARCH_ENGINES = {
  baidu: {
    name: '百度',
    submitUrl: 'http://data.zz.baidu.com/urls?site=',
    // 需要在百度站长平台获取 token
  },
  google: {
    name: 'Google',
    // 使用 Indexing API
  },
  bing: {
    name: 'Bing',
    submitUrl: 'https://www.bing.com/indexnow',
  },
};

// SEO 提交记录
interface SEOSubmission {
  url: string;
  search_engine: string;
  status: 'pending' | 'submitted' | 'indexed' | 'failed';
  submitted_at?: string;
  indexed_at?: string;
  error_message?: string;
}

// 生成 sitemap.xml
export async function generateSitemap(baseUrl: string): Promise<string> {
  const urls: string[] = [];
  
  // 添加主要页面
  const mainPages = [
    '',
    '/download',
    '/membership',
    '/projects',
    '/settings',
    '/templates',
    '/community',
  ];
  
  for (const page of mainPages) {
    urls.push(`${baseUrl}${page}`);
  }
  
  // 获取推广链接
  try {
    const { data: links } = await db
      .from('promo_links')
      .select('promo_url, updated_at')
      .eq('status', 'active');
    
    for (const link of links || []) {
      urls.push(link.promo_url);
    }
  } catch (error) {
    console.error('Failed to fetch promo links for sitemap:', error);
  }
  
  // 生成 XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return sitemap;
}

// 生成 robots.txt
export function generateRobotsTxt(baseUrl: string): string {
  return `# robots.txt for G open
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# 禁止爬取的路径
Disallow: /api/
Disallow: /admin/
Disallow: /private/
`;
}

// 提交 URL 到搜索引擎
export async function submitToSearchEngine(
  url: string,
  engine: 'baidu' | 'google' | 'bing',
  options?: { token?: string; site?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    // 记录提交
    const { data: submission, error: insertError } = await db
      .from('seo_submissions')
      .insert({
        url,
        search_engine: engine,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    let result: { success: boolean; message: string };

    switch (engine) {
      case 'baidu':
        result = await submitToBaidu(url, options?.token, options?.site);
        break;
      case 'google':
        result = await submitToGoogle(url);
        break;
      case 'bing':
        result = await submitToBing(url);
        break;
      default:
        result = { success: false, message: '未知搜索引擎' };
    }

    // 更新提交状态
    await db
      .from('seo_submissions')
      .update({
        status: result.success ? 'submitted' : 'failed',
        submitted_at: new Date().toISOString(),
        error_message: result.success ? null : result.message,
      })
      .eq('id', submission.id);

    return result;
  } catch (error: any) {
    console.error('SEO submission error:', error);
    return { success: false, message: error.message };
  }
}

// 提交到百度
async function submitToBaidu(
  url: string,
  token?: string,
  site?: string
): Promise<{ success: boolean; message: string }> {
  if (!token || !site) {
    return { 
      success: false, 
      message: '百度提交需要配置 token 和 site，请前往百度站长平台获取' 
    };
  }

  try {
    const response = await fetch(
      `http://data.zz.baidu.com/urls?site=${site}&token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: url,
      }
    );

    const data = await response.json() as any;
    
    if (data.success !== undefined) {
      return { success: true, message: `成功提交 ${data.success} 条` };
    } else if (data.error) {
      return { success: false, message: data.message || '提交失败' };
    }
    
    return { success: true, message: '已提交到百度' };
  } catch (error: any) {
    return { success: false, message: `百度提交失败: ${error.message}` };
  }
}

// 提交到 Google (使用 Indexing API)
async function submitToGoogle(url: string): Promise<{ success: boolean; message: string }> {
  // Google Indexing API 需要服务端认证
  // 这里返回提示信息
  return {
    success: false,
    message: 'Google 提交需要配置 Google Cloud 服务账号，请在管理后台配置',
  };
}

// 提交到 Bing (使用 IndexNow)
async function submitToBing(url: string): Promise<{ success: boolean; message: string }> {
  try {
    // IndexNow 协议
    const key = 'gopen-promo-key'; // 应该生成并保存一个唯一 key
    const response = await fetch(
      `https://www.bing.com/indexnow?url=${encodeURIComponent(url)}&key=${key}`,
      { method: 'GET' }
    );

    if (response.ok) {
      return { success: true, message: '已提交到 Bing' };
    }
    
    return { success: false, message: 'Bing 提交失败' };
  } catch (error: any) {
    return { success: false, message: `Bing 提交失败: ${error.message}` };
  }
}

// 批量提交所有推广链接到搜索引擎
export async function submitAllLinksToSearchEngines(): Promise<{
  total: number;
  success: number;
  failed: number;
  details: any[];
}> {
  const results: any[] = [];
  let success = 0;
  let failed = 0;

  try {
    const { data: links } = await db
      .from('promo_links')
      .select('id, promo_url')
      .eq('status', 'active');

    for (const link of links || []) {
      // 提交到百度
      const baiduResult = await submitToSearchEngine(link.promo_url, 'baidu');
      results.push({ url: link.promo_url, engine: 'baidu', ...baiduResult });
      if (baiduResult.success) success++; else failed++;

      // 提交到 Bing
      const bingResult = await submitToSearchEngine(link.promo_url, 'bing');
      results.push({ url: link.promo_url, engine: 'bing', ...bingResult });
      if (bingResult.success) success++; else failed++;

      // 延迟避免频率限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Batch SEO submission error:', error);
  }

  return {
    total: results.length,
    success,
    failed,
    details: results,
  };
}

// 获取 SEO 提交历史
export async function getSEOHistory(limit: number = 50): Promise<any[]> {
  const { data, error } = await db
    .from('seo_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get SEO history error:', error);
    return [];
  }

  return data || [];
}
