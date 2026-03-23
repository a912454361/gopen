/**
 * 服务端文件：server/src/services/one-day-production-service.ts
 * 24小时极速制作服务
 */

import { Router, type Request, type Response } from 'express';

// 生产阶段
const ProductionPhase = {
  PLANNING: 'planning',
  ASSET_PREP: 'asset_prep',
  PRODUCTION: 'production',
  POST: 'post',
  OUTPUT: 'output',
} as const;

type ProductionPhase = typeof ProductionPhase[keyof typeof ProductionPhase];

// 集数状态
interface Episode {
  number: number;
  title: string;
  status: 'pending' | 'scripting' | 'rendering' | 'audio' | 'completed';
  progress: number;
  scenes: Scene[];
  videoUrl?: string;
  audioUrl?: string;
}

interface Scene {
  id: string;
  name: string;
  duration: number;
  status: 'pending' | 'rendering' | 'completed';
}

// AI模型状态
interface AIModel {
  id: string;
  name: string;
  type: 'llm' | 'image' | 'video' | 'audio';
  status: 'idle' | 'working' | 'error';
  currentTask?: string;
  tasksCompleted: number;
}

// 生产状态
interface ProductionStatus {
  animeTitle: string;
  totalEpisodes: number;
  episodeDuration: number;
  currentPhase: ProductionPhase;
  startTime: Date;
  episodesCompleted: number;
  progress: number;
  aiModels: AIModel[];
  estimatedCompletion: Date;
}

class OneDayProductionService {
  private animeTitle: string;
  private totalEpisodes: number;
  private episodeDuration: number;
  private status: ProductionStatus;
  private episodes: Episode[];
  private aiModels: AIModel[];
  private isRunning: boolean = false;
  private startTime?: Date;

  constructor(animeTitle: string = '剑破苍穹', totalEpisodes: number = 80, episodeDuration: number = 20) {
    this.animeTitle = animeTitle;
    this.totalEpisodes = totalEpisodes;
    this.episodeDuration = episodeDuration;

    // 初始化集数
    this.episodes = Array.from({ length: totalEpisodes }, (_, i) => ({
      number: i + 1,
      title: `${animeTitle} 第${i + 1}集`,
      status: 'pending' as const,
      progress: 0,
      scenes: [],
    }));

    // 初始化AI模型
    this.aiModels = [
      { id: 'doubao-seed-pro', name: 'Doubao Seed Pro', type: 'llm', status: 'idle', tasksCompleted: 0 },
      { id: 'doubao-seed-lite', name: 'Doubao Seed Lite', type: 'llm', status: 'idle', tasksCompleted: 0 },
      { id: 'image-gen-2k', name: 'Image Gen 2K', type: 'image', status: 'idle', tasksCompleted: 0 },
      { id: 'image-gen-4k', name: 'Image Gen 4K', type: 'image', status: 'idle', tasksCompleted: 0 },
      { id: 'video-gen-720p', name: 'Video Gen 720p', type: 'video', status: 'idle', tasksCompleted: 0 },
      { id: 'video-gen-1080p', name: 'Video Gen 1080p', type: 'video', status: 'idle', tasksCompleted: 0 },
      { id: 'tts-zh', name: 'TTS Chinese', type: 'audio', status: 'idle', tasksCompleted: 0 },
      { id: 'tts-jp', name: 'TTS Japanese', type: 'audio', status: 'idle', tasksCompleted: 0 },
    ];

    this.status = {
      animeTitle,
      totalEpisodes,
      episodeDuration,
      currentPhase: ProductionPhase.PLANNING,
      startTime: new Date(),
      episodesCompleted: 0,
      progress: 0,
      aiModels: this.aiModels,
      estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  async startProduction(): Promise<{ success: boolean; data?: ProductionStatus; error?: string }> {
    if (this.isRunning) {
      return { success: false, error: 'Production already running' };
    }

    this.isRunning = true;
    this.startTime = new Date();
    this.status.startTime = this.startTime;

    console.log(`[OneDayProduction] Starting 24-hour production: ${this.animeTitle}`);
    console.log(`[OneDayProduction] Target: ${this.totalEpisodes} episodes × ${this.episodeDuration} minutes`);

    // 启动后台任务
    this.runProductionPipeline();

    return { success: true, data: this.status };
  }

  private async runProductionPipeline(): Promise<void> {
    // 阶段1: 前期策划 (0-2小时)
    await this.phasePlanning();
    
    // 阶段2: 资产准备 (2-6小时)
    await this.phaseAssetPrep();
    
    // 阶段3: 核心制作 (6-18小时)
    await this.phaseProduction();
    
    // 阶段4: 后期合成 (18-22小时)
    await this.phasePostProduction();
    
    // 阶段5: 最终输出 (22-24小时)
    await this.phaseOutput();
  }

  private async phasePlanning(): Promise<void> {
    this.status.currentPhase = ProductionPhase.PLANNING;
    console.log('[OneDayProduction] Phase 1: Planning started');

    // 并行生成剧本和角色设定
    const tasks = [
      this.generateAllScripts(),
      this.generateAllCharacters(),
      this.generateWorldSetting(),
    ];

    await Promise.all(tasks);
    console.log('[OneDayProduction] Phase 1: Planning completed');
  }

  private async phaseAssetPrep(): Promise<void> {
    this.status.currentPhase = ProductionPhase.ASSET_PREP;
    console.log('[OneDayProduction] Phase 2: Asset preparation started');

    // 创建场景资产
    const sceneTypes = ['山门', '练功房', '演武场', '藏经阁', '丹房', '城池', '战场', '秘境', '仙府', '凡间'];
    await Promise.all(sceneTypes.map(scene => this.createSceneAsset(scene)));

    console.log('[OneDayProduction] Phase 2: Asset preparation completed');
  }

  private async phaseProduction(): Promise<void> {
    this.status.currentPhase = ProductionPhase.PRODUCTION;
    console.log('[OneDayProduction] Phase 3: Core production started - Rendering 80 episodes');

    // 并行渲染所有集数
    const renderPromises = this.episodes.map((ep, index) => 
      this.renderEpisode(ep.number).then(() => {
        this.status.episodesCompleted++;
        this.status.progress = (this.status.episodesCompleted / this.totalEpisodes) * 100;
        console.log(`[OneDayProduction] Episode ${ep.number} completed (${this.status.episodesCompleted}/${this.totalEpisodes})`);
      })
    );

    // 分批执行，避免资源耗尽
    const batchSize = 8; // 8个并行
    for (let i = 0; i < renderPromises.length; i += batchSize) {
      const batch = renderPromises.slice(i, i + batchSize);
      await Promise.all(batch);
    }

    console.log('[OneDayProduction] Phase 3: Core production completed');
  }

  private async phasePostProduction(): Promise<void> {
    this.status.currentPhase = ProductionPhase.POST;
    console.log('[OneDayProduction] Phase 4: Post-production started');

    // 并行处理配音和合成
    await Promise.all(this.episodes.map(ep => 
      this.processAudioAndComposite(ep.number)
    ));

    console.log('[OneDayProduction] Phase 4: Post-production completed');
  }

  private async phaseOutput(): Promise<void> {
    this.status.currentPhase = ProductionPhase.OUTPUT;
    console.log('[OneDayProduction] Phase 5: Final output started');

    // 质量检测和打包
    await this.qualityCheck();
    await this.finalPackage();

    this.isRunning = false;
    console.log('[OneDayProduction] Production completed!');
  }

  // 模拟AI任务
  private async generateAllScripts(): Promise<void> {
    this.updateModelStatus('doubao-seed-pro', 'working', 'Generating 80 episode scripts');
    await this.simulateWork(5000); // 模拟5秒
    this.updateModelStatus('doubao-seed-pro', 'idle');
    
    this.episodes.forEach(ep => {
      ep.status = 'scripting';
      ep.progress = 10;
    });
  }

  private async generateAllCharacters(): Promise<void> {
    this.updateModelStatus('image-gen-4k', 'working', 'Generating character designs');
    await this.simulateWork(3000);
    this.updateModelStatus('image-gen-4k', 'idle');
  }

  private async generateWorldSetting(): Promise<void> {
    this.updateModelStatus('doubao-seed-lite', 'working', 'Building world setting');
    await this.simulateWork(2000);
    this.updateModelStatus('doubao-seed-lite', 'idle');
  }

  private async createSceneAsset(sceneName: string): Promise<void> {
    this.updateModelStatus('image-gen-2k', 'working', `Creating scene: ${sceneName}`);
    await this.simulateWork(500);
    this.updateModelStatus('image-gen-2k', 'idle');
  }

  private async renderEpisode(episodeNumber: number): Promise<void> {
    const ep = this.episodes[episodeNumber - 1];
    ep.status = 'rendering';

    // 6个场景
    const scenes = 6;
    for (let i = 1; i <= scenes; i++) {
      this.updateModelStatus('video-gen-1080p', 'working', `EP${episodeNumber} Scene${i}`);
      await this.simulateWork(800); // 每场景约0.8秒
      
      ep.scenes.push({
        id: `ep${episodeNumber}_scene${i}`,
        name: `场景${i}`,
        duration: this.episodeDuration * 60 / scenes,
        status: 'completed',
      });
      
      ep.progress = 10 + (i / scenes) * 80;
    }

    this.updateModelStatus('video-gen-1080p', 'idle');
    ep.progress = 90;
  }

  private async processAudioAndComposite(episodeNumber: number): Promise<void> {
    const ep = this.episodes[episodeNumber - 1];
    
    // 生成配音
    this.updateModelStatus('tts-zh', 'working', `EP${episodeNumber} Audio`);
    await this.simulateWork(400);
    this.updateModelStatus('tts-zh', 'idle');
    
    // 合成
    await this.simulateWork(300);
    
    ep.status = 'completed';
    ep.progress = 100;
    ep.videoUrl = `https://example.com/final/ep${episodeNumber}.mp4`;
    ep.audioUrl = `https://example.com/audio/ep${episodeNumber}.mp3`;
  }

  private async qualityCheck(): Promise<void> {
    await this.simulateWork(2000);
  }

  private async finalPackage(): Promise<void> {
    await this.simulateWork(1000);
  }

  private updateModelStatus(modelId: string, status: AIModel['status'], task?: string): void {
    const model = this.aiModels.find(m => m.id === modelId);
    if (model) {
      model.status = status;
      model.currentTask = task;
      if (status === 'idle' && task) {
        model.tasksCompleted++;
      }
    }
  }

  private simulateWork(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus(): ProductionStatus {
    const elapsed = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const remaining = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);

    return {
      ...this.status,
      progress: this.status.progress,
      estimatedCompletion: new Date(Date.now() + remaining),
    };
  }

  getEpisodeStatus(episodeNumber: number): Episode | null {
    return this.episodes[episodeNumber - 1] || null;
  }

  getAllEpisodes(): Episode[] {
    return this.episodes;
  }

  stopProduction(): void {
    this.isRunning = false;
    console.log('[OneDayProduction] Production stopped');
  }
}

// 单例实例
let productionInstance: OneDayProductionService | null = null;

// 获取或创建实例
function getProductionInstance(): OneDayProductionService {
  if (!productionInstance) {
    productionInstance = new OneDayProductionService();
  }
  return productionInstance;
}

// 路由
const router = Router();

/**
 * 启动24小时生产
 * POST /api/v1/one-day-production/start
 */
router.post('/start', (req: Request, res: Response) => {
  const { animeTitle = '剑破苍穹', totalEpisodes = 80, episodeDuration = 20 } = req.body;
  
  productionInstance = new OneDayProductionService(animeTitle, totalEpisodes, episodeDuration);
  
  productionInstance.startProduction()
    .then(result => {
      if (result.success) {
        res.json({ success: true, data: result.data });
      } else {
        res.status(400).json({ error: result.error });
      }
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

/**
 * 获取生产状态
 * GET /api/v1/one-day-production/status
 */
router.get('/status', (req: Request, res: Response) => {
  const instance = getProductionInstance();
  res.json({ success: true, data: instance.getStatus() });
});

/**
 * 获取所有集数状态
 * GET /api/v1/one-day-production/episodes
 */
router.get('/episodes', (req: Request, res: Response) => {
  const instance = getProductionInstance();
  res.json({ success: true, data: instance.getAllEpisodes() });
});

/**
 * 获取指定集数状态
 * GET /api/v1/one-day-production/episodes/:number
 */
router.get('/episodes/:number', (req: Request, res: Response) => {
  const episodeNumber = parseInt(req.params.number as string, 10);
  const instance = getProductionInstance();
  const episode = instance.getEpisodeStatus(episodeNumber);
  
  if (episode) {
    res.json({ success: true, data: episode });
  } else {
    res.status(404).json({ error: 'Episode not found' });
  }
});

/**
 * 停止生产
 * POST /api/v1/one-day-production/stop
 */
router.post('/stop', (req: Request, res: Response) => {
  const instance = getProductionInstance();
  instance.stopProduction();
  res.json({ success: true, message: 'Production stopped' });
});

export default router;
export { OneDayProductionService, ProductionPhase };
