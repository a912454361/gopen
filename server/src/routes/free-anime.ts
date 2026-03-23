/**
 * 免费动漫创作路由
 * 整合 LLM + 图像生成 + 视频生成 + 音频处理
 */

import express, { type Request, type Response } from 'express';
import {
  FreeAnimeCreator,
  createAnimeCreator,
  type AnimeCreationRequest,
} from '../services/free-anime-creator.js';

const router = express.Router();

/**
 * 快速生成动漫概念
 * POST /api/v1/free-anime/concept
 */
router.post('/concept', async (req: Request, res: Response) => {
  try {
    const { prompt, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('[FreeAnime] Quick concept generation:', prompt);

    const customHeaders = extractHeaders(req);
    const creator = createAnimeCreator(customHeaders);

    const concept = await creator.quickConcept(prompt, style || 'japanese');

    res.json({
      success: true,
      data: concept,
    });
  } catch (error) {
    console.error('[FreeAnime] Concept error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 流式生成故事
 * POST /api/v1/free-anime/story/stream
 */
router.post('/story/stream', async (req: Request, res: Response) => {
  try {
    const { prompt, style } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('[FreeAnime] Streaming story generation:', prompt);

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
    res.setHeader('Connection', 'keep-alive');

    const customHeaders = extractHeaders(req);
    const creator = createAnimeCreator(customHeaders);

    const stream = creator.streamStory({
      prompt,
      style: style || 'japanese',
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[FreeAnime] Story stream error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
    res.end();
  }
});

/**
 * 完整动漫创作
 * POST /api/v1/free-anime/create
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      style,
      genre,
      episodeCount,
      generateImages,
      generateVideos,
      generateAudio,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('[FreeAnime] Full anime creation:', prompt);

    const customHeaders = extractHeaders(req);
    const creator = createAnimeCreator(customHeaders);

    const request: AnimeCreationRequest = {
      prompt,
      style: style || 'japanese',
      genre,
      episodeCount: episodeCount || 2,
      generateImages: generateImages || false,
      generateVideos: generateVideos || false,
      generateAudio: generateAudio || false,
    };

    const result = await creator.createAnime(request);

    // 转换Map为普通对象以便JSON序列化
    const response = {
      story: result.story,
      characters: Object.fromEntries(result.characters),
      sceneImages: Object.fromEntries(result.sceneImages),
      videos: Object.fromEntries(result.videos),
      audioClips: Object.fromEntries(result.audioClips),
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('[FreeAnime] Creation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 生成角色立绘
 * POST /api/v1/free-anime/character/portrait
 */
router.post('/character/portrait', async (req: Request, res: Response) => {
  try {
    const { character, style } = req.body;

    if (!character || !character.name) {
      return res.status(400).json({ error: 'Character with name is required' });
    }

    console.log('[FreeAnime] Character portrait:', character.name);

    const customHeaders = extractHeaders(req);
    const creator = createAnimeCreator(customHeaders);

    const imageUrl = await creator.generateCharacterPortrait(character, style || 'japanese');

    if (imageUrl) {
      res.json({
        success: true,
        data: { imageUrl },
      });
    } else {
      res.status(500).json({ error: 'Failed to generate portrait' });
    }
  } catch (error) {
    console.error('[FreeAnime] Portrait error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取支持的动漫风格
 * GET /api/v1/free-anime/styles
 */
router.get('/styles', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      japanese: '日式动漫风格',
      chinese: '国风动漫风格',
      korean: '韩式动漫风格',
      western: '西方动漫风格',
    },
  });
});

/**
 * 获取支持的语音类型
 * GET /api/v1/free-anime/voices
 */
router.get('/voices', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      '少年': '活泼开朗的少年声音',
      '少女': '可爱甜美的少女声音',
      '青年男性': '稳重成熟的青年男性声音',
      '青年女性': '温柔知性的青年女性声音',
      '成熟男性': '深沉有力的成熟男性声音',
      '成熟女性': '优雅端庄的成熟女性声音',
      '儿童': '稚嫩可爱的儿童声音',
      '旁白': '专业播音级旁白声音',
    },
  });
});

// Helper function to extract headers
function extractHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const forwardedHeaders = [
    'x-request-id',
    'x-user-id',
    'x-session-id',
    'authorization',
  ];

  for (const key of forwardedHeaders) {
    const value = req.headers[key];
    if (value) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  return headers;
}

export default router;
