import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import db from '../db.js';

const router = express.Router();

// 图像生成请求验证
const generateSchema = z.object({
  prompt: z.string().min(5, '描述至少需要5个字符'),
  style: z.string().default('guofeng'),
  width: z.number().int().min(256).max(1024).default(512),
  height: z.number().int().min(256).max(1024).default(512),
  user_id: z.string().optional(),
});

// 风格提示词映射
const STYLE_PROMPTS: Record<string, string> = {
  guofeng: 'Chinese traditional painting style, ink wash, elegant brushstrokes, classical Chinese aesthetics, ',
  xianxia: 'Chinese xianxia fantasy style, ethereal clouds, immortal mountains, magical atmosphere, mystical energy, ',
  weimei: 'Aesthetic dreamy style, soft colors, romantic atmosphere, beautiful lighting, artistic composition, ',
  anime: 'Japanese anime style, vibrant colors, detailed illustration, anime aesthetics, ',
  game: 'Video game concept art style, epic scene, dramatic lighting, high detail, professional game art, ',
  cyberpunk: 'Cyberpunk style, neon lights, futuristic technology, dark atmosphere, sci-fi elements, ',
};

/**
 * 生成AI图像
 * POST /api/v1/image-gen/generate
 * 
 * 注意：此接口目前使用模拟图像URL。
 * 如需接入真实AI图像生成服务，请配置以下环境变量：
 * - OPENAI_API_KEY: 用于 DALL-E 3
 * - STABILITY_API_KEY: 用于 Stable Diffusion
 * - MIDJOURNEY_API_KEY: 用于 Midjourney
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const body = generateSchema.parse(req.body);
    const { prompt, style, width, height, user_id } = body;

    // 检查用户会员状态
    if (user_id) {
      const { data: user, error } = await db
        .from('users')
        .select('member_level, member_expire_at')
        .eq('id', user_id)
        .single();

      if (error) {
        console.error('Check member error:', error);
      } else {
        const isMember = user?.member_level !== 'free' && 
          (!user?.member_expire_at || new Date(user.member_expire_at) > new Date());
        
        if (!isMember) {
          return res.status(403).json({ 
            success: false, 
            error: '此功能仅限会员使用，请升级会员' 
          });
        }
      }
    }

    // 构建完整提示词
    const stylePrefix = STYLE_PROMPTS[style] || '';
    const fullPrompt = stylePrefix + prompt;

    console.log('Image generation request:', { prompt, style, width, height, user_id });

    // ========================================
    // 真实 API 调用示例（需要配置 API Key）
    // ========================================
    
    // 方案1: DALL-E 3 (OpenAI)
    // if (process.env.OPENAI_API_KEY) {
    //   const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     },
    //     body: JSON.stringify({
    //       model: 'dall-e-3',
    //       prompt: fullPrompt,
    //       n: 1,
    //       size: `${width}x${height}`,
    //       quality: 'standard',
    //     }),
    //   });
    //   const data = await openaiResponse.json();
    //   const imageUrl = data.data[0].url;
    // }

    // 方案2: Stable Diffusion (Stability AI)
    // if (process.env.STABILITY_API_KEY) {
    //   const stabilityResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
    //     },
    //     body: JSON.stringify({
    //       text_prompts: [{ text: fullPrompt }],
    //       cfg_scale: 7,
    //       height,
    //       width,
    //       samples: 1,
    //       steps: 30,
    //     }),
    //   });
    //   const data = await stabilityResponse.json();
    //   const imageUrl = `data:image/png;base64,${data.artifacts[0].base64}`;
    // }

    // ========================================
    // 模拟响应 - 使用 Unsplash 占位图
    // ========================================
    
    // 根据风格选择不同的 Unsplash 图片集合
    const styleImageMap: Record<string, string> = {
      guofeng: 'chinese-art,ink-painting,oriental',
      xianxia: 'fantasy,mountains,clouds,nature',
      weimei: 'aesthetic,beautiful,dreamy',
      anime: 'anime,illustration,art',
      game: 'gaming,fantasy,sci-fi',
      cyberpunk: 'cyberpunk,neon,futuristic',
    };

    const tags = styleImageMap[style] || 'art';
    const randomSeed = Math.floor(Math.random() * 1000);
    
    // 使用 Unsplash Source API 生成随机图片
    const imageUrl = `https://source.unsplash.com/featured/${width}x${height}/?${tags}&sig=${randomSeed}`;

    // 记录生成历史
    const generationId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Generated image:', { id: generationId, url: imageUrl });

    // 返回结果
    res.json({
      success: true,
      data: {
        id: generationId,
        image_url: imageUrl,
        prompt: fullPrompt,
        style,
        width,
        height,
        created_at: new Date().toISOString(),
        note: '当前使用模拟图片服务。接入真实 AI API 请配置环境变量（OPENAI_API_KEY 或 STABILITY_API_KEY）。',
      },
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      return res.status(400).json({ 
        success: false, 
        error: zodError.issues[0]?.message || '参数验证失败' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: '图像生成失败，请稍后重试' 
    });
  }
});

/**
 * 获取生成历史
 * GET /api/v1/image-gen/history/:userId
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    // 从作品表获取图像类型的历史
    const { data: works, error } = await db
      .from('works')
      .select('*')
      .eq('user_id', userId)
      .eq('service_type', 'image-gen')
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) throw error;

    res.json({
      success: true,
      data: works || [],
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取历史记录失败' 
    });
  }
});

/**
 * 获取可用风格列表
 * GET /api/v1/image-gen/styles
 */
router.get('/styles', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'guofeng', name: '古风', desc: '水墨丹青，意境悠远' },
      { id: 'xianxia', name: '仙侠', desc: '仙气飘渺，超凡脱俗' },
      { id: 'weimei', name: '唯美', desc: '梦幻唯美，诗意盎然' },
      { id: 'anime', name: '动漫', desc: '日系动漫，色彩明快' },
      { id: 'game', name: '游戏', desc: '游戏场景，震撼视觉' },
      { id: 'cyberpunk', name: '赛博', desc: '霓虹科技，未来感强' },
    ],
  });
});

export default router;
