/**
 * AI 视频生成服务 - 用于生成8K粒子特效预览视频
 * 使用 doubao-seedance-1-5-pro-251215 模型
 */
import { Router, type Request, type Response } from 'express';
import { VideoGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

const router = Router();

// 初始化视频生成客户端
const config = new Config();
const client = new VideoGenerationClient(config);

// 8种粒子特效的视频生成提示词
const PARTICLE_EFFECT_PROMPTS = {
  sword_qi: {
    text: 'A magnificent sword energy slash effect in Chinese cultivation style, cyan blue glowing particles forming a giant sword qi cutting through the sky, epic cinematic shot, 8K quality, dramatic lighting, particle effects swirling around the blade, slow motion, fantasy wuxia style',
    duration: 6,
  },
  ice_heart: {
    text: 'Ice crystal shield forming around a cultivator, blue-white frost particles swirling and condensing into protective barrier, cold aura emanating, crystal clear ice formations, magical glow, cinematic Chinese fantasy style, 8K quality',
    duration: 6,
  },
  shadow: {
    text: 'Dark shadow particles engulfing everything in darkness, purple-black energy vortex, mysterious dark cultivation technique, void and abyss effect, dramatic contrast between light and dark, epic cinematic shot, 8K quality',
    duration: 6,
  },
  flame: {
    text: 'Massive flame eruption with golden-red fire particles, phoenix-like flames rising to the sky, intense heat wave distortion, burning everything in path, epic fire cultivation technique, cinematic shot, 8K quality',
    duration: 6,
  },
  thunder: {
    text: 'Divine lightning tribulation, golden thunder bolts striking down from purple clouds, electric particles crackling in the air, heavenly punishment effect, dramatic sky background, epic wuxia cultivation scene, 8K quality',
    duration: 6,
  },
  wind: {
    text: 'Wind storm with green particles, tornado forming with leaves and debris, sky and clouds rapidly changing, natural disaster effect, cultivator controlling wind element, cinematic environmental effect, 8K quality',
    duration: 6,
  },
  starfall: {
    text: 'Meteors falling from the night sky, brilliant shooting stars with trailing particles, cosmic energy descending to earth, starlight explosions, epic celestial phenomenon, cinematic space scene, 8K quality',
    duration: 6,
  },
  sword_rain: {
    text: 'Thousands of swords raining down from the sky, each sword made of glowing energy particles, spectacular sword formation technique, legendary wuxia move, overwhelming power display, epic cinematic shot, 8K quality',
    duration: 8,
  },
};

/**
 * 生成单个粒子特效视频
 * POST /api/v1/video-effects/generate
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { effectType } = req.body;
    
    if (!effectType || !PARTICLE_EFFECT_PROMPTS[effectType as keyof typeof PARTICLE_EFFECT_PROMPTS]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid effect type. Available: sword_qi, ice_heart, shadow, flame, thunder, wind, starfall, sword_rain',
      });
    }
    
    const effectPrompt = PARTICLE_EFFECT_PROMPTS[effectType as keyof typeof PARTICLE_EFFECT_PROMPTS];
    
    console.log(`[VideoGeneration] Generating video for effect: ${effectType}`);
    console.log(`[VideoGeneration] Prompt: ${effectPrompt.text}`);
    
    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as any);
    
    // 创建视频生成客户端
    const videoClient = new VideoGenerationClient(config, { customHeaders: customHeaders as any });
    
    // 生成视频
    const content = [{ type: 'text' as const, text: effectPrompt.text }];
    
    const response = await videoClient.videoGeneration(content, {
      model: 'doubao-seedance-1-5-pro-251215',
      duration: effectPrompt.duration,
      ratio: '16:9',
      resolution: '720p',
      generateAudio: true,
      watermark: false,
    });
    
    if (response.videoUrl) {
      console.log(`[VideoGeneration] Video generated successfully: ${response.videoUrl}`);
      
      res.json({
        success: true,
        data: {
          effectType,
          videoUrl: response.videoUrl,
          lastFrameUrl: response.lastFrameUrl,
          duration: effectPrompt.duration,
          status: response.response.status,
          taskId: response.response.id,
        },
      });
    } else {
      console.error(`[VideoGeneration] Video generation failed: ${response.response.error_message}`);
      
      res.status(500).json({
        success: false,
        error: 'Video generation failed',
        details: response.response.error_message,
      });
    }
  } catch (error) {
    console.error('[VideoGeneration] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 批量生成所有粒子特效视频
 * POST /api/v1/video-effects/generate-all
 */
router.post('/generate-all', async (req: Request, res: Response) => {
  try {
    console.log('[VideoGeneration] Starting batch generation for all effects...');
    
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as any);
    const videoClient = new VideoGenerationClient(config, { customHeaders: customHeaders as any });
    
    const results: any[] = [];
    const effectTypes = Object.keys(PARTICLE_EFFECT_PROMPTS);
    
    // 顺序生成（避免并发过多）
    for (const effectType of effectTypes) {
      const effectPrompt = PARTICLE_EFFECT_PROMPTS[effectType as keyof typeof PARTICLE_EFFECT_PROMPTS];
      
      console.log(`[VideoGeneration] Generating ${effectType}... (${effectTypes.indexOf(effectType) + 1}/${effectTypes.length})`);
      
      try {
        const content = [{ type: 'text' as const, text: effectPrompt.text }];
        
        const response = await videoClient.videoGeneration(content, {
          model: 'doubao-seedance-1-5-pro-251215',
          duration: effectPrompt.duration,
          ratio: '16:9',
          resolution: '720p',
          generateAudio: true,
          watermark: false,
        });
        
        results.push({
          effectType,
          success: !!response.videoUrl,
          videoUrl: response.videoUrl,
          lastFrameUrl: response.lastFrameUrl,
          error: response.response.error_message,
        });
        
        console.log(`[VideoGeneration] ${effectType} generated: ${response.videoUrl ? 'success' : 'failed'}`);
      } catch (error) {
        results.push({
          effectType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        
        console.error(`[VideoGeneration] ${effectType} failed:`, error);
      }
      
      // 等待2秒避免请求过快
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const successCount = results.filter(r => r.success).length;
    
    console.log(`[VideoGeneration] Batch generation completed: ${successCount}/${effectTypes.length} succeeded`);
    
    res.json({
      success: true,
      data: {
        total: effectTypes.length,
        succeeded: successCount,
        failed: effectTypes.length - successCount,
        results,
      },
    });
  } catch (error) {
    console.error('[VideoGeneration] Batch generation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * 获取所有粒子特效的提示词
 * GET /api/v1/video-effects/prompts
 */
router.get('/prompts', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: PARTICLE_EFFECT_PROMPTS,
  });
});

export default router;
