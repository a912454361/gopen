/**
 * 厂商注册页面
 */

import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface VendorFormData {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  businessLicense: string;
  description: string;
  website: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
}

export default function VendorRegisterScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ userId?: string }>();
  const userId = params.userId || '';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    companyName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    businessLicense: '',
    description: '',
    website: '',
    address: '',
    bankName: '',
    bankAccount: '',
    bankAccountName: '',
  });

  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.companyName || !formData.contactName) {
      Alert.alert('错误', '请填写公司名称和联系人');
      return;
    }

    if (!userId) {
      Alert.alert('错误', '请先登录');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        Alert.alert(
          '提交成功',
          '您的厂商注册申请已提交，请等待管理员审核。',
          [
            {
              text: '确定',
              onPress: () => router.replace('/vendor-dashboard', { userId }),
            },
          ]
        );
      } else {
        Alert.alert('错误', data.error || '注册失败');
      }
    } catch (error) {
      console.error('Vendor register error:', error);
      Alert.alert('错误', '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof VendorFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome6 name="building" size={48} color={theme.primary} />
          <ThemedText variant="h2" style={{ marginTop: Spacing.md }}>
            厂商入驻
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
            加入G open平台，提供您的AI模型服务
          </ThemedText>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <ThemedText variant="h4" style={{ marginBottom: Spacing.lg }}>
            基本信息
          </ThemedText>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">
              公司名称 <ThemedText color={theme.error}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入公司全称"
              placeholderTextColor={theme.textMuted}
              value={formData.companyName}
              onChangeText={(text) => updateField('companyName', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">
              联系人 <ThemedText color={theme.error}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入联系人姓名"
              placeholderTextColor={theme.textMuted}
              value={formData.contactName}
              onChangeText={(text) => updateField('contactName', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">联系电话</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入联系电话"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
              value={formData.contactPhone}
              onChangeText={(text) => updateField('contactPhone', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">联系邮箱</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入联系邮箱"
              placeholderTextColor={theme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.contactEmail}
              onChangeText={(text) => updateField('contactEmail', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">营业执照号</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入营业执照号"
              placeholderTextColor={theme.textMuted}
              value={formData.businessLicense}
              onChangeText={(text) => updateField('businessLicense', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">公司简介</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入公司简介"
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">公司网站</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="https://"
              placeholderTextColor={theme.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              value={formData.website}
              onChangeText={(text) => updateField('website', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">公司地址</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入公司地址"
              placeholderTextColor={theme.textMuted}
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
            />
          </View>
        </View>

        {/* Bank Info */}
        <View style={styles.card}>
          <ThemedText variant="h4" style={{ marginBottom: Spacing.lg }}>
            结算信息（可选）
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: Spacing.md }}>
            用于接收服务收入结算
          </ThemedText>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">开户银行</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="如: 中国银行"
              placeholderTextColor={theme.textMuted}
              value={formData.bankName}
              onChangeText={(text) => updateField('bankName', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">银行账号</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入银行账号"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              value={formData.bankAccount}
              onChangeText={(text) => updateField('bankAccount', text)}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText variant="smallMedium">账户名</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="请输入账户名"
              placeholderTextColor={theme.textMuted}
              value={formData.bankAccountName}
              onChangeText={(text) => updateField('bankAccountName', text)}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
          ) : (
            <>
              <FontAwesome6 name="paper-plane" size={16} color={theme.buttonPrimaryText} />
              <ThemedText style={styles.submitButtonText}>提交申请</ThemedText>
            </>
          )}
        </TouchableOpacity>

        <ThemedText variant="caption" color={theme.textMuted} style={{ textAlign: 'center', marginTop: Spacing.md }}>
          提交后请等待管理员审核，审核通过后即可管理服务
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}
