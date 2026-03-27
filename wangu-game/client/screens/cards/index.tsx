/**
 * 卡牌收藏页面
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ParticleBackground } from '@/components/ParticleBackground';
import { useTheme } from '@/hooks/useTheme';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const GOLD = '#D4AF37';

const FACTIONS = [
  { id: 'all', name: '全部', color: GOLD },
  { id: 'youming', name: '幽冥', color: '#8B5CF6' },
  { id: 'kunlun', name: '昆仑', color: '#4FC3F7' },
  { id: 'penglai', name: '蓬莱', color: '#F8BBD9' },
  { id: 'manhuang', name: '蛮荒', color: '#FF6F00' },
  { id: 'wangu', name: '万古', color: GOLD },
];

const CARDS = [
  { id: '1', name: '暗夜剑尊', faction: 'youming', rarity: 'SSR', power: 9800, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400' },
  { id: '2', name: '冰心仙子', faction: 'kunlun', rarity: 'SSR', power: 9500, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
  { id: '3', name: '桃花仙子', faction: 'penglai', rarity: 'SR', power: 8200, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400' },
  { id: '4', name: '烈焰战神', faction: 'manhuang', rarity: 'SSR', power: 9900, image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400' },
  { id: '5', name: '万古至尊', faction: 'wangu', rarity: 'UR', power: 12000, image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400' },
  { id: '6', name: '幽冥鬼将', faction: 'youming', rarity: 'SR', power: 8500, image: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400' },
];

const RARITY_COLORS: Record<string, string> = {
  'UR': '#FFD700',
  'SSR': '#FF6B6B',
  'SR': '#9B59B6',
  'R': '#3498DB',
  'N': '#95A5A6',
};

export default function CardsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [selectedFaction, setSelectedFaction] = useState('all');

  const filteredCards = selectedFaction === 'all' ? CARDS : CARDS.filter(c => c.faction === selectedFaction);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ParticleBackground intensity="low" />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.header}>
          <ThemedText variant="h2" weight="bold" color={GOLD}>卡牌收藏</ThemedText>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText variant="h3" weight="bold" color={GOLD}>{CARDS.length}</ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>卡牌总数</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          {FACTIONS.map((faction) => (
            <TouchableOpacity
              key={faction.id}
              style={[styles.filterChip, { borderColor: faction.color }, selectedFaction === faction.id && { backgroundColor: `${faction.color}20` }]}
              onPress={() => setSelectedFaction(faction.id)}
            >
              <ThemedText variant="tiny" color={selectedFaction === faction.id ? faction.color : theme.textSecondary}>
                {faction.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cardGrid}>
          {filteredCards.map((card) => (
            <TouchableOpacity key={card.id} style={[styles.card, { borderColor: RARITY_COLORS[card.rarity] }]}>
              <Image source={{ uri: card.image }} style={{ width: '100%', aspectRatio: 3/4 }} resizeMode="cover" />
              <View style={styles.cardInfo}>
                <ThemedText variant="small" weight="semibold">{card.name}</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>战力 {card.power.toLocaleString()}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
