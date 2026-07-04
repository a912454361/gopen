/**
 * 下载中心 - 安装包下载页面
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ParticleBackground } from '@/components/ParticleBackground';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

const GOLD = '#D4AF37';

// 安装包数据
const DOWNLOAD_PACKAGES = [
  {
    id: 'android',
    platform: 'Android',
    icon: 'android',
    version: '1.0.0',
    size: '128 MB',
    downloadUrl: 'https://download.wangu.game/android/wangu-v1.0.0.apk',
    supported: 'Android 8.0+',
    features: ['原生性能', '离线游玩', '推送通知'],
    color: '#3DDC84',
  },
  {
    id: 'ios',
    platform: 'iOS',
    icon: 'apple',
    version: '1.0.0',
    size: '156 MB',
    downloadUrl: 'https://apps.apple.com/app/wangu',
    supported: 'iOS 14.0+',
    features: ['原生性能', '离线游玩', 'Game Center'],
    color: '#FFFFFF',
  },
  {
    id: 'windows',
    platform: 'Windows',
    icon: 'windows',
    version: '1.0.0',
    size: '256 MB',
    downloadUrl: 'https://download.wangu.game/windows/wangu-v1.0.0.exe',
    supported: 'Windows 10+',
    features: ['4K画质', '键鼠操作', 'MOD支持'],
    color: '#0078D4',
  },
  {
    id: 'mac',
    platform: 'macOS',
    icon: 'apple',
    version: '1.0.0',
    size: '198 MB',
    downloadUrl: 'https://download.wangu.game/macos/wangu-v1.0.0.dmg',
    supported: 'macOS 11.0+',
    features: ['原生体验', 'Metal渲染', '游戏手柄'],
    color: '#FFFFFF',
  },
];

// 云游戏配置
const CLOUD_GAME_OPTIONS = [
  {
    id: 'web',
    title: '网页版云游戏',
    subtitle: '无需下载，即点即玩',
    icon: 'globe',
    url: '/cloud-play',
    features: ['无需安装', '跨平台', '自动存档'],
    gradient: ['#D4AF37', '#B8860B'] as [string, string],
  },
  {
    id: 'app',
    title: '客户端云游戏',
    subtitle: '更流畅的游戏体验',
    icon: 'cloud',
    url: '/cloud-play-advanced',
    features: ['更低延迟', '更高画质', '离线缓存'],
    gradient: ['#8B5CF6', '#6D28D9'] as [string, string],
  },
];

export default function DownloadScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = (pkg: typeof DOWNLOAD_PACKAGES[0]) => {
    setDownloading(pkg.id);
    // 模拟下载进度
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(null);
          return 0;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleCloudPlay = (option: typeof CLOUD_GAME_OPTIONS[0]) => {
    // 导航到云游戏页面
    console.log('Starting cloud play:', option.id);
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ParticleBackground />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg }
        ]}
      >
        {/* 标题 */}
        <View style={styles.header}>
          <FontAwesome6 name="download" size={32} color={GOLD} />
          <ThemedText variant="h2" weight="bold" color={GOLD} style={{ marginLeft: 12 }}>
            下载中心
          </ThemedText>
        </View>

        <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.xl }}>
          选择适合您的游戏方式
        </ThemedText>

        {/* 云游戏入口 */}
        <View style={styles.section}>
          <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
            云游戏
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            无需下载，即刻畅玩
          </ThemedText>

          {CLOUD_GAME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.cloudGameCard}
              onPress={() => handleCloudPlay(option)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={option.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cloudGameGradient}
              >
                <View style={styles.cloudGameIcon}>
                  <FontAwesome6 name={option.icon as any} size={28} color="#FFF" />
                </View>
                
                <View style={styles.cloudGameInfo}>
                  <ThemedText variant="label" weight="semibold" color="#FFF">
                    {option.title}
                  </ThemedText>
                  <ThemedText variant="caption" color="rgba(255,255,255,0.7)">
                    {option.subtitle}
                  </ThemedText>
                </View>

                <View style={styles.cloudGameFeatures}>
                  {option.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureTag}>
                      <ThemedText variant="tiny" color="rgba(255,255,255,0.9)">
                        {feature}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                <FontAwesome6 name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* 安装包下载 */}
        <View style={styles.section}>
          <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
            安装包下载
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            下载到本地，随时随地游玩
          </ThemedText>

          {DOWNLOAD_PACKAGES.map((pkg) => (
            <View key={pkg.id} style={styles.downloadCard}>
              <View style={styles.downloadHeader}>
                <View style={[styles.platformIcon, { backgroundColor: `${pkg.color}20` }]}>
                  <FontAwesome6 name={pkg.icon as any} size={24} color={pkg.color} />
                </View>
                
                <View style={styles.downloadInfo}>
                  <ThemedText variant="label" weight="semibold" color={theme.textPrimary}>
                    {pkg.platform}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    v{pkg.version} · {pkg.size}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    downloading === pkg.id && styles.downloadingButton,
                  ]}
                  onPress={() => handleDownload(pkg)}
                  disabled={downloading !== null}
                >
                  {downloading === pkg.id ? (
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
                      <ThemedText variant="tiny" color={theme.buttonPrimaryText}>
                        {downloadProgress}%
                      </ThemedText>
                    </View>
                  ) : (
                    <>
                      <FontAwesome6 name="download" size={14} color="#000" />
                      <ThemedText variant="smallMedium" color="#000">下载</ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.downloadMeta}>
                <ThemedText variant="tiny" color={theme.textMuted}>
                  支持: {pkg.supported}
                </ThemedText>
                <View style={styles.featureList}>
                  {pkg.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureBadge}>
                      <FontAwesome6 name="check" size={8} color={GOLD} />
                      <ThemedText variant="tiny" color={theme.textSecondary}>
                        {feature}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 温馨提示 */}
        <View style={styles.tipsSection}>
          <View style={styles.tipCard}>
            <FontAwesome6 name="lightbulb" size={18} color={GOLD} />
            <View style={styles.tipContent}>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>
                推荐使用云游戏
              </ThemedText>
              <ThemedText variant="caption" color={theme.textSecondary}>
                云游戏无需下载安装，支持多端同步存档，体验更流畅。
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 底部 */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            © 2024 万古长夜 · All Rights Reserved
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  section: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  cloudGameCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  cloudGameGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cloudGameIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cloudGameInfo: {
    flex: 1,
  },
  cloudGameFeatures: {
    flexDirection: 'row',
    gap: Spacing.xs,
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.lg,
  },
  featureTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  downloadCard: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: Spacing.sm,
  },
  downloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadInfo: {
    flex: 1,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: GOLD,
  },
  downloadingButton: {
    backgroundColor: theme.backgroundTertiary,
    paddingVertical: 0,
    paddingHorizontal: 0,
    width: 80,
    height: 36,
  },
  progressContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GOLD,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  downloadMeta: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  featureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: theme.backgroundTertiary,
  },
  tipsSection: {
    marginTop: Spacing['2xl'],
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  tipContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
});
