/**
 * 钱包页面
 * 功能：余额管理、G点管理、充值、消费记录
 * 优化：支持多种支付方式（扫码支付、App跳转支付）
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Balance {
  balance: number;
  balanceYuan: string;
  frozenBalance: number;
  totalRecharged: number;
  totalConsumed: number;
  monthlyConsumed: number;
  gPoints?: number;
}

// 充值金额选项
const RECHARGE_OPTIONS = [
  { amount: 1000, label: '10元', bonus: 0 },
  { amount: 5000, label: '50元', bonus: 0 },
  { amount: 10000, label: '100元', bonus: 50 },
  { amount: 30000, label: '300元', bonus: 200 },
  { amount: 50000, label: '500元', bonus: 500 },
  { amount: 100000, label: '1000元', bonus: 1500 },
  { amount: 0, label: '自定义', bonus: 0 },
];

// 支付方式
const PAY_METHODS = [
  { id: 'alipay', name: '支付宝', icon: 'alipay', color: '#1677FF', brand: true, supportAppJump: true },
  { id: 'wechat', name: '微信', icon: 'weixin', color: '#07C160', brand: true, supportAppJump: true },
  { id: 'unionpay', name: '银联', icon: 'credit-card', color: '#E60012', supportAppJump: true },
  { id: 'bank', name: '银行转账', icon: 'building-columns', color: '#C41230', supportAppJump: false },
];

// 支付模式
type PaymentMode = 'app' | 'qrcode';

export default function WalletScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [rechargeModal, setRechargeModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayMethod, setSelectedPayMethod] = useState<'alipay' | 'wechat' | 'unionpay' | 'bank'>('alipay');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('app');
  const [userId, setUserId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 余额兑换G点
  const [exchangeModal, setExchangeModal] = useState(false);
  const [exchangeAmount, setExchangeAmount] = useState('');
  const [isExchanging, setIsExchanging] = useState(false);

  // 获取用户ID
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const uid = await AsyncStorage.getItem('userId');
      if (!uid) {
        setIsLoading(false);
        return;
      }
      setUserId(uid);

      // 获取余额
      const balanceRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/balance/${uid}`
      );
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setBalance(balanceData.data);
      }

      // 获取G点余额
      const gPointsRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/g-points/${uid}`
      );
      const gPointsData = await gPointsRes.json();
      if (gPointsData.success) {
        setBalance(prev => prev ? { ...prev, gPoints: gPointsData.data.gPoints } : { 
          balance: 0, 
          balanceYuan: '0.00', 
          frozenBalance: 0, 
          totalRecharged: 0, 
          totalConsumed: 0, 
          monthlyConsumed: 0, 
          gPoints: gPointsData.data.gPoints 
        });
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载数据
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // 充值处理
  const handleRecharge = async () => {
    if (!userId) {
      Alert.alert('请先登录', '您需要登录后才能充值', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => router.push('/login') }
      ]);
      return;
    }

    let amount = selectedAmount;
    if (selectedAmount === 0) {
      amount = parseInt(customAmount, 10) * 100;
      if (isNaN(amount) || amount < 100) {
        Alert.alert('提示', '充值金额最低1元');
        return;
      }
    }

    // 银行转账只支持扫码模式
    if (selectedPayMethod === 'bank') {
      setRechargeModal(false);
      setTimeout(() => {
        router.push('/payment', { 
          amount: String(amount), 
          productType: 'recharge',
          payMethod: 'bank',
        });
      }, 300);
      return;
    }

    // App跳转支付模式
    if (paymentMode === 'app') {
      await handleAppJumpPayment(amount);
    } else {
      // 扫码支付模式
      setRechargeModal(false);
      setTimeout(() => {
        router.push('/payment', { 
          amount: String(amount), 
          productType: 'recharge',
          payMethod: selectedPayMethod,
        });
      }, 300);
    }
  };

  // App跳转支付处理
  const handleAppJumpPayment = async (amount: number) => {
    setIsProcessing(true);
    try {
      // 调用后端创建支付订单
      /**
       * 服务端文件：server/src/routes/payment.ts
       * 接口：POST /api/v1/payment/create
       * Body 参数：amount: number, payMethod: string, userId: string, productType: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          payMethod: selectedPayMethod,
          userId,
          productType: 'recharge',
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { orderId, payUrl, deepLink, paymentAccount } = result.data;

        // Web端：直接跳转到支付页面显示二维码
        if (Platform.OS === 'web') {
          setRechargeModal(false);
          setTimeout(() => {
            router.push('/payment', { 
              amount: String(amount), 
              productType: 'recharge',
              payMethod: selectedPayMethod,
            });
          }, 300);
          return;
        }

        // 移动端：尝试唤起支付App
        if (deepLink) {
          try {
            const canOpen = await Linking.canOpenURL(deepLink);
            if (canOpen) {
              // 保存订单ID，支付成功后查询
              await AsyncStorage.setItem('pendingPaymentOrder', orderId);
              
              // 打开支付App
              await Linking.openURL(deepLink);
              
              setRechargeModal(false);
              
              // 延迟提示用户返回查看支付状态
              setTimeout(() => {
                Alert.alert(
                  '支付完成？',
                  '请在支付完成后返回查看订单状态',
                  [
                    { text: '稍后查看', style: 'cancel' },
                    { text: '查看订单', onPress: () => router.push('/bill') },
                  ]
                );
              }, 1000);
            } else {
              // 无法打开App，跳转到扫码支付页面
              setRechargeModal(false);
              setTimeout(() => {
                router.push('/payment', { 
                  amount: String(amount), 
                  productType: 'recharge',
                  payMethod: selectedPayMethod,
                });
              }, 300);
            }
          } catch (linkError) {
            console.error('Linking error:', linkError);
            // 唤起失败，跳转到扫码支付页面
            setRechargeModal(false);
            setTimeout(() => {
              router.push('/payment', { 
                amount: String(amount), 
                productType: 'recharge',
                payMethod: selectedPayMethod,
              });
            }, 300);
          }
        } else {
          // 没有deepLink，跳转到扫码支付页面
          setRechargeModal(false);
          setTimeout(() => {
            router.push('/payment', { 
              amount: String(amount), 
              productType: 'recharge',
              payMethod: selectedPayMethod,
            });
          }, 300);
        }
      } else {
        Alert.alert('支付失败', result.error || '创建订单失败');
      }
    } catch (error) {
      console.error('App jump payment error:', error);
      Alert.alert('支付失败', '网络错误，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 余额兑换G点
  const handleExchangeToGPoints = async () => {
    if (!userId) {
      Alert.alert('请先登录');
      return;
    }
    
    const yuanAmount = parseFloat(exchangeAmount);
    if (isNaN(yuanAmount) || yuanAmount < 1) {
      Alert.alert('提示', '最低兑换1元');
      return;
    }
    
    // 转换为厘（后端单位）
    const amountLi = Math.floor(yuanAmount * 100);
    // 计算可获得的G点：1元 = 100G点
    const gPoints = Math.floor(yuanAmount * 100);
    
    // 检查余额是否充足
    if (balance && amountLi > balance.balance) {
      Alert.alert('余额不足', `当前余额 ¥${balance.balanceYuan}，不足 ¥${yuanAmount.toFixed(2)}`);
      return;
    }
    
    setIsExchanging(true);
    try {
      /**
       * 服务端文件：server/src/routes/billing.ts
       * 接口：POST /api/v1/billing/balance-to-gpoints
       * Body 参数：userId: string, amount: number (单位：厘)
       */
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/balance-to-gpoints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: amountLi,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        Alert.alert(
          '兑换成功',
          `成功将 ¥${yuanAmount.toFixed(2)} 兑换为 ${data.data.gPointsReceived} G点`,
          [
            {
              text: '确定',
              onPress: () => {
                setExchangeModal(false);
                setExchangeAmount('');
                fetchData();
              },
            },
          ]
        );
      } else {
        Alert.alert('兑换失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Exchange error:', error);
      Alert.alert('兑换失败', '网络错误，请稍后重试');
    } finally {
      setIsExchanging(false);
    }
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ padding: Spacing.sm, marginLeft: -Spacing.sm }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginLeft: Spacing.sm }}>
            我的钱包
          </ThemedText>
        </View>

        {/* 主余额卡片 */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            marginBottom: Spacing.xl,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 }}>
                账户余额
              </Text>
              <Text style={{ color: '#fff', fontSize: 36, fontWeight: '700' }}>
                ¥{balance?.balanceYuan || '0.00'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/bill')}
              style={{ backgroundColor: 'rgba(255,255,255,0.2', padding: 8, borderRadius: BorderRadius.sm }}
            >
              <FontAwesome6 name="receipt" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <FontAwesome6 name="bolt" size={14} color="#FCD34D" solid />
              <Text style={{ color: '#FCD34D', fontSize: 14 }}>
                {balance?.gPoints?.toLocaleString() || '0'} G点
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                (视频生成: 1秒 = 1G点)
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setExchangeModal(true)}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: 4,
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: BorderRadius.sm,
              }}
            >
              <FontAwesome6 name="arrow-right-arrow-left" size={12} color="#FCD34D" />
              <Text style={{ color: '#FCD34D', fontSize: 12, fontWeight: '500' }}>兑换</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => setRechargeModal(true)}
            style={{
              backgroundColor: '#fff',
              borderRadius: BorderRadius.lg,
              paddingVertical: Spacing.lg,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <FontAwesome6 name="plus" size={16} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: 16, fontWeight: '600' }}>
              立即充值
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* 统计卡片 */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <FontAwesome6 name="arrow-trend-up" size={20} color={theme.success} style={{ marginBottom: Spacing.sm }} />
            <ThemedText variant="h4" color={theme.textPrimary}>
              ¥{((balance?.totalRecharged || 0) / 100).toFixed(2)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>累计充值</ThemedText>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <FontAwesome6 name="arrow-trend-down" size={20} color={theme.error} style={{ marginBottom: Spacing.sm }} />
            <ThemedText variant="h4" color={theme.textPrimary}>
              ¥{((balance?.totalConsumed || 0) / 100).toFixed(2)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>累计消费</ThemedText>
          </View>
        </View>

        {/* 快捷功能 */}
        <View style={{ marginBottom: Spacing.xl }}>
          <ThemedText variant="label" color={theme.textMuted} style={{ marginBottom: Spacing.md }}>
            快捷功能
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <TouchableOpacity 
              style={[styles.statCard, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }]}
              onPress={() => router.push('/consumption')}
            >
              <View style={{ width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: `${theme.primary}15`, justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome6 name="list" size={18} color={theme.primary} />
              </View>
              <View>
                <ThemedText variant="label" color={theme.textPrimary}>消费记录</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>查看消费明细</ThemedText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }]}
              onPress={() => router.push('/bill')}
            >
              <View style={{ width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: `${theme.accent}15`, justifyContent: 'center', alignItems: 'center' }}>
                <FontAwesome6 name="file-invoice" size={18} color={theme.accent} />
              </View>
              <View>
                <ThemedText variant="label" color={theme.textPrimary}>账单明细</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>充值与消费</ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 邀请好友 - 核心获客功能 */}
        <TouchableOpacity 
          onPress={() => router.push('/invite')}
          style={{
            backgroundColor: `linear-gradient(135deg, ${theme.success}, #059669)`,
            borderRadius: BorderRadius.xl,
            padding: Spacing.lg,
            marginBottom: Spacing.xl,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: `${theme.success}30`,
          }}
        >
          <View style={{ 
            width: 56, 
            height: 56, 
            borderRadius: BorderRadius.lg, 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginRight: Spacing.lg,
          }}>
            <FontAwesome6 name="gift" size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText variant="h4" color="#fff" style={{ marginBottom: 4 }}>邀请好友，双方得奖励</ThemedText>
            <ThemedText variant="small" color="rgba(255,255,255,0.8)">好友首充再得5%奖励，上不封顶</ThemedText>
          </View>
          <FontAwesome6 name="chevron-right" size={16} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* 充值说明 */}
        <View style={{ backgroundColor: theme.backgroundDefault, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: theme.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <FontAwesome6 name="circle-info" size={16} color={theme.primary} />
            <ThemedText variant="label" color={theme.textPrimary}>充值说明</ThemedText>
          </View>
          <ThemedText variant="small" color={theme.textSecondary} style={{ lineHeight: 22 }}>
            {'\n'}• 支持支付宝、微信、银行卡转账{'\n'}
            • 充值金额将实时到账{'\n'}
            • 充值后可用于所有AI服务{'\n'}
            • 余额不可提现，请按需充值{'\n'}
            • 如有问题请联系客服
          </ThemedText>
        </View>
      </ScrollView>

      {/* 充值弹窗 */}
      <Modal
        visible={rechargeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRechargeModal(false)}
      >
        <View style={styles.modal}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setRechargeModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            {/* 标题 */}
            <View style={styles.modalHeader}>
              <ThemedText variant="h4" color={theme.textPrimary}>选择充值金额</ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={() => setRechargeModal(false)}>
                <FontAwesome6 name="xmark" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 当前余额 */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: theme.backgroundTertiary,
              padding: Spacing.lg,
              borderRadius: BorderRadius.md,
              marginBottom: Spacing.lg,
            }}>
              <ThemedText variant="label" color={theme.textMuted}>当前余额</ThemedText>
              <ThemedText variant="h3" color={theme.primary}>¥{balance?.balanceYuan || '0.00'}</ThemedText>
            </View>

            {/* 金额选项 */}
            <View style={styles.amountOptions}>
              {RECHARGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.amountOption,
                    selectedAmount === option.amount && { 
                      borderColor: theme.primary, 
                      backgroundColor: `${theme.primary}10` 
                    },
                  ]}
                  onPress={() => setSelectedAmount(option.amount)}
                >
                  <Text style={[
                    styles.amountValue, 
                    { color: selectedAmount === option.amount ? theme.primary : theme.textPrimary }
                  ]}>
                    {option.label}
                  </Text>
                  {option.bonus > 0 && (
                    <Text style={[
                      styles.amountBonus, 
                      { color: selectedAmount === option.amount ? theme.primary : theme.success }
                    ]}>
                      送{(option.bonus / 100).toFixed(0)}元
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 自定义金额输入 */}
            {selectedAmount === 0 && (
              <View style={styles.customAmount}>
                <Text style={{ color: theme.textMuted, fontSize: 18 }}>¥</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="输入充值金额"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
                <Text style={{ color: theme.textMuted }}>元</Text>
              </View>
            )}

            {/* 支付方式选择 */}
            <ThemedText variant="label" color={theme.textMuted} style={{ marginBottom: Spacing.md }}>
              选择支付方式
            </ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {PAY_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.xs,
                    paddingVertical: Spacing.sm,
                    paddingHorizontal: Spacing.md,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: selectedPayMethod === method.id ? method.color : theme.border,
                    backgroundColor: selectedPayMethod === method.id ? `${method.color}10` : theme.backgroundTertiary,
                  }}
                  onPress={() => setSelectedPayMethod(method.id as typeof selectedPayMethod)}
                >
                  <FontAwesome6 
                    name={method.icon as any} 
                    size={14} 
                    color={selectedPayMethod === method.id ? method.color : theme.textMuted}
                    brand={(method as any).brand}
                  />
                  <Text style={{ 
                    color: selectedPayMethod === method.id ? method.color : theme.textPrimary,
                    fontWeight: '500',
                    fontSize: 14,
                  }}>
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 支付模式选择 - 非银行转账时显示 */}
            {selectedPayMethod !== 'bank' && (
              <View style={{ marginBottom: Spacing.lg }}>
                <ThemedText variant="label" color={theme.textMuted} style={{ marginBottom: Spacing.md }}>
                  支付模式
                </ThemedText>
                {Platform.OS === 'web' ? (
                  // Web端提示
                  <View style={{ 
                    padding: Spacing.lg, 
                    borderRadius: BorderRadius.md, 
                    backgroundColor: `${theme.primary}10`,
                    borderWidth: 1,
                    borderColor: theme.primary,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <FontAwesome6 name="info-circle" size={16} color={theme.primary} />
                      <ThemedText variant="small" color={theme.textPrimary}>
                        Web端仅支持扫码支付，点击充值后将显示收款码
                      </ThemedText>
                    </View>
                    <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: Spacing.sm }}>
                        如需App跳转支付，请使用移动端App
                      </ThemedText>
                  </View>
                ) : (
                  // 移动端显示选项
                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: Spacing.lg,
                        borderRadius: BorderRadius.md,
                        borderWidth: 2,
                        borderColor: paymentMode === 'app' ? theme.primary : theme.border,
                        backgroundColor: paymentMode === 'app' ? `${theme.primary}10` : theme.backgroundTertiary,
                      }}
                      onPress={() => setPaymentMode('app')}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
                        <FontAwesome6 name="mobile-screen-button" size={16} color={paymentMode === 'app' ? theme.primary : theme.textPrimary} />
                        <ThemedText variant="label" color={paymentMode === 'app' ? theme.primary : theme.textPrimary}>
                          App支付
                        </ThemedText>
                      </View>
                      <ThemedText variant="tiny" color={theme.textMuted}>
                        跳转{PAY_METHODS.find(p => p.id === selectedPayMethod)?.name}App支付
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        padding: Spacing.lg,
                        borderRadius: BorderRadius.md,
                        borderWidth: 2,
                        borderColor: paymentMode === 'qrcode' ? theme.primary : theme.border,
                        backgroundColor: paymentMode === 'qrcode' ? `${theme.primary}10` : theme.backgroundTertiary,
                      }}
                      onPress={() => setPaymentMode('qrcode')}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
                        <FontAwesome6 name="qrcode" size={16} color={paymentMode === 'qrcode' ? theme.primary : theme.textPrimary} />
                        <ThemedText variant="label" color={paymentMode === 'qrcode' ? theme.primary : theme.textPrimary}>
                          扫码支付
                        </ThemedText>
                      </View>
                      <ThemedText variant="tiny" color={theme.textMuted}>
                        使用扫码功能付款
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* 确认充值按钮 */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleRecharge}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <LinearGradient
                  colors={[theme.primary, theme.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ 
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                    paddingVertical: Spacing.lg,
                    borderRadius: BorderRadius.md,
                  }}
                >
                  <FontAwesome6 
                    name={selectedPayMethod === 'bank' || paymentMode === 'qrcode' ? 'qrcode' : 'arrow-right'} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    {selectedAmount === 0 
                      ? `充值 ¥${customAmount || '0'}` 
                      : `充值 ${(selectedAmount / 100).toFixed(0)}元`
                    }
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            {/* 充值提示 */}
            <View style={{ marginTop: Spacing.md, alignItems: 'center' }}>
              <ThemedText variant="tiny" color={theme.textMuted}>
                {selectedPayMethod === 'bank' 
                  ? '银行转账需扫码后手动填写信息' 
                  : paymentMode === 'app' 
                    ? '点击后将跳转支付App完成支付' 
                    : '点击充值后将跳转到扫码支付页面'}
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>

      {/* 余额兑换G点弹窗 */}
      <Modal
        visible={exchangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setExchangeModal(false)}
      >
        <View style={styles.modal}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setExchangeModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            {/* 标题 */}
            <View style={styles.modalHeader}>
              <ThemedText variant="h4" color={theme.textPrimary}>余额兑换G点</ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={() => setExchangeModal(false)}>
                <FontAwesome6 name="xmark" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* 兑换说明 */}
            <View style={{ 
              backgroundColor: `${theme.accent}15`,
              padding: Spacing.lg,
              borderRadius: BorderRadius.md,
              marginBottom: Spacing.lg,
              borderWidth: 1,
              borderColor: `${theme.accent}30`,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                <FontAwesome6 name="info-circle" size={16} color={theme.accent} />
                <ThemedText variant="label" color={theme.accent}>兑换规则</ThemedText>
              </View>
              <ThemedText variant="small" color={theme.textSecondary} style={{ lineHeight: 20 }}>
                • 1元余额 = 100G点{'\n'}
                • 只能余额→G点，不可反向{'\n'}
                • 最低兑换1元
              </ThemedText>
            </View>

            {/* 当前余额 */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: theme.backgroundTertiary,
              padding: Spacing.lg,
              borderRadius: BorderRadius.md,
              marginBottom: Spacing.lg,
            }}>
              <View>
                <ThemedText variant="tiny" color={theme.textMuted}>可用余额</ThemedText>
                <ThemedText variant="h3" color={theme.primary}>¥{balance?.balanceYuan || '0.00'}</ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText variant="tiny" color={theme.textMuted}>当前G点</ThemedText>
                <ThemedText variant="h3" color={theme.accent}>{balance?.gPoints?.toLocaleString() || '0'}</ThemedText>
              </View>
            </View>

            {/* 兑换金额输入 */}
            <ThemedText variant="label" color={theme.textMuted} style={{ marginBottom: Spacing.sm }}>
              兑换金额（元）
            </ThemedText>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              backgroundColor: theme.backgroundTertiary,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: theme.border,
              marginBottom: Spacing.md,
            }}>
              <Text style={{ paddingHorizontal: Spacing.lg, color: theme.textPrimary, fontSize: 18 }}>¥</Text>
              <TextInput
                style={{ 
                  flex: 1, 
                  paddingVertical: Spacing.lg,
                  fontSize: 18,
                  color: theme.textPrimary,
                }}
                placeholder="输入兑换金额"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={exchangeAmount}
                onChangeText={setExchangeAmount}
              />
              <TouchableOpacity 
                onPress={() => setExchangeAmount(String((balance?.balance || 0) / 100))}
                style={{ paddingHorizontal: Spacing.lg }}
              >
                <ThemedText variant="small" color={theme.primary}>全部</ThemedText>
              </TouchableOpacity>
            </View>

            {/* 预计获得 */}
            {exchangeAmount && !isNaN(parseFloat(exchangeAmount)) && (
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: Spacing.md,
                backgroundColor: `${theme.success}10`,
                borderRadius: BorderRadius.md,
                marginBottom: Spacing.lg,
              }}>
                <ThemedText variant="small" color={theme.textSecondary}>预计获得</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                  <FontAwesome6 name="bolt" size={14} color={theme.success} solid />
                  <ThemedText variant="h4" color={theme.success}>
                    {Math.floor(parseFloat(exchangeAmount) * 100).toLocaleString()} G点
                  </ThemedText>
                </View>
              </View>
            )}

            {/* 兑换按钮 */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.accent,
                borderRadius: BorderRadius.lg,
                paddingVertical: Spacing.lg,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: Spacing.sm,
              }}
              onPress={handleExchangeToGPoints}
              disabled={isExchanging || !exchangeAmount}
            >
              {isExchanging ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome6 name="arrow-right-arrow-left" size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    确认兑换
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* 提示 */}
            <View style={{ marginTop: Spacing.md, alignItems: 'center' }}>
              <ThemedText variant="tiny" color={theme.textMuted}>
                兑换后G点将立即到账，兑换不可撤销
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
