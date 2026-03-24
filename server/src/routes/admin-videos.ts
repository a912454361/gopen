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
 * @api {post} /api/v1/admin/videos/generate-test 生成测试视频
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
    
    // 根据主题选择颜色
    const themes: Record<string, { bg: string; text: string }> = {
      xianxia: { bg: '0x1a0a2e', text: 'white' },      // 仙侠 - 紫蓝
      wuxia: { bg: '0x0a1a0a', text: '#aaffaa' },      // 武侠 - 深绿
      zhanDou: { bg: '0x2e0a0a', text: '#ffcc00' },    // 战斗 - 红橙
      senlin: { bg: '0x0a2e1a', text: '#aaffaa' },     // 森林 - 绿色
      yejing: { bg: '0x0a0a2e', text: '#aaccff' },     // 夜景 - 深蓝
      richu: { bg: '0x3e2a0a', text: '#ffddaa' },      // 日出 - 金橙
    };
    
    const colorTheme = themes[theme] || themes.xianxia;
    const videoId = crypto.randomUUID();
    const safeTitle = title.substring(0, 15);  // 保留中文，只截断长度
    
    // 创建临时帧
    const tempFrame = `/tmp/gopen/temp_frame_${videoId}.png`;
    const outputPath = path.join(OUTPUT_DIR, `EP99_${safeTitle}_${videoId}.mp4`);
    
    // 中文字体路径
    const FONT_PATH = '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc';
    
    // 使用 exec 动态导入
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Step 1: 生成帧图片（指定中文字体）
    // 使用fontfile参数指定字体文件路径
    const frameCmd = `ffmpeg -y -f lavfi -i "color=c=${colorTheme.bg}:s=1920x1080:d=1,format=yuv420p" \
      -vf "drawtext=fontfile='${FONT_PATH}':text='${safeTitle}':fontsize=72:fontcolor=${colorTheme.text}:x=(w-text_w)/2:y=(h-text_h)/2:borderw=5:bordercolor=black" \
      -frames:v 1 -update 1 "${tempFrame}"`;
    
    console.log('[AdminVideos] Generating frame with font:', FONT_PATH);
    await execAsync(frameCmd);
    
    // Step 2: 生成带动态效果的视频
    const fps = 25;
    const totalFrames = duration * fps;
    const videoCmd = `ffmpeg -y -loop 1 -i "${tempFrame}" \
      -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
      -vf "scale=1920:1080,zoompan=z='min(zoom+0.0003,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${fps},fade=t=in:st=0:d=1,fade=t=out:st=${duration-1}:d=1" \
      -c:v libx264 -preset medium -crf 18 -b:v 4M -maxrate 6M -bufsize 8M \
      -c:a aac -b:a 128k \
      -pix_fmt yuv420p -movflags +faststart \
      -t ${duration} "${outputPath}"`;
    
    console.log('[AdminVideos] Generating video...');
    await execAsync(videoCmd);
    
    // 清理临时文件
    try {
      await fs.unlink(tempFrame);
    } catch (e) {
      // 忽略
    }
    
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
      },
    });
  } catch (error: any) {
    console.error('[AdminVideos] Generate test video error:', error);
    res.status(500).json({ success: false, error: error.message || '生成失败' });
  }
});

export default router;
