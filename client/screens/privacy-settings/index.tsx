/**
 * 隐私设置页面
 */

import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export default function PrivacySettingsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'data_collection',
      title: '数据收集',
      description: '允许收集使用数据以改进产品体验',
      enabled: true,
      icon: 'database',
    },
    {
      id: 'analytics',
      title: '分析统计',
      description: '允许使用分析工具了解功能使用情况',
      enabled: true,
      icon: 'chart-line',
    },
    {
      id: 'crash_report',
      title: '崩溃报告',
      description: '自动发送崩溃报告帮助修复问题',
      enabled: true,
      icon: 'bug',
    },
    {
      id: 'personalization',
      title: '个性化推荐',
      description: '根据使用习惯推荐相关内容',
      enabled: false,
      icon: 'wand-magic-sparkles',
    },
    {
      id: 'location',
      title: '位置信息',
      description: '允许访问位置信息（用于附近服务）',
      enabled: false,
      icon: 'location-dot',
    },
    {
      id: 'camera',
      title: '相机权限',
      description: '允许访问相机（用于拍照上传）',
      enabled: true,
      icon: 'camera',
    },
    {
      id: 'photos',
      title: '相册权限',
      description: '允许访问相册（用于选择图片）',
      enabled: true,
      icon: 'images',
    },
    {
      id: 'notifications',
      title: '推送通知',
      description: '接收重要通知和更新提醒',
      enabled: true,
      icon: 'bell',
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev => 
      prev.map(s => 
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleClearData = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要清除所有本地数据吗？此操作不可恢复。');
      if (confirmed) {
        window.alert('本地数据已清除');
      }
    } else {
      Alert.alert(
        '清除数据',
        '确定要清除所有本地数据吗？此操作不可恢复。',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '确定', 
            style: 'destructive',
            onPress: () => Alert.alert('成功', '本地数据已清除')
          },
        ]
      );
    }
  };

  const handleExportData = () => {
    if (Platform.OS === 'web') {
      window.alert('数据导出功能即将上线');
    } else {
      Alert.alert('提示', '数据导出功能即将上线');
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('确定要删除账户吗？所有数据将被永久删除且无法恢复。');
      if (confirmed) {
        window.alert('账户删除申请已提交');
      }
    } else {
      Alert.alert(
        '删除账户',
        '确定要删除账户吗？所有数据将被永久删除且无法恢复。',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '删除', 
            style: 'destructive',
            onPress: () => Alert.alert('已提交', '账户删除申请已提交')
          },
        ]
      );
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ThemedView level="root" style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.backgroundTertiary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: Spacing.md,
              }}
            >
              <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <ThemedText variant="h2" color={theme.textPrimary}>
                隐私设置
              </ThemedText>
            </View>
          </View>
          <ThemedText variant="body" color={theme.textMuted}>
            管理您的隐私和数据设置
          </ThemedText>
        </ThemedView>

        {/* 权限设置 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            权限管理
          </ThemedText>

          {settings.map((setting) => (
            <View
              key={setting.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderLight,
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: setting.enabled ? theme.primary + '20' : theme.backgroundTertiary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: Spacing.md,
              }}>
                <FontAwesome6 
                  name={setting.icon as any} 
                  size={18} 
                  color={setting.enabled ? theme.primary : theme.textMuted} 
                />
              </View>

              <View style={{ flex: 1 }}>
                <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                  {setting.title}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {setting.description}
                </ThemedText>
              </View>

              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={setting.enabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          ))}
        </ThemedView>

        {/* 数据管理 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            数据管理
          </ThemedText>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: theme.borderLight,
            }}
            onPress={handleExportData}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: Spacing.md,
            }}>
              <FontAwesome6 name="download" size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                导出数据
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                下载您的所有数据副本
              </ThemedText>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: theme.borderLight,
            }}
            onPress={handleClearData}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.accent + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: Spacing.md,
            }}>
              <FontAwesome6 name="trash" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                清除本地数据
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                删除所有本地缓存数据
              </ThemedText>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.lg,
            }}
            onPress={handleDeleteAccount}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.error + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: Spacing.md,
            }}>
              <FontAwesome6 name="user-minus" size={18} color={theme.error} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="bodyMedium" color={theme.error}>
                删除账户
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                永久删除账户和所有数据
              </ThemedText>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </ThemedView>

        {/* 法律文档 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            法律文档
          </ThemedText>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: theme.borderLight,
            }}
            onPress={() => router.push('/privacy')}
          >
            <FontAwesome6 name="shield-halved" size={20} color={theme.textPrimary} style={{ marginRight: Spacing.md }} />
            <ThemedText variant="bodyMedium" color={theme.textPrimary} style={{ flex: 1 }}>
              隐私政策
            </ThemedText>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: Spacing.lg,
            }}
            onPress={() => router.push('/terms')}
          >
            <FontAwesome6 name="file-contract" size={20} color={theme.textPrimary} style={{ marginRight: Spacing.md }} />
            <ThemedText variant="bodyMedium" color={theme.textPrimary} style={{ flex: 1 }}>
              用户协议
            </ThemedText>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </Screen>
  );
}
