/**
 * 钱包页面
 * 功能：余额管理、G点管理、充值、消费记录
 * 优化：简化充值流程，统一充值入口
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

// 统一充值金额选项（优化后的赠送策略，确保平台利润率在13-15%）
const RECHARGE_OPTIONS = [
  { amount: 1000, label: '10元', bonus: 0, bonusType: 'none' },        // 无赠送
  { amount: 5000, label: '50元', bonus: 0, bonusType: 'none' },        // 无赠送
  { amount: 10000, label: '100元', bonus: 50, bonusType: 'cash' },     // 送0.5元 (0.5%)
  { amount: 30000, label: '300元', bonus: 200, bonusType: 'cash' },    // 送2元 (0.67%)
  { amount: 50000, label: '500元', bonus: 500, bonusType: 'cash' },    // 送5元 (1%)
  { amount: 100000, label: '1000元', bonus: 1500, bonusType: 'cash' }, // 送15元 (1.5%)
  { amount: 0, label: '自定义', bonus: 0, bonusType: 'none' },
];

// 支付方式
const PAY_METHODS = [
  { id: 'alipay', name: '支付宝', icon: 'alipay', color: '#1677FF' },
  { id: 'wechat', name: '微信', icon: 'weixin', color: '#07C160', brand: true },
  { id: 'bank', name: '银行卡', icon: 'building-columns', color: '#C41230' },
];

export default function WalletScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [rechargeModal, setRechargeModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayMethod, setSelectedPayMethod] = useState<'alipay' | 'wechat' | 'bank'>('alipay');
  const [userId, setUserId] = useState<string | null>(null);

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
  const handleRecharge = () => {
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

    setRechargeModal(false);
    setTimeout(() => {
      router.push('/payment', { 
        amount: String(amount), 
        productType: 'recharge'
      });
    }, 300);
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
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg }}>
            <FontAwesome6 name="bolt" size={14} color="#FCD34D" solid />
            <Text style={{ color: '#FCD34D', fontSize: 14 }}>
              {balance?.gPoints?.toLocaleString() || '0'} G点
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              (视频生成: 1秒 = 1G点)
            </Text>
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
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
              {PAY_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                    padding: Spacing.md,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: selectedPayMethod === method.id ? method.color : theme.border,
                    backgroundColor: selectedPayMethod === method.id ? `${method.color}10` : theme.backgroundTertiary,
                  }}
                  onPress={() => setSelectedPayMethod(method.id as 'alipay' | 'wechat' | 'bank')}
                >
                  <FontAwesome6 
                    name={method.icon as any} 
                    size={16} 
                    color={selectedPayMethod === method.id ? method.color : theme.textMuted}
                    brand={(method as any).brand}
                  />
                  <Text style={{ 
                    color: selectedPayMethod === method.id ? method.color : theme.textPrimary,
                    fontWeight: '500',
                  }}>
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 确认充值按钮 */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleRecharge}
            >
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
                <FontAwesome6 name="wallet" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  {selectedAmount === 0 
                    ? `充值 ¥${customAmount || '0'}` 
                    : `充值 ${(selectedAmount / 100).toFixed(0)}元`
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* 充值提示 */}
            <View style={{ marginTop: Spacing.md, alignItems: 'center' }}>
              <ThemedText variant="tiny" color={theme.textMuted}>
                点击充值后将跳转到支付页面，扫码付款即可
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
