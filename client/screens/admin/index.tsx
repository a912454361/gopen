/**
 * 管理后台 - 仅限PC端访问
 * 功能：订单管理、用户管理、数据统计、系统配置
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

// 子页面组件
import { OrdersPanel } from './components/OrdersPanel';
import { UsersPanel } from './components/UsersPanel';
import { StatsPanel } from './components/StatsPanel';
import { ConfigPanel } from './components/ConfigPanel';
import { LogsPanel } from './components/LogsPanel';
import { ProfitPanel } from './components/ProfitPanel';
import { PromotionPanel } from './components/PromotionPanel';
import ModelSyncPanel from './components/ModelSyncPanel';
import RechargePanel from './components/RechargePanel';
import FundsPanel from './components/FundsPanel';
import { VideosPanel } from './components/VideosPanel';
import { VendorPanel } from './components/VendorPanel';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
const LOGIN_STORAGE_KEY = 'admin_login_status';

type TabType = 'dashboard' | 'profit' | 'funds' | 'orders' | 'users' | 'videos' | 'promotion' | 'vendors' | 'recharge' | 'model-sync' | 'config' | 'logs';

interface AdminStats {
  totalUsers: number;
  memberUsers: number;
  todayOrders: number;
  todayAmount: number;
  pendingOrders: number;
  totalRevenue: number;
}

export default function AdminDashboardScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ key?: string }>();
  const adminKey = params.key || '';
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // 响应式布局：根据屏幕宽度决定显示 PC 版还是移动版
  // 宽度小于 768px 显示移动版，包括 iOS Safari 等移动浏览器
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 768;

  // 监听屏幕尺寸变化
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  // 登出
  const handleLogout = useCallback(async () => {
    Alert.alert(
      '确认退出',
      '确定要退出管理后台吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            try {
              // 清除登录状态
              await AsyncStorage.removeItem(LOGIN_STORAGE_KEY);
              // 跳转到登录页
              router.replace('/admin-login');
            } catch (error) {
              console.error('登出失败:', error);
              Alert.alert('错误', '登出失败，请重试');
            }
          },
        },
      ]
    );
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

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    if (!authorized) return;
    
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/stats?key=${adminKey}`
      );
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, [adminKey, authorized]);

  useEffect(() => {
    if (authorized) {
      fetchStats();
      // 每30秒刷新一次
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [authorized, fetchStats]);

  // 移动端显示移动版后台
  if (isMobile) {
    // 动态导入移动端组件
    const AdminMobileScreen = require('./mobile').default;
    return <AdminMobileScreen />;
  }
  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
    // 延迟跳转，避免在渲染过程中调用
    setTimeout(() => {
      router.replace('/admin-login');
    }, 0);
    
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            正在跳转到登录页...
          </ThemedText>
        </View>
      </Screen>
    );
  }

  // 侧边栏菜单
  const menuItems: { key: TabType; label: string; icon: string }[] = [
    { key: 'dashboard', label: '数据概览', icon: 'chart-pie' },
    { key: 'profit', label: '利润统计', icon: 'coins' },
    { key: 'funds', label: '资金管理', icon: 'wallet' },
    { key: 'orders', label: '订单管理', icon: 'clipboard-list' },
    { key: 'recharge', label: '充值审核', icon: 'credit-card' },
    { key: 'users', label: '用户管理', icon: 'users' },
    { key: 'videos', label: '视频管理', icon: 'video' },
    { key: 'promotion', label: '推广中心', icon: 'bullhorn' },
    { key: 'vendors', label: '厂商管理', icon: 'building' },
    { key: 'model-sync', label: '模型同步', icon: 'rotate' },
    { key: 'config', label: '系统配置', icon: 'gear' },
    { key: 'logs', label: '操作日志', icon: 'clock-rotate-left' },
  ];

  return (
    <Screen 
      backgroundColor={theme.backgroundRoot} 
      statusBarStyle="light"
      safeAreaEdges={['left', 'right', 'bottom']}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* 侧边栏 */}
        <View style={{
          width: 240,
          backgroundColor: isDark ? '#0A0A0F' : '#1E293B',
          paddingVertical: Spacing.lg,
          borderRightWidth: 1,
          borderRightColor: isDark ? '#1E293B' : '#334155',
          paddingTop: insets.top + Spacing.lg,
        }}>
          {/* Logo */}
          <View style={{ 
            paddingHorizontal: Spacing.lg, 
            paddingBottom: Spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#1E293B' : '#334155',
            marginBottom: Spacing.lg,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: BorderRadius.lg,
                backgroundColor: theme.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <FontAwesome6 name="g" size={20} color="#fff" />
              </View>
              <View>
                <ThemedText variant="smallMedium" color="#fff">G Open</ThemedText>
                <ThemedText variant="tiny" color={isDark ? '#64748B' : '#94A3B8'}>管理后台</ThemedText>
              </View>
            </View>
          </View>

          {/* 菜单 */}
          <View style={{ paddingHorizontal: Spacing.md }}>
            {menuItems.map(item => (
              <TouchableOpacity
                key={item.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  borderRadius: BorderRadius.lg,
                  marginBottom: Spacing.xs,
                  backgroundColor: activeTab === item.key 
                    ? (isDark ? 'rgba(79,70,229,0.2)' : 'rgba(79,70,229,0.3)')
                    : 'transparent',
                }}
                onPress={() => setActiveTab(item.key)}
              >
                <FontAwesome6 
                  name={item.icon as any} 
                  size={16} 
                  color={activeTab === item.key ? theme.primary : (isDark ? '#64748B' : '#94A3B8')} 
                />
                <ThemedText 
                  variant="small" 
                  color={activeTab === item.key ? '#fff' : (isDark ? '#94A3B8' : '#CBD5E1')}
                >
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* 底部信息 */}
          <View style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            padding: Spacing.lg,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#1E293B' : '#334155',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.success,
              }} />
              <ThemedText variant="tiny" color={isDark ? '#64748B' : '#94A3B8'}>
                系统运行正常
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 主内容区 */}
        <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
          {/* 顶部栏 */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.xl,
            paddingVertical: Spacing.lg,
            backgroundColor: theme.backgroundDefault,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <View>
              <ThemedText variant="h4" color={theme.textPrimary}>
                {menuItems.find(m => m.key === activeTab)?.label || '管理后台'}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </ThemedText>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }}>
              {/* 刷新按钮 */}
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.backgroundTertiary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={fetchStats}
              >
                <FontAwesome6 name="rotate" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
              
              {/* 退出按钮 */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.sm,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.lg,
                  backgroundColor: theme.error,
                  borderRadius: BorderRadius.lg,
                }}
                onPress={handleLogout}
              >
                <FontAwesome6 name="right-from-bracket" size={14} color="#fff" />
                <ThemedText variant="small" color="#fff">退出</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 内容区 */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.xl }}>
            {activeTab === 'dashboard' && <StatsPanel stats={stats} adminKey={adminKey} onRefresh={fetchStats} />}
            {activeTab === 'profit' && <ProfitPanel adminKey={adminKey} />}
            {activeTab === 'funds' && <FundsPanel adminKey={adminKey} />}
            {activeTab === 'orders' && <OrdersPanel adminKey={adminKey} />}
            {activeTab === 'recharge' && <RechargePanel adminKey={adminKey} />}
            {activeTab === 'users' && <UsersPanel adminKey={adminKey} />}
            {activeTab === 'videos' && <VideosPanel adminKey={adminKey} />}
            {activeTab === 'promotion' && <PromotionPanel adminKey={adminKey} />}
            {activeTab === 'vendors' && <VendorPanel adminKey={adminKey} />}
            {activeTab === 'model-sync' && <ModelSyncPanel />}
            {activeTab === 'config' && <ConfigPanel adminKey={adminKey} />}
            {activeTab === 'logs' && <LogsPanel adminKey={adminKey} />}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
}
