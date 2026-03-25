// ============================================================
// 环境变量加载 - 必须在最开始执行
// ============================================================
// 触发重启 v2
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, '../.env') });

import express, { type Request, type Response } from "express";
import cors from "cors";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";

// ============================================================
// 启动安全自检 - 必须在最开始执行
// ============================================================
import { performSecurityCheck } from "./security/startup-check.js";

// 执行安全自检，如果检测到篡改则拒绝启动
if (!performSecurityCheck()) {
  console.error('[FATAL] 安全自检失败，服务拒绝启动！');
  process.exit(1);
}

// ============================================================
// 服务初始化
// ============================================================
import payRouter from "./routes/pay.js";
import paymentRouter from "./routes/payment.js";
import oauthRouter from "./routes/oauth.js";
import riskRouter from "./routes/risk-control.js";
import billRouter from "./routes/bill.js";
import offlineRouter from "./routes/offline-sync.js";
import cloudRouter from "./routes/cloud-storage.js";
import modelsRouter from "./routes/models.js";
import billingRouter from "./routes/billing.js";
import ollamaRouter from "./routes/ollama.js";
import gpuRouter from "./routes/gpu.js";
import wechatPayRouter from "./routes/wechat-pay.js";
import adminRouter from "./routes/admin.js";
import adminVideosRouter from "./routes/admin-videos.js";
import aiGatewayRouter from "./routes/ai-gateway.js";
import modelSyncRouter from "./routes/model-sync.js";
import userRouter from "./routes/user.js";
import authRouter from "./routes/auth.js";
import promotionRouter from "./routes/promotion.js";
import worksRouter from "./routes/works.js";
import notificationsRouter from "./routes/notifications.js";
import templatesRouter from "./routes/templates.js";
import communityRouter from "./routes/community.js";
import statsRouter from "./routes/stats.js";
import imageRouter from "./routes/image.js";
import inviteRouter from "./routes/invite.js";
import promoAutoRouter from "./routes/promo-auto.js";
import promoSystemRouter from "./routes/promo-system.js";
import imageGenRouter from "./routes/image-gen.js";
import chatHistoryRouter from "./routes/chat-history.js";
import rechargeRouter from "./routes/recharge.js";
import consumptionRouter from "./routes/consumption.js";
import rewardsRouter from "./routes/rewards.js";
import providersRouter from "./routes/providers.js";
import videoRouter from "./routes/video.js";
import videoGenRouter from "./routes/video-generation.js";
import videoComposeRouter from "./routes/video-composition.js";
import projectsRouter from "./routes/projects.js";
import aliyunDriveRouter from "./routes/aliyun-drive.js";
import generationTasksRouter from "./routes/generation-tasks.js";
import animeRouter from "./routes/anime.js";
import animeVideoRouter from "./routes/anime-video.js";
import animeAdvancedRouter from "./routes/anime-advanced.js";
import guofengAnimeRouter from "./routes/guofeng-anime.js";
import gameRouter from "./routes/game.js";
import gmRouter from "./routes/gm.js";
import gameExtendedRouter from "./routes/game-extended.js";
import videoStoryRouter from "./routes/video-story.js";
import videoEffectsRouter from "./routes/video-effects.js";
import cloudSyncRouter from "./routes/cloud-sync.js";
import freeAnimeRouter from "./routes/free-anime.js";
import ueEngineRouter from "./routes/ue-engine.js";
import oneDayProductionRouter from "./services/one-day-production-service.js";
import modelResilienceRouter from "./services/model-resilience-service.js";
import jianpo80Router from "./routes/jianpo-80.js";
import vendorRouter from "./routes/vendor.js";
import adminVendorRouter from "./routes/admin-vendor.js";
import { startScheduler } from "./promo-scheduler.js";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize LLM Client
const config = new Config();

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/api/v1/pay', payRouter);
app.use('/api/v1/payment', paymentRouter);
app.use('/api/v1/wechat-pay', wechatPayRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/admin/videos', adminVideosRouter);
app.use('/api/v1/oauth', oauthRouter);
app.use('/api/v1/risk', riskRouter);
app.use('/api/v1/bill', billRouter);
app.use('/api/v1/offline', offlineRouter);
app.use('/api/v1/cloud', cloudRouter);
app.use('/api/v1/models', modelsRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/ollama', ollamaRouter);
app.use('/api/v1/gpu', gpuRouter);
app.use('/api/v1/ai', aiGatewayRouter);
app.use('/api/v1/model-sync', modelSyncRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/promotion', promotionRouter);
app.use('/api/v1/works', worksRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/templates', templatesRouter);
app.use('/api/v1/community', communityRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/image', imageRouter);
app.use('/api/v1/invite', inviteRouter);
app.use('/api/v1/promo', promoAutoRouter);
app.use('/api/v1/promo/system', promoSystemRouter);
app.use('/api/v1/image-gen', imageGenRouter);
app.use('/api/v1/chat-history', chatHistoryRouter);
app.use('/api/v1/recharge', rechargeRouter);
app.use('/api/v1/consumption', consumptionRouter);
app.use('/api/v1/rewards', rewardsRouter);
app.use('/api/v1/providers', providersRouter);
app.use('/api/v1/video', videoRouter);
app.use('/api/v1/video-gen', videoGenRouter);
app.use('/api/v1/compose', videoComposeRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/aliyun-drive', aliyunDriveRouter);
app.use('/api/v1/generation-tasks', generationTasksRouter);
app.use('/api/v1/anime', animeRouter);
app.use('/api/v1/anime-video', animeVideoRouter);
app.use('/api/v1/anime-advanced', animeAdvancedRouter);
app.use('/api/v1/guofeng-anime', guofengAnimeRouter);
app.use('/api/v1/game', gameRouter);
app.use('/api/v1/gm', gmRouter);
app.use('/api/v1/game', gameExtendedRouter);
app.use('/api/v1/video/story', videoStoryRouter);
app.use('/api/v1/video-effects', videoEffectsRouter);
app.use('/api/v1/cloud-sync', cloudSyncRouter);
app.use('/api/v1/free-anime', freeAnimeRouter);
app.use('/api/v1/ue-engine', ueEngineRouter);
app.use('/api/v1/one-day-production', oneDayProductionRouter);
app.use('/api/v1/model-resilience', modelResilienceRouter);
app.use('/api/v1/jianpo-80', jianpo80Router);
app.use('/api/v1/vendor', vendorRouter);
app.use('/api/v1/admin/vendor', adminVendorRouter);

// AI Chat Stream Endpoint (SSE)
app.post('/api/v1/chat/stream', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, no-transform, must-revalidate');
  res.setHeader('Connection', 'keep-alive');

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是 Claw AI，一个专业的游戏和动漫创作助手。
你帮助用户设计角色、场景、剧情和游戏机制。
你要富有创意、详细具体、充满启发性。使用未来感、科技感的语气。
在讨论技术细节时，要精确且有帮助。
始终鼓励创意，提供可操作的建议。
请使用中文回复用户。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ];

    const stream = client.stream(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        const content = chunk.content.toString();
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat stream error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
    res.end();
  }
});

// Chat endpoint (non-streaming)
app.post('/api/v1/chat', async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `你是 Claw AI，一个专业的游戏和动漫创作助手。
你帮助用户设计角色、场景、剧情和游戏机制。
你要富有创意、详细具体、充满启发性。使用未来感、科技感的语气。
在讨论技术细节时，要精确且有帮助。
始终鼓励创意，提供可操作的建议。
请使用中文回复用户。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ];

    const response = await client.chat(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    res.json({ content: response.content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
  
  // Start promo scheduler
  startScheduler();
});
