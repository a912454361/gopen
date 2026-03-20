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

// 推广标签页 - 视频推广版
function PromotionTab() {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const [showWatermark, setShowWatermark] = useState(true);

  // 推广视频数据
  const videos = [
    {
      id: 'v1',
      title: 'AI创意工作室',
      duration: '15s',
      promotionText: '用G Open，让AI为你工作！一键生成文案、图片、视频。#GOpen #AI创作',
    },
    {
      id: 'v2',
      title: '未来科技感',
      duration: '20s',
      promotionText: 'G Open - 你的AI创作伙伴，支持GPT-4o、Claude 3等顶级模型！#AI工具',
    },
    {
      id: 'v3',
      title: '数字艺术创作',
      duration: '18s',
      promotionText: '从想法到作品，只需要一句话。G Open让创作更简单！#创作神器',
    },
  ];

  // 推广平台
  const platforms = [
    { key: 'xiaohongshu', name: '小红书', icon: 'book' },
    { key: 'douyin', name: '抖音', icon: 'play' },
    { key: 'weibo', name: '微博', icon: 'share' },
  ];

  // 一键推广
  const handlePromote = async (video: typeof videos[0], platform: typeof platforms[0]) => {
    await Clipboard.setStringAsync(video.promotionText);
    Alert.alert('已复制', `推广文案已复制，可粘贴到${platform.name}`);
  };

  return (
    <View style={styles.tabContent}>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
        视频推广素材
      </ThemedText>

      {/* 视频卡片 */}
      {videos.map((video) => (
        <View
          key={video.id}
          style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
            marginBottom: Spacing.md,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          {/* 视频预览区 */}
          <View style={{
            aspectRatio: 16/9,
            backgroundColor: isDark ? '#1a1a2e' : '#f0f0f0',
            borderRadius: BorderRadius.md,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.sm,
          }}>
            <FontAwesome6 name="circle-play" size={48} color={theme.primary} />
            <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
              {video.duration} | 8K蓝光
            </ThemedText>
          </View>

          <ThemedText variant="smallMedium" color={theme.textPrimary}>
            {video.title}
          </ThemedText>

          {/* 平台按钮 */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
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
                onPress={() => handlePromote(video, platform)}
              >
                <FontAwesome6 name={platform.icon as any} size={12} color={theme.buttonPrimaryText} />
                <ThemedText variant="caption" color={theme.buttonPrimaryText}>
                  {platform.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* 提示 */}
      <View style={styles.hintBox}>
        <FontAwesome6 name="circle-info" size={16} color={theme.textMuted} />
        <ThemedText variant="caption" color={theme.textMuted} style={{ marginLeft: Spacing.sm }}>
          完整视频素材请在PC端下载
        </ThemedText>
      </View>
    </View>
  );
}
