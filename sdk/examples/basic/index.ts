/**
 * G open SDK 基础示例
 * 演示 SDK 的基本使用方法
 */

import { GopenSDK } from '../src';

async function main() {
  console.log('=== G open SDK 基础示例 ===\n');

  // 1. 初始化 SDK
  console.log('1. 初始化 SDK...');
  const sdk = new GopenSDK({
    baseUrl: process.env.GOPEN_API_URL || 'http://localhost:9091',
    licenseKey: process.env.GOPEN_LICENSE_KEY || 'your-license-key',
    debug: true,
  });
  console.log('SDK 初始化成功\n');

  // 2. 用户登录
  console.log('2. 用户登录...');
  try {
    const loginResult = await sdk.auth.login({
      account: 'test@example.com',
      password: 'password123',
      type: 'password',
    });
    console.log('登录成功!');
    console.log('用户名:', loginResult.user.username);
    console.log('G点余额:', loginResult.user.gpoints);
    console.log('会员等级:', loginResult.user.memberLevel);
  } catch (error) {
    console.log('登录失败（示例中使用测试账户）');
  }
  console.log('');

  // 3. 获取可用粒子特效
  console.log('3. 可用粒子特效列表:');
  const effects = sdk.particles.listEffects();
  effects.forEach((effect, index) => {
    console.log(`   ${index + 1}. ${effect}`);
  });
  console.log('');

  // 4. 生成文本示例
  console.log('4. 文本生成示例...');
  try {
    const textResult = await sdk.ai.generateText({
      prompt: '请用一句话描述剑客的气质',
      model: 'doubao',
      maxLength: 100,
      temperature: 0.7,
    });
    console.log('生成的文本:', textResult.text);
    console.log('消耗G点:', textResult.costGpoints);
  } catch (error) {
    console.log('文本生成需要有效的授权和服务');
  }
  console.log('');

  // 5. 生成图像示例
  console.log('5. 图像生成示例...');
  try {
    const imageResult = await sdk.ai.generateImage({
      prompt: '一位身穿白衣的国风剑客，站在悬崖边，背景是落日',
      style: 'anime',
      width: 1024,
      height: 1024,
      count: 1,
    });
    console.log('生成的图像:', imageResult.images);
    console.log('消耗G点:', imageResult.costGpoints);
  } catch (error) {
    console.log('图像生成需要有效的授权和服务');
  }
  console.log('');

  // 6. 创建粒子特效示例
  console.log('6. 粒子特效示例...');
  try {
    const effectResult = await sdk.particles.createEffect({
      type: 'sword_qi',
      resolution: '4K',
      fps: 60,
      duration: 3,
    });
    console.log('特效任务创建成功!');
    console.log('任务ID:', effectResult.taskId);
    console.log('消耗G点:', effectResult.costGpoints);

    // 轮询任务状态
    let status = await sdk.tasks.getStatus(effectResult.taskId);
    console.log('初始状态:', status.status);

    // 等待任务完成（实际应用中应使用异步处理）
    let attempts = 0;
    while (status.status === 'processing' && attempts < 10) {
      await new Promise(r => setTimeout(r, 2000));
      status = await sdk.tasks.getStatus(effectResult.taskId);
      console.log(`进度: ${status.progress}%`);
      attempts++;
    }

    if (status.status === 'completed') {
      console.log('特效视频URL:', status.result?.videoUrl);
    }
  } catch (error) {
    console.log('粒子特效生成需要有效的授权和服务');
  }
  console.log('');

  console.log('=== 示例完成 ===');
}

// 运行示例
main().catch(error => {
  console.error('示例运行错误:', error);
  process.exit(1);
});
