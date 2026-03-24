import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';

interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  isMemberOnly?: boolean;
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { isMember, expireDate } = useMembership();

  const generalMenuItems: MenuItem[] = [
    {
      icon: 'palette',
      title: '主题设置',
      subtitle: '外观主题配置',
      value: '暗黑',
    },
    {
      icon: 'globe',
      title: '语言',
      subtitle: '界面语言设置',
      value: '中文',
    },
    {
      icon: 'bell',
      title: '通知设置',
      subtitle: '推送通知配置',
      onPress: () => router.push('/notification-settings'),
    },
  ];

  const aiMenuItems: MenuItem[] = [
    {
      icon: 'microchip',
      title: 'AI 模型',
      subtitle: isMember ? '选择偏好模型' : '会员专属',
      value: isMember ? 'G open Pro' : '基础版',
      isMemberOnly: true,
    },
    {
      icon: 'sliders',
      title: '生成质量',
      subtitle: isMember ? '调整输出质量' : '会员专属',
      value: isMember ? '高质量' : '标准',
      isMemberOnly: true,
    },
    {
      icon: 'bolt',
      title: '性能模式',
      subtitle: isMember ? '速度与质量平衡' : '会员专属',
      value: isMember ? '均衡' : '基础',
      isMemberOnly: true,
    },
  ];

  const accountMenuItems: MenuItem[] = [
    {
      icon: 'wallet',
      title: '钱包',
      subtitle: '余额充值与消费记录',
      onPress: () => router.push('/wallet'),
    },
    {
      icon: 'microchip',
      title: '模型市场',
      subtitle: '选择AI模型和GPU算力',
      onPress: () => router.push('/models'),
    },
    {
      icon: 'right-to-bracket',
      title: '账号登录',
      subtitle: '第三方账号绑定',
      onPress: () => router.push('/login'),
    },
    {
      icon: 'receipt',
      title: '账单明细',
      subtitle: '交易记录与发票',
      onPress: () => router.push('/bill'),
    },
    {
      icon: 'cloud',
      title: '云存储设置',
      subtitle: '百度网盘/阿里云盘',
      onPress: () => router.push('/cloud-storage'),
      isMemberOnly: true,
    },
    {
      icon: 'user-shield',
      title: '隐私设置',
      subtitle: '数据与隐私管理',
    },
    {
      icon: 'key',
      title: 'API 密钥',
      subtitle: '管理集成配置',
      isMemberOnly: true,
    },
    {
      icon: 'circle-question',
      title: '帮助与支持',
      subtitle: '获取使用帮助',
    },
    // Web端显示下载入口
    ...(Platform.OS === 'web' ? [{
      icon: 'download',
      title: '下载应用',
      subtitle: 'iOS / Android / macOS / Windows',
      onPress: () => router.push('/download'),
    } as MenuItem] : []),
  ];

  const renderMenuItem = (item: MenuItem, index: number, total: number) => {
    const isLocked = !isMember && item.isMemberOnly;
    
    return (
      <TouchableOpacity
        key={item.title}
        style={[styles.menuItem, index < total - 1 && styles.menuItemBorder]}
        onPress={item.onPress}
        disabled={isLocked}
      >
        <View style={[styles.menuIcon, isLocked && { opacity: 0.5 }]}>
          <FontAwesome6 name={item.icon as any} size={16} color={isLocked ? theme.textMuted : theme.textPrimary} />
        </View>
        <View style={styles.menuContent}>
          <ThemedText variant="smallMedium" color={isLocked ? theme.textMuted : theme.textPrimary}>
            {item.title}
          </ThemedText>
          {item.subtitle && (
            <ThemedText variant="caption" color={theme.textMuted}>
              {item.subtitle}
            </ThemedText>
          )}
        </View>
        {item.value && (
          <ThemedText variant="smallMedium" color={isLocked ? theme.textMuted : theme.primary}>
            {item.value}
          </ThemedText>
        )}
        {isLocked && (
          <FontAwesome6 name="lock" size={12} color={theme.textMuted} />
        )}
        {!isLocked && (
          <FontAwesome6 name="chevron-right" size={12} color={theme.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h4" color={theme.textPrimary}>
            设置
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>
            系统配置
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <FontAwesome6 name={isMember ? 'crown' : 'user'} size={28} color={theme.primary} />
          </View>
          <View style={styles.profileInfo}>
            <ThemedText variant="title" color={theme.textPrimary}>
              {isMember ? 'G open 会员' : '免费用户'}
            </ThemedText>
            <ThemedText variant="small" color={theme.textMuted}>
              {isMember ? `到期：${expireDate}` : '升级解锁更多功能'}
            </ThemedText>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/membership')}
            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.primary, borderRadius: 6 }}
          >
            <ThemedText variant="captionMedium" color={theme.backgroundRoot}>
              {isMember ? '续费' : '开通'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted}>
            常规设置
          </ThemedText>
          <View style={styles.menuList}>
            {generalMenuItems.map((item, index) =>
              renderMenuItem(item, index, generalMenuItems.length)
            )}
          </View>
        </View>

        {/* AI Settings */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted}>
            AI 配置
          </ThemedText>
          <View style={styles.menuList}>
            {aiMenuItems.map((item, index) =>
              renderMenuItem(item, index, aiMenuItems.length)
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted}>
            账户管理
          </ThemedText>
          <View style={styles.menuList}>
            {accountMenuItems.map((item, index) =>
              renderMenuItem(item, index, accountMenuItems.length)
            )}
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <ThemedText variant="caption" color={theme.textMuted}>
            G open{' '}
            <ThemedText variant="caption" color={theme.primary}>
              v1.0.0
            </ThemedText>
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
