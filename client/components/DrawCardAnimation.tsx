/**
 * 抽卡动画组件 - 开箱效果
 * 
 * 效果：
 * - 卡牌从卡包飞出
 * - 旋转放大动画
 * - 根据品级显示不同光效
 * - 稀有卡牌特殊动画
 */

import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Image, Modal, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from './ThemedText';
import { FontAwesome6 } from '@expo/vector-icons';
import { ParticleSystem, PARTICLE_PRESETS } from './ParticleSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
}

interface DrawCardAnimationProps {
  visible: boolean;
  cards: Card[];
  onComplete: () => void;
}

// 品级配置
const RARITY_CONFIG: Record<string, {
  color: string;
  glowColor: string;
  particles: 'low' | 'medium' | 'high';
  delay: number;
}> = {
  '凡品': { color: '#808080', glowColor: 'rgba(128, 128, 128, 0.3)', particles: 'low', delay: 0 },
  '灵品': { color: '#2ECC71', glowColor: 'rgba(46, 204, 113, 0.4)', particles: 'medium', delay: 200 },
  '仙品': { color: '#3498DB', glowColor: 'rgba(52, 152, 219, 0.5)', particles: 'medium', delay: 400 },
  '圣品': { color: '#9B59B6', glowColor: 'rgba(155, 89, 182, 0.6)', particles: 'high', delay: 600 },
  '万古品': { color: '#D4AF37', glowColor: 'rgba(212, 175, 55, 0.8)', particles: 'high', delay: 800 },
};

const SingleCardReveal: React.FC<{
  card: Card;
  index: number;
  onRevealComplete: () => void;
}> = ({ card, index, onRevealComplete }) => {
  const rarityConfig = RARITY_CONFIG[card.rarity] || RARITY_CONFIG['凡品'];
  
  // 动画值
  const scale = useSharedValue(0.3);
  const rotateY = useSharedValue(180);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    // 卡牌飞入
    translateY.value = withDelay(
      index * 300,
      withSpring(0, { damping: 12, stiffness: 100 })
    );

    // 缩放动画
    scale.value = withDelay(
      index * 300,
      withSequence(
        withSpring(1.1, { damping: 8 }),
        withTiming(1, { duration: 200 })
      )
    );

    // 翻转动画
    rotateY.value = withDelay(
      index * 300 + 500,
      withTiming(0, { duration: 600, easing: Easing.inOut(Easing.quad) })
    );

    // 透明度
    opacity.value = withDelay(
      index * 300,
      withTiming(1, { duration: 300 })
    );

    // 光效闪烁（仅稀有卡牌）
    if (card.rarity === '圣品' || card.rarity === '万古品') {
      glowOpacity.value = withDelay(
        index * 300 + 800,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0.3, { duration: 500 })
          ),
          -1,
          true
        )
      );
    }

    // 完成回调
    const timeout = setTimeout(onRevealComplete, index * 300 + 2000);
    return () => clearTimeout(timeout);
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.cardContainer}>
      {/* 光效背景 */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            backgroundColor: rarityConfig.glowColor,
          },
          glowAnimatedStyle,
        ]}
      />

      {/* 卡牌 */}
      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        {/* 卡牌正面 */}
        <Image
          source={{ uri: card.image_url }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        
        {/* 稀有度标识 */}
        <View style={[styles.rarityBadge, { backgroundColor: rarityConfig.color }]}>
          <ThemedText style={styles.rarityText}>{card.rarity}</ThemedText>
        </View>

        {/* 卡牌名称 */}
        <View style={styles.cardNameContainer}>
          <ThemedText style={styles.cardName}>{card.name}</ThemedText>
          <ThemedText style={styles.cardFaction}>{card.faction}</ThemedText>
        </View>

        {/* 属性 */}
        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <FontAwesome6 name="hand-fist" size={8} color="#FF6B6B" />
            <ThemedText style={styles.cardStatText}>{card.attack}</ThemedText>
          </View>
          <View style={styles.cardStat}>
            <FontAwesome6 name="shield-halved" size={8} color="#4ECDC4" />
            <ThemedText style={styles.cardStatText}>{card.defense}</ThemedText>
          </View>
          <View style={styles.cardStat}>
            <FontAwesome6 name="heart" size={8} color="#FF6B9D" />
            <ThemedText style={styles.cardStatText}>{card.hp}</ThemedText>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// 确认按钮组件
const ConfirmButton: React.FC<{
  visible: boolean;
  onComplete: () => void;
}> = ({ visible, onComplete }) => {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity style={styles.confirmButton} onPress={onComplete}>
        <ThemedText style={styles.confirmText}>确认</ThemedText>
      </TouchableOpacity>
    </Animated.View>
  );
};

// 内部模态框组件 - 管理 revealed 状态
const ModalContent: React.FC<{
  cards: Card[];
  onComplete: () => void;
}> = ({ cards, onComplete }) => {
  const [revealedCount, setRevealedCount] = useState(0);
  const allRevealed = revealedCount >= cards.length;

  const handleRevealComplete = () => {
    setRevealedCount(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      {/* 背景粒子 */}
      <ParticleSystem
        config={PARTICLE_PRESETS.wangu}
        intensity="high"
      />

      {/* 标题 */}
      <ThemedText style={styles.title}>获得新卡</ThemedText>

      {/* 卡牌展示区 */}
      <View style={styles.cardsArea}>
        {cards.map((card, index) => (
          <SingleCardReveal
            key={card.id}
            card={card}
            index={index}
            onRevealComplete={handleRevealComplete}
          />
        ))}
      </View>

      {/* 确认按钮 */}
      <ConfirmButton visible={allRevealed} onComplete={onComplete} />
    </View>
  );
};

export const DrawCardAnimation: React.FC<DrawCardAnimationProps> = ({
  visible,
  cards,
  onComplete,
}) => {
  if (!visible || cards.length === 0) return null;

  // 使用 visible 作为 key，每次打开时重新挂载组件
  return (
    <Modal visible={visible} transparent animationType="fade">
      <ModalContent 
        key={visible ? 'open' : 'closed'}
        cards={cards} 
        onComplete={onComplete} 
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.6)',
    letterSpacing: 3,
    marginBottom: 30,
    textTransform: 'uppercase',
  },
  cardsArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  cardContainer: {
    width: 160,
    height: 224,
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 264,
    borderRadius: 20,
    left: -20,
    top: -20,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  cardImage: {
    width: '100%',
    height: '60%',
    backgroundColor: '#2a2a2a',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  cardNameContainer: {
    padding: 8,
    alignItems: 'center',
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  cardFaction: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});

export default DrawCardAnimation;
