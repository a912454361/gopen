/**
 * 万古长夜 - 首页
 * 高级 UI 设计，沉浸式体验
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EXPO_PUBLIC_GOPEN_API = process.env.EXPO_PUBLIC_GOPEN_API || 'https://gopen.com.cn/api/v1';

interface PlayerStats {
  nickname: string;
  level: number;
  gold: number;
  gems: number;
  wins: number;
  losses: number;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [player, setPlayer] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerData();
  }, []);

  const loadPlayerData = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_GOPEN_API}/ink/player/home_player`);
      const data = await response.json();
      setPlayer(data.player || {
        nickname: '修士',
        level: 1,
        gold: 1000,
        gems: 100,
        wins: 0,
        losses: 0,
      });
    } catch (error) {
      console.error('加载玩家数据失败:', error);
      setPlayer({
        nickname: '修士',
        level: 1,
        gold: 1000,
        gems: 100,
        wins: 0,
        losses: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: 'battle',
      title: '即刻对战',
      subtitle: '匹配对手，争夺荣耀',
      icon: 'swords',
      color: '#E74C3C',
      onPress: () => router.push('/battle'),
    },
    {
      id: 'cloud',
      title: '云游戏',
      subtitle: '流畅体验，无需下载',
      icon: 'cloud',
      color: '#3498DB',
      onPress: () => router.push('/cloud'),
    },
    {
      id: 'collection',
      title: '卡牌收藏',
      subtitle: '查看你的卡组',
      icon: 'layer-group',
      color: '#9B59B6',
      onPress: () => router.push('/collection'),
    },
    {
      id: 'shop',
      title: '神秘商店',
      subtitle: '抽卡、礼包、特惠',
      icon: 'store',
      color: '#F39C12',
      onPress: () => router.push('/shop'),
    },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {/* Hero 区域 */}
        <LinearGradient
          colors={['#1A1A2E', '#0A0A0F']}
          style={styles.heroSection}
        >
          {/* Logo 和标题 */}
          <View style={styles.heroContent}>
            <View style={styles.logoContainer}>
              <FontAwesome6 name="moon" size={32} color={theme.gold} />
            </View>
            
            <ThemedText variant="h1" color={theme.gold} style={styles.title}>
              万古长夜
            </ThemedText>
            
            <ThemedText variant="label" color={theme.textSecondary} style={styles.subtitle}>
              国风粒子卡牌 · AI 智能创作
            </ThemedText>
          </View>

          {/* 玩家信息卡 */}
          {player && (
            <View style={[styles.playerCard, { backgroundColor: theme.backgroundCard }]}>
              <View style={styles.playerInfo}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <FontAwesome6 name="user" size={20} color="#FFF" />
                </View>
                <View style={styles.playerDetails}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {player.nickname}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    Lv.{player.level} · {player.wins}胜 {player.losses}负
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.currencyRow}>
                <View style={styles.currencyItem}>
                  <FontAwesome6 name="coins" size={12} color={theme.gold} />
                  <ThemedText variant="tiny" color={theme.gold}>{player.gold}</ThemedText>
                </View>
                <View style={styles.currencyItem}>
                  <FontAwesome6 name="gem" size={12} color="#E91E63" />
                  <ThemedText variant="tiny" color="#E91E63">{player.gems}</ThemedText>
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
              style={[styles.menuCard, { backgroundColor: theme.backgroundCard }]}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <FontAwesome6 name={item.icon as any} size={24} color={item.color} />
              </View>
              
              <View style={styles.menuContent}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {item.title}
                </ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>
                  {item.subtitle}
                </ThemedText>
              </View>
              
              <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 活动公告 */}
        <View style={styles.announcementSection}>
          <LinearGradient
            colors={[theme.primary + '40', theme.accent + '40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.announcementCard}
          >
            <FontAwesome6 name="bullhorn" size={16} color={theme.gold} />
            <ThemedText variant="small" color={theme.textPrimary} style={{ marginLeft: 10, flex: 1 }}>
              新手福利：首次登录送10连抽！
            </ThemedText>
            <TouchableOpacity>
              <ThemedText variant="tinyMedium" color={theme.gold}>领取</ThemedText>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* 底部信息 */}
        <View style={styles.footer}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            Powered by G open · AI Game Platform
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
