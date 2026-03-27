/**
 * 游戏首页 - 万古长夜
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ParticleBackground } from '@/components/ParticleBackground';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 金色主题色
const GOLD = '#D4AF37';

// 五大阵营数据
const FACTIONS = [
  { 
    id: 'youming', 
    name: '幽冥', 
    subtitle: '深紫幽暗',
    color: '#8B5CF6', 
    icon: 'moon',
    description: '魂火水墨'
  },
  { 
    id: 'kunlun', 
    name: '昆仑', 
    subtitle: '冰雪天青',
    color: '#4FC3F7', 
    icon: 'snowflake',
    description: '流云剑气'
  },
  { 
    id: 'penglai', 
    name: '蓬莱', 
    subtitle: '粉霞仙气',
    color: '#F8BBD9', 
    icon: 'flower-tulip',
    description: '花瓣云雾'
  },
  { 
    id: 'manhuang', 
    name: '蛮荒', 
    subtitle: '烈焰狂野',
    color: '#FF6F00', 
    icon: 'fire',
    description: '火焰星尘'
  },
  { 
    id: 'wangu', 
    name: '万古', 
    subtitle: '金光永恒',
    color: '#D4AF37', 
    icon: 'sun',
    description: '星尘光点'
  },
];

// 菜单项
const MENU_ITEMS = [
  {
    id: 'cloud',
    title: '云游戏',
    subtitle: '无需下载，即刻畅玩',
    icon: 'cloud',
    gradient: ['#D4AF37', '#B8860B'] as [string, string],
    route: '/cloud-play',
  },
  {
    id: 'battle',
    title: '即刻对战',
    subtitle: '匹配对手，争夺荣耀',
    icon: 'swords',
    gradient: ['#EF4444', '#DC2626'] as [string, string],
    route: '/battle',
  },
  {
    id: 'cards',
    title: '卡牌收藏',
    subtitle: '查看你的卡组',
    icon: 'layer-group',
    gradient: ['#8B5CF6', '#7C3AED'] as [string, string],
    route: '/cards',
  },
  {
    id: 'recharge',
    title: '充值中心',
    subtitle: '上线送10000元 · 0.05折',
    icon: 'wallet',
    gradient: ['#F59E0B', '#D97706'] as [string, string],
    route: '/recharge',
  },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [player, setPlayer] = useState<any>(null);
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      let playerId = await AsyncStorage.getItem('wangu_player_id');
      if (!playerId) {
        playerId = `wangu_${Date.now()}`;
        await AsyncStorage.setItem('wangu_player_id', playerId);
      }

      // 尝试从后端获取玩家数据
      try {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/player/${playerId}`);
        const data = await response.json();
        setPlayer(data.player);
      } catch (e) {
        // 使用默认数据
        setPlayer({
          id: playerId,
          nickname: '修士',
          level: 1,
          gold: 10000,
          gems: 100,
          wins: 0,
          losses: 0,
          vouchers: 10000,
        });
      }
    } catch (error) {
      console.error('加载玩家数据失败:', error);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* 金色粒子背景 */}
      <ParticleBackground intensity="medium" />
      
      {/* 渐变背景层 */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0A0A0F',
      }}>
        <LinearGradient
          colors={['rgba(26, 26, 46, 0.8)', 'rgba(10, 10, 15, 0.9)', '#0A0A0F']}
          style={{ flex: 1 }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md }
        ]}
      >
        {/* Hero 区域 */}
        <View style={styles.heroSection}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <FontAwesome6 name="moon" size={48} color={GOLD} />
          </View>

          <ThemedText variant="hero" weight="heavy" color={GOLD} style={styles.title}>
            万古长夜
          </ThemedText>

          <ThemedText variant="small" color={theme.textSecondary} style={styles.subtitle}>
            国风粒子卡牌 · AI 智能创作
          </ThemedText>

          {/* 玩家信息 */}
          {player && (
            <View style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <View style={styles.avatar}>
                  <FontAwesome6 name="user" size={24} color="#000" />
                </View>
                <View style={styles.playerDetails}>
                  <ThemedText variant="label" weight="medium" color={theme.textPrimary}>
                    {player.nickname || '修士'}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    Lv.{player.level} · {player.wins}胜 {player.losses}负
                  </ThemedText>
                </View>
              </View>

              <View style={styles.currencyRow}>
                <View style={styles.currencyItem}>
                  <FontAwesome6 name="coins" size={14} color={GOLD} />
                  <ThemedText variant="caption" color={GOLD}>{player.gold?.toLocaleString()}</ThemedText>
                </View>
                <View style={styles.currencyItem}>
                  <FontAwesome6 name="gem" size={14} color="#E91E63" />
                  <ThemedText variant="caption" color="#E91E63">{player.gems}</ThemedText>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 主菜单 */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => router.push(item.route as any)}
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
                  <ThemedText variant="label" weight="medium" color="#FFF">
                    {item.title}
                  </ThemedText>
                  <ThemedText variant="caption" color="rgba(255,255,255,0.7)">
                    {item.subtitle}
                  </ThemedText>
                </View>
                
                <FontAwesome6 name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* 五大阵营 */}
        <View style={styles.factionSection}>
          <ThemedText variant="h3" weight="bold" color={GOLD}>
            五大阵营
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
            选择你的命运
          </ThemedText>
          
          <View style={styles.factionGrid}>
            {FACTIONS.map((faction) => (
              <TouchableOpacity
                key={faction.id}
                style={[
                  styles.factionCard,
                  { 
                    borderColor: selectedFaction === faction.id ? faction.color : theme.border,
                    backgroundColor: selectedFaction === faction.id 
                      ? `${faction.color}20` 
                      : theme.backgroundDefault,
                  }
                ]}
                onPress={() => setSelectedFaction(faction.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.factionIcon, 
                  { backgroundColor: `${faction.color}30` }
                ]}>
                  <FontAwesome6 name={faction.icon as any} size={28} color={faction.color} />
                </View>
                <ThemedText variant="small" weight="semibold" color={faction.color}>
                  {faction.name}
                </ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>
                  {faction.subtitle}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 活动公告 */}
        <View style={styles.announcementSection}>
          <View style={styles.announcementCard}>
            <FontAwesome6 name="fire" size={18} color={GOLD} />
            <ThemedText variant="small" color={theme.textPrimary} style={{ marginLeft: 12, flex: 1 }}>
              新用户福利：上线送10000元代金券！充值一律0.05折！
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/recharge' as any)}>
              <ThemedText variant="caption" weight="semibold" color={GOLD}>充值</ThemedText>
            </TouchableOpacity>
          </View>
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
