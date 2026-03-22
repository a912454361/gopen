/**
 * 模型同步服务 - 增强版
 * 自动对接所有厂商模型，全量同步上线/下线和价格变更
 * 
 * 核心功能：
 * 1. 自动发现新模型并上架
 * 2. 自动同步价格变更
 * 3. 自动下线已废弃模型
 * 4. 支持定时全量同步
 * 5. 多厂商适配器支持
 */

import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { MODEL_PROVIDERS, getProviderApiKey, MARKUP_BY_CATEGORY, DEFAULT_PLATFORM_MARKUP } from '../config/model-providers.js';

const client = getSupabaseClient();

// ==================== 类型定义 ====================

export interface SyncStatus {
  provider: string;
  providerName: string;
  lastSync: Date | null;
  status: 'idle' | 'syncing' | 'error' | 'not_configured';
  error?: string;
  totalModels: number;
  modelsAdded: number;
  modelsUpdated: number;
  modelsDeactivated: number;
  lastDuration?: number;
}

export interface ProviderModel {
  id: string;
  name: string;
  type: string;
  description?: string;
  pricing: {
    input: number;  // 美元/百万tokens
    output: number;
  };
  context_window?: number;
  max_output?: number;
  status: 'active' | 'deprecated';
  features?: {
    streaming?: boolean;
    functionCall?: boolean;
    vision?: boolean;
    audio?: boolean;
  };
}

export interface SyncResult {
  provider: string;
  providerName: string;
  success: boolean;
  error?: string;
  totalModels: number;
  modelsAdded: number;
  modelsUpdated: number;
  modelsDeactivated: number;
  priceChanges: Array<{
    model: string;
    oldPrice: { input: number; output: number };
    newPrice: { input: number; output: number };
  }>;
  newModels: string[];
  duration: number;
}

export interface ProviderAdapter {
  id: string;
  name: string;
  fetchModels: (baseUrl: string, apiKey: string) => Promise<ProviderModel[]>;
}

// ==================== 厂商适配器 ====================

/**
 * OpenAI 适配器
 */
const openaiAdapter: ProviderAdapter = {
  id: 'openai',
  name: 'OpenAI',
  fetchModels: async (baseUrl: string, apiKey: string): Promise<ProviderModel[]> => {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as { data: Array<{ id: string; owned_by?: string }> };
    
    // OpenAI 模型价格表（美元/百万tokens）
    const pricingMap: Record<string, { input: number; output: number; context: number; maxOutput: number }> = {
      'gpt-4o': { input: 2.5, output: 10, context: 128000, maxOutput: 16384 },
      'gpt-4o-2024-11-20': { input: 2.5, output: 10, context: 128000, maxOutput: 16384 },
      'gpt-4o-2024-08-06': { input: 2.5, output: 10, context: 128000, maxOutput: 16384 },
      'gpt-4o-2024-05-13': { input: 5, output: 15, context: 128000, maxOutput: 4096 },
      'gpt-4o-mini': { input: 0.15, output: 0.6, context: 128000, maxOutput: 16384 },
      'gpt-4o-mini-2024-07-18': { input: 0.15, output: 0.6, context: 128000, maxOutput: 16384 },
      'gpt-4-turbo': { input: 10, output: 30, context: 128000, maxOutput: 4096 },
      'gpt-4-turbo-2024-04-09': { input: 10, output: 30, context: 128000, maxOutput: 4096 },
      'gpt-4-turbo-preview': { input: 10, output: 30, context: 128000, maxOutput: 4096 },
      'gpt-4-0125-preview': { input: 10, output: 30, context: 128000, maxOutput: 4096 },
      'gpt-4-1106-preview': { input: 10, output: 30, context: 128000, maxOutput: 4096 },
      'gpt-4': { input: 30, output: 60, context: 8192, maxOutput: 4096 },
      'gpt-4-0613': { input: 30, output: 60, context: 8192, maxOutput: 4096 },
      'gpt-4-32k': { input: 60, output: 120, context: 32768, maxOutput: 4096 },
      'gpt-4-32k-0613': { input: 60, output: 120, context: 32768, maxOutput: 4096 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5, context: 16384, maxOutput: 4096 },
      'gpt-3.5-turbo-0125': { input: 0.5, output: 1.5, context: 16384, maxOutput: 4096 },
      'gpt-3.5-turbo-1106': { input: 1, output: 2, context: 16384, maxOutput: 4096 },
      'gpt-3.5-turbo-16k': { input: 3, output: 4, context: 16384, maxOutput: 4096 },
      'o1': { input: 15, output: 60, context: 200000, maxOutput: 100000 },
      'o1-2024-12-17': { input: 15, output: 60, context: 200000, maxOutput: 100000 },
      'o1-preview': { input: 15, output: 60, context: 128000, maxOutput: 32768 },
      'o1-mini': { input: 1.5, output: 6, context: 128000, maxOutput: 65536 },
      'o1-mini-2024-09-12': { input: 1.5, output: 6, context: 128000, maxOutput: 65536 },
    };

    return data.data
      .filter((m) => {
        // 过滤掉非聊天模型
        const modelId = m.id.toLowerCase();
        return (
          modelId.includes('gpt-') || 
          modelId.includes('o1-') ||
          modelId === 'o1'
        ) && 
        !modelId.includes('realtime') && 
        !modelId.includes('instruct') &&
        !modelId.includes('-search-preview');
      })
      .map((m) => {
        const pricing = pricingMap[m.id] || { input: 1, output: 2, context: 4096, maxOutput: 2048 };
        return {
          id: m.id,
          name: formatModelName(m.id),
          type: getModelType(m.id),
          description: `OpenAI ${formatModelName(m.id)}`,
          pricing: { input: pricing.input, output: pricing.output },
          context_window: pricing.context,
          max_output: pricing.maxOutput,
          status: 'active' as const,
          features: {
            streaming: true,
            functionCall: !m.id.includes('o1-preview'),
            vision: m.id.includes('gpt-4o') || m.id.includes('gpt-4-turbo'),
            audio: m.id.includes('gpt-4o'),
          },
        };
      });
  },
};

/**
 * Anthropic 适配器
 */
const anthropicAdapter: ProviderAdapter = {
  id: 'anthropic',
  name: 'Anthropic',
  fetchModels: async (): Promise<ProviderModel[]> => {
    // Anthropic 没有公开的模型列表 API，使用预定义列表
    const models = [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', pricing: { input: 3, output: 15 }, context: 200000, maxOutput: 8192, vision: true },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', pricing: { input: 1, output: 5 }, context: 200000, maxOutput: 8192, vision: true },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', pricing: { input: 15, output: 75 }, context: 200000, maxOutput: 4096, vision: true },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', pricing: { input: 3, output: 15 }, context: 200000, maxOutput: 4096, vision: true },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', pricing: { input: 0.25, output: 1.25 }, context: 200000, maxOutput: 4096, vision: true },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `Anthropic ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: m.maxOutput,
      status: 'active' as const,
      features: {
        streaming: true,
        functionCall: true,
        vision: m.vision,
        audio: false,
      },
    }));
  },
};

/**
 * Google Gemini 适配器
 */
const googleAdapter: ProviderAdapter = {
  id: 'google',
  name: 'Google AI',
  fetchModels: async (baseUrl: string, apiKey: string): Promise<ProviderModel[]> => {
    try {
      const response = await fetch(`${baseUrl}/models?key=${apiKey}`);
      if (!response.ok) {
        // 如果 API 调用失败，使用预定义列表
        return getPredefinedGoogleModels();
      }
      const data = await response.json() as { models?: Array<{
        name: string;
        displayName?: string;
        description?: string;
        inputTokenLimit?: number;
        outputTokenLimit?: number;
        supportedGenerationMethods?: string[];
      }> };
      // 解析 Google API 返回的模型列表
      if (data.models && Array.isArray(data.models)) {
        return data.models
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => ({
            id: m.name.replace('models/', ''),
            name: m.displayName || m.name,
            type: 'chat',
            description: m.description,
            pricing: getGooglePricing(m.name),
            context_window: m.inputTokenLimit || 32000,
            max_output: m.outputTokenLimit || 8192,
            status: 'active' as const,
            features: { streaming: true, functionCall: true, vision: true, audio: true },
          }));
      }
      return getPredefinedGoogleModels();
    } catch {
      return getPredefinedGoogleModels();
    }
  },
};

function getPredefinedGoogleModels(): ProviderModel[] {
  const models = [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', pricing: { input: 0, output: 0 }, context: 1000000, maxOutput: 8192 },
    { id: 'gemini-2.0-flash-thinking-exp-1219', name: 'Gemini 2.0 Flash Thinking', pricing: { input: 0, output: 0 }, context: 32768, maxOutput: 8192 },
    { id: 'gemini-exp-1206', name: 'Gemini Exp 1206', pricing: { input: 0, output: 0 }, context: 2000000, maxOutput: 8192 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', pricing: { input: 1.75, output: 7 }, context: 2000000, maxOutput: 8192 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', pricing: { input: 0.35, output: 1.05 }, context: 1000000, maxOutput: 8192 },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', pricing: { input: 0, output: 0 }, context: 1000000, maxOutput: 8192 },
    { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro 002', pricing: { input: 1.75, output: 7 }, context: 2000000, maxOutput: 8192 },
    { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash 002', pricing: { input: 0.35, output: 1.05 }, context: 1000000, maxOutput: 8192 },
  ];

  return models.map(m => ({
    id: m.id,
    name: m.name,
    type: 'chat',
    description: `Google ${m.name}`,
    pricing: m.pricing,
    context_window: m.context,
    max_output: m.maxOutput,
    status: 'active' as const,
    features: { streaming: true, functionCall: true, vision: true, audio: true },
  }));
}

function getGooglePricing(modelId: string): { input: number; output: number } {
  const pricing: Record<string, { input: number; output: number }> = {
    'gemini-2.0-flash-exp': { input: 0, output: 0 },
    'gemini-1.5-pro': { input: 1.75, output: 7 },
    'gemini-1.5-flash': { input: 0.35, output: 1.05 },
    'gemini-1.5-flash-8b': { input: 0, output: 0 },
  };
  
  for (const [key, price] of Object.entries(pricing)) {
    if (modelId.includes(key)) return price;
  }
  return { input: 0.5, output: 1 };
}

/**
 * DeepSeek 适配器
 */
const deepseekAdapter: ProviderAdapter = {
  id: 'deepseek',
  name: 'DeepSeek',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'deepseek-chat', name: 'DeepSeek V3', pricing: { input: 0, output: 0 }, context: 64000, maxOutput: 8192 },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', pricing: { input: 0.55, output: 2.2 }, context: 64000, maxOutput: 8192 },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `DeepSeek ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: m.maxOutput,
      status: 'active' as const,
      features: { streaming: true, functionCall: true, vision: false, audio: false },
    }));
  },
};

/**
 * Groq 适配器 - 极速推理
 */
const groqAdapter: ProviderAdapter = {
  id: 'groq',
  name: 'Groq',
  fetchModels: async (baseUrl: string, apiKey: string): Promise<ProviderModel[]> => {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json() as { data: Array<{ id: string }> };
    
    // Groq 模型价格（美元/百万tokens）- 大部分免费
    const pricingMap: Record<string, { input: number; output: number; context: number }> = {
      'llama-3.3-70b-versatile': { input: 0, output: 0, context: 128000 },
      'llama-3.3-70b-specdec': { input: 0, output: 0, context: 8192 },
      'llama-3.2-90b-vision-preview': { input: 0, output: 0, context: 8192 },
      'llama-3.2-11b-vision-preview': { input: 0, output: 0, context: 8192 },
      'llama-3.1-70b-versatile': { input: 0, output: 0, context: 131072 },
      'llama-3.1-8b-instant': { input: 0, output: 0, context: 131072 },
      'llama3-70b-8192': { input: 0, output: 0, context: 8192 },
      'llama3-8b-8192': { input: 0, output: 0, context: 8192 },
      'mixtral-8x7b-32768': { input: 0, output: 0, context: 32768 },
      'gemma2-9b-it': { input: 0, output: 0, context: 8192 },
      'whisper-large-v3': { input: 0, output: 0, context: 0 },
      'whisper-large-v3-turbo': { input: 0, output: 0, context: 0 },
    };

    return data.data
      .filter((m) => !m.id.includes('embedding') && !m.id.includes('tool-use'))
      .map((m) => {
        const pricing = pricingMap[m.id] || { input: 0, output: 0, context: 4096 };
        const isAudio = m.id.includes('whisper');
        return {
          id: m.id,
          name: formatModelName(m.id),
          type: isAudio ? 'audio_transcribe' : 'chat',
          description: `Groq ${formatModelName(m.id)}`,
          pricing: { input: pricing.input, output: pricing.output },
          context_window: pricing.context,
          max_output: 8192,
          status: 'active' as const,
          features: {
            streaming: !isAudio,
            functionCall: !isAudio,
            vision: m.id.includes('vision'),
            audio: isAudio,
          },
        };
      });
  },
};

/**
 * Mistral 适配器
 */
const mistralAdapter: ProviderAdapter = {
  id: 'mistral',
  name: 'Mistral AI',
  fetchModels: async (baseUrl: string, apiKey: string): Promise<ProviderModel[]> => {
    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        return getPredefinedMistralModels();
      }

      const data = await response.json() as { data?: Array<{ id: string }> };
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m) => ({
          id: m.id,
          name: formatModelName(m.id),
          type: 'chat',
          description: `Mistral ${formatModelName(m.id)}`,
          pricing: getMistralPricing(m.id),
          context_window: 128000,
          max_output: 8192,
          status: 'active' as const,
          features: { streaming: true, functionCall: true, vision: m.id.includes('pixtral'), audio: false },
        }));
      }
      return getPredefinedMistralModels();
    } catch {
      return getPredefinedMistralModels();
    }
  },
};

function getPredefinedMistralModels(): ProviderModel[] {
  const models = [
    { id: 'mistral-large-latest', name: 'Mistral Large', pricing: { input: 2, output: 6 }, context: 128000 },
    { id: 'mistral-small-latest', name: 'Mistral Small', pricing: { input: 0.2, output: 0.6 }, context: 128000 },
    { id: 'codestral-latest', name: 'Codestral', pricing: { input: 0.3, output: 0.9 }, context: 256000 },
    { id: 'pixtral-12b-2409', name: 'Pixtral 12B', pricing: { input: 0.15, output: 0.15 }, context: 128000 },
    { id: 'open-mistral-nemo', name: 'Mistral Nemo', pricing: { input: 0.15, output: 0.15 }, context: 128000 },
    { id: 'open-codestral-mamba', name: 'Codestral Mamba', pricing: { input: 0.25, output: 0.25 }, context: 256000 },
  ];

  return models.map(m => ({
    id: m.id,
    name: m.name,
    type: 'chat',
    description: `Mistral ${m.name}`,
    pricing: m.pricing,
    context_window: m.context,
    max_output: 8192,
    status: 'active' as const,
    features: { streaming: true, functionCall: true, vision: m.id.includes('pixtral'), audio: false },
  }));
}

function getMistralPricing(modelId: string): { input: number; output: number } {
  const pricing: Record<string, { input: number; output: number }> = {
    'mistral-large': { input: 2, output: 6 },
    'mistral-small': { input: 0.2, output: 0.6 },
    'codestral': { input: 0.3, output: 0.9 },
    'pixtral': { input: 0.15, output: 0.15 },
  };
  
  for (const [key, price] of Object.entries(pricing)) {
    if (modelId.includes(key)) return price;
  }
  return { input: 0.2, output: 0.6 };
}

/**
 * 豆包适配器
 */
const doubaoAdapter: ProviderAdapter = {
  id: 'doubao',
  name: '豆包',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'doubao-pro-256k', name: '豆包 Pro 256K', pricing: { input: 0.05, output: 0.05 }, context: 256000, maxOutput: 4096 },
      { id: 'doubao-pro-128k', name: '豆包 Pro 128K', pricing: { input: 0.05, output: 0.05 }, context: 128000, maxOutput: 4096 },
      { id: 'doubao-pro-32k', name: '豆包 Pro 32K', pricing: { input: 0.04, output: 0.04 }, context: 32000, maxOutput: 4096 },
      { id: 'doubao-lite-128k', name: '豆包 Lite 128K', pricing: { input: 0.003, output: 0.003 }, context: 128000, maxOutput: 4096 },
      { id: 'doubao-lite-32k', name: '豆包 Lite 32K', pricing: { input: 0.003, output: 0.003 }, context: 32000, maxOutput: 4096 },
      { id: 'doubao-lite-4k', name: '豆包 Lite 4K', pricing: { input: 0.003, output: 0.003 }, context: 4096, maxOutput: 4096 },
      { id: 'doubao-vision-pro-32k', name: '豆包 Vision Pro', pricing: { input: 0.08, output: 0.08 }, context: 32000, maxOutput: 4096 },
      { id: 'doubao-vision-lite-32k', name: '豆包 Vision Lite', pricing: { input: 0.01, output: 0.01 }, context: 32000, maxOutput: 4096 },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `字节豆包 ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: m.maxOutput,
      status: 'active' as const,
      features: { streaming: true, functionCall: true, vision: m.id.includes('vision'), audio: false },
    }));
  },
};

/**
 * 通义千问适配器
 */
const qwenAdapter: ProviderAdapter = {
  id: 'qwen',
  name: '通义千问',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'qwen-max', name: '通义千问 Max', pricing: { input: 2, output: 6 }, context: 32768, maxOutput: 8192 },
      { id: 'qwen-max-longcontext', name: '通义千问 Max 长上下文', pricing: { input: 2, output: 6 }, context: 28000, maxOutput: 8192 },
      { id: 'qwen-plus', name: '通义千问 Plus', pricing: { input: 0.4, output: 1.2 }, context: 128000, maxOutput: 6144 },
      { id: 'qwen-turbo', name: '通义千问 Turbo', pricing: { input: 0.3, output: 0.6 }, context: 128000, maxOutput: 6144 },
      { id: 'qwen-long', name: '通义千问 Long', pricing: { input: 0.5, output: 1 }, context: 10000000, maxOutput: 6144 },
      { id: 'qwen-vl-max', name: '通义千问 VL Max', pricing: { input: 2, output: 6 }, context: 32768, maxOutput: 8192, vision: true },
      { id: 'qwen-vl-plus', name: '通义千问 VL Plus', pricing: { input: 0.8, output: 0.8 }, context: 32768, maxOutput: 8192, vision: true },
      { id: 'qwen-audio-turbo', name: '通义千问 Audio', pricing: { input: 0.4, output: 0.4 }, context: 8192, maxOutput: 2048, audio: true },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `阿里 ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: m.maxOutput,
      status: 'active' as const,
      features: { streaming: true, functionCall: true, vision: m.vision, audio: m.audio },
    }));
  },
};

/**
 * 智谱AI适配器
 */
const zhipuAdapter: ProviderAdapter = {
  id: 'zhipu',
  name: '智谱AI',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'glm-4-plus', name: 'GLM-4 Plus', pricing: { input: 0.05, output: 0.05 }, context: 128000, maxOutput: 4096 },
      { id: 'glm-4-0520', name: 'GLM-4', pricing: { input: 0.1, output: 0.1 }, context: 128000, maxOutput: 4096 },
      { id: 'glm-4-air', name: 'GLM-4 Air', pricing: { input: 0.001, output: 0.001 }, context: 128000, maxOutput: 4096 },
      { id: 'glm-4-airx', name: 'GLM-4 AirX', pricing: { input: 0.01, output: 0.01 }, context: 8192, maxOutput: 4096 },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', pricing: { input: 0, output: 0 }, context: 128000, maxOutput: 4096 },
      { id: 'glm-4-long', name: 'GLM-4 Long', pricing: { input: 0.001, output: 0.001 }, context: 1000000, maxOutput: 4096 },
      { id: 'glm-4v-plus', name: 'GLM-4V Plus', pricing: { input: 0.01, output: 0.01 }, context: 8192, maxOutput: 4096, vision: true },
      { id: 'glm-4v', name: 'GLM-4V', pricing: { input: 0.05, output: 0.05 }, context: 8192, maxOutput: 4096, vision: true },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `智谱 ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: m.maxOutput,
      status: 'active' as const,
      features: { streaming: true, functionCall: true, vision: m.vision, audio: false },
    }));
  },
};

/**
 * Moonshot 适配器
 */
const moonshotAdapter: ProviderAdapter = {
  id: 'moonshot',
  name: 'Moonshot',
  fetchModels: async (baseUrl: string, apiKey: string): Promise<ProviderModel[]> => {
    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        return getPredefinedMoonshotModels();
      }

      const data = await response.json() as { data?: Array<{ id: string }> };
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((m) => ({
          id: m.id,
          name: formatModelName(m.id),
          type: 'chat',
          description: `Moonshot ${formatModelName(m.id)}`,
          pricing: getMoonshotPricing(m.id),
          context_window: getMoonshotContext(m.id),
          max_output: 4096,
          status: 'active' as const,
          features: { streaming: true, functionCall: true, vision: false, audio: false },
        }));
      }
      return getPredefinedMoonshotModels();
    } catch {
      return getPredefinedMoonshotModels();
    }
  },
};

function getPredefinedMoonshotModels(): ProviderModel[] {
  const models = [
    { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', pricing: { input: 0.12, output: 0.12 }, context: 8192 },
    { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', pricing: { input: 0.24, output: 0.24 }, context: 32768 },
    { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', pricing: { input: 0.6, output: 0.6 }, context: 131072 },
  ];

  return models.map(m => ({
    id: m.id,
    name: m.name,
    type: 'chat',
    description: `Moonshot ${m.name}`,
    pricing: m.pricing,
    context_window: m.context,
    max_output: 4096,
    status: 'active' as const,
    features: { streaming: true, functionCall: true, vision: false, audio: false },
  }));
}

function getMoonshotPricing(modelId: string): { input: number; output: number } {
  if (modelId.includes('128k')) return { input: 0.6, output: 0.6 };
  if (modelId.includes('32k')) return { input: 0.24, output: 0.24 };
  return { input: 0.12, output: 0.12 };
}

function getMoonshotContext(modelId: string): number {
  if (modelId.includes('128k')) return 131072;
  if (modelId.includes('32k')) return 32768;
  return 8192;
}

/**
 * 百川适配器
 */
const baichuanAdapter: ProviderAdapter = {
  id: 'baichuan',
  name: '百川智能',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'Baichuan4', name: 'Baichuan4', pricing: { input: 0.12, output: 0.12 }, context: 128000 },
      { id: 'Baichuan3-Turbo', name: 'Baichuan3 Turbo', pricing: { input: 0.008, output: 0.008 }, context: 32000 },
      { id: 'Baichuan3-Turbo-128k', name: 'Baichuan3 Turbo 128K', pricing: { input: 0.012, output: 0.012 }, context: 128000 },
      { id: 'Baichuan2-Turbo', name: 'Baichuan2 Turbo', pricing: { input: 0.004, output: 0.004 }, context: 32000 },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `百川 ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: 4096,
      status: 'active' as const,
      features: { streaming: true, functionCall: true, vision: false, audio: false },
    }));
  },
};

/**
 * 零一万物适配器
 */
const yiAdapter: ProviderAdapter = {
  id: 'yi',
  name: '零一万物',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'yi-lightning', name: 'Yi Lightning', pricing: { input: 0.01, output: 0.01 }, context: 16384 },
      { id: 'yi-large', name: 'Yi Large', pricing: { input: 0.2, output: 0.2 }, context: 32768 },
      { id: 'yi-large-turbo', name: 'Yi Large Turbo', pricing: { input: 0.12, output: 0.12 }, context: 16384 },
      { id: 'yi-medium', name: 'Yi Medium', pricing: { input: 0.025, output: 0.025 }, context: 16384 },
      { id: 'yi-medium-200k', name: 'Yi Medium 200K', pricing: { input: 0.06, output: 0.06 }, context: 200000 },
      { id: 'yi-spark', name: 'Yi Spark', pricing: { input: 0.006, output: 0.006 }, context: 16384 },
      { id: 'yi-vision', name: 'Yi Vision', pricing: { input: 0.06, output: 0.06 }, context: 16384, vision: true },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `零一万物 ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: 4096,
      status: 'active' as const,
      features: { streaming: true, functionCall: true, vision: m.vision, audio: false },
    }));
  },
};

/**
 * MiniMax 适配器
 */
const minimaxAdapter: ProviderAdapter = {
  id: 'minimax',
  name: 'MiniMax',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'abab6.5s-chat', name: 'ABAB 6.5S', pricing: { input: 0.01, output: 0.01 }, context: 245000 },
      { id: 'abab6.5g-chat', name: 'ABAB 6.5G', pricing: { input: 0.06, output: 0.06 }, context: 245000 },
      { id: 'abab6.5t-chat', name: 'ABAB 6.5T', pricing: { input: 0.015, output: 0.015 }, context: 8192 },
      { id: 'abab5.5-chat', name: 'ABAB 5.5', pricing: { input: 0.03, output: 0.03 }, context: 16384 },
      { id: 'abab5.5s-chat', name: 'ABAB 5.5S', pricing: { input: 0.005, output: 0.005 }, context: 8192 },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `MiniMax ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: 4096,
      status: 'active' as const,
      features: { streaming: true, functionCall: true, vision: false, audio: false },
    }));
  },
};

/**
 * 讯飞星火适配器
 */
const sparkAdapter: ProviderAdapter = {
  id: 'spark',
  name: '讯飞星火',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'spark-4.0-ultra', name: '星火 4.0 Ultra', pricing: { input: 0.06, output: 0.06 }, context: 128000 },
      { id: 'spark-4.0-1206', name: '星火 4.0', pricing: { input: 0.04, output: 0.04 }, context: 128000 },
      { id: 'spark-3.5-max-0405', name: '星火 3.5 Max', pricing: { input: 0.03, output: 0.03 }, context: 8192 },
      { id: 'spark-3.5-32k', name: '星火 3.5 32K', pricing: { input: 0.035, output: 0.035 }, context: 32768 },
      { id: 'spark-3.1-1206', name: '星火 3.1', pricing: { input: 0.012, output: 0.012 }, context: 8192 },
      { id: 'spark-3.1-32k', name: '星火 3.1 32K', pricing: { input: 0.016, output: 0.016 }, context: 32768 },
      { id: 'spark-2.1-1206', name: '星火 2.1', pricing: { input: 0.018, output: 0.018 }, context: 8192 },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      description: `讯飞 ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: 4096,
      status: 'active' as const,
      features: { streaming: true, functionCall: true, vision: false, audio: false },
    }));
  },
};

/**
 * Cohere 适配器
 */
const cohereAdapter: ProviderAdapter = {
  id: 'cohere',
  name: 'Cohere',
  fetchModels: async (): Promise<ProviderModel[]> => {
    const models = [
      { id: 'command-r-plus', name: 'Command R+', pricing: { input: 0.03, output: 0.15 }, context: 128000 },
      { id: 'command-r', name: 'Command R', pricing: { input: 0.015, output: 0.075 }, context: 128000 },
      { id: 'command', name: 'Command', pricing: { input: 0.03, output: 0.06 }, context: 4096 },
      { id: 'command-light', name: 'Command Light', pricing: { input: 0.006, output: 0.006 }, context: 4096 },
      { id: 'embed-english-v3.0', name: 'Embed English V3', pricing: { input: 0.01, output: 0 }, context: 512, embedding: true },
      { id: 'embed-multilingual-v3.0', name: 'Embed Multilingual V3', pricing: { input: 0.01, output: 0 }, context: 512, embedding: true },
    ];

    return models.map(m => ({
      id: m.id,
      name: m.name,
      type: m.embedding ? 'embedding' : 'chat',
      description: `Cohere ${m.name}`,
      pricing: m.pricing,
      context_window: m.context,
      max_output: 4096,
      status: 'active' as const,
      features: { streaming: !m.embedding, functionCall: !m.embedding, vision: false, audio: false },
    }));
  },
};

/**
 * 通用 OpenAI 兼容适配器
 */
const openaiCompatibleAdapter: ProviderAdapter = {
  id: 'openai-compatible',
  name: 'OpenAI Compatible',
  fetchModels: async (baseUrl: string, apiKey: string): Promise<ProviderModel[]> => {
    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as { data?: Array<{ id: string }> };
      
      if (data.data && Array.isArray(data.data)) {
        return data.data
          .filter((m) => {
            const id = m.id.toLowerCase();
            return !id.includes('embedding') && 
                   !id.includes('moderation') &&
                   !id.includes('davinci') &&
                   !id.includes('babbage');
          })
          .map((m) => ({
            id: m.id,
            name: formatModelName(m.id),
            type: 'chat',
            description: formatModelName(m.id),
            pricing: { input: 0, output: 0 },
            context_window: 4096,
            max_output: 2048,
            status: 'active' as const,
            features: { streaming: true, functionCall: false, vision: false, audio: false },
          }));
      }
      return [];
    } catch {
      return [];
    }
  },
};

// ==================== 适配器注册表 ====================

const ADAPTERS: Record<string, ProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  deepseek: deepseekAdapter,
  groq: groqAdapter,
  mistral: mistralAdapter,
  doubao: doubaoAdapter,
  qwen: qwenAdapter,
  zhipu: zhipuAdapter,
  moonshot: moonshotAdapter,
  baichuan: baichuanAdapter,
  yi: yiAdapter,
  minimax: minimaxAdapter,
  spark: sparkAdapter,
  cohere: cohereAdapter,
};

// ==================== 模型同步服务 ====================

export class ModelSyncService {
  private syncStatus: Map<string, SyncStatus> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6小时同步一次

  /**
   * 初始化定时同步
   */
  startAutoSync(): void {
    console.log('[ModelSync] Starting auto sync service...');
    
    // 立即执行一次同步
    this.syncAllProviders().catch(err => {
      console.error('[ModelSync] Initial sync error:', err);
    });

    // 设置定时同步
    this.syncInterval = setInterval(() => {
      this.syncAllProviders().catch(err => {
        console.error('[ModelSync] Auto sync error:', err);
      });
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * 停止定时同步
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 同步单个厂商的模型
   */
  async syncProviderModels(providerId: string): Promise<SyncResult> {
    const startTime = Date.now();
    const provider = MODEL_PROVIDERS[providerId];
    
    const result: SyncResult = {
      provider: providerId,
      providerName: provider?.name || providerId,
      success: false,
      totalModels: 0,
      modelsAdded: 0,
      modelsUpdated: 0,
      modelsDeactivated: 0,
      priceChanges: [],
      newModels: [],
      duration: 0,
    };

    try {
      // 更新同步状态
      this.syncStatus.set(providerId, {
        provider: providerId,
        providerName: provider?.name || providerId,
        lastSync: null,
        status: 'syncing',
        totalModels: 0,
        modelsAdded: 0,
        modelsUpdated: 0,
        modelsDeactivated: 0,
      });

      // 获取厂商 API 密钥
      const apiKey = getProviderApiKey(providerId);
      if (!apiKey) {
        this.syncStatus.set(providerId, {
          provider: providerId,
          providerName: provider?.name || providerId,
          lastSync: null,
          status: 'not_configured',
          totalModels: 0,
          modelsAdded: 0,
          modelsUpdated: 0,
          modelsDeactivated: 0,
        });
        result.error = 'API key not configured';
        return result;
      }

      // 获取适配器
      const adapter = ADAPTERS[providerId] || openaiCompatibleAdapter;
      
      // 获取厂商模型列表
      const providerModels = await adapter.fetchModels(provider.baseUrl, apiKey);
      result.totalModels = providerModels.length;
      
      // 获取数据库中该厂商的现有模型
      const { data: existingModels, error: dbError } = await client
        .from('ai_models')
        .select('*')
        .eq('provider', providerId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      const existingMap = new Map(existingModels?.map(m => [m.code, m]) || []);
      const providerModelCodes = new Set(providerModels.map(m => m.id));

      // 处理每个厂商模型
      for (const pm of providerModels) {
        const existing = existingMap.get(pm.id);
        
        // 计算价格（美元/百万tokens → 厘/千tokens）
        // 1美元 ≈ 7.2元，1元 = 1000厘
        const costInputPrice = Math.round(pm.pricing.input * 7.2 * 1000 / 1000); // 厘/千tokens
        const costOutputPrice = Math.round(pm.pricing.output * 7.2 * 1000 / 1000);
        
        // 根据模型类型确定加价比例
        const category = this.mapModelCategory(pm.type);
        const platformMarkup = MARKUP_BY_CATEGORY[category] || DEFAULT_PLATFORM_MARKUP;
        
        // 计算平台售价
        const sellInputPrice = Math.max(1, Math.round(costInputPrice * (1 + platformMarkup)));
        const sellOutputPrice = Math.max(1, Math.round(costOutputPrice * (1 + platformMarkup)));

        if (existing) {
          // 检查是否需要更新
          const priceChanged = 
            existing.cost_input_price !== costInputPrice ||
            existing.cost_output_price !== costOutputPrice;

          if (priceChanged && costInputPrice > 0) {
            // 记录价格变更
            result.priceChanges.push({
              model: pm.name,
              oldPrice: { 
                input: existing.cost_input_price || 0, 
                output: existing.cost_output_price || 0 
              },
              newPrice: { input: costInputPrice, output: costOutputPrice },
            });

            // 更新价格
            const { error: updateError } = await client
              .from('ai_models')
              .update({
                cost_input_price: costInputPrice,
                cost_output_price: costOutputPrice,
                sell_input_price: sellInputPrice,
                sell_output_price: sellOutputPrice,
                platform_markup: platformMarkup,
                updated_at: new Date().toISOString(),
              })
              .eq('code', pm.id);

            if (!updateError) {
              result.modelsUpdated++;
            }
          }

          // 如果模型之前被下线，现在重新上线
          if (existing.status === 'inactive' && pm.status === 'active') {
            await client
              .from('ai_models')
              .update({ status: 'active', updated_at: new Date().toISOString() })
              .eq('code', pm.id);
            result.modelsAdded++;
          }

          // 更新模型信息（名称、描述等）
          if (pm.name !== existing.name || pm.context_window !== existing.max_context_tokens) {
            await client
              .from('ai_models')
              .update({
                name: pm.name,
                description: pm.description || existing.description,
                max_context_tokens: pm.context_window || existing.max_context_tokens,
                max_output_tokens: pm.max_output || existing.max_output_tokens,
                updated_at: new Date().toISOString(),
              })
              .eq('code', pm.id);
          }
        } else {
          // 新增模型
          const { error: insertError } = await client
            .from('ai_models')
            .insert({
              id: crypto.randomUUID(),
              code: pm.id,
              name: pm.name,
              provider: providerId,
              category: category,
              type: pm.type,
              description: pm.description || `${provider?.name || providerId} ${pm.name}`,
              cost_input_price: costInputPrice,
              cost_output_price: costOutputPrice,
              sell_input_price: sellInputPrice,
              sell_output_price: sellOutputPrice,
              platform_markup: platformMarkup,
              max_context_tokens: pm.context_window || 4096,
              max_output_tokens: pm.max_output || 2048,
              status: 'active',
              is_public: true,
              sort_order: 999,
              tags: this.getModelTags(pm, costInputPrice === 0),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (!insertError) {
            result.modelsAdded++;
            result.newModels.push(pm.name);
          }
        }
      }

      // 检查需要下线的模型（厂商已删除的模型）
      for (const [code, model] of existingMap) {
        if (!providerModelCodes.has(code) && model.status === 'active') {
          const { error: deactivateError } = await client
            .from('ai_models')
            .update({ 
              status: 'inactive', 
              updated_at: new Date().toISOString() 
            })
            .eq('code', code);

          if (!deactivateError) {
            result.modelsDeactivated++;
          }
        }
      }

      // 记录同步日志
      await this.logSync(providerId, 'success', result);

      result.duration = Date.now() - startTime;
      result.success = true;

      // 更新同步状态
      this.syncStatus.set(providerId, {
        provider: providerId,
        providerName: provider?.name || providerId,
        lastSync: new Date(),
        status: 'idle',
        totalModels: result.totalModels,
        modelsAdded: result.modelsAdded,
        modelsUpdated: result.modelsUpdated,
        modelsDeactivated: result.modelsDeactivated,
        lastDuration: result.duration,
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 记录错误日志
      await this.logSync(providerId, 'error', { error: errorMessage });

      result.error = errorMessage;
      result.duration = Date.now() - startTime;

      // 更新同步状态
      this.syncStatus.set(providerId, {
        provider: providerId,
        providerName: provider?.name || providerId,
        lastSync: null,
        status: 'error',
        error: errorMessage,
        totalModels: 0,
        modelsAdded: 0,
        modelsUpdated: 0,
        modelsDeactivated: 0,
        lastDuration: result.duration,
      });

      return result;
    }
  }

  /**
   * 同步所有厂商模型
   */
  async syncAllProviders(): Promise<SyncResult[]> {
    console.log('[ModelSync] Starting full sync for all providers...');
    const results: SyncResult[] = [];
    const providers = Object.keys(MODEL_PROVIDERS);

    for (const providerId of providers) {
      const result = await this.syncProviderModels(providerId);
      results.push(result);
      
      console.log(`[ModelSync] ${providerId}: Added ${result.modelsAdded}, Updated ${result.modelsUpdated}, Deactivated ${result.modelsDeactivated}`);
      
      // 每个厂商同步间隔 500ms，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      modelsAdded: results.reduce((sum, r) => sum + r.modelsAdded, 0),
      modelsUpdated: results.reduce((sum, r) => sum + r.modelsUpdated, 0),
      modelsDeactivated: results.reduce((sum, r) => sum + r.modelsDeactivated, 0),
    };

    console.log('[ModelSync] Full sync completed:', summary);

    return results;
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus[] {
    // 确保所有厂商都有状态
    const statuses: SyncStatus[] = [];
    
    for (const [providerId, provider] of Object.entries(MODEL_PROVIDERS)) {
      const status = this.syncStatus.get(providerId) || {
        provider: providerId,
        providerName: provider.name,
        lastSync: null,
        status: 'idle' as const,
        totalModels: 0,
        modelsAdded: 0,
        modelsUpdated: 0,
        modelsDeactivated: 0,
      };
      statuses.push(status);
    }
    
    return statuses;
  }

  /**
   * 获取厂商统计
   */
  async getProviderStats(): Promise<Array<{
    provider: string;
    providerName: string;
    totalModels: number;
    activeModels: number;
    freeModels: number;
    categories: string[];
  }>> {
    const { data, error } = await client
      .from('ai_models')
      .select('provider, status, category, sell_input_price');

    if (error) {
      return [];
    }

    const stats = new Map<string, { total: number; active: number; free: number; categories: Set<string> }>();

    for (const model of data || []) {
      const existing = stats.get(model.provider) || { total: 0, active: 0, free: 0, categories: new Set() };
      existing.total++;
      if (model.status === 'active') existing.active++;
      if (model.sell_input_price === 0) existing.free++;
      existing.categories.add(model.category);
      stats.set(model.provider, existing);
    }

    return Array.from(stats.entries()).map(([provider, stat]) => ({
      provider,
      providerName: MODEL_PROVIDERS[provider]?.name || provider,
      totalModels: stat.total,
      activeModels: stat.active,
      freeModels: stat.free,
      categories: Array.from(stat.categories),
    }));
  }

  /**
   * 记录同步日志
   */
  private async logSync(
    provider: string, 
    status: 'success' | 'error', 
    data: any
  ): Promise<void> {
    try {
      await client.from('model_sync_logs').insert({
        id: crypto.randomUUID(),
        provider,
        status,
        data: JSON.stringify(data),
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[ModelSync] Failed to log sync:', error);
    }
  }

  // ==================== 辅助方法 ====================

  private mapModelCategory(type: string): string {
    const categoryMap: Record<string, string> = {
      'chat': 'text',
      'completion': 'text',
      'image_gen': 'image',
      'image_edit': 'image',
      'audio_transcribe': 'audio',
      'audio_tts': 'audio',
      'video_gen': 'video',
      'embedding': 'embedding',
    };
    return categoryMap[type] || 'text';
  }

  private getModelTags(model: ProviderModel, isFree: boolean): string[] {
    const tags: string[] = [];
    
    if (isFree) tags.push('免费');
    if (model.context_window && model.context_window >= 100000) tags.push('长上下文');
    if (model.features?.vision) tags.push('多模态');
    if (model.features?.audio) tags.push('音频');
    
    return tags;
  }
}

// ==================== 辅助函数 ====================

function formatModelName(modelId: string): string {
  return modelId
    .split(/[-_.]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getModelType(modelId: string): string {
  const id = modelId.toLowerCase();
  if (id.includes('whisper')) return 'audio_transcribe';
  if (id.includes('tts')) return 'audio_tts';
  if (id.includes('dall') || id.includes('stable') || id.includes('image')) return 'image_gen';
  if (id.includes('embed')) return 'embedding';
  return 'chat';
}

// 导出单例
export const modelSyncService = new ModelSyncService();
