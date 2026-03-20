/**
 * 利润统计面板组件
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface ProfitPanelProps {
  adminKey: string;
}

interface ProfitStats {
  overview: {
    today: { revenue: number; cost: number; profit: number; margin: number };
    week: { revenue: number; cost: number; profit: number; margin: number };
    month: { revenue: number; cost: number; profit: number; margin: number };
    total: { revenue: number; cost: number; profit: number; margin: number };
  };
  memberRevenue: {
    total: number;
    normal: number;
    super: number;
  };
  topModels: Array<{
    name: string;
    type: string;
    calls: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
  topUsers: Array<{
    userId: string;
    calls: number;
    revenue: number;
    profit: number;
  }>;
  profitTrend: Array<{
    date: string;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  aiCalls: {
    today: number;
    week: number;
    month: number;
    total: number;
  };
}

export function ProfitPanel({ adminKey }: ProfitPanelProps) {
  const { theme, isDark } = useTheme();
  const [stats, setStats] = useState<ProfitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/profit?key=${adminKey}`
      );
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      console.error('Fetch profit stats error:', err);
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchStats();
    // 每30秒刷新一次
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
          加载中...
        </ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
        <FontAwesome6 name="exclamation-triangle" size={48} color={theme.error} />
        <ThemedText variant="body" color={theme.error} style={{ marginTop: Spacing.lg }}>
          {error}
        </ThemedText>
        <TouchableOpacity
          style={{
            marginTop: Spacing.lg,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.xl,
            backgroundColor: theme.primary,
            borderRadius: BorderRadius.lg,
          }}
          onPress={fetchStats}
        >
          <ThemedText variant="smallMedium" color="#fff">重试</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!stats) return null;

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* 标题栏 */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
      }}>
        <View>
          <ThemedText variant="h3" color={theme.textPrimary}>AI 调用利润分析</ThemedText>
          <ThemedText variant="small" color={theme.textMuted}>
            实时统计模型调用收益
          </ThemedText>
        </View>
        
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.backgroundTertiary,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={fetchStats}
        >
          <FontAwesome6 name="rotate" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* 概览卡片 */}
      <View style={{ marginBottom: Spacing.xl }}>
        <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
          收益概览
        </ThemedText>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg }}>
          {[
            { title: '今日', data: stats.overview.today },
            { title: '本周', data: stats.overview.week },
            { title: '本月', data: stats.overview.month },
            { title: '累计', data: stats.overview.total },
          ].map((item) => (
            <View
              key={item.title}
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <ThemedText variant="caption" color={theme.textMuted}>{item.title}</ThemedText>
              <ThemedText variant="h2" color={theme.textPrimary} style={{ marginTop: Spacing.sm }}>
                ¥{item.data.revenue.toFixed(2)}
              </ThemedText>
              <View style={{ flexDirection: 'row', marginTop: Spacing.sm, gap: Spacing.lg }}>
                <View>
                  <ThemedText variant="tiny" color={theme.textMuted}>利润</ThemedText>
                  <ThemedText variant="smallMedium" color={theme.success}>
                    ¥{item.data.profit.toFixed(2)}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText variant="tiny" color={theme.textMuted}>利润率</ThemedText>
                  <ThemedText variant="smallMedium" color={theme.primary}>
                    {item.data.margin.toFixed(1)}%
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 会员收入 */}
      <View style={{ marginBottom: Spacing.xl }}>
        <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
          本月会员收入
        </ThemedText>
        
        <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
          {[
            { title: '会员总计', amount: stats.memberRevenue.total, icon: 'crown', color: theme.primary },
            { title: '普通会员', amount: stats.memberRevenue.normal, icon: 'user', color: theme.accent },
            { title: '超级会员', amount: stats.memberRevenue.super, icon: 'star', color: '#FFD700' },
          ].map((item) => (
            <View
              key={item.title}
              style={{
                flex: 1,
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: item.color + '20',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Spacing.md,
              }}>
                <FontAwesome6 name={item.icon as any} size={20} color={item.color} />
              </View>
              <ThemedText variant="caption" color={theme.textMuted}>{item.title}</ThemedText>
              <ThemedText variant="h4" color={theme.textPrimary} style={{ marginTop: Spacing.xs }}>
                ¥{item.amount.toFixed(2)}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* AI 调用统计 */}
      <View style={{ marginBottom: Spacing.xl }}>
        <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
          AI 调用次数
        </ThemedText>
        
        <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
          {[
            { title: '今日', count: stats.aiCalls.today },
            { title: '本周', count: stats.aiCalls.week },
            { title: '本月', count: stats.aiCalls.month },
            { title: '累计', count: stats.aiCalls.total },
          ].map((item) => (
            <View
              key={item.title}
              style={{
                flex: 1,
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <ThemedText variant="caption" color={theme.textMuted}>{item.title}</ThemedText>
              <ThemedText variant="h3" color={theme.textPrimary} style={{ marginTop: Spacing.sm }}>
                {item.count.toLocaleString()}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* 热门模型排行 */}
      {stats.topModels.length > 0 && (
        <View style={{ marginBottom: Spacing.xl }}>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
            热门模型排行
          </ThemedText>
          
          <View style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
          }}>
            {/* 表头 */}
            <View style={{
              flexDirection: 'row',
              padding: Spacing.md,
              backgroundColor: theme.backgroundTertiary,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              <ThemedText variant="caption" color={theme.textMuted} style={{ width: 50 }}>排名</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 2 }}>模型</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1, textAlign: 'right' }}>调用</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1, textAlign: 'right' }}>收入</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1, textAlign: 'right' }}>利润</ThemedText>
            </View>
            
            {/* 数据行 */}
            {stats.topModels.map((model, index) => (
              <View
                key={model.name}
                style={{
                  flexDirection: 'row',
                  padding: Spacing.md,
                  borderBottomWidth: index < stats.topModels.length - 1 ? 1 : 0,
                  borderBottomColor: theme.borderLight,
                }}
              >
                <View style={{ width: 50 }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: index < 3 ? theme.primary + '20' : theme.backgroundTertiary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <ThemedText variant="smallMedium" color={index < 3 ? theme.primary : theme.textMuted}>
                      {index + 1}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText variant="small" color={theme.textPrimary} style={{ flex: 2 }}>{model.name}</ThemedText>
                <ThemedText variant="small" color={theme.textSecondary} style={{ flex: 1, textAlign: 'right' }}>
                  {model.calls}
                </ThemedText>
                <ThemedText variant="small" color={theme.textPrimary} style={{ flex: 1, textAlign: 'right' }}>
                  ¥{model.revenue.toFixed(2)}
                </ThemedText>
                <ThemedText variant="small" color={theme.success} style={{ flex: 1, textAlign: 'right' }}>
                  ¥{model.profit.toFixed(2)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 消费用户排行 */}
      {stats.topUsers.length > 0 && (
        <View style={{ marginBottom: Spacing.xl }}>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
            消费用户排行
          </ThemedText>
          
          <View style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
          }}>
            {/* 表头 */}
            <View style={{
              flexDirection: 'row',
              padding: Spacing.md,
              backgroundColor: theme.backgroundTertiary,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              <ThemedText variant="caption" color={theme.textMuted} style={{ width: 50 }}>排名</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 2 }}>用户ID</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1, textAlign: 'right' }}>调用</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1, textAlign: 'right' }}>消费</ThemedText>
            </View>
            
            {/* 数据行 */}
            {stats.topUsers.map((user, index) => (
              <View
                key={user.userId}
                style={{
                  flexDirection: 'row',
                  padding: Spacing.md,
                  borderBottomWidth: index < stats.topUsers.length - 1 ? 1 : 0,
                  borderBottomColor: theme.borderLight,
                }}
              >
                <View style={{ width: 50 }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: index < 3 ? theme.accent + '20' : theme.backgroundTertiary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <ThemedText variant="smallMedium" color={index < 3 ? theme.accent : theme.textMuted}>
                      {index + 1}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText variant="small" color={theme.textPrimary} style={{ flex: 2 }}>
                  {user.userId.slice(0, 12)}...
                </ThemedText>
                <ThemedText variant="small" color={theme.textSecondary} style={{ flex: 1, textAlign: 'right' }}>
                  {user.calls}
                </ThemedText>
                <ThemedText variant="small" color={theme.textPrimary} style={{ flex: 1, textAlign: 'right' }}>
                  ¥{user.revenue.toFixed(2)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 利润趋势 */}
      {stats.profitTrend.length > 0 && (
        <View style={{ marginBottom: Spacing.xl }}>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
            近7天利润趋势
          </ThemedText>
          
          <View style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
            overflow: 'hidden',
          }}>
            {/* 表头 */}
            <View style={{
              flexDirection: 'row',
              padding: Spacing.md,
              backgroundColor: theme.backgroundTertiary,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1 }}>日期</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1, textAlign: 'right' }}>收入</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1, textAlign: 'right' }}>成本</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ flex: 1, textAlign: 'right' }}>利润</ThemedText>
            </View>
            
            {/* 数据行 */}
            {stats.profitTrend.map((day, index) => (
              <View
                key={day.date}
                style={{
                  flexDirection: 'row',
                  padding: Spacing.md,
                  borderBottomWidth: index < stats.profitTrend.length - 1 ? 1 : 0,
                  borderBottomColor: theme.borderLight,
                }}
              >
                <ThemedText variant="small" color={theme.textSecondary} style={{ flex: 1 }}>
                  {day.date}
                </ThemedText>
                <ThemedText variant="small" color={theme.textPrimary} style={{ flex: 1, textAlign: 'right' }}>
                  ¥{day.revenue.toFixed(2)}
                </ThemedText>
                <ThemedText variant="small" color={theme.textSecondary} style={{ flex: 1, textAlign: 'right' }}>
                  ¥{day.cost.toFixed(2)}
                </ThemedText>
                <ThemedText variant="small" color={theme.success} style={{ flex: 1, textAlign: 'right' }}>
                  ¥{day.profit.toFixed(2)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
