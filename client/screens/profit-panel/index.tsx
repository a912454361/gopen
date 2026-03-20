import React, { useMemo } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useEffect, useState } from 'react';

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

export default function ProfitPanelScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useSafeSearchParams<{ key?: string }>();
  
  const [stats, setStats] = useState<ProfitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const adminKey = params.key || 'gopen_admin_2024';
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/profit?key=${adminKey}`
      );
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Fetch profit stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ThemedView level="root" style={styles.loadingContainer}>
          <ThemedText color={theme.textMuted}>加载中...</ThemedText>
        </ThemedView>
      </Screen>
    );
  }

  if (!stats) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ThemedView level="root" style={styles.errorContainer}>
          <ThemedText color={theme.error}>加载失败</ThemedText>
        </ThemedView>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 标题 */}
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary}>
            利润统计面板
          </ThemedText>
          <ThemedText variant="body" color={theme.textMuted}>
            AI 调用收益分析
          </ThemedText>
        </ThemedView>

        {/* 概览卡片 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            收益概览
          </ThemedText>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="今日"
              revenue={stats.overview.today.revenue}
              profit={stats.overview.today.profit}
              margin={stats.overview.today.margin}
              theme={theme}
            />
            <StatCard
              title="本周"
              revenue={stats.overview.week.revenue}
              profit={stats.overview.week.profit}
              margin={stats.overview.week.margin}
              theme={theme}
            />
            <StatCard
              title="本月"
              revenue={stats.overview.month.revenue}
              profit={stats.overview.month.profit}
              margin={stats.overview.month.margin}
              theme={theme}
            />
            <StatCard
              title="累计"
              revenue={stats.overview.total.revenue}
              profit={stats.overview.total.profit}
              margin={stats.overview.total.margin}
              theme={theme}
            />
          </View>
        </ThemedView>

        {/* 会员收入 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            本月会员收入
          </ThemedText>
          
          <View style={styles.memberGrid}>
            <MemberCard
              title="会员收入"
              amount={stats.memberRevenue.total}
              theme={theme}
              icon="crown"
              color={theme.primary}
            />
            <MemberCard
              title="普通会员"
              amount={stats.memberRevenue.normal}
              theme={theme}
              icon="user"
              color={theme.accent}
            />
            <MemberCard
              title="超级会员"
              amount={stats.memberRevenue.super}
              theme={theme}
              icon="star"
              color="#FFD700"
            />
          </View>
        </ThemedView>

        {/* AI 调用统计 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            AI 调用次数
          </ThemedText>
          
          <View style={styles.callsGrid}>
            <CallCard title="今日" count={stats.aiCalls.today} theme={theme} />
            <CallCard title="本周" count={stats.aiCalls.week} theme={theme} />
            <CallCard title="本月" count={stats.aiCalls.month} theme={theme} />
            <CallCard title="累计" count={stats.aiCalls.total} theme={theme} />
          </View>
        </ThemedView>

        {/* 热门模型 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            热门模型排行
          </ThemedText>
          
          {stats.topModels.map((model, index) => (
            <ModelItem key={model.name} model={model} rank={index + 1} theme={theme} />
          ))}
        </ThemedView>

        {/* 消费用户排行 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            消费用户排行
          </ThemedText>
          
          {stats.topUsers.map((user, index) => (
            <UserItem key={user.userId} user={user} rank={index + 1} theme={theme} />
          ))}
        </ThemedView>

        {/* 利润趋势 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            近7天利润趋势
          </ThemedText>
          
          {stats.profitTrend.map((day) => (
            <TrendItem key={day.date} day={day} theme={theme} />
          ))}
        </ThemedView>
      </ScrollView>
    </Screen>
  );
}

// ==================== 子组件 ====================

function StatCard({ title, revenue, profit, margin, theme }: {
  title: string;
  revenue: number;
  profit: number;
  margin: number;
  theme: any;
}) {
  return (
    <View style={{
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
    }}>
      <ThemedText variant="caption" color={theme.textMuted}>{title}</ThemedText>
      <ThemedText variant="h3" color={theme.textPrimary} style={{ marginTop: 8 }}>
        ¥{revenue.toFixed(2)}
      </ThemedText>
      <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
        <ThemedText variant="small" color={theme.success}>
          利润: ¥{profit.toFixed(2)}
        </ThemedText>
        <ThemedText variant="small" color={theme.textMuted}>
          {margin.toFixed(1)}%
        </ThemedText>
      </View>
    </View>
  );
}

function MemberCard({ title, amount, theme, icon, color }: {
  title: string;
  amount: number;
  theme: any;
  icon: string;
  color: string;
}) {
  return (
    <View style={{
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      alignItems: 'center',
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: color + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <FontAwesome6 name={icon} size={18} color={color} />
      </View>
      <ThemedText variant="caption" color={theme.textMuted}>{title}</ThemedText>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginTop: 4 }}>
        ¥{amount.toFixed(2)}
      </ThemedText>
    </View>
  );
}

function CallCard({ title, count, theme }: {
  title: string;
  count: number;
  theme: any;
}) {
  return (
    <View style={{
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 8,
      padding: 12,
      flex: 1,
      alignItems: 'center',
    }}>
      <ThemedText variant="caption" color={theme.textMuted}>{title}</ThemedText>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginTop: 4 }}>
        {count}
      </ThemedText>
    </View>
  );
}

function ModelItem({ model, rank, theme }: {
  model: any;
  rank: number;
  theme: any;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: rank <= 3 ? theme.primary + '20' : theme.backgroundTertiary,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ThemedText variant="smallMedium" color={rank <= 3 ? theme.primary : theme.textMuted}>
          {rank}
        </ThemedText>
      </View>
      
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ThemedText variant="bodyMedium" color={theme.textPrimary}>{model.name}</ThemedText>
        <ThemedText variant="caption" color={theme.textMuted}>
          {model.calls} 次调用
        </ThemedText>
      </View>
      
      <View style={{ alignItems: 'flex-end' }}>
        <ThemedText variant="bodyMedium" color={theme.textPrimary}>
          ¥{model.revenue.toFixed(2)}
        </ThemedText>
        <ThemedText variant="caption" color={theme.success}>
          利润 ¥{model.profit.toFixed(2)}
        </ThemedText>
      </View>
    </View>
  );
}

function UserItem({ user, rank, theme }: {
  user: any;
  rank: number;
  theme: any;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: rank <= 3 ? theme.accent + '20' : theme.backgroundTertiary,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ThemedText variant="smallMedium" color={rank <= 3 ? theme.accent : theme.textMuted}>
          {rank}
        </ThemedText>
      </View>
      
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ThemedText variant="bodyMedium" color={theme.textPrimary}>
          {user.userId.slice(0, 8)}...
        </ThemedText>
        <ThemedText variant="caption" color={theme.textMuted}>
          {user.calls} 次调用
        </ThemedText>
      </View>
      
      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
        ¥{user.revenue.toFixed(2)}
      </ThemedText>
    </View>
  );
}

function TrendItem({ day, theme }: {
  day: any;
  theme: any;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    }}>
      <ThemedText variant="small" color={theme.textMuted} style={{ width: 80 }}>
        {day.date}
      </ThemedText>
      
      <View style={{ flex: 1, flexDirection: 'row', gap: 16 }}>
        <ThemedText variant="small" color={theme.textPrimary}>
          收入: ¥{day.revenue.toFixed(2)}
        </ThemedText>
        <ThemedText variant="small" color={theme.textSecondary}>
          成本: ¥{day.cost.toFixed(2)}
        </ThemedText>
        <ThemedText variant="small" color={theme.success}>
          利润: ¥{day.profit.toFixed(2)}
        </ThemedText>
      </View>
    </View>
  );
}
