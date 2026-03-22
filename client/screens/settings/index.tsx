import React, { useMemo, useState } from 'react';
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
import { Avatar } from '@/components/Avatar';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId] = useState('demo-user-001'); // 示例用户ID

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
  };

  const generalMenuItems: MenuItem[] = [
    {
      icon: 'palette',
      title: '主题设置',
      subtitle: '外观主题配置',
      onPress: () => router.push('/theme'),
    },
    {
      icon: 'globe',
      title: '语言',
      subtitle: '界面语言设置',
      onPress: () => router.push('/language'),
    },
    {
      icon: 'bell',
      title: '通知设置',
      subtitle: '推送通知配置',
      onPress: () => router.push('/notification-settings'),
    },
  ];

  // 创作功能菜单
  const createMenuItems: MenuItem[] = [
    {
      icon: 'folder-open',
      title: '我的作品',
      subtitle: '查看创作历史',
      onPress: () => router.push('/my-works'),
    },
    {
      icon: 'comments',
      title: '对话历史',
      subtitle: '查看聊天记录',
      onPress: () => router.push('/chat-history'),
    },
    {
      icon: 'wave-square',
      title: 'AI音频工具',
      subtitle: '语音转文字、文字转语音',
      onPress: () => router.push('/audio'),
    },
    {
      icon: 'users',
      title: '创作社区',
      subtitle: '发现精彩作品',
      onPress: () => router.push('/community'),
    },
    {
      icon: 'shapes',
      title: '模板市场',
      subtitle: '快速开始创作',
      onPress: () => router.push('/templates'),
    },
    {
      icon: 'chart-pie',
      title: '数据统计',
      subtitle: '创作数据一览',
      onPress: () => router.push('/stats'),
    },
    {
      icon: 'bell',
      title: '消息通知',
      subtitle: '系统消息提醒',
      onPress: () => router.push('/notifications'),
    },
  ];

  // 分享推荐菜单
  const shareMenuItems: MenuItem[] = [
    {
      icon: 'gift',
      title: '奖励中心',
      subtitle: '签到、任务、邀请赚奖励',
      onPress: () => router.push('/rewards'),
    },
    {
      icon: 'user-plus',
      title: '邀请好友',
      subtitle: '邀请好友，双方各得奖励',
      onPress: () => router.push('/invite'),
    },
    {
      icon: 'download',
      title: '分享应用',
      subtitle: '分享给朋友下载',
      onPress: () => router.push('/download'),
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
      icon: 'chart-line',
      title: 'Token用量',
      subtitle: 'AI使用统计与余额',
      onPress: () => router.push('/token-usage'),
    },
    {
      icon: 'bullhorn',
      title: '推广中心',
      subtitle: '邀请好友赚佣金',
      onPress: () => router.push('/promotion'),
    },
    {
      icon: 'microchip',
      title: '模型市场',
      subtitle: '选择AI模型和GPU算力',
      onPress: () => router.push('/models'),
    },
    {
      icon: 'server',
      title: '厂商管理',
      subtitle: '管理AI厂商配置和同步',
      onPress: () => router.push('/providers'),
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
      icon: 'cloud-arrow-up',
      title: '云存储开通',
      subtitle: '连接百度网盘/阿里云盘/Google Drive',
      onPress: () => router.push('/cloud-storage-setup'),
    },
    {
      icon: 'user-shield',
      title: '隐私设置',
      subtitle: '数据与隐私管理',
      onPress: () => router.push('/privacy-settings'),
    },
    {
      icon: 'key',
      title: 'API 密钥',
      subtitle: '管理集成配置',
      onPress: () => router.push('/api-keys'),
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
        <TouchableOpacity 
          style={styles.profileCard}
          onPress={() => router.push('/profile-edit')}
          activeOpacity={0.7}
        >
          <Avatar 
            userId={userId}
            size={56}
            avatarUrl={avatarUrl}
            editable={false}
            onAvatarChange={handleAvatarChange}
          />
          <View style={styles.profileInfo}>
            <ThemedText variant="title" color={theme.textPrimary}>
              {isMember ? 'G open 会员' : '免费用户'}
            </ThemedText>
            <ThemedText variant="small" color={theme.textMuted}>
              {isMember ? `到期：${expireDate}` : '升级解锁更多功能'}
            </ThemedText>
          </View>
          <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
        </TouchableOpacity>

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

        {/* Create Features */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted}>
            创作功能
          </ThemedText>
          <View style={styles.menuList}>
            {createMenuItems.map((item, index) =>
              renderMenuItem(item, index, createMenuItems.length)
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

        {/* Share & Invite */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted}>
            分享推荐
          </ThemedText>
          <View style={styles.menuList}>
            {shareMenuItems.map((item, index) =>
              renderMenuItem(item, index, shareMenuItems.length)
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
