/**
 * 模型同步管理面板
 * 管理商家模型的自动同步
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 同步状态
interface SyncStatus {
  provider: string;
  lastSync: string | null;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
  modelsAdded: number;
  modelsUpdated: number;
  modelsDeactivated: number;
}

// 同步日志
interface SyncLog {
  id: string;
  provider: string;
  status: 'success' | 'error';
  data: string;
  created_at: string;
}

// 模型信息
interface Model {
  code: string;
  name: string;
  provider: string;
  status: string;
  cost_input_price: number;
  cost_output_price: number;
  sell_input_price: number;
  sell_output_price: number;
}

// 提供商名称映射
const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
  deepseek: 'DeepSeek',
  groq: 'Groq',
  mistral: 'Mistral AI',
  cohere: 'Cohere',
  stability: 'Stability AI',
  doubao: '豆包',
  qwen: '通义千问',
  wenxin: '文心一言',
  zhipu: '智谱AI',
  moonshot: 'Moonshot',
  minimax: 'MiniMax',
  spark: '讯飞星火',
  hunyuan: '腾讯混元',
  yi: '零一万物',
  baichuan: '百川智能',
};

// 提供商颜色
const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97706',
  google: '#4285F4',
  deepseek: '#0066FF',
  groq: '#F55036',
  doubao: '#3370FF',
  qwen: '#FF6A00',
  wenxin: '#2932E1',
  zhipu: '#1A73E8',
};

export default function ModelSyncPanel() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'models'>('status');

  /**
   * 获取同步状态
   */
  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/model-sync/status`);
      const data = await res.json();
      if (data.success) {
        setSyncStatus(data.data);
      }
    } catch (error) {
      console.error('Fetch sync status error:', error);
    }
  }, []);

  /**
   * 获取同步日志
   */
  const fetchSyncLogs = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/model-sync/logs?limit=20`);
      const data = await res.json();
      if (data.success) {
        setSyncLogs(data.data);
      }
    } catch (error) {
      console.error('Fetch sync logs error:', error);
    }
  }, []);

  /**
   * 获取模型列表
   */
  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/models`);
      const data = await res.json();
      if (data.success) {
        setModels(data.data.map((m: any) => ({
          code: m.code,
          name: m.name,
          provider: m.provider,
          status: m.status || 'active',
          // API返回的字段是 inputPrice/outputPrice，前端需要映射
          cost_input_price: m.inputPrice || 0,
          cost_output_price: m.outputPrice || 0,
          sell_input_price: m.inputPrice || 0,
          sell_output_price: m.outputPrice || 0,
        })));
      }
    } catch (error) {
      console.error('Fetch models error:', error);
    }
  }, []);

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchSyncStatus(), fetchSyncLogs(), fetchModels()]);
    setIsLoading(false);
  }, [fetchSyncStatus, fetchSyncLogs, fetchModels]);

  /**
   * 刷新数据
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  /**
   * 同步所有商家
   */
  const handleSyncAll = useCallback(async () => {
    Alert.alert(
      '确认同步',
      '将同步所有商家的模型，这可能需要几分钟时间。确定继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            setIsLoading(true);
            try {
              const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/model-sync/sync-all`, {
                method: 'POST',
              });
              const data = await res.json();
              
              if (data.success) {
                const { summary } = data.data;
                Alert.alert(
                  '同步完成',
                  `成功: ${summary.success}/${summary.total}\n新增: ${summary.modelsAdded}\n更新: ${summary.modelsUpdated}\n下线: ${summary.modelsDeactivated}`
                );
                await loadAllData();
              } else {
                Alert.alert('同步失败', data.error || '未知错误');
              }
            } catch (error) {
              console.error('Sync all error:', error);
              Alert.alert('同步失败', '网络错误');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [loadAllData]);

  /**
   * 同步单个商家
   */
  const handleSyncProvider = useCallback(async (provider: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/model-sync/sync/${provider}`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('同步完成', data.message);
        await loadAllData();
      } else {
        Alert.alert('同步失败', data.error || '未知错误');
      }
    } catch (error) {
      console.error('Sync provider error:', error);
      Alert.alert('同步失败', '网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [loadAllData]);

  /**
   * 切换模型状态
   */
  const handleToggleModelStatus = useCallback(async (modelCode: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? '上线' : '下线';
    
    Alert.alert(
      `确认${action}`,
      `确定要${action}模型 ${modelCode} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/model-sync/models/${modelCode}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
              });
              const data = await res.json();
              
              if (data.success) {
                Alert.alert('操作成功', data.message);
                await fetchModels();
              } else {
                Alert.alert('操作失败', data.error || '未知错误');
              }
            } catch (error) {
              console.error('Toggle status error:', error);
              Alert.alert('操作失败', '网络错误');
            }
          },
        },
      ]
    );
  }, [fetchModels]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 渲染状态标签
  const renderStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      idle: theme.textMuted,
      syncing: '#F59E0B',
      error: '#EF4444',
    };
    
    const labels: Record<string, string> = {
      idle: '空闲',
      syncing: '同步中',
      error: '错误',
    };
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: colors[status] + '20' }]}>
        <Text style={{ color: colors[status], fontSize: 11, fontWeight: '600' }}>
          {labels[status]}
        </Text>
      </View>
    );
  };

  // 渲染同步状态Tab
  const renderStatusTab = () => (
    <View style={styles.tabContent}>
      {/* 同步按钮 */}
      <TouchableOpacity 
        style={[styles.syncButton, { backgroundColor: theme.primary }]}
        onPress={handleSyncAll}
        disabled={isLoading}
      >
        <FontAwesome6 name="rotate" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.syncButtonText}>同步所有商家</Text>
      </TouchableOpacity>

      {/* 商家列表 */}
      <View style={styles.providerList}>
        {syncStatus.map((status) => {
          const providerColor = PROVIDER_COLORS[status.provider] || theme.primary;
          const providerName = PROVIDER_NAMES[status.provider] || status.provider;
          
          return (
            <View key={status.provider} style={[styles.providerCard, { borderColor: theme.border }]}>
              <View style={styles.providerHeader}>
                <View style={[styles.providerIcon, { backgroundColor: providerColor + '20' }]}>
                  <FontAwesome6 name="building" size={16} color={providerColor} />
                </View>
                <View style={styles.providerInfo}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {providerName}
                  </ThemedText>
                  {status.lastSync && (
                    <ThemedText variant="caption" color={theme.textMuted}>
                      上次同步: {new Date(status.lastSync).toLocaleString('zh-CN')}
                    </ThemedText>
                  )}
                </View>
                {renderStatusBadge(status.status)}
              </View>
              
              {status.error && (
                <View style={[styles.errorBox, { backgroundColor: '#FEF2F2' }]}>
                  <Text style={{ color: '#EF4444', fontSize: 12 }}>{status.error}</Text>
                </View>
              )}
              
              <View style={styles.providerStats}>
                <View style={styles.statItem}>
                  <Text style={{ color: theme.success, fontSize: 14, fontWeight: '600' }}>
                    +{status.modelsAdded}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10 }}>新增</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>
                    {status.modelsUpdated}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10 }}>更新</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '600' }}>
                    -{status.modelsDeactivated}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 10 }}>下线</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.miniButton, { borderColor: theme.primary }]}
                  onPress={() => handleSyncProvider(status.provider)}
                >
                  <Text style={{ color: theme.primary, fontSize: 11 }}>同步</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  // 渲染日志Tab
  const renderLogsTab = () => (
    <ScrollView style={styles.tabContent}>
      {syncLogs.map((log) => {
        const providerName = PROVIDER_NAMES[log.provider] || log.provider;
        const isSuccess = log.status === 'success';
        
        return (
          <View key={log.id} style={[styles.logItem, { borderColor: theme.border }]}>
            <View style={styles.logHeader}>
              <FontAwesome6 
                name={isSuccess ? 'check-circle' : 'times-circle'} 
                size={16} 
                color={isSuccess ? theme.success : '#EF4444'} 
              />
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginLeft: 8 }}>
                {providerName}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginLeft: 'auto' }}>
                {new Date(log.created_at).toLocaleString('zh-CN')}
              </ThemedText>
            </View>
            {!isSuccess && (
              <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>
                {log.data}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  // 渲染模型Tab
  const renderModelsTab = () => (
    <ScrollView style={styles.tabContent}>
      {models.map((model) => {
        const providerColor = PROVIDER_COLORS[model.provider] || theme.primary;
        
        return (
          <View key={model.code} style={[styles.modelItem, { borderColor: theme.border }]}>
            <View style={styles.modelHeader}>
              <View style={[styles.modelIcon, { backgroundColor: providerColor + '20' }]}>
                <FontAwesome6 name="brain" size={14} color={providerColor} />
              </View>
              <View style={styles.modelInfo}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {model.name}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {model.code}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[
                  styles.statusToggle,
                  { backgroundColor: model.status === 'active' ? theme.success + '20' : theme.textMuted + '20' }
                ]}
                onPress={() => handleToggleModelStatus(model.code, model.status)}
              >
                <Text style={{ 
                  color: model.status === 'active' ? theme.success : theme.textMuted, 
                  fontSize: 11 
                }}>
                  {model.status === 'active' ? '在线' : '离线'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modelPricing}>
              <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                {`成本: ¥${(model.cost_input_price/1000).toFixed(4)}/¥${(model.cost_output_price/1000).toFixed(4)}`}
              </Text>
              <Text style={{ color: theme.primary, fontSize: 11, marginLeft: 12 }}>
                {`售价: ¥${(model.sell_input_price/1000).toFixed(4)}/¥${(model.sell_output_price/1000).toFixed(4)}`}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab 导航 */}
      <View style={styles.tabNav}>
        {(['status', 'logs', 'models'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <FontAwesome6
              name={tab === 'status' ? 'sync' : tab === 'logs' ? 'list' : 'brain'}
              size={16}
              color={activeTab === tab ? theme.primary : theme.textMuted}
            />
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === tab ? theme.primary : theme.textMuted }
            ]}>
              {tab === 'status' ? '同步状态' : tab === 'logs' ? '同步日志' : '模型管理'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab 内容 */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'status' && renderStatusTab()}
        {activeTab === 'logs' && renderLogsTab()}
        {activeTab === 'models' && renderModelsTab()}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundRoot,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  tabNav: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: Spacing.lg,
  },
  syncButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  providerList: {
    gap: Spacing.md,
  },
  providerCard: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  providerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  providerIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  providerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  errorBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  providerStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  miniButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  logItem: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  modelItem: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  modelHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  modelIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modelInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  statusToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  modelPricing: {
    flexDirection: 'row' as const,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
});
