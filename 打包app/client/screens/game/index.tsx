/**
 * 游戏主页面 - 3D粒子卡牌游戏
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Particle3DEngine } from '@/components/Particle3DEngine';
import { Card3D } from '@/components/Card3D';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 金色主题
const GOLD = '#D4AF37';

// 五大阵营
const FACTIONS = [
  { id: 'youming', name: '幽冥', color: '#8B5CF6', icon: 'moon' },
  { id: 'kunlun', name: '昆仑', color: '#4FC3F7', icon: 'snowflake' },
  { id: 'penglai', name: '蓬莱', color: '#F8BBD9', icon: 'flower-tulip' },
  { id: 'manhuang', name: '蛮荒', color: '#FF6F00', icon: 'fire' },
  { id: 'wangu', name: '万古', color: '#D4AF37', icon: 'sun' },
];

// 示例卡牌数据
const SAMPLE_CARDS = [
  { id: 'ym001', name: '幽冥鬼将', faction: '幽冥' as const, rarity: '仙品' as const, attack: 85, defense: 60, hp: 120, skill: '鬼影突袭', cost: 4 },
  { id: 'ym002', name: '黄泉引路人', faction: '幽冥' as const, rarity: '灵品' as const, attack: 65, defense: 70, hp: 90, skill: '彼岸花开', cost: 3 },
  { id: 'ym003', name: '幽冥女皇', faction: '幽冥' as const, rarity: '圣品' as const, attack: 120, defense: 80, hp: 150, skill: '冥界降临', cost: 7 },
  { id: 'kl001', name: '昆仑剑仙', faction: '昆仑' as const, rarity: '仙品' as const, attack: 95, defense: 50, hp: 100, skill: '剑气纵横', cost: 4 },
  { id: 'kl002', name: '雪山圣女', faction: '昆仑' as const, rarity: '灵品' as const, attack: 70, defense: 75, hp: 85, skill: '冰封万里', cost: 3 },
  { id: 'kl003', name: '昆仑道祖', faction: '昆仑' as const, rarity: '圣品' as const, attack: 130, defense: 70, hp: 140, skill: '大道无形', cost: 7 },
  { id: 'pl001', name: '蓬莱仙子', faction: '蓬莱' as const, rarity: '仙品' as const, attack: 75, defense: 80, hp: 95, skill: '仙乐飘飘', cost: 4 },
  { id: 'pl002', name: '桃花妖', faction: '蓬莱' as const, rarity: '灵品' as const, attack: 55, defense: 65, hp: 80, skill: '花语祝福', cost: 2 },
  { id: 'mh001', name: '蛮荒战神', faction: '蛮荒' as const, rarity: '仙品' as const, attack: 100, defense: 60, hp: 130, skill: '狂暴冲锋', cost: 5 },
  { id: 'wg001', name: '万古金仙', faction: '万古' as const, rarity: '仙品' as const, attack: 90, defense: 85, hp: 110, skill: '金光普照', cost: 5 },
  { id: 'wg002', name: '万古至尊', faction: '万古' as const, rarity: '万古品' as const, attack: 150, defense: 100, hp: 180, skill: '永恒之怒', cost: 10 },
];

export default function GameScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<'menu' | 'cards' | 'battle'>('menu');

  // 2K粒子动画
  useEffect(() => {
    if (Platform.OS === 'web' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 粒子系统
      const particles: any[] = [];
      const PARTICLE_COUNT = 2048; // 2K粒子

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * SCREEN_WIDTH,
          y: Math.random() * SCREEN_HEIGHT,
          z: Math.random() * 1000,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          vz: (Math.random() - 0.5) * 2,
          size: Math.random() * 2 + 0.5,
          color: GOLD,
          alpha: Math.random() * 0.5 + 0.3,
        });
      }

      let animationId: number;

      const animate = () => {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          if (p.x < 0) p.x = SCREEN_WIDTH;
          if (p.x > SCREEN_WIDTH) p.x = 0;
          if (p.y < 0) p.y = SCREEN_HEIGHT;
          if (p.y > SCREEN_HEIGHT) p.y = 0;
          if (p.z < 0 || p.z > 1000) p.vz *= -1;

          const perspective = 800;
          const scale = perspective / (perspective + p.z);
          const screenX = (p.x - SCREEN_WIDTH / 2) * scale + SCREEN_WIDTH / 2;
          const screenY = (p.y - SCREEN_HEIGHT / 2) * scale + SCREEN_HEIGHT / 2;

          ctx.beginPath();
          ctx.arc(screenX, screenY, p.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha * scale})`;
          ctx.fill();
        }

        animationId = requestAnimationFrame(animate);
      };

      animate();

      return () => cancelAnimationFrame(animationId);
    }
  }, []);

  // 过滤卡牌
  const filteredCards = useMemo(() => {
    if (!selectedFaction) return SAMPLE_CARDS;
    const factionName = FACTIONS.find(f => f.id === selectedFaction)?.name;
    return SAMPLE_CARDS.filter(c => c.faction === factionName);
  }, [selectedFaction]);

  return (
    <Screen backgroundColor="#0A0A0F" statusBarStyle="light">
      {/* 3D粒子背景 */}
      {Platform.OS === 'web' && (
        <canvas
          ref={canvasRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            zIndex: 0,
          }}
        />
      )}

      {/* 主内容 */}
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* 顶部栏 */}
        <View style={styles.topBar}>
          <View style={styles.logoContainer}>
            <FontAwesome6 name="dragon" size={28} color={GOLD} />
            <ThemedText variant="h2" weight="bold" color={GOLD}>
              万古长夜
            </ThemedText>
          </View>

          <View style={styles.playerInfo}>
            <View style={styles.avatar}>
              <FontAwesome6 name="user" size={16} color="#000" />
            </View>
            <View>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>
                修士
              </ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>
                Lv.1 · 0胜 0负
              </ThemedText>
            </View>
          </View>

          <View style={styles.currencyRow}>
            <View style={styles.currencyItem}>
              <FontAwesome6 name="coins" size={14} color={GOLD} />
              <ThemedText variant="caption" color={GOLD}>10,000</ThemedText>
            </View>
            <View style={styles.currencyItem}>
              <FontAwesome6 name="gem" size={14} color="#E91E63" />
              <ThemedText variant="caption" color="#E91E63">100</ThemedText>
            </View>
          </View>
        </View>

        {/* 阵营选择 */}
        <View style={styles.factionBar}>
          {FACTIONS.map((faction) => (
            <TouchableOpacity
              key={faction.id}
              style={[
                styles.factionButton,
                selectedFaction === faction.id && {
                  backgroundColor: `${faction.color}30`,
                  borderColor: faction.color,
                },
              ]}
              onPress={() => setSelectedFaction(selectedFaction === faction.id ? null : faction.id)}
            >
              <FontAwesome6 name={faction.icon as any} size={20} color={faction.color} />
              <ThemedText variant="caption" weight="medium" color={faction.color}>
                {faction.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 卡牌展示区 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {filteredCards.map((card) => (
            <View key={card.id} style={styles.cardWrapper}>
              <Card3D
                card={card}
                size="medium"
                selected={selectedCard === card.id}
                onPress={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
              />
            </View>
          ))}
        </ScrollView>

        {/* 功能按钮 */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={[GOLD, '#B8860B']}
              style={styles.actionButtonGradient}
            >
              <FontAwesome6 name="swords" size={20} color="#000" />
              <ThemedText variant="label" weight="bold" color="#000">开始对战</ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.actionButtonGradient}
            >
              <FontAwesome6 name="box-open" size={20} color="#FFF" />
              <ThemedText variant="label" weight="bold" color="#FFF">抽卡</ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.actionButtonGradient}
            >
              <FontAwesome6 name="cloud" size={20} color="#FFF" />
              <ThemedText variant="label" weight="bold" color="#FFF">云游戏</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 底部信息 */}
        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            3D粒子渲染: 2048 particles · 60 FPS · {selectedFaction ? FACTIONS.find(f => f.id === selectedFaction)?.name : '全部阵营'}
          </ThemedText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  factionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  factionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardsContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  cardWrapper: {
    marginHorizontal: Spacing.sm,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});
