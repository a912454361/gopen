/**
 * 奖励服务
 * 处理用户签到、任务奖励、邀请奖励等
 */

import { getSupabaseClient } from '../storage/database/supabase-client.js';

const client = getSupabaseClient();

// 任务类型
export const TaskType = {
  ONCE: 'once',
  DAILY: 'daily',
} as const;

// 任务分类
export const TaskCategory = {
  ACCOUNT: 'account',
  CONTENT: 'content',
  DAILY: 'daily',
  INVITE: 'invite',
} as const;

// 签到奖励配置
const SIGN_IN_REWARDS = {
  base: 5,           // 基础奖励（厘）
  multiplier: [1, 1, 1, 1.5, 1.5, 2, 3], // 连续天数倍数
  max_days: 7,       // 最大连续天数
};

// 奖励服务
export class RewardService {
  /**
   * 用户签到
   */
  async signIn(userId: string): Promise<{
    success: boolean;
    data?: {
      rewardAmount: number;
      consecutiveDays: number;
      totalReward: number;
      isNewRecord: boolean;
    };
    error?: string;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    try {
      // 检查今日是否已签到
      const { data: todayRecord } = await client
        .from('sign_in_records')
        .select('*')
        .eq('user_id', userId)
        .eq('sign_date', today)
        .single();

      if (todayRecord) {
        return { success: false, error: '今日已签到' };
      }

      // 获取昨日签到记录
      const { data: yesterdayRecord } = await client
        .from('sign_in_records')
        .select('consecutive_days')
        .eq('user_id', userId)
        .eq('sign_date', yesterday)
        .single();

      const consecutiveDays = yesterdayRecord
        ? Math.min(yesterdayRecord.consecutive_days + 1, SIGN_IN_REWARDS.max_days)
        : 1;

      // 计算奖励
      const multiplier = SIGN_IN_REWARDS.multiplier[consecutiveDays - 1] || 1;
      const rewardAmount = Math.floor(SIGN_IN_REWARDS.base * multiplier);

      // 创建签到记录
      const { error: insertError } = await client
        .from('sign_in_records')
        .insert({
          user_id: userId,
          sign_date: today,
          consecutive_days: consecutiveDays,
          reward_amount: rewardAmount,
        });

      if (insertError) {
        return { success: false, error: '签到失败' };
      }

      // 发放奖励
      await this.grantReward(userId, 'sign_in', 'daily_sign', rewardAmount, `连续签到${consecutiveDays}天奖励`);

      // 获取总签到奖励
      const { data: totalData } = await client
        .from('sign_in_records')
        .select('reward_amount')
        .eq('user_id', userId);

      const totalReward = totalData?.reduce((sum, r) => sum + r.reward_amount, 0) || 0;

      return {
        success: true,
        data: {
          rewardAmount,
          consecutiveDays,
          totalReward,
          isNewRecord: true,
        },
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: '签到失败' };
    }
  }

  /**
   * 获取签到状态
   */
  async getSignInStatus(userId: string): Promise<{
    todaySigned: boolean;
    consecutiveDays: number;
    totalDays: number;
    totalReward: number;
    nextReward: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // 今日签到状态
    const { data: todayRecord } = await client
      .from('sign_in_records')
      .select('*')
      .eq('user_id', userId)
      .eq('sign_date', today)
      .single();

    // 昨日签到记录
    const { data: yesterdayRecord } = await client
      .from('sign_in_records')
      .select('consecutive_days')
      .eq('user_id', userId)
      .eq('sign_date', yesterday)
      .single();

    // 总签到数据
    const { data: allRecords } = await client
      .from('sign_in_records')
      .select('reward_amount')
      .eq('user_id', userId);

    const totalReward = allRecords?.reduce((sum, r) => sum + r.reward_amount, 0) || 0;

    // 计算下次签到奖励
    const nextConsecutiveDays = todayRecord
      ? todayRecord.consecutive_days
      : yesterdayRecord
        ? Math.min(yesterdayRecord.consecutive_days + 1, SIGN_IN_REWARDS.max_days)
        : 1;
    const nextMultiplier = SIGN_IN_REWARDS.multiplier[nextConsecutiveDays - 1] || 1;
    const nextReward = Math.floor(SIGN_IN_REWARDS.base * nextMultiplier);

    return {
      todaySigned: !!todayRecord,
      consecutiveDays: todayRecord?.consecutive_days || 0,
      totalDays: allRecords?.length || 0,
      totalReward,
      nextReward,
    };
  }

  /**
   * 获取所有任务列表
   */
  async getTasks(userId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];

    // 获取所有活跃任务
    const { data: tasks, error } = await client
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !tasks) {
      return [];
    }

    // 获取用户已完成的任务
    const { data: completedTasks } = await client
      .from('user_task_records')
      .select('task_code, created_at')
      .eq('user_id', userId);

    const completedMap = new Map<string, Date>();
    completedTasks?.forEach(t => {
      completedMap.set(t.task_code, new Date(t.created_at));
    });

    // 标记完成状态
    return tasks.map(task => {
      const completedAt = completedMap.get(task.code);
      let isCompleted = false;
      let completedToday = false;

      if (task.task_type === TaskType.ONCE) {
        isCompleted = !!completedAt;
      } else if (task.task_type === TaskType.DAILY && completedAt) {
        const completedDate = completedAt.toISOString().split('T')[0];
        isCompleted = completedDate === today;
        completedToday = isCompleted;
      }

      return {
        ...task,
        is_completed: isCompleted,
        completed_today: completedToday,
        completed_at: completedAt?.toISOString(),
      };
    });
  }

  /**
   * 完成任务
   */
  async completeTask(userId: string, taskCode: string): Promise<{
    success: boolean;
    data?: {
      rewardAmount: number;
      taskName: string;
    };
    error?: string;
  }> {
    try {
      // 获取任务信息
      const { data: task, error: taskError } = await client
        .from('tasks')
        .select('*')
        .eq('code', taskCode)
        .eq('is_active', true)
        .single();

      if (taskError || !task) {
        return { success: false, error: '任务不存在' };
      }

      const today = new Date().toISOString().split('T')[0];

      // 检查是否已完成
      let query = client
        .from('user_task_records')
        .select('*')
        .eq('user_id', userId)
        .eq('task_code', taskCode);

      if (task.task_type === TaskType.DAILY) {
        query = query.gte('created_at', today);
      }

      const { data: existingRecord } = await query.maybeSingle();

      if (existingRecord) {
        return { success: false, error: task.task_type === TaskType.ONCE ? '任务已完成' : '今日已完成' };
      }

      // 创建完成记录
      const { error: insertError } = await client
        .from('user_task_records')
        .insert({
          user_id: userId,
          task_id: task.id,
          task_code: task.code,
          reward_amount: task.reward_amount,
        });

      if (insertError) {
        return { success: false, error: '完成任务失败' };
      }

      // 发放奖励
      await this.grantReward(userId, 'task', taskCode, task.reward_amount, `完成任务: ${task.name}`);

      return {
        success: true,
        data: {
          rewardAmount: task.reward_amount,
          taskName: task.name,
        },
      };
    } catch (error) {
      console.error('Complete task error:', error);
      return { success: false, error: '完成任务失败' };
    }
  }

  /**
   * 邀请奖励
   */
  async grantInviteReward(inviterId: string, inviteeId: string): Promise<{
    success: boolean;
    inviterReward: number;
    inviteeReward: number;
  }> {
    const INVITER_REWARD = 100; // 邀请人奖励（厘）
    const INVITEE_REWARD = 50;  // 被邀请人奖励（厘）

    try {
      // 给邀请人发奖励
      await this.grantReward(inviterId, 'invite', 'invite_friend', INVITER_REWARD, '邀请好友奖励');

      // 给被邀请人发奖励
      await this.grantReward(inviteeId, 'invite', 'new_user', INVITEE_REWARD, '新用户注册奖励');

      // 记录任务完成
      await this.completeTask(inviterId, 'invite_friend');

      return {
        success: true,
        inviterReward: INVITER_REWARD,
        inviteeReward: INVITEE_REWARD,
      };
    } catch (error) {
      console.error('Grant invite reward error:', error);
      return { success: false, inviterReward: 0, inviteeReward: 0 };
    }
  }

  /**
   * 发放奖励到用户余额
   */
  async grantReward(
    userId: string,
    rewardType: string,
    rewardSource: string,
    amount: number,
    remark?: string
  ): Promise<boolean> {
    if (amount <= 0) return false;

    try {
      // 获取当前余额
      const { data: balanceData, error: balanceError } = await client
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (balanceError || !balanceData) {
        // 如果余额记录不存在，创建一个
        await client
          .from('user_balances')
          .insert({
            user_id: userId,
            balance: amount,
            total_recharged: 0,
            total_consumed: 0,
            monthly_consumed: 0,
          });
      } else {
        // 更新余额
        const newBalance = balanceData.balance + amount;
        await client
          .from('user_balances')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      // 记录奖励发放
      const balanceBefore = balanceData?.balance || 0;
      await client.from('reward_records').insert({
        user_id: userId,
        reward_type: rewardType,
        reward_source: rewardSource,
        amount: amount,
        balance_before: balanceBefore,
        balance_after: balanceBefore + amount,
        remark: remark,
      });

      return true;
    } catch (error) {
      console.error('Grant reward error:', error);
      return false;
    }
  }

  /**
   * 获取奖励记录
   */
  async getRewardRecords(
    userId: string,
    options?: {
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    let query = client
      .from('reward_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('reward_type', options.type);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get reward records error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 获取用户总奖励统计
   */
  async getRewardStats(userId: string): Promise<{
    totalFromSignIn: number;
    totalFromTasks: number;
    totalFromInvite: number;
    totalRewards: number;
  }> {
    const { data, error } = await client
      .from('reward_records')
      .select('reward_type, amount')
      .eq('user_id', userId);

    if (error || !data) {
      return {
        totalFromSignIn: 0,
        totalFromTasks: 0,
        totalFromInvite: 0,
        totalRewards: 0,
      };
    }

    const stats = {
      totalFromSignIn: 0,
      totalFromTasks: 0,
      totalFromInvite: 0,
      totalRewards: 0,
    };

    data.forEach(record => {
      stats.totalRewards += record.amount;
      if (record.reward_type === 'sign_in') {
        stats.totalFromSignIn += record.amount;
      } else if (record.reward_type === 'task') {
        stats.totalFromTasks += record.amount;
      } else if (record.reward_type === 'invite') {
        stats.totalFromInvite += record.amount;
      }
    });

    return stats;
  }
}

// 导出单例
export const rewardService = new RewardService();
