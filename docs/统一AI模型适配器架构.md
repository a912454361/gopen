# 统一 AI 模型适配器架构

## 概述

本架构设计并实现了统一的模型适配层，用于对接所有主流模型公司的所有模型产品，打造统一 AI 创作中心。

## 核心组件

### 1. 模型提供商配置 (`server/src/config/model-providers.ts`)

定义了 **18 家主流模型公司**的完整配置：

#### 国际厂商
- **OpenAI** - GPT-4o, GPT-4 Turbo, DALL-E 3, Whisper, TTS
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Google AI** - Gemini 1.5 Pro, Gemini 1.5 Flash, Imagen
- **DeepSeek** - DeepSeek Chat, DeepSeek Coder
- **Mistral AI** - Mistral Large, Mistral Medium, Codestral
- **Groq** - Llama 3.1, Mixtral (超快速推理)
- **Cohere** - Command R+, Embed
- **Stability AI** - Stable Diffusion 3, Stable Video Diffusion

#### 国内厂商
- **豆包 (ByteDance)** - Doubao Pro, Doubao Lite
- **通义千问 (Alibaba)** - Qwen-Max, Qwen-VL, Wanx (图像生成)
- **文心一言 (Baidu)** - ERNIE 4.0, ERNIE 3.5
- **智谱 AI** - GLM-4, CogView (图像生成)
- **Moonshot (Kimi)** - Moonshot V1
- **MiniMax** - Hailuo, Video-01
- **讯飞星火** - Spark V3.5
- **腾讯混元** - Hunyuan Pro
- **华为盘古** - Pangu Pro
- **零一万物** - Yi Large
- **百川智能** - Baichuan 4
- **商汤日日新** - SenseChat

### 2. 模型适配器架构 (`server/src/services/model-service.ts`)

#### 核心类

**ModelAdapter (抽象基类)**
- 定义统一的接口规范
- 支持对话、图像生成、语音转文字、文字转语音

**OpenAICompatibleAdapter**
- 适用于所有兼容 OpenAI API 的服务商
- 支持流式和非流式响应
- 自动处理 SSE 数据解析

**AnthropicAdapter**
- 专门适配 Anthropic API
- 处理独特的消息格式和认证方式

**GoogleAIAdapter**
- 适配 Google Generative AI API
- 支持 Gemini 系列模型

**ZhipuAdapter / QwenAdapter / WenxinAdapter**
- 国内厂商专用适配器
- 处理各自的 API 差异

#### ModelService 工厂类

```typescript
// 获取模型适配器
const adapter = ModelService.getAdapter('openai');

// 调用对话（流式）
await ModelService.chatStream(request, onChunk, onComplete, onError);

// 调用对话（非流式）
const response = await ModelService.chat(request);
```

### 3. AI 网关路由 (`server/src/routes/ai-gateway.ts`)

#### API 端点

**模型列表**
- `GET /api/v1/ai/models` - 获取所有可用模型
- `GET /api/v1/ai/models?type=image` - 按类型筛选
- `GET /api/v1/ai/models?provider=openai` - 按提供商筛选
- `GET /api/v1/ai/providers` - 获取所有提供商

**对话接口**
- `POST /api/v1/ai/chat` - 普通对话（非流式）
- `POST /api/v1/ai/chat/stream` - 流式对话（SSE）

**图像生成**
- `POST /api/v1/ai/image` - 图像生成

**音频处理**
- `POST /api/v1/ai/audio/transcribe` - 语音转文字
- `POST /api/v1/ai/audio/synthesize` - 文字转语音

## 特色功能

### 1. 统一的计费系统

- 支持 **会员权限控制**（免费/普通/超级会员）
- **按 Token 计费**（输入/输出分开定价）
- **消费记录追踪**
- **余额检查**（防止欠费）

### 2. 智能路由

- 自动识别模型提供商
- 选择对应的适配器
- 统一的错误处理

### 3. 流式输出

- SSE (Server-Sent Events) 协议
- 实时增量展示
- 自动清理资源

### 4. 多模态支持

- **文本对话** - 支持上下文、系统提示
- **图像生成** - 支持多种尺寸、质量
- **语音识别** - 支持多语言
- **语音合成** - 支持多种音色

## 使用示例

### 前端调用示例

```typescript
// 获取模型列表
const models = await fetch('/api/v1/ai/models?type=text');

// 流式对话
const response = await fetch('/api/v1/ai/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_123',
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: '你好，请介绍一下自己' }
    ],
    stream: true,
  }),
});

// 处理 SSE 流
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // 解析 data: {...} 格式的消息
}
```

### 后端适配器扩展示例

```typescript
// 新增一家模型公司的适配器
export class NewProviderAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('new-provider'); // 对应 MODEL_PROVIDERS 中的 id
  }
  
  // 如有特殊需求，可覆盖基类方法
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey, // 特殊认证头
    };
  }
}

// 在 ModelService 中注册
static getAdapter(providerId: string): ModelAdapter {
  switch (providerId) {
    case 'new-provider':
      return new NewProviderAdapter();
    // ...
  }
}
```

## 配置说明

### 环境变量

需要在 `.env` 文件中配置各厂商的 API Key：

```bash
# 国际厂商
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GOOGLE_AI_API_KEY=xxx
DEEPSEEK_API_KEY=sk-xxx
MISTRAL_API_KEY=xxx
GROQ_API_KEY=gsk_xxx
COHERE_API_KEY=xxx
STABILITY_API_KEY=xxx

# 国内厂商
DOUBAO_API_KEY=xxx
QWEN_API_KEY=sk-xxx
WENXIN_API_KEY=xxx,xxx  # API Key:Secret Key
ZHIPU_API_KEY=xxx
MOONSHOT_API_KEY=sk-xxx
MINIMAX_API_KEY=xxx
SPARK_API_KEY=xxx
HUNYUAN_API_KEY=xxx
PANGU_API_KEY=xxx
YI_API_KEY=xxx
BAICHUAN_API_KEY=xxx
SENSECHAT_API_KEY=xxx
```

## 优势

1. **统一接口** - 前端无需关心底层模型差异
2. **易于扩展** - 新增模型只需添加配置和适配器
3. **成本透明** - 实时计费，费用可控
4. **高可用** - 单个厂商故障不影响其他厂商
5. **合规性** - 数据出境可控，支持国内厂商

## 后续优化方向

1. **负载均衡** - 多个同类模型自动选择最优
2. **降级策略** - 主模型失败自动切换备用模型
3. **缓存机制** - 相同请求缓存结果
4. **监控告警** - API 调用成功率监控
5. **成本优化** - 智能选择性价比最高的模型

## 相关文档

- [模型定价策略](./模型定价策略.md)
- [前端集成指南](./前端集成指南.md)
- [API 文档](./API文档.md)
