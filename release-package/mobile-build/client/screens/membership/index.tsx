import React, { useState, useMemo, useEffect } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useMembership, type MemberLevel } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface TierPlan {
  level: MemberLevel;
  name: string;
  nameEn: string;
  price: string;
  priceNote?: string;
  color: string[];
  icon: string;
  features: string[];
  restrictions?: string[];
  recommended?: boolean;
}

const tierPlans: TierPlan[] = [
  {
    level: 'free',
    name: '免费用户',
    nameEn: 'FREE',
    price: '¥0',
    icon: 'user',
    color: ['#64748B', '#475569'],
    features: [
      '环境打通功能',
      '每日10次AI对话',
      '基础AI模型',
      '最多3个项目',
      '100MB存储空间',
    ],
    restrictions: [
      '内容制作需升级',
      '高级输出需升级',
    ],
  },
  {
    level: 'member',
    name: '普通会员',
    nameEn: 'MEMBER',
    price: '¥29',
    priceNote: '/月起',
    icon: 'crown',
    color: ['#00F0FF', '#BF00FF'],
    features: [
      '全部免费功能',
      '环境打通功能',
      '内容制作功能',
      '每日100次AI对话',
      '高级AI模型',
      '不限项目数量',
      '10GB存储空间',
    ],
    restrictions: ['高级输出需升级'],
    recommended: true,
  },
  {
    level: 'super',
    name: '超级会员',
    nameEn: 'SUPER',
    price: '¥99',
    priceNote: '/月起',
    icon: 'rocket',
    color: ['#FFD700', '#FF6B00'],
    features: [
      '全部普通会员功能',
      '成品输出功能',
      '无限AI对话',
      '最先进AI模型',
      '优先响应速度',
      '100GB存储空间',
      '专属客服支持',
      '新功能抢先体验',
    ],
  },
];

// 会员时长选项
const DURATION_OPTIONS = [
  { value: 'monthly', label: '月度', discount: '' },
  { value: 'quarterly', label: '季度', discount: '省10%' },
  { value: 'yearly', label: '年度', discount: '省17%' },
];

// 会员价格配置（单位：分）
const MEMBER_PRICES = {
  member: { monthly: 2900, quarterly: 7900, yearly: 29000 },
  super: { monthly: 9900, quarterly: 26900, yearly: 99000 },
};

const ALIPAY_ACCOUNT = '18321337942';

export default function MembershipScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { level, isMember, isSuperMember, expireDate } = useMembership();

  const [selectedTier, setSelectedTier] = useState<MemberLevel>('member');
  const [selectedDuration, setSelectedDuration] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [showPayModal, setShowPayModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // 获取用户ID和余额
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchBalance();
    }
  }, [userId]);

  const fetchBalance = async () => {
    if (!userId) return;
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/balance/${userId}`
      );
      const data = await response.json();
      if (data.success) {
        setBalance(data.data.balance || 0);
      }
    } catch (error) {
      console.error('Fetch balance error:', error);
    }
  };

  const selectedPlan = tierPlans.find(t => t.level === selectedTier);
  const selectedPrice = selectedTier !== 'free' ? MEMBER_PRICES[selectedTier as keyof typeof MEMBER_PRICES][selectedDuration] : 0;
  const balanceYuan = (balance / 100).toFixed(2);
  const isBalanceEnough = balance >= selectedPrice;

  const handleCopyAccount = async () => {
    await Clipboard.setStringAsync(ALIPAY_ACCOUNT);
    if (Platform.OS === 'web') {
      window.alert(`复制成功！支付宝账号 ${ALIPAY_ACCOUNT} 已复制到剪贴板`);
    } else {
      // 使用 setTimeout 确保 UI 线程不阻塞
      setTimeout(() => {
        alert(`复制成功！支付宝账号 ${ALIPAY_ACCOUNT} 已复制到剪贴板`);
      }, 100);
    }
  };

  const handleSubscribe = () => {
    if (selectedTier === 'free') {
      if (Platform.OS === 'web') {
        window.alert('您当前已是免费用户');
      }
      return;
    }
    setShowPayModal(true);
  };

  const handleQRCodePay = () => {
    setShowPayModal(false);
    const amount = selectedPrice;
    const productType = selectedTier === 'member' ? 'membership' : 'super_member';
    router.push('/payment', { amount, productType });
  };

  // 余额开通会员
  const handleBalancePay = async () => {
    if (!userId) {
      Alert.alert('提示', '请先登录');
      return;
    }

    if (!isBalanceEnough) {
      Alert.alert('余额不足', `当前余额 ¥${balanceYuan}，需要 ¥${(selectedPrice / 100).toFixed(2)}`, [
        { text: '取消', style: 'cancel' },
        { text: '去充值', onPress: () => router.push('/wallet') },
      ]);
      return;
    }

    setIsUpgrading(true);
    try {
      /**
       * 服务端文件：server/src/routes/user.ts
       * 接口：POST /api/v1/user/:userId/membership/upgrade
       * Body 参数：memberLevel: 'member' | 'super', duration: 'monthly' | 'quarterly' | 'yearly'
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/${userId}/membership/upgrade`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberLevel: selectedTier,
            duration: selectedDuration,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowPayModal(false);
        Alert.alert(
          '开通成功',
          `恭喜您成为${selectedPlan?.name}！有效期至：${new Date(data.data.expireAt).toLocaleDateString('zh-CN')}`,
          [{ text: '确定', onPress: () => fetchBalance() }]
        );
      } else {
        Alert.alert('开通失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Upgrade membership error:', error);
      Alert.alert('开通失败', '网络错误，请稍后重试');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleTransferPay = async () => {
    setShowPayModal(false);
    await handleCopyAccount();
  };

  const getLevelColor = (lvl: MemberLevel) => {
    if (lvl === 'free') return theme.textMuted;
    if (lvl === 'member') return theme.primary;
    return '#FFD700';
  };

  const getCurrentLevelName = () => {
    if (isSuperMember) return '超级会员';
    if (isMember) return '普通会员';
    return '免费用户';
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ padding: Spacing.sm }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <ThemedText variant="h2" color={theme.textPrimary}>
              会员中心
            </ThemedText>
            <ThemedText variant="label" color={theme.textMuted}>
              三级会员 · 按需开通
            </ThemedText>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.neonLine}
        />

        {/* Current Status */}
        <View style={[styles.currentPlan, isMember && styles.currentPlanActive]}>
          <View style={styles.planBadge}>
            <FontAwesome6
              name={isSuperMember ? 'rocket' : isMember ? 'crown' : 'user'}
              size={16}
              color={getLevelColor(level)}
            />
            <ThemedText variant="labelSmall" color={getLevelColor(level)}>
              {getCurrentLevelName()}
            </ThemedText>
          </View>
          <ThemedText variant="title" color={theme.textPrimary}>
            {isMember ? '会员有效期内' : '升级会员解锁更多功能'}
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted}>
            {isMember ? `到期时间：${expireDate}` : '当前可使用环境打通功能'}
          </ThemedText>
        </View>

        {/* Tier Plans */}
        <ThemedText variant="label" color={theme.textPrimary}>
          选择会员等级
        </ThemedText>
        <View style={styles.tierGrid}>
          {tierPlans.map(tier => (
            <TouchableOpacity
              key={tier.level}
              style={[
                styles.tierCard,
                selectedTier === tier.level && styles.tierCardSelected,
                tier.recommended && styles.tierCardRecommended,
              ]}
              onPress={() => setSelectedTier(tier.level)}
              activeOpacity={0.7}
            >
              {/* Recommended Badge */}
              {tier.recommended && (
                <LinearGradient
                  colors={tier.color as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.recommendedBadge}
                >
                  <ThemedText variant="tiny" color={theme.backgroundRoot}>
                    推荐
                  </ThemedText>
                </LinearGradient>
              )}

              {/* Tier Header */}
              <View style={styles.tierHeader}>
                <LinearGradient
                  colors={tier.color as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tierIcon}
                >
                  <FontAwesome6 name={tier.icon} size={20} color={theme.backgroundRoot} />
                </LinearGradient>
                <View>
                  <ThemedText variant="labelSmall" color={tier.color[0]}>
                    {tier.nameEn}
                  </ThemedText>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {tier.name}
                  </ThemedText>
                </View>
              </View>

              {/* Price */}
              <View style={styles.tierPrice}>
                <ThemedText variant="title" color={tier.color[0]}>
                  {tier.price}
                </ThemedText>
                {tier.priceNote && (
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {tier.priceNote}
                  </ThemedText>
                )}
              </View>

              {/* Features Preview */}
              <View style={styles.tierFeaturesPreview}>
                {tier.features.slice(0, 3).map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <FontAwesome6 name="check" size={10} color={tier.color[0]} />
                    <ThemedText variant="caption" color={theme.textSecondary} numberOfLines={1}>
                      {feature}
                    </ThemedText>
                  </View>
                ))}
                {tier.features.length > 3 && (
                  <ThemedText variant="caption" color={theme.textMuted}>
                    +{tier.features.length - 3}项权益
                  </ThemedText>
                )}
              </View>

              {/* Selection Indicator */}
              {selectedTier === tier.level && (
                <View style={styles.selectedIndicator}>
                  <FontAwesome6 name="circle-check" size={16} color={tier.color[0]} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Full Feature List */}
        {selectedPlan && (
          <View style={styles.featureCard}>
            <View style={styles.featureCardHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                {selectedPlan.name}权益详情
              </ThemedText>
            </View>
            
            <View style={styles.featureSection}>
              <ThemedText variant="labelSmall" color={selectedPlan.color[0]}>
                包含权益
              </ThemedText>
              {selectedPlan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <FontAwesome6 name="circle-check" size={14} color={selectedPlan.color[0]} />
                  <ThemedText variant="small" color={theme.textSecondary}>
                    {feature}
                  </ThemedText>
                </View>
              ))}
            </View>

            {selectedPlan.restrictions && selectedPlan.restrictions.length > 0 && (
              <View style={styles.featureSection}>
                <ThemedText variant="labelSmall" color={theme.textMuted}>
                  升级后解锁
                </ThemedText>
                {selectedPlan.restrictions.map((item, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <FontAwesome6 name="lock" size={14} color={theme.textMuted} />
                    <ThemedText variant="small" color={theme.textMuted}>
                      {item}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Subscribe Button */}
        {selectedTier !== 'free' && (
          <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.8}>
            <LinearGradient
              colors={selectedPlan?.color as [string, string] || [theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeButton}
            >
              <FontAwesome6 name="crown" size={18} color={theme.backgroundRoot} />
              <ThemedText variant="labelTitle" color={theme.backgroundRoot}>
                立即开通 {selectedPlan?.price}
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        )}

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

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <ThemedText variant="caption" color={theme.textMuted}>
            开通会员即表示您同意《G open 会员服务协议》。会员权益在支付成功后1-3分钟内激活。如有疑问请联系客服。
          </ThemedText>
        </View>
      </ScrollView>

      {/* 支付方式选择弹窗 */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            {/* Header */}
            <LinearGradient
              colors={selectedPlan?.color as [string, string] || [theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
              <FontAwesome6 name="crown" size={36} color="#fff" />
              <ThemedText variant="h3" color="#fff" style={{ marginTop: Spacing.sm }}>
                开通 {selectedPlan?.name}
              </ThemedText>
              <ThemedText variant="title" color="#fff" style={{ marginTop: Spacing.xs }}>
                ¥{(selectedPrice / 100).toFixed(0)}
              </ThemedText>
            </LinearGradient>

            {/* Duration Selection */}
            <View style={styles.modalBody}>
              <ThemedText variant="labelSmall" color={theme.textMuted} style={{ marginBottom: Spacing.sm }}>
                选择时长
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
                {DURATION_OPTIONS.map((option) => {
                  const price = MEMBER_PRICES[selectedTier as keyof typeof MEMBER_PRICES][option.value as keyof typeof MEMBER_PRICES.member];
                  const isSelected = selectedDuration === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={{
                        flex: 1,
                        paddingVertical: Spacing.md,
                        paddingHorizontal: Spacing.sm,
                        borderRadius: BorderRadius.lg,
                        borderWidth: 2,
                        borderColor: isSelected ? (selectedPlan?.color[0] || theme.primary) : theme.border,
                        backgroundColor: isSelected ? `${selectedPlan?.color[0] || theme.primary}15` : theme.backgroundTertiary,
                        alignItems: 'center',
                      }}
                      onPress={() => setSelectedDuration(option.value as any)}
                    >
                      {option.discount && (
                        <View style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#FF6B00',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}>
                          <ThemedText variant="tiny" color="#fff">{option.discount}</ThemedText>
                        </View>
                      )}
                      <ThemedText variant="smallMedium" color={isSelected ? (selectedPlan?.color[0] || theme.primary) : theme.textPrimary}>
                        {option.label}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        ¥{(price / 100).toFixed(0)}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Balance Payment */}
              <TouchableOpacity
                style={[styles.payOption, !isBalanceEnough && { opacity: 0.5 }]}
                onPress={handleBalancePay}
                disabled={!isBalanceEnough || isUpgrading}
                activeOpacity={0.7}
              >
                <View style={[styles.payOptionIcon, { backgroundColor: '#10B981' }]}>
                  <FontAwesome6 name="coins" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      余额支付
                    </ThemedText>
                    <ThemedText variant="small" color={isBalanceEnough ? '#10B981' : theme.error}>
                      余额 ¥{balanceYuan}
                    </ThemedText>
                  </View>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {isBalanceEnough ? '使用账户余额即时开通' : '余额不足，请先充值'}
                  </ThemedText>
                </View>
                {isUpgrading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
                )}
              </TouchableOpacity>

              {/* QR Code Payment */}
              <TouchableOpacity
                style={styles.payOption}
                onPress={handleQRCodePay}
                activeOpacity={0.7}
              >
                <View style={[styles.payOptionIcon, { backgroundColor: theme.primary }]}>
                  <FontAwesome6 name="qrcode" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    扫码支付
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    支付宝/微信/银联扫码
                  </ThemedText>
                </View>
                <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Bank Transfer */}
              <TouchableOpacity
                style={styles.payOption}
                onPress={handleTransferPay}
                activeOpacity={0.7}
              >
                <View style={[styles.payOptionIcon, { backgroundColor: '#C41230' }]}>
                  <FontAwesome6 name="building-columns" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    银行转账
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    银行卡转账后联系客服开通
                  </ThemedText>
                </View>
                <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPayModal(false)}
              >
                <ThemedText variant="small" color={theme.textMuted}>
                  取消
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
