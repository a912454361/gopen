import React, { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
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

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type PayMethod = 'alipay' | 'wechat' | 'douyin';

interface PayOrder {
  id: string;
  order_no: string;
  amount: number;
  pay_type: string;
  status: string;
  qr_code_url: string;
  qr_code_data: string;
  expiredAt: string;
}

const PAY_METHODS = [
  { id: 'alipay', name: '支付宝', icon: 'wallet', color: '#1677FF', bgColor: '#1677FF20' },
  { id: 'wechat', name: '微信支付', icon: 'message', color: '#07C160', bgColor: '#07C16020' },
  { id: 'douyin', name: '抖音支付', icon: 'play', color: '#000000', bgColor: '#00000020' },
];

export default function PaymentScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { setMember, checkMembership } = useMembership();
  
  // 使用 useSafeSearchParams 获取参数
  const params = useSafeSearchParams<{ amount?: number; productType?: string }>();
  const amount = params.amount || 2900;
  const productType = params.productType || 'membership';

  const [payMethod, setPayMethod] = useState<PayMethod>('alipay');
  const [loading, setLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<PayOrder | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [paying, setPaying] = useState(false);

  // 获取产品名称
  const getProductName = () => {
    if (productType === 'super_member') return '超级会员订阅';
    if (productType === 'membership') return '普通会员订阅';
    return '会员订阅';
  };

  // 页面加载时自动生成订单
  useEffect(() => {
    generateOrder();
  }, [payMethod]);

  // 倒计时
  useEffect(() => {
    if (countdown > 0 && currentOrder) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && currentOrder) {
      setCurrentOrder(null);
      setTimeout(() => generateOrder(), 500);
    }
  }, [countdown, currentOrder]);

  // 轮询支付状态
  useEffect(() => {
    if (currentOrder && countdown > 0) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(
            `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/status/${currentOrder.order_no}`
          );
          const result = await response.json();
          
          if (result.success && result.data.status === 'paid') {
            clearInterval(interval);
            handlePaySuccess();
          }
        } catch (error) {
          console.error('Poll status error:', error);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [currentOrder, countdown]);

  // 生成订单
  const generateOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/qrcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo_user_001',
          amount: amount,
          payType: payMethod,
          productType: productType as 'membership' | 'super_member',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentOrder(result.data);
        const expiresAt = new Date(result.data.expiredAt);
        const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        setCountdown(remaining);
      } else {
        if (Platform.OS === 'web') {
          window.alert(result.error || '无法生成支付订单');
        } else {
          Alert.alert('生成失败', result.error || '无法生成支付订单');
        }
      }
    } catch (error) {
      console.error('Generate order error:', error);
      if (Platform.OS === 'web') {
        window.alert('网络错误，请检查网络连接后重试');
      } else {
        Alert.alert('网络错误', '请检查网络连接后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 支付成功处理
  const handlePaySuccess = async () => {
    const expireDate = new Date();
    expireDate.setMonth(expireDate.getMonth() + 1);
    
    if (productType === 'super_member') {
      await setMember('super', expireDate.toISOString(), 'monthly');
    } else if (productType === 'membership') {
      await setMember('member', expireDate.toISOString(), 'monthly');
    }
    
    await checkMembership();
    
    if (Platform.OS === 'web') {
      window.alert('支付成功！会员已开通，感谢您的支持！');
      router.replace('/membership');
    } else {
      Alert.alert('支付成功', '会员已开通，感谢您的支持！', [
        { text: '好的', onPress: () => router.replace('/membership') },
      ]);
    }
    setCurrentOrder(null);
  };

  // 模拟支付成功（测试用）
  const handleSimulatePay = async () => {
    if (!currentOrder) return;
    
    setPaying(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/simulate/${currentOrder.order_no}`,
        { method: 'POST' }
      );
      const result = await response.json();
      
      if (result.success) {
        handlePaySuccess();
      } else {
        if (Platform.OS === 'web') {
          window.alert('支付失败，请重试');
        } else {
          Alert.alert('支付失败', '请重试');
        }
      }
    } catch (error) {
      console.error('Simulate pay error:', error);
    } finally {
      setPaying(false);
    }
  };

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;

  // 生成二维码图片URL
  const getQRCodeUrl = () => {
    if (!currentOrder) return null;
    const payMethodName = PAY_METHODS.find(p => p.id === payMethod)?.name || '支付';
    const content = `G Open ${payMethodName}\n订单: ${currentOrder.order_no}\n金额: ${formatAmount(currentOrder.amount)}\n产品: ${getProductName()}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(content)}`;
  };

  const currentPayMethod = PAY_METHODS.find(p => p.id === payMethod);

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
                onPress={() => setPayMethod(method.id as PayMethod)}
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

        {/* 二维码区域 */}
        <View style={[styles.qrCard, { alignItems: 'center' }]}>
          {loading ? (
            <View style={{ height: 280, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={currentPayMethod?.color || theme.primary} />
              <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                正在生成支付码...
              </ThemedText>
            </View>
          ) : currentOrder ? (
            <>
              <View style={{
                padding: Spacing.md,
                backgroundColor: '#fff',
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.lg,
              }}>
                <Image
                  source={{ uri: getQRCodeUrl() || '' }}
                  style={{ width: 200, height: 200 }}
                  resizeMode="contain"
                />
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <FontAwesome6 
                  name={currentPayMethod?.icon as any} 
                  size={16} 
                  color={currentPayMethod?.color} 
                />
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  请使用{currentPayMethod?.name}扫码支付
                </ThemedText>
              </View>
              
              <View style={styles.statusContainer}>
                <FontAwesome6
                  name="clock"
                  size={14}
                  color={countdown > 60 ? theme.textMuted : theme.error}
                />
                <ThemedText
                  variant="small"
                  color={countdown > 60 ? theme.textMuted : theme.error}
                >
                  支付码有效期 {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </ThemedText>
              </View>
              
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                订单号：{currentOrder.order_no}
              </ThemedText>

              {/* 刷新按钮 */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.xs,
                  marginTop: Spacing.md,
                  padding: Spacing.sm,
                }}
                onPress={generateOrder}
              >
                <FontAwesome6 name="rotate" size={14} color={theme.primary} />
                <ThemedText variant="caption" color={theme.primary}>
                  刷新支付码
                </ThemedText>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ height: 280, justifyContent: 'center', alignItems: 'center' }}>
              <FontAwesome6 name="qrcode" size={64} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                点击下方按钮生成支付码
              </ThemedText>
            </View>
          )}
        </View>

        {/* 模拟支付按钮（测试环境） */}
        {currentOrder && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.sm,
              padding: Spacing.lg,
              borderRadius: BorderRadius.lg,
              backgroundColor: theme.success,
              marginTop: Spacing.lg,
            }}
            onPress={handleSimulatePay}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FontAwesome6 name="circle-check" size={18} color="#fff" />
                <ThemedText variant="label" color="#fff">
                  模拟支付成功（测试）
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* 温馨提示 */}
        <View style={{
          backgroundColor: theme.backgroundTertiary,
          borderRadius: BorderRadius.md,
          padding: Spacing.lg,
          marginTop: Spacing.xl,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <FontAwesome6 name="circle-info" size={16} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              温馨提示
            </ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textMuted}>
            1. 支持支付宝、微信、抖音扫码支付{'\n'}
            2. 请在支付码有效期内完成支付{'\n'}
            3. 支付成功后会员权益将自动激活{'\n'}
            4. 如有问题请联系客服处理
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
