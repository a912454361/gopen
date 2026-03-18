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
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Bill {
  id: number;
  userId: number;
  type: 'recharge' | 'consume';
  amount: number;
  status: 'success' | 'pending' | 'failed';
  paymentMethod?: string;
  description?: string;
  transactionId?: string;
  createdAt: string;
}

interface BillSummary {
  totalSpent: number;
  totalRecharged: number;
  pendingAmount: number;
}

export default function BillScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceType: 'personal',
    title: '',
    taxNumber: '',
    email: '',
    address: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('请先登录', '您需要登录后才能查看账单');
        return;
      }

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bill/${userId}`
      );
      const result = await response.json();

      if (result.success) {
        setBills(result.data.bills);
        setSummary(result.data.summary);
      }
    } catch (error) {
      console.error('Fetch bills error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleApplyInvoice = (bill: Bill) => {
    setSelectedBill(bill);
    setInvoiceForm({
      invoiceType: 'personal',
      title: '',
      taxNumber: '',
      email: '',
      address: '',
      phone: '',
    });
    setInvoiceModal(true);
  };

  const handleSubmitInvoice = async () => {
    if (!selectedBill) return;

    if (!invoiceForm.title || !invoiceForm.email) {
      Alert.alert('提示', '请填写发票抬头和邮箱');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/bill/invoice`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            billId: selectedBill.id,
            ...invoiceForm,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert('提交成功', '发票申请已提交，将在1-3个工作日内发送至您的邮箱');
        setInvoiceModal(false);
      } else {
        Alert.alert('提交失败', result.message);
      }
    } catch (error) {
      console.error('Submit invoice error:', error);
      Alert.alert('提交失败', '网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return theme.success;
      case 'pending':
        return '#D97706';
      case 'failed':
        return theme.error;
      default:
        return theme.textMuted;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
        return styles.statusSuccess;
      case 'pending':
        return styles.statusPending;
      case 'failed':
        return styles.statusFailed;
      default:
        return {};
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'pending':
        return '处理中';
      case 'failed':
        return '失败';
      default:
        return status;
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
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
            账单明细
          </ThemedText>
        </ThemedView>

        {summary && (
          <View style={styles.summaryCard}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.summaryTitle}>
              本月消费
            </ThemedText>
            <ThemedText variant="h2" color={theme.textPrimary} style={styles.summaryAmount}>
              ¥{formatAmount(summary.totalSpent)}
            </ThemedText>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.summaryLabel}>
                  本月充值
                </ThemedText>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.summaryValue}>
                  ¥{formatAmount(summary.totalRecharged)}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.summaryLabel}>
                  待处理
                </ThemedText>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.summaryValue}>
                  ¥{formatAmount(summary.pendingAmount)}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
              交易记录
            </ThemedText>
          </View>

          {bills.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome6 name="receipt" size={48} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textMuted} style={styles.emptyText}>
                暂无交易记录
              </ThemedText>
            </View>
          ) : (
            bills.map((bill) => (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billHeader}>
                  <View>
                    <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.billTitle}>
                      {bill.type === 'recharge' ? '充值' : '消费'} - {bill.paymentMethod || '会员服务'}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textSecondary} style={styles.billDetail}>
                      {bill.description || '会员订阅'}
                    </ThemedText>
                  </View>
                  <View style={[styles.billStatus, getStatusStyle(bill.status)]}>
                    <Text style={[styles.billStatusText, { color: getStatusColor(bill.status) }]}>
                      {getStatusText(bill.status)}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText variant="h4" color={theme.textPrimary} style={styles.billAmount}>
                    {bill.type === 'recharge' ? '+' : '-'}¥{formatAmount(bill.amount)}
                  </ThemedText>
                </View>

                <View style={styles.billFooter}>
                  <ThemedText variant="caption" color={theme.textMuted} style={styles.billTime}>
                    {new Date(bill.createdAt).toLocaleString()}
                  </ThemedText>
                  {bill.type === 'recharge' && bill.status === 'success' && (
                    <TouchableOpacity
                      style={styles.invoiceButton}
                      onPress={() => handleApplyInvoice(bill)}
                    >
                      <FontAwesome6 name="file-invoice" size={14} color={theme.primary} />
                      <ThemedText variant="caption" color={theme.primary} style={styles.invoiceButtonText}>
                        申请发票
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 发票申请弹窗 */}
      <Modal
        visible={invoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setInvoiceModal(false)}
      >
        <View style={styles.invoiceModal}>
          <View style={[styles.invoiceContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.invoiceHeader}>
              <ThemedText variant="h4" color={theme.textPrimary} style={styles.invoiceTitle}>
                申请发票
              </ThemedText>
              <TouchableOpacity style={styles.closeButton} onPress={() => setInvoiceModal(false)}>
                <FontAwesome6 name="xmark" size={16} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.invoiceForm}>
              <View style={styles.inputGroup}>
                <ThemedText variant="small" color={theme.textSecondary} style={styles.inputLabel}>
                  发票类型
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {['personal', 'company'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: invoiceForm.invoiceType === type ? theme.primary : theme.border,
                        backgroundColor: invoiceForm.invoiceType === type ? theme.primary : 'transparent',
                      }}
                      onPress={() => setInvoiceForm({ ...invoiceForm, invoiceType: type as 'personal' | 'company' })}
                    >
                      <Text style={{
                        textAlign: 'center',
                        color: invoiceForm.invoiceType === type ? theme.buttonPrimaryText : theme.textPrimary,
                      }}>
                        {type === 'personal' ? '个人' : '企业'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText variant="small" color={theme.textSecondary} style={styles.inputLabel}>
                  发票抬头 *
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="请输入发票抬头"
                  placeholderTextColor={theme.textMuted}
                  value={invoiceForm.title}
                  onChangeText={(text) => setInvoiceForm({ ...invoiceForm, title: text })}
                />
              </View>

              {invoiceForm.invoiceType === 'company' && (
                <View style={styles.inputGroup}>
                  <ThemedText variant="small" color={theme.textSecondary} style={styles.inputLabel}>
                    税号 *
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入企业税号"
                    placeholderTextColor={theme.textMuted}
                    value={invoiceForm.taxNumber}
                    onChangeText={(text) => setInvoiceForm({ ...invoiceForm, taxNumber: text })}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <ThemedText variant="small" color={theme.textSecondary} style={styles.inputLabel}>
                  接收邮箱 *
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="请输入邮箱地址"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  value={invoiceForm.email}
                  onChangeText={(text) => setInvoiceForm({ ...invoiceForm, email: text })}
                />
              </View>

              {invoiceForm.invoiceType === 'company' && (
                <>
                  <View style={styles.inputGroup}>
                    <ThemedText variant="small" color={theme.textSecondary} style={styles.inputLabel}>
                      注册地址
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入注册地址（选填）"
                      placeholderTextColor={theme.textMuted}
                      value={invoiceForm.address}
                      onChangeText={(text) => setInvoiceForm({ ...invoiceForm, address: text })}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText variant="small" color={theme.textSecondary} style={styles.inputLabel}>
                      注册电话
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入注册电话（选填）"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="phone-pad"
                      value={invoiceForm.phone}
                      onChangeText={(text) => setInvoiceForm({ ...invoiceForm, phone: text })}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitInvoice}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                ) : (
                  <ThemedText variant="smallMedium" color={theme.buttonPrimaryText} style={styles.submitButtonText}>
                    提交申请
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
