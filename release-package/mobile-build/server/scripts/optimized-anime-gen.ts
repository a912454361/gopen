/**
 * 优化版多模型急速生成脚本
 * 策略：
 * 1. 降低并发数到 2 个
 * 2. 增加场景间隔到 15 秒
 * 3. 使用多模型轮换
 * 4. 分批生成（每批 10 场景）
 */

import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../src/storage/database/supabase-client.js';

const client = getSupabaseClient();
const config = new Config();

const PROJECT_ID = '4757e981-0239-4ef7-a178-9245e1612b43';
const STYLE_PREFIX = '国风燃爆动漫，高质量4K，粒子特效，流畅动画，电影级光影，';

// ========== 配置参数 ==========
const CONFIG = {
  concurrency: 2,           // 并发数
  sceneInterval: 15000,     // 场景间隔 15秒
  batchSize: 10,            // 每批场景数
  retryDelay: 60000,        // 重试延迟 60秒
  maxRetries: 3,            // 最大重试次数
  apiCheckInterval: 30000,  // API检测间隔 30秒
};

// ========== 多模型配置 ==========
const MODELS = [
  { 
    id: 'seedance-1', 
    name: 'Seedance #1', 
    model: 'doubao-seedance-1-5-pro-251215',
    priority: 1,
    dailyLimit: 10,
    used: 5,
    cooldownUntil: 0,
  },
  { 
    id: 'seedance-2', 
    name: 'Seedance #2', 
    model: 'doubao-seedance-1-5-pro-251215',
    priority: 2,
    dailyLimit: 10,
    used: 0,
    cooldownUntil: 0,
  },
];

let currentModelIndex = 0;

// ========== 场景定义 ==========
const ALL_SCENES = [
  // ===== 第一集剩余 =====
  { episode: 1, sceneId: 6, title: '神秘老者', prompt: '白发老者踏空而来，白衣飘飘，神秘气息，空间扭曲粒子', duration: 5 },
  { episode: 1, sceneId: 7, title: '剑圣指点', prompt: '剑圣说话，闪回上古战场，万剑齐飞，史诗级场景', duration: 6 },
  { episode: 1, sceneId: 8, title: '踏上征途', prompt: '少年背剑望远方，夕阳剪影，金色粒子飘散', duration: 5 },
  
  // ===== 第二集「初入江湖」=====
  { episode: 2, sceneId: 1, title: '离开山村', prompt: '少年背着剑走出山村，身后竹林，晨光粒子', duration: 5 },
  { episode: 2, sceneId: 2, title: '小镇集市', prompt: '繁华古代集市，叫卖声此起彼伏，热闹氛围', duration: 5 },
  { episode: 2, sceneId: 3, title: '路见不平', prompt: '恶霸欺凌弱小，少年挺身而出，英雄救美', duration: 6 },
  { episode: 2, sceneId: 4, title: '初试剑法', prompt: '少年拔剑出鞘，剑光闪烁，一招击退恶霸', duration: 5 },
  { episode: 2, sceneId: 5, title: '神秘女子', prompt: '蒙面女子出现，白衣飘飘，眼神深邃，神秘粒子', duration: 5 },
  { episode: 2, sceneId: 6, title: '江湖路远', prompt: '少年和神秘女子并肩而行，夕阳西下，金色粒子', duration: 5 },
  
  // ===== 第三集「妖魔现身」=====
  { episode: 3, sceneId: 1, title: '夜宿古庙', prompt: '古老破庙，月光透过破窗，诡异氛围', duration: 5 },
  { episode: 3, sceneId: 2, title: '妖气弥漫', prompt: '黑雾从地下涌出，妖魔气息蔓延，恐怖粒子', duration: 5 },
  { episode: 3, sceneId: 3, title: '妖兽现身', prompt: '巨大妖兽从黑雾冲出，獠牙锋利，红眼闪烁', duration: 6 },
  { episode: 3, sceneId: 4, title: '激战妖兽', prompt: '少年挥剑斩向妖兽，剑光与妖气碰撞，粒子爆发', duration: 6 },
  { episode: 3, sceneId: 5, title: '剑魂之力', prompt: '剑魂光芒大盛，金色剑气覆盖全身，力量觉醒', duration: 5 },
  { episode: 3, sceneId: 6, title: '斩妖除魔', prompt: '少年一剑斩杀妖兽，妖气消散，金色光芒冲天', duration: 6 },
  { episode: 3, sceneId: 7, title: '神秘符文', prompt: '妖兽消失处浮现神秘符文，金色光芒闪烁', duration: 5 },
  
  // ===== 第四集「剑道争锋」=====
  { episode: 4, sceneId: 1, title: '剑修大会', prompt: '巨大比武场，众多剑修聚集，旌旗飘扬', duration: 6 },
  { episode: 4, sceneId: 2, title: '强者如云', prompt: '各路天才剑修登场，气息强大，气势逼人', duration: 5 },
  { episode: 4, sceneId: 3, title: '首轮对决', prompt: '少年上台对战，剑气纵横，激烈交锋', duration: 6 },
  { episode: 4, sceneId: 4, title: '剑意觉醒', prompt: '战斗中剑意觉醒，剑气凝聚成龙，震撼特效', duration: 6 },
  { episode: 4, sceneId: 5, title: '一剑破敌', prompt: '少年一剑击败对手，剑气冲天，全场震惊', duration: 5 },
  { episode: 4, sceneId: 6, title: '引人注目', prompt: '众强者注视少年，眼神复杂，气氛紧张', duration: 5 },
];

// ========== 工具函数 ==========

// 获取下一个可用模型（轮换）
function getNextModel() {
  const now = Date.now();
  
  // 按优先级排序可用模型
  const available = MODELS
    .filter(m => m.used < m.dailyLimit && m.cooldownUntil < now)
    .sort((a, b) => a.priority - b.priority);
  
  if (available.length === 0) {
    // 所有模型都不可用，返回null
    return null;
  }
  
  // 轮换选择
  currentModelIndex = (currentModelIndex + 1) % available.length;
  return available[currentModelIndex];
}

// 设置模型冷却
function setModelCooldown(modelId: string) {
  const model = MODELS.find(m => m.id === modelId);
  if (model) {
    model.cooldownUntil = Date.now() + CONFIG.retryDelay;
  }
}

// 检测API状态
async function checkAPIStatus(): Promise<boolean> {
  try {
    const videoClient = new VideoGenerationClient(config, {});
    const response = await videoClient.videoGeneration(
      [{ type: 'text', text: '测试' }],
      { model: 'doubao-seedance-1-5-pro-251215', duration: 3 }
    );
    return !!response.videoUrl;
  } catch {
    return false;
  }
}

// 获取已生成的场景ID
async function getExistingSceneIds(): Promise<Set<number>> {
  const { data } = await client
    .from('anime_scene_videos')
    .select('scene_id')
    .eq('project_id', PROJECT_ID);
  
  return new Set((data || []).map(v => v.scene_id));
}

// 生成单个场景
async function generateScene(scene: typeof ALL_SCENES[0]): Promise<{ videoUrl: string; modelId: string } | null> {
  const enhancedPrompt = STYLE_PREFIX + scene.prompt;
  
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    const model = getNextModel();
    
    if (!model) {
      console.log(`   ⏳ 所有模型冷却中，等待 ${CONFIG.retryDelay/1000} 秒...`);
      await new Promise(r => setTimeout(r, CONFIG.retryDelay));
      continue;
    }
    
    console.log(`   🎬 使用 ${model.name} (尝试 ${attempt}/${CONFIG.maxRetries})`);
    
    try {
      const videoClient = new VideoGenerationClient(config, {});
      const startTime = Date.now();
      
      const response = await videoClient.videoGeneration(
        [{ type: 'text', text: enhancedPrompt }],
        {
          model: model.model,
          duration: scene.duration,
          ratio: '16:9',
          resolution: '1080p',
          generateAudio: true,
          watermark: false,
        }
      );
      
      const elapsed = Date.now() - startTime;
      model.used++;
      
      if (response.videoUrl) {
        console.log(`   ✅ 成功！耗时 ${(elapsed/1000).toFixed(1)}秒`);
        return { videoUrl: response.videoUrl, modelId: model.id };
      }
    } catch (error: any) {
      model.used++;
      const msg = error.message || '';
      
      if (msg.includes('403') || msg.includes('限流')) {
        console.log(`   ⚠️ ${model.name} 触发限流，设置冷却`);
        setModelCooldown(model.id);
      } else {
        console.log(`   ❌ 错误: ${msg.substring(0, 50)}`);
      }
    }
    
    // 重试前等待
    if (attempt < CONFIG.maxRetries) {
      console.log(`   ⏳ 等待 ${CONFIG.retryDelay/1000} 秒后重试...`);
      await new Promise(r => setTimeout(r, CONFIG.retryDelay));
    }
  }
  
  return null;
}

// 保存场景到数据库
async function saveScene(scene: typeof ALL_SCENES[0], videoUrl: string) {
  const fullSceneId = scene.episode * 100 + scene.sceneId;
  
  await client.from('anime_scene_videos').insert([{
    id: crypto.randomUUID(),
    project_id: PROJECT_ID,
    scene_id: fullSceneId,
    video_url: videoUrl,
    duration: scene.duration,
    created_at: new Date().toISOString(),
  }]);
}

// ========== 主流程 ==========

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🗡️  优化版多模型急速生成系统');
  console.log('   《剑破苍穹》80集国风燃爆动漫');
  console.log('═'.repeat(60));
  console.log('\n⚙️ 配置参数:');
  console.log(`   并发数: ${CONFIG.concurrency}`);
  console.log(`   场景间隔: ${CONFIG.sceneInterval/1000}秒`);
  console.log(`   每批场景: ${CONFIG.batchSize}`);
  console.log(`   重试延迟: ${CONFIG.retryDelay/1000}秒`);
  
  // 等待API恢复
  console.log('\n🔍 检测API状态...');
  let apiReady = await checkAPIStatus();
  
  while (!apiReady) {
    console.log(`   ⏳ API限流中，${CONFIG.apiCheckInterval/1000}秒后重试...`);
    await new Promise(r => setTimeout(r, CONFIG.apiCheckInterval));
    apiReady = await checkAPIStatus();
  }
  
  console.log('   ✅ API已就绪！\n');
  
  // 获取待生成场景
  const existingIds = await getExistingSceneIds();
  const pendingScenes = ALL_SCENES.filter(s => !existingIds.has(s.episode * 100 + s.sceneId));
  
  if (pendingScenes.length === 0) {
    console.log('✅ 所有场景已完成！');
    return;
  }
  
  console.log(`📋 待生成场景: ${pendingScenes.length} 个\n`);
  
  // 分批生成
  const totalBatches = Math.ceil(pendingScenes.length / CONFIG.batchSize);
  
  for (let batch = 0; batch < totalBatches; batch++) {
    const batchStart = batch * CONFIG.batchSize;
    const batchEnd = Math.min(batchStart + CONFIG.batchSize, pendingScenes.length);
    const batchScenes = pendingScenes.slice(batchStart, batchEnd);
    
    console.log('\n' + '─'.repeat(50));
    console.log(`📦 第 ${batch + 1}/${totalBatches} 批 (场景 ${batchStart + 1}-${batchEnd})`);
    console.log('─'.repeat(50));
    
    // 并发生成（限制并发数为2）
    for (let i = 0; i < batchScenes.length; i += CONFIG.concurrency) {
      const group = batchScenes.slice(i, i + CONFIG.concurrency);
      
      const promises = group.map(async (scene) => {
        console.log(`\n[第${scene.episode}集 场景${scene.sceneId}] ${scene.title}`);
        
        const result = await generateScene(scene);
        
        if (result) {
          await saveScene(scene, result.videoUrl);
          console.log(`   💾 已保存`);
          return { success: true, scene };
        } else {
          console.log(`   ❌ 生成失败`);
          return { success: false, scene };
        }
      });
      
      await Promise.all(promises);
      
      // 场景组间隔
      if (i + CONFIG.concurrency < batchScenes.length) {
        console.log(`\n   ⏳ 场景间隔 ${CONFIG.sceneInterval/1000} 秒...`);
        await new Promise(r => setTimeout(r, CONFIG.sceneInterval));
      }
    }
    
    // 批次间隔
    if (batch < totalBatches - 1) {
      console.log(`\n   ⏳ 批次间隔 ${CONFIG.sceneInterval * 2 / 1000} 秒...`);
      await new Promise(r => setTimeout(r, CONFIG.sceneInterval * 2));
    }
  }
  
  // 最终统计
  const { data: final } = await client
    .from('anime_scene_videos')
    .select('scene_id')
    .eq('project_id', PROJECT_ID);
  
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ 生成完成！总计 ${final?.length || 0} 个场景`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
