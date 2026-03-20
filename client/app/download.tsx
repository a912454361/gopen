import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Platform,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';

export default function DownloadScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleDownload = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.appName}>
            G open
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary}>
            AI 创作助手
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.version}>
            v1.0.0
          </ThemedText>
        </View>

        {/* 介绍 */}
        <ThemedView level="default" style={styles.card}>
          <ThemedText variant="bodyMedium" color={theme.textSecondary}>
            暗黑科技风格的AI创作助手，专为游戏和动漫创作者打造。支持AI智能创作、模型市场、GPU算力租赁、云存储等功能。
          </ThemedText>
        </ThemedView>

        {/* 下载选项 */}
        <View style={styles.downloadSection}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            下载安装
          </ThemedText>

          {/* Android APK */}
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: theme.primary }]}
            onPress={() => handleDownload('https://woshiguotao.cn/files/gopen.apk')}
          >
            <FontAwesome6 name="android" size={24} color="#FFFFFF" />
            <View style={styles.buttonTextContainer}>
              <ThemedText variant="bodyMedium" color="#FFFFFF">
                Android APK
              </ThemedText>
              <ThemedText variant="caption" color="rgba(255,255,255,0.8)">
                直接下载安装
              </ThemedText>
            </View>
          </TouchableOpacity>

          {/* 应用商店 */}
          <ThemedText variant="bodyMedium" color={theme.textMuted} style={styles.orText}>
            或从应用商店下载
          </ThemedText>

          <View style={styles.storeButtons}>
            <TouchableOpacity
              style={[styles.storeButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => handleDownload('https://app.mi.com/')}
            >
              <FontAwesome6 name="mobile-screen" size={20} color={theme.textPrimary} />
              <ThemedText variant="small" color={theme.textPrimary}>小米商店</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.storeButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => handleDownload('https://appgallery.huawei.com/')}
            >
              <FontAwesome6 name="mobile-screen" size={20} color={theme.textPrimary} />
              <ThemedText variant="small" color={theme.textPrimary}>华为市场</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.storeButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => handleDownload('https://android.myapp.com/')}
            >
              <FontAwesome6 name="mobile-screen" size={20} color={theme.textPrimary} />
              <ThemedText variant="small" color={theme.textPrimary}>应用宝</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* 安装说明 */}
        <ThemedView level="default" style={styles.card}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.cardTitle}>
            安装说明
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary}>
            1. 下载 APK 文件{'\n'}
            2. 点击安装{'\n'}
            3. 如提示&quot;未知来源&quot;，请在设置中允许安装{'\n'}
            4. 安装完成后即可使用
          </ThemedText>
        </ThemedView>

        {/* 版本信息 */}
        <View style={styles.footer}>
          <ThemedText variant="caption" color={theme.textMuted}>
            2026 G open. All rights reserved.
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
