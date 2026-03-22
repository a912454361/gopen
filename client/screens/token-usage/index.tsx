import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface TokenUsage {
  today: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    calls: number;
  };
  month: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    calls: number;
  };
  total: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    calls: number;
  };
  balance: {
    available: number;
    recharged: number;
    consumed: number;
  };
  recentUsage: RecentUsage[];
}

interface RecentUsage {
  id: string;
  resource_name: string;
  input_tokens: number;
  output_tokens: number;
  sell_total: number;
  created_at: string;
}

type TabType = 'today' | 'month' | 'total';

// 提供商颜色
const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97706',
  google: '#4285F4',
  deepseek: '#0066FF',
  zhipu: '#1A73E8',
  qwen: '#FF6A00',
  doubao: '#3370FF',
};

export default function TokenUsageScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember } = useMembership();
  const router = useSafeRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      /**
       * 服务端文件：server/src/routes/user.ts
       * 接口：GET /api/v1/user/:userId/token-usage
       */
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/${userId}/token-usage`
      );
      const data = await res.json();

      if (data.success) {
        setUsage(data.data);
      }
    } catch (error) {
      console.error('Fetch token usage error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const currentStats = usage ? usage[activeTab] : null;

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <FontAwesome6 name="chart-line" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText variant="h3" color={theme.textPrimary}>Token 用量统计</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                查看 AI 使用详情
              </ThemedText>
            </View>
          </View>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* 余额卡片 */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <ThemedText variant="caption" color="rgba(255,255,255,0.8)" style={styles.balanceLabel}>
            账户余额
          </ThemedText>
          <View style={styles.balanceRow}>
            <ThemedText variant="h3" color="#fff" style={styles.balanceCurrency}>¥</ThemedText>
            <ThemedText variant="h1" color="#fff" style={styles.balanceAmount}>
              {((usage?.balance.available || 0) / 100).toFixed(2)}
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={styles.rechargeButton}
            onPress={() => router.push('/payment', { amount: 1000, productType: 'recharge' })}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.rechargeButtonGradient}
            >
              <FontAwesome6 name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText variant="smallMedium" color="#fff">充值</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Tab切换 */}
        <View style={[styles.tabContainer, { backgroundColor: theme.backgroundTertiary }]}>
          {(['today', 'month', 'total'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText
                variant="smallMedium"
                color={activeTab === tab ? '#fff' : theme.textPrimary}
              >
                {tab === 'today' ? '今日' : tab === 'month' ? '本月' : '累计'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 统计卡片 */}
        <View style={styles.statsGrid}>
          <ThemedView level="default" style={[styles.statCard, { borderColor: theme.border }]}>
            <ThemedText variant="h4" color={theme.primary} style={styles.statValue}>
              {formatNumber(currentStats?.totalTokens || 0)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
              总 Token
            </ThemedText>
            <View style={styles.statTrend}>
              <FontAwesome6 name="arrow-down" size={10} color={theme.textMuted} />
              <ThemedText variant="tiny" color={theme.textMuted}>
                输入 {formatNumber(currentStats?.inputTokens || 0)}
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView level="default" style={[styles.statCard, { borderColor: theme.border }]}>
            <ThemedText variant="h4" color={theme.accent} style={styles.statValue}>
              {formatNumber(currentStats?.outputTokens || 0)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
              输出 Token
            </ThemedText>
            <View style={styles.statTrend}>
              <FontAwesome6 name="arrow-up" size={10} color={theme.textMuted} />
              <ThemedText variant="tiny" color={theme.textMuted}>
                生成内容
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView level="default" style={[styles.statCard, { borderColor: theme.border }]}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.statValue}>
              {currentStats?.calls || 0}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
              调用次数
            </ThemedText>
            <View style={styles.statTrend}>
              <FontAwesome6 name="bolt" size={10} color={theme.textMuted} />
              <ThemedText variant="tiny" color={theme.textMuted}>
                AI 请求
              </ThemedText>
            </View>
          </ThemedView>

          <ThemedView level="default" style={[styles.statCard, { borderColor: theme.border }]}>
            <ThemedText variant="h4" color={theme.success} style={styles.statValue}>
              ¥{((usage?.balance.recharged || 0) / 100).toFixed(0)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
              累计充值
            </ThemedText>
            <View style={styles.statTrend}>
              <FontAwesome6 name="wallet" size={10} color={theme.textMuted} />
              <ThemedText variant="tiny" color={theme.textMuted}>
                ¥{((usage?.balance.consumed || 0) / 100).toFixed(0)} 已消费
              </ThemedText>
            </View>
          </ThemedView>
        </View>

        {/* 最近使用记录 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="label" color={theme.textMuted}>最近使用</ThemedText>
            <TouchableOpacity onPress={() => router.push('/bill')}>
              <ThemedText variant="small" color={theme.primary}>查看全部</ThemedText>
            </TouchableOpacity>
          </View>

          {usage?.recentUsage && usage.recentUsage.length > 0 ? (
            usage.recentUsage.map((item, index) => {
              const providerColor = Object.values(PROVIDER_COLORS).find(
                (_, i) => index % Object.keys(PROVIDER_COLORS).length === i
              ) || theme.primary;

              return (
                <ThemedView
                  key={item.id || index}
                  level="default"
                  style={[styles.usageItem, { borderColor: theme.border }]}
                >
                  <View style={styles.usageHeader}>
                    <View style={styles.usageModel}>
                      <View style={[styles.usageModelIcon, { backgroundColor: providerColor + '20' }]}>
                        <FontAwesome6 name="robot" size={14} color={providerColor} />
                      </View>
                      <View>
                        <ThemedText variant="smallMedium" color={theme.textPrimary}>
                          {item.resource_name}
                        </ThemedText>
                        <ThemedText variant="caption" color={theme.textMuted}>
                          {formatDate(item.created_at)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.usageTokens}>
                      <ThemedText variant="smallMedium" color={theme.textPrimary}>
                        {formatNumber(item.input_tokens + item.output_tokens)} tokens
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.error}>
                        -¥{(item.sell_total / 100).toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min((item.output_tokens / (item.input_tokens + item.output_tokens || 1)) * 100, 100)}%`,
                          backgroundColor: providerColor 
                        }
                      ]} 
                    />
                  </View>
                </ThemedView>
              );
            })
          ) : (
            <ThemedView level="default" style={[styles.usageItem, { borderColor: theme.border }]}>
              <ThemedText variant="small" color={theme.textMuted} style={{ textAlign: 'center' }}>
                暂无使用记录
              </ThemedText>
            </ThemedView>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
