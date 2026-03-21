import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Dimensions,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 应用信息
const APP_INFO = {
  name: 'G open',
  version: '1.0.0',
  description: 'AI 智能创作助手 - 游戏与动漫内容创作神器',
  slogan: '释放创意，AI赋能',
  features: [
    { icon: 'wand-magic-sparkles', title: 'AI智能创作', desc: '一键生成古风、仙侠、国风热血等多种风格内容' },
    { icon: 'images', title: '图片生成', desc: 'AI生成唯美场景、角色立绘、宣传海报' },
    { icon: 'book-open', title: '剧情编写', desc: '智能生成故事大纲、人物对话、分支剧情' },
    { icon: 'users', title: '创作社区', desc: '分享作品，发现灵感，与创作者交流' },
    { icon: 'palette', title: '模板市场', desc: '精选创作模板，快速开始你的创作之旅' },
    { icon: 'crown', title: '会员特权', desc: '解锁更多创作次数和高级功能' },
  ],
  stats: {
    users: '10万+',
    works: '50万+',
    rating: '4.9',
  },
};

// 功能特色卡片
function FeatureCard({ feature, index }: { feature: typeof APP_INFO.features[0]; index: number }) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.featureCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
      <View style={[styles.featureIcon, { backgroundColor: `${theme.primary}20` }]}>
        <FontAwesome6 name={feature.icon as any} size={24} color={theme.primary} />
      </View>
      <ThemedText variant="label" color={theme.textPrimary} style={{ marginTop: Spacing.md }}>
        {feature.title}
      </ThemedText>
      <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs, textAlign: 'center' }}>
        {feature.desc}
      </ThemedText>
    </View>
  );
}

export default function DownloadScreen() {
  const { theme } = useTheme();
  const [activeSlide, setActiveSlide] = useState(0);

  // 下载链接配置
  const downloadLinks = {
    web: Platform.OS === 'web' ? window.location.origin : 'http://localhost:5000',
    android: null, // 需要 EAS Build 后填写
    ios: null, // 需要 App Store 上架后填写
    expo: 'exp://localhost:8081', // Expo Go 开发链接
  };

  // 处理下载
  const handleDownload = (type: 'web' | 'android' | 'ios' | 'expo') => {
    switch (type) {
      case 'web':
        // Web版本直接访问
        Alert.alert('Web版', '即将跳转到Web版本...', [
          { text: '取消', style: 'cancel' },
          { text: '前往', onPress: () => Linking.openURL(downloadLinks.web) },
        ]);
        break;
      case 'android':
        if (downloadLinks.android) {
          Linking.openURL(downloadLinks.android);
        } else {
          Alert.alert('即将推出', 'Android 版本即将上线，敬请期待！');
        }
        break;
      case 'ios':
        if (downloadLinks.ios) {
          Linking.openURL(downloadLinks.ios);
        } else {
          Alert.alert('即将推出', 'iOS 版本即将上线，敬请期待！');
        }
        break;
      case 'expo':
        Alert.alert(
          'Expo Go 体验',
          '安装 Expo Go 应用后，扫描二维码或输入链接即可体验开发版',
          [
            { text: '取消', style: 'cancel' },
            { text: '安装 Expo Go', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('https://apps.apple.com/app/expo-go/id982107779');
              } else {
                Linking.openURL('https://play.google.com/store/apps/details?id=host.exp.exponent');
              }
            }},
          ]
        );
        break;
    }
  };

  // 分享应用
  const handleShare = async () => {
    try {
      await Share.share({
        title: APP_INFO.name,
        message: `${APP_INFO.name} - ${APP_INFO.description}\n\n立即体验: ${downloadLinks.web}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
            />
          </View>
          
          {/* App Name */}
          <ThemedText variant="h1" color="#fff" style={{ fontWeight: 'bold' }}>
            {APP_INFO.name}
          </ThemedText>
          
          {/* Slogan */}
          <ThemedText variant="h4" color="rgba(255,255,255,0.9)" style={{ marginTop: Spacing.sm }}>
            {APP_INFO.slogan}
          </ThemedText>
          
          {/* Version */}
          <View style={styles.versionBadge}>
            <ThemedText variant="tiny" color="#fff">v{APP_INFO.version}</ThemedText>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={[styles.statsSection, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.primary}>{APP_INFO.stats.users}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>创作者</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.accent}>{APP_INFO.stats.works}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>作品</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome6 name="star" size={16} color="#FCD34D" solid />
              <ThemedText variant="h2" color="#FCD34D" style={{ marginLeft: 4 }}>{APP_INFO.stats.rating}</ThemedText>
            </View>
            <ThemedText variant="caption" color={theme.textMuted}>评分</ThemedText>
          </View>
        </View>

        {/* Download Buttons */}
        <View style={styles.downloadSection}>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
            立即下载体验
          </ThemedText>
          
          {/* Web Version - 主要推荐 */}
          <TouchableOpacity
            style={[styles.downloadButton, styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={() => handleDownload('web')}
            activeOpacity={0.8}
          >
            <FontAwesome6 name="globe" size={20} color="#fff" />
            <ThemedText variant="label" color="#fff" style={{ marginLeft: Spacing.sm }}>
              网页版 (无需下载)
            </ThemedText>
          </TouchableOpacity>

          {/* Native Apps */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.downloadButton, styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => handleDownload('android')}
              activeOpacity={0.8}
            >
              <FontAwesome6 name="android" size={20} color={theme.success} />
              <ThemedText variant="labelSmall" color={theme.textSecondary} style={{ marginLeft: Spacing.xs }}>
                Android
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.downloadButton, styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => handleDownload('ios')}
              activeOpacity={0.8}
            >
              <FontAwesome6 name="apple" size={20} color={theme.textPrimary} />
              <ThemedText variant="labelSmall" color={theme.textSecondary} style={{ marginLeft: Spacing.xs }}>
                iOS
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Expo Go */}
          <TouchableOpacity
            style={[styles.downloadButton, styles.tertiaryButton, { borderColor: theme.border }]}
            onPress={() => handleDownload('expo')}
            activeOpacity={0.8}
          >
            <FontAwesome6 name="flask" size={18} color={theme.accent} />
            <ThemedText variant="labelSmall" color={theme.textSecondary} style={{ marginLeft: Spacing.sm }}>
              Expo Go 开发版体验
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ textAlign: 'center', marginBottom: Spacing.xl }}>
            核心功能
          </ThemedText>
          
          <View style={styles.featuresGrid}>
            {APP_INFO.features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </View>
        </View>

        {/* Screenshots Placeholder */}
        <View style={styles.screenshotsSection}>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ textAlign: 'center', marginBottom: Spacing.lg }}>
            应用截图
          </ThemedText>
          
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.screenshotsContainer}
            >
              {[1, 2, 3, 4].map((item) => (
              <View
                key={item}
                style={[styles.screenshotItem, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
              >
                <Image
                  source={{
                    uri: `https://images.unsplash.com/photo-${
                      item === 1 ? '1545569341-9eb8b30979d9' :
                      item === 2 ? '1506905925346-21bda4d32df4' :
                      item === 3 ? '1518509562904-e7ef99cdcc86' :
                      '1454496522488-7a8e488e8606'
                    }?w=300&h=600&fit=crop`
                  }}
                  style={styles.screenshotImage}
                />
              </View>
            ))}
            </ScrollView>
          </View>
        </View>

        {/* Share Section */}
        <View style={[styles.shareSection, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText variant="label" color={theme.textPrimary} style={{ textAlign: 'center' }}>
            分享给朋友
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={{ textAlign: 'center', marginTop: Spacing.xs }}>
            邀请好友一起创作，解锁更多惊喜
          </ThemedText>
          
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.primary }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <FontAwesome6 name="share-nodes" size={18} color="#fff" />
            <ThemedText variant="label" color="#fff" style={{ marginLeft: Spacing.sm }}>
              立即分享
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText variant="tiny" color={theme.textMuted} style={{ textAlign: 'center' }}>
            Copyright 2024 G open. All rights reserved.
          </ThemedText>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <ThemedText variant="tiny" color={theme.textMuted}>用户协议</ThemedText>
            </TouchableOpacity>
            <ThemedText variant="tiny" color={theme.textMuted}> | </ThemedText>
            <TouchableOpacity>
              <ThemedText variant="tiny" color={theme.textMuted}>隐私政策</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = {
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  heroSection: {
    alignItems: 'center' as const,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  versionBadge: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
  },
  statsSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: Spacing.xl,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  statItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  downloadSection: {
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  downloadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  primaryButton: {
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
  },
  tertiaryButton: {
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
  },
  featuresSection: {
    padding: Spacing.xl,
    marginTop: Spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.md,
  },
  featureCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  screenshotsSection: {
    marginTop: Spacing.xl,
  },
  screenshotsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  screenshotItem: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  screenshotImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  shareSection: {
    margin: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center' as const,
    borderWidth: 1,
  },
  shareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  footer: {
    alignItems: 'center' as const,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  footerLinks: {
    flexDirection: 'row' as const,
    marginTop: Spacing.sm,
  },
};
