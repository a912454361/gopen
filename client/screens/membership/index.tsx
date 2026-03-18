import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  isPopular?: boolean;
  discount?: string;
}

const plans: Plan[] = [
  {
    id: 'first_month',
    name: '首月特惠',
    duration: '1个月',
    price: 8,
    originalPrice: 18,
    isPopular: true,
    discount: '新人专享',
  },
  {
    id: 'monthly',
    name: '月度会员',
    duration: '1个月',
    price: 18,
  },
  {
    id: 'quarterly',
    name: '季度会员',
    duration: '3个月',
    price: 35,
    originalPrice: 54,
    discount: '省19元',
  },
  {
    id: 'semi_annual',
    name: '半年会员',
    duration: '6个月',
    price: 88,
    originalPrice: 108,
    discount: '省20元',
  },
  {
    id: 'annual',
    name: '年度会员',
    duration: '12个月',
    price: 188,
    originalPrice: 216,
    discount: '省28元',
  },
];

const memberFeatures = [
  '无限AI对话次数',
  '高级AI模型优先',
  '项目数量不限',
  '高清资源导出',
  '专属客服支持',
  '新功能抢先体验',
];

const freeFeatures = [
  '每日10次AI对话',
  '基础AI模型',
  '最多3个项目',
  '标清资源导出',
];

const ALIPAY_ACCOUNT = '18321337942';

export default function MembershipScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember, expireDate, planType, setMember } = useMembership();

  const [selectedPlan, setSelectedPlan] = useState<string>('first_month');

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const handleCopyAccount = async () => {
    await Clipboard.setStringAsync(ALIPAY_ACCOUNT);
    Alert.alert('复制成功', `支付宝账号 ${ALIPAY_ACCOUNT} 已复制到剪贴板`);
  };

  const handleSubscribe = () => {
    Alert.alert(
      '开通会员',
      `请转账 ${selectedPlanData?.price} 元到支付宝账号：${ALIPAY_ACCOUNT}\n\n转账备注请填写：G open会员+您的手机号\n\n转账成功后，会员将在1-3分钟内激活`,
      [
        { text: '取消', style: 'cancel' },
        { text: '复制账号', onPress: handleCopyAccount },
      ]
    );
  };

  const renderPlanCard = (plan: Plan) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.planCard,
        plan.isPopular && styles.planCardPopular,
        selectedPlan === plan.id && styles.planCardSelected,
      ]}
      onPress={() => setSelectedPlan(plan.id)}
    >
      <View style={styles.planHeader}>
        <View>
          <ThemedText variant="title" color={theme.textPrimary}>
            {plan.name}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            {plan.duration}
          </ThemedText>
        </View>
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <ThemedText variant="tiny" color={theme.backgroundRoot}>
              {plan.discount || '推荐'}
            </ThemedText>
          </View>
        )}
        {plan.discount && !plan.isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: theme.accent }]}>
            <ThemedText variant="tiny" color={theme.backgroundRoot}>
              {plan.discount}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.planPrice}>
        <ThemedText variant="smallMedium" color={theme.primary}>
          ¥
        </ThemedText>
        <ThemedText variant="stat" color={theme.primary}>
          {plan.price}
        </ThemedText>
        {plan.originalPrice && (
          <ThemedText variant="caption" color={theme.textMuted}>
            原价¥{plan.originalPrice}
          </ThemedText>
        )}
      </View>

      <View style={styles.featuresList}>
        {memberFeatures.slice(0, 3).map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <FontAwesome6 name="check" size={12} color={theme.success} />
            <ThemedText variant="small" color={theme.textSecondary}>
              {feature}
            </ThemedText>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary}>
            G open 会员
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>
            解锁全部创作能力
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Current Plan Status */}
        <View style={[styles.currentPlan, isMember && styles.currentPlanActive]}>
          <View style={styles.planBadge}>
            <FontAwesome6
              name={isMember ? 'crown' : 'user'}
              size={16}
              color={isMember ? theme.primary : theme.textMuted}
            />
            <ThemedText variant="labelSmall" color={isMember ? theme.primary : theme.textMuted}>
              {isMember ? '尊贵会员' : '免费用户'}
            </ThemedText>
          </View>
          <ThemedText variant="title" color={theme.textPrimary}>
            {isMember ? '会员有效期内' : '升级会员解锁更多功能'}
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted}>
            {isMember ? `到期时间：${expireDate}` : '当前可使用基础功能'}
          </ThemedText>
        </View>

        {/* Plans */}
        <ThemedText variant="label" color={theme.textPrimary}>
          选择会员方案
        </ThemedText>
        <View style={styles.plansGrid}>
          {plans.map(renderPlanCard)}
        </View>

        {/* Subscribe Button */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.subscribeButton}
        >
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={handleSubscribe}
          >
            <FontAwesome6 name="crown" size={18} color={theme.backgroundRoot} />
            <ThemedText
              variant="labelTitle"
              color={theme.backgroundRoot}
            >
              {isMember ? '续费会员' : '立即开通'} ¥{selectedPlanData?.price}
            </ThemedText>
          </TouchableOpacity>
        </LinearGradient>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <ThemedText variant="smallMedium" color={theme.textPrimary}>
            支付方式
          </ThemedText>
          <View style={styles.paymentRow}>
            <FontAwesome6 name="wallet" size={16} color={theme.primary} />
            <ThemedText variant="small" color={theme.textMuted}>
              支付宝账号
            </ThemedText>
            <ThemedText variant="smallMedium" color={theme.primary}>
              {ALIPAY_ACCOUNT}
            </ThemedText>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyAccount}>
              <ThemedText variant="captionMedium" color={theme.primary}>
                复制
              </ThemedText>
            </TouchableOpacity>
          </View>
          <ThemedText variant="caption" color={theme.textMuted}>
            转账备注：G open会员+您的手机号
          </ThemedText>
        </View>

        {/* Feature Comparison */}
        <View style={[styles.paymentInfo, { marginTop: Spacing.lg }]}>
          <ThemedText variant="smallMedium" color={theme.textPrimary}>
            会员权益对比
          </ThemedText>
          <View style={{ marginTop: Spacing.md }}>
            <ThemedText variant="captionMedium" color={theme.primary}>
              会员权益
            </ThemedText>
            {memberFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <FontAwesome6 name="circle-check" size={14} color={theme.success} />
                <ThemedText variant="small" color={theme.textSecondary}>
                  {feature}
                </ThemedText>
              </View>
            ))}
            <ThemedText variant="captionMedium" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              免费用户权益
            </ThemedText>
            {freeFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <FontAwesome6 name="circle" size={14} color={theme.textMuted} />
                <ThemedText variant="small" color={theme.textMuted}>
                  {feature}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <ThemedText variant="caption" color={theme.textMuted}>
            开通会员即表示您同意《G open 会员服务协议》。会员权益在支付成功后1-3分钟内激活。如有疑问请联系客服。
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}

import { Spacing } from '@/constants/theme';
