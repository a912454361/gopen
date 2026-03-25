/**
 * 奖励中心页面
 * 整合签到、任务、邀请奖励功能
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type TabKey = 'tasks' | 'records';

// 签到状态接口
interface SignInStatus {
  todaySigned: boolean;
  consecutiveDays: number;
  totalDays: number;
  totalReward: number;
  nextReward: number;
}

// 任务接口
interface Task {
  id: string;
  code: string;
  name: string;
  description: string;
  reward_amount: number;
  task_type: 'once' | 'daily';
  task_category: string;
  is_completed: boolean;
  completed_today: boolean;
}

// 奖励记录接口
interface RewardRecord {
  id: string;
  reward_type: string;
  reward_source: string;
  amount: number;
  remark: string;
  created_at: string;
}

// 奖励统计接口
interface RewardStats {
  totalFromSignIn: number;
  totalFromTasks: number;
  totalFromInvite: number;
  totalRewards: number;
}

// 签到天数奖励配置
const SIGN_IN_MULTIPLIERS = [1, 1, 1, 1.5, 1.5, 2, 3];
const BASE_REWARD = 5; // 基础奖励 5 厘

export default function RewardsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 状态
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('tasks');

  // 数据
  const [signInStatus, setSignInStatus] = useState<SignInStatus | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [records, setRecords] = useState<RewardRecord[]>([]);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // 加载用户ID
  const loadUserId = useCallback(async () => {
    const storedUserId = await AsyncStorage.getItem('userId');
    setUserId(storedUserId);
    return storedUserId;
  }, []);

  // 加载所有数据
  const loadAllData = useCallback(async (uid: string) => {
    try {
      const [signInRes, tasksRes, statsRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/rewards/sign-in/status?userId=${uid}`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/rewards/tasks?userId=${uid}`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/rewards/stats?userId=${uid}`),
      ]);

      const signInData = await signInRes.json();
      if (signInData.success) {
        setSignInStatus(signInData.data);
      }

      const tasksData = await tasksRes.json();
      if (tasksData.success) {
        setTasks(tasksData.data || []);
      }

      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 加载奖励记录
  const loadRecords = useCallback(async (uid: string) => {
    try {
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/rewards/records?userId=${uid}&limit=30`
      );
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (error) {
      console.error('Load records error:', error);
    }
  }, []);

  // 初始化
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const init = async () => {
        setIsLoading(true);
        const uid = await loadUserId();
        if (uid && !cancelled) {
          await loadAllData(uid);
          await loadRecords(uid);
        }
      };

      init();

      return () => {
        cancelled = true;
      };
    }, [loadUserId, loadAllData, loadRecords])
  );

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await loadAllData(userId);
    await loadRecords(userId);
  }, [userId, loadAllData, loadRecords]);

  // 签到
  const handleSignIn = useCallback(async () => {
    if (!userId || isSigningIn) return;

    setIsSigningIn(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/rewards/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert(
          '签到成功',
          `连续签到 ${data.data.consecutiveDays} 天\n获得 ${(data.data.rewardAmount / 100).toFixed(2)} 元奖励`,
          [{ text: '好的', onPress: () => loadAllData(userId) }]
        );
      } else {
        Alert.alert('签到失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('签到失败', '网络错误');
    } finally {
      setIsSigningIn(false);
    }
  }, [userId, isSigningIn, loadAllData]);

  // 完成任务
  const handleCompleteTask = useCallback(async (task: Task) => {
    if (task.is_completed || !userId) return;

    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/rewards/tasks/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, taskCode: task.code }),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert(
          '任务完成',
          `恭喜获得 ${(data.data.rewardAmount / 100).toFixed(2)} 元奖励！`,
          [{ text: '好的', onPress: () => loadAllData(userId) }]
        );
      } else {
        Alert.alert('提示', data.error || '任务未完成');
      }
    } catch (error) {
      console.error('Complete task error:', error);
    }
  }, [userId, loadAllData]);

  // 获取任务图标
  const getTaskIcon = (code: string): keyof typeof FontAwesome6.glyphMap => {
    const iconMap: Record<string, keyof typeof FontAwesome6.glyphMap> = {
      daily_sign: 'calendar-check',
      daily_chat: 'message',
      daily_image: 'image',
      daily_share: 'share-nodes',
      first_phone_bind: 'mobile-screen',
      first_profile: 'user-pen',
      first_work: 'wand-magic-sparkles',
      invite_friend: 'user-plus',
    };
    return iconMap[code] || 'gift';
  };

  // 获取奖励类型名称
  const getRewardTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      sign_in: '签到奖励',
      task: '任务奖励',
      invite: '邀请奖励',
    };
    return typeMap[type] || type;
  };

  // 未登录状态
  if (!userId && !isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={[styles.container, styles.emptyState]}>
          <FontAwesome6 name="user-slash" size={48} color={theme.textMuted} />
          <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
            请先登录查看奖励
          </ThemedText>
          <TouchableOpacity
            style={[styles.taskButton, { backgroundColor: theme.primary, paddingHorizontal: Spacing.xl }]}
            onPress={() => router.push('/login')}
          >
            <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>去登录</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // 加载中
  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.container}>
          {/* 导航栏 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, marginTop: Spacing.md }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: Spacing.sm, marginLeft: -Spacing.sm }}>
              <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <ThemedText variant="h4" color={theme.textPrimary} style={{ marginLeft: Spacing.sm }}>
              奖励中心
            </ThemedText>
          </View>

          {/* 签到卡片 */}
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.signInCard}
          >
            <View style={styles.signInHeader}>
              <View style={styles.signInTitle}>
                <FontAwesome6 name="calendar-check" size={24} color="#fff" />
                <ThemedText variant="h4" color="#fff" style={{ marginLeft: Spacing.sm }}>
                  每日签到
                </ThemedText>
              </View>
              {signInStatus && (
                <View style={styles.signInStreak}>
                  <FontAwesome6 name="fire" size={16} color="#FFD700" />
                  <ThemedText variant="small" color="#fff" style={{ marginLeft: 4 }}>
                    连续 {signInStatus.consecutiveDays} 天
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.signInReward}>
              <ThemedText variant="h1" color="#fff">
                +{signInStatus?.nextReward || 5}
              </ThemedText>
              <ThemedText variant="body" color="rgba(255,255,255,0.8)">
                厘
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.signInButton,
                { backgroundColor: signInStatus?.todaySigned ? 'rgba(255,255,255,0.2)' : '#fff' },
                signInStatus?.todaySigned && styles.signedInButton,
              ]}
              onPress={handleSignIn}
              disabled={signInStatus?.todaySigned || isSigningIn}
            >
              {isSigningIn ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ThemedText
                  variant="bodyMedium"
                  color={signInStatus?.todaySigned ? '#fff' : theme.primary}
                >
                  {signInStatus?.todaySigned ? '今日已签到' : '立即签到'}
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* 签到天数进度 */}
            <View style={styles.signInDays}>
              {SIGN_IN_MULTIPLIERS.map((multiplier, index) => {
                const dayNum = index + 1;
                const isActive = signInStatus && signInStatus.consecutiveDays >= dayNum;
                return (
                  <View key={dayNum} style={styles.signInDay}>
                    <View
                      style={[
                        styles.signInDayCircle,
                        isActive ? styles.signInDayActive : styles.signInDayInactive,
                      ]}
                    >
                      {isActive ? (
                        <FontAwesome6 name="check" size={14} color="#fff" />
                      ) : (
                        <ThemedText variant="caption" color={theme.textMuted}>
                          {dayNum}
                        </ThemedText>
                      )}
                    </View>
                    <ThemedText variant="caption" color="rgba(255,255,255,0.6)">
                      x{multiplier}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </LinearGradient>

          {/* 统计卡片 */}
          <View style={styles.statsGrid}>
            <ThemedView level="default" style={styles.statCard}>
              <ThemedText variant="caption" color={theme.textMuted}>累计奖励</ThemedText>
              <ThemedText variant="h3" color={theme.primary} style={styles.statValue}>
                ¥{((stats?.totalRewards || 0) / 100).toFixed(2)}
              </ThemedText>
            </ThemedView>
            <ThemedView level="default" style={styles.statCard}>
              <ThemedText variant="caption" color={theme.textMuted}>签到奖励</ThemedText>
              <ThemedText variant="h3" color={theme.textPrimary} style={styles.statValue}>
                ¥{((stats?.totalFromSignIn || 0) / 100).toFixed(2)}
              </ThemedText>
            </ThemedView>
            <ThemedView level="default" style={styles.statCard}>
              <ThemedText variant="caption" color={theme.textMuted}>任务奖励</ThemedText>
              <ThemedText variant="h3" color={theme.textPrimary} style={styles.statValue}>
                ¥{((stats?.totalFromTasks || 0) / 100).toFixed(2)}
              </ThemedText>
            </ThemedView>
            <ThemedView level="default" style={styles.statCard}>
              <ThemedText variant="caption" color={theme.textMuted}>邀请奖励</ThemedText>
              <ThemedText variant="h3" color={theme.textPrimary} style={styles.statValue}>
                ¥{((stats?.totalFromInvite || 0) / 100).toFixed(2)}
              </ThemedText>
            </ThemedView>
          </View>

          {/* Tab切换 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
              onPress={() => setActiveTab('tasks')}
            >
              <ThemedText
                variant="smallMedium"
                color={activeTab === 'tasks' ? theme.buttonPrimaryText : theme.textMuted}
              >
                任务中心
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'records' && styles.activeTab]}
              onPress={() => setActiveTab('records')}
            >
              <ThemedText
                variant="smallMedium"
                color={activeTab === 'records' ? theme.buttonPrimaryText : theme.textMuted}
              >
                奖励记录
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* 任务列表 */}
          {activeTab === 'tasks' && (
            <>
              {/* 快捷入口 */}
              <ThemedView level="default" style={styles.inviteCard}>
                <View style={styles.inviteHeader}>
                  <FontAwesome6 name="gift" size={24} color={theme.accent} />
                  <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                    <ThemedText variant="h4" color={theme.textPrimary}>邀请好友</ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      邀请好友注册，双方各得 1 元奖励
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.inviteButton, { backgroundColor: theme.accent }]}
                  onPress={() => router.push('/invite')}
                >
                  <ThemedText variant="smallMedium" color="#fff">立即邀请</ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {/* 任务列表 */}
              <View style={styles.sectionHeader}>
                <ThemedText variant="label" color={theme.textPrimary}>任务列表</ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {tasks.filter(t => t.is_completed).length}/{tasks.length} 已完成
                </ThemedText>
              </View>

              {tasks.map((task) => (
                <ThemedView key={task.id} level="default" style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={[styles.taskIcon, { backgroundColor: theme.backgroundTertiary }]}>
                      <FontAwesome6
                        name={getTaskIcon(task.code)}
                        size={18}
                        color={task.is_completed ? theme.success : theme.primary}
                      />
                    </View>
                    <View style={styles.taskInfo}>
                      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                        {task.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {task.description}
                      </ThemedText>
                    </View>
                    <View style={styles.taskReward}>
                      <ThemedText variant="h4" color={theme.success}>
                        +{task.reward_amount}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>厘</ThemedText>
                    </View>
                  </View>

                  {!task.is_completed && (
                    <View style={styles.taskAction}>
                      <TouchableOpacity
                        style={[styles.taskButton, { backgroundColor: theme.primary }]}
                        onPress={() => handleCompleteTask(task)}
                      >
                        <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                          {task.task_type === 'daily' ? '去完成' : '领取奖励'}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {task.is_completed && (
                    <View style={styles.taskAction}>
                      <View style={[styles.taskButton, styles.taskButtonCompleted]}>
                        <FontAwesome6 name="circle-check" size={16} color={theme.success} />
                        <ThemedText variant="smallMedium" color={theme.success} style={{ marginLeft: Spacing.xs }}>
                          {task.task_type === 'daily' && task.completed_today ? '今日已完成' : '已完成'}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </ThemedView>
              ))}
            </>
          )}

          {/* 奖励记录 */}
          {activeTab === 'records' && (
            <>
              {records.length === 0 ? (
                <View style={styles.emptyState}>
                  <FontAwesome6 name="receipt" size={48} color={theme.textMuted} />
                  <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                    暂无奖励记录
                  </ThemedText>
                </View>
              ) : (
                records.map((record) => (
                  <ThemedView key={record.id} level="default" style={styles.recordCard}>
                    <View style={styles.recordInfo}>
                      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                        {getRewardTypeName(record.reward_type)}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {record.remark || record.reward_source}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {new Date(record.created_at).toLocaleString('zh-CN')}
                      </ThemedText>
                    </View>
                    <View style={styles.recordAmount}>
                      <ThemedText variant="h4" color={theme.success}>
                        +{(record.amount / 100).toFixed(2)}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>元</ThemedText>
                    </View>
                  </ThemedView>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
