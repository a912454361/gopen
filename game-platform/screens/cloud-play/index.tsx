/**
 * 云游戏页面 - 流式游戏体验
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ParticleBackground } from '@/components/ParticleBackground';
import { CloudGamePlayer } from '@/components/CloudGamePlayer';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GOLD = '#D4AF37';

// 游戏列表
const GAMES = [
  {
    id: 'wangu-main',
    title: '万古长夜',
    subtitle: '主剧情模式',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
    color: '#D4AF37',
    rating: 4.9,
    players: '12.8万',
    quality: 'ultra',
  },
  {
    id: 'wangu-pvp',
    title: '对战竞技场',
    subtitle: '实时对战',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
    color: '#EF4444',
    rating: 4.8,
    players: '8.5万',
    quality: 'high',
  },
  {
    id: 'wangu-story',
    title: '阵营传说',
    subtitle: '五大阵营剧情',
    cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400',
    color: '#8B5CF6',
    rating: 4.7,
    players: '6.2万',
    quality: 'high',
  },
];

export default function CloudPlayScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [selectedGame, setSelectedGame] = useState<typeof GAMES[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStartGame = (game: typeof GAMES[0]) => {
    setSelectedGame(game);
    setIsPlaying(true);
  };

  const handleCloseGame = () => {
    setIsPlaying(false);
    setSelectedGame(null);
  };

  // 游戏进行中，显示云游戏播放器
  if (isPlaying && selectedGame) {
    return (
      <CloudGamePlayer
        config={{
          gameId: selectedGame.id,
          gameName: selectedGame.title,
          serverUrl: 'wss://cloud.wangu.game',
          quality: selectedGame.quality as any,
          frameRate: 60,
        }}
        onClose={handleCloseGame}
        onReady={() => console.log('Game ready!')}
      />
    );
  }

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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome6 name="arrow-left" size={20} color={GOLD} />
          </TouchableOpacity>
          <FontAwesome6 name="cloud" size={28} color={GOLD} />
          <ThemedText variant="h2" weight="bold" color={GOLD} style={{ marginLeft: 12 }}>
            云游戏
          </ThemedText>
        </View>

        {/* 特性展示 */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <FontAwesome6 name="bolt" size={16} color={GOLD} />
            <ThemedText variant="tiny" color={theme.textSecondary}>低延迟</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome6 name="gauge-high" size={16} color={GOLD} />
            <ThemedText variant="tiny" color={theme.textSecondary}>60FPS</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome6 name="bookmark" size={16} color={GOLD} />
            <ThemedText variant="tiny" color={theme.textSecondary}>云存档</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <FontAwesome6 name="shield" size={16} color={GOLD} />
            <ThemedText variant="tiny" color={theme.textSecondary}>安全稳定</ThemedText>
          </View>
        </View>

        {/* 游戏列表 */}
        <View style={styles.section}>
          <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
            即刻畅玩
          </ThemedText>
          
          {GAMES.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={styles.gameCard}
              onPress={() => handleStartGame(game)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(212, 175, 55, 0.15)', 'rgba(10, 10, 15, 0.9)']}
                style={styles.gameCardGradient}
              >
                {/* 游戏封面 */}
                <View style={[styles.gameCover, { borderColor: game.color }]}>
                  <FontAwesome6 name="gamepad" size={40} color={game.color} />
                </View>

                {/* 游戏信息 */}
                <View style={styles.gameInfo}>
                  <View style={styles.gameHeader}>
                    <ThemedText variant="label" weight="bold" color={theme.textPrimary}>
                      {game.title}
                    </ThemedText>
                    <View style={styles.ratingBadge}>
                      <FontAwesome6 name="star" size={10} color={GOLD} />
                      <ThemedText variant="tiny" weight="medium" color={GOLD}>
                        {game.rating}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <ThemedText variant="caption" color={theme.textSecondary}>
                    {game.subtitle}
                  </ThemedText>

                  <View style={styles.gameMeta}>
                    <View style={styles.metaItem}>
                      <FontAwesome6 name="users" size={10} color={theme.textMuted} />
                      <ThemedText variant="tiny" color={theme.textMuted}>
                        {game.players} 在线
                      </ThemedText>
                    </View>
                    <View style={styles.metaItem}>
                      <FontAwesome6 name="signal" size={10} color="#10B981" />
                      <ThemedText variant="tiny" color="#10B981">
                        {game.quality.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* 开始按钮 */}
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: game.color }]}
                  onPress={() => handleStartGame(game)}
                >
                  <FontAwesome6 name="play" size={16} color="#000" />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* 技术说明 */}
        <View style={styles.techSection}>
          <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
            云游戏技术
          </ThemedText>
          
          <View style={styles.techGrid}>
            <View style={styles.techItem}>
              <View style={[styles.techIcon, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <FontAwesome6 name="server" size={20} color={GOLD} />
              </View>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>
                云端渲染
              </ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>
                高性能GPU集群
              </ThemedText>
            </View>
            
            <View style={styles.techItem}>
              <View style={[styles.techIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <FontAwesome6 name="network-wired" size={20} color="#10B981" />
              </View>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>
                低延迟传输
              </ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>
                WebRTC技术
              </ThemedText>
            </View>
            
            <View style={styles.techItem}>
              <View style={[styles.techIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <FontAwesome6 name="hard-drive" size={20} color="#8B5CF6" />
              </View>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>
                云存档同步
              </ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>
                多端互通
              </ThemedText>
            </View>
            
            <View style={styles.techItem}>
              <View style={[styles.techIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <FontAwesome6 name="lock" size={20} color="#EF4444" />
              </View>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>
                安全加密
              </ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>
                端到端加密
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 底部 */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            建议网络: 宽带 10Mbps+ / 5G / WiFi 5GHz
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
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.backgroundDefault,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  section: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  gameCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  gameCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  gameCover: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.backgroundTertiary,
  },
  gameInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  gameMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  techSection: {
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  techItem: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.backgroundDefault,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  techIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
});
