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
    
    // 设置响应头
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${videoFile}"`);
    
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

export default router;
