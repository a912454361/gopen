/**
 * 移动端管理后台 - 完整版
 * 功能与PC端一致：数据概览、利润统计、订单管理、用户管理、推广中心、系统配置、操作日志
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { PromoManager } from './components/PromoManager';
import ModelSyncPanel from './components/ModelSyncPanel';
import RechargePanel from './components/RechargePanel';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
const LOGIN_STORAGE_KEY = 'admin_login_status';

type TabType = 'dashboard' | 'profit' | 'orders' | 'users' | 'promotion' | 'recharge' | 'model-sync' | 'config' | 'logs';

interface AdminStats {
  totalUsers: number;
  memberUsers: number;
  todayOrders: number;
  todayAmount: number;
  pendingOrders: number;
  totalRevenue: number;
}

interface Order {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  membership_type: string;
  created_at: string;
  user_email?: string;
}

interface User {
  id: string;
  email: string;
  membership_type: string;
  membership_expire_at: string | null;
  created_at: string;
  total_spent: number;
}

export default function AdminMobileScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ key?: string }>();
  const adminKey = params.key || '';

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            验证权限中...
          </ThemedText>
        </View>
      </Screen>
    );
  }

  // 未授权
  if (!authorized) {
    setTimeout(() => {
      router.replace('/admin-login');
    }, 0);

    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
    { key: 'profit', label: '利润', icon: 'coins' },
    { key: 'orders', label: '订单', icon: 'clipboard-list' },
    { key: 'recharge', label: '充值', icon: 'wallet' },
    { key: 'users', label: '用户', icon: 'users' },
    { key: 'promotion', label: '推广', icon: 'bullhorn' },
    { key: 'model-sync', label: '同步', icon: 'rotate' },
    { key: 'config', label: '配置', icon: 'gear' },
    { key: 'logs', label: '日志', icon: 'clock-rotate-left' },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* 顶部栏 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: theme.backgroundDefault,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: BorderRadius.lg,
            backgroundColor: theme.primary,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <FontAwesome6 name="g" size={16} color="#fff" />
          </View>
          <View>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>G Open</ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>管理后台</ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.error + '20',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleLogout}
        >
          <FontAwesome6 name="right-from-bracket" size={16} color={theme.error} />
        </TouchableOpacity>
      </View>

      {/* 主内容区 */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {activeTab === 'dashboard' && <DashboardTab adminKey={adminKey} />}
        {activeTab === 'profit' && <ProfitTab adminKey={adminKey} />}
        {activeTab === 'orders' && <OrdersTab adminKey={adminKey} />}
        {activeTab === 'recharge' && <RechargePanel adminKey={adminKey} />}
        {activeTab === 'users' && <UsersTab adminKey={adminKey} />}
        {activeTab === 'promotion' && <PromoManager adminKey={adminKey} />}
        {activeTab === 'model-sync' && <ModelSyncPanel />}
        {activeTab === 'config' && <ConfigTab adminKey={adminKey} />}
        {activeTab === 'logs' && <LogsTab adminKey={adminKey} />}
      </ScrollView>

      {/* 底部导航 */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: theme.backgroundDefault,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingHorizontal: Spacing.xs,
        paddingVertical: Spacing.sm,
      }}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: Spacing.xs,
            }}
            onPress={() => setActiveTab(tab.key)}
          >
            <FontAwesome6
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.key ? theme.primary : theme.textMuted}
            />
            <ThemedText
              variant="tiny"
              color={activeTab === tab.key ? theme.primary : theme.textMuted}
              style={{ marginTop: 2 }}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  );
}

// ==================== 数据概览 ====================
function DashboardTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
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
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [adminKey]);

  if (loading) {
    return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing.xl }} />;
  }

  const statItems = [
    { label: '总用户', value: stats?.totalUsers || 0, icon: 'users', color: '#4F46E5' },
    { label: '会员用户', value: stats?.memberUsers || 0, icon: 'crown', color: '#F59E0B' },
    { label: '今日订单', value: stats?.todayOrders || 0, icon: 'clipboard-list', color: '#10B981' },
    { label: '今日收入', value: `¥${stats?.todayAmount || 0}`, icon: 'coins', color: '#EF4444' },
    { label: '待处理订单', value: stats?.pendingOrders || 0, icon: 'hourglass-half', color: '#F59E0B' },
    { label: '总收入', value: `¥${stats?.totalRevenue || 0}`, icon: 'wallet', color: '#8B5CF6' },
  ];

  return (
    <View>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
        数据概览
      </ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
        {statItems.map((item, index) => (
          <View
            key={index}
            style={{
              width: '47%',
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: BorderRadius.md,
              backgroundColor: item.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.sm,
            }}>
              <FontAwesome6 name={item.icon as any} size={18} color={item.color} />
            </View>
            <ThemedText variant="h3" color={theme.textPrimary}>{item.value}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>{item.label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// ==================== 利润统计 ====================
function ProfitTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const [profitData, setProfitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfit = async () => {
      try {
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/profit?key=${adminKey}`
        );
        const result = await response.json();
        if (result.success) {
          setProfitData(result.data);
        }
      } catch (error) {
        console.error('Fetch profit error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfit();
  }, [adminKey]);

  if (loading) {
    return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing.xl }} />;
  }

  const profitItems = [
    { label: '今日利润', value: `¥${profitData?.todayProfit || 0}`, icon: 'chart-line', color: '#10B981' },
    { label: '本月利润', value: `¥${profitData?.monthProfit || 0}`, icon: 'calendar', color: '#4F46E5' },
    { label: '总利润', value: `¥${profitData?.totalProfit || 0}`, icon: 'coins', color: '#F59E0B' },
    { label: '利润率', value: `${profitData?.profitRate || 0}%`, icon: 'percent', color: '#8B5CF6' },
  ];

  return (
    <View>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
        利润统计
      </ThemedText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
        {profitItems.map((item, index) => (
          <View
            key={index}
            style={{
              width: '47%',
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: BorderRadius.md,
              backgroundColor: item.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.sm,
            }}>
              <FontAwesome6 name={item.icon as any} size={18} color={item.color} />
            </View>
            <ThemedText variant="h4" color={theme.textPrimary}>{item.value}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>{item.label}</ThemedText>
          </View>
        ))}
      </View>

      {/* 成本明细 */}
      <View style={{
        backgroundColor: theme.backgroundDefault,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginTop: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
          成本明细
        </ThemedText>
        {[
          { label: 'API调用成本', value: `¥${profitData?.apiCost || 0}` },
          { label: '服务器成本', value: `¥${profitData?.serverCost || 0}` },
          { label: '其他成本', value: `¥${profitData?.otherCost || 0}` },
        ].map((item, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: Spacing.sm,
            borderBottomWidth: index < 2 ? 1 : 0,
            borderBottomColor: theme.border,
          }}>
            <ThemedText variant="small" color={theme.textSecondary}>{item.label}</ThemedText>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>{item.value}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// ==================== 订单管理 ====================
function OrdersTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const status = filter === 'all' ? '' : `&status=${filter}`;
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/orders?key=${adminKey}${status}`
        );
        const result = await response.json();
        if (result.success) {
          setOrders(result.data || []);
        }
      } catch (error) {
        console.error('Fetch orders error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [adminKey, filter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/orders/${orderId}/status?key=${adminKey}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const result = await response.json();
      if (result.success) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        Alert.alert('成功', '订单状态已更新');
      }
    } catch (error) {
      Alert.alert('错误', '更新失败');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return theme.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'pending': return '待处理';
      case 'failed': return '失败';
      default: return status;
    }
  };

  return (
    <View>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
        订单管理
      </ThemedText>

      {/* 筛选按钮 */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待处理' },
          { key: 'completed', label: '已完成' },
        ].map(item => (
          <TouchableOpacity
            key={item.key}
            style={{
              flex: 1,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.md,
              backgroundColor: filter === item.key ? theme.primary : theme.backgroundDefault,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: filter === item.key ? theme.primary : theme.border,
            }}
            onPress={() => { setFilter(item.key as any); setLoading(true); }}
          >
            <ThemedText
              variant="small"
              color={filter === item.key ? theme.buttonPrimaryText : theme.textPrimary}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : orders.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <FontAwesome6 name="clipboard-list" size={48} color={theme.textMuted} />
          <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            暂无订单
          </ThemedText>
        </View>
      ) : (
        orders.map(order => (
          <View
            key={order.id}
            style={{
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.md,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                ¥{order.amount}
              </ThemedText>
              <View style={{
                paddingHorizontal: Spacing.sm,
                paddingVertical: 2,
                borderRadius: BorderRadius.sm,
                backgroundColor: getStatusColor(order.status) + '20',
              }}>
                <ThemedText variant="tiny" color={getStatusColor(order.status)}>
                  {getStatusLabel(order.status)}
                </ThemedText>
              </View>
            </View>
            <ThemedText variant="caption" color={theme.textMuted}>
              会员类型: {order.membership_type || '普通'}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              {new Date(order.created_at).toLocaleString('zh-CN')}
            </ThemedText>

            {order.status === 'pending' && (
              <TouchableOpacity
                style={{
                  marginTop: Spacing.md,
                  backgroundColor: theme.success,
                  paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.md,
                  alignItems: 'center',
                }}
                onPress={() => updateOrderStatus(order.id, 'completed')}
              >
                <ThemedText variant="small" color="#fff">确认完成</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );
}

// ==================== 用户管理 ====================
function UsersTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/users?key=${adminKey}`
        );
        const result = await response.json();
        if (result.success) {
          setUsers(result.data || []);
        }
      } catch (error) {
        console.error('Fetch users error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [adminKey]);

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'super': return '#8B5CF6';
      case 'premium': return '#F59E0B';
      default: return theme.textMuted;
    }
  };

  return (
    <View>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
        用户管理
      </ThemedText>

      {/* 搜索框 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.backgroundDefault,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <FontAwesome6 name="magnifying-glass" size={16} color={theme.textMuted} />
        <TextInput
          style={{
            flex: 1,
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.sm,
            color: theme.textPrimary,
          }}
          placeholder="搜索用户邮箱..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : filteredUsers.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <FontAwesome6 name="users" size={48} color={theme.textMuted} />
          <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            暂无用户
          </ThemedText>
        </View>
      ) : (
        filteredUsers.map(user => (
          <View
            key={user.id}
            style={{
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.md,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.primary + '20',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <FontAwesome6 name="user" size={16} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {user.email || '未设置邮箱'}
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 1,
                    borderRadius: BorderRadius.sm,
                    backgroundColor: getMembershipColor(user.membership_type) + '20',
                  }}>
                    <ThemedText variant="tiny" color={getMembershipColor(user.membership_type)}>
                      {user.membership_type === 'super' ? '超级会员' : 
                       user.membership_type === 'premium' ? '普通会员' : '免费用户'}
                    </ThemedText>
                  </View>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    消费 ¥{user.total_spent || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ==================== 推广中心 ====================
function PromotionTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };
    loadStats();
  }, [adminKey]);

  if (loading) {
    return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing.xl }} />;
  }

  return (
    <View>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
        推广中心
      </ThemedText>

      {/* 统计卡片 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg }}>
        {[
          { label: '总佣金', value: `¥${((statsData?.totalEarnings || 0) / 100).toFixed(2)}`, icon: 'coins', color: '#10B981' },
          { label: '推广员', value: statsData?.totalPromoters || 0, icon: 'users', color: '#3B82F6' },
          { label: '总点击', value: statsData?.totalClicks || 0, icon: 'hand-pointer', color: '#F59E0B' },
          { label: '转化用户', value: statsData?.totalConversions || 0, icon: 'user-plus', color: '#EF4444' },
        ].map((item, index) => (
          <View
            key={index}
            style={{
              width: '47%',
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{
              width: 36,
              height: 36,
              borderRadius: BorderRadius.md,
              backgroundColor: item.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: Spacing.sm,
            }}>
              <FontAwesome6 name={item.icon as any} size={16} color={item.color} />
            </View>
            <ThemedText variant="h4" color={theme.textPrimary}>{item.value}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>{item.label}</ThemedText>
          </View>
        ))}
      </View>

      {/* 今日数据 */}
      <View style={{
        backgroundColor: theme.backgroundDefault,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
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
    </View>
  );
}

// ==================== 系统配置 ====================
function ConfigTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/config?key=${adminKey}`
        );
        const result = await response.json();
        if (result.success) {
          setConfig(result.data || {});
        }
      } catch (error) {
        console.error('Fetch config error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [adminKey]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/config?key=${adminKey}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        }
      );
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', '配置已保存');
      }
    } catch (error) {
      Alert.alert('错误', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing.xl }} />;
  }

  const configItems = [
    { key: 'appName', label: '应用名称', value: config.appName || '' },
    { key: 'maintenanceMode', label: '维护模式', value: config.maintenanceMode ? '开启' : '关闭' },
    { key: 'allowRegistration', label: '允许注册', value: config.allowRegistration !== false ? '是' : '否' },
    { key: 'maxFreeMessages', label: '免费消息数', value: config.maxFreeMessages || 10 },
  ];

  return (
    <View>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
        系统配置
      </ThemedText>

      {configItems.map((item, index) => (
        <View
          key={item.key}
          style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            marginBottom: Spacing.md,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <ThemedText variant="smallMedium" color={theme.textPrimary}>{item.label}</ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: Spacing.xs }}>
            {String(item.value)}
          </ThemedText>
        </View>
      ))}

      <TouchableOpacity
        style={{
          backgroundColor: theme.primary,
          paddingVertical: Spacing.lg,
          borderRadius: BorderRadius.lg,
          alignItems: 'center',
          marginTop: Spacing.md,
        }}
        onPress={saveConfig}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
        ) : (
          <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>保存配置</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ==================== 操作日志 ====================
function LogsTab({ adminKey }: { adminKey: string }) {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/logs?key=${adminKey}`
        );
        const result = await response.json();
        if (result.success) {
          setLogs(result.data || []);
        }
      } catch (error) {
        console.error('Fetch logs error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [adminKey]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return '#10B981';
      case 'update': return '#3B82F6';
      case 'delete': return '#EF4444';
      case 'login': return '#8B5CF6';
      default: return theme.textMuted;
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing.xl }} />;
  }

  return (
    <View>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
        操作日志
      </ThemedText>

      {logs.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          <FontAwesome6 name="clock-rotate-left" size={48} color={theme.textMuted} />
          <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            暂无日志
          </ThemedText>
        </View>
      ) : (
        logs.map((log, index) => (
          <View
            key={log.id || index}
            style={{
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.md,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
              <View style={{
                paddingHorizontal: Spacing.sm,
                paddingVertical: 2,
                borderRadius: BorderRadius.sm,
                backgroundColor: getActionColor(log.action) + '20',
              }}>
                <ThemedText variant="tiny" color={getActionColor(log.action)}>
                  {log.action || '操作'}
                </ThemedText>
              </View>
              <ThemedText variant="tiny" color={theme.textMuted}>
                {new Date(log.created_at).toLocaleString('zh-CN')}
              </ThemedText>
            </View>
            <ThemedText variant="small" color={theme.textPrimary}>
              {log.description || log.details || '无详情'}
            </ThemedText>
            {log.user_email && (
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
                操作人: {log.user_email}
              </ThemedText>
            )}
          </View>
        ))
      )}
    </View>
  );
}
