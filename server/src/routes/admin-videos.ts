/**
 * 服务端文件：server/src/routes/admin-videos.ts
 * 管理后台 - 视频管理API
 * 
 * 功能：
 * - 获取视频列表
 * - 视频详情
 * - 下载视频
 * - 删除视频
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// 视频输出目录
const OUTPUT_DIR = '/tmp/gopen/output';

// 视频信息接口
interface VideoInfo {
  id: string;
  filename: string;
  title: string;
  episodeNumber: number;
  size: number;
  duration: number;
  resolution: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
  outputPath: string;
  scenesCount: number;
}

/**
 * 获取视频文件信息
 */
async function getVideoInfo(filePath: string): Promise<VideoInfo | null> {
  try {
    const stats = await fs.stat(filePath);
    const filename = path.basename(filePath);
    
    // 解析文件名: EP01_剑破苍穹_xxx.mp4
    const match = filename.match(/^EP(\d+)_(.+?)_([a-f0-9-]+)\.mp4$/);
    if (!match) return null;
    
    const episodeNumber = parseInt(match[1], 10);
    const title = match[2];
    const id = match[3];
    
    // 使用ffprobe获取视频信息（简化版，直接使用默认值）
    const duration = 1200; // 20分钟
    const resolution = '3840x2160'; // 4K
    
    return {
      id,
      filename,
      title,
      episodeNumber,
      size: stats.size,
      duration,
      resolution,
      createdAt: stats.birthtime.toISOString(),
      status: 'completed',
      outputPath: filePath,
      scenesCount: 40,
    };
  } catch (error) {
    return null;
  }
}

/**
 * @api {get} /api/v1/admin/videos 获取视频列表
 * @apiName GetVideos
 * @apiGroup AdminVideos
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('[AdminVideos] GET /api/v1/admin/videos called');
    const key = req.query.key as string;
    
    // 验证管理员权限
    const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
    console.log('[AdminVideos] Key received:', key, 'Expected:', ADMIN_KEY);
    if (key !== ADMIN_KEY) {
      console.log('[AdminVideos] Permission denied');
      return res.status(403).json({ success: false, error: '无权限' });
    }
    
    // 确保目录存在
    try {
      await fs.mkdir(OUTPUT_DIR, { recursive: true });
    } catch (e) {
      // 目录已存在
    }
    
    // 读取目录中的所有视频文件
    console.log('[AdminVideos] Reading directory:', OUTPUT_DIR);
    const files = await fs.readdir(OUTPUT_DIR);
    console.log('[AdminVideos] Files found:', files);
    const videoFiles = files.filter(f => f.endsWith('.mp4'));
    console.log('[AdminVideos] Video files:', videoFiles);
    
    // 获取每个视频的信息
    const videos: VideoInfo[] = [];
    for (const file of videoFiles) {
      const filePath = path.join(OUTPUT_DIR, file);
      const info = await getVideoInfo(filePath);
      console.log('[AdminVideos] File info:', file, info ? 'success' : 'null');
      if (info) {
        videos.push(info);
      }
    }
    
    // 按集数排序
    videos.sort((a, b) => a.episodeNumber - b.episodeNumber);
    
    res.json({
      success: true,
      data: {
        total: videos.length,
        videos,
      },
    });
  } catch (error) {
    console.error('[AdminVideos] Error:', error);
    res.status(500).json({ success: false, error: '获取视频列表失败' });
  }
});

/**
 * @api {get} /api/v1/admin/videos/:id 获取视频详情
 * @apiName GetVideoDetail
 * @apiGroup AdminVideos
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const key = req.query.key as string;
    
    // 验证管理员权限
    const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
    if (key !== ADMIN_KEY) {
      return res.status(403).json({ success: false, error: '无权限' });
    }
    
    // 查找视频文件
    const files = await fs.readdir(OUTPUT_DIR);
    const videoFile = files.find(f => f.includes(id) && f.endsWith('.mp4'));
    
    if (!videoFile) {
      return res.status(404).json({ success: false, error: '视频不存在' });
    }
    
    const filePath = path.join(OUTPUT_DIR, videoFile);
    const info = await getVideoInfo(filePath);
    
    if (!info) {
      return res.status(404).json({ success: false, error: '视频信息获取失败' });
    }
    
    res.json({ success: true, data: info });
  } catch (error) {
    console.error('[AdminVideos] Error:', error);
    res.status(500).json({ success: false, error: '获取视频详情失败' });
  }
});

/**
 * @api {get} /api/v1/admin/videos/:id/download 下载视频
 * @apiName DownloadVideo
 * @apiGroup AdminVideos
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const key = req.query.key as string;
    
    // 验证管理员权限
    const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
    if (key !== ADMIN_KEY) {
      return res.status(403).json({ success: false, error: '无权限' });
    }
    
    // 查找视频文件
    const files = await fs.readdir(OUTPUT_DIR);
    const videoFile = files.find(f => f.includes(id) && f.endsWith('.mp4'));
    
    if (!videoFile) {
      return res.status(404).json({ success: false, error: '视频不存在' });
    }
    
    const filePath = path.join(OUTPUT_DIR, videoFile);
    
    // 设置响应头 - 使用URL编码处理中文文件名
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(videoFile)}`);
    
    // 发送文件
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('[AdminVideos] Download error:', error);
    res.status(500).json({ success: false, error: '下载失败' });
  }
});

/**
 * @api {get} /api/v1/admin/videos/:id/preview 预览视频
 * @apiName PreviewVideo
 * @apiGroup AdminVideos
 */
router.get('/:id/preview', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const key = req.query.key as string;
    
    // 验证管理员权限
    const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
    if (key !== ADMIN_KEY) {
      return res.status(403).json({ success: false, error: '无权限' });
    }
    
    // 查找视频文件
    const files = await fs.readdir(OUTPUT_DIR);
    const videoFile = files.find(f => f.includes(id) && f.endsWith('.mp4'));
    
    if (!videoFile) {
      return res.status(404).json({ success: false, error: '视频不存在' });
    }
    
    const filePath = path.join(OUTPUT_DIR, videoFile);
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // 支持Range请求（视频拖动）
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      
      const fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(chunksize);
      await fileHandle.read(buffer, 0, chunksize, start);
      await fileHandle.close();
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });
      res.end(buffer);
    } else {
      // 不带Range的请求，返回整个文件
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Length', fileSize);
      const fileBuffer = await fs.readFile(filePath);
      res.send(fileBuffer);
    }
  } catch (error) {
    console.error('[AdminVideos] Preview error:', error);
    res.status(500).json({ success: false, error: '预览失败' });
  }
});

/**
 * @api {delete} /api/v1/admin/videos/:id 删除视频
 * @apiName DeleteVideo
 * @apiGroup AdminVideos
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const key = req.query.key as string;
    
    // 验证管理员权限
    const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
    if (key !== ADMIN_KEY) {
      return res.status(403).json({ success: false, error: '无权限' });
    }
    
    // 查找视频文件
    const files = await fs.readdir(OUTPUT_DIR);
    const videoFile = files.find(f => f.includes(id) && f.endsWith('.mp4'));
    
    if (!videoFile) {
      return res.status(404).json({ success: false, error: '视频不存在' });
    }
    
    const filePath = path.join(OUTPUT_DIR, videoFile);
    
    // 删除文件
    await fs.unlink(filePath);
    
    res.json({ success: true, message: '视频已删除' });
  } catch (error) {
    console.error('[AdminVideos] Delete error:', error);
    res.status(500).json({ success: false, error: '删除失败' });
  }
});

/**
 * @api {post} /api/v1/admin/videos/generate-test 生成测试视频（带AI动漫图像）
 * @apiName GenerateTestVideo
 * @apiGroup AdminVideos
 * 
 * @apiBody {string} title 视频标题
 * @apiBody {number} [duration=10] 视频时长（秒）
 * @apiBody {string} [theme=xianxia] 主题风格
 */
router.post('/generate-test', async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;
    
    // 验证管理员权限
    const ADMIN_KEY = process.env.ADMIN_KEY || 'gopen_admin_2024';
    if (key !== ADMIN_KEY) {
      return res.status(403).json({ success: false, error: '无权限' });
    }
    
    const { title, duration = 10, theme = 'xianxia' } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: '请提供视频标题' });
    }
    
    // 主题关键词映射（用于图片搜索）
    const themeKeywords: Record<string, { keywords: string; unsplashId: string }> = {
      xianxia: { keywords: 'mountain,mist,fantasy', unsplashId: 'photo-1519681393784-d120267933ba' },
      wuxia: { keywords: 'bamboo,forest,asian', unsplashId: 'photo-1551524164-687a55dd1126' },
      zhanDou: { keywords: 'battle,sword,warrior', unsplashId: 'photo-1504196606672-aef5c910d614' },
      senlin: { keywords: 'forest,trees,nature', unsplashId: 'photo-1448375240586-882707db888b' },
      yejing: { keywords: 'night,stars,moon', unsplashId: 'photo-1507400492013-162706c8c05e' },
      richu: { keywords: 'sunrise,mountain,dawn', unsplashId: 'photo-1495616811223-4d98c6e9c869' },
    };
    
    // 颜色主题（降级方案用）
    const colorThemes: Record<string, { bg: string; text: string }> = {
      xianxia: { bg: '0x1a0a2e', text: 'white' },
      wuxia: { bg: '0x0a1a0a', text: '#aaffaa' },
      zhanDou: { bg: '0x2e0a0a', text: '#ffcc00' },
      senlin: { bg: '0x0a2e1a', text: '#aaffaa' },
      yejing: { bg: '0x0a0a2e', text: '#aaccff' },
      richu: { bg: '0x3e2a0a', text: '#ffddaa' },
    };
    
    const videoId = crypto.randomUUID();
    const safeTitle = title.substring(0, 15);
    
    // 创建临时目录
    const tempDir = '/tmp/gopen/temp';
    await fs.mkdir(tempDir, { recursive: true });
    const imageFramePath = path.join(tempDir, `image_frame_${videoId}.png`);
    const labeledFramePath = path.join(tempDir, `labeled_frame_${videoId}.png`);
    const outputPath = path.join(OUTPUT_DIR, `EP99_${safeTitle}_${videoId}.mp4`);
    
    // 中文字体路径
    const FONT_PATH = '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc';
    
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    let usedRealImage = false;
    const axios = (await import('axios')).default;
    
    try {
      // Step 1: 尝试使用AI生成动漫图像
      console.log('[AdminVideos] Attempting AI image generation for:', safeTitle);
      const { ImageGenerationClient, Config } = await import('coze-coding-dev-sdk');
      const config = new Config();
      const client = new ImageGenerationClient(config);
      
      const animePrompt = `anime style, high quality, detailed, cinematic lighting, vibrant colors, 4k, masterpiece, ${themeKeywords[theme]?.keywords || themeKeywords.xianxia.keywords}, ${safeTitle}`;
      
      const response = await client.generate({
        prompt: animePrompt,
        size: '2K',
        watermark: false,
      });
      
      const helper = client.getResponseHelper(response);
      
      if (helper.success && helper.imageUrls.length > 0) {
        const imageUrl = helper.imageUrls[0];
        console.log('[AdminVideos] AI image generated:', imageUrl);
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(imageFramePath, Buffer.from(imageResponse.data));
        usedRealImage = true;
      } else {
        throw new Error('AI generation returned no images');
      }
    } catch (aiError: any) {
      console.log('[AdminVideos] AI generation failed:', aiError.message);
      
      // Step 2: 降级到Unsplash图片
      try {
        const themeInfo = themeKeywords[theme] || themeKeywords.xianxia;
        // 使用Unsplash的高质量图片
        const unsplashUrl = `https://images.unsplash.com/${themeInfo.unsplashId}?w=1920&h=1080&fit=crop`;
        console.log('[AdminVideos] Using Unsplash image:', unsplashUrl);
        
        const imageResponse = await axios.get(unsplashUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(imageFramePath, Buffer.from(imageResponse.data));
        usedRealImage = true;
        console.log('[AdminVideos] Unsplash image downloaded');
      } catch (unsplashError: any) {
        console.log('[AdminVideos] Unsplash failed:', unsplashError.message);
        
        // Step 3: 最终降级到纯色背景
        const colorTheme = colorThemes[theme] || colorThemes.xianxia;
        const fallbackFrame = path.join(tempDir, `fallback_${videoId}.png`);
        
        const frameCmd = `ffmpeg -y -f lavfi -i "color=c=${colorTheme.bg}:s=1920x1080:d=1,format=yuv420p" \
          -vf "drawtext=fontfile='${FONT_PATH}':text='${safeTitle}':fontsize=72:fontcolor=${colorTheme.text}:x=(w-text_w)/2:y=(h-text_h)/2:borderw=5:bordercolor=black" \
          -frames:v 1 -update 1 "${imageFramePath}"`;
        await execAsync(frameCmd);
        console.log('[AdminVideos] Using solid color background');
      }
    }
    
    // Step 4: 在图像上添加标题文字
    const drawTextCmd = `ffmpeg -y -i "${imageFramePath}" -vf "drawtext=fontfile='${FONT_PATH}':text='${safeTitle}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-100:borderw=3:bordercolor=black" -frames:v 1 "${labeledFramePath}"`;
    await execAsync(drawTextCmd);
    
    // Step 5: 生成带动态效果的视频
    const fps = 25;
    const totalFrames = duration * fps;
    const videoCmd = `ffmpeg -y -loop 1 -i "${labeledFramePath}" \
      -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0003,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${fps},fade=t=in:st=0:d=1,fade=t=out:st=${duration-1}:d=1" \
      -c:v libx264 -preset medium -crf 18 -b:v 4M -maxrate 6M -bufsize 8M \
      -c:a aac -b:a 128k \
      -pix_fmt yuv420p -movflags +faststart \
      -t ${duration} "${outputPath}"`;
    
    console.log('[AdminVideos] Generating video...');
    await execAsync(videoCmd);
    console.log('[AdminVideos] Video generated:', outputPath);
    
    // 清理临时文件
    try {
      await fs.unlink(imageFramePath);
      await fs.unlink(labeledFramePath);
    } catch (e) {}
    
    // 获取视频信息
    const stats = await fs.stat(outputPath);
    
    res.json({
      success: true,
      data: {
        id: videoId,
        filename: path.basename(outputPath),
        title: safeTitle,
        episodeNumber: 99,
        size: stats.size,
        duration,
        resolution: '1920x1080',
        status: 'completed',
        outputPath,
        usedRealImage,
      },
    });
  } catch (error: any) {
    console.error('[AdminVideos] Generate test video error:', error);
    res.status(500).json({ success: false, error: error.message || '生成失败' });
  }
});

export default router;
