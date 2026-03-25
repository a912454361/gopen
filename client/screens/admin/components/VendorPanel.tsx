/**
 * 管理后台 - 厂商管理面板
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type TabType = 'pending' | 'approved' | 'services';

interface Vendor {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: string;
  total_services: number;
  active_services: number;
  total_revenue: number;
  created_at: string;
  reject_reason?: string;
}

interface VendorService {
  id: string;
  vendor_id: string;
  service_code: string;
  service_name: string;
  service_type: string;
  status: string;
  input_price: number;
  output_price: number;
  final_input_price?: number;
  platform_markup?: number;
  total_calls: number;
  total_revenue: number;
  vendors?: {
    company_name: string;
    contact_name: string;
  };
}

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.primary,
  },
  card: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
  },
  buttonPrimary: {
    backgroundColor: theme.primary,
  },
  buttonDanger: {
    backgroundColor: theme.error,
  },
  buttonSecondary: {
    backgroundColor: theme.backgroundTertiary,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: Spacing['2xl'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    width: '90%' as const,
    maxWidth: 400,
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top' as const,
    color: theme.textPrimary,
  },
});

interface VendorPanelProps {
  adminKey: string;
}

export function VendorPanel({ adminKey }: VendorPanelProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [services, setServices] = useState<VendorService[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ type: 'vendor' | 'service'; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingTarget, setPricingTarget] = useState<VendorService | null>(null);
  const [platformMarkup, setPlatformMarkup] = useState('30');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        // 加载待审核厂商
        const res = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/vendor/vendors?adminKey=${adminKey}&status=pending`
        );
        const data = await res.json();
        if (data.success) {
          setVendors(data.data);
        }
      } else if (activeTab === 'approved') {
        // 加载已审核厂商
        const res = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/vendor/vendors?adminKey=${adminKey}&status=approved`
        );
        const data = await res.json();
        if (data.success) {
          setVendors(data.data);
        }
      } else if (activeTab === 'services') {
        // 加载待审核服务
        const res = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/vendor/services/pending?adminKey=${adminKey}`
        );
        const data = await res.json();
        if (data.success) {
          setServices(data.data);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 审核厂商
  const handleReviewVendor = async (vendorId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/vendor/vendors/${vendorId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminKey,
            action,
            reason,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        Alert.alert('成功', action === 'approve' ? '厂商已通过审核' : '厂商已拒绝');
        loadData();
      } else {
        Alert.alert('错误', data.error);
      }
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  // 审核服务
  const handleReviewService = async (serviceId: string, action: 'approve' | 'reject', reason?: string, markup?: number) => {
    try {
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/vendor/services/${serviceId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminKey,
            action,
            reason,
            platformMarkup: markup,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        Alert.alert('成功', action === 'approve' ? '服务已上架' : '服务已拒绝');
        setShowPricingModal(false);
        setPricingTarget(null);
        loadData();
      } else {
        Alert.alert('错误', data.error);
      }
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  // 渲染厂商卡片
  const renderVendorCard = (vendor: Vendor) => {
    const statusColors: Record<string, string> = {
      pending: '#F59E0B',
      approved: theme.success || '#10B981',
      rejected: theme.error || '#EF4444',
      suspended: '#6B7280',
    };

    return (
      <View key={vendor.id} style={styles.card}>
        <View style={styles.row}>
          <View>
            <ThemedText variant="h4">{vendor.company_name}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              联系人: {vendor.contact_name}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (statusColors[vendor.status] || '#9CA3AF') + '20' }]}>
            <ThemedText variant="small" style={{ color: statusColors[vendor.status] || '#9CA3AF' }}>
              {vendor.status === 'pending' ? '待审核' : vendor.status === 'approved' ? '已通过' : vendor.status === 'rejected' ? '已拒绝' : '已暂停'}
            </ThemedText>
          </View>
        </View>

        <View style={{ marginTop: Spacing.sm }}>
          {vendor.contact_phone && (
            <ThemedText variant="small" color={theme.textSecondary}>
              电话: {vendor.contact_phone}
            </ThemedText>
          )}
          {vendor.contact_email && (
            <ThemedText variant="small" color={theme.textSecondary}>
              邮箱: {vendor.contact_email}
            </ThemedText>
          )}
          <ThemedText variant="small" color={theme.textSecondary}>
            服务数: {vendor.total_services || 0} | 活跃: {vendor.active_services || 0}
          </ThemedText>
          {vendor.reject_reason && (
            <ThemedText variant="small" color={theme.error}>
              拒绝原因: {vendor.reject_reason}
            </ThemedText>
          )}
        </View>

        {vendor.status === 'pending' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={() => {
                setRejectTarget({ type: 'vendor', id: vendor.id });
                setShowRejectModal(true);
              }}
            >
              <ThemedText style={styles.buttonText}>拒绝</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => handleReviewVendor(vendor.id, 'approve')}
            >
              <ThemedText style={styles.buttonText}>通过</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {vendor.status === 'approved' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={() => {
                Alert.alert(
                  '暂停厂商',
                  '确定要暂停此厂商吗？暂停后其所有服务将下架。',
                  [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '暂停',
                      style: 'destructive',
                      onPress: async () => {
                        const res = await fetch(
                          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/vendor/vendors/${vendor.id}/suspend`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adminKey, reason: '管理员暂停' }),
                          }
                        );
                        const data = await res.json();
                        if (data.success) {
                          Alert.alert('成功', '厂商已暂停');
                          loadData();
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <ThemedText style={styles.buttonText}>暂停</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // 渲染服务卡片
  const renderServiceCard = (service: VendorService) => {
    const statusColors: Record<string, string> = {
      pending: '#F59E0B',
      active: '#10B981',
    };

    return (
      <View key={service.id} style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="h4">{service.service_name}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              {service.service_code} | {service.service_type.toUpperCase()}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (statusColors[service.status] || '#9CA3AF') + '20' }]}>
            <ThemedText variant="small" style={{ color: statusColors[service.status] || '#9CA3AF' }}>
              {service.status === 'pending' ? '待审核' : '已上架'}
            </ThemedText>
          </View>
        </View>

        <View style={{ marginTop: Spacing.sm }}>
          <ThemedText variant="small" color={theme.textSecondary}>
            厂商: {service.vendors?.company_name || '未知'}
          </ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs }}>
            <ThemedText variant="small" color={theme.textMuted}>
              厂商定价: ¥{(service.input_price / 100).toFixed(4)}/¥{(service.output_price / 100).toFixed(4)}
            </ThemedText>
          </View>
        </View>

        {service.status === 'pending' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={() => {
                setRejectTarget({ type: 'service', id: service.id });
                setShowRejectModal(true);
              }}
            >
              <ThemedText style={styles.buttonText}>拒绝</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => {
                setPricingTarget(service);
                setPlatformMarkup('30');
                setShowPricingModal(true);
              }}
            >
              <ThemedText style={styles.buttonText}>通过并定价</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <ThemedText
            variant="smallMedium"
            color={activeTab === 'pending' ? theme.primary : theme.textMuted}
          >
            待审核厂商
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'approved' && styles.tabActive]}
          onPress={() => setActiveTab('approved')}
        >
          <ThemedText
            variant="smallMedium"
            color={activeTab === 'approved' ? theme.primary : theme.textMuted}
          >
            已通过厂商
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.tabActive]}
          onPress={() => setActiveTab('services')}
        >
          <ThemedText
            variant="smallMedium"
            color={activeTab === 'services' ? theme.primary : theme.textMuted}
          >
            待审核服务
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing.xl }} />
      ) : (
        <ScrollView>
          {activeTab === 'services' ? (
            services.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome6 name="circle-check" size={48} color={theme.textMuted} />
                <ThemedText variant="small" color={theme.textMuted}>
                  暂无待审核服务
                </ThemedText>
              </View>
            ) : (
              services.map(renderServiceCard)
            )
          ) : (
            vendors.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome6 name="circle-check" size={48} color={theme.textMuted} />
                <ThemedText variant="small" color={theme.textMuted}>
                  暂无{activeTab === 'pending' ? '待审核' : '已通过'}厂商
                </ThemedText>
              </View>
            ) : (
              vendors.map(renderVendorCard)
            )
          )}
        </ScrollView>
      )}

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h4">拒绝原因</ThemedText>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="请输入拒绝原因..."
              placeholderTextColor={theme.textMuted}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
                onPress={() => setShowRejectModal(false)}
              >
                <ThemedText color={theme.textSecondary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger, { flex: 1 }]}
                onPress={() => {
                  if (rejectTarget?.type === 'vendor') {
                    handleReviewVendor(rejectTarget.id, 'reject', rejectReason);
                  } else if (rejectTarget?.type === 'service') {
                    handleReviewService(rejectTarget.id, 'reject', rejectReason);
                  }
                  setShowRejectModal(false);
                  setRejectReason('');
                  setRejectTarget(null);
                }}
              >
                <ThemedText style={styles.buttonText}>确认拒绝</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pricing Modal */}
      <Modal
        visible={showPricingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPricingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h4">设置平台加价</ThemedText>
              <TouchableOpacity onPress={() => setShowPricingModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {pricingTarget && (
              <View style={{ marginBottom: Spacing.lg }}>
                <ThemedText variant="smallMedium">{pricingTarget.service_name}</ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  厂商定价: ¥{(pricingTarget.input_price / 100).toFixed(4)}/千token (输入)
                </ThemedText>
              </View>
            )}

            <ThemedText variant="smallMedium">平台加价比例 (%)</ThemedText>
            <TextInput
              style={[styles.input, { minHeight: 50 }]}
              placeholder="30"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              value={platformMarkup}
              onChangeText={setPlatformMarkup}
            />
            
            {pricingTarget && (
              <ThemedText variant="caption" color={theme.textMuted}>
                最终售价: ¥{((pricingTarget.input_price * (1 + parseInt(platformMarkup || '0') / 100)) / 100).toFixed(4)}/千token
              </ThemedText>
            )}

            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary, { flex: 1 }]}
                onPress={() => setShowPricingModal(false)}
              >
                <ThemedText color={theme.textSecondary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
                onPress={() => {
                  if (pricingTarget) {
                    handleReviewService(
                      pricingTarget.id,
                      'approve',
                      undefined,
                      parseInt(platformMarkup || '30')
                    );
                  }
                }}
              >
                <ThemedText style={styles.buttonText}>确认上架</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
