/**
 * 消费明细页面
 * 展示用户消费记录和统计
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 消费类型
const CONSUMPTION_TYPES: Record<string, { name: string; icon: string; color: string }> = {
  model_chat: { name: 'AI对话', icon: 'message', color: '#4F46E5' },
  model_image: { name: '图像生成', icon: 'image', color: '#EC4899' },
  model_audio: { name: '音频生成', icon: 'music', color: '#8B5CF6' },
  model_video: { name: '视频生成', icon: 'video', color: '#F59E0B' },
  model_embedding: { name: '向量嵌入', icon: 'vector-square', color: '#10B981' },
  gpu_compute: { name: 'GPU计算', icon: 'microchip', color: '#EF4444' },
  storage: { name: '云存储', icon: 'cloud', color: '#06B6D4' },
  ollama: { name: '本地模型', icon: 'server', color: '#6B7280' },
};

// 消费记录
interface ConsumptionRecord {
  id: string;
  type: string;
  typeName: string;
  resourceName: string;
  inputTokens: number;
  outputTokens: number;
  sellTotal: number;
  sellTotalYuan: string;
  status: string;
  createdAt: string;
}

// 统计数据
interface ConsumptionStats {
  totalConsumed: number;
  totalConsumedYuan: string;
  todayConsumed: number;
  todayConsumedYuan: string;
  monthConsumed: number;
  monthConsumedYuan: string;
  yearConsumed: number;
  yearConsumedYuan: string;
  typeStats: Array<{
    type: string;
    typeName: string;
    amount: number;
    amountYuan: string;
    percentage: string;
  }>;
  requestCount: number;
}

export default function ConsumptionScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState('');
  const [records, setRecords] = useState<ConsumptionRecord[]>([]);
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [balance, setBalance] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'stats'>('records');

  // 获取用户ID
  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    };
    fetchUserId();
  }, []);

  /**
   * 获取消费记录
   */
  const fetchRecords = useCallback(async () => {
    if (!userId) return;
    
    try {
      let url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/consumption/user/${userId}?limit=100`;
      if (selectedType) {
        url += `&type=${selectedType}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('Fetch records error:', error);
    }
  }, [userId, selectedType]);

  /**
   * 获取消费统计
   */
  const fetchStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/consumption/stats/${userId}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, [userId]);

  /**
   * 获取余额
   */
  const fetchBalance = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/balance/${userId}`);
      const data = await res.json();
      if (data.success) {
        setBalance(data.data.balance);
      }
    } catch (error) {
      console.error('Fetch balance error:', error);
    }
  }, [userId]);

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchRecords(), fetchStats(), fetchBalance()]);
    setIsLoading(false);
  }, [fetchRecords, fetchStats, fetchBalance]);

  /**
   * 刷新
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  // 初始化加载数据
  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      
      let cancelled = false;
      
      const loadData = async () => {
        setIsLoading(true);
        try {
          await Promise.all([fetchRecords(), fetchStats(), fetchBalance()]);
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };
      
      loadData();
      
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])
  );

  // 格式化时间
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  // 渲染顶部余额卡片
  const renderBalanceCard = () => (
    <LinearGradient
      colors={['#4F46E5', '#7C3AED']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.balanceCard}
    >
      <View style={styles.balanceHeader}>
        <FontAwesome6 name="wallet" size={20} color="#fff" />
        <ThemedText variant="smallMedium" color="rgba(255,255,255,0.8)">账户余额</ThemedText>
      </View>
      
      <ThemedText variant="h1" color="#fff" style={styles.balanceAmount}>
        ¥{(balance / 100).toFixed(2)}
      </ThemedText>
      
      <TouchableOpacity 
        style={styles.rechargeButton}
        onPress={() => router.push('/recharge')}
      >
        <FontAwesome6 name="plus" size={14} color="#fff" />
        <Text style={{ color: '#fff', marginLeft: 4, fontSize: 14 }}>充值</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  // 渲染统计卡片
  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statsCard, { backgroundColor: '#FEF3C7' }]}>
        <ThemedText variant="tiny" color="#92400E">今日消费</ThemedText>
        <ThemedText variant="h4" color="#92400E">
          ¥{stats?.todayConsumedYuan || '0.00'}
        </ThemedText>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#DBEAFE' }]}>
        <ThemedText variant="tiny" color="#1E40AF">本月消费</ThemedText>
        <ThemedText variant="h4" color="#1E40AF">
          ¥{stats?.monthConsumedYuan || '0.00'}
        </ThemedText>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#FCE7F3' }]}>
        <ThemedText variant="tiny" color="#9D174D">累计消费</ThemedText>
        <ThemedText variant="h4" color="#9D174D">
          ¥{stats?.totalConsumedYuan || '0.00'}
        </ThemedText>
      </View>
    </View>
  );

  // 渲染消费类型筛选
  const renderTypeFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.typeFilter}
      contentContainerStyle={{ gap: Spacing.sm }}
    >
      <TouchableOpacity
        style={[
          styles.typeFilterItem,
          selectedType === null && { backgroundColor: theme.primary, borderColor: theme.primary }
        ]}
        onPress={() => setSelectedType(null)}
      >
        <Text style={{ 
          color: selectedType === null ? '#fff' : theme.textSecondary, 
          fontSize: 13 
        }}>
          全部
        </Text>
      </TouchableOpacity>
      
      {Object.entries(CONSUMPTION_TYPES).map(([key, value]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.typeFilterItem,
            selectedType === key && { backgroundColor: theme.primary, borderColor: theme.primary }
          ]}
          onPress={() => setSelectedType(key)}
        >
          <FontAwesome6 
            name={value.icon as any} 
            size={12} 
            color={selectedType === key ? '#fff' : value.color} 
          />
          <Text style={{ 
            color: selectedType === key ? '#fff' : theme.textSecondary, 
            fontSize: 13,
            marginLeft: 4
          }}>
            {value.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // 渲染消费记录项
  const renderRecordItem = (record: ConsumptionRecord) => {
    const typeInfo = CONSUMPTION_TYPES[record.type] || { 
      name: record.typeName, 
      icon: 'circle', 
      color: theme.textMuted 
    };
    
    return (
      <View key={record.id} style={[styles.recordItem, { borderColor: theme.border }]}>
        <View style={styles.recordHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <FontAwesome6 name={typeInfo.icon as any} size={14} color={typeInfo.color} />
          </View>
          
          <View style={styles.recordInfo}>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              {record.resourceName || typeInfo.name}
            </ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>
              {typeInfo.name}
            </ThemedText>
          </View>
          
          <View style={styles.recordAmount}>
            <ThemedText variant="smallMedium" color={theme.error}>
              -¥{record.sellTotalYuan}
            </ThemedText>
          </View>
        </View>
        
        {(record.inputTokens > 0 || record.outputTokens > 0) && (
          <View style={styles.recordDetails}>
            {record.inputTokens > 0 && (
              <ThemedText variant="tiny" color={theme.textMuted}>
                输入: {record.inputTokens.toLocaleString()} tokens
              </ThemedText>
            )}
            {record.outputTokens > 0 && (
              <ThemedText variant="tiny" color={theme.textMuted} style={{ marginLeft: 12 }}>
                输出: {record.outputTokens.toLocaleString()} tokens
              </ThemedText>
            )}
          </View>
        )}
        
        <View style={styles.recordFooter}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            {formatTime(record.createdAt)}
          </ThemedText>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: record.status === 'completed' ? '#D1FAE5' : '#FEF3C7' }
          ]}>
            <Text style={{ 
              color: record.status === 'completed' ? '#059669' : '#D97706', 
              fontSize: 10 
            }}>
              {record.status === 'completed' ? '已完成' : '处理中'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 渲染消费类型统计
  const renderTypeStats = () => (
    <View style={styles.typeStatsContainer}>
      {stats?.typeStats.map((typeStat, index) => {
        const typeInfo = CONSUMPTION_TYPES[typeStat.type] || { 
          name: typeStat.typeName, 
          icon: 'circle', 
          color: theme.textMuted 
        };
        
        return (
          <View key={typeStat.type} style={[styles.typeStatItem, { borderColor: theme.border }]}>
            <View style={styles.typeStatHeader}>
              <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
                <FontAwesome6 name={typeInfo.icon as any} size={16} color={typeInfo.color} />
              </View>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                {typeStat.typeName}
              </ThemedText>
            </View>
            
            <View style={styles.typeStatContent}>
              <ThemedText variant="h3" color={theme.textPrimary}>
                ¥{typeStat.amountYuan}
              </ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>
                占比 {typeStat.percentage}%
              </ThemedText>
            </View>
            
            <View style={styles.typeStatBar}>
              <View 
                style={[
                  styles.typeStatBarFill, 
                  { 
                    backgroundColor: typeInfo.color,
                    width: `${parseFloat(typeStat.percentage)}%` as any
                  }
                ]} 
              />
            </View>
          </View>
        );
      })}
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: Spacing['5xl'] }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {/* 余额卡片 */}
        {renderBalanceCard()}
        
        {/* 统计卡片 */}
        {renderStatsCards()}
        
        {/* Tab 切换 */}
        <View style={styles.tabNav}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'records' && styles.activeTabButton]}
            onPress={() => setActiveTab('records')}
          >
            <FontAwesome6 
              name="list" 
              size={16} 
              color={activeTab === 'records' ? theme.primary : theme.textMuted} 
            />
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'records' ? theme.primary : theme.textMuted }
            ]}>
              消费记录
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'stats' && styles.activeTabButton]}
            onPress={() => setActiveTab('stats')}
          >
            <FontAwesome6 
              name="chart-pie" 
              size={16} 
              color={activeTab === 'stats' ? theme.primary : theme.textMuted} 
            />
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'stats' ? theme.primary : theme.textMuted }
            ]}>
              消费统计
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'records' ? (
          <>
            {/* 类型筛选 */}
            {renderTypeFilter()}
            
            {/* 消费记录列表 */}
            <View style={styles.recordsContainer}>
              {records.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <FontAwesome6 name="receipt" size={48} color={theme.textMuted} />
                  <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                    暂无消费记录
                  </ThemedText>
                </View>
              ) : (
                records.map(renderRecordItem)
              )}
            </View>
          </>
        ) : (
          /* 消费统计 */
          renderTypeStats()
        )}
      </ScrollView>
      
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
      </TouchableOpacity>
    </Screen>
  );
}

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  backButton: {
    position: 'absolute' as const,
    top: Spacing.lg,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  balanceCard: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing['3xl'],
  },
  balanceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  balanceAmount: {
    marginTop: Spacing.md,
    fontSize: 36,
  },
  rechargeButton: {
    position: 'absolute' as const,
    right: Spacing.lg,
    bottom: Spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statsContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center' as const,
  },
  tabNav: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: theme.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  typeFilter: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  typeFilterItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundDefault,
  },
  recordsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    paddingVertical: Spacing['3xl'],
  },
  recordItem: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  recordHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  recordInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  recordAmount: {
    alignItems: 'flex-end' as const,
  },
  recordDetails: {
    flexDirection: 'row' as const,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  recordFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeStatsContainer: {
    paddingHorizontal: Spacing.lg,
  },
  typeStatItem: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  typeStatHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  typeStatContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'baseline' as const,
    marginBottom: Spacing.sm,
  },
  typeStatBar: {
    height: 4,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  typeStatBarFill: {
    height: '100%' as const,
    borderRadius: 2,
  },
});
