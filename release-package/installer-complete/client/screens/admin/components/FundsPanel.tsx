/**
 * 资金管理面板
 * 查看所有用户的余额、G点和充值记录
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 用户资金信息
interface UserFunds {
  id: string;
  nickname?: string;
  email?: string;
  balance: number;         // 余额（分）
  g_points: number;        // G点
  member_level: string;
  member_expire_at?: string;
  created_at: string;
}

// 充值记录
interface RechargeRecord {
  id: string;
  user_id: string;
  order_no: string;
  amount: number;
  recharge_type: string;
  pay_method: string;
  transaction_id: string;
  status: string;
  bonus_amount: number;
  submit_at: string;
  review_at: string;
  reject_reason: string;
  admin_remark: string;
  user?: {
    id: string;
    email: string;
    nickname?: string;
  };
}

// 充值类型映射
const RECHARGE_TYPE_NAMES: Record<string, string> = {
  balance: '余额充值',
  membership: '普通会员',
  super_member: '超级会员',
  g_points: 'G点充值',
};

// 状态映射
const STATUS_NAMES: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
};

// 支付方式映射
const PAY_METHOD_NAMES: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  jdpay: '京东支付',
  bank_transfer: '银行转账',
};

interface FundsPanelProps {
  adminKey: string;
}

export default function FundsPanel({ adminKey }: FundsPanelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'records'>('overview');
  const [userFunds, setUserFunds] = useState<UserFunds[]>([]);
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalGPoints: 0,
    totalUsers: 0,
    todayRecharge: 0,
    pendingRecharge: 0,
    totalRecharge: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserFunds | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'balance' | 'g_points'>('balance');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 获取资金统计
   */
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/funds/stats?adminKey=${adminKey}`
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, [adminKey]);

  /**
   * 获取用户资金列表
   */
  const fetchUserFunds = useCallback(async () => {
    try {
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/funds/users?adminKey=${adminKey}`
      );
      const data = await res.json();
      if (data.success) {
        setUserFunds(data.data || []);
      }
    } catch (error) {
      console.error('Fetch user funds error:', error);
    }
  }, [adminKey]);

  /**
   * 获取充值记录
   */
  const fetchRechargeRecords = useCallback(async () => {
    try {
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/admin/list?adminKey=${adminKey}&limit=50`
      );
      const data = await res.json();
      if (data.success) {
        setRechargeRecords(data.data || []);
      }
    } catch (error) {
      console.error('Fetch recharge records error:', error);
    }
  }, [adminKey]);

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStats(), fetchUserFunds(), fetchRechargeRecords()]);
    setIsLoading(false);
  }, [fetchStats, fetchUserFunds, fetchRechargeRecords]);

  /**
   * 刷新数据
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  /**
   * 调整用户资金
   */
  const handleAdjustFunds = useCallback(async () => {
    if (!selectedUser) return;
    
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount === 0) {
      Alert.alert('提示', '请输入有效的调整金额');
      return;
    }
    
    if (!adjustRemark.trim()) {
      Alert.alert('提示', '请输入调整原因');
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/funds/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey,
          userId: selectedUser.id,
          type: adjustType,
          amount,
          remark: adjustRemark,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('成功', '资金调整成功');
        setShowAdjustModal(false);
        setSelectedUser(null);
        setAdjustAmount('');
        setAdjustRemark('');
        await loadAllData();
      } else {
        Alert.alert('失败', data.error || '调整失败');
      }
    } catch (error) {
      console.error('Adjust funds error:', error);
      Alert.alert('错误', '网络错误');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedUser, adjustType, adjustAmount, adjustRemark, adminKey, loadAllData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 格式化金额
  const formatAmount = (amount: number) => `¥${(amount / 100).toFixed(2)}`;
  
  // 格式化时间
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  // 筛选用户
  const filteredUsers = useMemo(() => {
    if (!searchText) return userFunds;
    return userFunds.filter(user => 
      user.id?.includes(searchText) || 
      user.nickname?.includes(searchText) ||
      user.email?.includes(searchText)
    );
  }, [userFunds, searchText]);

  // 渲染统计卡片
  const renderStatsCards = () => (
    <View style={styles.statsGrid}>
      <View style={[styles.statsCard, { backgroundColor: '#DBEAFE' }]}>
        <View style={styles.statsIconWrapper}>
          <FontAwesome6 name="wallet" size={20} color="#2563EB" />
        </View>
        <View style={styles.statsContent}>
          <ThemedText variant="h3" color="#1E40AF">{formatAmount(stats.totalBalance)}</ThemedText>
          <ThemedText variant="tiny" color="#3B82F6">用户总余额</ThemedText>
        </View>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#FEF3C7' }]}>
        <View style={styles.statsIconWrapper}>
          <FontAwesome6 name="coins" size={20} color="#D97706" />
        </View>
        <View style={styles.statsContent}>
          <ThemedText variant="h3" color="#92400E">{stats.totalGPoints.toLocaleString()}</ThemedText>
          <ThemedText variant="tiny" color="#D97706">用户总G点</ThemedText>
        </View>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#D1FAE5' }]}>
        <View style={styles.statsIconWrapper}>
          <FontAwesome6 name="arrow-trend-up" size={20} color="#059669" />
        </View>
        <View style={styles.statsContent}>
          <ThemedText variant="h3" color="#065F46">{formatAmount(stats.todayRecharge)}</ThemedText>
          <ThemedText variant="tiny" color="#059669">今日充值</ThemedText>
        </View>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#FCE7F3' }]}>
        <View style={styles.statsIconWrapper}>
          <FontAwesome6 name="clock" size={20} color="#DB2777" />
        </View>
        <View style={styles.statsContent}>
          <ThemedText variant="h3" color="#9D174D">{formatAmount(stats.pendingRecharge)}</ThemedText>
          <ThemedText variant="tiny" color="#DB2777">待审核充值</ThemedText>
        </View>
      </View>
    </View>
  );

  // 渲染用户资金列表
  const renderUserFundsList = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="h4" color={theme.textPrimary}>用户资金列表</ThemedText>
        <View style={styles.searchBox}>
          <FontAwesome6 name="magnifying-glass" size={14} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="搜索用户"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      {/* 表头 */}
      <View style={styles.tableHeader}>
        <View style={{ flex: 2 }}><ThemedText variant="caption" color={theme.textMuted}>用户</ThemedText></View>
        <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>余额</ThemedText></View>
        <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>G点</ThemedText></View>
        <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>会员</ThemedText></View>
        <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>操作</ThemedText></View>
      </View>

      {/* 用户列表 */}
      {filteredUsers.map(user => {
        const memberBadge = user.member_level === 'super' 
          ? { label: '超级', color: '#FFD700' }
          : user.member_level === 'member'
          ? { label: '普通', color: theme.primary }
          : { label: '免费', color: '#64748B' };
        
        return (
          <View key={user.id} style={[styles.tableRow, { borderColor: theme.border }]}>
            <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <FontAwesome6 name="user" size={14} color="#fff" />
              </View>
              <View>
                <ThemedText variant="small" color={theme.textPrimary}>
                  {user.nickname || user.email?.split('@')[0] || '未设置'}
                </ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>
                  {user.id.substring(0, 12)}...
                </ThemedText>
              </View>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                {formatAmount(user.balance)}
              </ThemedText>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText variant="smallMedium" color={theme.accent}>
                {user.g_points.toLocaleString()}
              </ThemedText>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View style={[styles.badge, { backgroundColor: memberBadge.color + '20' }]}>
                <Text style={{ color: memberBadge.color, fontSize: 11 }}>{memberBadge.label}</Text>
              </View>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setSelectedUser(user);
                  setShowAdjustModal(true);
                }}
              >
                <FontAwesome6 name="pen" size={12} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );

  // 渲染充值记录列表
  const renderRechargeRecords = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="h4" color={theme.textPrimary}>充值记录</ThemedText>
        <ThemedText variant="small" color={theme.textMuted}>
          共 {rechargeRecords.length} 条记录
        </ThemedText>
      </View>

      {rechargeRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="inbox" size={48} color={theme.textMuted} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            暂无充值记录
          </ThemedText>
        </View>
      ) : (
        rechargeRecords.map(record => {
          const statusColor = STATUS_COLORS[record.status] || theme.textMuted;
          
          return (
            <View key={record.id} style={[styles.recordItem, { borderColor: theme.border }]}>
              <View style={styles.recordHeader}>
                <View style={styles.orderInfo}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {record.order_no}
                  </ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={{ color: statusColor, fontSize: 11, fontWeight: '600' }}>
                      {STATUS_NAMES[record.status]}
                    </Text>
                  </View>
                </View>
                <ThemedText variant="h4" color={theme.textPrimary}>
                  {formatAmount(record.amount + (record.bonus_amount || 0))}
                </ThemedText>
              </View>
              
              <View style={styles.recordBody}>
                <View style={styles.recordDetail}>
                  <FontAwesome6 name="user" size={10} color={theme.textMuted} />
                  <ThemedText variant="tiny" color={theme.textSecondary} style={{ marginLeft: 4 }}>
                    {record.user?.nickname || record.user?.email?.split('@')[0] || record.user_id.substring(0, 8)}
                  </ThemedText>
                </View>
                <View style={styles.recordDetail}>
                  <FontAwesome6 name="credit-card" size={10} color={theme.textMuted} />
                  <ThemedText variant="tiny" color={theme.textSecondary} style={{ marginLeft: 4 }}>
                    {PAY_METHOD_NAMES[record.pay_method] || record.pay_method}
                  </ThemedText>
                </View>
                <View style={styles.recordDetail}>
                  <FontAwesome6 name="tag" size={10} color={theme.textMuted} />
                  <ThemedText variant="tiny" color={theme.textSecondary} style={{ marginLeft: 4 }}>
                    {RECHARGE_TYPE_NAMES[record.recharge_type] || record.recharge_type}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.recordFooter}>
                <ThemedText variant="tiny" color={theme.textMuted}>
                  提交: {formatTime(record.submit_at)}
                </ThemedText>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  // 渲染调整资金弹窗
  const renderAdjustModal = () => (
    <Modal
      visible={showAdjustModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAdjustModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.modalHeader}>
            <ThemedText variant="h4" color={theme.textPrimary}>调整资金</ThemedText>
            <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
              <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 用户信息 */}
          <View style={styles.userInfoBox}>
            <ThemedText variant="small" color={theme.textMuted}>用户: </ThemedText>
            <ThemedText variant="small" color={theme.textPrimary}>
              {selectedUser?.nickname || selectedUser?.email?.split('@')[0]}
            </ThemedText>
          </View>

          {/* 当前资金 */}
          <View style={styles.currentFundsBox}>
            <View style={styles.fundItem}>
              <ThemedText variant="tiny" color={theme.textMuted}>当前余额</ThemedText>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                {selectedUser ? formatAmount(selectedUser.balance) : '¥0.00'}
              </ThemedText>
            </View>
            <View style={styles.fundItem}>
              <ThemedText variant="tiny" color={theme.textMuted}>当前G点</ThemedText>
              <ThemedText variant="smallMedium" color={theme.accent}>
                {selectedUser?.g_points.toLocaleString() || '0'}
              </ThemedText>
            </View>
          </View>

          {/* 调整类型选择 */}
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
            调整类型
          </ThemedText>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                adjustType === 'balance' && styles.typeBtnActive,
                { borderColor: adjustType === 'balance' ? theme.primary : theme.border }
              ]}
              onPress={() => setAdjustType('balance')}
            >
              <FontAwesome6 
                name="wallet" 
                size={16} 
                color={adjustType === 'balance' ? theme.primary : theme.textMuted} 
              />
              <ThemedText 
                variant="small" 
                color={adjustType === 'balance' ? theme.primary : theme.textPrimary}
                style={{ marginLeft: 6 }}
              >
                余额（分）
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                adjustType === 'g_points' && styles.typeBtnActive,
                { borderColor: adjustType === 'g_points' ? theme.accent : theme.border }
              ]}
              onPress={() => setAdjustType('g_points')}
            >
              <FontAwesome6 
                name="coins" 
                size={16} 
                color={adjustType === 'g_points' ? theme.accent : theme.textMuted} 
              />
              <ThemedText 
                variant="small" 
                color={adjustType === 'g_points' ? theme.accent : theme.textPrimary}
                style={{ marginLeft: 6 }}
              >
                G点
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* 调整金额 */}
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm, marginTop: Spacing.md }}>
            调整金额（正数增加，负数减少）
          </ThemedText>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.backgroundTertiary,
              borderColor: theme.border,
              color: theme.textPrimary
            }]}
            placeholder={adjustType === 'balance' ? '输入调整金额（分）' : '输入调整G点数量'}
            placeholderTextColor={theme.textMuted}
            value={adjustAmount}
            onChangeText={setAdjustAmount}
            keyboardType="numeric"
          />

          {/* 调整原因 */}
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm, marginTop: Spacing.md }}>
            调整原因
          </ThemedText>
          <TextInput
            style={[styles.textInput, styles.textArea, { 
              backgroundColor: theme.backgroundTertiary,
              borderColor: theme.border,
              color: theme.textPrimary
            }]}
            placeholder="请输入调整原因（必填）"
            placeholderTextColor={theme.textMuted}
            value={adjustRemark}
            onChangeText={setAdjustRemark}
            multiline
            numberOfLines={3}
          />

          {/* 操作按钮 */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.backgroundTertiary }]}
              onPress={() => setShowAdjustModal(false)}
            >
              <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleAdjustFunds}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText variant="smallMedium" color="#fff">确认调整</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* Tab 导航 */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <FontAwesome6 
            name="users" 
            size={16} 
            color={activeTab === 'overview' ? theme.primary : theme.textMuted} 
          />
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'overview' ? theme.primary : theme.textMuted }
          ]}>
            用户资金 ({stats.totalUsers})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'records' && styles.activeTabButton]}
          onPress={() => setActiveTab('records')}
        >
          <FontAwesome6 
            name="receipt" 
            size={16} 
            color={activeTab === 'records' ? theme.primary : theme.textMuted} 
          />
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'records' ? theme.primary : theme.textMuted }
          ]}>
            充值记录
          </Text>
        </TouchableOpacity>
      </View>

      {/* 内容区 */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'overview' ? renderUserFundsList() : renderRechargeRecords()}
      </ScrollView>

      {/* 调整资金弹窗 */}
      {renderAdjustModal()}
    </View>
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
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statsCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.md,
  },
  statsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  statsContent: {
    flex: 1,
  },
  tabNav: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: Spacing.lg,
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
    fontSize: 13,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 200,
  },
  searchInput: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 13,
    minWidth: 120,
  },
  tableHeader: {
    flexDirection: 'row' as const,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  actionBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: BorderRadius.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing['3xl'],
  },
  recordItem: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  recordHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  orderInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  recordBody: {
    flexDirection: 'row' as const,
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  recordDetail: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  recordFooter: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    width: '90%' as const,
    maxWidth: 480,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  userInfoBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing.md,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  currentFundsBox: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: Spacing.md,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  fundItem: {
    alignItems: 'center' as const,
  },
  typeSelector: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
  },
  typeBtnActive: {
    backgroundColor: theme.primary + '10',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 100,
    alignItems: 'center' as const,
  },
});
