import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
    bgColor: 'rgba(22,119,255,0.08)',
    desc: '推荐使用',
  },
  { 
    id: 'wechat' as PayMethod, 
    name: '微信支付', 
    icon: 'comment', 
    color: '#07C160', 
    bgColor: 'rgba(7,193,96,0.08)',
    desc: '扫码支付',
  },
];

// 支付步骤
const PAYMENT_STEPS = [
  { step: 1, title: '选择方式', icon: 'credit-card' },
  { step: 2, title: '扫码支付', icon: 'qrcode' },
  { step: 3, title: '填写确认', icon: 'clipboard-check' },
  { step: 4, title: '等待审核', icon: 'clock' },
];

export default function PaymentScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { checkMembership } = useMembership();
  
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
  const [currentStep, setCurrentStep] = useState(2);

  // 获取产品信息
  const getProductInfo = () => {
    if (productType === 'super_member') {
      return {
        name: '超级会员订阅',
        color: ['#FFD700', '#FF6B00'],
        icon: 'rocket',
        benefits: ['无限AI对话', '100GB存储', '专属客服', '新功能抢先'],
      };
    }
    if (productType === 'membership') {
      return {
        name: '普通会员订阅',
        color: ['#00F0FF', '#BF00FF'],
        icon: 'crown',
        benefits: ['每日100次AI对话', '10GB存储', '高级AI模型'],
      };
    }
    return {
      name: '账户充值',
      color: ['#00F0FF', '#BF00FF'],
      icon: 'wallet',
      benefits: ['用于AI创作消费'],
    };
  };

  const productInfo = getProductInfo();

  // 创建订单
  const createOrder = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId') || 'guest_user';
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          payType: payMethod,
          productType: productType as 'membership' | 'super_member' | 'recharge',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentOrder(result.data);
        setCountdown(30 * 60);
        setOrderStatus('pending');
        setCurrentStep(2);
      } else {
        showError(result.error || '创建订单失败');
      }
    } catch (error) {
      console.error('Create order error:', error);
      showError('网络错误，请检查网络连接');
    } finally {
      setLoading(false);
    }
  }, [amount, payMethod, productType]);

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

  const showError = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('提示', msg);
    }
  };

  const showSuccess = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('成功', msg);
    }
  };

  // 复制功能
  const copyText = async (text: string, label?: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'web') {
      window.alert(`${label || text} 已复制`);
    } else {
      Alert.alert('复制成功', `${label || text} 已复制到剪贴板`);
    }
  };

  // 确认支付
  const handleConfirmPayment = async () => {
    if (!currentOrder) return;
    
    if (!transactionId.trim()) {
      showError('请输入转账流水号或备注信息');
      return;
    }
    
    setConfirming(true);
    try {
      const userId = await AsyncStorage.getItem('userId') || 'guest_user';
      
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
        setCurrentStep(4);
        showSuccess('已提交支付确认！请等待管理员审核，审核通过后将自动激活会员。');
      } else {
        showError(result.error || '确认失败');
      }
    } catch (error) {
      console.error('Confirm payment error:', error);
      showError('网络错误，请重试');
    } finally {
      setConfirming(false);
    }
  };

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPayMethod = PAY_METHODS.find(p => p.id === payMethod);

  // 生成二维码显示内容（如果API没有返回真实二维码）
  const getQRCodeDisplay = () => {
    // 使用公共二维码生成服务
    const qrContent = currentOrder 
      ? `GOPEN_PAY:${currentOrder.orderNo}:${amount}`
      : '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrContent || 'https://gopen.app/pay')}`;
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', left: 0, padding: Spacing.sm, zIndex: 1 }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary}>
            支付中心
          </ThemedText>
        </View>

        {/* 支付步骤指示器 */}
        <View style={styles.stepsContainer}>
          {PAYMENT_STEPS.map((step, index) => (
            <View key={step.step} style={styles.stepItem}>
              <View style={[
                styles.stepCircle,
                currentStep >= step.step && styles.stepCircleActive,
                { borderColor: currentStep >= step.step ? theme.primary : theme.border }
              ]}>
                <FontAwesome6 
                  name={step.icon as any} 
                  size={12} 
                  color={currentStep >= step.step ? theme.primary : theme.textMuted} 
                />
              </View>
              <ThemedText 
                variant="tiny" 
                color={currentStep >= step.step ? theme.primary : theme.textMuted}
                style={styles.stepLabel}
              >
                {step.title}
              </ThemedText>
              {index < PAYMENT_STEPS.length - 1 && (
                <View style={[
                  styles.stepLine,
                  { backgroundColor: currentStep > step.step ? theme.primary : theme.border }
                ]} />
              )}
            </View>
          ))}
        </View>

        {/* 产品信息卡片 */}
        <LinearGradient
          colors={productInfo.color as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.productCard}
        >
          <View style={styles.productIcon}>
            <FontAwesome6 name={productInfo.icon as any} size={28} color="#fff" />
          </View>
          <ThemedText variant="h2" color="#fff">
            {productInfo.name}
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText variant="h1" color="#fff">
              {formatAmount(amount)}
            </ThemedText>
            {productType !== 'recharge' && (
              <ThemedText variant="small" color="rgba(255,255,255,0.8)">
                /月
              </ThemedText>
            )}
          </View>
          <View style={styles.benefitsRow}>
            {productInfo.benefits.slice(0, 3).map((benefit, idx) => (
              <View key={idx} style={styles.benefitTag}>
                <FontAwesome6 name="check" size={8} color="rgba(255,255,255,0.9)" />
                <ThemedText variant="tiny" color="rgba(255,255,255,0.9)">
                  {benefit}
                </ThemedText>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* 支付方式选择 */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textPrimary}>
            选择支付方式
          </ThemedText>
          <View style={styles.payMethodsRow}>
            {PAY_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.payMethodCard,
                  payMethod === method.id && { borderColor: method.color, backgroundColor: method.bgColor },
                ]}
                onPress={() => {
                  setPayMethod(method.id);
                  setOrderStatus(null);
                  setTransactionId('');
                }}
              >
                <View style={[styles.payMethodIcon, { backgroundColor: method.color + '20' }]}>
                  <FontAwesome6 name={method.icon as any} size={24} color={method.color} />
                </View>
                <ThemedText 
                  variant="smallMedium" 
                  color={payMethod === method.id ? method.color : theme.textPrimary}
                >
                  {method.name}
                </ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>
                  {method.desc}
                </ThemedText>
                {payMethod === method.id && (
                  <View style={[styles.selectedDot, { backgroundColor: method.color }]}>
                    <FontAwesome6 name="check" size={8} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 二维码支付区域 */}
        {loading ? (
          <View style={styles.qrSection}>
            <ActivityIndicator size="large" color={currentPayMethod?.color || theme.primary} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              正在生成订单...
            </ThemedText>
          </View>
        ) : currentOrder ? (
          <View style={styles.qrSection}>
            {/* 状态提示 */}
            {orderStatus === 'confirming' ? (
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: '#FEF3C7' }]}>
                  <FontAwesome6 name="clock" size={24} color="#D97706" />
                </View>
                <ThemedText variant="title" color={theme.textPrimary}>
                  等待审核中
                </ThemedText>
                <ThemedText variant="small" color={theme.textMuted}>
                  您的支付已提交，管理员将在1-3分钟内审核
                </ThemedText>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.replace('/membership')}
                >
                  <ThemedText variant="smallMedium" color={theme.primary}>
                    返回会员中心
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* 倒计时提示 */}
                <View style={styles.countdownBar}>
                  <FontAwesome6 name="clock" size={14} color={countdown > 300 ? theme.textMuted : theme.error} />
                  <ThemedText 
                    variant="small" 
                    color={countdown > 300 ? theme.textMuted : theme.error}
                  >
                    请在 {formatCountdown(countdown)} 内完成支付
                  </ThemedText>
                </View>

                {/* 二维码 */}
                <View style={styles.qrCard}>
                  <View style={styles.qrImageContainer}>
                    {/* 这里显示二维码，实际使用时替换为真实二维码 */}
                    <View style={styles.qrPlaceholder}>
                      <FontAwesome6 name="qrcode" size={80} color={theme.primary} />
                      <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.sm }}>
                        扫描二维码支付
                      </ThemedText>
                    </View>
                  </View>
                  
                  {/* 金额显示 */}
                  <TouchableOpacity 
                    style={styles.amountDisplay}
                    onPress={() => copyText(formatAmount(currentOrder.amount), '支付金额')}
                  >
                    <ThemedText variant="small" color={theme.textMuted}>
                      支付金额
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <ThemedText variant="h2" color={currentPayMethod?.color}>
                        {formatAmount(currentOrder.amount)}
                      </ThemedText>
                      <FontAwesome6 name="copy" size={14} color={theme.textMuted} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* 收款信息 */}
                <View style={styles.accountInfo}>
                  <View style={styles.accountRow}>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      收款方式
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <FontAwesome6 name={currentPayMethod?.icon as any} size={14} color={currentPayMethod?.color} />
                      <ThemedText variant="smallMedium" color={theme.textPrimary}>
                        {currentPayMethod?.name}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.accountRow}>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      订单编号
                    </ThemedText>
                    <TouchableOpacity onPress={() => copyText(currentOrder.orderNo, '订单号')}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                        <ThemedText variant="small" color={theme.textPrimary}>
                          {currentOrder.orderNo}
                        </ThemedText>
                        <FontAwesome6 name="copy" size={12} color={theme.textMuted} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 确认支付 */}
                <View style={styles.confirmSection}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    转账完成后，请填写确认信息
                  </ThemedText>
                  <TextInput
                    style={styles.transactionInput}
                    placeholder="请输入转账流水号/备注/手机号后4位"
                    placeholderTextColor={theme.textMuted}
                    value={transactionId}
                    onChangeText={(text) => {
                      setTransactionId(text);
                      if (text.length > 0) {
                        setCurrentStep(3);
                      }
                    }}
                  />
                  
                  <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: currentPayMethod?.color }]}
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
              </>
            )}
          </View>
        ) : (
          <View style={styles.qrSection}>
            <FontAwesome6 name="qrcode" size={64} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              订单生成失败
            </ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={createOrder}>
              <ThemedText variant="smallMedium" color={theme.primary}>
                重新生成订单
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* 支付说明 */}
        <View style={styles.helpSection}>
          <View style={styles.helpHeader}>
            <FontAwesome6 name="circle-question" size={16} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              支付帮助
            </ThemedText>
          </View>
          <View style={styles.helpList}>
            <View style={styles.helpItem}>
              <View style={[styles.helpNumber, { backgroundColor: theme.primary }]}>
                <ThemedText variant="tiny" color="#fff">1</ThemedText>
              </View>
              <ThemedText variant="small" color={theme.textSecondary}>
                选择支付方式，扫描二维码完成转账
              </ThemedText>
            </View>
            <View style={styles.helpItem}>
              <View style={[styles.helpNumber, { backgroundColor: theme.primary }]}>
                <ThemedText variant="tiny" color="#fff">2</ThemedText>
              </View>
              <ThemedText variant="small" color={theme.textSecondary}>
                转账金额必须与订单金额完全一致
              </ThemedText>
            </View>
            <View style={styles.helpItem}>
              <View style={[styles.helpNumber, { backgroundColor: theme.primary }]}>
                <ThemedText variant="tiny" color="#fff">3</ThemedText>
              </View>
              <ThemedText variant="small" color={theme.textSecondary}>
                转账后填写流水号/备注，点击确认提交
              </ThemedText>
            </View>
            <View style={styles.helpItem}>
              <View style={[styles.helpNumber, { backgroundColor: theme.accent }]}>
                <ThemedText variant="tiny" color="#fff">4</ThemedText>
              </View>
              <ThemedText variant="small" color={theme.textSecondary}>
                管理员审核通过后，会员自动激活
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 安全提示 */}
        <View style={styles.securityTip}>
          <FontAwesome6 name="shield" size={14} color={theme.success} />
          <ThemedText variant="caption" color={theme.textMuted}>
            支付安全由G Open保障，如有问题请联系客服
          </ThemedText>
        </View>

        {/* 管理员入口 */}
        <TouchableOpacity
          style={styles.adminEntry}
          onPress={() => router.push('/payment-admin', { key: 'gopen_admin_2024' })}
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
