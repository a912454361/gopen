# G open SDK 开发者文档

## 快速开始

### 安装

```bash
npm install @gopen/sdk
# 或
yarn add @gopen/sdk
# 或
pnpm add @gopen/sdk
```

### 初始化

```typescript
import { GopenSDK } from '@gopen/sdk';

const sdk = new GopenSDK({
  baseUrl: 'https://your-api-server.com',  // 你部署的服务器地址
  licenseKey: 'YOUR_LICENSE_KEY',          // 从官网获取的授权码
  deviceId: 'unique-device-id',            // 可选，设备唯一标识
  debug: true,                             // 可选，调试模式
});
```

---

## 用户认证

### 登录

```typescript
// 密码登录
const loginResult = await sdk.auth.login({
  account: 'user@example.com',
  password: 'your-password',
  type: 'password',
});

// 验证码登录
const loginResult2 = await sdk.auth.login({
  account: '13800138000',
  code: '123456',
  type: 'code',
});

console.log('Token:', loginResult.accessToken);
console.log('User:', loginResult.user);
```

### 获取用户信息

```typescript
const userInfo = await sdk.auth.getUserInfo();
console.log('用户名:', userInfo.username);
console.log('G点余额:', userInfo.gpoints);
console.log('会员等级:', userInfo.memberLevel);
```

### 登出

```typescript
await sdk.auth.logout();
```

---

## AI 创作服务

### 文本生成

```typescript
const result = await sdk.ai.generateText({
  prompt: '写一段关于剑客的描述',
  model: 'doubao',          // 可选: doubao, deepseek, kimi, qwen, glm
  maxLength: 500,          // 最大生成长度
  temperature: 0.7,        // 温度参数 0-1
});

console.log('生成的文本:', result.text);
console.log('消耗G点:', result.costGpoints);
```

### 图像生成

```typescript
const result = await sdk.ai.generateImage({
  prompt: '一位身穿白衣的剑客，站在悬崖边，背景是落日',
  negativePrompt: '低质量, 模糊',  // 负面提示词
  width: 1024,
  height: 1024,
  count: 4,                  // 生成数量
  style: 'anime',            // 风格: anime, realistic, fantasy, scifi
});

console.log('生成的图像:', result.images);
```

### 视频生成

```typescript
const result = await sdk.ai.generateVideo({
  prompt: '剑客挥剑斩出一道剑气',
  referenceImage: 'https://example.com/image.jpg',  // 参考图像
  duration: 5,              // 视频时长（秒）
  width: 1920,
  height: 1080,
  model: 'seedance',        // 模型: seedance, kling, pika, runway, qwen
});

// 视频生成是异步的，需要轮询状态
const taskId = result.taskId;
```

---

## 粒子特效服务

### 查看可用特效

```typescript
const effects = sdk.particles.listEffects();
// ['sword_qi', 'ice_heart', 'shadow', 'flame', 'thunder', 'wind', 'starfall', 'sword_rain']
```

### 创建粒子特效

```typescript
const result = await sdk.particles.createEffect({
  type: 'sword_qi',         // 特效类型
  resolution: '8K',         // 分辨率: 1080p, 4K, 8K
  fps: 60,                  // 帧率
  duration: 3,              // 时长（秒）
  backgroundColor: '#000000',
});

console.log('任务ID:', result.taskId);
console.log('消耗G点:', result.costGpoints);
```

### 查询特效状态

```typescript
const status = await sdk.particles.getEffectStatus(taskId);

if (status.status === 'completed') {
  console.log('视频URL:', status.videoUrl);
  console.log('预览图:', status.previewUrl);
}
```

### 特效类型说明

| 类型 | 名称 | 描述 |
|------|------|------|
| `sword_qi` | 苍穹剑气 | 剑气横扫特效 |
| `ice_heart` | 冰心诀 | 冰霜粒子效果 |
| `shadow` | 暗影吞噬 | 暗黑系粒子 |
| `flame` | 烈焰焚天 | 火焰粒子特效 |
| `thunder` | 雷霆万钧 | 雷电效果 |
| `wind` | 风云变幻 | 风系粒子效果 |
| `starfall` | 星辰陨落 | 星光粒子 |
| `sword_rain` | 万剑归宗 | 剑雨特效 |

---

## 动漫制作服务

### 创建动漫项目

```typescript
const project = await sdk.anime.createProject({
  name: '剑破苍穹',
  description: '一部国风修仙动漫',
  style: 'chinese',         // 风格: chinese, japanese, western
  totalEpisodes: 80,
  storyOutline: '主角从一个普通少年成长为一代剑仙的故事...',
});

console.log('项目ID:', project.projectId);
console.log('状态:', project.status);
```

### 获取项目信息

```typescript
const projectInfo = await sdk.anime.getProject(projectId);
console.log('剧集列表:', projectInfo.episodes);
```

### 生成剧集

```typescript
const episode = await sdk.anime.generateEpisode(projectId, episodeId);
console.log('剧集状态:', episode.status);
```

### 生成场景

```typescript
const scene = await sdk.anime.generateScene(projectId, episodeId, sceneId);
console.log('场景:', scene);
```

---

## 支付服务

### 充值

```typescript
const result = await sdk.payment.recharge({
  amount: 100,              // 充值金额（元）
  method: 'wechat',         // 支付方式: wechat, alipay
  returnUrl: 'https://your-app.com/pay/success',
});

// 获取支付参数
console.log('支付参数:', result.paymentParams);

// 如果是扫码支付
console.log('二维码URL:', result.qrCodeUrl);
```

### 查询充值历史

```typescript
const history = await sdk.payment.getRechargeHistory();
history.forEach(order => {
  console.log('订单:', order.orderId, order.amount, order.status);
});
```

---

## 任务管理

### 查询任务状态

```typescript
const status = await sdk.tasks.getStatus(taskId);
console.log('状态:', status.status);
console.log('进度:', status.progress, '%');

if (status.status === 'completed') {
  console.log('结果:', status.result);
}

if (status.status === 'failed') {
  console.log('错误:', status.error);
}
```

### 取消任务

```typescript
await sdk.tasks.cancel(taskId);
```

### 获取任务列表

```typescript
const tasks = await sdk.tasks.list();
tasks.forEach(task => {
  console.log(`${task.taskId}: ${task.type} - ${task.status}`);
});
```

---

## 错误处理

```typescript
import { GopenError } from '@gopen/sdk';

try {
  await sdk.ai.generateText({ prompt: '' });
} catch (error) {
  const gopenError = error as GopenError;
  console.log('错误码:', gopenError.code);
  console.log('错误信息:', gopenError.message);
  console.log('详细信息:', gopenError.details);
}
```

### 常见错误码

| 错误码 | 说明 |
|--------|------|
| `AUTH_FAILED` | 认证失败 |
| `TOKEN_EXPIRED` | Token 已过期 |
| `INSUFFICIENT_BALANCE` | G点余额不足 |
| `RATE_LIMIT_EXCEEDED` | 请求频率超限 |
| `LICENSE_INVALID` | 授权码无效 |
| `DEVICE_LIMIT_EXCEEDED` | 设备数量超限 |

---

## 完整示例

### 创建动漫项目并生成内容

```typescript
import { GopenSDK } from '@gopen/sdk';

async function main() {
  // 初始化
  const sdk = new GopenSDK({
    baseUrl: process.env.GOPEN_API_URL!,
    licenseKey: process.env.GOPEN_LICENSE_KEY!,
  });

  // 登录
  const loginResult = await sdk.auth.login({
    account: 'user@example.com',
    password: 'password',
    type: 'password',
  });
  console.log('登录成功:', loginResult.user.username);

  // 创建动漫项目
  const project = await sdk.anime.createProject({
    name: '测试项目',
    description: 'SDK 测试动漫项目',
    style: 'chinese',
    totalEpisodes: 1,
    storyOutline: '一个简单的测试故事',
  });
  console.log('项目创建成功:', project.projectId);

  // 生成图像
  const image = await sdk.ai.generateImage({
    prompt: '一位国风剑客',
    style: 'anime',
    width: 1024,
    height: 1024,
  });
  console.log('生成图像:', image.images[0]);

  // 创建粒子特效
  const effect = await sdk.particles.createEffect({
    type: 'sword_qi',
    resolution: '4K',
    duration: 3,
  });
  console.log('特效任务:', effect.taskId);

  // 等待任务完成
  let status = await sdk.tasks.getStatus(effect.taskId);
  while (status.status === 'processing') {
    await new Promise(r => setTimeout(r, 2000));
    status = await sdk.tasks.getStatus(effect.taskId);
    console.log('进度:', status.progress, '%');
  }

  if (status.status === 'completed') {
    console.log('特效视频:', status.result.videoUrl);
  }
}

main().catch(console.error);
```

---

## 支持与反馈

- 官网：https://woshiguotao.cn
- GitHub：https://github.com/a912454361/gopen
- 邮箱：support@woshiguotao.cn

---

**SDK 版本**: v1.0.3  
**最后更新**: 2024年
