/**
 * 智能多模型急速生成系统
 * 支持多模型轮换、自动冷却、最优模型选择
 * 80集国风燃爆动漫《剑破苍穹》
 */

import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../src/storage/database/supabase-client.js';

const client = getSupabaseClient();
const config = new Config();

const PROJECT_ID = '4757e981-0239-4ef7-a178-9245e1612b43';

// 国风燃爆风格
const STYLE_PREFIX = '国风燃爆动漫，高质量4K，粒子特效，流畅动画，电影级光影，';

// 模型状态管理
interface ModelState {
  key: string;
  name: string;
  used: number;
  dailyLimit: number;
  lastUsed: number;
  cooldownUntil: number; // 冷却结束时间戳
  successRate: number;
  avgTime: number;
}

// 可用模型列表
const MODEL_STATES: ModelState[] = [
  { key: 'seedance-1', name: 'Seedance Pro #1', used: 5, dailyLimit: 10, lastUsed: 0, cooldownUntil: 0, successRate: 0.8, avgTime: 60000 },
  { key: 'seedance-2', name: 'Seedance Pro #2', used: 0, dailyLimit: 10, lastUsed: 0, cooldownUntil: 0, successRate: 0.8, avgTime: 60000 },
  { key: 'seedance-3', name: 'Seedance Pro #3', used: 0, dailyLimit: 10, lastUsed: 0, cooldownUntil: 0, successRate: 0.8, avgTime: 60000 },
];

// 模型冷却时间（毫秒）
const COOLDOWN_TIME = 120000; // 2分钟冷却

// 获取最佳可用模型
function getBestModel(): ModelState | null {
  const now = Date.now();
  
  // 按优先级排序：成功率高 > 冷却已结束 > 未达限额
  const available = MODEL_STATES
    .filter(m => m.used < m.dailyLimit && m.cooldownUntil < now)
    .sort((a, b) => {
      // 优先选择成功率高的
      if (a.successRate !== b.successRate) return b.successRate - a.successRate;
      // 其次选择最近未使用的
      return a.lastUsed - b.lastUsed;
    });
  
  return available[0] || null;
}

// 标记模型冷却
function setCooldown(modelKey: string) {
  const model = MODEL_STATES.find(m => m.key === modelKey);
  if (model) {
    model.cooldownUntil = Date.now() + COOLDOWN_TIME;
  }
}

// 使用Seedance生成
async function generateWithSeedance(prompt: string, duration: number): Promise<string | null> {
  try {
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
    return response.videoUrl || null;
  } catch (error) {
    return null;
  }
}

// 等待冷却
async function waitForCooldown(): Promise<void> {
  const now = Date.now();
  const earliestAvailable = Math.min(...MODEL_STATES.map(m => m.cooldownUntil));
  
  if (earliestAvailable > now) {
    const waitTime = earliestAvailable - now;
    console.log(`⏳ 所有模型冷却中，等待 ${(waitTime/1000).toFixed(0)} 秒...`);
    await new Promise(r => setTimeout(r, waitTime + 5000));
  }
}

// 第一集剩余场景
const REMAINING_SCENES = [
  { sceneId: 6, title: '神秘老者', imagePrompt: '国风动漫，白发老者踏空而来，白衣飘飘，神秘气息，空间扭曲粒子', duration: 5 },
  { sceneId: 7, title: '剑圣指点', imagePrompt: '国风动漫，剑圣说话，闪回上古战场，万剑齐飞，粒子特效满屏，史诗级场景', duration: 6 },
  { sceneId: 8, title: '踏上征途', imagePrompt: '国风动漫，少年背剑望远方，夕阳剪影，金色粒子飘散，踏上征途', duration: 5 },
];

// 第2-10集场景预定义（每集6-8个场景）
const EPISODES = {
  2: { title: '初入江湖', scenes: [
    { title: '离开山村', imagePrompt: '少年背着剑走出山村，身后竹林，前方未知世界，晨光粒子' },
    { title: '小镇集市', imagePrompt: '繁华古代集市，叫卖声此起彼伏，少年好奇张望，热闹氛围' },
    { title: '路见不平', imagePrompt: '恶霸欺凌弱小，少年挺身而出，剑气隐隐，英雄救美' },
    { title: '初试剑法', imagePrompt: '少年拔剑出鞘，剑光闪烁，一招击退恶霸，剑气纵横' },
    { title: '神秘女子', imagePrompt: '蒙面女子出现，白衣飘飘，眼神深邃，神秘气息粒子环绕' },
    { title: '江湖路远', imagePrompt: '少年和神秘女子并肩而行，身后夕阳，前方路途漫漫' },
  ]},
  3: { title: '妖魔现身', scenes: [
    { title: '夜宿古庙', imagePrompt: '古老破庙，月光透过破窗，少年独自休息，诡异氛围' },
    { title: '妖气弥漫', imagePrompt: '黑雾从地下涌出，妖魔气息蔓延，恐怖粒子特效' },
    { title: '妖兽现身', imagePrompt: '巨大妖兽从黑雾中冲出，獠牙锋利，红眼闪烁，震撼画面' },
    { title: '激战妖兽', imagePrompt: '少年挥剑斩向妖兽，剑光与妖气碰撞，粒子爆发' },
    { title: '剑魂之力', imagePrompt: '剑魂光芒大盛，金色剑气覆盖全身，力量觉醒特效' },
    { title: '斩妖除魔', imagePrompt: '少年一剑斩杀妖兽，妖气消散，金色光芒冲天' },
    { title: '神秘符文', imagePrompt: '妖兽消失处浮现神秘符文，金色光芒闪烁，谜团加深' },
  ]},
  4: { title: '剑道争锋', scenes: [
    { title: '剑修大会', imagePrompt: '巨大比武场，众多剑修聚集，旌旗飘扬，壮观场面' },
    { title: '强者如云', imagePrompt: '各路天才剑修登场，气息强大，气势逼人' },
    { title: '首轮对决', imagePrompt: '少年上台对战，剑气纵横，激烈交锋，燃爆场面' },
    { title: '剑意觉醒', imagePrompt: '战斗中剑意觉醒，周身剑气凝聚成龙，震撼特效' },
    { title: '一剑破敌', imagePrompt: '少年一剑击败对手，剑气冲天，全场震惊' },
    { title: '引人注目', imagePrompt: '众强者注视少年，眼神复杂，气氛紧张' },
  ]},
  5: { title: '秘境探索', scenes: [
    { title: '秘境开启', imagePrompt: '巨大光门出现在天空，秘境入口，金色粒子环绕' },
    { title: '众人进入', imagePrompt: '剑修们飞入光门，身影消失在光芒中' },
    { title: '秘境内部', imagePrompt: '奇异世界，悬浮岛屿，仙气缭绕，美轮美奂' },
    { title: '危险陷阱', imagePrompt: '机关启动，剑气陷阱触发，众人闪避，紧张场面' },
    { title: '发现宝藏', imagePrompt: '隐藏宝库被发现，宝光四射，粒子特效满屏' },
    { title: '守护兽', imagePrompt: '巨大守护兽苏醒，威压惊人，与少年对峙' },
  ]},
};

// 生成单个场景
async function generateScene(scene: any, episodeNum: number): Promise<string | null> {
  const enhancedPrompt = STYLE_PREFIX + scene.imagePrompt;
  
  // 尝试最多3轮
  for (let round = 1; round <= 3; round++) {
    let model = getBestModel();
    
    // 如果没有可用模型，等待冷却
    if (!model) {
      await waitForCooldown();
      model = getBestModel();
    }
    
    if (!model) {
      console.log(`  ⚠️ 无可用模型，跳过场景`);
      return null;
    }
    
    console.log(`  使用 ${model.name} (第${round}轮)...`);
    
    try {
      const startTime = Date.now();
      const videoUrl = await generateWithSeedance(enhancedPrompt, scene.duration || 5);
      const elapsed = Date.now() - startTime;
      
      model.used++;
      model.lastUsed = Date.now();
      model.successRate = model.successRate * 0.9 + 0.1; // 更新成功率
      
      if (videoUrl) {
        console.log(`  ✅ 成功！耗时 ${(elapsed/1000).toFixed(1)}秒`);
        return videoUrl;
      }
    } catch (error: any) {
      model.used++;
      model.successRate = model.successRate * 0.9;
      
      // 如果是限流，设置冷却
      if (error.message?.includes('403')) {
        setCooldown(model.key);
        console.log(`  ⚠️ ${model.name} 限流，已设置冷却`);
      }
    }
    
    // 等待后重试
    if (round < 3) {
      console.log(`  等待30秒后重试...`);
      await new Promise(r => setTimeout(r, 30000));
    }
  }
  
  return null;
}

// 保存场景
async function saveScene(episodeNum: number, sceneIndex: number, videoUrl: string, duration: number) {
  const sceneId = episodeNum * 100 + sceneIndex;
  await client.from('anime_scene_videos').insert([{
    id: crypto.randomUUID(),
    project_id: PROJECT_ID,
    scene_id: sceneId,
    video_url: videoUrl,
    duration,
    created_at: new Date().toISOString(),
  }]);
}

// 主流程
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🗡️  智能多模型急速生成系统');
  console.log('   《剑破苍穹》80集国风燃爆动漫');
  console.log('═'.repeat(60));
  
  // 完成第一集剩余场景
  console.log('\n📺 第一集「剑魂觉醒」- 剩余场景');
  console.log('─'.repeat(40));
  
  for (const scene of REMAINING_SCENES) {
    console.log(`\n[场景${scene.sceneId}] ${scene.title}`);
    const videoUrl = await generateScene(scene, 1);
    
    if (videoUrl) {
      await saveScene(1, scene.sceneId, videoUrl, scene.duration);
      console.log(`  📹 已保存`);
    } else {
      console.log(`  ❌ 生成失败`);
    }
    
    // 场景间延迟
    console.log(`  等待15秒后继续...\n`);
    await new Promise(r => setTimeout(r, 15000));
  }
  
  // 生成后续集数
  for (const [epNum, epData] of Object.entries(EPISODES)) {
    const episodeNum = parseInt(epNum);
    console.log(`\n\n📺 第${episodeNum}集「${epData.title}」`);
    console.log('─'.repeat(40));
    
    for (let i = 0; i < epData.scenes.length; i++) {
      const scene = epData.scenes[i];
      console.log(`\n[场景${i+1}] ${scene.title}`);
      
      const videoUrl = await generateScene({ ...scene, duration: 5 }, episodeNum);
      
      if (videoUrl) {
        await saveScene(episodeNum, i + 1, videoUrl, 5);
        console.log(`  📹 已保存`);
      } else {
        console.log(`  ❌ 生成失败`);
      }
      
      console.log(`  等待15秒后继续...\n`);
      await new Promise(r => setTimeout(r, 15000));
    }
  }
  
  // 最终统计
  const { data } = await client
    .from('anime_scene_videos')
    .select('scene_id')
    .eq('project_id', PROJECT_ID);
  
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ 批量生成完成！共 ${data?.length || 0} 个场景`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
