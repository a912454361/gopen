/**
 * SCF 专用 Express 应用工厂
 * 用于腾讯云函数计算环境
 */

import express from 'express';
import cors from 'cors';

// 导入所有路由
import payRouter from './routes/pay.js';
import paymentRouter from './routes/payment.js';
import oauthRouter from './routes/oauth.js';
import riskRouter from './routes/risk-control.js';
import billRouter from './routes/bill.js';
import offlineRouter from './routes/offline-sync.js';
import cloudRouter from './routes/cloud-storage.js';
import modelsRouter from './routes/models.js';
import billingRouter from './routes/billing.js';
import ollamaRouter from './routes/ollama.js';
import gpuRouter from './routes/gpu.js';
import wechatPayRouter from './routes/wechat-pay.js';
import adminRouter from './routes/admin.js';
import adminVideosRouter from './routes/admin-videos.js';
import aiGatewayRouter from './routes/ai-gateway.js';
import modelSyncRouter from './routes/model-sync.js';
import userRouter from './routes/user.js';
import authRouter from './routes/auth.js';
import promotionRouter from './routes/promotion.js';
import worksRouter from './routes/works.js';
import notificationsRouter from './routes/notifications.js';
import templatesRouter from './routes/templates.js';
import communityRouter from './routes/community.js';
import statsRouter from './routes/stats.js';
import imageRouter from './routes/image.js';
import inviteRouter from './routes/invite.js';
import promoAutoRouter from './routes/promo-auto.js';
import promoSystemRouter from './routes/promo-system.js';
import imageGenRouter from './routes/image-gen.js';
import chatHistoryRouter from './routes/chat-history.js';
import rechargeRouter from './routes/recharge.js';
import consumptionRouter from './routes/consumption.js';
import rewardsRouter from './routes/rewards.js';
import providersRouter from './routes/providers.js';
import videoRouter from './routes/video.js';
import videoGenRouter from './routes/video-generation.js';
import videoComposeRouter from './routes/video-composition.js';
import projectsRouter from './routes/projects.js';
import aliyunDriveRouter from './routes/aliyun-drive.js';
import generationTasksRouter from './routes/generation-tasks.js';
import animeRouter from './routes/anime.js';
import animeVideoRouter from './routes/anime-video.js';
import animeAdvancedRouter from './routes/anime-advanced.js';
import guofengAnimeRouter from './routes/guofeng-anime.js';
import gameRouter from './routes/game.js';
import gmRouter from './routes/gm.js';
import gameExtendedRouter from './routes/game-extended.js';
import videoStoryRouter from './routes/video-story.js';
import videoEffectsRouter from './routes/video-effects.js';
import cloudSyncRouter from './routes/cloud-sync.js';
import freeAnimeRouter from './routes/free-anime.js';
import ueEngineRouter from './routes/ue-engine.js';
import oneDayProductionRouter from './services/one-day-production-service.js';
import modelResilienceRouter from './services/model-resilience-service.js';
import jianpo80Router from './routes/jianpo-80.js';
import vendorRouter from './routes/vendor.js';
import adminVendorRouter from './routes/admin-vendor.js';
import ossRouter from './routes/oss.js';
import vendorStorageRouter from './routes/vendor-storage.js';
import storageConfigRouter from './routes/storage-config.js';
import inkCardGameRouter from './routes/ink-card-game.js';
import inkGameSystemsRouter from './routes/ink-game-systems.js';

/**
 * 创建并配置 Express 应用
 */
export async function createApp() {
  const app = express();

  // CORS 配置 - 适配腾讯云 SCF 函数 URL
  const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-Admin-Key',
      'X-Player-Id',
    ],
    exposedHeaders: ['Content-Length', 'Content-Range', 'X-Total-Count'],
    credentials: true,
    maxAge: 86400,
  };

  app.use(cors(corsOptions));

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 健康检查
  app.get('/api/v1/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: 'tencent-scf',
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // 注册所有 API 路由
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
  app.use('/api/v1/oss', ossRouter);
  app.use('/api/v1/vendor-storage', vendorStorageRouter);
  app.use('/api/v1/storage-config', storageConfigRouter);
  app.use('/api/v1/ink/cards', inkCardGameRouter);
  app.use('/api/v1/ink/systems', inkGameSystemsRouter);

  // 错误处理
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[SCF] Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  });

  // 404 处理
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
    });
  });

  return app;
}

export default createApp;
