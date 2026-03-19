/**
 * 系统配置面板
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface ConfigPanelProps {
  adminKey: string;
}

export function ConfigPanel({ adminKey }: ConfigPanelProps) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'qrcode' | 'merchant' | 'system'>('qrcode');
  
  // 收款码配置
  const [alipayQR, setAlipayQR] = useState('');
  const [alipayAccount, setAlipayAccount] = useState('');
  const [wechatQR, setWechatQR] = useState('');
  const [wechatAccount, setWechatAccount] = useState('');
  
  // 商家配置
  const [merchantConfig, setMerchantConfig] = useState<any>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      // 获取收款码配置
      const accountsRes = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/accounts`);
      const accountsData = await accountsRes.json();
      if (accountsData.success) {
        setAlipayQR(accountsData.data.alipay?.qrcodeUrl || '');
        setAlipayAccount(accountsData.data.alipay?.account || '');
        setWechatQR(accountsData.data.wechat?.qrcodeUrl || '');
        setWechatAccount(accountsData.data.wechat?.account || '');
      }
      
      // 获取商家配置
      const merchantRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/merchant?adminKey=${adminKey}`
      );
      const merchantData = await merchantRes.json();
      if (merchantData.success) {
        setMerchantConfig(merchantData.data);
      }
    } catch (error) {
      console.error('Fetch config error:', error);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveQRCode = async (payType: 'alipay' | 'wechat') => {
    setSaving(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/admin/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          payType,
          account: payType === 'alipay' ? alipayAccount : wechatAccount,
          qrcodeUrl: payType === 'alipay' ? alipayQR : wechatQR,
        }),
      });
      
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', '配置已保存');
        fetchConfig();
      } else {
        Alert.alert('错误', result.error || '保存失败');
      }
    } catch (error) {
      console.error('Save config error:', error);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { key: 'qrcode' as const, label: '收款码配置', icon: 'qrcode' },
    { key: 'merchant' as const, label: '商家配置', icon: 'store' },
    { key: 'system' as const, label: '系统设置', icon: 'gear' },
  ];

  if (loading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'] }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.xl }}>
      {/* 区块选择 */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {sections.map(section => (
          <TouchableOpacity
            key={section.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              paddingVertical: Spacing.md,
              paddingHorizontal: Spacing.lg,
              backgroundColor: activeSection === section.key ? theme.primary : theme.backgroundTertiary,
              borderRadius: BorderRadius.lg,
            }}
            onPress={() => setActiveSection(section.key)}
          >
            <FontAwesome6 name={section.icon as any} size={14} color={activeSection === section.key ? '#fff' : theme.textPrimary} />
            <ThemedText variant="small" color={activeSection === section.key ? '#fff' : theme.textPrimary}>
              {section.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* 收款码配置 */}
      {activeSection === 'qrcode' && (
        <View style={{ gap: Spacing.xl }}>
          {/* 支付宝 */}
          <View style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.xl,
            padding: Spacing.lg,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
              <FontAwesome6 name="wallet" size={24} color="#1677FF" />
              <ThemedText variant="smallMedium" color={theme.textPrimary}>支付宝收款码</ThemedText>
            </View>

            <View style={{ gap: Spacing.md }}>
              <View>
                <ThemedText variant="caption" color={theme.textMuted}>收款账号</ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.md,
                    padding: Spacing.md,
                    marginTop: Spacing.xs,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  value={alipayAccount}
                  onChangeText={setAlipayAccount}
                  placeholder="支付宝账号/手机号"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View>
                <ThemedText variant="caption" color={theme.textMuted}>收款码URL</ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.md,
                    padding: Spacing.md,
                    marginTop: Spacing.xs,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.border,
                    minHeight: 80,
                  }}
                  value={alipayQR}
                  onChangeText={setAlipayQR}
                  placeholder="收款码图片URL或链接"
                  placeholderTextColor={theme.textMuted}
                  multiline
                />
              </View>

              {alipayQR && (
                <View style={{ alignItems: 'center', padding: Spacing.md, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md }}>
                  <Image source={{ uri: alipayQR }} style={{ width: 150, height: 150 }} resizeMode="contain" />
                  <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: Spacing.sm }}>预览</ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  padding: Spacing.md,
                  backgroundColor: '#1677FF',
                  borderRadius: BorderRadius.lg,
                }}
                onPress={() => handleSaveQRCode('alipay')}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <FontAwesome6 name="save" size={14} color="#fff" />
                    <ThemedText variant="smallMedium" color="#fff">保存配置</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 微信 */}
          <View style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.xl,
            padding: Spacing.lg,
            borderWidth: 1,
            borderColor: theme.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
              <FontAwesome6 name="message" size={24} color="#07C160" />
              <ThemedText variant="smallMedium" color={theme.textPrimary}>微信收款码</ThemedText>
            </View>

            <View style={{ gap: Spacing.md }}>
              <View>
                <ThemedText variant="caption" color={theme.textMuted}>收款账号（选填）</ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.md,
                    padding: Spacing.md,
                    marginTop: Spacing.xs,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  value={wechatAccount}
                  onChangeText={setWechatAccount}
                  placeholder="微信号"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View>
                <ThemedText variant="caption" color={theme.textMuted}>收款码URL</ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.md,
                    padding: Spacing.md,
                    marginTop: Spacing.xs,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.border,
                    minHeight: 80,
                  }}
                  value={wechatQR}
                  onChangeText={setWechatQR}
                  placeholder="收款码图片URL"
                  placeholderTextColor={theme.textMuted}
                  multiline
                />
              </View>

              {wechatQR && (
                <View style={{ alignItems: 'center', padding: Spacing.md, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md }}>
                  <Image source={{ uri: wechatQR }} style={{ width: 150, height: 150 }} resizeMode="contain" />
                  <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: Spacing.sm }}>预览</ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  padding: Spacing.md,
                  backgroundColor: '#07C160',
                  borderRadius: BorderRadius.lg,
                }}
                onPress={() => handleSaveQRCode('wechat')}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <FontAwesome6 name="save" size={14} color="#fff" />
                    <ThemedText variant="smallMedium" color="#fff">保存配置</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 商家配置 */}
      {activeSection === 'merchant' && (
        <View style={{
          backgroundColor: theme.backgroundDefault,
          borderRadius: BorderRadius.xl,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
            <FontAwesome6 name="store" size={24} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>商家收款配置</ThemedText>
          </View>

          <View style={{ gap: Spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md }}>
              <ThemedText variant="small" color={theme.textMuted}>商家模式</ThemedText>
              <ThemedText variant="small" color={merchantConfig?.enabled ? theme.success : theme.error}>
                {merchantConfig?.enabled ? '已开通' : '未开通'}
              </ThemedText>
            </View>

            {merchantConfig?.wechat && (
              <View style={{ padding: Spacing.md, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <FontAwesome6 name="message" size={16} color="#07C160" />
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>微信支付</ThemedText>
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>商户号: {merchantConfig.wechat.mchId}</ThemedText>
              </View>
            )}

            {merchantConfig?.alipay && (
              <View style={{ padding: Spacing.md, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                  <FontAwesome6 name="wallet" size={16} color="#1677FF" />
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>支付宝</ThemedText>
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>AppID: {merchantConfig.alipay.appId}</ThemedText>
              </View>
            )}

            <View style={{ backgroundColor: 'rgba(245,158,11,0.1)', padding: Spacing.md, borderRadius: BorderRadius.md }}>
              <ThemedText variant="caption" color="#F59E0B">
                商家收款配置请在「支付审核」页面进行管理
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* 系统设置 */}
      {activeSection === 'system' && (
        <View style={{
          backgroundColor: theme.backgroundDefault,
          borderRadius: BorderRadius.xl,
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg }}>
            <FontAwesome6 name="gear" size={24} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>系统设置</ThemedText>
          </View>

          <View style={{ gap: Spacing.md }}>
            {[
              { label: '应用名称', value: 'G Open' },
              { label: '版本号', value: '1.0.0' },
              { label: '管理员密钥', value: 'gopen_admin_2024' },
              { label: '服务状态', value: '正常运行' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, backgroundColor: theme.backgroundTertiary, borderRadius: BorderRadius.md }}>
                <ThemedText variant="small" color={theme.textMuted}>{item.label}</ThemedText>
                <ThemedText variant="small" color={theme.textPrimary}>{item.value}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
