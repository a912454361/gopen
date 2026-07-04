/**
 * 充值审核面板
 * 管理员审核用户充值申请
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
  Modal,
  TextInput,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

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
    member_level: string;
  };
}

// 充值类型映射
const RECHARGE_TYPE_NAMES: Record<string, string> = {
  balance: '余额充值',
  membership: '普通会员',
  super_member: '超级会员',
};

// 支付方式映射
const PAY_METHOD_NAMES: Record<string, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  jdpay: '京东支付',
  bank_transfer: '银行转账',
};

// 支付方式颜色
const PAY_METHOD_COLORS: Record<string, string> = {
  alipay: '#1677FF',
  wechat: '#07C160',
  jdpay: '#E4393C',
  bank_transfer: '#6B7280',
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

interface RechargePanelProps {
  adminKey: string;
}

export default function RechargePanel({ adminKey }: RechargePanelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [records, setRecords] = useState<RechargeRecord[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    todayCount: 0,
    todayAmount: 0,
    totalApproved: 0,
    totalAmount: 0,
  });
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [selectedRecord, setSelectedRecord] = useState<RechargeRecord | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 获取充值统计
   */
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/admin/stats?adminKey=${adminKey}`
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
   * 获取充值列表
   */
  const fetchRecords = useCallback(async () => {
    try {
      const status = activeTab === 'pending' ? 'pending' : undefined;
      const url = status
        ? `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/admin/pending?adminKey=${adminKey}`
        : `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/admin/list?adminKey=${adminKey}&limit=100`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('Fetch records error:', error);
    }
  }, [adminKey, activeTab]);

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStats(), fetchRecords()]);
    setIsLoading(false);
  }, [fetchStats, fetchRecords]);

  /**
   * 刷新数据
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  /**
   * 审核通过
   */
  const handleApprove = useCallback(async (record: RechargeRecord) => {
    Alert.alert(
      '确认通过',
      `确定通过此充值申请？\n金额: ¥${((record.amount + (record.bonus_amount || 0)) / 100).toFixed(2)}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定通过',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/admin/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderNo: record.order_no,
                  adminKey,
                  action: 'approve',
                }),
              });
              const data = await res.json();
              
              if (data.success) {
                Alert.alert('成功', '审核通过，余额已到账');
                await loadAllData();
              } else {
                Alert.alert('失败', data.error || '审核失败');
              }
            } catch (error) {
              console.error('Approve error:', error);
              Alert.alert('错误', '网络错误');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  }, [adminKey, loadAllData]);

  /**
   * 审核拒绝
   */
  const handleReject = useCallback(async () => {
    if (!selectedRecord) return;
    
    if (!rejectReason.trim()) {
      Alert.alert('提示', '请输入拒绝原因');
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/admin/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: selectedRecord.order_no,
          adminKey,
          action: 'reject',
          rejectReason,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('成功', '已拒绝充值申请');
        setShowRejectModal(false);
        setSelectedRecord(null);
        setRejectReason('');
        await loadAllData();
      } else {
        Alert.alert('失败', data.error || '审核失败');
      }
    } catch (error) {
      console.error('Reject error:', error);
      Alert.alert('错误', '网络错误');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRecord, rejectReason, adminKey, loadAllData]);

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

  // 渲染统计卡片
  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={[styles.statsCard, { backgroundColor: '#FEF3C7' }]}>
        <FontAwesome6 name="clock" size={24} color="#D97706" />
        <View style={styles.statsInfo}>
          <ThemedText variant="h3" color="#92400E">{stats.pendingCount}</ThemedText>
          <ThemedText variant="caption" color="#92400E">待审核</ThemedText>
        </View>
        <ThemedText variant="smallMedium" color="#D97706">
          {formatAmount(stats.pendingAmount)}
        </ThemedText>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#DBEAFE' }]}>
        <FontAwesome6 name="circle-check" size={24} color="#2563EB" />
        <View style={styles.statsInfo}>
          <ThemedText variant="h3" color="#1E40AF">{stats.todayCount}</ThemedText>
          <ThemedText variant="caption" color="#1E40AF">今日审核</ThemedText>
        </View>
        <ThemedText variant="smallMedium" color="#2563EB">
          {formatAmount(stats.todayAmount)}
        </ThemedText>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#D1FAE5' }]}>
        <FontAwesome6 name="coins" size={24} color="#059669" />
        <View style={styles.statsInfo}>
          <ThemedText variant="h3" color="#065F46">{stats.totalApproved}</ThemedText>
          <ThemedText variant="caption" color="#065F46">累计充值</ThemedText>
        </View>
        <ThemedText variant="smallMedium" color="#059669">
          {formatAmount(stats.totalAmount)}
        </ThemedText>
      </View>
    </View>
  );

  // 渲染充值记录项
  const renderRecordItem = (record: RechargeRecord) => {
    const payMethodColor = PAY_METHOD_COLORS[record.pay_method] || theme.textMuted;
    const statusColor = STATUS_COLORS[record.status] || theme.textMuted;
    
    return (
      <View key={record.id} style={[styles.recordItem, { borderColor: theme.border }]}>
        {/* 头部：订单号和状态 */}
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
        </View>
        
        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <FontAwesome6 name="user" size={12} color={theme.textMuted} />
          <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: 4 }}>
            {record.user?.email || record.user_id.substring(0, 8)}...
          </ThemedText>
          {record.user?.member_level && record.user.member_level !== 'free' && (
            <View style={[styles.memberBadge, { backgroundColor: theme.primary + '20' }]}>
              <Text style={{ color: theme.primary, fontSize: 10 }}>
                {record.user.member_level === 'super' ? '超级会员' : '普通会员'}
              </Text>
            </View>
          )}
        </View>
        
        {/* 充值详情 */}
        <View style={styles.recordDetails}>
          <View style={styles.detailItem}>
            <ThemedText variant="caption" color={theme.textMuted}>类型</ThemedText>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              {RECHARGE_TYPE_NAMES[record.recharge_type]}
            </ThemedText>
          </View>
          
          <View style={styles.detailItem}>
            <ThemedText variant="caption" color={theme.textMuted}>支付方式</ThemedText>
            <View style={[styles.payMethodBadge, { backgroundColor: payMethodColor + '20' }]}>
              <Text style={{ color: payMethodColor, fontSize: 13 }}>
                {PAY_METHOD_NAMES[record.pay_method]}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <ThemedText variant="caption" color={theme.textMuted}>流水号</ThemedText>
            <ThemedText variant="small" color={theme.textPrimary} numberOfLines={1}>
              {record.transaction_id || '-'}
            </ThemedText>
          </View>
        </View>
        
        {/* 金额 */}
        <View style={styles.amountContainer}>
          <View style={styles.amountInfo}>
            <ThemedText variant="tiny" color={theme.textMuted}>充值金额</ThemedText>
            <ThemedText variant="h4" color={theme.textPrimary}>
              {formatAmount(record.amount)}
            </ThemedText>
          </View>
          
          {record.bonus_amount > 0 && (
            <View style={styles.amountInfo}>
              <ThemedText variant="tiny" color={theme.success}>赠送金额</ThemedText>
              <ThemedText variant="smallMedium" color={theme.success}>
                +{formatAmount(record.bonus_amount)}
              </ThemedText>
            </View>
          )}
          
          <View style={[styles.amountInfo, styles.totalAmount]}>
            <ThemedText variant="tiny" color={theme.primary}>到账总额</ThemedText>
            <ThemedText variant="h4" color={theme.primary}>
              {formatAmount(record.amount + (record.bonus_amount || 0))}
            </ThemedText>
          </View>
        </View>
        
        {/* 时间 */}
        <View style={styles.timeInfo}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            提交: {formatTime(record.submit_at)}
          </ThemedText>
          {record.review_at && (
            <ThemedText variant="tiny" color={theme.textMuted} style={{ marginLeft: 12 }}>
              审核: {formatTime(record.review_at)}
            </ThemedText>
          )}
        </View>
        
        {/* 审核备注 */}
        {record.reject_reason && (
          <View style={[styles.remarkBox, { backgroundColor: '#FEF2F2' }]}>
            <FontAwesome6 name="circle-xmark" size={12} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 12, marginLeft: 4 }}>
              拒绝原因: {record.reject_reason}
            </Text>
          </View>
        )}
        
        {record.admin_remark && record.status === 'approved' && (
          <View style={[styles.remarkBox, { backgroundColor: '#F0FDF4' }]}>
            <FontAwesome6 name="circle-check" size={12} color="#10B981" />
            <Text style={{ color: '#10B981', fontSize: 12, marginLeft: 4 }}>
              {record.admin_remark}
            </Text>
          </View>
        )}
        
        {/* 操作按钮 */}
        {record.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => {
                setSelectedRecord(record);
                setShowRejectModal(true);
              }}
              disabled={isProcessing}
            >
              <FontAwesome6 name="xmark" size={16} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 15, marginLeft: 6, fontWeight: '600' }}>拒绝</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(record)}
              disabled={isProcessing}
            >
              <FontAwesome6 name="check" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 15, marginLeft: 6, fontWeight: '600' }}>通过</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // 渲染拒绝弹窗
  const renderRejectModal = () => (
    <Modal
      visible={showRejectModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRejectModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.modalHeader}>
            <ThemedText variant="h4" color={theme.textPrimary}>拒绝充值</ThemedText>
            <TouchableOpacity onPress={() => setShowRejectModal(false)}>
              <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          
          <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
            订单号: {selectedRecord?.order_no}
          </ThemedText>
          
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.backgroundTertiary,
              borderColor: theme.border,
              color: theme.textPrimary
            }]}
            placeholder="请输入拒绝原因"
            placeholderTextColor={theme.textMuted}
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.backgroundTertiary }]}
              onPress={() => setShowRejectModal(false)}
            >
              <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
              onPress={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText variant="smallMedium" color="#fff">确认拒绝</ThemedText>
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
          style={[styles.tabButton, activeTab === 'pending' && styles.activeTabButton]}
          onPress={() => setActiveTab('pending')}
        >
          <FontAwesome6 
            name="clock" 
            size={16} 
            color={activeTab === 'pending' ? theme.primary : theme.textMuted} 
          />
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'pending' ? theme.primary : theme.textMuted }
          ]}>
            待审核 ({stats.pendingCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.activeTabButton]}
          onPress={() => setActiveTab('all')}
        >
          <FontAwesome6 
            name="list" 
            size={16} 
            color={activeTab === 'all' ? theme.primary : theme.textMuted} 
          />
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'all' ? theme.primary : theme.textMuted }
          ]}>
            全部记录
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 记录列表 */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="inbox" size={48} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              暂无{activeTab === 'pending' ? '待审核' : ''}充值记录
            </ThemedText>
          </View>
        ) : (
          records.map(renderRecordItem)
        )}
      </ScrollView>
      
      {/* 拒绝弹窗 */}
      {renderRejectModal()}
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
  statsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    flex: 1,
    minWidth: 100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  statsInfo: {
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
    paddingVertical: Spacing.lg,
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
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing['3xl'],
  },
  recordItem: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recordHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  orderInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    flexWrap: 'wrap' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  userInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  memberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  recordDetails: {
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  payMethodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  amountContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: Spacing.lg,
  },
  amountInfo: {
    alignItems: 'center' as const,
  },
  totalAmount: {
    backgroundColor: theme.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  timeInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    flexWrap: 'wrap' as const,
    paddingVertical: Spacing.sm,
  },
  remarkBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 48,
  },
  rejectButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%' as const,
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    minHeight: 48,
    justifyContent: 'center' as const,
  },
});
