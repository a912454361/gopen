/**
 * 卡牌翻转组件 - 3D翻转效果
 * 
 * 效果：
 * - 点击卡牌翻转显示详情
 * - 流畅的3D翻转动画
 * - 支持粒子特效背景
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';
import { ParticleSystem, PARTICLE_PRESETS } from './ParticleSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 80) / 2;

interface Card {
  id: string;
  name: string;
  description: string;
  faction: string;
  rarity: string;
  card_type: string;
  attack: number;
  defense: number;
  hp: number;
  cost: number;
  skill_name: string;
  skill_description: string;
  image_url: string;
  particle_config?: any;
}

interface FlippableCardProps {
  card: Card;
  onPress?: () => void;
  showParticles?: boolean;
}

// 品级颜色
const RARITY_COLORS: Record<string, string> = {
  '凡品': '#808080',
  '灵品': '#2ECC71',
  '仙品': '#3498DB',
  '圣品': '#9B59B6',
  '万古品': '#D4AF37',
};

// 阵营粒子预设映射
const FACTION_PARTICLE_MAP: Record<string, string> = {
  '幽冥': 'youming',
  '昆仑': 'kunlun',
  '蓬莱': 'penglai',
  '蛮荒': 'manhuang',
  '万古': 'wangu',
};

export const FlippableCard: React.FC<FlippableCardProps> = ({
  card,
  onPress,
  showParticles = true,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotateY = useSharedValue(0);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    rotateY.value = withSequence(
      withTiming(90, { duration: 200, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 200, easing: Easing.inOut(Easing.quad) })
    );
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotation = rotateY.value;
    const opacity = interpolate(
      rotation,
      [0, 45, 90],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      rotation,
      [0, 90],
      [1, 0.9],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation}deg` },
        { scale },
      ],
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotation = rotateY.value;
    const opacity = interpolate(
      rotation,
      [0, 45, 90],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      rotation,
      [0, 90],
      [0.9, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotation + 180}deg` },
        { scale },
      ],
    };
  });

  const rarityColor = RARITY_COLORS[card.rarity] || '#808080';
  const particlePreset = FACTION_PARTICLE_MAP[card.faction] || 'wangu';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        handleFlip();
        onPress?.();
      }}
      activeOpacity={0.9}
    >
      {/* 粒子特效 */}
      {showParticles && (
        <ParticleSystem
          config={PARTICLE_PRESETS[particlePreset]}
          intensity="low"
        />
      )}

      {/* 卡牌正面 */}
      <Animated.View style={[styles.card, { borderColor: rarityColor }, frontAnimatedStyle]}>
        <Image
          source={{ uri: card.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.overlay} />
        
        {/* 费用徽章 */}
        <View style={[styles.costBadge, { backgroundColor: '#D4AF37' }]}>
          <ThemedText style={styles.costText}>{card.cost}</ThemedText>
        </View>

        {/* 品级徽章 */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
          <ThemedText style={styles.rarityText}>{card.rarity}</ThemedText>
        </View>

        {/* 名称 */}
        <View style={styles.nameContainer}>
          <ThemedText style={styles.name}>{card.name}</ThemedText>
          <ThemedText style={styles.faction}>{card.faction}</ThemedText>
        </View>

        {/* 属性 */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <FontAwesome6 name="hand-fist" size={10} color="#FF6B6B" />
            <ThemedText style={styles.statValue}>{card.attack}</ThemedText>
          </View>
          <View style={styles.stat}>
            <FontAwesome6 name="shield-halved" size={10} color="#4ECDC4" />
            <ThemedText style={styles.statValue}>{card.defense}</ThemedText>
          </View>
          <View style={styles.stat}>
            <FontAwesome6 name="heart" size={10} color="#FF6B9D" />
            <ThemedText style={styles.statValue}>{card.hp}</ThemedText>
          </View>
        </View>
      </Animated.View>

      {/* 卡牌背面 */}
      <Animated.View style={[styles.card, styles.cardBack, { borderColor: rarityColor }, backAnimatedStyle]}>
        <ThemedText style={styles.detailTitle}>{card.name}</ThemedText>
        <ThemedText style={styles.detailDesc}>{card.description}</ThemedText>
        
        <View style={styles.divider} />
        
        <View style={styles.skillSection}>
          <FontAwesome6 name="wand-magic-sparkles" size={14} color="#D4AF37" />
          <ThemedText style={styles.skillName}>{card.skill_name}</ThemedText>
        </View>
        <ThemedText style={styles.skillDesc}>{card.skill_description}</ThemedText>

        <View style={styles.detailStats}>
          <View style={styles.detailStat}>
            <ThemedText style={styles.detailStatLabel}>攻击</ThemedText>
            <ThemedText style={[styles.detailStatValue, { color: '#FF6B6B' }]}>{card.attack}</ThemedText>
          </View>
          <View style={styles.detailStat}>
            <ThemedText style={styles.detailStatLabel}>防御</ThemedText>
            <ThemedText style={[styles.detailStatValue, { color: '#4ECDC4' }]}>{card.defense}</ThemedText>
          </View>
          <View style={styles.detailStat}>
            <ThemedText style={styles.detailStatLabel}>生命</ThemedText>
            <ThemedText style={[styles.detailStatValue, { color: '#FF6B9D' }]}>{card.hp}</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.hint}>点击翻回</ThemedText>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#111111',
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardBack: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '70%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  costBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFF',
  },
  nameContainer: {
    position: 'absolute',
    bottom: 40,
    left: 12,
    right: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FAF8F5',
    marginBottom: 2,
  },
  faction: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stats: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FAF8F5',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FAF8F5',
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    marginVertical: 8,
  },
  skillSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  skillName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4AF37',
  },
  skillDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 12,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

export default FlippableCard;
