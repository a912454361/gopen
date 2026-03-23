/**
 * 继续生成失败的场景
 * 场景6、7、8
 */

import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '../src/storage/database/supabase-client.js';

const client = getSupabaseClient();
const config = new Config();
const videoClient = new VideoGenerationClient(config, {});

const PROJECT_ID = '4757e981-0239-4ef7-a178-9245e1612b43';

// 国风燃爆风格前缀
const STYLE_PREFIX = '国风燃爆动漫，高质量4K，粒子特效，流畅动画，电影级光影，';

// 剩余场景
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

async function generateWithRetry(scene: typeof REMAINING_SCENES[0], maxRetries = 3): Promise<string | null> {
  const enhancedPrompt = STYLE_PREFIX + scene.imagePrompt;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[场景${scene.sceneId}] ${scene.title}: 尝试 ${attempt}/${maxRetries}...`);
      
      // 增加延迟避免限流
      if (attempt > 1) {
        const delay = attempt * 30000; // 30秒, 60秒, 90秒
        console.log(`  等待 ${delay/1000} 秒后重试...`);
        await new Promise(r => setTimeout(r, delay));
      }
      
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
      
      if (response.videoUrl) {
        console.log(`[场景${scene.sceneId}] ${scene.title}: ✅ 成功！`);
        return response.videoUrl;
      }
    } catch (error: any) {
      console.error(`[场景${scene.sceneId}] 尝试 ${attempt} 失败:`, error.message?.substring(0, 100));
    }
  }
  
  return null;
}

async function main() {
  console.log('\n🗡️ 继续生成剩余场景（6-8）...\n');
  
  for (const scene of REMAINING_SCENES) {
    const videoUrl = await generateWithRetry(scene);
    
    if (videoUrl) {
      // 保存到数据库
      await client.from('anime_scene_videos').insert([{
        id: crypto.randomUUID(),
        project_id: PROJECT_ID,
        scene_id: scene.sceneId,
        video_url: videoUrl,
        duration: scene.duration,
        created_at: new Date().toISOString(),
      }]);
      
      console.log(`  📹 视频链接: ${videoUrl.substring(0, 60)}...`);
    } else {
      console.log(`[场景${scene.sceneId}] ${scene.title}: ❌ 最终失败`);
    }
    
    // 场景间延迟
    console.log('  等待30秒后继续下一个场景...\n');
    await new Promise(r => setTimeout(r, 30000));
  }
  
  // 查询最终结果
  const { data } = await client
    .from('anime_scene_videos')
    .select('scene_id')
    .eq('project_id', PROJECT_ID);
  
  console.log(`\n✅ 第一集完成！共 ${data?.length || 0}/8 个场景`);
}

main().catch(console.error);
