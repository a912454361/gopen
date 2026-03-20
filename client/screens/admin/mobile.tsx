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
        {activeTab === 'promotion' && <PromotionTab />}
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

// 推广标签页 - 完整版
function PromotionTab() {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const [activeView, setActiveView] = useState<'materials' | 'copywriting' | 'stats'>('materials');
  const [showWatermark, setShowWatermark] = useState(true);

  // 素材数据
  const materials = [
    { id: 'v1', title: 'AI创意工作室', type: 'video', duration: '15s', quality: '8K' },
    { id: 'v2', title: '未来科技感', type: 'video', duration: '20s', quality: '8K' },
    { id: 'v3', title: '产品主视觉', type: 'image', size: '1920x1080' },
    { id: 'v4', title: '功能展示图', type: 'image', size: '1080x1920' },
  ];

  // 文案模板
  const templates = [
    { id: 'c1', title: '小红书 - 产品推荐', platform: 'xiaohongshu' },
    { id: 'c2', title: '抖音 - 15秒视频', platform: 'douyin' },
    { id: 'c3', title: '微博 - 话题营销', platform: 'weibo' },
  ];

  // 平台
  const platforms = [
    { key: 'xiaohongshu', name: '小红书', icon: 'book' },
    { key: 'douyin', name: '抖音', icon: 'play' },
    { key: 'weibo', name: '微博', icon: 'share' },
  ];

  // 统计数据
  const stats = {
    totalRevenue: 12580,
    totalViews: 125680,
    totalClicks: 28934,
    totalConversions: 1256,
    platformStats: [
      { platform: '小红书', revenue: 4520 },
      { platform: '抖音', revenue: 3890 },
      { platform: '微博', revenue: 2120 },
    ],
  };

  // 复制文案
  const handleCopy = async (id: string) => {
    await Clipboard.setStringAsync('推荐G Open AI创作助手！#Gopen #AI工具');
    Alert.alert('成功', '文案已复制');
  };

  return (
    <View style={styles.tabContent}>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
        推广中心
      </ThemedText>

      {/* Tab 切换 */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        {[
          { key: 'materials', label: '素材' },
          { key: 'copywriting', label: '文案' },
          { key: 'stats', label: '统计' },
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
                onPress={() => handleCopy(platform.key)}
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
                onPress={() => handleCopy(template.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <FontAwesome6 name={platform?.icon as any} size={16} color={theme.primary} />
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {template.title}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {activeView === 'stats' && (
        <>
          {/* 总览 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <View style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: '#10B98115',
              borderRadius: BorderRadius.lg,
              padding: Spacing.md,
              alignItems: 'center',
            }}>
              <ThemedText variant="h3" color="#10B981">¥{stats.totalRevenue}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>总收入</ThemedText>
            </View>
            <View style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: '#3B82F615',
              borderRadius: BorderRadius.lg,
              padding: Spacing.md,
              alignItems: 'center',
            }}>
              <ThemedText variant="h3" color="#3B82F6">{(stats.totalViews / 1000).toFixed(0)}K</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>总曝光</ThemedText>
            </View>
            <View style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: '#F59E0B15',
              borderRadius: BorderRadius.lg,
              padding: Spacing.md,
              alignItems: 'center',
            }}>
              <ThemedText variant="h3" color="#F59E0B">{(stats.totalClicks / 1000).toFixed(0)}K</ThemedText>
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
              <ThemedText variant="h3" color="#EF4444">{stats.totalConversions}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>转化用户</ThemedText>
            </View>
          </View>

          {/* 平台收益 */}
          {stats.platformStats.map((stat, index) => (
            <View
              key={index}
              style={{
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                marginBottom: Spacing.sm,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <ThemedText variant="small" color={theme.textPrimary}>{stat.platform}</ThemedText>
              <ThemedText variant="smallMedium" color={theme.success}>¥{stat.revenue}</ThemedText>
            </View>
          ))}
        </>
      )}

      {/* 提示 */}
      <View style={styles.hintBox}>
        <FontAwesome6 name="circle-info" size={16} color={theme.textMuted} />
        <ThemedText variant="caption" color={theme.textMuted} style={{ marginLeft: Spacing.sm }}>
          完整功能请在PC端体验
        </ThemedText>
      </View>
    </View>
  );
}
