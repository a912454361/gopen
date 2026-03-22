/**
 * AI 模型服务 - 统一适配层
 * 统一对接所有模型公司的 API
 */

import { 
  MODEL_PROVIDERS, 
  AVAILABLE_MODELS, 
  getProviderApiKey, 
  type ModelConfig,
  type ModelProvider,
} from '../config/model-providers.js';

// ==================== 类型定义 ====================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: ToolDefinition[];
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamChunk {
  id: string;
  model: string;
  content: string;
  finishReason?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

// ==================== 模型适配器基类 ====================

export abstract class ModelAdapter {
  abstract provider: string;
  abstract baseUrl: string;
  
  abstract chat(request: ChatRequest): Promise<ChatResponse>;
  abstract chatStream(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void>;
  
  abstract imageGeneration(prompt: string, options?: any): Promise<any>;
  abstract audioTranscription(audioUrl: string, options?: any): Promise<any>;
  abstract textToSpeech(text: string, options?: any): Promise<any>;
}

// ==================== OpenAI 兼容适配器 ====================

export class OpenAICompatibleAdapter extends ModelAdapter {
  provider: string;
  baseUrl: string;
  apiKey: string;
  
  constructor(providerId: string) {
    super();
    const provider = MODEL_PROVIDERS[providerId];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }
    
    this.provider = providerId;
    this.baseUrl = provider.baseUrl;
    this.apiKey = getProviderApiKey(providerId) || '';
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        stream: false,
        tools: request.tools,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json() as any;
    
    return {
      id: data.id,
      model: data.model,
      content: data.choices[0].message.content,
      finishReason: data.choices[0].finish_reason,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
  
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
          stream: true,
          tools: request.tools,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }
            
            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                onChunk({
                  id: json.id,
                  model: json.model,
                  content,
                  finishReason: json.choices?.[0]?.finish_reason,
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  async imageGeneration(prompt: string, options?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: options?.model || 'dall-e-3',
        prompt,
        size: options?.size || '1024x1024',
        n: options?.n || 1,
        quality: options?.quality || 'standard',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`);
    }
    
    return await response.json();
  }
  
  async audioTranscription(audioUrl: string, options?: any): Promise<any> {
    // 先下载音频
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), 'audio.mp3');
    formData.append('model', options?.model || 'whisper-1');
    
    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.status}`);
    }
    
    return await response.json();
  }
  
  async textToSpeech(text: string, options?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: options?.model || 'tts-1',
        input: text,
        voice: options?.voice || 'alloy',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`TTS failed: ${response.status}`);
    }
    
    return await response.arrayBuffer();
  }
  
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }
}

// ==================== Anthropic 适配器 ====================

export class AnthropicAdapter extends ModelAdapter {
  provider = 'anthropic';
  baseUrl = 'https://api.anthropic.com/v1';
  apiKey: string;
  
  constructor() {
    super();
    this.apiKey = getProviderApiKey('anthropic') || '';
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // 提取 system 消息
    const systemMessage = request.messages.find(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');
    
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: request.maxTokens ?? 4096,
        stream: false,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json() as any;
    
    return {
      id: data.id,
      model: data.model,
      content: data.content[0].text,
      finishReason: data.stop_reason,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }
  
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const systemMessage = request.messages.find(m => m.role === 'system');
      const otherMessages = request.messages.filter(m => m.role !== 'system');
      
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: request.model,
          system: systemMessage?.content,
          messages: otherMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: request.maxTokens ?? 4096,
          stream: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const json = JSON.parse(data);
              
              if (json.type === 'content_block_delta') {
                const content = json.delta?.text || '';
                if (content) {
                  onChunk({
                    id: json.id || '',
                    model: request.model,
                    content,
                  });
                }
              } else if (json.type === 'message_stop') {
                onComplete();
                return;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  async imageGeneration(prompt: string, options?: any): Promise<any> {
    throw new Error('Anthropic does not support image generation');
  }
  
  async audioTranscription(audioUrl: string, options?: any): Promise<any> {
    throw new Error('Anthropic does not support audio transcription');
  }
  
  async textToSpeech(text: string, options?: any): Promise<any> {
    throw new Error('Anthropic does not support text-to-speech');
  }
}

// ==================== Google AI 适配器 ====================

export class GoogleAIAdapter extends ModelAdapter {
  provider = 'google';
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  apiKey: string;
  
  constructor() {
    super();
    this.apiKey = getProviderApiKey('google') || '';
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(
      `${this.baseUrl}/models/${request.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: request.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens ?? 4096,
          },
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI error: ${response.status} - ${error}`);
    }
    
    const data = await response.json() as any;
    
    return {
      id: Date.now().toString(),
      model: request.model,
      content: data.candidates[0].content.parts[0].text,
      finishReason: data.candidates[0].finishReason,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
    };
  }
  
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/models/${request.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: request.messages
              .filter(m => m.role !== 'system')
              .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
              })),
            generationConfig: {
              temperature: request.temperature ?? 0.7,
              maxOutputTokens: request.maxTokens ?? 4096,
            },
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Google AI error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const json = JSON.parse(data);
              const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                onChunk({
                  id: '',
                  model: request.model,
                  content,
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  async imageGeneration(prompt: string, options?: any): Promise<any> {
    // Google Imagen
    const response = await fetch(
      `${this.baseUrl}/models/imagen:predict?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: { text: prompt },
          sampleCount: options?.n || 1,
        }),
      }
    );
    
    return await response.json();
  }
  
  async audioTranscription(audioUrl: string, options?: any): Promise<any> {
    throw new Error('Use Google Cloud Speech-to-Text API');
  }
  
  async textToSpeech(text: string, options?: any): Promise<any> {
    throw new Error('Use Google Cloud Text-to-Speech API');
  }
}

// ==================== 智谱 AI 适配器 ====================

export class ZhipuAdapter extends OpenAICompatibleAdapter {
  constructor() {
    super('zhipu');
  }
  
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }
}

// ==================== 通义千问适配器 ====================

export class QwenAdapter extends ModelAdapter {
  provider = 'qwen';
  baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
  apiKey: string;
  
  constructor() {
    super();
    this.apiKey = getProviderApiKey('qwen') || '';
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        input: {
          messages: request.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
        parameters: {
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qwen API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json() as any;
    
    return {
      id: data.request_id,
      model: request.model,
      content: data.output.choices[0].message.content,
      finishReason: data.output.choices[0].finish_reason,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
  
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/services/aigc/text-generation/generation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'X-DashScope-SSE': 'enable',
          },
          body: JSON.stringify({
            model: request.model,
            input: {
              messages: request.messages.map(m => ({
                role: m.role,
                content: m.content,
              })),
            },
            parameters: {
              temperature: request.temperature ?? 0.7,
              max_tokens: request.maxTokens ?? 4096,
              incremental_output: true,
            },
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Qwen API error: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            
            try {
              const json = JSON.parse(data);
              const content = json.output?.choices?.[0]?.message?.content || '';
              if (content) {
                onChunk({
                  id: json.request_id || '',
                  model: request.model,
                  content,
                  finishReason: json.output?.choices?.[0]?.finish_reason,
                });
              }
              
              if (json.output?.finish_reason === 'stop') {
                onComplete();
                return;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  async imageGeneration(prompt: string, options?: any): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/services/aigc/text2image/image-synthesis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: 'wanx-v1',
          input: { prompt },
          parameters: {
            size: options?.size || '1024*1024',
            n: options?.n || 1,
          },
        }),
      }
    );
    
    return await response.json();
  }
  
  async audioTranscription(audioUrl: string, options?: any): Promise<any> {
    throw new Error('Qwen audio transcription not implemented');
  }
  
  async textToSpeech(text: string, options?: any): Promise<any> {
    throw new Error('Qwen TTS not implemented');
  }
}

// ==================== 文心一言适配器 ====================

export class WenxinAdapter extends ModelAdapter {
  provider = 'wenxin';
  baseUrl = 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop';
  apiKey: string;
  secretKey: string;
  
  constructor() {
    super();
    const keys = (getProviderApiKey('wenxin') || '').split(':');
    this.apiKey = keys[0] || '';
    this.secretKey = keys[1] || '';
  }
  
  private async getAccessToken(): Promise<string> {
    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`
    );
    const data = await response.json() as any;
    return data.access_token;
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(
      `${this.baseUrl}/chat/${request.model}?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: request.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: request.temperature ?? 0.7,
          max_output_tokens: request.maxTokens ?? 4096,
        }),
      }
    );
    
    const data = await response.json() as any;
    
    return {
      id: data.id || Date.now().toString(),
      model: request.model,
      content: data.result,
      finishReason: data.finish_reason,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
  
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `${this.baseUrl}/chat/${request.model}?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: request.messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            temperature: request.temperature ?? 0.7,
            max_output_tokens: request.maxTokens ?? 4096,
            stream: true,
          }),
        }
      );
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const json = JSON.parse(data);
              const content = json.result || '';
              if (content) {
                onChunk({
                  id: '',
                  model: request.model,
                  content,
                  finishReason: json.finish_reason,
                });
              }
              
              if (json.finish_reason === 'stop') {
                onComplete();
                return;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  async imageGeneration(prompt: string, options?: any): Promise<any> {
    throw new Error('Wenxin image generation not implemented');
  }
  
  async audioTranscription(audioUrl: string, options?: any): Promise<any> {
    throw new Error('Wenxin audio transcription not implemented');
  }
  
  async textToSpeech(text: string, options?: any): Promise<any> {
    throw new Error('Wenxin TTS not implemented');
  }
}

// ==================== 模型服务工厂 ====================

export class ModelService {
  private static adapters: Map<string, ModelAdapter> = new Map();
  
  static getAdapter(providerId: string): ModelAdapter {
    if (this.adapters.has(providerId)) {
      return this.adapters.get(providerId)!;
    }
    
    let adapter: ModelAdapter;
    
    switch (providerId) {
      case 'anthropic':
        adapter = new AnthropicAdapter();
        break;
      case 'google':
        adapter = new GoogleAIAdapter();
        break;
      case 'zhipu':
        adapter = new ZhipuAdapter();
        break;
      case 'qwen':
        adapter = new QwenAdapter();
        break;
      case 'wenxin':
        adapter = new WenxinAdapter();
        break;
      default:
        // OpenAI 兼容格式
        adapter = new OpenAICompatibleAdapter(providerId);
    }
    
    this.adapters.set(providerId, adapter);
    return adapter;
  }
  
  static getChatModel(modelCode: string): { adapter: ModelAdapter; modelConfig: ModelConfig } | null {
    const modelConfig = AVAILABLE_MODELS.find((m: ModelConfig) => m.code === modelCode);
    if (!modelConfig) return null;
    
    const adapter = this.getAdapter(modelConfig.provider);
    return { adapter, modelConfig };
  }
  
  static async chat(request: ChatRequest): Promise<ChatResponse> {
    const result = this.getChatModel(request.model);
    if (!result) {
      throw new Error(`Unknown model: ${request.model}`);
    }
    
    return result.adapter.chat(request);
  }
  
  static async chatStream(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const result = this.getChatModel(request.model);
    if (!result) {
      throw new Error(`Unknown model: ${request.model}`);
    }
    
    return result.adapter.chatStream(request, onChunk, onComplete, onError);
  }
}

export default ModelService;
