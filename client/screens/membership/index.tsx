import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useMembership, type MemberLevel } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

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
    priceNote: '/月',
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
    priceNote: '/月',
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

const ALIPAY_ACCOUNT = '18321337942';

export default function MembershipScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { level, isMember, isSuperMember, expireDate } = useMembership();

  const [selectedTier, setSelectedTier] = useState<MemberLevel>('member');
  const [showPayModal, setShowPayModal] = useState(false);

  const selectedPlan = tierPlans.find(t => t.level === selectedTier);

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
    const amount = selectedTier === 'member' ? 2900 : 9900;
    const productType = selectedTier === 'member' ? 'membership' : 'super_member';
    router.push('/payment', { amount, productType });
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
            style={{ position: 'absolute', left: 0, padding: Spacing.sm, zIndex: 1 }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h2" color={theme.textPrimary} style={{ marginLeft: Spacing["2xl"] }}>
            会员中心
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted} style={{ marginLeft: Spacing["2xl"] }}>
            三级会员 · 按需开通
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

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
                {selectedPlan?.price}{selectedPlan?.priceNote}
              </ThemedText>
            </LinearGradient>

            {/* Options */}
            <View style={styles.modalBody}>
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
                    支付宝/微信扫码付款，即时开通
                  </ThemedText>
                </View>
                <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.payOption}
                onPress={handleTransferPay}
                activeOpacity={0.7}
              >
                <View style={[styles.payOptionIcon, { backgroundColor: '#1677FF' }]}>
                  <FontAwesome6 name="wallet" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    转账支付
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    手动转账后联系客服开通
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
