/**
 * 厂商后台 - 服务管理
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type ServiceStatus = 'draft' | 'pending' | 'active' | 'suspended' | 'offline' | 'rejected';
type ServiceType = 'llm' | 'image' | 'video' | 'audio' | 'embedding';

interface VendorService {
  id: string;
  service_code: string;
  service_name: string;
  service_type: ServiceType;
  description: string;
  status: ServiceStatus;
  input_price: number;
  output_price: number;
  final_input_price?: number;
  final_output_price?: number;
  platform_markup?: number;
  total_calls: number;
  total_revenue: number;
  health_status: string;
  created_at: string;
}

interface ServiceFormData {
  serviceCode: string;
  serviceName: string;
  serviceType: ServiceType;
  description: string;
  apiEndpoint: string;
  apiKey: string;
  inputPrice: string;
  outputPrice: string;
}

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  llm: '大语言模型',
  image: '图像生成',
  video: '视频生成',
  audio: '音频处理',
  embedding: '向量嵌入',
};

const STATUS_LABELS: Record<ServiceStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#9CA3AF' },
  pending: { label: '待审核', color: '#F59E0B' },
  active: { label: '已上架', color: '#10B981' },
  suspended: { label: '已暂停', color: '#EF4444' },
  offline: { label: '已下架', color: '#6B7280' },
  rejected: { label: '已拒绝', color: '#EF4444' },
};

export default function VendorDashboardScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ userId?: string }>();
  const userId = params.userId || '';

  const [loading, setLoading] = useState(true);
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [services, setServices] = useState<VendorService[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'revenue' | 'settings'>('services');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 新服务表单
  const [formData, setFormData] = useState<ServiceFormData>({
    serviceCode: '',
    serviceName: '',
    serviceType: 'llm',
    description: '',
    apiEndpoint: '',
    apiKey: '',
    inputPrice: '',
    outputPrice: '',
  });

  // 加载厂商信息和服务
  useEffect(() => {
    if (userId) {
      loadVendorData();
    }
  }, [userId]);

  const loadVendorData = async () => {
    setLoading(true);
    try {
      // 获取厂商信息
      const profileRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/profile?userId=${userId}`
      );
      const profileData = await profileRes.json();
      
      if (profileData.success) {
        setVendorInfo(profileData.data);
      }

      // 获取服务列表
      const servicesRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/services?userId=${userId}`
      );
      const servicesData = await servicesRes.json();
      
      if (servicesData.success) {
        setServices(servicesData.data);
      }
    } catch (error) {
      console.error('Load vendor data error:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建服务
  const handleCreateService = async () => {
    if (!formData.serviceCode || !formData.serviceName || !formData.apiEndpoint || !formData.apiKey) {
      Alert.alert('错误', '请填写必填字段');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendorInfo.id,
          serviceCode: formData.serviceCode,
          serviceName: formData.serviceName,
          serviceType: formData.serviceType,
          description: formData.description,
          apiEndpoint: formData.apiEndpoint,
          apiKey: formData.apiKey,
          inputPrice: Math.floor(parseFloat(formData.inputPrice || '0') * 100), // 转为分
          outputPrice: Math.floor(parseFloat(formData.outputPrice || '0') * 100),
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        Alert.alert('成功', '服务创建成功');
        setShowCreateModal(false);
        setFormData({
          serviceCode: '',
          serviceName: '',
          serviceType: 'llm',
          description: '',
          apiEndpoint: '',
          apiKey: '',
          inputPrice: '',
          outputPrice: '',
        });
        loadVendorData();
      } else {
        Alert.alert('错误', data.error || '创建失败');
      }
    } catch (error) {
      console.error('Create service error:', error);
      Alert.alert('错误', '创建服务失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 提交审核
  const handleSubmitReview = async (serviceId: string) => {
    Alert.alert(
      '提交审核',
      '确定要提交此服务进行审核吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '提交',
          onPress: async () => {
            try {
              const res = await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/services/${serviceId}/submit`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId }),
                }
              );
              const data = await res.json();
              if (data.success) {
                Alert.alert('成功', '已提交审核');
                loadVendorData();
              } else {
                Alert.alert('错误', data.error);
              }
            } catch (error) {
              Alert.alert('错误', '提交失败');
            }
          },
        },
      ]
    );
  };

  // 下架服务
  const handleOffline = async (serviceId: string) => {
    Alert.alert(
      '下架服务',
      '确定要下架此服务吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '下架',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/services/${serviceId}/offline`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId }),
                }
              );
              const data = await res.json();
              if (data.success) {
                Alert.alert('成功', '服务已下架');
                loadVendorData();
              } else {
                Alert.alert('错误', data.error);
              }
            } catch (error) {
              Alert.alert('错误', '下架失败');
            }
          },
        },
      ]
    );
  };

  // 渲染服务卡片
  const renderServiceCard = (service: VendorService) => {
    const statusInfo = STATUS_LABELS[service.status];
    
    return (
      <View key={service.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.typeBadge, { backgroundColor: theme.primary + '20' }]}>
              <ThemedText style={styles.typeBadgeText}>
                {SERVICE_TYPE_LABELS[service.service_type]}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
              <ThemedText style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText variant="h4" style={styles.serviceName}>
            {service.service_name}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            {service.service_code}
          </ThemedText>
        </View>

        <View style={styles.cardBody}>
          {service.description && (
            <ThemedText variant="small" color={theme.textSecondary} style={styles.description}>
              {service.description}
            </ThemedText>
          )}

          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <ThemedText variant="caption" color={theme.textMuted}>输入价格</ThemedText>
              <ThemedText variant="smallMedium">
                ¥{(service.input_price / 100).toFixed(4)}/千token
              </ThemedText>
            </View>
            <View style={styles.priceItem}>
              <ThemedText variant="caption" color={theme.textMuted}>输出价格</ThemedText>
              <ThemedText variant="smallMedium">
                ¥{(service.output_price / 100).toFixed(4)}/千token
              </ThemedText>
            </View>
            {service.final_input_price && (
              <View style={styles.priceItem}>
                <ThemedText variant="caption" color={theme.textMuted}>最终售价</ThemedText>
                <ThemedText variant="smallMedium" color={theme.primary}>
                  ¥{(service.final_input_price / 100).toFixed(4)}/千token
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <FontAwesome6 name="chart-line" size={14} color={theme.textMuted} />
              <ThemedText variant="caption" color={theme.textMuted}>
                {service.total_calls.toLocaleString()} 次调用
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="coins" size={14} color={theme.textMuted} />
              <ThemedText variant="caption" color={theme.textMuted}>
                ¥{(service.total_revenue / 100).toFixed(2)} 收入
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 
                name={service.health_status === 'healthy' ? 'check-circle' : 'exclamation-circle'} 
                size={14} 
                color={service.health_status === 'healthy' ? theme.success : theme.error} 
              />
              <ThemedText variant="caption" color={theme.textMuted}>
                {service.health_status === 'healthy' ? '健康' : '异常'}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {service.status === 'draft' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => handleSubmitReview(service.id)}
            >
              <ThemedText style={styles.actionButtonText}>提交审核</ThemedText>
            </TouchableOpacity>
          )}
          {service.status === 'active' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.error }]}
              onPress={() => handleOffline(service.id)}
            >
              <ThemedText style={styles.actionButtonText}>下架</ThemedText>
            </TouchableOpacity>
          )}
          {service.status === 'rejected' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.textSecondary }]}
              onPress={() => handleSubmitReview(service.id)}
            >
              <ThemedText style={styles.actionButtonText}>重新提交</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h2">厂商后台</ThemedText>
          {vendorInfo && (
            <ThemedText variant="caption" color={theme.textMuted}>
              {vendorInfo.company_name}
            </ThemedText>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {(['services', 'revenue', 'settings'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { borderBottomColor: theme.primary }]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText
                variant="smallMedium"
                color={activeTab === tab ? theme.primary : theme.textMuted}
              >
                {tab === 'services' ? '服务管理' : tab === 'revenue' ? '收入统计' : '账户设置'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {activeTab === 'services' && (
          <View style={styles.content}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <FontAwesome6 name="plus" size={16} color={theme.buttonPrimaryText} />
              <ThemedText style={styles.addButtonText}>添加服务</ThemedText>
            </TouchableOpacity>

            {services.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome6 name="box-open" size={48} color={theme.textMuted} />
                <ThemedText variant="small" color={theme.textMuted}>
                  暂无服务，点击上方按钮添加
                </ThemedText>
              </View>
            ) : (
              services.map(renderServiceCard)
            )}
          </View>
        )}

        {activeTab === 'revenue' && (
          <View style={styles.content}>
            <View style={styles.card}>
              <ThemedText variant="h4">收入概览</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                统计功能开发中...
              </ThemedText>
            </View>
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.content}>
            <View style={styles.card}>
              <ThemedText variant="h4">账户设置</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                设置功能开发中...
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 创建服务弹窗 */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h4">添加服务</ThemedText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <ThemedText variant="smallMedium">服务代码 *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="如: gpt-4-turbo"
                  placeholderTextColor={theme.textMuted}
                  value={formData.serviceCode}
                  onChangeText={(text) => setFormData({ ...formData, serviceCode: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText variant="smallMedium">服务名称 *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="如: GPT-4 Turbo"
                  placeholderTextColor={theme.textMuted}
                  value={formData.serviceName}
                  onChangeText={(text) => setFormData({ ...formData, serviceName: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText variant="smallMedium">服务类型 *</ThemedText>
                <View style={styles.typeSelector}>
                  {(['llm', 'image', 'video', 'audio', 'embedding'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        formData.serviceType === type && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
                      ]}
                      onPress={() => setFormData({ ...formData, serviceType: type })}
                    >
                      <ThemedText
                        variant="small"
                        color={formData.serviceType === type ? theme.primary : theme.textSecondary}
                      >
                        {SERVICE_TYPE_LABELS[type]}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText variant="smallMedium">API地址 *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="https://api.example.com/v1/chat"
                  placeholderTextColor={theme.textMuted}
                  value={formData.apiEndpoint}
                  onChangeText={(text) => setFormData({ ...formData, apiEndpoint: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText variant="smallMedium">API密钥 *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="sk-xxx"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry
                  value={formData.apiKey}
                  onChangeText={(text) => setFormData({ ...formData, apiKey: text })}
                />
              </View>

              <View style={styles.priceInputs}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText variant="smallMedium">输入价格 (元/千token)</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                    placeholder="0.01"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="decimal-pad"
                    value={formData.inputPrice}
                    onChangeText={(text) => setFormData({ ...formData, inputPrice: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText variant="smallMedium">输出价格 (元/千token)</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                    placeholder="0.02"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="decimal-pad"
                    value={formData.outputPrice}
                    onChangeText={(text) => setFormData({ ...formData, outputPrice: text })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <ThemedText variant="smallMedium">描述</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="服务描述..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.backgroundTertiary }]}
                onPress={() => setShowCreateModal(false)}
              >
                <ThemedText color={theme.textSecondary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.primary }]}
                onPress={handleCreateService}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                ) : (
                  <ThemedText style={styles.submitButtonText}>创建</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
