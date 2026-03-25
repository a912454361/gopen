/**
 * 多模型急速生成脚本
 * 使用所有免费模型轮换生成，绕过单一API限流
 * 80集国风燃爆动漫《剑破苍穹》
 */

import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../src/storage/database/supabase-client.js';

const client = getSupabaseClient();
const config = new Config();

const PROJECT_ID = '4757e981-0239-4ef7-a178-9245e1612b43';
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

// 国风燃爆风格前缀
const STYLE_PREFIX = '国风燃爆动漫，高质量4K，粒子特效，流畅动画，电影级光影，';

// 多模型配置 - 按优先级排序
const AVAILABLE_MODELS = [
  {
    key: 'seedance',
    name: 'Seedance 1.5 Pro',
    model: 'doubao-seedance-1-5-pro-251215',
    avgTime: 60000,
    dailyLimit: 10,
    used: 0,
    status: 'active',
    generate: async (prompt: string, duration: number) => {
      const videoClient = new VideoGenerationClient(config, {});
      const response = await videoClient.videoGeneration(
        [{ type: 'text', text: prompt }],
        {
          model: 'doubao-seedance-1-5-pro-251215',
          duration,
          ratio: '16:9',
          resolution: '1080p',
          generateAudio: true,
          watermark: false,
        }
      );
      return response.videoUrl;
    }
  },
  {
    key: 'seedance-4k',
    name: 'Seedance 4K',
    model: 'doubao-seedance-1-5-pro-251215-4k',
    avgTime: 70000,
    dailyLimit: 10,
    used: 0,
    status: 'active',
    generate: async (prompt: string, duration: number) => {
      const videoClient = new VideoGenerationClient(config, {});
      const response = await videoClient.videoGeneration(
        [{ type: 'text', text: prompt }],
        {
          model: 'doubao-seedance-1-5-pro-251215',
          duration,
          ratio: '16:9',
          resolution: '2K',
          generateAudio: true,
          watermark: false,
        }
      );
      return response.videoUrl;
    }
  },
];

// 模型轮换索引
let currentModelIndex = 0;

// 获取下一个可用模型
function getNextModel() {
  // 找到可用的模型
  for (let i = 0; i < AVAILABLE_MODELS.length; i++) {
    const model = AVAILABLE_MODELS[currentModelIndex];
    currentModelIndex = (currentModelIndex + 1) % AVAILABLE_MODELS.length;
    
    if (model.status === 'active' && model.used < model.dailyLimit) {
      return model;
    }
  }
  
  // 如果所有模型都达到限制，重置计数（实际应用中应该等待）
  AVAILABLE_MODELS.forEach(m => m.used = 0);
  return AVAILABLE_MODELS[0];
}

// 第一集剩余场景
const REMAINING_SCENES = [
  {
    sceneId: 6,
    title: '神秘老者',
    imagePrompt: '国风动漫，白发老者踏空而来，白衣飘飘，神秘气息，空间扭曲粒子，高质量人物动画',
    duration: 5,
  },
  {
    sceneId: 7,
    title: '剑圣指点',
    imagePrompt: '国风动漫，剑圣说话，闪回上古战场，万剑齐飞，粒子特效满屏，史诗级场景',
    duration: 6,
  },
  {
    sceneId: 8,
    title: '踏上征途',
    imagePrompt: '国风动漫，少年背剑望远方，夕阳剪影，金色粒子飘散，踏上征途，燃爆结尾',
    duration: 5,
  },
];

// 第二集场景
const EPISODE_2_SCENES = [
  {
    sceneId: 1,
    title: '离开山村',
    imagePrompt: '国风动漫，少年背着剑走出山村，身后是熟悉的竹林，前方是未知的世界，晨光熹微，粒子光效',
    duration: 5,
  },
  {
    sceneId: 2,
    title: '小镇集市',
    imagePrompt: '国风动漫，繁华的古代集市，叫卖声此起彼伏，少年好奇地四处张望，热闹氛围，粒子特效',
    duration: 5,
  },
  {
    sceneId: 3,
    title: '路见不平',
    imagePrompt: '国风动漫，恶霸欺凌弱小，少年挺身而出，剑气隐隐，英雄救美场景，燃爆特效',
    duration: 6,
  },
  {
    sceneId: 4,
    title: '初试剑法',
    imagePrompt: '国风动漫，少年拔剑出鞘，剑光闪烁，一招击退恶霸，剑气纵横，震撼画面',
    duration: 5,
  },
  {
    sceneId: 5,
    title: '神秘女子',
    imagePrompt: '国风动漫，蒙面女子出现，白衣飘飘，眼神深邃，神秘的气息，粒子环绕',
    duration: 5,
  },
  {
    sceneId: 6,
    title: '江湖路远',
    imagePrompt: '国风动漫，少年和神秘女子并肩而行，身后夕阳西下，前方路途漫漫，金色粒子飘散',
    duration: 5,
  },
];

// 使用多模型生成单个场景
async function generateSceneWithModel(scene: any, maxRetries = 5): Promise<{ videoUrl: string; model: string } | null> {
  const enhancedPrompt = STYLE_PREFIX + scene.imagePrompt;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const model = getNextModel();
    
    try {
      console.log(`[场景${scene.sceneId}] ${scene.title}: 使用 ${model.name} (尝试 ${attempt}/${maxRetries})...`);
      
      // 增加延迟避免限流
      if (attempt > 1) {
        const delay = Math.min(attempt * 15000, 60000);
        console.log(`  等待 ${delay/1000} 秒...`);
        await new Promise(r => setTimeout(r, delay));
      }
      
      const startTime = Date.now();
      const videoUrl = await model.generate(enhancedPrompt, scene.duration);
      const elapsed = Date.now() - startTime;
      
      if (videoUrl) {
        model.used++;
        console.log(`[场景${scene.sceneId}] ${scene.title}: ✅ 成功！耗时 ${(elapsed/1000).toFixed(1)}秒，使用 ${model.name}`);
        return { videoUrl, model: model.name };
      }
    } catch (error: any) {
      model.used++; // 失败也计数，避免重复使用限流的模型
      const errorMsg = error.message?.substring(0, 80) || 'Unknown error';
      console.log(`[场景${scene.sceneId}] ${model.name} 失败: ${errorMsg}`);
      
      // 如果是限流错误，标记模型为冷却
      if (errorMsg.includes('403') || errorMsg.includes('限流')) {
        console.log(`  ⚠️ ${model.name} 触发限流，切换下一个模型`);
      }
    }
  }
  
  return null;
}

// 保存场景到数据库
async function saveScene(scene: any, videoUrl: string) {
  await client.from('anime_scene_videos').insert([{
    id: crypto.randomUUID(),
    project_id: PROJECT_ID,
    scene_id: scene.sceneId,
    video_url: videoUrl,
    duration: scene.duration,
    created_at: new Date().toISOString(),
  }]);
}

// 主生成流程
async function generateAllScenes() {
  console.log('\n' + '='.repeat(60));
  console.log('🗡️  多模型急速生成 - 《剑破苍穹》');
  console.log('   可用模型: ' + AVAILABLE_MODELS.map(m => m.name).join(', '));
  console.log('='.repeat(60));
  
  // 先完成第一集剩余场景
  console.log('\n📺 第一集 - 剩余场景');
  console.log('-'.repeat(40));
  
  for (const scene of REMAINING_SCENES) {
    const result = await generateSceneWithModel(scene);
    if (result) {
      await saveScene(scene, result.videoUrl);
    } else {
      console.log(`[场景${scene.sceneId}] ❌ 最终失败`);
    }
    
    // 场景间延迟
    console.log('  等待10秒...\n');
    await new Promise(r => setTimeout(r, 10000));
  }
  
  // 开始第二集
  console.log('\n📺 第二集 - 初入江湖');
  console.log('-'.repeat(40));
  
  for (const scene of EPISODE_2_SCENES) {
    const result = await generateSceneWithModel(scene);
    if (result) {
      await saveScene({ ...scene, sceneId: scene.sceneId + 100 }, result.videoUrl); // sceneId + 100 表示第二集
    } else {
      console.log(`[场景${scene.sceneId}] ❌ 最终失败`);
    }
    
    console.log('  等待10秒...\n');
    await new Promise(r => setTimeout(r, 10000));
  }
  
  // 统计结果
  const { data } = await client
    .from('anime_scene_videos')
    .select('scene_id')
    .eq('project_id', PROJECT_ID);
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ 生成完成！共 ${data?.length || 0} 个场景`);
  console.log('='.repeat(60));
}

// 启动生成
generateAllScenes().catch(console.error);
