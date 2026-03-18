import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type PayMethod = 'alipay' | 'wechat';

interface PaymentAccount {
  name: string;
  account?: string;
  qrcodeUrl: string;
  realName: string;
}

interface PayOrder {
  orderId: string;
  orderNo: string;
  amount: number;
  payType: PayMethod;
  productType: string;
  expiredAt: string;
  paymentAccount: PaymentAccount;
}

const PAY_METHODS = [
  { 
    id: 'alipay' as PayMethod, 
    name: '支付宝', 
    icon: 'wallet', 
    color: '#1677FF', 
    bgColor: '#1677FF15',
  },
  { 
    id: 'wechat' as PayMethod, 
    name: '微信支付', 
    icon: 'message', 
    color: '#07C160', 
    bgColor: '#07C16015',
  },
];

// 测试用收款二维码（实际使用时替换为真实收款码URL）
const TEST_QRCODES = {
  alipay: 'https://qr.alipay.com/fkx19668fnwkfuxvdtexrdb', // 示例支付宝收款码
  wechat: 'wxp://f2f0d3a5c2e1b4f8a9d7c6e5f4a3b2c1d0', // 示例微信收款码
};

export default function PaymentScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { setMember, checkMembership } = useMembership();
  
  const params = useSafeSearchParams<{ amount?: string; productType?: string }>();
  const amount = parseInt(params.amount || '2900', 10);
  const productType = params.productType || 'membership';

  const [payMethod, setPayMethod] = useState<PayMethod>('alipay');
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PayOrder | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [transactionId, setTransactionId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // 获取产品名称
  const getProductName = () => {
    if (productType === 'super_member') return '超级会员订阅';
    if (productType === 'membership') return '普通会员订阅';
    return '会员订阅';
  };

  // 创建订单
  const createOrder = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId') || 'guest_user';
      
      /**
       * 服务端文件：server/src/routes/payment.ts
       * 接口：POST /api/v1/payment/create
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          payType: payMethod,
          productType: productType as 'membership' | 'super_member',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentOrder(result.data);
        // 设置倒计时（30分钟）
        setCountdown(30 * 60);
        setOrderStatus('pending');
      } else {
        const errorMsg = result.error || '创建订单失败';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('错误', errorMsg);
        }
      }
    } catch (error) {
      console.error('Create order error:', error);
      if (Platform.OS === 'web') {
        window.alert('网络错误，请检查网络连接');
      } else {
        Alert.alert('错误', '网络错误，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  }, [amount, payMethod, productType]);

  // 切换支付方式时重新创建订单
  useEffect(() => {
    createOrder();
  }, [payMethod]);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 用户确认支付
  const handleConfirmPayment = async () => {
    if (!currentOrder) return;
    
    if (!transactionId.trim()) {
      if (Platform.OS === 'web') {
        window.alert('请输入转账流水号或备注信息');
      } else {
        Alert.alert('提示', '请输入转账流水号或备注信息');
      }
      return;
    }
    
    setConfirming(true);
    try {
      const userId = await AsyncStorage.getItem('userId') || 'guest_user';
      
      /**
       * 服务端文件：server/src/routes/payment.ts
       * 接口：POST /api/v1/payment/confirm
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: currentOrder.orderNo,
          userId,
          transactionId: transactionId.trim(),
          remark: '用户确认支付',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOrderStatus('confirming');
        if (Platform.OS === 'web') {
          window.alert('已提交支付确认！请等待管理员审核，审核通过后将自动激活会员。');
        } else {
          Alert.alert('提交成功', '请等待管理员审核，审核通过后将自动激活会员。');
        }
      } else {
        const errorMsg = result.error || '确认失败';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('错误', errorMsg);
        }
      }
    } catch (error) {
      console.error('Confirm payment error:', error);
    } finally {
      setConfirming(false);
    }
  };

  // 复制到剪贴板（Web端）
  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      window.alert('已复制到剪贴板');
    }
  };

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPayMethod = PAY_METHODS.find(p => p.id === payMethod);

  // 获取收款二维码URL
  const getQRCodeUrl = () => {
    if (currentOrder?.paymentAccount?.qrcodeUrl) {
      return currentOrder.paymentAccount.qrcodeUrl;
    }
    // 如果没有配置，使用测试二维码
    return TEST_QRCODES[payMethod];
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', left: 0, padding: Spacing.sm }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary}>
            支付中心
          </ThemedText>
        </View>

        {/* 产品信息卡片 */}
        <LinearGradient
          colors={productType === 'super_member' 
            ? ['#FFD700', '#FF6B00'] 
            : ['#00F0FF', '#BF00FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: BorderRadius.lg,
            padding: Spacing.xl,
            marginBottom: Spacing.xl,
            alignItems: 'center',
          }}
        >
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.md,
          }}>
            <FontAwesome6 name="crown" size={28} color="#fff" />
          </View>
          <ThemedText variant="h2" color="#fff">
            {getProductName()}
          </ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.sm }}>
            <ThemedText variant="h1" color="#fff">
              {formatAmount(amount)}
            </ThemedText>
            <ThemedText variant="small" color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }}>
              /月
            </ThemedText>
          </View>
        </LinearGradient>

        {/* 支付方式选择 */}
        <View style={{ marginBottom: Spacing.xl }}>
          <ThemedText variant="label" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
            选择支付方式
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            {PAY_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={{
                  flex: 1,
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: Spacing.lg,
                  borderRadius: BorderRadius.md,
                  borderWidth: 2,
                  borderColor: payMethod === method.id ? method.color : theme.border,
                  backgroundColor: payMethod === method.id ? method.bgColor : theme.backgroundTertiary,
                }}
                onPress={() => {
                  setPayMethod(method.id);
                  setOrderStatus(null);
                  setTransactionId('');
                }}
              >
                <FontAwesome6 name={method.icon as any} size={24} color={method.color} />
                <ThemedText 
                  variant="small" 
                  color={payMethod === method.id ? method.color : theme.textMuted}
                  style={{ marginTop: Spacing.sm }}
                >
                  {method.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 收款二维码区域 */}
        {loading ? (
          <View style={[styles.qrCard, { alignItems: 'center', justifyContent: 'center', minHeight: 300 }]}>
            <ActivityIndicator size="large" color={currentPayMethod?.color || theme.primary} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              正在生成订单...
            </ThemedText>
          </View>
        ) : currentOrder ? (
          <View style={[styles.qrCard, { alignItems: 'center' }]}>
            {/* 状态提示 */}
            {orderStatus === 'confirming' && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                padding: Spacing.md,
                backgroundColor: '#FEF3C7',
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.lg,
                width: '100%',
              }}>
                <FontAwesome6 name="clock" size={16} color="#D97706" />
                <ThemedText variant="small" color="#D97706">
                  已提交确认，等待审核中...
                </ThemedText>
              </View>
            )}

            {/* 收款二维码 */}
            <View style={{
              padding: Spacing.lg,
              backgroundColor: '#FFFFFF',
              borderRadius: BorderRadius.lg,
              marginBottom: Spacing.lg,
              shadowColor: currentPayMethod?.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}>
              <Image
                source={{ uri: getQRCodeUrl() }}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
            </View>
            
            {/* 收款账户信息 */}
            <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <FontAwesome6 
                  name={currentPayMethod?.icon as any} 
                  size={18} 
                  color={currentPayMethod?.color} 
                />
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {currentOrder.paymentAccount?.name || `${currentPayMethod?.name}收款`}
                </ThemedText>
              </View>
              
              {currentOrder.paymentAccount?.realName && (
                <TouchableOpacity 
                  onPress={() => copyToClipboard(currentOrder.paymentAccount.realName)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}
                >
                  <ThemedText variant="caption" color={theme.textMuted}>
                    收款人：{currentOrder.paymentAccount.realName}
                  </ThemedText>
                  <FontAwesome6 name="copy" size={12} color={theme.textMuted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
              
              {currentOrder.paymentAccount?.account && (
                <TouchableOpacity 
                  onPress={() => copyToClipboard(currentOrder.paymentAccount.account || '')}
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}
                >
                  <ThemedText variant="caption" color={theme.textMuted}>
                    账号：{currentOrder.paymentAccount.account}
                  </ThemedText>
                  <FontAwesome6 name="copy" size={12} color={theme.textMuted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>

            {/* 支付金额 */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              padding: Spacing.md,
              backgroundColor: theme.backgroundTertiary,
              borderRadius: BorderRadius.md,
              marginBottom: Spacing.md,
            }}>
              <ThemedText variant="small" color={theme.textMuted}>
                支付金额：
              </ThemedText>
              <ThemedText variant="h3" color={currentPayMethod?.color}>
                {formatAmount(currentOrder.amount)}
              </ThemedText>
            </View>

            {/* 订单信息 */}
            <View style={{ alignItems: 'center', marginBottom: Spacing.md }}>
              <ThemedText variant="caption" color={theme.textMuted}>
                订单号：{currentOrder.orderNo}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 }}>
                <FontAwesome6 name="clock" size={12} color={countdown > 300 ? theme.textMuted : theme.error} />
                <ThemedText variant="caption" color={countdown > 300 ? theme.textMuted : theme.error}>
                  剩余支付时间 {formatCountdown(countdown)}
                </ThemedText>
              </View>
            </View>

            {/* 支付确认区域 */}
            {orderStatus !== 'confirming' && (
              <View style={{ width: '100%', marginTop: Spacing.md }}>
                <ThemedText variant="small" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
                  转账后请填写流水号/备注：
                </ThemedText>
                <TextInput
                  style={{
                    width: '100%',
                    padding: Spacing.md,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: BorderRadius.md,
                    backgroundColor: theme.backgroundTertiary,
                    color: theme.textPrimary,
                    fontSize: 14,
                  }}
                  placeholder="请输入转账流水号或备注信息"
                  placeholderTextColor={theme.textMuted}
                  value={transactionId}
                  onChangeText={setTransactionId}
                />
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                    padding: Spacing.lg,
                    borderRadius: BorderRadius.lg,
                    backgroundColor: currentPayMethod?.color,
                    marginTop: Spacing.lg,
                  }}
                  onPress={handleConfirmPayment}
                  disabled={confirming}
                >
                  {confirming ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <FontAwesome6 name="circle-check" size={18} color="#fff" />
                      <ThemedText variant="label" color="#fff">
                        我已完成支付，提交确认
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.qrCard, { alignItems: 'center', justifyContent: 'center', minHeight: 300 }]}>
            <FontAwesome6 name="qrcode" size={64} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              点击下方按钮生成订单
            </ThemedText>
            <TouchableOpacity
              style={{
                marginTop: Spacing.lg,
                padding: Spacing.md,
                backgroundColor: theme.primary,
                borderRadius: BorderRadius.md,
              }}
              onPress={createOrder}
            >
              <ThemedText variant="smallMedium" color={theme.backgroundRoot}>
                生成支付订单
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* 支付说明 */}
        <View style={{
          backgroundColor: theme.backgroundTertiary,
          borderRadius: BorderRadius.md,
          padding: Spacing.lg,
          marginTop: Spacing.xl,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <FontAwesome6 name="circle-info" size={16} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              支付说明
            </ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textMuted}>
            1. 选择支付方式后，扫描上方二维码完成转账{'\n'}
            2. 转账金额必须与订单金额一致{'\n'}
            3. 转账完成后，请填写流水号/备注并点击确认{'\n'}
            4. 管理员审核通过后，会员将自动激活{'\n'}
            5. 如有问题请联系客服处理
          </ThemedText>
        </View>

        {/* 管理员入口 */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: Spacing.sm,
            padding: Spacing.md,
            marginTop: Spacing.lg,
          }}
          onPress={() => {
            const adminKey = 'gopen_admin_2024';
            router.push(`/payment-admin?key=${adminKey}`);
          }}
        >
          <FontAwesome6 name="user-shield" size={14} color={theme.textMuted} />
          <ThemedText variant="caption" color={theme.textMuted}>
            管理员审核入口
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
