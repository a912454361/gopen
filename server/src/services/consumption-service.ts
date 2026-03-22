/**
 * 消费服务
 * 统一处理用户消费扣款逻辑
 */

import { getSupabaseClient } from '../storage/database/supabase-client.js';

const client = getSupabaseClient();

// 消费类型常量
export const ConsumptionType = {
  MODEL_CHAT: 'model_chat',
  MODEL_IMAGE: 'model_image',
  MODEL_AUDIO: 'model_audio',
  MODEL_VIDEO: 'model_video',
  MODEL_EMBEDDING: 'model_embedding',
  GPU_COMPUTE: 'gpu_compute',
  STORAGE: 'storage',
  OLLAMA: 'ollama',
} as const;

export type ConsumptionTypeValue = typeof ConsumptionType[keyof typeof ConsumptionType];

// 消费记录接口
export interface ConsumptionRecord {
  id?: string;
  userId: string;
  consumptionType: ConsumptionTypeValue;
  resourceId?: string;
  resourceName?: string;
  
  // 用量
  inputTokens?: number;
  outputTokens?: number;
  storageBytes?: number;
  gpuSeconds?: number;
  requestCount?: number;
  
  // 成本（后台可见）
  costInputFee?: number;
  costOutputFee?: number;
  costStorageFee?: number;
  costGpuFee?: number;
  costTotal?: number;
  
  // 收费（用户可见）
  sellInputFee?: number;
  sellOutputFee?: number;
  sellStorageFee?: number;
  sellGpuFee?: number;
  sellTotal?: number;
  
  // 利润
  profit?: number;
  
  // 关联
  taskId?: string;
  projectId?: string;
  status?: string;
  remark?: string;
}

// 消费结果
export interface ConsumptionResult {
  success: boolean;
  recordId?: string;
  balance?: number;
  error?: string;
}

/**
 * 消费服务类
 */
export class ConsumptionService {
  
  /**
   * 检查用户余额是否充足
   */
  async checkBalance(userId: string, requiredAmount: number): Promise<{ 
    sufficient: boolean; 
    balance: number; 
    error?: string 
  }> {
    const { data: balance, error } = await client
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return { sufficient: false, balance: 0, error: '查询余额失败' };
    }
    
    const currentBalance = balance?.balance || 0;
    
    return {
      sufficient: currentBalance >= requiredAmount,
      balance: currentBalance,
      error: currentBalance < requiredAmount ? '余额不足，请先充值' : undefined,
    };
  }
  
  /**
   * 获取用户余额
   */
  async getBalance(userId: string): Promise<number> {
    const { data: balance } = await client
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();
    
    return balance?.balance || 0;
  }
  
  /**
   * 执行消费扣款
   * 1. 检查余额
   * 2. 扣除余额
   * 3. 记录消费
   */
  async consume(record: ConsumptionRecord): Promise<ConsumptionResult> {
    const sellTotal = record.sellTotal || 0;
    
    if (sellTotal <= 0) {
      // 免费消费，只记录不扣款
      const recordId = await this.createRecord(record);
      return { success: true, recordId, balance: await this.getBalance(record.userId) };
    }
    
    // 检查余额
    const { sufficient, balance, error } = await this.checkBalance(record.userId, sellTotal);
    
    if (!sufficient) {
      return { success: false, error: error || '余额不足' };
    }
    
    try {
      // 获取当前统计数据
      const { data: currentData } = await client
        .from('user_balances')
        .select('total_consumed, monthly_consumed')
        .eq('user_id', record.userId)
        .single();
      
      const currentTotalConsumed = currentData?.total_consumed || 0;
      const currentMonthlyConsumed = currentData?.monthly_consumed || 0;
      
      // 扣除余额
      await client
        .from('user_balances')
        .update({
          balance: balance - sellTotal,
          total_consumed: currentTotalConsumed + sellTotal,
          monthly_consumed: currentMonthlyConsumed + sellTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', record.userId);
      
      // 记录消费
      const recordId = await this.createRecord(record);
      
      // 计算利润
      const costTotal = record.costTotal || 0;
      const profit = sellTotal - costTotal;
      
      // 更新利润
      if (profit > 0) {
        await client
          .from('consumption_records')
          .update({ profit })
          .eq('id', recordId);
      }
      
      return { 
        success: true, 
        recordId, 
        balance: balance - sellTotal 
      };
    } catch (err) {
      console.error('Consume error:', err);
      return { success: false, error: '消费扣款失败' };
    }
  }
  
  /**
   * 流式消费 - 先预扣，完成后结算
   */
  async preConsume(userId: string, estimatedAmount: number): Promise<{
    success: boolean;
    frozenAmount: number;
    balance: number;
    error?: string;
  }> {
    const { data: balanceData } = await client
      .from('user_balances')
      .select('balance, frozen_balance')
      .eq('user_id', userId)
      .single();
    
    const balance = balanceData?.balance || 0;
    const frozenBalance = balanceData?.frozen_balance || 0;
    
    if (balance < estimatedAmount) {
      return { success: false, frozenAmount: 0, balance, error: '余额不足' };
    }
    
    // 冻结金额
    await client
      .from('user_balances')
      .update({
        balance: balance - estimatedAmount,
        frozen_balance: frozenBalance + estimatedAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    return { 
      success: true, 
      frozenAmount: estimatedAmount, 
      balance: balance - estimatedAmount 
    };
  }
  
  /**
   * 完成流式消费 - 结算冻结金额
   */
  async completeConsume(record: ConsumptionRecord, frozenAmount: number): Promise<ConsumptionResult> {
    const sellTotal = record.sellTotal || 0;
    const refundAmount = frozenAmount - sellTotal;
    
    const { data: balanceInfo } = await client
      .from('user_balances')
      .select('balance, frozen_balance, total_consumed, monthly_consumed')
      .eq('user_id', record.userId)
      .single();
    
    const currentBalance = balanceInfo?.balance || 0;
    const frozenBalance = balanceInfo?.frozen_balance || 0;
    const currentTotalConsumed = balanceInfo?.total_consumed || 0;
    const currentMonthlyConsumed = balanceInfo?.monthly_consumed || 0;
    
    // 更新余额和冻结金额
    const newFrozenBalance = Math.max(0, frozenBalance - frozenAmount);
    const newBalance = currentBalance + refundAmount;
    
    await client
      .from('user_balances')
      .update({
        balance: newBalance,
        frozen_balance: newFrozenBalance,
        total_consumed: currentTotalConsumed + sellTotal,
        monthly_consumed: currentMonthlyConsumed + sellTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', record.userId);
    
    // 记录消费
    const recordId = await this.createRecord(record);
    
    return { success: true, recordId, balance: newBalance };
  }
  
  /**
   * 退款
   */
  async refund(recordId: string, reason?: string): Promise<ConsumptionResult> {
    const { data: record, error } = await client
      .from('consumption_records')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (error || !record) {
      return { success: false, error: '消费记录不存在' };
    }
    
    if (record.status === 'refunded') {
      return { success: false, error: '已退款' };
    }
    
    const sellTotal = record.sell_total || 0;
    
    if (sellTotal <= 0) {
      return { success: true, recordId, balance: await this.getBalance(record.user_id) };
    }
    
    // 获取当前余额
    const { data: balanceData } = await client
      .from('user_balances')
      .select('balance, total_consumed')
      .eq('user_id', record.user_id)
      .single();
    
    const currentBalance = balanceData?.balance || 0;
    const currentTotalConsumed = balanceData?.total_consumed || 0;
    
    // 退款
    await client
      .from('user_balances')
      .update({
        balance: currentBalance + sellTotal,
        total_consumed: Math.max(0, currentTotalConsumed - sellTotal),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', record.user_id);
    
    // 更新记录状态
    await client
      .from('consumption_records')
      .update({
        status: 'refunded',
        remark: reason || '用户退款',
      })
      .eq('id', recordId);
    
    return { 
      success: true, 
      recordId, 
      balance: currentBalance + sellTotal 
    };
  }
  
  /**
   * 创建消费记录
   */
  private async createRecord(record: ConsumptionRecord): Promise<string> {
    const { data, error } = await client
      .from('consumption_records')
      .insert([{
        user_id: record.userId,
        consumption_type: record.consumptionType,
        resource_id: record.resourceId,
        resource_name: record.resourceName,
        input_tokens: record.inputTokens || 0,
        output_tokens: record.outputTokens || 0,
        storage_bytes: record.storageBytes || 0,
        gpu_seconds: record.gpuSeconds || 0,
        request_count: record.requestCount || 1,
        cost_input_fee: record.costInputFee || 0,
        cost_output_fee: record.costOutputFee || 0,
        cost_storage_fee: record.costStorageFee || 0,
        cost_gpu_fee: record.costGpuFee || 0,
        cost_total: record.costTotal || 0,
        sell_input_fee: record.sellInputFee || 0,
        sell_output_fee: record.sellOutputFee || 0,
        sell_storage_fee: record.sellStorageFee || 0,
        sell_gpu_fee: record.sellGpuFee || 0,
        sell_total: record.sellTotal || 0,
        profit: (record.sellTotal || 0) - (record.costTotal || 0),
        task_id: record.taskId,
        project_id: record.projectId,
        status: record.status || 'completed',
        remark: record.remark,
      }])
      .select('id')
      .single();
    
    if (error) {
      console.error('Create consumption record error:', error);
      throw error;
    }
    
    return data.id;
  }
  
  /**
   * 查询用户消费记录
   */
  async getUserRecords(
    userId: string, 
    options?: {
      type?: ConsumptionTypeValue;
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any[]> {
    let query = client
      .from('consumption_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (options?.type) {
      query = query.eq('consumption_type', options.type);
    }
    
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Get user records error:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * 获取用户消费统计
   */
  async getUserStats(userId: string): Promise<{
    totalConsumed: number;
    todayConsumed: number;
    monthConsumed: number;
    typeBreakdown: Record<string, number>;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    // 获取总消费
    const { data: totalData } = await client
      .from('consumption_records')
      .select('sell_total')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    // 获取今日消费
    const { data: todayData } = await client
      .from('consumption_records')
      .select('sell_total')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', todayStart);
    
    // 获取本月消费
    const { data: monthData } = await client
      .from('consumption_records')
      .select('sell_total')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('created_at', monthStart);
    
    // 按类型统计
    const { data: typeData } = await client
      .from('consumption_records')
      .select('consumption_type, sell_total')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    const typeBreakdown: Record<string, number> = {};
    (typeData || []).forEach(item => {
      typeBreakdown[item.consumption_type] = (typeBreakdown[item.consumption_type] || 0) + (item.sell_total || 0);
    });
    
    return {
      totalConsumed: (totalData || []).reduce((sum, item) => sum + (item.sell_total || 0), 0),
      todayConsumed: (todayData || []).reduce((sum, item) => sum + (item.sell_total || 0), 0),
      monthConsumed: (monthData || []).reduce((sum, item) => sum + (item.sell_total || 0), 0),
      typeBreakdown,
    };
  }
  
  /**
   * 计算模型调用费用
   */
  calculateModelFee(
    inputTokens: number,
    outputTokens: number,
    inputPricePerMillion: number, // 厘/百万tokens
    outputPricePerMillion: number
  ): { sellInputFee: number; sellOutputFee: number; sellTotal: number } {
    // 价格单位：厘/百万tokens = 厘/1,000,000 tokens
    // 费用 = tokens * 价格 / 1,000,000
    const sellInputFee = Math.ceil(inputTokens * inputPricePerMillion / 1000000);
    const sellOutputFee = Math.ceil(outputTokens * outputPricePerMillion / 1000000);
    
    return {
      sellInputFee,
      sellOutputFee,
      sellTotal: sellInputFee + sellOutputFee,
    };
  }
  
  /**
   * 计算存储费用
   */
  calculateStorageFee(
    storageBytes: number,
    pricePerGB: number // 分/GB
  ): { sellStorageFee: number } {
    const gb = storageBytes / (1024 * 1024 * 1024);
    const sellStorageFee = Math.ceil(gb * pricePerGB);
    
    return { sellStorageFee };
  }
  
  /**
   * 计算GPU费用
   */
  calculateGpuFee(
    gpuSeconds: number,
    pricePerHour: number // 分/小时
  ): { sellGpuFee: number } {
    const hours = gpuSeconds / 3600;
    const sellGpuFee = Math.ceil(hours * pricePerHour);
    
    return { sellGpuFee };
  }
}

// 导出单例
export const consumptionService = new ConsumptionService();
