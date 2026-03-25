# @gopen/sdk

<p align="center">
  <img src="https://img.shields.io/npm/v/@gopen/sdk?color=blue" alt="npm version" />
  <img src="https://img.shields.io/npm/l/@gopen/sdk" alt="license" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-green" alt="node version" />
</p>

<p align="center">
  <strong>G open 智能创作助手 SDK</strong><br>
  AI驱动的游戏与动漫内容创作平台
</p>

---

## 特性

- 🎨 **AI 创作服务** - 文本、图像、视频生成
- ⚡ **8K 粒子特效** - 8种Niagara粒子特效
- 🎬 **动漫制作** - 24小时极速制作系统
- 💳 **支付直连** - 资金100%到你的账户
- 🔒 **完全掌控** - 你部署、你管理、你拥有

## 安装

```bash
npm install @gopen/sdk
```

## 快速开始

```typescript
import { GopenSDK } from '@gopen/sdk';

// 初始化
const sdk = new GopenSDK({
  baseUrl: 'https://your-api-server.com',
  licenseKey: 'YOUR_LICENSE_KEY',
});

// 登录
const login = await sdk.auth.login({
  account: 'user@example.com',
  password: 'your-password',
  type: 'password',
});

// 生成图像
const image = await sdk.ai.generateImage({
  prompt: '一位国风剑客，白衣飘飘',
  style: 'anime',
  width: 1024,
  height: 1024,
});

console.log('生成图像:', image.images);

// 创建8K粒子特效
const effect = await sdk.particles.createEffect({
  type: 'sword_qi',
  resolution: '8K',
  duration: 3,
});

console.log('特效任务ID:', effect.taskId);
```

## 可用功能

### AI 创作

```typescript
// 文本生成
const text = await sdk.ai.generateText({
  prompt: '写一段剑客的描述',
  model: 'doubao',
});

// 图像生成
const image = await sdk.ai.generateImage({
  prompt: '国风剑客',
  style: 'anime',
});

// 视频生成
const video = await sdk.ai.generateVideo({
  prompt: '剑客挥剑',
  duration: 5,
});
```

### 8K 粒子特效

```typescript
// 可用特效类型
const effects = sdk.particles.listEffects();
// sword_qi, ice_heart, shadow, flame, thunder, wind, starfall, sword_rain

// 创建特效
const result = await sdk.particles.createEffect({
  type: 'sword_qi',     // 苍穹剑气
  resolution: '8K',
  fps: 60,
  duration: 3,
});
```

### 动漫制作

```typescript
// 创建项目
const project = await sdk.anime.createProject({
  name: '剑破苍穹',
  style: 'chinese',
  totalEpisodes: 80,
  storyOutline: '修仙故事...',
});

// 生成剧集
const episode = await sdk.anime.generateEpisode(projectId, episodeId);
```

## 文档

完整文档请参阅：[API 文档](./docs/API.md)

## 授权

- **个人版**：¥999/年 - 个人学习、小项目
- **商业版**：¥4,999/年 - 商业项目、中小企业
- **企业版**：¥19,999/年 - 大型企业、深度定制
- **永久授权**：¥99,999 - 终身使用权

联系获取授权：support@woshiguotao.cn

## 支持

- 官网：https://woshiguotao.cn
- GitHub：https://github.com/a912454361/gopen
- 邮箱：support@woshiguotao.cn

## License

使用本 SDK 需要购买授权。详见 [LICENSE](./LICENSE) 文件。

---

<p align="center">
  Made with ❤️ by G open Team
</p>
