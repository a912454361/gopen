import React, { useMemo, useState, useCallback } from 'react';
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
import { createStyles } from './styles';
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
}

// 预设充值金额
const RECHARGE_OPTIONS = [
  { amount: 1000, bonus: 0, label: '10元' },
  { amount: 5000, bonus: 500, label: '50元' },
  { amount: 10000, bonus: 1500, label: '100元' },
  { amount: 50000, bonus: 10000, label: '500元' },
  { amount: 100000, bonus: 25000, label: '1000元' },
  { amount: 0, bonus: 0, label: '自定义' },
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
  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setIsLoading(false);
        return;
      }

      // 获取余额
      const balanceRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/balance/${userId}`
      );
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setBalance(balanceData.data);
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

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRecharge = async () => {
    const userId = await AsyncStorage.getItem('userId');
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

    setSubmitting(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/recharge`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            amount,
            paymentMethod: 'alipay',
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert('充值成功', `已充值 ${(amount / 100).toFixed(2)} 元`);
        setRechargeModal(false);
        fetchData();
      } else {
        Alert.alert('充值失败', result.error);
      }
    } catch (error) {
      console.error('Recharge error:', error);
      Alert.alert('充值失败', '网络错误，请重试');
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
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h3" color={theme.textPrimary}>
            钱包
          </ThemedText>
        </ThemedView>

        {/* 余额卡片 */}
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
              onPress={() => Alert.alert('提示', '提现功能开发中')}
            >
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.balanceButtonText}>
                消费记录
              </ThemedText>
            </TouchableOpacity>
          </View>
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

      {/* 充值弹窗 */}
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
    </Screen>
  );
}
