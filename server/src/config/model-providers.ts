/**
 * AI 模型提供商配置
 * 统一对接所有主流模型公司的所有模型产品
 */

// ==================== 类型定义 ====================

export interface ModelProvider {
  id: string;
  name: string;
  nameEn: string;
  baseUrl: string;
  apiKeyEnv: string;
  icon: string;
  website: string;
  docs: string;
  status: 'active' | 'beta' | 'coming_soon';
  categories: ModelType[];
  features: {
    streaming: boolean;
    functionCall: boolean;
    vision: boolean;
    audio: boolean;
    tools: boolean;
  };
}

export type ModelType = 'text' | 'image' | 'audio' | 'video' | 'embedding' | 'multimodal' | 'vision';
export type ModelCategory = 'chat' | 'completion' | 'image_gen' | 'image_edit' | 'audio_transcribe' | 'audio_tts' | 'video_gen' | 'embedding';

export interface ModelConfig {
  id: string;
  code: string;
  name: string;
  provider: string;
  category: ModelType;  // 改为使用 ModelType
  type: ModelCategory;
  description?: string;  // 可选字段
  
  // 上下文和输出限制
  contextWindow: number;
  maxOutputTokens: number;
  
  // 定价（厘/百万tokens，即 1元 = 1000厘）
  inputPrice: number;  // 保留旧字段名，向后兼容
  outputPrice: number; // 保留旧字段名，向后兼容
  pricing?: {
    input: number;  // 新字段，可选
    output: number;
    tier: 'free' | 'standard' | 'premium' | 'enterprise';
  };
  
  // 功能特性
  features: {
    streaming: boolean;
    functionCall: boolean;
    vision: boolean;
    audio: boolean;
    jsonMode: boolean;
  };
  
  // 权限
  isFree: boolean;
  memberOnly: boolean;
  superMemberOnly: boolean;
  
  // 状态
  status: 'active' | 'deprecated' | 'beta';
}

// ==================== 提供商配置 ====================

export const MODEL_PROVIDERS: Record<string, ModelProvider> = {
  // ============ 国际厂商 ============
  
  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameEn: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    icon: 'openai',
    website: 'https://openai.com',
    docs: 'https://platform.openai.com/docs',
    status: 'active',
    categories: ['text', 'image', 'audio', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    nameEn: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    icon: 'anthropic',
    website: 'https://anthropic.com',
    docs: 'https://docs.anthropic.com',
    status: 'active',
    categories: ['text', 'vision'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: false,
      tools: true,
    },
  },
  
  google: {
    id: 'google',
    name: 'Google AI',
    nameEn: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnv: 'GOOGLE_AI_API_KEY',
    icon: 'google',
    website: 'https://ai.google.dev',
    docs: 'https://ai.google.dev/docs',
    status: 'active',
    categories: ['text', 'image', 'audio', 'video', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    nameEn: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyEnv: 'MISTRAL_API_KEY',
    icon: 'mistral',
    website: 'https://mistral.ai',
    docs: 'https://docs.mistral.ai',
    status: 'active',
    categories: ['text', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: false,
      audio: false,
      tools: true,
    },
  },
  
  groq: {
    id: 'groq',
    name: 'Groq',
    nameEn: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyEnv: 'GROQ_API_KEY',
    icon: 'groq',
    website: 'https://groq.com',
    docs: 'https://console.groq.com/docs',
    status: 'active',
    categories: ['text', 'audio'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  cohere: {
    id: 'cohere',
    name: 'Cohere',
    nameEn: 'Cohere',
    baseUrl: 'https://api.cohere.ai/v1',
    apiKeyEnv: 'COHERE_API_KEY',
    icon: 'cohere',
    website: 'https://cohere.com',
    docs: 'https://docs.cohere.com',
    status: 'active',
    categories: ['text', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: false,
      audio: false,
      tools: true,
    },
  },
  
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    nameEn: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    icon: 'deepseek',
    website: 'https://deepseek.com',
    docs: 'https://platform.deepseek.com/docs',
    status: 'active',
    categories: ['text'],
    features: {
      streaming: true,
      functionCall: true,
      vision: false,
      audio: false,
      tools: true,
    },
  },
  
  replicate: {
    id: 'replicate',
    name: 'Replicate',
    nameEn: 'Replicate',
    baseUrl: 'https://api.replicate.com/v1',
    apiKeyEnv: 'REPLICATE_API_TOKEN',
    icon: 'replicate',
    website: 'https://replicate.com',
    docs: 'https://replicate.com/docs',
    status: 'active',
    categories: ['text', 'image', 'audio', 'video'],
    features: {
      streaming: true,
      functionCall: false,
      vision: false,
      audio: true,
      tools: false,
    },
  },
  
  stability: {
    id: 'stability',
    name: 'Stability AI',
    nameEn: 'Stability AI',
    baseUrl: 'https://api.stability.ai/v1',
    apiKeyEnv: 'STABILITY_API_KEY',
    icon: 'stability',
    website: 'https://stability.ai',
    docs: 'https://platform.stability.ai/docs',
    status: 'active',
    categories: ['image', 'audio', 'video'],
    features: {
      streaming: false,
      functionCall: false,
      vision: false,
      audio: true,
      tools: false,
    },
  },
  
  // ============ 国内厂商 ============
  
  doubao: {
    id: 'doubao',
    name: '豆包',
    nameEn: 'Doubao (ByteDance)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKeyEnv: 'DOUBAO_API_KEY',
    icon: 'doubao',
    website: 'https://www.doubao.com',
    docs: 'https://www.volcengine.com/docs/82379',
    status: 'active',
    categories: ['text', 'audio', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  qwen: {
    id: 'qwen',
    name: '通义千问',
    nameEn: 'Qwen (Alibaba)',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    apiKeyEnv: 'QWEN_API_KEY',
    icon: 'qwen',
    website: 'https://tongyi.aliyun.com',
    docs: 'https://help.aliyun.com/zh/dashscope',
    status: 'active',
    categories: ['text', 'image', 'audio', 'video', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  wenxin: {
    id: 'wenxin',
    name: '文心一言',
    nameEn: 'Ernie Bot (Baidu)',
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    apiKeyEnv: 'WENXIN_API_KEY',
    icon: 'wenxin',
    website: 'https://yiyan.baidu.com',
    docs: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html',
    status: 'active',
    categories: ['text', 'image', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: false,
      tools: true,
    },
  },
  
  zhipu: {
    id: 'zhipu',
    name: '智谱AI',
    nameEn: 'Zhipu AI (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyEnv: 'ZHIPU_API_KEY',
    icon: 'zhipu',
    website: 'https://www.zhipuai.cn',
    docs: 'https://open.bigmodel.cn/dev/api',
    status: 'active',
    categories: ['text', 'image', 'audio', 'video', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  moonshot: {
    id: 'moonshot',
    name: 'Moonshot',
    nameEn: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'MOONSHOT_API_KEY',
    icon: 'moonshot',
    website: 'https://www.moonshot.cn',
    docs: 'https://platform.moonshot.cn/docs',
    status: 'active',
    categories: ['text', 'vision'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: false,
      tools: true,
    },
  },
  
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    nameEn: 'MiniMax (Hailuo)',
    baseUrl: 'https://api.minimax.chat/v1',
    apiKeyEnv: 'MINIMAX_API_KEY',
    icon: 'minimax',
    website: 'https://www.minimaxi.com',
    docs: 'https://www.minimaxi.com/document',
    status: 'active',
    categories: ['text', 'image', 'audio', 'video'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  spark: {
    id: 'spark',
    name: '讯飞星火',
    nameEn: 'Spark (iFLYTEK)',
    baseUrl: 'https://spark-api-open.xf-yun.com/v1',
    apiKeyEnv: 'SPARK_API_KEY',
    icon: 'spark',
    website: 'https://xinghuo.xfyun.cn',
    docs: 'https://www.xfyun.cn/doc/spark',
    status: 'active',
    categories: ['text', 'image', 'audio', 'video'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  hunyuan: {
    id: 'hunyuan',
    name: '腾讯混元',
    nameEn: 'Hunyuan (Tencent)',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    apiKeyEnv: 'HUNYUAN_API_KEY',
    icon: 'hunyuan',
    website: 'https://hunyuan.tencent.com',
    docs: 'https://cloud.tencent.com/document/product/1729',
    status: 'active',
    categories: ['text', 'image', 'audio', 'video', 'embedding'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: true,
      tools: true,
    },
  },
  
  pangu: {
    id: 'pangu',
    name: '华为盘古',
    nameEn: 'Pangu (Huawei)',
    baseUrl: 'https://pangu-api.cn-east-3.myhuaweicloud.com/v1',
    apiKeyEnv: 'PANGU_API_KEY',
    icon: 'pangu',
    website: 'https://www.huaweicloud.com/product/pangu.html',
    docs: 'https://support.huaweicloud.com/product-pangu/pangu_01_0001.html',
    status: 'active',
    categories: ['text', 'image', 'video'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: false,
      tools: true,
    },
  },
  
  yi: {
    id: 'yi',
    name: '零一万物',
    nameEn: 'Yi (01.AI)',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    apiKeyEnv: 'YI_API_KEY',
    icon: 'yi',
    website: 'https://www.lingyiwanwu.com',
    docs: 'https://platform.lingyiwanwu.com/docs',
    status: 'active',
    categories: ['text', 'vision'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: false,
      tools: true,
    },
  },
  
  baichuan: {
    id: 'baichuan',
    name: '百川智能',
    nameEn: 'Baichuan',
    baseUrl: 'https://api.baichuan-ai.com/v1',
    apiKeyEnv: 'BAICHUAN_API_KEY',
    icon: 'baichuan',
    website: 'https://www.baichuan-ai.com',
    docs: 'https://platform.baichuan-ai.com/docs',
    status: 'active',
    categories: ['text', 'vision'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: false,
      tools: true,
    },
  },
  
  sensechat: {
    id: 'sensechat',
    name: '商汤日日新',
    nameEn: 'SenseChat (SenseTime)',
    baseUrl: 'https://api.sensenova.cn/v1',
    apiKeyEnv: 'SENSECHAT_API_KEY',
    icon: 'sensechat',
    website: 'https://chat.sensenova.cn',
    docs: 'https://platform.sensenova.cn/doc',
    status: 'active',
    categories: ['text', 'image', 'video'],
    features: {
      streaming: true,
      functionCall: true,
      vision: true,
      audio: false,
      tools: true,
    },
  },
};

// ==================== 模型列表 ====================

export const AVAILABLE_MODELS: ModelConfig[] = [
  // ============ OpenAI ============
  {
    id: 'openai-gpt-4o',
    code: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputPrice: 250, // ¥2.5/百万tokens
    outputPrice: 1000, // ¥10/百万tokens
    features: { streaming: true, functionCall: true, vision: true, audio: true, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'openai-gpt-4o-mini',
    code: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    inputPrice: 15, // ¥0.15/百万tokens
    outputPrice: 60, // ¥0.6/百万tokens
    features: { streaming: true, functionCall: true, vision: true, audio: true, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'openai-gpt-4-turbo',
    code: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPrice: 100, // ¥1/百万tokens
    outputPrice: 300, // ¥3/百万tokens
    features: { streaming: true, functionCall: true, vision: true, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'openai-dall-e-3',
    code: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    category: 'image',
    type: 'image_gen',
    contextWindow: 0,
    maxOutputTokens: 0,
    inputPrice: 4000, // ¥40/张
    outputPrice: 0,
    features: { streaming: false, functionCall: false, vision: false, audio: false, jsonMode: false },
    isFree: false,
    memberOnly: true,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'openai-whisper',
    code: 'whisper-1',
    name: 'Whisper',
    provider: 'openai',
    category: 'audio',
    type: 'audio_transcribe',
    contextWindow: 0,
    maxOutputTokens: 0,
    inputPrice: 60, // ¥0.6/分钟
    outputPrice: 0,
    features: { streaming: false, functionCall: false, vision: false, audio: true, jsonMode: false },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'openai-tts',
    code: 'tts-1',
    name: 'TTS-1',
    provider: 'openai',
    category: 'audio',
    type: 'audio_tts',
    contextWindow: 0,
    maxOutputTokens: 0,
    inputPrice: 150, // ¥1.5/百万字符
    outputPrice: 0,
    features: { streaming: true, functionCall: false, vision: false, audio: true, jsonMode: false },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ Anthropic ============
  {
    id: 'anthropic-claude-3-5-sonnet',
    code: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    inputPrice: 300, // ¥3/百万tokens
    outputPrice: 1500, // ¥15/百万tokens
    features: { streaming: true, functionCall: true, vision: true, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'anthropic-claude-3-opus',
    code: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputPrice: 1500, // ¥15/百万tokens
    outputPrice: 7500, // ¥75/百万tokens
    features: { streaming: true, functionCall: true, vision: true, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: true,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'anthropic-claude-3-haiku',
    code: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    category: 'text',
    type: 'chat',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputPrice: 25, // ¥0.25/百万tokens
    outputPrice: 125, // ¥1.25/百万tokens
    features: { streaming: true, functionCall: true, vision: true, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ Google ============
  {
    id: 'google-gemini-2-flash',
    code: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    inputPrice: 0, // 免费
    outputPrice: 0,
    features: { streaming: true, functionCall: true, vision: true, audio: true, jsonMode: true },
    isFree: true,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'google-gemini-1-5-pro',
    code: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    inputPrice: 175, // ¥1.75/百万tokens
    outputPrice: 700, // ¥7/百万tokens
    features: { streaming: true, functionCall: true, vision: true, audio: true, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ DeepSeek ============
  {
    id: 'deepseek-chat',
    code: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    category: 'text',
    type: 'chat',
    contextWindow: 64000,
    maxOutputTokens: 4096,
    inputPrice: 10, // ¥0.1/百万tokens
    outputPrice: 20, // ¥0.2/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'deepseek-reasoner',
    code: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    category: 'text',
    type: 'chat',
    contextWindow: 64000,
    maxOutputTokens: 8192,
    inputPrice: 55, // ¥0.55/百万tokens
    outputPrice: 220, // ¥2.2/百万tokens
    features: { streaming: true, functionCall: false, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ Groq ============
  {
    id: 'groq-llama-3-3-70b',
    code: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputPrice: 60, // ¥0.6/百万tokens
    outputPrice: 60, // ¥0.6/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'groq-whisper',
    code: 'whisper-large-v3',
    name: 'Whisper Large V3 (Groq)',
    provider: 'groq',
    category: 'audio',
    type: 'audio_transcribe',
    contextWindow: 0,
    maxOutputTokens: 0,
    inputPrice: 20, // ¥0.2/分钟
    outputPrice: 0,
    features: { streaming: false, functionCall: false, vision: false, audio: true, jsonMode: false },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ Mistral ============
  {
    id: 'mistral-large',
    code: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'mistral',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputPrice: 200, // ¥2/百万tokens
    outputPrice: 600, // ¥6/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'mistral-small',
    code: 'mistral-small-latest',
    name: 'Mistral Small',
    provider: 'mistral',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    inputPrice: 20, // ¥0.2/百万tokens
    outputPrice: 60, // ¥0.6/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ 豆包 ============
  {
    id: 'doubao-pro-128k',
    code: 'doubao-pro-128k',
    name: '豆包 Pro 128K',
    provider: 'doubao',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPrice: 50, // ¥0.5/百万tokens
    outputPrice: 50, // ¥0.5/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'doubao-lite-4k',
    code: 'doubao-lite-4k',
    name: '豆包 Lite 4K',
    provider: 'doubao',
    category: 'text',
    type: 'chat',
    contextWindow: 4096,
    maxOutputTokens: 2048,
    inputPrice: 3, // ¥0.03/百万tokens
    outputPrice: 3, // ¥0.03/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ 通义千问 ============
  {
    id: 'qwen-max',
    code: 'qwen-max',
    name: '通义千问 Max',
    provider: 'qwen',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    inputPrice: 200, // ¥2/百万tokens
    outputPrice: 600, // ¥6/百万tokens
    features: { streaming: true, functionCall: true, vision: true, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'qwen-plus',
    code: 'qwen-plus',
    name: '通义千问 Plus',
    provider: 'qwen',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 6144,
    inputPrice: 40, // ¥0.4/百万tokens
    outputPrice: 120, // ¥1.2/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'qwen-turbo',
    code: 'qwen-turbo',
    name: '通义千问 Turbo',
    provider: 'qwen',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 6144,
    inputPrice: 30, // ¥0.3/百万tokens
    outputPrice: 60, // ¥0.6/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'qwen-vl-max',
    code: 'qwen-vl-max',
    name: '通义千问 VL Max',
    provider: 'qwen',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    inputPrice: 200, // ¥2/百万tokens
    outputPrice: 600, // ¥6/百万tokens
    features: { streaming: true, functionCall: false, vision: true, audio: false, jsonMode: false },
    isFree: false,
    memberOnly: true,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ 文心一言 ============
  {
    id: 'wenxin-4-8k',
    code: 'ernie-4.0-8k',
    name: '文心一言 4.0',
    provider: 'wenxin',
    category: 'text',
    type: 'chat',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    inputPrice: 120, // ¥1.2/百万tokens
    outputPrice: 120, // ¥1.2/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'wenxin-3-5-4k',
    code: 'ernie-3.5-4k',
    name: '文心一言 3.5',
    provider: 'wenxin',
    category: 'text',
    type: 'chat',
    contextWindow: 4096,
    maxOutputTokens: 2048,
    inputPrice: 40, // ¥0.4/百万tokens
    outputPrice: 80, // ¥0.8/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ 智谱AI ============
  {
    id: 'zhipu-glm-4-plus',
    code: 'glm-4-plus',
    name: 'GLM-4 Plus',
    provider: 'zhipu',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPrice: 500, // ¥5/百万tokens
    outputPrice: 500, // ¥5/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'zhipu-glm-4-flash',
    code: 'glm-4-flash',
    name: 'GLM-4 Flash',
    provider: 'zhipu',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPrice: 10, // ¥0.1/百万tokens
    outputPrice: 10, // ¥0.1/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'zhipu-glm-4v',
    code: 'glm-4v',
    name: 'GLM-4V',
    provider: 'zhipu',
    category: 'multimodal',
    type: 'chat',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    inputPrice: 100, // ¥1/百万tokens
    outputPrice: 100, // ¥1/百万tokens
    features: { streaming: true, functionCall: false, vision: true, audio: false, jsonMode: false },
    isFree: false,
    memberOnly: true,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'zhipu-cogview-3',
    code: 'cogview-3',
    name: 'CogView 3 (图像生成)',
    provider: 'zhipu',
    category: 'image',
    type: 'image_gen',
    contextWindow: 0,
    maxOutputTokens: 0,
    inputPrice: 80, // ¥0.8/张
    outputPrice: 0,
    features: { streaming: false, functionCall: false, vision: false, audio: false, jsonMode: false },
    isFree: false,
    memberOnly: true,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ Moonshot ============
  {
    id: 'moonshot-v1-8k',
    code: 'moonshot-v1-8k',
    name: 'Kimi (Moonshot)',
    provider: 'moonshot',
    category: 'text',
    type: 'chat',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    inputPrice: 120, // ¥1.2/百万tokens
    outputPrice: 120, // ¥1.2/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'moonshot-v1-32k',
    code: 'moonshot-v1-32k',
    name: 'Kimi 32K',
    provider: 'moonshot',
    category: 'text',
    type: 'chat',
    contextWindow: 32768,
    maxOutputTokens: 4096,
    inputPrice: 240, // ¥2.4/百万tokens
    outputPrice: 240, // ¥2.4/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'moonshot-v1-128k',
    code: 'moonshot-v1-128k',
    name: 'Kimi 128K',
    provider: 'moonshot',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPrice: 600, // ¥6/百万tokens
    outputPrice: 600, // ¥6/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: true,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ MiniMax ============
  {
    id: 'minimax-abab6-5-chat',
    code: 'abab6.5-chat',
    name: '海螺 AI (MiniMax)',
    provider: 'minimax',
    category: 'text',
    type: 'chat',
    contextWindow: 245000,
    maxOutputTokens: 8192,
    inputPrice: 300, // ¥3/百万tokens
    outputPrice: 300, // ¥3/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'minimax-abab5-5-chat',
    code: 'abab5.5-chat',
    name: '海螺 AI Lite',
    provider: 'minimax',
    category: 'text',
    type: 'chat',
    contextWindow: 16384,
    maxOutputTokens: 4096,
    inputPrice: 150, // ¥1.5/百万tokens
    outputPrice: 150, // ¥1.5/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ 讯飞星火 ============
  {
    id: 'spark-v3-5',
    code: 'generalv3.5',
    name: '星火 3.5',
    provider: 'spark',
    category: 'text',
    type: 'chat',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    inputPrice: 30, // ¥0.3/百万tokens
    outputPrice: 30, // ¥0.3/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'spark-v4',
    code: 'generalv4',
    name: '星火 4.0',
    provider: 'spark',
    category: 'text',
    type: 'chat',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    inputPrice: 100, // ¥1/百万tokens
    outputPrice: 100, // ¥1/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ 腾讯混元 ============
  {
    id: 'hunyuan-lite',
    code: 'hunyuan-lite',
    name: '混元 Lite',
    provider: 'hunyuan',
    category: 'text',
    type: 'chat',
    contextWindow: 256000,
    maxOutputTokens: 6144,
    inputPrice: 3, // ¥0.03/百万tokens
    outputPrice: 3, // ¥0.03/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'hunyuan-pro',
    code: 'hunyuan-pro',
    name: '混元 Pro',
    provider: 'hunyuan',
    category: 'text',
    type: 'chat',
    contextWindow: 32000,
    maxOutputTokens: 4096,
    inputPrice: 40, // ¥0.4/百万tokens
    outputPrice: 40, // ¥0.4/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ 零一万物 ============
  {
    id: 'yi-large',
    code: 'yi-large',
    name: 'Yi Large',
    provider: 'yi',
    category: 'text',
    type: 'chat',
    contextWindow: 32768,
    maxOutputTokens: 4096,
    inputPrice: 200, // ¥2/百万tokens
    outputPrice: 200, // ¥2/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'yi-medium',
    code: 'yi-medium',
    name: 'Yi Medium',
    provider: 'yi',
    category: 'text',
    type: 'chat',
    contextWindow: 16384,
    maxOutputTokens: 4096,
    inputPrice: 25, // ¥0.25/百万tokens
    outputPrice: 25, // ¥0.25/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ 百川 ============
  {
    id: 'baichuan-4',
    code: 'Baichuan4',
    name: '百川 4',
    provider: 'baichuan',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPrice: 100, // ¥1/百万tokens
    outputPrice: 100, // ¥1/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'baichuan-3-turbo',
    code: 'Baichuan3-Turbo',
    name: '百川 3 Turbo',
    provider: 'baichuan',
    category: 'text',
    type: 'chat',
    contextWindow: 32000,
    maxOutputTokens: 4096,
    inputPrice: 12, // ¥0.12/百万tokens
    outputPrice: 12, // ¥0.12/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ Stability AI ============
  {
    id: 'stability-sd-3',
    code: 'stable-diffusion-3',
    name: 'Stable Diffusion 3',
    provider: 'stability',
    category: 'image',
    type: 'image_gen',
    contextWindow: 0,
    maxOutputTokens: 0,
    inputPrice: 350, // ¥3.5/张
    outputPrice: 0,
    features: { streaming: false, functionCall: false, vision: false, audio: false, jsonMode: false },
    isFree: false,
    memberOnly: true,
    superMemberOnly: false,
    status: 'active',
  },
  
  // ============ Cohere ============
  {
    id: 'cohere-command-r-plus',
    code: 'command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    category: 'text',
    type: 'chat',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPrice: 30, // ¥0.3/百万tokens
    outputPrice: 150, // ¥1.5/百万tokens
    features: { streaming: true, functionCall: true, vision: false, audio: false, jsonMode: true },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
  {
    id: 'cohere-embed',
    code: 'embed-english-v3.0',
    name: 'Cohere Embed',
    provider: 'cohere',
    category: 'embedding',
    type: 'embedding',
    contextWindow: 512,
    maxOutputTokens: 0,
    inputPrice: 10, // ¥0.1/百万tokens
    outputPrice: 0,
    features: { streaming: false, functionCall: false, vision: false, audio: false, jsonMode: false },
    isFree: false,
    memberOnly: false,
    superMemberOnly: false,
    status: 'active',
  },
];

// ==================== 辅助函数 ====================

/**
 * 获取提供商的API密钥
 */
export function getProviderApiKey(providerId: string): string | undefined {
  const provider = MODEL_PROVIDERS[providerId];
  if (!provider) return undefined;
  return process.env[provider.apiKeyEnv];
}

/**
 * 检查提供商是否可用
 */
export function isProviderAvailable(providerId: string): boolean {
  const apiKey = getProviderApiKey(providerId);
  return !!apiKey;
}

/**
 * 获取可用的模型列表
 */
export function getAvailableModels(): ModelConfig[] {
  return AVAILABLE_MODELS.filter(model => {
    return isProviderAvailable(model.provider);
  });
}

/**
 * 根据类别获取模型
 */
export function getModelsByCategory(category: string): ModelConfig[] {
  return AVAILABLE_MODELS.filter(model => model.category === category);
}

/**
 * 根据提供商获取模型
 */
export function getModelsByProvider(providerId: string): ModelConfig[] {
  return AVAILABLE_MODELS.filter(model => model.provider === providerId);
}
