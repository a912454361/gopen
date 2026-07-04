/**
 * G open SDK 高级示例
 * 演示动漫项目创建和批量生成
 */

import { GopenSDK } from '../src';

async function main() {
  console.log('=== G open SDK 高级示例 - 动漫项目制作 ===\n');

  const sdk = new GopenSDK({
    baseUrl: process.env.GOPEN_API_URL || 'http://localhost:9091',
    licenseKey: process.env.GOPEN_LICENSE_KEY || 'your-license-key',
    debug: true,
  });

  // 登录
  console.log('登录中...');
  await sdk.auth.login({
    account: 'producer@example.com',
    password: 'password123',
    type: 'password',
  });
  console.log('登录成功\n');

  // 创建动漫项目
  console.log('创建动漫项目...');
  const project = await sdk.anime.createProject({
    name: '剑破苍穹 - 第一季',
    description: '一个少年剑客的修仙之路',
    style: 'chinese',
    totalEpisodes: 10,
    storyOutline: `
      主角林风是一个普通山村少年，意外获得一把神秘古剑。
      从此踏上修仙之路，历经磨难，最终成为一代剑仙。
      
      主要角色：
      - 林风：主角，热血少年剑客
      - 苏婉：女主，冷艳仙子
      - 玄天长老：林风的师父
      - 暗影魔尊：主要反派
    `,
  });

  console.log('项目创建成功!');
  console.log('项目ID:', project.projectId);
  console.log('状态:', project.status);
  console.log('');

  // 显示剧集列表
  console.log('剧集列表:');
  project.episodes.forEach(episode => {
    console.log(`  第${episode.number}集: ${episode.title}`);
    console.log(`    - 场景数: ${episode.scenes.length}`);
    console.log(`    - 状态: ${episode.status}`);
  });
  console.log('');

  // 生成第一集
  console.log('开始生成第一集...');
  const episode1 = project.episodes[0];
  const generateResult = await sdk.anime.generateEpisode(
    project.projectId,
    episode1.id
  );
  console.log('第一集生成任务已启动');
  console.log('');

  // 监控生成进度
  console.log('监控生成进度...');
  let status = await sdk.tasks.getStatus(generateResult.id);
  
  while (status.status === 'processing') {
    console.log(`[${new Date().toLocaleTimeString()}] 进度: ${status.progress}%`);
    await new Promise(r => setTimeout(r, 5000));
    status = await sdk.tasks.getStatus(generateResult.id);
  }

  if (status.status === 'completed') {
    console.log('第一集生成完成!');
    console.log('结果:', status.result);
  } else {
    console.log('生成失败:', status.error);
  }
  console.log('');

  // 批量生成图像素材
  console.log('批量生成角色图像...');
  const characters = [
    { name: '林风', desc: '少年剑客，身穿青色道袍，手持古剑' },
    { name: '苏婉', desc: '冷艳仙子，白衣飘飘，气质出尘' },
    { name: '玄天长老', desc: '白发苍苍的老者，仙风道骨' },
    { name: '暗影魔尊', desc: '黑袍罩身，散发魔气' },
  ];

  const imageTasks = [];
  for (const char of characters) {
    console.log(`生成 ${char.name} 图像...`);
    const task = sdk.ai.generateImage({
      prompt: `${char.desc}，国风动漫风格`,
      style: 'anime',
      width: 1024,
      height: 1024,
    });
    imageTasks.push(task);
  }

  const imageResults = await Promise.all(imageTasks);
  console.log('角色图像生成完成:');
  characters.forEach((char, index) => {
    console.log(`  ${char.name}: ${imageResults[index].images[0]}`);
  });
  console.log('');

  // 生成粒子特效
  console.log('生成片头粒子特效...');
  const particleEffect = await sdk.particles.createEffect({
    type: 'sword_rain',
    resolution: '8K',
    fps: 60,
    duration: 5,
    backgroundColor: '#0a0a0f',
  });

  console.log('粒子特效任务已创建:', particleEffect.taskId);

  // 等待特效完成
  let effectStatus = await sdk.tasks.getStatus(particleEffect.taskId);
  while (effectStatus.status === 'processing') {
    await new Promise(r => setTimeout(r, 3000));
    effectStatus = await sdk.tasks.getStatus(particleEffect.taskId);
  }

  if (effectStatus.status === 'completed') {
    console.log('粒子特效视频:', effectStatus.result?.videoUrl);
  }
  console.log('');

  // 查询任务列表
  console.log('最近任务列表:');
  const tasks = await sdk.tasks.list();
  tasks.slice(0, 5).forEach(task => {
    console.log(`  ${task.taskId} - ${task.type} - ${task.status}`);
  });
  console.log('');

  console.log('=== 高级示例完成 ===');
}

main().catch(error => {
  console.error('错误:', error);
  process.exit(1);
});
