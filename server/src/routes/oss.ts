/**
 * OSS 文件存储 API
 * 提供文件上传、下载、删除等接口
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import {
  uploadFile,
  getSignedUrl,
  deleteFile,
  deleteFiles,
  fileExists,
  listFiles,
  generateFilename,
} from '../storage/oss-client.js';

const router = Router();

// 配置 multer 用于接收文件
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 最大 50MB
  },
});

// ==================== 文件上传 ====================

/**
 * 单文件上传
 * POST /api/v1/oss/upload
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未找到上传文件' });
    }

    const { folder = 'uploads', bucket } = req.body;

    // 生成文件名
    const filename = generateFilename(req.file.originalname, folder);

    // 上传到 OSS
    const result = await uploadFile(filename, req.file.buffer, {
      bucket: bucket === 'secondary' ? 'secondary' : 'primary',
      contentType: req.file.mimetype,
    });

    if (!result) {
      return res.status(500).json({ error: '上传失败' });
    }

    // 获取签名 URL
    const signedUrl = await getSignedUrl(filename, 3600, bucket === 'secondary' ? 'secondary' : 'primary');

    res.json({
      success: true,
      data: {
        filename: result.name,
        url: result.url,
        signedUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: '上传失败' });
  }
});

// ==================== 批量上传 ====================

/**
 * 多文件上传
 * POST /api/v1/oss/upload-multi
 */
router.post('/upload-multi', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: '未找到上传文件' });
    }

    const { folder = 'uploads', bucket } = req.body;

    const results = [];
    for (const file of files) {
      const filename = generateFilename(file.originalname, folder);
      const result = await uploadFile(filename, file.buffer, {
        bucket: bucket === 'secondary' ? 'secondary' : 'primary',
        contentType: file.mimetype,
      });

      if (result) {
        results.push({
          filename: result.name,
          url: result.url,
          size: file.size,
          mimetype: file.mimetype,
        });
      }
    }

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Multi upload error:', error);
    res.status(500).json({ error: '批量上传失败' });
  }
});

// ==================== 获取签名 URL ====================

const getSignedUrlSchema = z.object({
  filename: z.string(),
  expires: z.number().optional().default(3600),
  bucket: z.enum(['primary', 'secondary']).optional().default('primary'),
});

/**
 * 获取文件签名 URL
 * GET /api/v1/oss/signed-url
 */
router.get('/signed-url', async (req: Request, res: Response) => {
  try {
    const { filename, expires, bucket } = getSignedUrlSchema.parse(req.query);

    const url = await getSignedUrl(filename, expires, bucket);

    if (!url) {
      return res.status(404).json({ error: '获取签名 URL 失败' });
    }

    res.json({
      success: true,
      data: {
        url,
        expires,
      },
    });
  } catch (error) {
    console.error('Get signed URL error:', error);
    res.status(400).json({ error: '参数错误' });
  }
});

// ==================== 删除文件 ====================

const deleteFileSchema = z.object({
  filename: z.string(),
  bucket: z.enum(['primary', 'secondary']).optional().default('primary'),
});

/**
 * 删除单个文件
 * DELETE /api/v1/oss/file
 */
router.delete('/file', async (req: Request, res: Response) => {
  try {
    const { filename, bucket } = deleteFileSchema.parse(req.body);

    const success = await deleteFile(filename, bucket);

    if (!success) {
      return res.status(500).json({ error: '删除失败' });
    }

    res.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(400).json({ error: '删除失败' });
  }
});

/**
 * 批量删除文件
 * DELETE /api/v1/oss/files
 */
router.delete('/files', async (req: Request, res: Response) => {
  try {
    const { filenames, bucket } = z.object({
      filenames: z.array(z.string()),
      bucket: z.enum(['primary', 'secondary']).optional().default('primary'),
    }).parse(req.body);

    const success = await deleteFiles(filenames, bucket);

    if (!success) {
      return res.status(500).json({ error: '批量删除失败' });
    }

    res.json({
      success: true,
      message: '批量删除成功',
      count: filenames.length,
    });
  } catch (error) {
    console.error('Delete files error:', error);
    res.status(400).json({ error: '批量删除失败' });
  }
});

// ==================== 检查文件是否存在 ====================

/**
 * 检查文件是否存在
 * GET /api/v1/oss/exists
 */
router.get('/exists', async (req: Request, res: Response) => {
  try {
    const { filename, bucket } = deleteFileSchema.parse(req.query);

    const exists = await fileExists(filename, bucket);

    res.json({
      success: true,
      data: {
        filename,
        exists,
      },
    });
  } catch (error) {
    console.error('Check file exists error:', error);
    res.status(400).json({ error: '检查失败' });
  }
});

// ==================== 列出文件 ====================

/**
 * 列出指定前缀的文件
 * GET /api/v1/oss/list
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { prefix, bucket, maxKeys } = z.object({
      prefix: z.string().optional().default(''),
      bucket: z.enum(['primary', 'secondary']).optional().default('primary'),
      maxKeys: z.string().optional().default('100'),
    }).parse(req.query);

    const files = await listFiles(prefix, bucket, parseInt(maxKeys));

    res.json({
      success: true,
      data: files || [],
      count: files?.length || 0,
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(400).json({ error: '获取文件列表失败' });
  }
});

// ==================== 存储空间信息 ====================

/**
 * 获取 OSS 配置信息
 * GET /api/v1/oss/info
 */
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      primaryBucket: process.env.OSS_BUCKET_PRIMARY || '',
      secondaryBucket: process.env.OSS_BUCKET_SECONDARY || '',
      region: process.env.OSS_REGION || '',
      endpoint: process.env.OSS_ENDPOINT || '',
      configured: !!(process.env.OSS_ACCESS_KEY_ID && process.env.OSS_ACCESS_KEY_SECRET),
    },
  });
});

export default router;
