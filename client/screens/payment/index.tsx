import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
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

type PayType = 'alipay' | 'wechat';

interface PayOrder {
  id: string;
  order_no: string;
  amount: number;
  pay_type: string;
  status: string;
  qr_code_url: string;
  expired_at: string;
}

export default function PaymentScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { setMember, checkMembership } = useMembership();
  const params = useSafeSearchParams<{ amount?: number; productType?: string }>();

  const [payType, setPayType] = useState<PayType>('alipay');
  const [amount] = useState(params.amount?.toString() || '2900');
  const [loading, setLoading] = useState(false);
  
  // 二维码状态
  const [currentOrder, setCurrentOrder] = useState<PayOrder | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [paying, setPaying] = useState(false);

  // 产品类型
  const productType = params.productType || 'membership';

  // 获取产品名称
  const getProductName = () => {
    if (productType === 'super_member') return '超级会员订阅';
    if (productType === 'membership') return '普通会员订阅';
    return '会员订阅';
  };

  // 页面加载时自动生成二维码
  useEffect(() => {
    if (!currentOrder) {
      handleGenerateQRCode();
    }
  }, []);

  // 倒计时
  useEffect(() => {
    if (countdown > 0 && currentOrder) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && currentOrder) {
      // 超时，重新生成
      setCurrentOrder(null);
      setTimeout(() => {
        handleGenerateQRCode();
      }, 500);
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
      alert('支付成功！会员已开通，感谢您的支持！');
      router.push('/membership');
    } else {
      Alert.alert('支付成功', '会员已开通，感谢您的支持！', [
        { text: '好的', onPress: () => router.push('/membership') },
      ]);
    }
    setCurrentOrder(null);
  };

  // 生成支付二维码
  const handleGenerateQRCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/qrcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo_user_001',
          amount: parseInt(amount, 10),
          payType,
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
          alert(result.error || '无法生成支付二维码');
        } else {
          Alert.alert('生成失败', result.error || '无法生成支付二维码');
        }
      }
    } catch (error) {
      console.error('Generate QR code error:', error);
      if (Platform.OS === 'web') {
        alert('网络错误，请重试');
      } else {
        Alert.alert('生成失败', '网络错误，请重试');
      }
    } finally {
      setLoading(false);
    }
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
          alert('支付失败，请重试');
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
    const qrContent = `G_OPEN_PAY:${currentOrder.order_no}:${currentOrder.amount}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrContent)}`;
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ 
              position: 'absolute', 
              left: 0, 
              padding: Spacing.sm 
            }}
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
              {formatAmount(parseInt(amount))}
            </ThemedText>
            <ThemedText variant="small" color="rgba(255,255,255,0.8)" style={{ marginLeft: 4 }}>
              /月
            </ThemedText>
          </View>
        </LinearGradient>

        {/* 支付方式选择 */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textPrimary}>
            选择支付方式
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.sm,
                padding: Spacing.lg,
                borderRadius: BorderRadius.md,
                borderWidth: 2,
                borderColor: payType === 'alipay' ? '#1677FF' : theme.border,
                backgroundColor: payType === 'alipay' ? 'rgba(22,119,255,0.1)' : theme.backgroundTertiary,
              }}
              onPress={() => setPayType('alipay')}
            >
              <FontAwesome6 name="wallet" size={20} color={payType === 'alipay' ? '#1677FF' : theme.textMuted} />
              <ThemedText variant="smallMedium" color={payType === 'alipay' ? '#1677FF' : theme.textMuted}>
                支付宝
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.sm,
                padding: Spacing.lg,
                borderRadius: BorderRadius.md,
                borderWidth: 2,
                borderColor: payType === 'wechat' ? '#07C160' : theme.border,
                backgroundColor: payType === 'wechat' ? 'rgba(7,193,96,0.1)' : theme.backgroundTertiary,
              }}
              onPress={() => setPayType('wechat')}
            >
              <FontAwesome6 name="message" size={20} color={payType === 'wechat' ? '#07C160' : theme.textMuted} />
              <ThemedText variant="smallMedium" color={payType === 'wechat' ? '#07C160' : theme.textMuted}>
                微信
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 二维码区域 */}
        <View style={[styles.qrCard, { alignItems: 'center' }]}>
          {loading ? (
            <View style={{ height: 280, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.primary} />
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
              
              <ThemedText variant="small" color={theme.textSecondary}>
                请使用{payType === 'alipay' ? '支付宝' : '微信'}扫码支付
              </ThemedText>
              
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
                onPress={handleGenerateQRCode}
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
            1. 请在支付码有效期内完成支付{'\n'}
            2. 支付成功后会员权益将自动激活{'\n'}
            3. 如有问题请联系客服处理
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
