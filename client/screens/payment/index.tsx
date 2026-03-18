import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type PayType = 'alipay' | 'wechat';
type TabType = 'qrcode' | 'auth' | 'records';

interface PayOrder {
  id: string;
  order_no: string;
  amount: number;
  pay_type: string;
  status: string;
  qr_code_url: string;
  expired_at: string;
}

interface PayAuth {
  id: string;
  auth_type: string;
  deduct_amount: number;
  deduct_cycle: string;
  next_deduct_time: string;
  status: string;
  created_at: string;
}

interface DeductRecord {
  id: string;
  amount: number;
  status: string;
  error_message: string | null;
  created_at: string;
  deducted_at: string | null;
}

export default function PaymentScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { level, setMember } = useMembership();
  const params = useSafeSearchParams<{ amount?: number; productType?: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('qrcode');
  const [payType, setPayType] = useState<PayType>('alipay');
  const [amount, setAmount] = useState(params.amount?.toString() || '2900'); // 默认29元
  const [loading, setLoading] = useState(false);
  
  // 二维码状态
  const [currentOrder, setCurrentOrder] = useState<PayOrder | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  // 代扣授权状态
  const [auths, setAuths] = useState<PayAuth[]>([]);
  const [deductAmount, setDeductAmount] = useState('2900');
  const [deductCycle, setDeductCycle] = useState<'monthly' | 'daily'>('monthly');
  
  // 扣费记录
  const [records, setRecords] = useState<DeductRecord[]>([]);

  // 模拟用户ID（实际应从登录态获取）
  const userId = 'demo_user_001';

  // 产品类型
  const productType = params.productType || 'membership';

  // 获取产品名称
  const getProductName = () => {
    if (productType === 'super_member') return '超级会员订阅';
    if (productType === 'membership') return '普通会员订阅';
    return '会员订阅';
  };

  // 倒计时
  useEffect(() => {
    if (countdown > 0 && currentOrder) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && currentOrder) {
      // 超时，重新生成
      if (Platform.OS === 'web') {
        alert('订单超时，二维码已过期，请重新生成');
      } else {
        Alert.alert('订单超时', '二维码已过期，请重新生成');
      }
      setCurrentOrder(null);
    }
  }, [countdown, currentOrder]);

  // 轮询支付状态
  useEffect(() => {
    if (currentOrder && countdown > 0) {
      const interval = setInterval(async () => {
        try {
          /**
           * 服务端文件：server/src/routes/pay.ts
           * 接口：GET /api/v1/pay/status/:orderNo
           */
          const response = await fetch(
            `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/status/${currentOrder.order_no}`
          );
          const result = await response.json();
          
          if (result.success && result.data.status === 'paid') {
            clearInterval(interval);
            // 更新会员状态
            const expireDate = new Date();
            expireDate.setMonth(expireDate.getMonth() + 1); // 一个月后过期
            
            if (productType === 'super_member') {
              setMember('super', expireDate.toISOString(), 'monthly');
            } else if (productType === 'membership') {
              setMember('member', expireDate.toISOString(), 'monthly');
            }
            
            if (Platform.OS === 'web') {
              alert('支付成功！会员已开通，感谢您的支持！');
              router.push('/membership');
            } else {
              Alert.alert('支付成功', '会员已开通，感谢您的支持！', [
                { text: '好的', onPress: () => router.push('/membership') },
              ]);
            }
            setCurrentOrder(null);
          }
        } catch (error) {
          console.error('Poll status error:', error);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [currentOrder, countdown, router, productType, setMember]);

  // 加载授权和记录
  useEffect(() => {
    if (activeTab === 'auth') {
      loadAuths();
    } else if (activeTab === 'records') {
      loadRecords();
    }
  }, [activeTab]);

  const loadAuths = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/pay.ts
       * 接口：GET /api/v1/pay/auth/:userId
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/auth/${userId}`);
      const result = await response.json();
      if (result.success) {
        setAuths(result.data);
      }
    } catch (error) {
      console.error('Load auths error:', error);
    }
  };

  const loadRecords = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/pay.ts
       * 接口：GET /api/v1/pay/deduct-records/:userId
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/deduct-records/${userId}`);
      const result = await response.json();
      if (result.success) {
        setRecords(result.data);
      }
    } catch (error) {
      console.error('Load records error:', error);
    }
  };

  // 生成支付二维码
  const handleGenerateQRCode = async () => {
    setLoading(true);
    try {
      /**
       * 服务端文件：server/src/routes/pay.ts
       * 接口：POST /api/v1/pay/qrcode
       * Body 参数：userId: string, amount: number, payType: 'alipay'|'wechat', productType: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/qrcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseInt(amount, 10),
          payType,
          productType: productType as 'membership' | 'super_member',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentOrder(result.data);
        // 15分钟倒计时
        const expiresAt = new Date(result.data.expiredAt);
        const remaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
        setCountdown(remaining);
      } else {
        if (Platform.OS === 'web') {
          alert(result.error || '无法生成支付二维码');
        } else {
          Alert.alert('生成失败', result.error || '无法生成支付二维码');
        }
      }
    } catch (error) {
      console.error('Generate QR code error:', error);
      if (Platform.OS === 'web') {
        alert('网络错误，请重试');
      } else {
        Alert.alert('生成失败', '网络错误，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 模拟支付成功（仅测试用）
  const handleSimulatePay = async () => {
    if (!currentOrder) return;
    
    try {
      /**
       * 服务端文件：server/src/routes/pay.ts
       * 接口：POST /api/v1/pay/simulate/:orderNo
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/simulate/${currentOrder.order_no}`,
        { method: 'POST' }
      );
      const result = await response.json();
      
      if (result.success) {
        // 更新会员状态
        const expireDate = new Date();
        expireDate.setMonth(expireDate.getMonth() + 1); // 一个月后过期
        
        if (productType === 'super_member') {
          setMember('super', expireDate.toISOString(), 'monthly');
        } else if (productType === 'membership') {
          setMember('member', expireDate.toISOString(), 'monthly');
        }
        
        if (Platform.OS === 'web') {
          alert('模拟支付成功，会员已开通');
        } else {
          Alert.alert('模拟支付成功', '会员已开通');
        }
        setCurrentOrder(null);
        router.push('/membership');
      }
    } catch (error) {
      console.error('Simulate pay error:', error);
    }
  };

  // 生成授权二维码
  const handleGenerateAuthQRCode = async () => {
    setLoading(true);
    try {
      /**
       * 服务端文件：server/src/routes/pay.ts
       * 接口：POST /api/v1/pay/auth/qrcode
       * Body 参数：userId: string, authType: 'alipay'|'wechat', deductAmount: number, deductCycle: 'monthly'|'daily'
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/auth/qrcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          authType: payType,
          deductAmount: parseInt(deductAmount, 10),
          deductCycle,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (Platform.OS === 'web') {
          alert('代扣授权已开通');
          loadAuths();
        } else {
          Alert.alert('授权成功', '代扣授权已开通', [
            { text: '好的', onPress: loadAuths },
          ]);
        }
      } else {
        if (Platform.OS === 'web') {
          alert(result.error || '无法生成授权二维码');
        } else {
          Alert.alert('授权失败', result.error || '无法生成授权二维码');
        }
      }
    } catch (error) {
      console.error('Generate auth QR code error:', error);
      if (Platform.OS === 'web') {
        alert('网络错误，请重试');
      } else {
        Alert.alert('授权失败', '网络错误，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 取消授权
  const handleCancelAuth = async (authId: string) => {
    const doCancel = async () => {
      try {
        /**
         * 服务端文件：server/src/routes/pay.ts
         * 接口：POST /api/v1/pay/auth/cancel/:authId
         */
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/auth/cancel/${authId}`,
          { method: 'POST' }
        );
        const result = await response.json();
        
        if (result.success) {
          if (Platform.OS === 'web') {
            alert('代扣授权已取消');
          } else {
            Alert.alert('取消成功', '代扣授权已取消');
          }
          loadAuths();
        }
      } catch (error) {
        console.error('Cancel auth error:', error);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('确定要取消代扣授权吗？')) {
        doCancel();
      }
    } else {
      Alert.alert('取消授权', '确定要取消代扣授权吗？', [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: doCancel },
      ]);
    }
  };

  // 执行扣费
  const handleDeduct = async (authId: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/pay.ts
       * 接口：POST /api/v1/pay/deduct
       * Body 参数：authId: string, amount?: number
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/deduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (Platform.OS === 'web') {
          alert(`扣费成功，已扣费 ¥${(result.data.amount / 100).toFixed(2)}`);
        } else {
          Alert.alert('扣费成功', `已扣费 ¥${(result.data.amount / 100).toFixed(2)}`);
        }
        loadRecords();
      } else {
        if (Platform.OS === 'web') {
          alert(result.data?.errorMessage || '未知错误');
        } else {
          Alert.alert('扣费失败', result.data?.errorMessage || '未知错误');
        }
      }
    } catch (error) {
      console.error('Deduct error:', error);
      if (Platform.OS === 'web') {
        alert('网络错误');
      } else {
        Alert.alert('扣费失败', '网络错误');
      }
    }
  };

  // 重试扣费
  const handleRetry = async (recordId: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/pay.ts
       * 接口：POST /api/v1/pay/retry/:recordId
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/pay/retry/${recordId}`,
        { method: 'POST' }
      );
      const result = await response.json();
      
      if (result.success) {
        if (Platform.OS === 'web') {
          alert('扣费成功');
        } else {
          Alert.alert('重试成功', '扣费成功');
        }
        loadRecords();
      } else {
        if (Platform.OS === 'web') {
          alert(result.message || '请稍后再试');
        } else {
          Alert.alert('重试失败', result.message || '请稍后再试');
        }
      }
    } catch (error) {
      console.error('Retry error:', error);
    }
  };

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;

  // 生成二维码图片URL
  const getQRCodeUrl = () => {
    if (!currentOrder) return null;
    // 使用第三方API生成二维码图片
    const qrContent = `G_OPEN_PAY:${currentOrder.order_no}:${currentOrder.amount}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrContent)}`;
  };

  const renderQRCodeTab = () => (
    <View style={styles.section}>
      <View style={styles.inputContainer}>
        <ThemedText variant="labelSmall" color={theme.textSecondary}>支付方式</ThemedText>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, payType === 'alipay' && styles.tabActive]}
            onPress={() => setPayType('alipay')}
          >
            <FontAwesome6
              name="wallet"
              size={14}
              color={payType === 'alipay' ? theme.backgroundRoot : theme.textMuted}
            />
            <ThemedText
              variant="small"
              color={payType === 'alipay' ? theme.backgroundRoot : theme.textMuted}
            >
              支付宝
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, payType === 'wechat' && styles.tabActive]}
            onPress={() => setPayType('wechat')}
          >
            <FontAwesome6
              name="message"
              size={14}
              color={payType === 'wechat' ? theme.backgroundRoot : theme.textMuted}
            />
            <ThemedText
              variant="small"
              color={payType === 'wechat' ? theme.backgroundRoot : theme.textMuted}
            >
              微信
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <ThemedText variant="labelSmall" color={theme.textSecondary}>金额（分）</ThemedText>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="输入金额（分）"
          placeholderTextColor={theme.textMuted}
        />
        <ThemedText variant="caption" color={theme.textMuted}>
          = ¥{(parseInt(amount) / 100).toFixed(2)}
        </ThemedText>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.primary }]}
        onPress={handleGenerateQRCode}
        disabled={loading}
      >
        <FontAwesome6 name="qrcode" size={16} color={theme.backgroundRoot} />
        <ThemedText variant="labelSmall" color={theme.backgroundRoot}>
          {loading ? '生成中...' : '生成支付二维码'}
        </ThemedText>
      </TouchableOpacity>

      {currentOrder && (
        <View style={styles.qrCard}>
          {/* 二维码图片 */}
          <View style={styles.qrContainer}>
            <Image
              source={{ uri: getQRCodeUrl() || '' }}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />
          </View>
          
          <ThemedText variant="h2" color={theme.primary}>
            {formatAmount(currentOrder.amount)}
          </ThemedText>
          
          <ThemedText variant="small" color={theme.textSecondary}>
            {getProductName()}
          </ThemedText>
          
          <ThemedText variant="caption" color={theme.textMuted}>
            订单号：{currentOrder.order_no}
          </ThemedText>
          
          <View style={styles.statusContainer}>
            <FontAwesome6
              name="clock"
              size={14}
              color={countdown > 60 ? theme.textMuted : theme.error}
            />
            <ThemedText
              variant="small"
              color={countdown > 60 ? theme.textMuted : theme.error}
            >
              剩余 {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </ThemedText>
          </View>
          
          {/* 模拟支付按钮（测试环境） */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accent, marginTop: Spacing.md }]}
            onPress={handleSimulatePay}
          >
            <FontAwesome6 name="check" size={14} color={theme.backgroundRoot} />
            <ThemedText variant="labelSmall" color={theme.backgroundRoot}>
              模拟支付成功（测试）
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderAuthTab = () => (
    <View style={styles.section}>
      <View style={styles.inputRow}>
        <View style={styles.inputHalf}>
          <ThemedText variant="labelSmall" color={theme.textSecondary}>扣费金额（分）</ThemedText>
          <TextInput
            style={styles.input}
            value={deductAmount}
            onChangeText={setDeductAmount}
            keyboardType="number-pad"
            placeholder="2900"
            placeholderTextColor={theme.textMuted}
          />
        </View>
        <View style={styles.inputHalf}>
          <ThemedText variant="labelSmall" color={theme.textSecondary}>扣费周期</ThemedText>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, deductCycle === 'monthly' && styles.tabActive]}
              onPress={() => setDeductCycle('monthly')}
            >
              <ThemedText
                variant="caption"
                color={deductCycle === 'monthly' ? theme.backgroundRoot : theme.textMuted}
              >
                按月
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, deductCycle === 'daily' && styles.tabActive]}
              onPress={() => setDeductCycle('daily')}
            >
              <ThemedText
                variant="caption"
                color={deductCycle === 'daily' ? theme.backgroundRoot : theme.textMuted}
              >
                按天
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: theme.primary }]}
        onPress={handleGenerateAuthQRCode}
        disabled={loading}
      >
        <FontAwesome6 name="link" size={16} color={theme.backgroundRoot} />
        <ThemedText variant="labelSmall" color={theme.backgroundRoot}>
          生成授权二维码
        </ThemedText>
      </TouchableOpacity>

      {auths.length > 0 ? (
        auths.map(auth => (
          <View key={auth.id} style={styles.authCard}>
            <View style={styles.authHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                {auth.auth_type === 'alipay' ? '支付宝' : '微信'}代扣
              </ThemedText>
              <View
                style={[
                  styles.authBadge,
                  auth.status === 'active' ? styles.authBadgeActive : styles.authBadgeCancelled,
                ]}
              >
                <ThemedText
                  variant="caption"
                  color={auth.status === 'active' ? theme.success : theme.error}
                >
                  {auth.status === 'active' ? '生效中' : '已取消'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.authInfo}>
              <View style={styles.authInfoRow}>
                <ThemedText variant="caption" color={theme.textMuted}>扣费金额</ThemedText>
                <ThemedText variant="caption" color={theme.textPrimary}>
                  {formatAmount(auth.deduct_amount)}
                </ThemedText>
              </View>
              <View style={styles.authInfoRow}>
                <ThemedText variant="caption" color={theme.textMuted}>扣费周期</ThemedText>
                <ThemedText variant="caption" color={theme.textPrimary}>
                  {auth.deduct_cycle === 'monthly' ? '每月' : '每日'}
                </ThemedText>
              </View>
              <View style={styles.authInfoRow}>
                <ThemedText variant="caption" color={theme.textMuted}>下次扣费</ThemedText>
                <ThemedText variant="caption" color={theme.textPrimary}>
                  {new Date(auth.next_deduct_time).toLocaleDateString()}
                </ThemedText>
              </View>
            </View>

            {auth.status === 'active' && (
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1, backgroundColor: theme.accent }]}
                  onPress={() => handleDeduct(auth.id)}
                >
                  <FontAwesome6 name="bolt" size={12} color={theme.backgroundRoot} />
                  <ThemedText variant="caption" color={theme.backgroundRoot}>手动扣费</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1, backgroundColor: theme.error }]}
                  onPress={() => handleCancelAuth(auth.id)}
                >
                  <FontAwesome6 name="xmark" size={12} color={theme.backgroundRoot} />
                  <ThemedText variant="caption" color={theme.backgroundRoot}>取消授权</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <FontAwesome6 name="link-slash" size={28} color={theme.textMuted} />
          </View>
          <ThemedText variant="small" color={theme.textMuted}>暂无代扣授权</ThemedText>
        </View>
      )}
    </View>
  );

  const renderRecordsTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="label" color={theme.textPrimary}>扣费记录</ThemedText>
        <TouchableOpacity onPress={loadRecords}>
          <FontAwesome6 name="rotate" size={14} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {records.length > 0 ? (
        <View style={styles.recordList}>
          {records.map(record => (
            <View key={record.id} style={styles.recordCard}>
              <View
                style={[
                  styles.recordIcon,
                  record.status === 'success' && styles.recordSuccess,
                  record.status === 'failed' && styles.recordFailed,
                  record.status === 'pending' && styles.recordPending,
                ]}
              >
                <FontAwesome6
                  name={
                    record.status === 'success' ? 'check' :
                    record.status === 'failed' ? 'xmark' : 'clock'
                  }
                  size={16}
                  color={
                    record.status === 'success' ? theme.success :
                    record.status === 'failed' ? theme.error : theme.primary
                  }
                />
              </View>
              
              <View style={styles.recordInfo}>
                <ThemedText variant="small" color={theme.textPrimary}>
                  {formatAmount(record.amount)}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {new Date(record.created_at).toLocaleString()}
                </ThemedText>
              </View>
              
              {record.status === 'failed' && (
                <TouchableOpacity onPress={() => handleRetry(record.id)}>
                  <FontAwesome6 name="rotate-right" size={16} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <FontAwesome6 name="receipt" size={28} color={theme.textMuted} />
          </View>
          <ThemedText variant="small" color={theme.textMuted}>暂无扣费记录</ThemedText>
        </View>
      )}
    </View>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: Spacing.md }}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary}>
            支付中心
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>
            二维码支付 · 代扣授权 · 扣费记录
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'qrcode' && styles.tabActive]}
            onPress={() => setActiveTab('qrcode')}
          >
            <FontAwesome6
              name="qrcode"
              size={12}
              color={activeTab === 'qrcode' ? theme.backgroundRoot : theme.textMuted}
            />
            <ThemedText
              variant="caption"
              color={activeTab === 'qrcode' ? theme.backgroundRoot : theme.textMuted}
            >
              支付
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'auth' && styles.tabActive]}
            onPress={() => setActiveTab('auth')}
          >
            <FontAwesome6
              name="link"
              size={12}
              color={activeTab === 'auth' ? theme.backgroundRoot : theme.textMuted}
            />
            <ThemedText
              variant="caption"
              color={activeTab === 'auth' ? theme.backgroundRoot : theme.textMuted}
            >
              代扣
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'records' && styles.tabActive]}
            onPress={() => setActiveTab('records')}
          >
            <FontAwesome6
              name="receipt"
              size={12}
              color={activeTab === 'records' ? theme.backgroundRoot : theme.textMuted}
            />
            <ThemedText
              variant="caption"
              color={activeTab === 'records' ? theme.backgroundRoot : theme.textMuted}
            >
              记录
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'qrcode' && renderQRCodeTab()}
        {activeTab === 'auth' && renderAuthTab()}
        {activeTab === 'records' && renderRecordsTab()}
      </ScrollView>
    </Screen>
  );
}
