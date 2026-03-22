/**
 * 模型同步服务
 * 自动对接所有商家模型，实时同步上线/下线和价格变更
 */

import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { MODEL_PROVIDERS, getProviderApiKey } from '../config/model-providers.js';

const client = getSupabaseClient();

// 同步状态
export interface SyncStatus {
  provider: string;
  lastSync: Date | null;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
  modelsAdded: number;
  modelsUpdated: number;
  modelsDeactivated: number;
}

// 商家模型信息
export interface ProviderModel {
  id: string;
  name: string;
  type: string;
  pricing: {
    input: number;
    output: number;
  };
  context_window?: number;
  max_output?: number;
  status: 'active' | 'deprecated';
}

// 同步结果
export interface SyncResult {
  provider: string;
  success: boolean;
  error?: string;
  modelsAdded: number;
  modelsUpdated: number;
  modelsDeactivated: number;
  priceChanges: Array<{
    model: string;
    oldPrice: { input: number; output: number };
    newPrice: { input: number; output: number };
  }>;
}

/**
 * 模型同步服务类
 */
export class ModelSyncService {
  private syncStatus: Map<string, SyncStatus> = new Map();

  /**
   * 同步单个商家的模型
   */
  async syncProviderModels(providerId: string): Promise<SyncResult> {
    const result: SyncResult = {
      provider: providerId,
      success: false,
      modelsAdded: 0,
      modelsUpdated: 0,
      modelsDeactivated: 0,
      priceChanges: [],
    };

    try {
      // 更新同步状态
      this.syncStatus.set(providerId, {
        provider: providerId,
        lastSync: null,
        status: 'syncing',
        modelsAdded: 0,
        modelsUpdated: 0,
        modelsDeactivated: 0,
      });

      // 获取商家API密钥
      const apiKey = getProviderApiKey(providerId);
      if (!apiKey) {
        throw new Error(`API key not found for provider: ${providerId}`);
      }

      // 获取商家模型列表
      const providerModels = await this.fetchProviderModels(providerId, apiKey);
      
      // 获取数据库中该商家的现有模型
      const { data: existingModels, error: dbError } = await client
        .from('ai_models')
        .select('*')
        .eq('provider', providerId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      const existingMap = new Map(existingModels?.map(m => [m.code, m]) || []);
      const providerModelCodes = new Set(providerModels.map(m => m.id));

      // 处理每个商家模型
      for (const pm of providerModels) {
        const existing = existingMap.get(pm.id);
        
        // 计算平台价格（成本价 + 20%抽成）
        const costInputPrice = Math.round(pm.pricing.input * 1000); // 转换为厘/百万tokens
        const costOutputPrice = Math.round(pm.pricing.output * 1000);
        const platformMarkup = 0.20;
        const sellInputPrice = Math.round(costInputPrice * (1 + platformMarkup));
        const sellOutputPrice = Math.round(costOutputPrice * (1 + platformMarkup));

        if (existing) {
          // 检查是否需要更新
          const priceChanged = 
            existing.cost_input_price !== costInputPrice ||
            existing.cost_output_price !== costOutputPrice;

          if (priceChanged) {
            // 记录价格变更
            result.priceChanges.push({
              model: pm.name,
              oldPrice: { 
                input: existing.cost_input_price, 
                output: existing.cost_output_price 
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
              category: this.mapModelType(pm.type),
              type: pm.type,
              description: `${pm.name} - ${MODEL_PROVIDERS[providerId]?.name || providerId}`,
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
              tags: this.getModelTags(pm),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (!insertError) {
            result.modelsAdded++;
          }
        }
      }

      // 检查需要下线的模型（商家已删除的模型）
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

      // 更新同步状态
      this.syncStatus.set(providerId, {
        provider: providerId,
        lastSync: new Date(),
        status: 'idle',
        modelsAdded: result.modelsAdded,
        modelsUpdated: result.modelsUpdated,
        modelsDeactivated: result.modelsDeactivated,
      });

      result.success = true;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 记录错误日志
      await this.logSync(providerId, 'error', { error: errorMessage });

      // 更新同步状态
      this.syncStatus.set(providerId, {
        provider: providerId,
        lastSync: null,
        status: 'error',
        error: errorMessage,
        modelsAdded: 0,
        modelsUpdated: 0,
        modelsDeactivated: 0,
      });

      result.error = errorMessage;
      return result;
    }
  }

  /**
   * 同步所有商家模型
   */
  async syncAllProviders(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const providers = Object.keys(MODEL_PROVIDERS);

    for (const providerId of providers) {
      const result = await this.syncProviderModels(providerId);
      results.push(result);
      
      // 每个商家同步间隔1秒，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus[] {
    return Array.from(this.syncStatus.values());
  }

  /**
   * 从商家API获取模型列表
   */
  private async fetchProviderModels(
    providerId: string, 
    apiKey: string
  ): Promise<ProviderModel[]> {
    const provider = MODEL_PROVIDERS[providerId];
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    // 根据不同商家使用不同的API格式
    switch (providerId) {
      case 'openai':
        return this.fetchOpenAIModels(provider.baseUrl, apiKey);
      case 'anthropic':
        return this.fetchAnthropicModels(provider.baseUrl, apiKey);
      case 'google':
        return this.fetchGoogleModels(provider.baseUrl, apiKey);
      case 'deepseek':
        return this.fetchDeepSeekModels(provider.baseUrl, apiKey);
      case 'groq':
        return this.fetchGroqModels(provider.baseUrl, apiKey);
      default:
        // 通用OpenAI兼容格式
        return this.fetchOpenAICompatibleModels(provider.baseUrl, apiKey);
    }
  }

  /**
   * OpenAI 模型获取
   */
  private async fetchOpenAIModels(
    baseUrl: string, 
    apiKey: string
  ): Promise<ProviderModel[]> {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as { data: Array<{ id: string }> };
    
    // 过滤和映射模型
    const models: ProviderModel[] = data.data
      .filter((m) => this.isChatModel(m.id))
      .map((m) => ({
        id: m.id,
        name: this.formatModelName(m.id),
        type: this.getModelCategory(m.id),
        pricing: this.getOpenAIPricing(m.id),
        context_window: this.getContextWindow(m.id),
        max_output: this.getMaxOutput(m.id),
        status: 'active' as const,
      }));

    return models;
  }

  /**
   * Anthropic 模型获取
   */
  private async fetchAnthropicModels(
    baseUrl: string, 
    apiKey: string
  ): Promise<ProviderModel[]> {
    // Anthropic 没有公开的模型列表API，使用预定义列表
    const anthropicModels = [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', pricing: { input: 3, output: 15 } },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', pricing: { input: 15, output: 75 } },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', pricing: { input: 0.25, output: 1.25 } },
    ];

    return anthropicModels.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      pricing: m.pricing,
      context_window: 200000,
      max_output: 8192,
      status: 'active' as const,
    }));
  }

  /**
   * Google 模型获取
   */
  private async fetchGoogleModels(
    baseUrl: string, 
    apiKey: string
  ): Promise<ProviderModel[]> {
    // Google Gemini 模型列表
    const googleModels = [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', pricing: { input: 0, output: 0 } },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', pricing: { input: 1.75, output: 7 } },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', pricing: { input: 0.35, output: 1.05 } },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', pricing: { input: 0, output: 0 } },
    ];

    return googleModels.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      pricing: m.pricing,
      context_window: 1000000,
      max_output: 8192,
      status: 'active' as const,
    }));
  }

  /**
   * DeepSeek 模型获取
   */
  private async fetchDeepSeekModels(
    baseUrl: string, 
    apiKey: string
  ): Promise<ProviderModel[]> {
    const deepseekModels = [
      { id: 'deepseek-chat', name: 'DeepSeek V3', pricing: { input: 0, output: 0 } },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', pricing: { input: 0.55, output: 2.2 } },
    ];

    return deepseekModels.map(m => ({
      id: m.id,
      name: m.name,
      type: 'chat',
      pricing: m.pricing,
      context_window: 64000,
      max_output: 8192,
      status: 'active' as const,
    }));
  }

  /**
   * Groq 模型获取
   */
  private async fetchGroqModels(
    baseUrl: string, 
    apiKey: string
  ): Promise<ProviderModel[]> {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json() as { data: Array<{ id: string }> };
    
    const models: ProviderModel[] = data.data
      .filter((m) => this.isChatModel(m.id))
      .map((m) => ({
        id: m.id,
        name: this.formatModelName(m.id),
        type: 'chat',
        pricing: { input: 0, output: 0 }, // Groq 免费模型
        context_window: this.getContextWindow(m.id),
        max_output: 8192,
        status: 'active' as const,
      }));

    return models;
  }

  /**
   * OpenAI 兼容格式模型获取
   */
  private async fetchOpenAICompatibleModels(
    baseUrl: string, 
    apiKey: string
  ): Promise<ProviderModel[]> {
    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json() as { data: Array<{ id: string }> };
      
      return data.data
        .filter((m) => this.isChatModel(m.id))
        .map((m) => ({
          id: m.id,
          name: this.formatModelName(m.id),
          type: 'chat',
          pricing: { input: 0, output: 0 },
          context_window: 4096,
          max_output: 2048,
          status: 'active' as const,
        }));
    } catch {
      return [];
    }
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
      console.error('Failed to log sync:', error);
    }
  }

  // ==================== 辅助方法 ====================

  private isChatModel(modelId: string): boolean {
    const chatModels = [
      'gpt-4', 'gpt-3.5', 'claude', 'gemini', 'deepseek',
      'llama', 'mistral', 'mixtral', 'qwen', 'glm', 'doubao',
      'yi-', 'baichuan', 'moonshot', 'hunyuan', 'ernie', 'spark'
    ];
    return chatModels.some(m => modelId.toLowerCase().includes(m));
  }

  private formatModelName(modelId: string): string {
    return modelId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getModelCategory(modelId: string): string {
    if (modelId.includes('vision') || modelId.includes('gemini')) return 'multimodal';
    if (modelId.includes('dall') || modelId.includes('stable')) return 'image';
    if (modelId.includes('whisper')) return 'audio';
    if (modelId.includes('tts')) return 'audio';
    return 'text';
  }

  private mapModelType(type: string): string {
    const typeMap: Record<string, string> = {
      'chat': 'text',
      'text': 'text',
      'image_gen': 'image',
      'audio_transcribe': 'audio',
      'audio_tts': 'audio',
    };
    return typeMap[type] || 'text';
  }

  private getOpenAIPricing(modelId: string): { input: number; output: number } {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5, output: 10 },
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4-turbo': { input: 10, output: 30 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    };
    
    for (const [key, price] of Object.entries(pricing)) {
      if (modelId.includes(key)) return price;
    }
    
    return { input: 1, output: 2 };
  }

  private getContextWindow(modelId: string): number {
    if (modelId.includes('128k')) return 128000;
    if (modelId.includes('32k')) return 32768;
    if (modelId.includes('gemini') || modelId.includes('claude')) return 200000;
    if (modelId.includes('gpt-4')) return 128000;
    if (modelId.includes('gpt-3.5')) return 16384;
    return 4096;
  }

  private getMaxOutput(modelId: string): number {
    if (modelId.includes('gpt-4o')) return 16384;
    if (modelId.includes('claude')) return 8192;
    if (modelId.includes('gemini')) return 8192;
    return 4096;
  }

  private getModelTags(model: ProviderModel): string[] {
    const tags: string[] = [];
    
    if (model.pricing.input === 0) tags.push('免费');
    if (model.context_window && model.context_window >= 100000) tags.push('长上下文');
    if (model.type === 'multimodal') tags.push('多模态');
    
    return tags;
  }
}

// 导出单例
export const modelSyncService = new ModelSyncService();
