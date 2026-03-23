/**
 * 支付中心页面 - 固定收款码模式
 * 
 * 流程：
 * 1. 显示固定收款码（微信/支付宝）
 * 2. 用户扫码支付
 * 3. 填写确认信息（金额、流水号）
 * 4. 提交等待管理员审核
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import { getQRCodeSize, scaleSize, isSmallScreen } from '@/utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type PayMethod = 'alipay' | 'wechat' | 'unionpay' | 'jdpay' | 'bank';

interface PaymentAccount {
  name: string;
  account?: string;
  qrcodeUrl?: string;
  realName: string;
  desc?: string;
  color?: string;
  icon?: string;
  bankName?: string;
  bankBranch?: string;
}

// 支付方式配置
const PAY_METHODS = [
  { 
    id: 'alipay' as PayMethod, 
    name: '支付宝', 
    icon: 'alipay', 
    color: '#1677FF', 
    bgColor: 'rgba(22,119,255,0.08)',
  },
  { 
    id: 'wechat' as PayMethod, 
    name: '微信支付', 
    icon: 'weixin', 
    color: '#07C160', 
    bgColor: 'rgba(7,193,96,0.08)',
    brand: true,
  },
  { 
    id: 'unionpay' as PayMethod, 
    name: '银联', 
    icon: 'credit-card', 
    color: '#E60012', 
    bgColor: 'rgba(230,0,18,0.08)',
  },
  { 
    id: 'jdpay' as PayMethod, 
    name: '京东支付', 
    icon: 'wallet', 
    color: '#E1251B', 
    bgColor: 'rgba(225,37,27,0.08)',
  },
  { 
    id: 'bank' as PayMethod, 
    name: '银行转账', 
    icon: 'building-columns', 
    color: '#C41230', 
    bgColor: 'rgba(196,18,48,0.08)',
  },
];

export default function PaymentScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { checkMembership } = useMembership();
  
  const params = useSafeSearchParams<{ amount?: string; productType?: string; gPoints?: string }>();
  const defaultAmount = parseInt(params.amount || '2900', 10);
  const productType = params.productType || 'membership';
  const gPoints = params.gPoints ? parseInt(params.gPoints, 10) : 0;

  const [payMethod, setPayMethod] = useState<PayMethod>('alipay');
  const [paymentAccounts, setPaymentAccounts] = useState<Record<PayMethod, PaymentAccount> | null>(null);
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [transactionId, setTransactionId] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 获取收款账户信息
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/accounts`);
        const result = await response.json();
        if (result.success) {
          setPaymentAccounts(result.data);
        }
      } catch (error) {
        console.error('Fetch payment accounts error:', error);
      }
    };
    fetchAccounts();
  }, []);

  const currentPayMethod = PAY_METHODS.find(p => p.id === payMethod);
  const currentAccount = paymentAccounts?.[payMethod];

  // 格式化金额显示
  const formatAmount = (fen: number) => {
    return `¥${(fen / 100).toFixed(2)}`;
  };

  // 复制文本
  const copyText = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'web') {
      window.alert(`${label}已复制: ${text}`);
    } else {
      Alert.alert('复制成功', `${label}已复制: ${text}`);
    }
  };

  // 提交支付确认
  const handleSubmit = async () => {
    const amountNum = parseInt(amount, 10);
    
    if (!amountNum || amountNum <= 0) {
      Alert.alert('提示', '请输入正确的金额');
      return;
    }
    
    if (!transactionId.trim()) {
      Alert.alert('提示', '请填写转账流水号或备注信息');
      return;
    }

    setSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId') || 'guest_user';
      
      // 提交支付确认记录
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: amountNum,
          payType: payMethod,
          productType,
          transactionId: transactionId.trim(),
          remark: remark.trim(),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        Alert.alert('提交成功', '您的支付信息已提交，管理员将在1-3分钟内审核');
      } else {
        Alert.alert('提交失败', result.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('网络错误', '请检查网络连接');
    } finally {
      setSubmitting(false);
    }
  };

  // 已提交状态
  if (submitted) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ padding: Spacing.sm }}
            >
              <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <ThemedText variant="h3" color={theme.textPrimary}>支付中心</ThemedText>
            <View style={{ width: 36 }} />
          </View>

          <View style={[styles.statusCard, { alignItems: 'center', padding: Spacing.xl }]}>
            <View style={[styles.statusIcon, { backgroundColor: '#FEF3C7', marginBottom: Spacing.lg }]}>
              <FontAwesome6 name="clock" size={28} color="#D97706" />
            </View>
            <ThemedText variant="h3" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
              提交成功
            </ThemedText>
            <ThemedText variant="small" color={theme.textSecondary} style={{ textAlign: 'center', marginBottom: Spacing.xl }}>
              您的支付信息已提交，管理员将在1-3分钟内审核。审核通过后会员将自动激活。
            </ThemedText>
            
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={() => router.replace('/membership')}
            >
              <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                返回会员中心
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ padding: Spacing.sm }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary}>支付中心</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        {/* 支付方式选择 */}
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
          选择支付方式
        </ThemedText>
        
        {/* 产品信息 */}
        <View style={[styles.productInfo, { backgroundColor: theme.backgroundDefault, marginBottom: Spacing.lg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <ThemedText variant="label" color={theme.textPrimary}>
                {productType === 'gpoints' ? 'G点充值' : 
                 productType === 'recharge' ? '账户充值' : 
                 productType === 'membership' ? '会员开通' : '商品支付'}
              </ThemedText>
              {gPoints > 0 && (
                <ThemedText variant="caption" color="#F59E0B">
                  获得 {gPoints.toLocaleString()} G点
                </ThemedText>
              )}
            </View>
            <ThemedText variant="h3" color={theme.primary}>
              {formatAmount(defaultAmount)}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.payMethodRow}>
          {PAY_METHODS.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.payMethodCard,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                payMethod === method.id && { borderColor: method.color, borderWidth: 2 }
              ]}
              onPress={() => setPayMethod(method.id)}
            >
              <View style={[styles.payMethodIcon, { backgroundColor: method.bgColor }]}>
                <FontAwesome6 name={method.icon as any} size={24} color={method.color} brand={(method as any).brand} />
              </View>
              <ThemedText variant="smallMedium" color={payMethod === method.id ? method.color : theme.textPrimary}>
                {method.name}
              </ThemedText>
              {payMethod === method.id && (
                <View style={[styles.selectedDot, { backgroundColor: method.color }]}>
                  <FontAwesome6 name="check" size={8} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 收款码 */}
        <View style={[styles.qrSection, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
            扫码支付
          </ThemedText>
          
          <View style={styles.qrCard}>
            {currentAccount?.qrcodeUrl ? (
              <Image 
                source={{ uri: currentAccount.qrcodeUrl }} 
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <FontAwesome6 name="qrcode" size={80} color={theme.primary} />
              </View>
            )}
          </View>

          {/* 收款信息 */}
          {currentAccount && (
            <View style={[styles.accountInfo, { backgroundColor: theme.backgroundTertiary }]}>
              <View style={styles.accountRow}>
                <ThemedText variant="caption" color={theme.textMuted}>收款方式</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                  <FontAwesome6 name={currentPayMethod?.icon as any} size={14} color={currentPayMethod?.color} />
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>{currentAccount.name}</ThemedText>
                </View>
              </View>
              
              {currentAccount.account && (
                <View style={styles.accountRow}>
                  <ThemedText variant="caption" color={theme.textMuted}>收款账户</ThemedText>
                  <TouchableOpacity onPress={() => copyText(currentAccount.account!, '收款账户')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <ThemedText variant="smallMedium" color={theme.textPrimary}>{currentAccount.account}</ThemedText>
                      <FontAwesome6 name="copy" size={12} color={theme.textMuted} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* 银行转账时显示银行信息 */}
              {currentAccount.bankName && (
                <View style={styles.accountRow}>
                  <ThemedText variant="caption" color={theme.textMuted}>开户银行</ThemedText>
                  <ThemedText variant="small" color={theme.textPrimary}>{currentAccount.bankName}</ThemedText>
                </View>
              )}
              
              {currentAccount.bankBranch && (
                <View style={styles.accountRow}>
                  <ThemedText variant="caption" color={theme.textMuted}>开户支行</ThemedText>
                  <ThemedText variant="small" color={theme.textPrimary}>{currentAccount.bankBranch}</ThemedText>
                </View>
              )}
              
              <View style={styles.accountRow}>
                <ThemedText variant="caption" color={theme.textMuted}>收款人</ThemedText>
                <ThemedText variant="small" color={theme.textPrimary}>{currentAccount.realName}</ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* 支付确认表单 */}
        <View style={[styles.formSection, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
            支付确认
          </ThemedText>
          
          {/* 金额输入 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="caption" color={theme.textMuted}>支付金额（分）</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.border }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder={`例如: ${defaultAmount} (¥${(defaultAmount/100).toFixed(2)})`}
              placeholderTextColor={theme.textMuted}
            />
            <ThemedText variant="tiny" color={theme.textMuted}>
              预计支付: {formatAmount(parseInt(amount, 10) || 0)}
            </ThemedText>
          </View>

          {/* 流水号 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="caption" color={theme.textMuted}>转账流水号/备注 *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.border }]}
              value={transactionId}
              onChangeText={setTransactionId}
              placeholder="转账成功后显示的流水号或备注"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* 备注 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="caption" color={theme.textMuted}>补充说明（选填）</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary, borderColor: theme.border }]}
              value={remark}
              onChangeText={setRemark}
              placeholder="如有其他说明请填写"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* 提交按钮 */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: currentPayMethod?.color || theme.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText variant="smallMedium" color="#fff">确认已支付</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* 支付提示 */}
        <View style={[styles.tipsSection, { backgroundColor: theme.backgroundTertiary }]}>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
            支付说明
          </ThemedText>
          <View style={styles.tipItem}>
            <FontAwesome6 name="circle" size={4} color={theme.textMuted} style={{ marginTop: 6 }} />
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: Spacing.sm, flex: 1 }}>
              使用{currentPayMethod?.name}扫描上方二维码完成支付
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <FontAwesome6 name="circle" size={4} color={theme.textMuted} style={{ marginTop: 6 }} />
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: Spacing.sm, flex: 1 }}>
              支付完成后填写金额和流水号，提交等待审核
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <FontAwesome6 name="circle" size={4} color={theme.textMuted} style={{ marginTop: 6 }} />
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: Spacing.sm, flex: 1 }}>
              审核通过后会员权益将自动激活
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
