/**
 * 移动端管理后台
 * 提供简化版的管理功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles.mobile';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
const LOGIN_STORAGE_KEY = 'admin_login_status';

type TabType = 'dashboard' | 'orders' | 'users' | 'promotion';

export default function AdminMobileScreen() {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ key?: string }>();
  const adminKey = params.key || '';

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 登出
  const handleLogout = useCallback(async () => {
    Alert.alert('确认退出', '确定要退出管理后台吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(LOGIN_STORAGE_KEY);
          router.replace('/admin-login');
        },
      },
    ]);
  }, [router]);

  // 验证管理员权限
  useEffect(() => {
    const verifyAdmin = async () => {
      if (!adminKey) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/verify?key=${adminKey}`
        );
        const result = await response.json();
        setAuthorized(result.success);
      } catch (error) {
        console.error('Verify admin error:', error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, [adminKey]);

  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            验证权限中...
          </ThemedText>
        </View>
      </Screen>
    );
  }

  // 未授权 - 跳转到登录页
  if (!authorized) {
    setTimeout(() => {
      router.replace('/admin-login');
    }, 0);

    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            正在跳转到登录页...
          </ThemedText>
        </View>
      </Screen>
    );
  }

  // 底部导航
  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'dashboard', label: '概览', icon: 'chart-pie' },
    { key: 'orders', label: '订单', icon: 'clipboard-list' },
    { key: 'users', label: '用户', icon: 'users' },
    { key: 'promotion', label: '推广', icon: 'bullhorn' },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <FontAwesome6 name="g" size={18} color="#fff" />
          </View>
          <View>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              G Open
            </ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>
              管理后台
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome6 name="right-from-bracket" size={16} color={theme.error} />
        </TouchableOpacity>
      </View>

      {/* 主内容区 */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 80 }}>
        {activeTab === 'dashboard' && <DashboardTab adminKey={adminKey} />}
        {activeTab === 'orders' && <OrdersTab adminKey={adminKey} />}
        {activeTab === 'users' && <UsersTab adminKey={adminKey} />}
        {activeTab === 'promotion' && <PromotionTab adminKey={adminKey} />}
      </ScrollView>

      {/* 底部导航 */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <FontAwesome6
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? theme.primary : theme.textMuted}
            />
            <ThemedText
              variant="tiny"
              color={activeTab === tab.key ? theme.primary : theme.textMuted}
              style={{ marginTop: 4 }}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

// 数据概览标签页
function DashboardTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // 使用 IIFE 避免直接调用 async 函数
    void (async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/stats?key=${adminKey}`
        );
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Fetch stats error:', error);
      }
    })();
  }, [adminKey]);

  const statItems = [
    { label: '总用户', value: stats?.totalUsers || 0, icon: 'users', color: '#4F46E5' },
    { label: '会员用户', value: stats?.memberUsers || 0, icon: 'crown', color: '#F59E0B' },
    { label: '今日订单', value: stats?.todayOrders || 0, icon: 'clipboard-list', color: '#10B981' },
    { label: '今日收入', value: `¥${stats?.todayAmount || 0}`, icon: 'coins', color: '#EF4444' },
  ];

  return (
    <View style={styles.tabContent}>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
        数据概览
      </ThemedText>
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: item.color + '20' }]}>
              <FontAwesome6 name={item.icon as any} size={20} color={item.color} />
            </View>
            <ThemedText variant="h3" color={theme.textPrimary} style={{ marginTop: Spacing.sm }}>
              {item.value}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              {item.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// 订单标签页（简化版）
function OrdersTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.tabContent}>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
        订单管理
      </ThemedText>
      <View style={styles.emptyState}>
        <FontAwesome6 name="clipboard-list" size={48} color={theme.textMuted} />
        <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
          请在PC端查看详细订单
        </ThemedText>
      </View>
    </View>
  );
}

// 用户标签页（简化版）
function UsersTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.tabContent}>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
        用户管理
      </ThemedText>
      <View style={styles.emptyState}>
        <FontAwesome6 name="users" size={48} color={theme.textMuted} />
        <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
          请在PC端查看详细用户
        </ThemedText>
      </View>
    </View>
  );
}

// 推广标签页 - 完整版（真实数据）
function PromotionTab({ adminKey }: { adminKey: string }) {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const [activeView, setActiveView] = useState<'materials' | 'copywriting' | 'stats'>('stats');
  const [showWatermark, setShowWatermark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);

  // 加载推广统计
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/stats?key=${adminKey}`
        );
        const result = await response.json();
        if (result.success) {
          setStatsData(result.data);
        }
      } catch (error) {
        console.error('Load promotion stats error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, [adminKey]);

  // 素材数据
  const materials = [
    { id: 'v1', title: 'AI创意工作室', type: 'video', duration: '15s', quality: '8K' },
    { id: 'v2', title: '未来科技感', type: 'video', duration: '20s', quality: '8K' },
    { id: 'v3', title: '产品主视觉', type: 'image', size: '1920x1080' },
    { id: 'v4', title: '功能展示图', type: 'image', size: '1080x1920' },
  ];

  // 文案模板
  const templates = [
    { id: 'c1', title: '小红书 - 产品推荐', platform: 'xiaohongshu', content: '姐妹们！这个AI工具太好用了...' },
    { id: 'c2', title: '抖音 - 15秒视频', platform: 'douyin', content: '【钩子】一个APP，集齐所有顶级AI模型！' },
    { id: 'c3', title: '微博 - 话题营销', platform: 'weibo', content: '#AI创作工具# 发现一个神仙APP！' },
    { id: 'c4', title: 'B站 - 视频脚本', platform: 'bilibili', content: '【开场】大家好，我是XXX...' },
  ];

  // 平台
  const platforms = [
    { key: 'xiaohongshu', name: '小红书', icon: 'book', color: '#FF2442' },
    { key: 'douyin', name: '抖音', icon: 'play', color: '#000000' },
    { key: 'weibo', name: '微博', icon: 'share', color: '#E6162D' },
    { key: 'bilibili', name: 'B站', icon: 'tv', color: '#00A1D6' },
  ];

  // 复制文案
  const handleCopy = async (content: string) => {
    await Clipboard.setStringAsync(content || '推荐G Open AI创作助手！#Gopen #AI工具');
    Alert.alert('成功', '文案已复制');
  };

  // 获取转化率
  const getConversionRate = () => {
    if (!statsData || statsData.totalClicks === 0) return '0%';
    return ((statsData.totalConversions / statsData.totalClicks) * 100).toFixed(2) + '%';
  };

  return (
    <View style={styles.tabContent}>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
        推广中心
      </ThemedText>

      {/* Tab 切换 */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        {[
          { key: 'stats', label: '统计' },
          { key: 'materials', label: '素材' },
          { key: 'copywriting', label: '文案' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.md,
              backgroundColor: activeView === tab.key ? theme.primary : theme.backgroundDefault,
              alignItems: 'center',
            }}
            onPress={() => setActiveView(tab.key as any)}
          >
            <ThemedText 
              variant="small" 
              color={activeView === tab.key ? theme.buttonPrimaryText : theme.textPrimary}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* 统计视图 */}
      {activeView === 'stats' && (
        <>
          {isLoading ? (
            <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <>
              {/* 总览卡片 */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: '#10B98115',
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  alignItems: 'center',
                }}>
                  <FontAwesome6 name="coins" size={20} color="#10B981" />
                  <ThemedText variant="h3" color="#10B981" style={{ marginTop: 4 }}>
                    ¥{((statsData?.totalEarnings || 0) / 100).toFixed(2)}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>总佣金</ThemedText>
                </View>
                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: '#3B82F615',
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  alignItems: 'center',
                }}>
                  <FontAwesome6 name="users" size={20} color="#3B82F6" />
                  <ThemedText variant="h3" color="#3B82F6" style={{ marginTop: 4 }}>
                    {statsData?.totalPromoters || 0}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>推广员</ThemedText>
                </View>
                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: '#F59E0B15',
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  alignItems: 'center',
                }}>
                  <FontAwesome6 name="hand-pointer" size={20} color="#F59E0B" />
                  <ThemedText variant="h3" color="#F59E0B" style={{ marginTop: 4 }}>
                    {statsData?.totalClicks || 0}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>总点击</ThemedText>
                </View>
                <View style={{
                  flex: 1,
                  minWidth: '45%',
                  backgroundColor: '#EF444415',
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  alignItems: 'center',
                }}>
                  <FontAwesome6 name="user-plus" size={20} color="#EF4444" />
                  <ThemedText variant="h3" color="#EF4444" style={{ marginTop: 4 }}>
                    {statsData?.totalConversions || 0}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>转化用户</ThemedText>
                </View>
              </View>

              {/* 今日数据 */}
              <View style={{
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                marginBottom: Spacing.md,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
                  今日数据
                </ThemedText>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText variant="h4" color={theme.textPrimary}>{statsData?.todayClicks || 0}</ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>点击</ThemedText>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText variant="h4" color={theme.textPrimary}>{statsData?.todayConversions || 0}</ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>转化</ThemedText>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText variant="h4" color={theme.primary}>¥{((statsData?.todayEarnings || 0) / 100).toFixed(2)}</ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>佣金</ThemedText>
                  </View>
                </View>
              </View>

              {/* 转化率 */}
              <View style={{
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                marginBottom: Spacing.md,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText variant="small" color={theme.textSecondary}>转化率</ThemedText>
                  <ThemedText variant="smallMedium" color="#10B981">{getConversionRate()}</ThemedText>
                </View>
                <View style={{
                  height: 8,
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: 4,
                  marginTop: Spacing.sm,
                }}>
                  <View style={{
                    width: `${Math.min(parseFloat(getConversionRate()) * 5, 100)}%`,
                    height: '100%',
                    backgroundColor: '#10B981',
                    borderRadius: 4,
                  }} />
                </View>
              </View>

              {/* 待处理提现 */}
              {(statsData?.pendingWithdrawals || 0) > 0 && (
                <View style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  marginBottom: Spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.sm,
                }}>
                  <FontAwesome6 name="triangle-exclamation" size={16} color="#F59E0B" />
                  <ThemedText variant="small" color="#92400E">
                    有 {statsData?.pendingWithdrawals} 笔提现申请待处理
                  </ThemedText>
                </View>
              )}

              {/* TOP推广员 */}
              {statsData?.topPromoters && statsData.topPromoters.length > 0 && (
                <View style={{ marginBottom: Spacing.md }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
                    TOP推广员
                  </ThemedText>
                  {statsData.topPromoters.slice(0, 3).map((promoter: any, index: number) => (
                    <View
                      key={promoter.id}
                      style={{
                        backgroundColor: theme.backgroundDefault,
                        borderRadius: BorderRadius.md,
                        padding: Spacing.sm,
                        marginBottom: Spacing.xs,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.sm,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <ThemedText variant="caption" color="#fff">{index + 1}</ThemedText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText variant="caption" color={theme.textPrimary}>
                          {promoter.promoter_code}
                        </ThemedText>
                        <ThemedText variant="tiny" color={theme.textMuted}>
                          点击: {promoter.total_clicks} · 转化: {promoter.total_conversions}
                        </ThemedText>
                      </View>
                      <ThemedText variant="smallMedium" color="#10B981">
                        ¥{(promoter.total_earnings / 100).toFixed(2)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </>
      )}

      {/* 素材视图 */}
      {activeView === 'materials' && (
        <>
          {/* 素材列表 */}
          {materials.map((material) => (
            <View
              key={material.id}
              style={{
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                marginBottom: Spacing.sm,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: BorderRadius.md,
                  backgroundColor: isDark ? '#1a1a2e' : '#f0f0f0',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <FontAwesome6 
                    name={material.type === 'video' ? 'video' : 'image'} 
                    size={24} 
                    color={theme.primary} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {material.title}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {material.type === 'video' ? `${material.duration} | ${material.quality}` : material.size}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}

          {/* 平台按钮 */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
            {platforms.map((platform) => (
              <TouchableOpacity
                key={platform.key}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  backgroundColor: theme.primary,
                  borderRadius: BorderRadius.md,
                  paddingVertical: Spacing.sm,
                }}
                onPress={() => handleCopy('')}
              >
                <FontAwesome6 name={platform.icon as any} size={12} color={theme.buttonPrimaryText} />
                <ThemedText variant="caption" color={theme.buttonPrimaryText}>
                  {platform.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* 文案视图 */}
      {activeView === 'copywriting' && (
        <>
          {templates.map((template) => {
            const platform = platforms.find(p => p.key === template.platform);
            return (
              <TouchableOpacity
                key={template.id}
                style={{
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  marginBottom: Spacing.sm,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                onPress={() => handleCopy(template.content)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: BorderRadius.md,
                    backgroundColor: (platform?.color || theme.primary) + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <FontAwesome6 name={platform?.icon as any} size={14} color={platform?.color || theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {template.title}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted} numberOfLines={1}>
                      {template.content}
                    </ThemedText>
                  </View>
                  <FontAwesome6 name="copy" size={14} color={theme.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </View>
  );
}
