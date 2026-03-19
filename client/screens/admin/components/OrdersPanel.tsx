/**
 * 订单管理面板
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface PaymentAccount {
  name: string;
  account: string;
  realName: string;
}

interface Order {
  id: string;
  order_no: string;
  user_id: string;
  amount: number;
  pay_type: string;
  product_type: string;
  status: string;
  transaction_id?: string;
  user_remark?: string;
  created_at: string;
  confirmed_at?: string;
  paid_at?: string;
  paymentAccount?: PaymentAccount;
}

interface OrdersPanelProps {
  adminKey: string;
}

export function OrdersPanel({ adminKey }: OrdersPanelProps) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'rejected'>('all');
  const [searchText, setSearchText] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filter === 'all' ? '' : `&status=${filter}`;
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/orders?key=${adminKey}${statusParam}`
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
  }, [adminKey, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleVerify = async (orderNo: string, action: 'approve' | 'reject') => {
    setProcessing(orderNo);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo, adminKey, action }),
      });
      
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', result.message);
        fetchOrders();
      } else {
        Alert.alert('错误', result.error || '操作失败');
      }
    } catch (error) {
      console.error('Verify order error:', error);
    } finally {
      setProcessing(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchText) return true;
    return order.order_no.includes(searchText) || 
           order.user_id?.includes(searchText) ||
           order.transaction_id?.includes(searchText);
  });

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };
  
  const getTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  const statusTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'paid', label: '已完成' },
    { key: 'rejected', label: '已拒绝' },
  ];

  // 订单详情弹窗
  const OrderDetailModal = () => {
    if (!selectedOrder) return null;
    
    const order = selectedOrder;
    const isTimeout = order.status === 'confirming' && order.confirmed_at && 
      (Date.now() - new Date(order.confirmed_at).getTime()) > 30 * 60 * 1000;
    
    return (
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setDetailModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={{
              width: 600,
              maxHeight: '80%',
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.xl,
              overflow: 'hidden',
            }} 
            onPress={(e: any) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: Spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: theme.border,
            }}>
              <ThemedText variant="h4" color={theme.textPrimary}>订单详情</ThemedText>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ padding: Spacing.lg }}>
              {/* 状态提示 */}
              {order.status === 'confirming' && (
                <View style={{
                  padding: Spacing.lg,
                  backgroundColor: isTimeout ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  borderRadius: BorderRadius.lg,
                  marginBottom: Spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.md,
                }}>
                  <FontAwesome6 
                    name={isTimeout ? 'exclamation-triangle' : 'clock'} 
                    size={20} 
                    color={isTimeout ? theme.error : '#F59E0B'} 
                  />
                  <ThemedText variant="small" color={isTimeout ? theme.error : '#F59E0B'}>
                    {isTimeout ? '订单已超时30分钟，建议尽快处理' : `等待审核 ${getTimeAgo(order.confirmed_at || '')}`}
                  </ThemedText>
                </View>
              )}
              
              {/* 基本信息 */}
              <View style={{ gap: Spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText variant="small" color={theme.textMuted}>订单号</ThemedText>
                  <ThemedText variant="small" color={theme.textPrimary}>{order.order_no}</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText variant="small" color={theme.textMuted}>金额</ThemedText>
                  <ThemedText variant="smallMedium" color={theme.primary}>{formatAmount(order.amount)}</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText variant="small" color={theme.textMuted}>产品类型</ThemedText>
                  <ThemedText variant="small" color={theme.textPrimary}>
                    {order.product_type === 'super_member' ? '超级会员' : '普通会员'}
                  </ThemedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText variant="small" color={theme.textMuted}>支付方式</ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <FontAwesome6 
                      name={order.pay_type === 'alipay' ? 'wallet' : 'message'} 
                      size={14} 
                      color={order.pay_type === 'alipay' ? '#1677FF' : '#07C160'} 
                    />
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {order.pay_type === 'alipay' ? '支付宝' : '微信'}
                    </ThemedText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText variant="small" color={theme.textMuted}>订单状态</ThemedText>
                  <View style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing.xs,
                    backgroundColor: 
                      order.status === 'paid' ? 'rgba(16,185,129,0.1)' :
                      order.status === 'confirming' ? 'rgba(245,158,11,0.1)' :
                      'rgba(239,68,68,0.1)',
                    borderRadius: BorderRadius.sm,
                  }}>
                    <ThemedText variant="tiny" color={
                      order.status === 'paid' ? theme.success :
                      order.status === 'confirming' ? '#F59E0B' :
                      theme.error
                    }>
                      {order.status === 'paid' ? '已完成' :
                       order.status === 'confirming' ? '待审核' :
                       order.status === 'rejected' ? '已拒绝' : order.status}
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              {/* 收款账户信息 */}
              <View style={{ marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: theme.border }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                  收款账户信息
                </ThemedText>
                <View style={{
                  padding: Spacing.lg,
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: BorderRadius.lg,
                  gap: Spacing.md,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <FontAwesome6 
                      name={order.pay_type === 'alipay' ? 'wallet' : 'message'} 
                      size={20} 
                      color={order.pay_type === 'alipay' ? '#1677FF' : '#07C160'} 
                    />
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {order.paymentAccount?.name || (order.pay_type === 'alipay' ? '支付宝' : '微信')}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText variant="small" color={theme.textMuted}>收款账号</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {order.paymentAccount?.account || '-'}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText variant="small" color={theme.textMuted}>收款人</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {order.paymentAccount?.realName || '-'}
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              {/* 用户提交的信息 */}
              <View style={{ marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: theme.border }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                  用户提交信息
                </ThemedText>
                <View style={{
                  padding: Spacing.lg,
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: BorderRadius.lg,
                  gap: Spacing.md,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText variant="small" color={theme.textMuted}>用户ID</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary} style={{ maxWidth: 300 }} selectable>
                      {order.user_id}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText variant="small" color={theme.textMuted}>交易流水号</ThemedText>
                    <ThemedText variant="small" color={theme.primary} style={{ maxWidth: 300 }} selectable>
                      {order.transaction_id || '-'}
                    </ThemedText>
                  </View>
                  {order.user_remark && (
                    <View style={{ gap: Spacing.xs }}>
                      <ThemedText variant="small" color={theme.textMuted}>用户备注</ThemedText>
                      <ThemedText variant="small" color={theme.textPrimary}>{order.user_remark}</ThemedText>
                    </View>
                  )}
                </View>
              </View>
              
              {/* 时间信息 */}
              <View style={{ marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: theme.border }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                  时间信息
                </ThemedText>
                <View style={{ gap: Spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText variant="small" color={theme.textMuted}>创建时间</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>{formatDate(order.created_at)}</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText variant="small" color={theme.textMuted}>确认时间</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>{formatDate(order.confirmed_at || '')}</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText variant="small" color={theme.textMuted}>支付时间</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>{formatDate(order.paid_at || '')}</ThemedText>
                  </View>
                </View>
              </View>
            </ScrollView>
            
            {/* 操作按钮 */}
            {order.status === 'confirming' && (
              <View style={{
                flexDirection: 'row',
                gap: Spacing.md,
                padding: Spacing.lg,
                borderTopWidth: 1,
                borderTopColor: theme.border,
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.md,
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.lg,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleVerify(order.order_no, 'reject');
                  }}
                >
                  <ThemedText variant="smallMedium" color={theme.error}>拒绝</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.md,
                    backgroundColor: theme.success,
                    borderRadius: BorderRadius.lg,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleVerify(order.order_no, 'approve');
                  }}
                >
                  <ThemedText variant="smallMedium" color="#fff">通过</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={{ gap: Spacing.xl }}>
      <OrderDetailModal />
      
      {/* 筛选栏 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.md,
      }}>
        {/* 状态筛选 */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {statusTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={{
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.lg,
                backgroundColor: filter === tab.key ? theme.primary : theme.backgroundTertiary,
                borderRadius: BorderRadius.lg,
              }}
              onPress={() => setFilter(tab.key)}
            >
              <ThemedText variant="small" color={filter === tab.key ? '#fff' : theme.textPrimary}>
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 搜索框 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          backgroundColor: theme.backgroundTertiary,
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          minWidth: 250,
        }}>
          <FontAwesome6 name="magnifying-glass" size={14} color={theme.textMuted} />
          <TextInput
            style={{ flex: 1, color: theme.textPrimary, outline: 'none' }}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="搜索订单号/用户ID/流水号"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      {/* 订单列表 */}
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'] }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={{ 
          alignItems: 'center', 
          paddingVertical: Spacing['3xl'],
          backgroundColor: theme.backgroundDefault,
          borderRadius: BorderRadius.xl,
        }}>
          <FontAwesome6 name="inbox" size={48} color={theme.textMuted} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            暂无订单
          </ThemedText>
        </View>
      ) : (
        <View style={{ gap: Spacing.md }}>
          {/* 表头 */}
          <View style={{
            flexDirection: 'row',
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            backgroundColor: theme.backgroundTertiary,
            borderRadius: BorderRadius.lg,
          }}>
            <View style={{ flex: 2 }}><ThemedText variant="caption" color={theme.textMuted}>订单号</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>金额</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>产品</ThemedText></View>
            <View style={{ flex: 1.5 }}><ThemedText variant="caption" color={theme.textMuted}>收款账户</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>状态</ThemedText></View>
            <View style={{ flex: 2 }}><ThemedText variant="caption" color={theme.textMuted}>时间</ThemedText></View>
            <View style={{ flex: 1.5 }}><ThemedText variant="caption" color={theme.textMuted}>操作</ThemedText></View>
          </View>

          {/* 订单行 */}
          {filteredOrders.map(order => {
            const isTimeout = order.status === 'confirming' && order.confirmed_at && 
              (Date.now() - new Date(order.confirmed_at).getTime()) > 30 * 60 * 1000;
            
            return (
              <TouchableOpacity
                key={order.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: Spacing.lg,
                  paddingHorizontal: Spacing.lg,
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  borderWidth: isTimeout ? 2 : 1,
                  borderColor: isTimeout ? theme.error : theme.border,
                }}
                onPress={() => {
                  setSelectedOrder(order);
                  setDetailModalVisible(true);
                }}
              >
                <View style={{ flex: 2 }}>
                  <ThemedText variant="small" color={theme.textPrimary}>{order.order_no}</ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>{order.user_id?.substring(0, 12)}...</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="smallMedium" color={theme.primary}>{formatAmount(order.amount)}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="small" color={theme.textPrimary}>
                    {order.product_type === 'super_member' ? '超级会员' : '普通会员'}
                  </ThemedText>
                </View>
                <View style={{ flex: 1.5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                    <FontAwesome6 
                      name={order.pay_type === 'alipay' ? 'wallet' : 'message'} 
                      size={14} 
                      color={order.pay_type === 'alipay' ? '#1677FF' : '#07C160'} 
                    />
                    <View>
                      <ThemedText variant="tiny" color={theme.textPrimary}>
                        {order.paymentAccount?.account || (order.pay_type === 'alipay' ? '支付宝' : '微信')}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing.xs,
                    backgroundColor: 
                      order.status === 'paid' ? 'rgba(16,185,129,0.1)' :
                      order.status === 'confirming' ? (isTimeout ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)') :
                      'rgba(239,68,68,0.1)',
                    borderRadius: BorderRadius.sm,
                    alignSelf: 'flex-start',
                  }}>
                    <ThemedText variant="tiny" color={
                      order.status === 'paid' ? theme.success :
                      order.status === 'confirming' ? (isTimeout ? theme.error : '#F59E0B') :
                      theme.error
                    }>
                      {order.status === 'paid' ? '已完成' :
                       order.status === 'confirming' ? (isTimeout ? '超时' : '待审核') :
                       order.status === 'rejected' ? '已拒绝' : order.status}
                    </ThemedText>
                  </View>
                </View>
                <View style={{ flex: 2 }}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {formatDate(order.confirmed_at || order.created_at)}
                  </ThemedText>
                  {order.transaction_id && (
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      流水: {order.transaction_id}
                    </ThemedText>
                  )}
                </View>
                <View style={{ flex: 1.5, flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                  {order.status === 'confirming' && (
                    <>
                      <TouchableOpacity
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: theme.success,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleVerify(order.order_no, 'approve');
                        }}
                        disabled={processing === order.id}
                      >
                        {processing === order.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <FontAwesome6 name="check" size={14} color="#fff" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: theme.error,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleVerify(order.order_no, 'reject');
                        }}
                        disabled={processing === order.id}
                      >
                        <FontAwesome6 name="xmark" size={14} color="#fff" />
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: theme.backgroundTertiary,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                      setDetailModalVisible(true);
                    }}
                  >
                    <FontAwesome6 name="eye" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 统计 */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        backgroundColor: theme.backgroundTertiary,
        borderRadius: BorderRadius.lg,
      }}>
        <ThemedText variant="small" color={theme.textMuted}>
          共 {filteredOrders.length} 条订单
        </ThemedText>
        <TouchableOpacity onPress={fetchOrders} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <FontAwesome6 name="rotate" size={12} color={theme.primary} />
          <ThemedText variant="small" color={theme.primary}>刷新</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
