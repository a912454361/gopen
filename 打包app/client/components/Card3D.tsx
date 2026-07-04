/**
 * 3D卡牌组件 - 使用透视变换实现3D效果
 */
import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 卡牌稀有度配置
const RARITY_CONFIG = {
  凡品: { color: '#9CA3AF', glow: '#9CA3AF20', stars: 1 },
  灵品: { color: '#3B82F6', glow: '#3B82F640', stars: 2 },
  仙品: { color: '#8B5CF6', glow: '#8B5CF640', stars: 3 },
  圣品: { color: '#F59E0B', glow: '#F59E0B40', stars: 4 },
  万古品: { color: '#D4AF37', glow: '#D4AF3760', stars: 5 },
};

// 阵营配置
const FACTION_CONFIG = {
  幽冥: { color: '#8B5CF6', icon: 'moon', bg: ['#1E1B4B', '#312E81'] },
  昆仑: { color: '#4FC3F7', icon: 'snowflake', bg: ['#0C4A6E', '#0369A1'] },
  蓬莱: { color: '#F8BBD9', icon: 'flower-tulip', bg: ['#831843', '#9D174D'] },
  蛮荒: { color: '#FF6F00', icon: 'fire', bg: ['#7C2D12', '#9A3412'] },
  万古: { color: '#D4AF37', icon: 'sun', bg: ['#713F12', '#854D0E'] },
};

interface Card3DProps {
  card: {
    id: string;
    name: string;
    faction: keyof typeof FACTION_CONFIG;
    rarity: keyof typeof RARITY_CONFIG;
    attack: number;
    defense: number;
    hp: number;
    skill: string;
    cost: number;
    image?: string;
  };
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  selected?: boolean;
  animated?: boolean;
}

export function Card3D({
  card,
  size = 'medium',
  onPress,
  selected = false,
  animated = true,
}: Card3DProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const rotateXAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const factionConfig = FACTION_CONFIG[card.faction];
  const rarityConfig = RARITY_CONFIG[card.rarity];

  // 尺寸配置
  const cardSize = useMemo(() => {
    switch (size) {
      case 'small':
        return { width: 120, height: 160 };
      case 'large':
        return { width: 240, height: 320 };
      default:
        return { width: 180, height: 240 };
    }
  }, [size]);

  // 3D透视变换
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { moveX, moveY } = gestureState;
        const centerX = cardSize.width / 2;
        const centerY = cardSize.height / 2;
        
        // 计算旋转角度
        const rotateY = ((moveX - centerX) / centerX) * 15;
        const rotateX = ((moveY - centerY) / centerY) * -15;
        
        setRotation({ x: rotateX, y: rotateY });
        rotateXAnim.setValue(rotateX);
        rotateYAnim.setValue(rotateY);
      },
      onPanResponderRelease: () => {
        // 回弹动画
        Animated.parallel([
          Animated.spring(rotateXAnim, { toValue: 0, useNativeDriver: true }),
          Animated.spring(rotateYAnim, { toValue: 0, useNativeDriver: true }),
        ]).start();
        setRotation({ x: 0, y: 0 });
      },
    })
  ).current;

  // 选中动画
  useEffect(() => {
    if (selected) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
      glowAnim.setValue(0);
    }
  }, [selected]);

  // 入场动画
  useEffect(() => {
    if (animated) {
      scaleAnim.setValue(0.8);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  // 3D变换样式
  const transformStyle = useMemo(() => {
    if (Platform.OS === 'web') {
      return {
        transform: [
          { perspective: 1000 },
          { rotateX: `${rotation.x}deg` },
          { rotateY: `${rotation.y}deg` },
          { scale: selected ? 1.1 : 1 },
        ],
        boxShadow: selected
          ? `0 0 40px ${factionConfig.color}80, 0 0 80px ${factionConfig.color}40`
          : `0 10px 30px rgba(0,0,0,0.5)`,
      };
    }
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: rotateXAnim },
        { rotateY: rotateYAnim },
        { scale: scaleAnim },
      ],
    };
  }, [rotation, selected, factionConfig.color, Platform.OS]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          { width: cardSize.width, height: cardSize.height },
          transformStyle,
        ]}
      >
        {/* 卡牌背景 */}
        <LinearGradient
          colors={factionConfig.bg as [string, string]}
          style={styles.cardBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* 发光边框 */}
          <View
            style={[
              styles.glowBorder,
              { borderColor: factionConfig.color },
            ]}
          />

          {/* 卡牌头部 - 阵营图标 */}
          <View style={styles.cardHeader}>
            <View style={[styles.factionIcon, { backgroundColor: `${factionConfig.color}30` }]}>
              <FontAwesome6 name={factionConfig.icon as any} size={20} color={factionConfig.color} />
            </View>
            <View style={styles.costBadge}>
              <FontAwesome6 name="diamond" size={10} color={factionConfig.color} />
              <Text style={[styles.costText, { color: factionConfig.color }]}>{card.cost}</Text>
            </View>
          </View>

          {/* 卡牌图像区域 - 3D粒子效果 */}
          <View style={styles.imageContainer}>
            <View style={[styles.imagePlaceholder, { backgroundColor: `${factionConfig.color}20` }]}>
              {/* 模拟3D粒子卡面 */}
              <FontAwesome6 name="dragon" size={size === 'large' ? 64 : 40} color={factionConfig.color} />
            </View>
            
            {/* 稀有度星星 */}
            <View style={styles.starsContainer}>
              {Array.from({ length: rarityConfig.stars }).map((_, i) => (
                <FontAwesome6
                  key={i}
                  name="star"
                  size={size === 'large' ? 12 : 8}
                  color={rarityConfig.color}
                />
              ))}
            </View>
          </View>

          {/* 卡牌信息 */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {card.name}
            </Text>
            
            <View style={styles.skillContainer}>
              <FontAwesome6 name="bolt" size={10} color={factionConfig.color} />
              <Text style={styles.skillText} numberOfLines={1}>
                {card.skill}
              </Text>
            </View>
          </View>

          {/* 属性栏 */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <FontAwesome6 name="sword" size={10} color="#EF4444" />
              <Text style={styles.statText}>{card.attack}</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="shield" size={10} color="#3B82F6" />
              <Text style={styles.statText}>{card.defense}</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="heart" size={10} color="#10B981" />
              <Text style={styles.statText}>{card.hp}</Text>
            </View>
          </View>

          {/* 稀有度标识 */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityConfig.color }]}>
            <Text style={styles.rarityText}>{card.rarity}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardBackground: {
    flex: 1,
    padding: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  costText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    marginVertical: 8,
    position: 'relative',
  },
  imagePlaceholder: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  starsContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 2,
  },
  cardInfo: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  skillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  skillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 6,
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
