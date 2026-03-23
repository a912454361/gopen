/**
 * 下载页面 - 应用下载入口
 * 
 * 提供 Web版、Android、iOS 多平台下载入口
 */

import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 平台信息
const PLATFORMS = [
  {
    id: 'web',
    name: 'Web版',
    icon: 'globe',
    color: '#4F46E5',
    bgColor: 'rgba(79,70,229,0.1)',
    description: '无需下载，浏览器直接使用',
    url: 'https://gopen-ai-assistant.netlify.app',
  },
  {
    id: 'android',
    name: 'Android',
    icon: 'android',
    color: '#3DDC84',
    bgColor: 'rgba(61,220,132,0.1)',
    description: 'Android手机专用版',
    url: 'https://gopen-ai-assistant.netlify.app',
  },
  {
    id: 'ios',
    name: 'iOS',
    icon: 'apple',
    color: '#000000',
    bgColor: 'rgba(0,0,0,0.05)',
    description: 'iPhone/iPad专用版',
    url: 'https://gopen-ai-assistant.netlify.app',
  },
];

// 功能特性
const FEATURES = [
  { icon: 'robot', title: 'AI智能对话', desc: '支持35家主流模型' },
  { icon: 'gamepad', title: '游戏创作', desc: '角色剧情一键生成' },
  { icon: 'paintbrush', title: '动漫创作', desc: '插画故事随心创作' },
  { icon: 'crown', title: '会员特权', desc: '更多功能等你解锁' },
];

export default function DownloadScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleDownload = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Open URL error:', error);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero区域 */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <FontAwesome6 name="wand-magic-sparkles" size={48} color="#fff" />
          </View>
          
          <ThemedText variant="h2" color="#fff" style={styles.appName}>
            G open
          </ThemedText>
          <ThemedText variant="label" color="rgba(255,255,255,0.9)" style={styles.appSlogan}>
            智能创作助手
          </ThemedText>
          <ThemedText variant="caption" color="rgba(255,255,255,0.7)" style={styles.appDesc}>
            游戏 · 动漫 · AI创作
          </ThemedText>
        </LinearGradient>

        {/* 功能特性 */}
        <View style={styles.featuresSection}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            功能亮点
          </ThemedText>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={[styles.featureItem, { backgroundColor: theme.backgroundDefault }]}>
                <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
                  <FontAwesome6 name={feature.icon as any} size={24} color={theme.primary} />
                </View>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {feature.title}
                </ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>
                  {feature.desc}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* 下载选项 */}
        <View style={styles.downloadSection}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            选择下载方式
          </ThemedText>
          
          {PLATFORMS.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[styles.downloadCard, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => handleDownload(platform.url)}
              activeOpacity={0.8}
            >
              <View style={styles.downloadCardContent}>
                <View style={[styles.platformIcon, { backgroundColor: platform.bgColor }]}>
                  <FontAwesome6 
                    name={platform.icon as any} 
                    size={28} 
                    color={platform.color} 
                    brand={platform.id === 'android' || platform.id === 'apple'}
                  />
                </View>
                <View style={styles.platformInfo}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {platform.name}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {platform.description}
                  </ThemedText>
                </View>
                <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 推荐使用Web版 */}
        <View style={[styles.recommendCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
          <View style={styles.recommendHeader}>
            <FontAwesome6 name="star" size={20} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.primary} style={{ marginLeft: Spacing.sm }}>
              推荐使用 Web版
            </ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
            Web版无需下载安装，打开浏览器即可使用全部功能，支持电脑和手机访问。
          </ThemedText>
          <TouchableOpacity
            style={[styles.recommendButton, { backgroundColor: theme.primary }]}
            onPress={() => handleDownload('https://gopen-ai-assistant.netlify.app')}
          >
            <ThemedText variant="smallMedium" color="#fff">立即体验 Web版</ThemedText>
            <FontAwesome6 name="arrow-right" size={14} color="#fff" style={{ marginLeft: Spacing.sm }} />
          </TouchableOpacity>
        </View>

        {/* 备用地址 */}
        <View style={styles.backupSection}>
          <ThemedText variant="caption" color={theme.textMuted}>
            备用地址
          </ThemedText>
          <TouchableOpacity
            style={[styles.backupLink, { backgroundColor: theme.backgroundTertiary }]}
            onPress={() => handleDownload('https://gopen-ai.vercel.app')}
          >
            <FontAwesome6 name="link" size={14} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textSecondary} style={{ marginLeft: Spacing.xs }}>
              gopen-ai.vercel.app
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            © 2026 G open 智能创作助手
          </ThemedText>
          <ThemedText variant="tiny" color={theme.textMuted}>
            支持 35 家主流 AI 模型
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
