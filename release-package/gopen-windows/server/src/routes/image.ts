import express, { type Request, type Response } from 'express';
import { Config, ImageGenerationClient, HeaderUtils } from 'coze-coding-dev-sdk';

const router = express.Router();
const config = new Config();

// AI图片生成
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, size = '1024x1024' } = req.body;

    if (!prompt) {
      res.status(400).json({ success: false, error: '提示词不能为空' });
      return;
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const client = new ImageGenerationClient(config, customHeaders);

    // 调用图片生成API
    const result = await client.generate({
      prompt,
      size,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Image generate error:', error);
    res.status(500).json({ success: false, error: '图片生成失败' });
  }
});

export default router;
