import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';

interface FreeModel {
  key: string;
  name: string;
  provider: string;
  type: string;
  dailyLimit: string | number;
  features: string[];
  quality: number;
  speed: number;
  priority: number;
  status: string;
}

interface UsageStats {
  model: string;
  dailyUsed: number;
  dailyLimit: string | number;
  successRate: number;
  avgLatency: number;
}

export default function FreeModelScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [models, setModels] = useState<FreeModel[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/anime-video/free-models`);
      const data = await response.json();
      if (data.success) {
        setModels(data.data.models);
        setUsageStats(data.data.usage_stats);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchModels();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchModels();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fully_free':
        return theme.success;
      case 'platform_free':
        return theme.primary;
      case 'free_trial':
        return theme.accent;
      case 'free_credits':
        return '#FF9500';
      case 'free_api':
        return '#34C759';
      default:
        return theme.textMuted;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fully_free':
        return '完全免费';
      case 'platform_free':
        return '平台免费';
      case 'free_trial':
        return '免费试用';
      case 'free_credits':
        return '免费额度';
      case 'free_api':
        return '免费API';
      default:
        return type;
    }
  };

  const renderModelCard = ({ item }: { item: FreeModel }) => {
    const usage = usageStats.find(s => s.model === item.key);
    const typeColor = getTypeColor(item.type);

    return (
      <ThemedView level="default" style={styles.modelCard}>
        <View style={styles.modelHeader}>
          <View style={styles.modelInfo}>
            <ThemedText variant="h4" style={styles.modelName}>
              {item.name}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              {item.provider}
            </ThemedText>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <ThemedText variant="caption" style={{ color: typeColor }}>
              {getTypeLabel(item.type)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.featuresRow}>
          {item.features.map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <ThemedText variant="small" color={theme.textSecondary}>
                {feature}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome6 name="wand-magic-sparkles" size={14} color={theme.primary} />
            <ThemedText variant="caption" color={theme.textMuted}> 质量 </ThemedText>
            <ThemedText variant="smallMedium" style={{ color: theme.primary }}>
              {item.quality}%
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="bolt" size={14} color={theme.accent} />
            <ThemedText variant="caption" color={theme.textMuted}> 速度 </ThemedText>
            <ThemedText variant="smallMedium" style={{ color: theme.accent }}>
              {item.speed}%
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="clock" size={14} color={theme.textSecondary} />
            <ThemedText variant="caption" color={theme.textMuted}> 每日 </ThemedText>
            <ThemedText variant="smallMedium">
              {item.dailyLimit}
            </ThemedText>
          </View>
        </View>

        {usage && (
          <View style={styles.usageRow}>
            <View style={styles.usageBar}>
              <View 
                style={[
                  styles.usageProgress, 
                  { 
                    width: `${Math.min(100, (usage.dailyUsed / (typeof usage.dailyLimit === 'number' ? usage.dailyLimit : 100)) * 100)}%`,
                    backgroundColor: theme.primary,
                  }
                ]} 
              />
            </View>
            <ThemedText variant="caption" color={theme.textMuted}>
              今日已用 {usage.dailyUsed} / {usage.dailyLimit}
            </ThemedText>
          </View>
        )}
      </ThemedView>
    );
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="body" color={theme.textMuted} style={styles.loadingText}>
            加载免费模型...
          </ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <ThemedView level="root" style={styles.header}>
          <View style={styles.titleRow}>
            <FontAwesome6 name="gift" size={24} color={theme.primary} />
            <ThemedText variant="h2" style={styles.title}>
              免费模型库
            </ThemedText>
          </View>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
            整合9款免费视频生成模型，一键急速制作优质动漫
          </ThemedText>
        </ThemedView>

        {/* Stats Summary */}
        <ThemedView level="default" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText variant="h1" style={{ color: theme.primary }}>
                {models.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                可用模型
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <ThemedText variant="h1" style={{ color: theme.success }}>
                {models.filter(m => m.type === 'fully_free').length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                完全免费
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <ThemedText variant="h1" style={{ color: theme.accent }}>
                ∞
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                无限使用
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Model List */}
        <View style={styles.section}>
          <ThemedText variant="h4" style={styles.sectionTitle}>
            可用模型
          </ThemedText>
          <FlatList
            data={models}
            renderItem={renderModelCard}
            keyExtractor={(item) => item.key}
            scrollEnabled={false}
            contentContainerStyle={styles.modelList}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText variant="h4" style={styles.sectionTitle}>
            快速操作
          </ThemedText>
          
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]}>
            <FontAwesome6 name="rocket" size={20} color={theme.buttonPrimaryText} />
            <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText} style={styles.actionText}>
              一键急速生成
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.accent }]}>
            <FontAwesome6 name="flag-checkered" size={20} color={theme.buttonPrimaryText} />
            <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText} style={styles.actionText}>
              多模型竞速生成
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.success }]}>
            <FontAwesome6 name="wand-magic-sparkles" size={20} color={theme.buttonPrimaryText} />
            <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText} style={styles.actionText}>
              智能选择最优模型
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <ThemedView level="tertiary" style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <FontAwesome6 name="lightbulb" size={18} color={theme.accent} />
            <ThemedText variant="smallMedium" color={theme.accent}> 使用提示</ThemedText>
          </View>
          <ThemedText variant="small" color={theme.textSecondary}>
            • 完全免费模型无使用限制，可放心使用{'\n'}
            • 多模型竞速会同时调用多个模型，取最快返回{'\n'}
            • 智能选择会根据你的需求自动选择最优模型{'\n'}
            • 每日免费额度在凌晨0点重置
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </Screen>
  );
}
