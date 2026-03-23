/**
 * 钱包页面
 * 功能：余额管理、G点管理、充值、消费记录
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
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Model {
  id: string;
  code: string;
  name: string;
  provider: string;
  category: string;
  inputPrice: string;
  outputPrice: string;
  is_free: boolean;
  member_only: boolean;
  super_member_only: boolean;
  max_tokens: number;
  description?: string;
}

interface Balance {
  balance: number;
  balanceYuan: string;
  frozenBalance: number;
  totalRecharged: number;
  totalConsumed: number;
  monthlyConsumed: number;
  gPoints?: number;
}

// 预设充值金额（现金）
const RECHARGE_OPTIONS = [
  { amount: 1000, bonus: 0, label: '10元' },
  { amount: 5000, bonus: 500, label: '50元' },
  { amount: 10000, bonus: 1500, label: '100元' },
  { amount: 50000, bonus: 10000, label: '500元' },
  { amount: 100000, bonus: 25000, label: '1000元' },
  { amount: 0, bonus: 0, label: '自定义' },
];

// G点充值选项
const GPOINT_RECHARGE_OPTIONS = [
  { amount: 10, gPoints: 1000, label: '10元' },
  { amount: 30, gPoints: 3000, label: '30元', bonus: 300 },
  { amount: 50, gPoints: 5000, label: '50元', bonus: 800 },
  { amount: 100, gPoints: 10000, label: '100元', bonus: 2000 },
  { amount: 200, gPoints: 20000, label: '200元', bonus: 5000 },
];

export default function WalletScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [rechargeModal, setRechargeModal] = useState(false);
  const [gPointModal, setGPointModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

      // 获取模型列表
      const modelsRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/models`
      );
      const modelsData = await modelsRes.json();
      if (modelsData.success) {
        setModels(modelsData.data || []);
        if (modelsData.data?.length > 0) {
          setSelectedModel(modelsData.data[0].id);
        }
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecharge = async () => {
    if (!userId) {
      Alert.alert('请先登录', '您需要登录后才能充值');
      return;
    }

    let amount = selectedAmount;
    if (selectedAmount === 0) {
      amount = parseInt(customAmount) * 100;
      if (isNaN(amount) || amount < 100) {
        Alert.alert('提示', '充值金额最低1元');
        return;
      }
    }

    setRechargeModal(false);
    router.push('/payment', { amount, productType: 'recharge' });
  };

  // G点充值
  const handleGPointRecharge = async (option: typeof GPOINT_RECHARGE_OPTIONS[0]) => {
    if (!userId) {
      Alert.alert('请先登录', '您需要登录后才能充值');
      return;
    }

    setSubmitting(true);
    try {
      /**
       * 服务端文件：server/src/routes/billing.ts
       * 接口：POST /api/v1/billing/g-points/recharge
       * Body 参数：userId: string, amount: number, description?: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/g-points/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: option.amount,
          description: `钱包充值G点`,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('充值成功', `成功充值${option.amount}元，获得${option.gPoints + (option.bonus || 0)}G点`);
        setGPointModal(false);
        fetchData(); // 刷新余额
      } else {
        Alert.alert('充值失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('G-point recharge error:', error);
      Alert.alert('充值失败', '网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getModelIcon = (provider: string, category: string): keyof typeof FontAwesome6.glyphMap => {
    if (provider === 'openai') return 'robot';
    if (provider === 'ollama') return 'server';
    if (category === 'image') return 'image';
    if (category === 'video') return 'video';
    if (category === 'audio') return 'music';
    return 'brain';
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
        {/* Header with back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ padding: Spacing.sm, marginLeft: -Spacing.sm }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginLeft: Spacing.sm }}>
            钱包
          </ThemedText>
        </View>

        {/* 现金余额卡片 */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <ThemedText variant="small" color={theme.textMuted} style={styles.balanceLabel}>
              账户余额
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/bill')}>
              <FontAwesome6 name="receipt" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <ThemedText variant="h1" color={theme.textPrimary} style={styles.balanceAmount}>
            ¥{balance?.balanceYuan || '0.00'}
          </ThemedText>
          <View style={styles.balanceActions}>
            <TouchableOpacity
              style={[styles.balanceButton, styles.rechargeButton]}
              onPress={() => setRechargeModal(true)}
            >
              <ThemedText variant="smallMedium" color={theme.buttonPrimaryText} style={styles.balanceButtonText}>
                充值
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.balanceButton, styles.withdrawButton]}
              onPress={() => router.push('/consumption')}
            >
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.balanceButtonText}>
                消费记录
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* G点余额卡片 */}
        <View style={[styles.gPointCard, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B30' }]}>
          <View style={styles.balanceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome6 name="bolt" size={18} color="#F59E0B" solid style={{ marginRight: 8 }} />
              <ThemedText variant="small" color={theme.textMuted}>
                G点余额
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => setGPointModal(true)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                <FontAwesome6 name="plus" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>充值</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
            <ThemedText variant="h1" color="#F59E0B" style={{ fontSize: 32, fontWeight: '700' }}>
              {balance?.gPoints?.toLocaleString() || '0'}
            </ThemedText>
            <ThemedText variant="label" color="#F59E0B" style={{ marginLeft: 8 }}>G点</ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 8 }}>
            视频生成：1秒 = 1G点 | 充值：1元 = 100G点
          </ThemedText>
        </View>

        {/* 统计 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.statValue}>
              ¥{((balance?.totalConsumed || 0) / 100).toFixed(2)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
              累计消费
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.statValue}>
              ¥{((balance?.monthlyConsumed || 0) / 100).toFixed(2)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
              本月消费
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.statValue}>
              ¥{((balance?.totalRecharged || 0) / 100).toFixed(2)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
              累计充值
            </ThemedText>
          </View>
        </View>

        {/* 模型选择 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
              选择模型
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/models')}>
              <ThemedText variant="small" color={theme.primary}>
                查看全部
              </ThemedText>
            </TouchableOpacity>
          </View>

          {models.slice(0, 5).map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[styles.modelCard, selectedModel === model.id && styles.selectedModel]}
              onPress={() => setSelectedModel(model.id)}
            >
              <View style={styles.modelHeader}>
                <View style={styles.modelIcon}>
                  <FontAwesome6
                    name={getModelIcon(model.provider, model.category)}
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={styles.modelInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.modelName}>
                      {model.name}
                    </ThemedText>
                    {model.is_free && (
                      <View style={[styles.modelBadge, styles.freeBadge]}>
                        <Text style={[styles.badgeText, { color: theme.success }]}>免费</Text>
                      </View>
                    )}
                    {model.member_only && !model.is_free && (
                      <View style={[styles.modelBadge, styles.memberBadge]}>
                        <Text style={[styles.badgeText, { color: '#D97706' }]}>会员</Text>
                      </View>
                    )}
                  </View>
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.modelProvider}>
                    {model.provider.toUpperCase()} · {model.max_tokens}K tokens
                  </ThemedText>
                </View>
              </View>
              <View style={styles.modelPrice}>
                <View>
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.priceLabel}>
                    输入价格
                  </ThemedText>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.priceValue}>
                    ¥{model.inputPrice}/百万tokens
                  </ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.priceLabel}>
                    输出价格
                  </ThemedText>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.priceValue}>
                    ¥{model.outputPrice}/百万tokens
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 现金充值弹窗 */}
      <Modal
        visible={rechargeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRechargeModal(false)}
      >
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h4" color={theme.textPrimary} style={styles.modalTitle}>
                账户充值
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={() => setRechargeModal(false)}>
                <FontAwesome6 name="xmark" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.amountOptions}>
              {RECHARGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.amountOption,
                    selectedAmount === option.amount && styles.amountSelected,
                  ]}
                  onPress={() => setSelectedAmount(option.amount)}
                >
                  <Text
                    style={[
                      styles.amountValue,
                      { color: selectedAmount === option.amount ? theme.buttonPrimaryText : theme.textPrimary },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.bonus > 0 && (
                    <Text
                      style={[
                        styles.amountBonus,
                        { color: selectedAmount === option.amount ? theme.buttonPrimaryText : theme.success },
                      ]}
                    >
                      送{option.bonus / 100}元
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {selectedAmount === 0 && (
              <View style={styles.customAmount}>
                <Text style={{ color: theme.textMuted, marginRight: 8 }}>¥</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="输入充值金额"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleRecharge}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
              ) : (
                <ThemedText variant="smallMedium" color={theme.buttonPrimaryText} style={styles.submitButtonText}>
                  立即充值
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* G点充值弹窗 */}
      <Modal
        visible={gPointModal}
        transparent
        animationType="slide"
        onRequestClose={() => setGPointModal(false)}
      >
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome6 name="bolt" size={20} color="#F59E0B" solid style={{ marginRight: 8 }} />
                <ThemedText variant="h4" color={theme.textPrimary} style={styles.modalTitle}>
                  G点充值
                </ThemedText>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setGPointModal(false)}>
                <FontAwesome6 name="xmark" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 16 }}>
              1元 = 100G点，视频生成1秒 = 1G点
            </ThemedText>

            {/* 当前余额 */}
            <View style={{ 
              backgroundColor: '#F59E0B10', 
              borderRadius: BorderRadius.md, 
              padding: 16, 
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <ThemedText variant="label" color={theme.textMuted}>当前G点</ThemedText>
              <ThemedText variant="h3" color="#F59E0B">{balance?.gPoints?.toLocaleString() || '0'} G点</ThemedText>
            </View>

            {/* 充值选项 */}
            <View style={{ gap: 12 }}>
              {GPOINT_RECHARGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.amount}
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.md,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: theme.border,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onPress={() => handleGPointRecharge(option)}
                  disabled={submitting}
                >
                  <View>
                    <ThemedText variant="label" color={theme.textPrimary} style={{ fontWeight: '600' }}>
                      充值 {option.amount} 元
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
                      获得 {(option.gPoints + (option.bonus || 0)).toLocaleString()} G点
                    </ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {option.bonus && (
                      <View style={{
                        backgroundColor: '#F59E0B20',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginRight: 12,
                      }}>
                        <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '600' }}>
                          +{option.bonus}赠送
                        </Text>
                      </View>
                    )}
                    <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 说明 */}
            <View style={{ marginTop: 20, padding: 12, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.sm }}>
              <ThemedText variant="tiny" color={theme.textMuted}>
                • G点仅用于视频生成服务{'\n'}
                • G点不可提现，不可转让{'\n'}
                • 充值即时到账
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
