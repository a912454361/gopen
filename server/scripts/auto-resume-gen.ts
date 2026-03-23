/**
 * 自动恢复生成脚本
 * 检测API状态，自动恢复生成
 * 支持断点续传
 */

import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../src/storage/database/supabase-client.js';

const client = getSupabaseClient();
const config = new Config();

const PROJECT_ID = '4757e981-0239-4ef7-a178-9245e1612b43';
const STYLE_PREFIX = '国风燃爆动漫，高质量4K，粒子特效，流畅动画，电影级光影，';

// 检测API是否可用
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

// 获取待生成的场景
async function getPendingScenes(): Promise<any[]> {
  // 查询已生成的场景
  const { data: existing } = await client
    .from('anime_scene_videos')
    .select('scene_id')
    .eq('project_id', PROJECT_ID);
  
  const existingIds = new Set((existing || []).map(v => v.scene_id));
  
  // 定义所有需要生成的场景
  const allScenes = [
    // 第一集剩余
    { episode: 1, sceneId: 6, title: '神秘老者', prompt: '白发老者踏空而来，白衣飘飘，神秘气息，空间扭曲粒子', duration: 5 },
    { episode: 1, sceneId: 7, title: '剑圣指点', prompt: '剑圣说话，闪回上古战场，万剑齐飞，史诗级场景', duration: 6 },
    { episode: 1, sceneId: 8, title: '踏上征途', prompt: '少年背剑望远方，夕阳剪影，金色粒子飘散', duration: 5 },
    // 第二集
    { episode: 2, sceneId: 1, title: '离开山村', prompt: '少年背着剑走出山村，身后竹林，晨光粒子', duration: 5 },
    { episode: 2, sceneId: 2, title: '小镇集市', prompt: '繁华古代集市，叫卖声此起彼伏，热闹氛围', duration: 5 },
    { episode: 2, sceneId: 3, title: '路见不平', prompt: '恶霸欺凌弱小，少年挺身而出，英雄救美', duration: 6 },
    { episode: 2, sceneId: 4, title: '初试剑法', prompt: '少年拔剑出鞘，剑光闪烁，一招击退恶霸', duration: 5 },
    { episode: 2, sceneId: 5, title: '神秘女子', prompt: '蒙面女子出现，白衣飘飘，眼神深邃，神秘粒子', duration: 5 },
    { episode: 2, sceneId: 6, title: '江湖路远', prompt: '少年和神秘女子并肩而行，夕阳西下，金色粒子', duration: 5 },
  ];
  
  // 过滤已存在的场景
  const fullSceneId = (ep: number, sc: number) => ep * 100 + sc;
  return allScenes.filter(s => !existingIds.has(fullSceneId(s.episode, s.sceneId)));
}

// 生成单个场景
async function generateScene(scene: any): Promise<string | null> {
  const videoClient = new VideoGenerationClient(config, {});
  const enhancedPrompt = STYLE_PREFIX + scene.prompt;
  
  try {
    const response = await videoClient.videoGeneration(
      [{ type: 'text', text: enhancedPrompt }],
      {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: scene.duration,
        ratio: '16:9',
        resolution: '1080p',
        generateAudio: true,
        watermark: false,
      }
    );
    return response.videoUrl || null;
  } catch {
    return null;
  }
}

// 保存场景
async function saveScene(scene: any, videoUrl: string) {
  const sceneId = scene.episode * 100 + scene.sceneId;
  await client.from('anime_scene_videos').insert([{
    id: crypto.randomUUID(),
    project_id: PROJECT_ID,
    scene_id: sceneId,
    video_url: videoUrl,
    duration: scene.duration,
    created_at: new Date().toISOString(),
  }]);
}

// 主循环
async function main() {
  console.log('\n🔄 自动恢复生成系统启动');
  console.log('━'.repeat(40));
  
  // 检测API状态
  console.log('检测API状态...');
  const isAPIReady = await checkAPIStatus();
  
  if (!isAPIReady) {
    console.log('⏳ API限流中，等待恢复...');
    console.log('   建议: 等待5-10分钟后重新运行此脚本');
    return;
  }
  
  console.log('✅ API已就绪！');
  
  // 获取待生成场景
  const pendingScenes = await getPendingScenes();
  
  if (pendingScenes.length === 0) {
    console.log('✅ 所有场景已完成！');
    return;
  }
  
  console.log(`📋 待生成场景: ${pendingScenes.length} 个\n`);
  
  // 逐个生成
  for (let i = 0; i < pendingScenes.length; i++) {
    const scene = pendingScenes[i];
    const progress = Math.floor(((i + 1) / pendingScenes.length) * 100);
    
    console.log(`\n[${i + 1}/${pendingScenes.length}] 第${scene.episode}集 场景${scene.sceneId} - ${scene.title}`);
    console.log(`进度: ${progress}%`);
    
    const startTime = Date.now();
    const videoUrl = await generateScene(scene);
    const elapsed = Date.now() - startTime;
    
    if (videoUrl) {
      await saveScene(scene, videoUrl);
      console.log(`✅ 成功！耗时 ${(elapsed/1000).toFixed(1)}秒`);
      console.log(`📹 ${videoUrl.substring(0, 50)}...`);
    } else {
      console.log(`❌ 失败，API可能再次限流`);
      console.log(`⏸️ 暂停生成，请等待后重新运行`);
      break;
    }
    
    // 场景间延迟
    if (i < pendingScenes.length - 1) {
      console.log(`   等待10秒...`);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  
  // 最终统计
  const { data: final } = await client
    .from('anime_scene_videos')
    .select('scene_id')
    .eq('project_id', PROJECT_ID);
  
  console.log('\n' + '━'.repeat(40));
  console.log(`📊 总进度: ${final?.length || 0} 个场景已生成`);
  console.log('━'.repeat(40));
}

main().catch(console.error);
