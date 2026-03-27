import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ParticleSystem, PARTICLE_PRESETS } from '@/components/ParticleSystem';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 金色主题色
const GOLD = '#D4AF37';

export default function GameHomeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();

  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      let playerId = await AsyncStorage.getItem('ink_player_id');
      if (!playerId) {
        playerId = `ink_${Date.now()}`;
        await AsyncStorage.setItem('ink_player_id', playerId);
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/player/${playerId}`);
      const data = await response.json();
      setPlayer(data.player);
    } catch (error) {
      console.error('加载玩家数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    gradient: [string, string];
    route?: string;
    action?: string;
  }> = [
    {
      id: 'battle',
      title: '即刻对战',
      subtitle: '匹配对手，争夺荣耀',
      icon: 'swords',
      gradient: ['#E74C3C', '#C0392B'],
      route: '/ink-battle',
    },
    {
      id: 'collection',
      title: '卡牌收藏',
      subtitle: '查看你的卡组',
      icon: 'layer-group',
      gradient: ['#9B59B6', '#8E44AD'],
      route: '/ink-cards',
    },
    {
      id: 'draw',
      title: '神秘抽卡',
      subtitle: '100金币/次',
      icon: 'gift',
      gradient: ['#F39C12', '#D68910'],
      action: 'draw',
    },
    {
      id: 'ranking',
      title: '排行榜',
      subtitle: '全服高手',
      icon: 'ranking-star',
      gradient: ['#3498DB', '#2980B9'],
      route: '/ink-cards',
    },
  ];

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      {/* 粒子背景 */}
      <ParticleSystem
        config={PARTICLE_PRESETS.wangu}
        intensity="low"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.md,
          paddingBottom: insets.bottom + Spacing['2xl'],
        }}
      >
        {/* Hero 区域 */}
        <LinearGradient
          colors={['#1A1A2E', '#0A0A0F']}
          style={styles.heroSection}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <FontAwesome6 name="moon" size={40} color={GOLD} />
            <View style={styles.logoGlow} />
          </View>

          <ThemedText variant="h1" color={GOLD} style={styles.title}>
            万古长夜
          </ThemedText>

          <ThemedText variant="label" color={theme.textSecondary} style={styles.subtitle}>
            国风粒子卡牌 · AI 智能创作
          </ThemedText>

          {/* 玩家信息 */}
          {player && (
            <View style={[styles.playerCard, { backgroundColor: theme.backgroundDefault }]}>
              <View style={styles.playerInfo}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <FontAwesome6 name="user" size={20} color="#FFF" />
                </View>
                <View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {player.nickname || '修士'}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    Lv.{player.level} · {player.wins}胜 {player.losses}负
                  </ThemedText>
                </View>
              </View>

              <View style={styles.currencyRow}>
                <View style={styles.currencyItem}>
                  <FontAwesome6 name="coins" size={12} color={GOLD} />
                  <ThemedText variant="caption" color={GOLD}>{player.gold || 0}</ThemedText>
                </View>
                <View style={styles.currencyItem}>
                  <FontAwesome6 name="gem" size={12} color="#E91E63" />
                  <ThemedText variant="caption" color="#E91E63">{player.gems || 0}</ThemedText>
                </View>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* 主菜单 */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => item.route && router.push(item.route)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuCardGradient}
              >
                <View style={styles.menuIcon}>
                  <FontAwesome6 name={item.icon as any} size={28} color="#FFF" />
                </View>
                
                <View style={styles.menuContent}>
                  <ThemedText variant="smallMedium" color="#FFF">
                    {item.title}
                  </ThemedText>
                  <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                    {item.subtitle}
                  </ThemedText>
                </View>
                
                <FontAwesome6 name="chevron-right" size={14} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* 活动公告 */}
        <View style={styles.announcementSection}>
          <LinearGradient
            colors={[`${theme.primary}40`, `${theme.accent}40`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.announcementCard}
          >
            <FontAwesome6 name="bullhorn" size={16} color={GOLD} />
            <ThemedText variant="small" color={theme.textPrimary} style={{ marginLeft: 10, flex: 1 }}>
              新手福利：首次登录送10连抽！
            </ThemedText>
            <TouchableOpacity>
              <ThemedText variant="captionMedium" color={GOLD}>领取</ThemedText>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 底部 */}
        <View style={styles.footer}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            Powered by G open · AI Game Platform
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
