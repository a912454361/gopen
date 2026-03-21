import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface UserStats {
  total_works: number;
  total_chats: number;
  total_images: number;
  weekly_works: number;
  monthly_works: number;
  type_stats: Array<{ project_type: string; count: number }>;
  daily_works: Array<{ date: string; count: number }>;
}

const CHART_COLORS = [
  '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#D97706', '#0891B2',
];

export default function StatsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      /**
       * 服务端文件：server/src/routes/stats.ts
       * 接口：GET /api/v1/stats/user/:userId
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/stats/user/${userId}`
      );
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  // 计算最大值用于图表
  const maxDailyCount = useMemo(() => {
    if (!stats?.daily_works?.length) return 10;
    return Math.max(...stats.daily_works.map(d => Number(d.count)), 1);
  }, [stats?.daily_works]);

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="h4" color={theme.textPrimary}>数据统计</ThemedText>
        <ThemedText variant="label" color={theme.textMuted}>创作数据一览</ThemedText>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.neonLine}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 核心数据卡片 */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.primary}20` }]}>
              <FontAwesome6 name="folder" size={20} color={theme.primary} />
            </View>
            <ThemedText variant="h2" color={theme.primary}>{stats?.total_works || 0}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>总作品数</ThemedText>
          </View>

          <View style={[styles.statCard, { borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.accent}20` }]}>
              <FontAwesome6 name="comments" size={20} color={theme.accent} />
            </View>
            <ThemedText variant="h2" color={theme.accent}>{stats?.total_chats || 0}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>对话次数</ThemedText>
          </View>

          <View style={[styles.statCard, { borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: `${theme.success}20` }]}>
              <FontAwesome6 name="calendar-week" size={20} color={theme.success} />
            </View>
            <ThemedText variant="h2" color={theme.success}>{stats?.weekly_works || 0}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>本周创作</ThemedText>
          </View>

          <View style={[styles.statCard, { borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
              <FontAwesome6 name="calendar-days" size={20} color="#F59E0B" />
            </View>
            <ThemedText variant="h2" color="#F59E0B">{stats?.monthly_works || 0}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>本月创作</ThemedText>
          </View>
        </View>

        {/* 近7天创作趋势 */}
        <View style={styles.sectionTitle}>
          <FontAwesome6 name="chart-line" size={16} color={theme.primary} />
          <ThemedText variant="label" color={theme.textPrimary}>近7天创作趋势</ThemedText>
        </View>

        <View style={[styles.chartCard, { borderColor: theme.border }]}>
          <View style={styles.chartBars}>
            {(stats?.daily_works || []).slice(0, 7).map((day, index) => {
              const height = Math.max(20, (Number(day.count) / maxDailyCount) * 120);
              return (
                <LinearGradient
                  key={index}
                  colors={[theme.primary, theme.accent]}
                  style={[styles.chartBar, { height }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              );
            })}
          </View>
          <View style={styles.chartLabels}>
            {(stats?.daily_works || []).slice(0, 7).map((day, index) => {
              const date = new Date(day.date);
              return (
                <ThemedText key={index} variant="tiny" color={theme.textMuted} style={styles.chartLabel}>
                  {date.getMonth() + 1}/{date.getDate()}
                </ThemedText>
              );
            })}
          </View>
        </View>

        {/* 作品类型分布 */}
        <View style={styles.sectionTitle}>
          <FontAwesome6 name="chart-pie" size={16} color={theme.accent} />
          <ThemedText variant="label" color={theme.textPrimary}>作品类型分布</ThemedText>
        </View>

        <View style={[styles.chartCard, { borderColor: theme.border }]}>
          <View style={styles.typeList}>
            {(stats?.type_stats || []).map((item, index) => {
              const color = CHART_COLORS[index % CHART_COLORS.length];
              const maxCount = Math.max(...(stats?.type_stats?.map(t => t.count) || [1]));
              const width = Math.max(10, (item.count / maxCount) * 100);

              return (
                <View key={index} style={styles.typeItem}>
                  <View style={[styles.typeColor, { backgroundColor: color }]} />
                  <ThemedText variant="labelSmall" color={theme.textSecondary} style={{ width: 80 }}>
                    {item.project_type}
                  </ThemedText>
                  <View style={[styles.typeBar, { backgroundColor: `${color}30` }]}>
                    <View style={[styles.typeBar, { backgroundColor: color, width: `${width}%` }]} />
                  </View>
                  <ThemedText variant="labelSmall" color={theme.textPrimary} style={styles.typeCount}>
                    {item.count}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
