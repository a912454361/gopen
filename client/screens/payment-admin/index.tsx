import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface PendingOrder {
  id: string;
  order_no: string;
  user_id: string;
  amount: number;
  pay_type: string;
  product_type: string;
  status: string;
  transaction_id?: string;
  user_remark?: string;
  confirmed_at: string;
  users?: {
    nickname?: string;
    phone?: string;
  };
}

export default function PaymentAdminScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ key?: string }>();
  const adminKey = params.key || '';

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingOrders = useCallback(async () => {
    setLoading(true);
    try {
      /**
       * 服务端文件：server/src/routes/payment.ts
       * 接口：GET /api/v1/payment/admin/pending
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/pending?adminKey=${adminKey}`
      );
      
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data || []);
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || '获取订单失败');
        } else {
          Alert.alert('错误', result.error || '获取订单失败');
        }
      }
    } catch (error) {
      console.error('Fetch pending orders error:', error);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (adminKey) {
      fetchPendingOrders();
    }
  }, [adminKey, fetchPendingOrders]);

  const handleVerify = async (orderNo: string, action: 'approve' | 'reject') => {
    setProcessing(orderNo);
    try {
      /**
       * 服务端文件：server/src/routes/payment.ts
       * 接口：POST /api/v1/payment/admin/verify
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo,
          adminKey,
          action,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (Platform.OS === 'web') {
          window.alert(result.message);
        } else {
          Alert.alert('成功', result.message);
        }
        fetchPendingOrders();
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || '操作失败');
        } else {
          Alert.alert('错误', result.error || '操作失败');
        }
      }
    } catch (error) {
      console.error('Verify order error:', error);
    } finally {
      setProcessing(null);
    }
  };

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const getPayTypeName = (type: string) => {
    return type === 'alipay' ? '支付宝' : type === 'wechat' ? '微信' : type;
  };

  const getProductTypeName = (type: string) => {
    return type === 'super_member' ? '超级会员' : type === 'membership' ? '普通会员' : type;
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={{ padding: Spacing.lg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ padding: Spacing.sm, marginLeft: -Spacing.sm }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary} style={{ marginLeft: Spacing.sm }}>
            支付审核
          </ThemedText>
        </View>

        {/* 说明 */}
        <View style={{
          backgroundColor: theme.backgroundTertiary,
          borderRadius: BorderRadius.md,
          padding: Spacing.lg,
          marginBottom: Spacing.xl,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <FontAwesome6 name="shield-halved" size={16} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              管理员审核面板
            </ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textMuted}>
            审核通过后，用户会员将自动激活。请核实用户转账金额和流水号后操作。
          </ThemedText>
        </View>

        {/* 订单列表 */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing['2xl'] }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : orders.length === 0 ? (
          <View style={{ 
            alignItems: 'center', 
            paddingVertical: Spacing['2xl'],
            backgroundColor: theme.backgroundTertiary,
            borderRadius: BorderRadius.lg,
          }}>
            <FontAwesome6 name="check-circle" size={48} color={theme.success} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              暂无待审核订单
            </ThemedText>
          </View>
        ) : (
          <View style={{ gap: Spacing.lg }}>
            {orders.map((order) => (
              <View
                key={order.id}
                style={{
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.lg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                {/* 订单头部 */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: Spacing.md,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <FontAwesome6 
                      name={order.pay_type === 'alipay' ? 'wallet' : 'message'} 
                      size={16} 
                      color={order.pay_type === 'alipay' ? '#1677FF' : '#07C160'} 
                    />
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {getPayTypeName(order.pay_type)}
                    </ThemedText>
                  </View>
                  <View style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 2,
                    backgroundColor: '#FEF3C7',
                    borderRadius: BorderRadius.sm,
                  }}>
                    <ThemedText variant="tiny" color="#D97706">待审核</ThemedText>
                  </View>
                </View>

                {/* 金额 */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: Spacing.md,
                }}>
                  <ThemedText variant="caption" color={theme.textMuted}>支付金额</ThemedText>
                  <ThemedText variant="h3" color={theme.primary}>
                    {formatAmount(order.amount)}
                  </ThemedText>
                </View>

                {/* 产品信息 */}
                <View style={{ marginBottom: Spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <ThemedText variant="caption" color={theme.textMuted}>产品</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {getProductTypeName(order.product_type)}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <ThemedText variant="caption" color={theme.textMuted}>订单号</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {order.order_no}
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <ThemedText variant="caption" color={theme.textMuted}>用户ID</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {order.user_id?.substring(0, 8)}...
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <ThemedText variant="caption" color={theme.textMuted}>确认时间</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {formatDate(order.confirmed_at)}
                    </ThemedText>
                  </View>
                </View>

                {/* 流水号 */}
                {order.transaction_id && (
                  <View style={{
                    backgroundColor: theme.backgroundTertiary,
                    padding: Spacing.md,
                    borderRadius: BorderRadius.md,
                    marginBottom: Spacing.md,
                  }}>
                    <ThemedText variant="caption" color={theme.textMuted}>流水号/备注</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary} style={{ marginTop: 4 }}>
                      {order.transaction_id}
                    </ThemedText>
                  </View>
                )}

                {/* 操作按钮 */}
                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: Spacing.sm,
                      padding: Spacing.md,
                      backgroundColor: theme.success,
                      borderRadius: BorderRadius.md,
                    }}
                    onPress={() => handleVerify(order.order_no, 'approve')}
                    disabled={processing === order.id}
                  >
                    {processing === order.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <FontAwesome6 name="check" size={16} color="#fff" />
                        <ThemedText variant="smallMedium" color="#fff">通过</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: Spacing.sm,
                      padding: Spacing.md,
                      backgroundColor: theme.error,
                      borderRadius: BorderRadius.md,
                    }}
                    onPress={() => handleVerify(order.order_no, 'reject')}
                    disabled={processing === order.id}
                  >
                    {processing === order.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <FontAwesome6 name="xmark" size={16} color="#fff" />
                        <ThemedText variant="smallMedium" color="#fff">拒绝</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 刷新按钮 */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.sm,
            padding: Spacing.lg,
            marginTop: Spacing.xl,
            backgroundColor: theme.primary,
            borderRadius: BorderRadius.lg,
          }}
          onPress={fetchPendingOrders}
        >
          <FontAwesome6 name="rotate" size={16} color={theme.backgroundRoot} />
          <ThemedText variant="smallMedium" color={theme.backgroundRoot}>刷新列表</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
