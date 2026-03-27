/**
 * 粒子系统组件 - 原生端实现
 * 使用 react-native-reanimated 动画
 */

import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 粒子配置类型（与 Web 端保持一致）
export interface ParticleConfig {
  primaryColor: string;
  secondaryColor?: string;
  particleCount: number;
  particleSize: { min: number; max: number };
  speed: { min: number; max: number };
  opacity: { min: number; max: number };
  shapes?: string[];
}

interface ParticleSystemProps {
  config: ParticleConfig;
  intensity?: 'low' | 'medium' | 'high';
  style?: any;
}

// 单个粒子组件（原生端使用 Reanimated）
interface ParticleProps {
  index: number;
  config: ParticleConfig;
  screenWidth: number;
  screenHeight: number;
}

const Particle: React.FC<ParticleProps> = ({ index, config, screenWidth, screenHeight }) => {
  // 随机生成粒子属性
  const particle = useMemo(() => {
    const size = config.particleSize.min + Math.random() * (config.particleSize.max - config.particleSize.min);
    const opacity = config.opacity.min + Math.random() * (config.opacity.max - config.opacity.min);
    const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
    
    return {
      size,
      opacity,
      speed,
      startX: Math.random() * screenWidth,
      startY: Math.random() * screenHeight,
      drift: (Math.random() - 0.5) * 100,
      duration: 3000 + Math.random() * 4000,
      delay: Math.random() * 2000,
    };
  }, [config, screenWidth, screenHeight, index]);

  // Shared values for animations
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const particleOpacity = useSharedValue(particle.opacity * 0.5);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // 浮动动画 - Y轴
    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: particle.duration * 0.25, easing: Easing.inOut(Easing.ease) }),
          withTiming(-50, { duration: particle.duration * 0.25, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: particle.duration * 0.25, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: particle.duration * 0.25, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, // 无限循环
        true // 反向
      )
    );

    // 漂移动画 - X轴
    translateX.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(particle.drift, { duration: particle.duration * 0.5, easing: Easing.inOut(Easing.ease) }),
          withTiming(-particle.drift, { duration: particle.duration * 0.5, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true
      )
    );

    // 缩放动画
    scale.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: particle.duration * 0.33, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: particle.duration * 0.33, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: particle.duration * 0.34, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true
      )
    );

    // 透明度脉冲
    particleOpacity.value = withDelay(
      particle.delay,
      withRepeat(
        withSequence(
          withTiming(particle.opacity, { duration: particle.duration * 0.25 }),
          withTiming(particle.opacity * 0.5, { duration: particle.duration * 0.25 }),
          withTiming(particle.opacity * 0.8, { duration: particle.duration * 0.25 }),
          withTiming(particle.opacity * 0.5, { duration: particle.duration * 0.25 }),
        ),
        -1,
        true
      )
    );

    // 旋转动画（慢速）
    rotation.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(360, { duration: particle.duration * 4, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [particle]);

  // 动画样式
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: particleOpacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: config.primaryColor,
          left: particle.startX,
          top: particle.startY,
        },
        animatedStyle,
      ]}
    />
  );
};

// 粒子系统主组件
export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  config,
  intensity = 'medium',
  style,
}) => {
  // 根据强度计算粒子数量
  const particleMultiplier = intensity === 'low' ? 0.5 : intensity === 'high' ? 1.5 : 1;
  const actualParticleCount = Math.floor(config.particleCount * particleMultiplier);

  // 生成粒子
  const particles = useMemo(() => {
    return Array.from({ length: actualParticleCount }, (_, index) => (
      <Particle
        key={index}
        index={index}
        config={config}
        screenWidth={SCREEN_WIDTH}
        screenHeight={SCREEN_HEIGHT}
      />
    ));
  }, [actualParticleCount, config]);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* 渐变背景层 */}
      <LinearGradient
        colors={[
          config.primaryColor + '30',
          config.secondaryColor + '15' || config.primaryColor + '15',
          'transparent',
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* 粒子层 */}
      <View style={styles.particlesContainer}>
        {particles}
      </View>
      
      {/* 光晕效果层 */}
      <View
        style={[
          styles.glowLayer,
          {
            backgroundColor: config.primaryColor + '10',
          },
        ]}
      />
      
      {/* 中心亮点 */}
      <View
        style={[
          styles.centerGlow,
          {
            backgroundColor: config.primaryColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  centerGlow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    width: 200,
    height: 200,
    marginLeft: -100,
    marginTop: -100,
    borderRadius: 100,
    opacity: 0.15,
  },
});

// 预设粒子配置（与 Web 端保持一致）
export const PARTICLE_PRESETS: Record<string, ParticleConfig> = {
  // 幽冥阵营 - 深紫幽暗
  youming: {
    primaryColor: '#4a0080',
    secondaryColor: '#1a1a2e',
    particleCount: 30,
    particleSize: { min: 4, max: 12 },
    speed: { min: 0.5, max: 1.5 },
    opacity: { min: 0.3, max: 0.8 },
    shapes: ['魂火', '水墨晕染'],
  },
  
  // 昆仑阵营 - 冰雪天青
  kunlun: {
    primaryColor: '#4fc3f7',
    secondaryColor: '#ffffff',
    particleCount: 25,
    particleSize: { min: 3, max: 10 },
    speed: { min: 0.3, max: 1 },
    opacity: { min: 0.4, max: 0.9 },
    shapes: ['流云', '剑气'],
  },
  
  // 蓬莱阵营 - 粉霞仙气
  penglai: {
    primaryColor: '#f8bbd9',
    secondaryColor: '#fce4ec',
    particleCount: 35,
    particleSize: { min: 5, max: 15 },
    speed: { min: 0.5, max: 1.2 },
    opacity: { min: 0.5, max: 0.9 },
    shapes: ['花瓣', '云雾'],
  },
  
  // 蛮荒阵营 - 烈焰狂野
  manhuang: {
    primaryColor: '#ff6f00',
    secondaryColor: '#3e2723',
    particleCount: 40,
    particleSize: { min: 6, max: 18 },
    speed: { min: 0.8, max: 2 },
    opacity: { min: 0.4, max: 0.9 },
    shapes: ['火焰', '星尘'],
  },
  
  // 万古阵营 - 金光永恒
  wangu: {
    primaryColor: '#ffd700',
    secondaryColor: '#ffffff',
    particleCount: 50,
    particleSize: { min: 2, max: 8 },
    speed: { min: 0.2, max: 0.8 },
    opacity: { min: 0.3, max: 0.7 },
    shapes: ['星尘', '光点'],
  },
  
  // 游戏首页 - 水墨金光
  gameHome: {
    primaryColor: '#D4AF37',
    secondaryColor: '#854D0E',
    particleCount: 40,
    particleSize: { min: 3, max: 10 },
    speed: { min: 0.4, max: 1 },
    opacity: { min: 0.3, max: 0.8 },
    shapes: ['光点', '星尘'],
  },
  
  // 战斗场景 - 火焰爆发
  battle: {
    primaryColor: '#E74C3C',
    secondaryColor: '#F39C12',
    particleCount: 60,
    particleSize: { min: 4, max: 15 },
    speed: { min: 1, max: 2.5 },
    opacity: { min: 0.5, max: 0.95 },
    shapes: ['火焰', '火花'],
  },
};

export default ParticleSystem;
