/**
 * 用户充值页面
 * 支持余额充值和会员充值
 * 
 * 安全机制：
 * 1. 必须上传支付凭证截图
 * 2. 只能选择预设金额
 * 3. 流水号格式验证
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 充值金额选项
const RECHARGE_OPTIONS = [
  { amount: 1000, bonus: 0, label: '10元', desc: '' },
  { amount: 5000, bonus: 100, label: '50元', desc: '送1元' },
  { amount: 10000, bonus: 300, label: '100元', desc: '送3元' },
  { amount: 30000, bonus: 1500, label: '300元', desc: '送15元' },
  { amount: 50000, bonus: 3000, label: '500元', desc: '送30元' },
  { amount: 100000, bonus: 8000, label: '1000元', desc: '送80元' },
];

// 支付方式
const PAY_METHODS = [
  { key: 'alipay', name: '支付宝', icon: 'alipay', color: '#1677FF' },
  { key: 'wechat', name: '微信支付', icon: 'wechat', color: '#07C160' },
  { key: 'jdpay', name: '京东支付', icon: 'jd', color: '#E4393C' },
  { key: 'bank_transfer', name: '银行转账', icon: 'building-columns', color: '#6B7280' },
];

// 充值记录
interface RechargeRecord {
  id: string;
  order_no: string;
  amount: number;
  bonus_amount: number;
  recharge_type: string;
  pay_method: string;
  status: string;
  submit_at: string;
  reject_reason: string;
}

// 用户余额
interface UserBalance {
  balance: number;
  total_recharged: number;
  total_consumed: number;
}

// 状态映射
const STATUS_NAMES: Record<string, string> = {
  pending: '待审核',
  approved: '已到账',
  rejected: '已拒绝',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
};

export default function RechargeScreen() {
  const { theme, isDark } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 用户信息
  const [userId, setUserId] = useState('');
  const [balance, setBalance] = useState<UserBalance | null>(null);
  
  // 充值表单
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPayMethod, setSelectedPayMethod] = useState('alipay');
  const [transactionId, setTransactionId] = useState('');
  const [rechargeType, setRechargeType] = useState<'balance' | 'membership' | 'super_member'>('balance');
  
  // 支付凭证（安全机制：必须上传）
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  
  // 充值记录
  const [records, setRecords] = useState<RechargeRecord[]>([]);

  /**
   * 选择支付凭证图片
   */
  const handlePickProofImage = useCallback(async () => {
    // 请求相册权限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要相册访问权限才能上传支付凭证');
      return;
    }
    
    // 限制最多上传5张
    if (proofImages.length >= 5) {
      Alert.alert('提示', '最多上传5张支付凭证');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      // 上传图片
      await uploadProofImage(result.assets[0].uri);
    }
  }, [proofImages.length]);

  /**
   * 上传支付凭证到服务器
   */
  const uploadProofImage = useCallback(async (localUri: string) => {
    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      const fileName = localUri.split('/').pop() || 'proof.jpg';
      const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
      
      // 创建文件对象
      const response = await fetch(localUri);
      const blob = await response.blob();
      formData.append('file', new File([blob], fileName, { type: mimeType }));
      
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/upload-proof`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        setProofImages(prev => [...prev, data.data.proofUrl]);
      } else {
        Alert.alert('上传失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Upload proof error:', error);
      Alert.alert('上传失败', '网络错误，请稍后重试');
    } finally {
      setIsUploadingProof(false);
    }
  }, []);

  /**
   * 删除支付凭证
   */
  const handleRemoveProof = useCallback((index: number) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * 获取用户ID
   */
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Get userId error:', error);
      }
    };
    fetchUserId();
  }, []);

  /**
   * 获取用户余额
   */
  const fetchBalance = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/balance/${userId}`);
      const data = await res.json();
      if (data.success) {
        setBalance({
          balance: data.data.balance,
          total_recharged: data.data.totalRecharged,
          total_consumed: data.data.totalConsumed,
        });
      }
    } catch (error) {
      console.error('Fetch balance error:', error);
    }
  }, [userId]);

  /**
   * 获取充值记录
   */
  const fetchRecords = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/user/${userId}?limit=10`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error('Fetch records error:', error);
    }
  }, [userId]);

  /**
   * 加载所有数据
   */
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchBalance(), fetchRecords()]);
    setIsLoading(false);
  }, [fetchBalance, fetchRecords]);

  /**
   * 刷新数据
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  useEffect(() => {
    if (userId) {
      loadAllData();
    }
  }, [userId, loadAllData]);

  /**
   * 提交充值申请
   * 安全机制：必须上传支付凭证
   */
  const handleSubmit = useCallback(async () => {
    const amount = selectedAmount || parseInt(customAmount) * 100;
    
    if (!amount || amount < 100) {
      Alert.alert('提示', '最低充值金额为1元');
      return;
    }
    
    if (!transactionId.trim()) {
      Alert.alert('提示', '请输入支付流水号');
      return;
    }
    
    // 安全机制：必须上传支付凭证
    if (proofImages.length === 0) {
      Alert.alert('提示', '请上传支付截图作为凭证');
      return;
    }
    
    if (!userId) {
      Alert.alert('提示', '请先登录');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/recharge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          rechargeType,
          payMethod: selectedPayMethod,
          transactionId,
          proofImages, // 传递支付凭证URL数组
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        Alert.alert(
          '提交成功',
          '充值申请已提交，请等待管理员审核（通常5分钟内）',
          [
            {
              text: '确定',
              onPress: () => {
                setTransactionId('');
                setSelectedAmount(null);
                setCustomAmount('');
                setProofImages([]); // 清除支付凭证
                loadAllData();
              },
            },
          ]
        );
      } else {
        Alert.alert('提交失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Submit recharge error:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAmount, customAmount, transactionId, userId, rechargeType, selectedPayMethod, proofImages, loadAllData]);

  // 格式化金额
  const formatAmount = (amount: number) => `¥${(amount / 100).toFixed(2)}`;

  // 格式化时间
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    return new Date(timeStr).toLocaleString('zh-CN');
  };

  // 计算当前选择的金额
  const currentAmount = selectedAmount || (parseInt(customAmount) || 0) * 100;
  const currentBonus = RECHARGE_OPTIONS.find(o => o.amount === selectedAmount)?.bonus || 0;
  const totalAmount = currentAmount + currentBonus;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: Spacing['5xl'] }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {/* 余额卡片 */}
        <LinearGradient
          colors={[theme.primary, '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <FontAwesome6 name="wallet" size={24} color="#fff" />
            <ThemedText variant="smallMedium" color="rgba(255,255,255,0.8)">账户余额</ThemedText>
          </View>
          
          <ThemedText variant="h1" color="#fff" style={styles.balanceAmount}>
            {balance ? formatAmount(balance.balance) : '¥0.00'}
          </ThemedText>
          
          <View style={styles.balanceStats}>
            <View style={styles.balanceStatItem}>
              <ThemedText variant="tiny" color="rgba(255,255,255,0.6)">累计充值</ThemedText>
              <ThemedText variant="smallMedium" color="#fff">
                {balance ? formatAmount(balance.total_recharged) : '¥0.00'}
              </ThemedText>
            </View>
            <View style={styles.balanceStatDivider} />
            <View style={styles.balanceStatItem}>
              <ThemedText variant="tiny" color="rgba(255,255,255,0.6)">累计消费</ThemedText>
              <ThemedText variant="smallMedium" color="#fff">
                {balance ? formatAmount(balance.total_consumed) : '¥0.00'}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        {/* 充值类型选择 */}
        <View style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            充值类型
          </ThemedText>
          
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                rechargeType === 'balance' && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
              ]}
              onPress={() => setRechargeType('balance')}
            >
              <FontAwesome6 
                name="coins" 
                size={20} 
                color={rechargeType === 'balance' ? theme.primary : theme.textMuted} 
              />
              <ThemedText 
                variant="smallMedium" 
                color={rechargeType === 'balance' ? theme.primary : theme.textSecondary}
                style={{ marginLeft: 8 }}
              >
                余额充值
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                rechargeType === 'membership' && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
              ]}
              onPress={() => setRechargeType('membership')}
            >
              <FontAwesome6 
                name="crown" 
                size={20} 
                color={rechargeType === 'membership' ? theme.primary : theme.textMuted} 
              />
              <ThemedText 
                variant="smallMedium" 
                color={rechargeType === 'membership' ? theme.primary : theme.textSecondary}
                style={{ marginLeft: 8 }}
              >
                普通会员
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                rechargeType === 'super_member' && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
              ]}
              onPress={() => setRechargeType('super_member')}
            >
              <FontAwesome6 
                name="gem" 
                size={20} 
                color={rechargeType === 'super_member' ? theme.primary : theme.textMuted} 
              />
              <ThemedText 
                variant="smallMedium" 
                color={rechargeType === 'super_member' ? theme.primary : theme.textSecondary}
                style={{ marginLeft: 8 }}
              >
                超级会员
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 充值金额选择 */}
        <View style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            选择金额
          </ThemedText>
          
          <View style={styles.amountGrid}>
            {RECHARGE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.amount}
                style={[
                  styles.amountItem,
                  selectedAmount === option.amount && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                ]}
                onPress={() => {
                  setSelectedAmount(option.amount);
                  setCustomAmount('');
                }}
              >
                <ThemedText 
                  variant="h4" 
                  color={selectedAmount === option.amount ? theme.primary : theme.textPrimary}
                >
                  {option.label}
                </ThemedText>
                {option.bonus > 0 && (
                  <View style={[styles.bonusBadge, { backgroundColor: theme.success + '20' }]}>
                    <Text style={{ color: theme.success, fontSize: 11 }}>{option.desc}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 自定义金额 */}
          <View style={styles.customAmountContainer}>
            <ThemedText variant="small" color={theme.textSecondary}>或输入自定义金额</ThemedText>
            <View style={[styles.customAmountInput, { borderColor: theme.border }]}>
              <Text style={{ color: theme.textMuted, fontSize: 16 }}>¥</Text>
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                placeholder="输入金额"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text);
                  setSelectedAmount(null);
                }}
              />
            </View>
          </View>
        </View>

        {/* 支付方式选择 */}
        <View style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            支付方式
          </ThemedText>
          
          <View style={styles.payMethodList}>
            {PAY_METHODS.map((method) => (
              <TouchableOpacity
                key={method.key}
                style={[
                  styles.payMethodItem,
                  selectedPayMethod === method.key && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                ]}
                onPress={() => setSelectedPayMethod(method.key)}
              >
                <FontAwesome6 
                  name={method.icon as any} 
                  size={20} 
                  color={selectedPayMethod === method.key ? theme.primary : method.color} 
                />
                <ThemedText 
                  variant="smallMedium" 
                  color={selectedPayMethod === method.key ? theme.primary : theme.textPrimary}
                  style={{ marginLeft: 12, flex: 1 }}
                >
                  {method.name}
                </ThemedText>
                {selectedPayMethod === method.key && (
                  <FontAwesome6 name="circle-check" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 流水号输入 */}
        <View style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            支付凭证
          </ThemedText>
          
          <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.sm }}>
            请先扫码支付，然后填写支付流水号并上传支付截图
          </ThemedText>
          
          <TextInput
            style={[styles.transactionInput, { 
              backgroundColor: theme.backgroundTertiary,
              borderColor: theme.border,
              color: theme.textPrimary
            }]}
            placeholder="输入支付流水号/订单号后6位"
            placeholderTextColor={theme.textMuted}
            value={transactionId}
            onChangeText={setTransactionId}
          />
          
          {/* 支付凭证上传区域 */}
          <View style={{ marginTop: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                支付截图 <Text style={{ color: theme.error }}>*</Text>
              </ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>
                {proofImages.length}/5张
              </ThemedText>
            </View>
            
            {/* 已上传的图片 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {proofImages.map((url, index) => (
                <View key={index} style={{ position: 'relative' }}>
                  <Image 
                    source={{ uri: url }} 
                    style={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: BorderRadius.md,
                      backgroundColor: theme.backgroundTertiary,
                    }}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: theme.error,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => handleRemoveProof(index)}
                  >
                    <FontAwesome6 name="xmark" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {/* 上传按钮 */}
              {proofImages.length < 5 && (
                <TouchableOpacity
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: BorderRadius.md,
                    backgroundColor: theme.backgroundTertiary,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderStyle: 'dashed',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={handlePickProofImage}
                  disabled={isUploadingProof}
                >
                  {isUploadingProof ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <FontAwesome6 name="plus" size={24} color={theme.textMuted} />
                      <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: 4 }}>
                        上传截图
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 提交按钮 */}
        <View style={styles.submitSection}>
          {currentAmount > 0 && (
            <View style={styles.amountSummary}>
              <ThemedText variant="small" color={theme.textSecondary}>
                充值金额: {formatAmount(currentAmount)}
              </ThemedText>
              {currentBonus > 0 && (
                <ThemedText variant="small" color={theme.success} style={{ marginLeft: 12 }}>
                  赠送: {formatAmount(currentBonus)}
                </ThemedText>
              )}
              <ThemedText variant="smallMedium" color={theme.primary} style={{ marginLeft: 12 }}>
                到账: {formatAmount(totalAmount)}
              </ThemedText>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting || !currentAmount || !transactionId.trim() || proofImages.length === 0}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <FontAwesome6 name="paper-plane" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>提交充值申请</Text>
              </>
            )}
          </TouchableOpacity>
          
          <ThemedText variant="tiny" color={theme.textMuted} style={styles.submitHint}>
            提交后请等待管理员审核，通常5分钟内完成
          </ThemedText>
          
          {proofImages.length === 0 && (
            <ThemedText variant="tiny" color={theme.error} style={{ marginTop: Spacing.sm }}>
              ⚠️ 请上传支付截图作为凭证
            </ThemedText>
          )}
        </View>

        {/* 充值记录 */}
        <View style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            充值记录
          </ThemedText>
          
          {records.length === 0 ? (
            <View style={styles.emptyRecords}>
              <FontAwesome6 name="inbox" size={32} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.sm }}>
                暂无充值记录
              </ThemedText>
            </View>
          ) : (
            records.map((record) => (
              <View key={record.id} style={[styles.recordItem, { borderColor: theme.border }]}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordInfo}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {formatAmount(record.amount + (record.bonus_amount || 0))}
                    </ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[record.status] + '20' }]}>
                      <Text style={{ color: STATUS_COLORS[record.status], fontSize: 11 }}>
                        {STATUS_NAMES[record.status]}
                      </Text>
                    </View>
                  </View>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    {formatTime(record.submit_at)}
                  </ThemedText>
                </View>
                
                <View style={styles.recordDetails}>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    订单号: {record.order_no}
                  </ThemedText>
                </View>
                
                {record.reject_reason && (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                    拒绝原因: {record.reject_reason}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
      
      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
      </TouchableOpacity>
    </Screen>
  );
}

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute' as const,
    top: Spacing.lg,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  balanceCard: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  balanceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  balanceAmount: {
    marginTop: Spacing.md,
    fontSize: 40,
  },
  balanceStats: {
    flexDirection: 'row' as const,
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  balanceStatItem: {
    flex: 1,
    alignItems: 'center' as const,
  },
  balanceStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  typeSelector: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundDefault,
  },
  amountGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
  },
  amountItem: {
    width: '31%' as const,
    aspectRatio: 1.5,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundDefault,
  },
  bonusBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  customAmountContainer: {
    marginTop: Spacing.md,
  },
  customAmountInput: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  payMethodList: {
    gap: Spacing.sm,
  },
  payMethodItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundDefault,
  },
  transactionInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
  },
  submitSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: theme.backgroundDefault,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  amountSummary: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  submitButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  submitHint: {
    textAlign: 'center' as const,
    marginTop: Spacing.sm,
  },
  emptyRecords: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.xl,
  },
  recordItem: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  recordHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  recordInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  recordDetails: {
    marginTop: Spacing.xs,
  },
});
