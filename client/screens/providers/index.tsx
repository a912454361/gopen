/**
 * 厂商管理页面
 * 管理AI模型厂商配置和同步状态
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { Spacing } from '@/constants/theme';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface Provider {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  status: string;
  categories: string[];
  totalModels: number;
  activeModels: number;
  freeModels: number;
  hasApiKey: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'not_configured';
  lastSync: string | null;
  lastSyncError: string | null;
}

interface SyncResult {
  provider: string;
  providerName: string;
  success: boolean;
  totalModels: number;
  modelsAdded: number;
  modelsUpdated: number;
  modelsDeactivated: number;
  newModels: string[];
  error?: string;
}

export default function ProvidersScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    configured: 0,
    active: 0,
  });

  // 加载厂商列表
  const loadProviders = useCallback(async () => {
    try {
      /**
       * 服务端文件：server/src/routes/providers.ts
       * 接口：GET /api/v1/providers
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/providers`);
      const data = await response.json();

      if (data.success) {
        setProviders(data.data.providers);
        setStats({
          total: data.data.total,
          configured: data.data.configured,
          active: data.data.active,
        });
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 页面获取焦点时加载数据
  useFocusEffect(
    useCallback(() => {
      loadProviders();
    }, [loadProviders])
  );

  // 刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProviders();
  }, [loadProviders]);

  // 同步所有厂商
  const handleSyncAll = useCallback(async () => {
    if (syncing) return;

    setSyncing(true);
    try {
      /**
       * 服务端文件：server/src/routes/providers.ts
       * 接口：POST /api/v1/providers/sync-all
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/providers/sync-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        // 刷新列表
        await loadProviders();
      }
    } catch (error) {
      console.error('Failed to sync all providers:', error);
    } finally {
      setSyncing(false);
    }
  }, [syncing, loadProviders]);

  // 同步单个厂商
  const handleSyncProvider = useCallback(async (providerId: string) => {
    if (syncingProvider) return;

    setSyncingProvider(providerId);
    try {
      /**
       * 服务端文件：server/src/routes/providers.ts
       * 接口：POST /api/v1/providers/:id/sync
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/providers/${providerId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        // 刷新列表
        await loadProviders();
      }
    } catch (error) {
      console.error('Failed to sync provider:', error);
    } finally {
      setSyncingProvider(null);
    }
  }, [syncingProvider, loadProviders]);

  // 查看厂商详情
  const handleViewProvider = useCallback((providerId: string) => {
    router.push('/provider-detail', { id: providerId });
  }, [router]);

  // 获取分类列表
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('all');
    providers.forEach(p => {
      p.categories.forEach(c => cats.add(c));
    });
    return Array.from(cats);
  }, [providers]);

  // 过滤厂商
  const filteredProviders = useMemo(() => {
    if (activeCategory === 'all') return providers;
    return providers.filter(p => p.categories.includes(activeCategory));
  }, [providers, activeCategory]);

  // 格式化分类名称
  const formatCategory = (cat: string) => {
    const names: Record<string, string> = {
      all: '全部',
      text: '文本',
      image: '图像',
      audio: '音频',
      video: '视频',
      embedding: '向量',
      multimodal: '多模态',
    };
    return names[cat] || cat;
  };

  // 获取同步状态图标
  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'syncing':
        return { name: 'spinner', color: theme.primary };
      case 'error':
        return { name: 'circle-exclamation', color: theme.error };
      case 'not_configured':
        return { name: 'key', color: theme.textMuted };
      default:
        return { name: 'circle-check', color: theme.success };
    }
  };

  // 渲染厂商卡片
  const renderProviderCard = useCallback((provider: Provider) => {
    const syncIcon = getSyncStatusIcon(provider.syncStatus);
    const isSyncingThis = syncingProvider === provider.id;

    return (
      <TouchableOpacity
        key={provider.id}
        style={styles.providerCard}
        onPress={() => handleViewProvider(provider.id)}
        activeOpacity={0.7}
      >
        <View style={styles.providerHeader}>
          <View style={styles.providerIcon}>
            <FontAwesome6
              name={provider.icon as any}
              size={24}
              color={theme.primary}
            />
          </View>
          <View style={styles.providerInfo}>
            <ThemedText variant="bodyMedium" style={styles.providerName}>
              {provider.name}
            </ThemedText>
            <View style={styles.providerMeta}>
              <View style={styles.providerStatus}>
                <View
                  style={[
                    styles.statusDot,
                    provider.status === 'active' ? styles.statusDotActive : styles.statusDotInactive,
                  ]}
                />
                <ThemedText variant="caption" style={styles.statusText}>
                  {provider.status === 'active' ? '已启用' : '未启用'}
                </ThemedText>
              </View>
              <FontAwesome6
                name={syncIcon.name as any}
                size={12}
                color={syncIcon.color}
              />
              <ThemedText variant="caption" style={styles.statusText}>
                {provider.syncStatus === 'syncing' ? '同步中' :
                 provider.syncStatus === 'error' ? '同步失败' :
                 provider.syncStatus === 'not_configured' ? '未配置' : '已同步'}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.providerStats}>
          <View style={styles.providerStat}>
            <ThemedText variant="h4" style={styles.providerStatValue}>
              {provider.totalModels}
            </ThemedText>
            <ThemedText variant="caption" style={styles.providerStatLabel}>
              模型总数
            </ThemedText>
          </View>
          <View style={styles.providerStat}>
            <ThemedText variant="h4" style={styles.providerStatValue}>
              {provider.activeModels}
            </ThemedText>
            <ThemedText variant="caption" style={styles.providerStatLabel}>
              已上线
            </ThemedText>
          </View>
          <View style={styles.providerStat}>
            <ThemedText variant="h4" style={styles.providerStatValue}>
              {provider.freeModels}
            </ThemedText>
            <ThemedText variant="caption" style={styles.providerStatLabel}>
              免费模型
            </ThemedText>
          </View>
        </View>

        <View style={styles.providerTags}>
          {provider.categories.slice(0, 4).map((cat) => (
            <View key={cat} style={styles.tag}>
              <ThemedText variant="caption" style={styles.tagText}>
                {formatCategory(cat)}
              </ThemedText>
            </View>
          ))}
        </View>

        {provider.lastSyncError && (
          <ThemedText variant="caption" style={styles.errorText}>
            错误: {provider.lastSyncError}
          </ThemedText>
        )}

        <View style={styles.providerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewProvider(provider.id)}
          >
            <FontAwesome6 name="eye" size={14} color={theme.textSecondary} />
            <ThemedText variant="smallMedium" style={styles.actionButtonText}>
              查看详情
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => handleSyncProvider(provider.id)}
            disabled={isSyncingThis || !provider.hasApiKey}
          >
            {isSyncingThis ? (
              <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
            ) : (
              <>
                <FontAwesome6 name="rotate" size={14} color={theme.buttonPrimaryText} />
                <ThemedText
                  variant="smallMedium"
                  style={[styles.actionButtonText, styles.actionButtonTextPrimary]}
                >
                  同步模型
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [styles, theme, syncingProvider, handleViewProvider, handleSyncProvider]);

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="body" style={styles.emptyText}>
            加载厂商列表...
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* 头部 */}
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h2" style={styles.title}>
            厂商管理
          </ThemedText>
          <ThemedText variant="body" style={styles.subtitle}>
            管理 AI 模型厂商配置和自动同步
          </ThemedText>
        </ThemedView>

        {/* 统计卡片 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText variant="h3" style={styles.statValue}>
              {stats.total}
            </ThemedText>
            <ThemedText variant="caption" style={styles.statLabel}>
              厂商总数
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="h3" style={styles.statValue}>
              {stats.configured}
            </ThemedText>
            <ThemedText variant="caption" style={styles.statLabel}>
              已配置
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="h3" style={styles.statValue}>
              {stats.active}
            </ThemedText>
            <ThemedText variant="caption" style={styles.statLabel}>
              已启用
            </ThemedText>
          </View>
        </View>

        {/* 同步全部按钮 */}
        <TouchableOpacity
          style={styles.syncAllButton}
          onPress={handleSyncAll}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
          ) : (
            <FontAwesome6 name="rotate" size={18} color={theme.buttonPrimaryText} />
          )}
          <ThemedText variant="bodyMedium" style={styles.syncAllButtonText}>
            {syncing ? '同步中...' : '同步所有厂商'}
          </ThemedText>
        </TouchableOpacity>

        {/* 分类筛选 */}
        <View style={styles.categoryFilter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.sm }}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  activeCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(cat)}
              >
                <ThemedText
                  variant="smallMedium"
                  style={[
                    styles.categoryChipText,
                    activeCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {formatCategory(cat)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </View>

        {/* 厂商列表 */}
        <ThemedText variant="h4" style={styles.sectionTitle}>
          厂商列表 ({filteredProviders.length})
        </ThemedText>

        {filteredProviders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="box-open" size={48} color={theme.textMuted} />
            <ThemedText variant="body" style={styles.emptyText}>
              暂无厂商数据
            </ThemedText>
          </View>
        ) : (
          <View style={styles.providerList}>
            {filteredProviders.map(renderProviderCard)}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
