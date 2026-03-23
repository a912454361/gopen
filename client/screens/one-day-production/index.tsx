/**
 * 24小时极速制作监控页面
 * 实时监控80集动漫生产进度
 * 使用 SSE 接收实时进度推送
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
  RefreshControl,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import RNSSE from 'react-native-sse';

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
  currentTask?: string;
  tasksCompleted: number;
  tasksFailed?: number;
  totalTokens?: number;
}

// 集数状态
interface Episode {
  number: number;
  title: string;
  status: string;
  progress: number;
  videoUrl?: string;
  audioUrl?: string;
}

// 生产状态
interface ProductionStatus {
  id: string;
  animeTitle: string;
  totalEpisodes: number;
  episodeDuration: number;
  currentPhase: string;
  startTime: string;
  episodesCompleted: number;
  progress: number;
  status: string;
  aiModels: AIModel[];
  estimatedCompletion: string;
  totalTokensUsed?: number;
}

// UE5 状态
interface UE5Status {
  connected: boolean;
  lastHeartbeat?: string;
  activeScripts: string[];
}

// 任务队列状态
interface QueueStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

// SSE 消息
interface SSEMessage {
  type: 'init' | 'phase' | 'episode' | 'model' | 'progress' | 'error' | 'complete';
  data: Record<string, unknown>;
  timestamp: string;
}

export default function OneDayProductionScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isStarting, setIsStarting] = useState(false);
  const [status, setStatus] = useState<ProductionStatus | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [animeTitle, setAnimeTitle] = useState('剑破苍穹');
  const [totalEpisodes, setTotalEpisodes] = useState(80);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [ue5Status, setUE5Status] = useState<UE5Status | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);

  const sseRef = useRef<any>(null);
  const productionIdRef = useRef<string | null>(null);

  // 添加日志
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  // 连接 SSE
  const connectSSE = useCallback((productionId: string) => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/one-day-production/${productionId}/stream`;
    addLog(`连接 SSE: ${url}`);

    const sse = new RNSSE(url, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    sse.addEventListener('open', () => {
      addLog('SSE 连接已建立');
      setSseConnected(true);
    });

    sse.addEventListener('message', (event: any) => {
      try {
        if (event.data === '[DONE]') {
          sse.close();
          setSseConnected(false);
          addLog('SSE 流结束');
          return;
        }

        const message: SSEMessage = JSON.parse(event.data);
        handleSSEMessage(message);
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    });

    sse.addEventListener('error', (event: any) => {
      const errorMsg = event?.message || 'Unknown';
      addLog(`SSE 错误: ${errorMsg}`);
      setSseConnected(false);
    });

    sse.addEventListener('close', () => {
      addLog('SSE 连接已关闭');
      setSseConnected(false);
    });

    sseRef.current = sse;
    productionIdRef.current = productionId;
  }, [addLog]);

  // 处理 SSE 消息
  const handleSSEMessage = useCallback((message: SSEMessage) => {
    setLastUpdate(new Date());

    switch (message.type) {
      case 'init': {
        setStatus(message.data as unknown as ProductionStatus);
        addLog('收到初始状态');
        break;
      }

      case 'phase': {
        const phaseData = message.data as { phase: string; name: string };
        addLog(`进入阶段: ${phaseData.name}`);
        if (status) {
          setStatus({ ...status, currentPhase: phaseData.phase });
        }
        break;
      }

      case 'episode': {
        const episodeData = message.data as { episodeNumber: number; status: string; progress: number };
        addLog(`第${episodeData.episodeNumber}集: ${episodeData.status} (${episodeData.progress}%)`);
        setEpisodes(prev => {
          const updated = [...prev];
          const idx = episodeData.episodeNumber - 1;
          if (updated[idx]) {
            updated[idx] = { ...updated[idx], ...episodeData };
          }
          return updated;
        });
        break;
      }

      case 'model': {
        const modelData = message.data as { modelId: string; status: string; currentTask?: string };
        if (status?.aiModels) {
          setStatus({
            ...status,
            aiModels: status.aiModels.map(m =>
              m.id === modelData.modelId ? { ...m, status: modelData.status, currentTask: modelData.currentTask } : m
            ),
          });
        }
        break;
      }

      case 'progress': {
        const progressData = message.data as { progress: number; episodesCompleted: number };
        if (status) {
          setStatus({
            ...status,
            progress: progressData.progress,
            episodesCompleted: progressData.episodesCompleted,
          });
        }
        break;
      }

      case 'error': {
        const errorData = message.data as { error: string };
        addLog(`错误: ${errorData.error}`);
        Alert.alert('生产错误', errorData.error);
        break;
      }

      case 'complete': {
        const completeData = message.data as { productionId: string; totalEpisodes: number };
        addLog(`制作完成！共 ${completeData.totalEpisodes} 集`);
        Alert.alert('制作完成', `24小时极速制作已完成！\n共 ${completeData.totalEpisodes} 集`);
        if (status) {
          setStatus({ ...status, status: 'completed', progress: 100 });
        }
        break;
      }
    }
  }, [status, addLog]);

  // 断开 SSE
  const disconnectSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setSseConnected(false);
    productionIdRef.current = null;
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      disconnectSSE();
    };
  }, [disconnectSSE]);

  // 创建并启动生产
  const handleStartProduction = async () => {
    setIsStarting(true);

    try {
      /**
       * 服务端文件：server/src/services/one-day-production-service.ts
       * 接口：POST /api/v1/one-day-production/create
       * Body 参数：animeTitle: string, totalEpisodes: number, episodeDuration: number, style: string, genre: string
       */
      const createResponse = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/one-day-production/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeTitle,
          totalEpisodes,
          episodeDuration: 20,
          style: 'chinese',
          genre: '仙侠',
        }),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        throw new Error(createData.error);
      }

      const productionId = createData.data.id;
      addLog(`创建成功: ${productionId}`);

      // 初始化集数列表
      setEpisodes(Array.from({ length: totalEpisodes }, (_, i) => ({
        number: i + 1,
        title: `${animeTitle} 第${i + 1}集`,
        status: 'pending',
        progress: 0,
      })));

      // 启动生产
      const startResponse = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/one-day-production/${productionId}/start`, {
        method: 'POST',
      });

      const startData = await startResponse.json();

      if (!startData.success) {
        throw new Error(startData.error);
      }

      setStatus(startData.data);
      addLog('生产已启动');

      // 连接 SSE
      connectSSE(productionId);

      Alert.alert('启动成功', `开始24小时极速制作：${animeTitle}\n目标：${totalEpisodes}集`);
    } catch (error) {
      console.error('Start error:', error);
      addLog(`启动失败: ${error instanceof Error ? error.message : 'Unknown'}`);
      Alert.alert('错误', error instanceof Error ? error.message : '启动失败');
    } finally {
      setIsStarting(false);
    }
  };

  // 手动刷新
  const handleRefresh = async () => {
    if (!productionIdRef.current) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/one-day-production/${productionIdRef.current}/status`);
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 获取当前阶段索引
  const currentPhaseIndex = PRODUCTION_PHASES.findIndex(p => p.id === status?.currentPhase);

  // 获取状态颜色
  const getStatusColor = (modelStatus: string) => {
    switch (modelStatus) {
      case 'working': return '#10B981';
      case 'error': return '#EF4444';
      case 'idle': return '#9CA3AF';
      default: return '#F59E0B';
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
                24小时极速制作
              </ThemedText>
              <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
                一天完成80集国风燃爆动漫
              </ThemedText>
            </View>
            {/* SSE 连接状态 */}
            <View style={[styles.connectionBadge, { backgroundColor: sseConnected ? '#10B981' : '#9CA3AF' }]}>
              <FontAwesome6 
                name={sseConnected ? 'wifi' : 'wifi-slash'} 
                size={12} 
                color="#fff" 
              />
            </View>
          </View>
          
          {/* 最后更新时间 */}
          {lastUpdate && (
            <ThemedText variant="tiny" color={theme.textMuted}>
              最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
            </ThemedText>
          )}
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
                    { width: `${Math.min(status.progress, 100)}%`, backgroundColor: theme.primary }
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
              {status.totalTokensUsed !== undefined && (
                <View style={styles.statItem}>
                  <ThemedText variant="h3" color={theme.primary}>
                    {(status.totalTokensUsed / 1000).toFixed(1)}K
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>Tokens</ThemedText>
                </View>
              )}
            </View>
          </ThemedView>
        )}

        {/* AI 模型状态 */}
        {status?.aiModels && status.aiModels.length > 0 && (
          <View style={styles.modelsSection}>
            <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
              AI 模型状态 ({status.aiModels.length}个并行)
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
                  <ThemedText variant="small" color={theme.textPrimary} numberOfLines={1}>
                    {model.name}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    完成: {model.tasksCompleted}
                  </ThemedText>
                  {model.currentTask && (
                    <ThemedText variant="tiny" color={theme.primary} numberOfLines={1}>
                      {model.currentTask}
                    </ThemedText>
                  )}
                </ThemedView>
              ))}
            </View>
          </View>
        )}

        {/* UE5 & 队列状态 */}
        {(ue5Status || queueStats) && (
          <ThemedView level="default" style={styles.statusCard}>
            <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
              系统状态
            </ThemedText>
            <View style={styles.systemStatusGrid}>
              {/* UE5 状态 */}
              <View style={styles.systemStatusItem}>
                <View style={styles.systemStatusHeader}>
                  <FontAwesome6 name="gamepad" size={16} color={ue5Status?.connected ? '#10B981' : '#9CA3AF'} />
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>UE5</ThemedText>
                </View>
                <ThemedText variant="tiny" color={ue5Status?.connected ? '#10B981' : '#9CA3AF'}>
                  {ue5Status?.connected ? '已连接' : '模拟模式'}
                </ThemedText>
                {ue5Status?.activeScripts && ue5Status.activeScripts.length > 0 && (
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    脚本: {ue5Status.activeScripts.length}
                  </ThemedText>
                )}
              </View>
              
              {/* 任务队列 */}
              {queueStats && (
                <View style={styles.systemStatusItem}>
                  <View style={styles.systemStatusHeader}>
                    <FontAwesome6 name="list-check" size={16} color={theme.primary} />
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>队列</ThemedText>
                  </View>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    运行: {queueStats.running} | 等待: {queueStats.pending}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    完成: {queueStats.completed} | 失败: {queueStats.failed}
                  </ThemedText>
                </View>
              )}
            </View>
          </ThemedView>
        )}

        {/* 实时日志 */}
        {logs.length > 0 && (
          <ThemedView level="default" style={styles.logsCard}>
            <View style={styles.logsHeader}>
              <ThemedText variant="label" color={theme.textPrimary}>
                实时日志
              </ThemedText>
              <TouchableOpacity onPress={() => setLogs([])}>
                <FontAwesome6 name="trash" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.logsList} nestedScrollEnabled>
              {logs.map((log, index) => (
                <ThemedText key={index} variant="tiny" color={theme.textMuted} style={styles.logItem}>
                  {log}
                </ThemedText>
              ))}
            </ScrollView>
          </ThemedView>
        )}

        {/* 启动按钮 */}
        {(!status || status.status === 'completed') && (
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
        )}

        {/* 进行中状态 */}
        {status && status.status === 'running' && (
          <View style={styles.runningIndicator}>
            <ActivityIndicator size="small" color={theme.primary} />
            <ThemedText variant="small" color={theme.textSecondary}>
              正在生产中...
            </ThemedText>
          </View>
        )}

        {/* 目标说明 */}
        <ThemedView level="tertiary" style={styles.infoCard}>
          <FontAwesome6 name="circle-info" size={20} color={theme.accent} />
          <View style={styles.infoContent}>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              目标：24小时内完成
            </ThemedText>
            <ThemedText variant="tiny" color={theme.textSecondary}>
              • 8个AI模型并行处理{'\n'}
              • 5个生产阶段流水线{'\n'}
              • 自动故障转移与重试{'\n'}
              • 实时进度监控
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </Screen>
  );
}
