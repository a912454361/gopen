import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const PLATFORMS = [
  {
    id: 'ios',
    name: 'iOS',
    icon: 'apple',
    color: '#000000',
    bgColor: '#F5F5F7',
    description: 'iPhone / iPad',
    downloadUrl: 'https://apps.apple.com/app/g-open',
    buttonText: 'App Store 下载',
  },
  {
    id: 'android',
    name: 'Android',
    icon: 'android',
    color: '#3DDC84',
    bgColor: '#E8F5E9',
    description: 'Android 手机 / 平板',
    downloadUrl: 'https://play.google.com/store/apps/details?id=com.gopen',
    buttonText: 'Google Play 下载',
  },
  {
    id: 'macos',
    name: 'macOS',
    icon: 'apple',
    color: '#000000',
    bgColor: '#F5F5F7',
    description: 'Mac 电脑',
    downloadUrl: 'https://apps.apple.com/app/g-open-mac',
    buttonText: 'Mac App Store',
  },
  {
    id: 'windows',
    name: 'Windows',
    icon: 'windows',
    color: '#0078D4',
    bgColor: '#E3F2FD',
    description: 'Windows 电脑',
    downloadUrl: 'https://www.microsoft.com/store/apps/gopen',
    buttonText: 'Microsoft Store',
  },
];

const FEATURES = [
  { icon: 'wand-magic-sparkles', title: 'AI智能创作', desc: '支持游戏、动漫内容创作' },
  { icon: 'brain', title: '多模型支持', desc: '豆包、GPT、Claude等主流模型' },
  { icon: 'cloud', title: '云端同步', desc: '百度网盘、阿里云盘数据同步' },
  { icon: 'bolt', title: 'GPU加速', desc: '高性能算力租赁服务' },
  { icon: 'shield-check', title: '数据安全', desc: '端到端加密保护隐私' },
  { icon: 'headset', title: '专属客服', desc: '7x24小时在线支持' },
];

const STORES = [
  { id: 'appstore', name: 'App Store', icon: 'apple', color: '#000000' },
  { id: 'playstore', name: 'Google Play', icon: 'google-play', color: '#414141' },
  { id: 'huawei', name: '华为应用市场', icon: 'store', color: '#CF0A2C' },
  { id: 'xiaomi', name: '小米应用商店', icon: 'store', color: '#FF6900' },
  { id: 'oppo', name: 'OPPO软件商店', icon: 'store', color: '#00A86B' },
  { id: 'vivo', name: 'vivo应用商店', icon: 'store', color: '#415FFF' },
  { id: 'tencent', name: '腾讯应用宝', icon: 'store', color: '#12B7F5' },
  { id: 'douyin', name: '抖音小程序', icon: 'play', color: '#000000' },
];

export default function DownloadScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 仅在 Web 端显示
  if (Platform.OS !== 'web') {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <FontAwesome6 name="download" size={48} color={theme.textMuted} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.lg, textAlign: 'center' }}>
            请在电脑浏览器中访问下载页面
          </ThemedText>
        </View>
      </Screen>
    );
  }

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', left: 0, padding: Spacing.sm }}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h2" color={theme.textPrimary}>
            下载 G Open
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>
            全平台支持 · 一键安装
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.appIcon}
          />
          <ThemedText variant="h3" color={theme.textPrimary}>
            G Open - AI创作助手
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
            暗黑科技风 · 专业游戏动漫创作工具
          </ThemedText>
        </View>

        {/* Platform Downloads */}
        <View style={styles.platformGrid}>
          {PLATFORMS.map((platform) => (
            <View key={platform.id} style={styles.platformCard}>
              <View style={[styles.platformIcon, { backgroundColor: platform.bgColor }]}>
                <FontAwesome6 name={platform.icon as any} size={28} color={platform.color} />
              </View>
              <ThemedText variant="title" color={theme.textPrimary}>
                {platform.name}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
                {platform.description}
              </ThemedText>
              <TouchableOpacity
                style={[styles.downloadButton, { backgroundColor: platform.color }]}
                onPress={() => handleDownload(platform.downloadUrl)}
              >
                <FontAwesome6 name="download" size={14} color="#fff" />
                <ThemedText variant="smallMedium" color="#fff">
                  {platform.buttonText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.featureList}>
          <ThemedText variant="label" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
            核心功能
          </ThemedText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={{ width: '50%', padding: Spacing.sm }}>
                <View style={styles.featureItem}>
                  <FontAwesome6 name={feature.icon as any} size={16} color={theme.primary} />
                  <View>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {feature.title}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {feature.desc}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* App Stores */}
        <View style={styles.storeSection}>
          <ThemedText variant="label" color={theme.textPrimary}>
            上线各大应用商店
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
            多平台分发，安全可靠
          </ThemedText>
          <View style={styles.storeGrid}>
            {STORES.map((store) => (
              <View key={store.id} style={styles.storeBadge}>
                <FontAwesome6 name={store.icon as any} size={14} color={store.color} />
                <ThemedText variant="small" color={theme.textPrimary}>
                  {store.name}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Version Info */}
        <View style={{ marginTop: Spacing.xl, alignItems: 'center' }}>
          <ThemedText variant="caption" color={theme.textMuted}>
            当前版本：v1.0.0 | 更新时间：2024年
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
