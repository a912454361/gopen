/**
 * 24小时极速制作监控页面
 * 实时监控80集动漫生产进度
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 生产阶段
const PRODUCTION_PHASES = [
  { id: 'planning', name: '前期策划', hours: '0-2h', icon: 'lightbulb', color: '#8B5CF6' },
  { id: 'asset_prep', name: '资产准备', hours: '2-6h', icon: 'cube', color: '#06B6D4' },
  { id: 'production', name: '核心制作', hours: '6-18h', icon: 'film', color: '#F59E0B' },
  { id: 'post', name: '后期合成', hours: '18-22h', icon: 'wand-magic-sparkles', color: '#10B981' },
  { id: 'output', name: '最终输出', hours: '22-24h', icon: 'flag-checkered', color: '#EF4444' },
];

// AI模型
interface AIModel {
  id: string;
  name: string;
  type: string;
  status: string;
  tasksCompleted: number;
}

// 生产状态
interface ProductionStatus {
  animeTitle: string;
  totalEpisodes: number;
  episodeDuration: number;
  currentPhase: string;
  startTime: string;
  episodesCompleted: number;
  progress: number;
  aiModels: AIModel[];
  estimatedCompletion: string;
}

export default function OneDayProductionScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isStarting, setIsStarting] = useState(false);
  const [status, setStatus] = useState<ProductionStatus | null>(null);
  const [animeTitle, setAnimeTitle] = useState('剑破苍穹');
  const [totalEpisodes, setTotalEpisodes] = useState(80);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // 获取状态
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/one-day-production/status`);
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
        setAutoRefresh(data.data.progress < 100);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  }, []);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchStatus]);

  // 启动生产
  const handleStartProduction = async () => {
    setIsStarting(true);

    try {
      /**
       * 服务端文件：server/src/services/one-day-production-service.ts
       * 接口：POST /api/v1/one-day-production/start
       * Body 参数：animeTitle: string, totalEpisodes: number, episodeDuration: number
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/one-day-production/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeTitle,
          totalEpisodes,
          episodeDuration: 20,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
        setAutoRefresh(true);
        Alert.alert('启动成功', `开始24小时极速制作：${animeTitle}\n目标：${totalEpisodes}集`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Start error:', error);
      Alert.alert('错误', error instanceof Error ? error.message : '启动失败');
    } finally {
      setIsStarting(false);
    }
  };

  // 停止生产
  const handleStopProduction = async () => {
    try {
      await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/one-day-production/stop`, {
        method: 'POST',
      });
      setAutoRefresh(false);
      Alert.alert('已停止', '生产已停止');
    } catch (error) {
      console.error('Stop error:', error);
    }
  };

  // 获取当前阶段索引
  const currentPhaseIndex = PRODUCTION_PHASES.findIndex(p => p.id === status?.currentPhase);

  // 获取状态颜色
  const getStatusColor = (modelStatus: string) => {
    switch (modelStatus) {
      case 'working': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'llm': return 'brain';
      case 'image': return 'image';
      case 'video': return 'film';
      case 'audio': return 'volume-high';
      default: return 'cube';
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            24小时极速制作
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
            一天完成80集国风燃爆动漫
          </ThemedText>
        </View>

        {/* 时间规划 */}
        <ThemedView level="default" style={styles.timelineCard}>
          <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
            时间规划
          </ThemedText>
          <View style={styles.timeline}>
            {PRODUCTION_PHASES.map((phase, index) => (
              <View key={phase.id} style={styles.timelineItem}>
                <View style={[
                  styles.timelineIcon,
                  { 
                    backgroundColor: index <= currentPhaseIndex ? phase.color : theme.backgroundTertiary,
                    borderColor: phase.color,
                  }
                ]}>
                  <FontAwesome6 
                    name={phase.icon} 
                    size={16} 
                    color={index <= currentPhaseIndex ? '#fff' : theme.textMuted} 
                  />
                </View>
                <View style={styles.timelineContent}>
                  <ThemedText 
                    variant="smallMedium" 
                    color={index <= currentPhaseIndex ? theme.textPrimary : theme.textMuted}
                  >
                    {phase.name}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    {phase.hours}
                  </ThemedText>
                </View>
                {index < PRODUCTION_PHASES.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    { backgroundColor: index < currentPhaseIndex ? phase.color : theme.border }
                  ]} />
                )}
              </View>
            ))}
          </View>
        </ThemedView>

        {/* 状态概览 */}
        {status && (
          <ThemedView level="default" style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <ThemedText variant="label" color={theme.textPrimary}>
                {status.animeTitle}
              </ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: `${theme.primary}20` }]}>
                <ThemedText variant="tiny" color={theme.primary}>
                  {status.currentPhase.toUpperCase()}
                </ThemedText>
              </View>
            </View>

            {/* 进度条 */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <ThemedText variant="body" color={theme.textPrimary}>
                  总进度
                </ThemedText>
                <ThemedText variant="h4" color={theme.primary}>
                  {status.progress.toFixed(1)}%
                </ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${status.progress}%`, backgroundColor: theme.primary }
                  ]} 
                />
              </View>
              <ThemedText variant="small" color={theme.textSecondary}>
                已完成 {status.episodesCompleted} / {status.totalEpisodes} 集
              </ThemedText>
            </View>

            {/* 统计 */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText variant="h3" color={theme.primary}>
                  {status.totalEpisodes}
                </ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>总集数</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText variant="h3" color={theme.primary}>
                  {status.episodeDuration}min
                </ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>每集时长</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText variant="h3" color={theme.primary}>
                  {formatTime(status.estimatedCompletion)}
                </ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>预计完成</ThemedText>
              </View>
            </View>
          </ThemedView>
        )}

        {/* AI 模型状态 */}
        {status?.aiModels && (
          <View style={styles.modelsSection}>
            <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
              AI 模型状态
            </ThemedText>
            <View style={styles.modelsGrid}>
              {status.aiModels.map(model => (
                <ThemedView key={model.id} level="default" style={styles.modelCard}>
                  <View style={styles.modelHeader}>
                    <View style={[
                      styles.modelStatus,
                      { backgroundColor: getStatusColor(model.status) }
                    ]} />
                    <FontAwesome6 
                      name={getTypeIcon(model.type)} 
                      size={14} 
                      color={theme.textSecondary} 
                    />
                  </View>
                  <ThemedText variant="small" color={theme.textPrimary}>
                    {model.name}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    完成: {model.tasksCompleted}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          </View>
        )}

        {/* 启动/停止按钮 */}
        {!status || status.progress >= 100 ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartProduction}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
            ) : (
              <>
                <FontAwesome6 name="rocket" size={18} color={theme.buttonPrimaryText} />
                <ThemedText variant="label" color={theme.buttonPrimaryText}>
                  启动24小时极速制作
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.error }]}
            onPress={handleStopProduction}
          >
            <FontAwesome6 name="stop" size={18} color={theme.error} />
            <ThemedText variant="label" color={theme.error}>停止生产</ThemedText>
          </TouchableOpacity>
        )}

        {/* 目标说明 */}
        <ThemedView level="tertiary" style={styles.infoCard}>
          <FontAwesome6 name="circle-info" size={20} color={theme.accent} />
          <View style={styles.infoContent}>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              目标：24小时内完成
            </ThemedText>
            <ThemedText variant="small" color={theme.textSecondary}>
              80集 × 20分钟 = 1600分钟动漫{'\n'}
              使用8个AI模型并行工作{'\n'}
              UE5引擎实时渲染加速
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </Screen>
  );
}
