/**
 * 支付管理页面 - 管理员专用
 * 功能：
 * 1. 待审核订单处理
 * 2. 收款码管理（刷新/更新）
 * 3. 商家收款开通
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type TabType = 'orders' | 'qrcode' | 'merchant';

interface PendingOrder {
  id: string;
  order_no: string;
  user_id: string;
  amount: number;
  pay_type: string;
  product_type: string;
  status: string;
  transaction_id?: string;
  user_remark?: string;
  confirmed_at: string;
}

interface PaymentAccount {
  name: string;
  account: string;
  qrcodeUrl: string;
  realName: string;
  desc?: string;
}

interface MerchantConfig {
  enabled: boolean;
  type: 'personal' | 'business';
  wechat?: {
    mchId: string;
    apiKey: string;
    certUploaded: boolean;
    status: string;
  };
  alipay?: {
    appId: string;
    privateKeyUploaded: boolean;
    status: string;
  };
}

export default function PaymentAdminScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ key?: string }>();
  const adminKey = params.key || '';

  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  // 收款码管理
  const [paymentAccounts, setPaymentAccounts] = useState<Record<string, PaymentAccount> | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPayType, setEditingPayType] = useState<'alipay' | 'wechat'>('alipay');
  const [editForm, setEditForm] = useState({
    account: '',
    qrcodeUrl: '',
    realName: '',
  });
  const [saving, setSaving] = useState(false);

  // 商家配置
  const [merchantConfig, setMerchantConfig] = useState<MerchantConfig | null>(null);
  const [merchantModalVisible, setMerchantModalVisible] = useState(false);
  const [merchantForm, setMerchantForm] = useState({
    type: 'personal' as 'personal' | 'business',
    wechatMchId: '',
    wechatApiKey: '',
    alipayAppId: '',
  });

  const fetchData = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      // 并行获取订单和收款账户
      const [ordersRes, accountsRes, merchantRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/pending?adminKey=${adminKey}`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/accounts`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/merchant?adminKey=${adminKey}`),
      ]);

      const ordersData = await ordersRes.json();
      const accountsData = await accountsRes.json();
      const merchantData = await merchantRes.json();

      if (ordersData.success) setOrders(ordersData.data || []);
      if (accountsData.success) setPaymentAccounts(accountsData.data);
      if (merchantData.success) setMerchantConfig(merchantData.data);
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 审核订单
  const handleVerify = async (orderNo: string, action: 'approve' | 'reject') => {
    setProcessing(orderNo);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo, adminKey, action }),
      });
      
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', result.message);
        fetchData();
      } else {
        Alert.alert('错误', result.error || '操作失败');
      }
    } catch (error) {
      console.error('Verify order error:', error);
    } finally {
      setProcessing(null);
    }
  };

  // 刷新收款码
  const handleRefreshQRCode = async (payType: 'alipay' | 'wechat') => {
    try {
      Alert.alert('刷新收款码', '确定要从服务器获取最新收款码吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            const response = await fetch(
              `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/qrcode/refresh?adminKey=${adminKey}&payType=${payType}`,
              { method: 'POST' }
            );
            const result = await response.json();
            if (result.success) {
              Alert.alert('成功', '收款码已刷新');
              fetchData();
            } else {
              Alert.alert('错误', result.error || '刷新失败');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Refresh QR code error:', error);
    }
  };

  // 编辑收款码
  const openEditModal = (payType: 'alipay' | 'wechat') => {
    const account = paymentAccounts?.[payType];
    setEditingPayType(payType);
    setEditForm({
      account: account?.account || '',
      qrcodeUrl: account?.qrcodeUrl || '',
      realName: account?.realName || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveQRCode = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          payType: editingPayType,
          account: editForm.account,
          qrcodeUrl: editForm.qrcodeUrl,
          realName: editForm.realName,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', '收款码更新成功');
        setEditModalVisible(false);
        fetchData();
      } else {
        Alert.alert('错误', result.error || '保存失败');
      }
    } catch (error) {
      console.error('Save QR code error:', error);
    } finally {
      setSaving(false);
    }
  };

  // 开通商家收款
  const handleOpenMerchant = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/merchant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify(merchantForm),
      });
      
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', result.message || '商家开通申请已提交');
        setMerchantModalVisible(false);
        fetchData();
      } else {
        Alert.alert('错误', result.error || '开通失败');
      }
    } catch (error) {
      console.error('Open merchant error:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN');
  const getPayTypeName = (type: string) => type === 'alipay' ? '支付宝' : type === 'wechat' ? '微信' : type;
  const getProductTypeName = (type: string) => type === 'super_member' ? '超级会员' : type === 'membership' ? '普通会员' : type;

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'orders', label: '待审核', icon: 'clipboard-list' },
    { key: 'qrcode', label: '收款码', icon: 'qrcode' },
    { key: 'merchant', label: '商家开通', icon: 'store' },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['3xl'] }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: Spacing.sm }}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary} style={{ marginLeft: Spacing.sm }}>
            支付管理
          </ThemedText>
        </View>

        {/* Tab 栏 */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl }}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.xs,
                paddingVertical: Spacing.md,
                backgroundColor: activeTab === tab.key ? theme.primary : theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                borderWidth: 1,
                borderColor: activeTab === tab.key ? theme.primary : theme.border,
              }}
              onPress={() => setActiveTab(tab.key)}
            >
              <FontAwesome6 
                name={tab.icon as any} 
                size={14} 
                color={activeTab === tab.key ? '#fff' : theme.textMuted} 
              />
              <ThemedText 
                variant="smallMedium" 
                color={activeTab === tab.key ? '#fff' : theme.textPrimary}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 内容区域 */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: Spacing['2xl'] }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : activeTab === 'orders' ? (
          // 待审核订单
          orders.length === 0 ? (
            <View style={{ 
              alignItems: 'center', 
              paddingVertical: Spacing['2xl'],
              backgroundColor: theme.backgroundTertiary,
              borderRadius: BorderRadius.lg,
            }}>
              <FontAwesome6 name="circle-check" size={48} color={theme.success} />
              <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                暂无待审核订单
              </ThemedText>
            </View>
          ) : (
            <View style={{ gap: Spacing.lg }}>
              {orders.map(order => (
                <View
                  key={order.id}
                  style={{
                    backgroundColor: theme.backgroundDefault,
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <FontAwesome6 name={order.pay_type === 'alipay' ? 'wallet' : 'message'} size={16} color={order.pay_type === 'alipay' ? '#1677FF' : '#07C160'} />
                      <ThemedText variant="smallMedium" color={theme.textPrimary}>{getPayTypeName(order.pay_type)}</ThemedText>
                    </View>
                    <View style={{ paddingHorizontal: Spacing.sm, paddingVertical: 2, backgroundColor: '#FEF3C7', borderRadius: BorderRadius.sm }}>
                      <ThemedText variant="tiny" color="#D97706">待审核</ThemedText>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                    <ThemedText variant="caption" color={theme.textMuted}>支付金额</ThemedText>
                    <ThemedText variant="h3" color={theme.primary}>{formatAmount(order.amount)}</ThemedText>
                  </View>

                  <View style={{ marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <ThemedText variant="caption" color={theme.textMuted}>产品</ThemedText>
                      <ThemedText variant="small" color={theme.textPrimary}>{getProductTypeName(order.product_type)}</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <ThemedText variant="caption" color={theme.textMuted}>流水号</ThemedText>
                      <ThemedText variant="small" color={theme.textPrimary}>{order.transaction_id || '-'}</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <ThemedText variant="caption" color={theme.textMuted}>时间</ThemedText>
                      <ThemedText variant="small" color={theme.textPrimary}>{formatDate(order.confirmed_at)}</ThemedText>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: theme.success, borderRadius: BorderRadius.md }}
                      onPress={() => handleVerify(order.order_no, 'approve')}
                      disabled={processing === order.id}
                    >
                      {processing === order.id ? <ActivityIndicator size="small" color="#fff" /> : (
                        <>
                          <FontAwesome6 name="check" size={16} color="#fff" />
                          <ThemedText variant="smallMedium" color="#fff">通过</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: theme.error, borderRadius: BorderRadius.md }}
                      onPress={() => handleVerify(order.order_no, 'reject')}
                      disabled={processing === order.id}
                    >
                      <FontAwesome6 name="xmark" size={16} color="#fff" />
                      <ThemedText variant="smallMedium" color="#fff">拒绝</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )
        ) : activeTab === 'qrcode' ? (
          // 收款码管理
          <View style={{ gap: Spacing.lg }}>
            {['alipay', 'wechat'].map(payType => {
              const account = paymentAccounts?.[payType as 'alipay' | 'wechat'];
              const isAlipay = payType === 'alipay';
              return (
                <View
                  key={payType}
                  style={{
                    backgroundColor: theme.backgroundDefault,
                    borderRadius: BorderRadius.xl,
                    padding: Spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: BorderRadius.lg,
                      backgroundColor: isAlipay ? 'rgba(22,119,255,0.1)' : 'rgba(7,193,96,0.1)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <FontAwesome6 name={isAlipay ? 'wallet' : 'message'} size={24} color={isAlipay ? '#1677FF' : '#07C160'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText variant="smallMedium" color={theme.textPrimary}>{account?.name || (isAlipay ? '支付宝收款' : '微信收款')}</ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>{account?.account || '未配置账号'}</ThemedText>
                    </View>
                  </View>

                  {/* 收款码图片 */}
                  <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
                    {account?.qrcodeUrl ? (
                      <Image source={{ uri: account.qrcodeUrl }} style={{ width: 180, height: 180 }} resizeMode="contain" />
                    ) : (
                      <View style={{ width: 180, height: 180, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center' }}>
                        <FontAwesome6 name="qrcode" size={60} color={theme.textMuted} />
                      </View>
                    )}
                  </View>

                  {/* 收款人信息 */}
                  <View style={{ backgroundColor: theme.backgroundTertiary, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.lg }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <ThemedText variant="caption" color={theme.textMuted}>收款人</ThemedText>
                      <ThemedText variant="small" color={theme.textPrimary}>{account?.realName || '-'}</ThemedText>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: theme.primary, borderRadius: BorderRadius.md }}
                      onPress={() => handleRefreshQRCode(payType as 'alipay' | 'wechat')}
                    >
                      <FontAwesome6 name="rotate" size={14} color="#fff" />
                      <ThemedText variant="smallMedium" color="#fff">刷新</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: theme.border }}
                      onPress={() => openEditModal(payType as 'alipay' | 'wechat')}
                    >
                      <FontAwesome6 name="pen" size={14} color={theme.textPrimary} />
                      <ThemedText variant="smallMedium" color={theme.textPrimary}>编辑</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          // 商家开通
          <View style={{ gap: Spacing.lg }}>
            {/* 当前状态 */}
            <View style={{ backgroundColor: theme.backgroundDefault, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: merchantConfig?.enabled ? 'rgba(5,150,105,0.1)' : 'rgba(251,146,60,0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <FontAwesome6 name="store" size={24} color={merchantConfig?.enabled ? theme.success : '#FB923C'} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {merchantConfig?.enabled ? '商家模式已开通' : '个人收款模式'}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {merchantConfig?.enabled ? '支持自动回调确认' : '需手动审核订单'}
                  </ThemedText>
                </View>
                <View style={{
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.xs,
                  backgroundColor: merchantConfig?.enabled ? 'rgba(5,150,105,0.1)' : 'rgba(251,146,60,0.1)',
                  borderRadius: BorderRadius.lg,
                }}>
                  <ThemedText variant="caption" color={merchantConfig?.enabled ? theme.success : '#FB923C'}>
                    {merchantConfig?.type === 'business' ? '企业' : '个人'}
                  </ThemedText>
                </View>
              </View>

              {/* 微信支付状态 */}
              <View style={{ backgroundColor: theme.backgroundTertiary, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <FontAwesome6 name="message" size={16} color="#07C160" />
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>微信支付</ThemedText>
                </View>
                <ThemedText variant="caption" color={merchantConfig?.wechat?.status === 'active' ? theme.success : theme.textMuted}>
                  {merchantConfig?.wechat?.status === 'active' ? `商户号: ${merchantConfig.wechat.mchId}` : '未开通'}
                </ThemedText>
              </View>

              {/* 支付宝状态 */}
              <View style={{ backgroundColor: theme.backgroundTertiary, padding: Spacing.md, borderRadius: BorderRadius.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <FontAwesome6 name="wallet" size={16} color="#1677FF" />
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>支付宝</ThemedText>
                </View>
                <ThemedText variant="caption" color={merchantConfig?.alipay?.status === 'active' ? theme.success : theme.textMuted}>
                  {merchantConfig?.alipay?.status === 'active' ? `AppID: ${merchantConfig.alipay.appId}` : '未开通'}
                </ThemedText>
              </View>
            </View>

            {/* 开通说明 */}
            <View style={{ backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.lg, padding: Spacing.lg }}>
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                商家收款优势
              </ThemedText>
              {[
                { icon: 'bolt', text: '支付自动确认，无需人工审核' },
                { icon: 'shield-halved', text: '支持退款功能' },
                { icon: 'chart-line', text: '详细交易流水统计' },
                { icon: 'bell', text: '支付成功实时通知' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <FontAwesome6 name={item.icon as any} size={14} color={theme.primary} />
                  <ThemedText variant="small" color={theme.textSecondary}>{item.text}</ThemedText>
                </View>
              ))}
            </View>

            {/* 开通按钮 */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg, backgroundColor: theme.primary, borderRadius: BorderRadius.lg }}
              onPress={() => setMerchantModalVisible(true)}
            >
              <FontAwesome6 name="plus" size={18} color="#fff" />
              <ThemedText variant="smallMedium" color="#fff">开通商家收款</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 编辑收款码弹窗 */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.backgroundDefault, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <ThemedText variant="h4" color={theme.textPrimary}>编辑收款码</ThemedText>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: Spacing.lg }}>
              <View>
                <ThemedText variant="caption" color={theme.textMuted}>收款账号</ThemedText>
                <TextInput
                  style={{ backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.xs, color: theme.textPrimary }}
                  value={editForm.account}
                  onChangeText={text => setEditForm({ ...editForm, account: text })}
                  placeholder={editingPayType === 'alipay' ? '支付宝账号/手机号' : '微信号'}
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View>
                <ThemedText variant="caption" color={theme.textMuted}>收款码链接/图片URL</ThemedText>
                <TextInput
                  style={{ backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.xs, color: theme.textPrimary, minHeight: 80 }}
                  value={editForm.qrcodeUrl}
                  onChangeText={text => setEditForm({ ...editForm, qrcodeUrl: text })}
                  placeholder="https://qr.alipay.com/xxx 或 图片URL"
                  placeholderTextColor={theme.textMuted}
                  multiline
                />
                <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: 4 }}>
                  支持支付宝收款码链接、微信收款码图片URL
                </ThemedText>
              </View>

              <View>
                <ThemedText variant="caption" color={theme.textMuted}>收款人姓名</ThemedText>
                <TextInput
                  style={{ backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.xs, color: theme.textPrimary }}
                  value={editForm.realName}
                  onChangeText={text => setEditForm({ ...editForm, realName: text })}
                  placeholder="显示给用户的收款人姓名"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: theme.primary, borderRadius: BorderRadius.lg }}
                onPress={handleSaveQRCode}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText variant="smallMedium" color="#fff">保存</ThemedText>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 开通商家弹窗 */}
      <Modal visible={merchantModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.backgroundDefault, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <ThemedText variant="h4" color={theme.textPrimary}>开通商家收款</ThemedText>
              <TouchableOpacity onPress={() => setMerchantModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ gap: Spacing.lg }}>
                {/* 类型选择 */}
                <View>
                  <ThemedText variant="caption" color={theme.textMuted}>商户类型</ThemedText>
                  <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
                    {['personal', 'business'].map(type => (
                      <TouchableOpacity
                        key={type}
                        style={{
                          flex: 1,
                          padding: Spacing.md,
                          backgroundColor: merchantForm.type === type ? theme.primary : theme.backgroundTertiary,
                          borderRadius: BorderRadius.md,
                          alignItems: 'center',
                        }}
                        onPress={() => setMerchantForm({ ...merchantForm, type: type as 'personal' | 'business' })}
                      >
                        <ThemedText variant="smallMedium" color={merchantForm.type === type ? '#fff' : theme.textPrimary}>
                          {type === 'personal' ? '个人' : '企业'}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* 微信支付 */}
                <View style={{ backgroundColor: theme.backgroundTertiary, padding: Spacing.md, borderRadius: BorderRadius.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
                    <FontAwesome6 name="message" size={18} color="#07C160" />
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>微信支付</ThemedText>
                  </View>
                  <View style={{ gap: Spacing.sm }}>
                    <TextInput
                      style={{ backgroundColor: theme.backgroundDefault, borderRadius: BorderRadius.md, padding: Spacing.md, color: theme.textPrimary }}
                      value={merchantForm.wechatMchId}
                      onChangeText={text => setMerchantForm({ ...merchantForm, wechatMchId: text })}
                      placeholder="商户号 MchId"
                      placeholderTextColor={theme.textMuted}
                    />
                    <TextInput
                      style={{ backgroundColor: theme.backgroundDefault, borderRadius: BorderRadius.md, padding: Spacing.md, color: theme.textPrimary }}
                      value={merchantForm.wechatApiKey}
                      onChangeText={text => setMerchantForm({ ...merchantForm, wechatApiKey: text })}
                      placeholder="API密钥"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* 支付宝 */}
                <View style={{ backgroundColor: theme.backgroundTertiary, padding: Spacing.md, borderRadius: BorderRadius.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
                    <FontAwesome6 name="wallet" size={18} color="#1677FF" />
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>支付宝</ThemedText>
                  </View>
                  <TextInput
                    style={{ backgroundColor: theme.backgroundDefault, borderRadius: BorderRadius.md, padding: Spacing.md, color: theme.textPrimary }}
                    value={merchantForm.alipayAppId}
                    onChangeText={text => setMerchantForm({ ...merchantForm, alipayAppId: text })}
                    placeholder="应用 AppID"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: theme.primary, borderRadius: BorderRadius.lg }}
                  onPress={handleOpenMerchant}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <ThemedText variant="smallMedium" color="#fff">提交开通申请</ThemedText>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
