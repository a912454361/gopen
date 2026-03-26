/**
 * 粒子特效组件 - 国风水墨风格
 * 
 * 支持的粒子形态：
 * - 魂火：幽冥阵营，紫色火焰粒子
 * - 剑气：昆仑/幽冥，锋利剑光
 * - 流云：昆仑阵营，青蓝云雾
 * - 花瓣：蓬莱阵营，粉色花瓣飘落
 * - 火焰：蛮荒阵营，赤焰燃烧
 * - 星尘：万古阵营，金白星光
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 粒子配置类型
interface ParticleConfig {
  primaryColor: string;
  secondaryColor?: string;
  particleCount: number;
  particleSize: { min: number; max: number };
  speed: { min: number; max: number };
  opacity: { min: number; max: number };
  shapes: string[];
}

// 单个粒子组件 - 接收预计算的随机值
interface ParticleProps {
  index: number;
  config: ParticleConfig;
  shape: string;
  size: number;
  duration: number;
  delay: number;
  startX: number;
  startOffset: number;
}

const Particle: React.FC<ParticleProps> = ({ 
  index, 
  config, 
  shape, 
  size, 
  duration, 
  delay, 
  startX, 
  startOffset 
}) => {
  const startY = SCREEN_HEIGHT + 50;

  // 动画值
  const x = useSharedValue(startX);
  const y = useSharedValue(startY);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // 入场动画
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(config.opacity.max, { duration: 500 }),
        withRepeat(
          withSequence(
            withTiming(config.opacity.min, { duration: duration / 2 }),
            withTiming(config.opacity.max, { duration: duration / 2 })
          ),
          -1,
          true
        )
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 8 }),
        withRepeat(
          withSequence(
            withTiming(0.8, { duration: duration / 2 }),
            withTiming(1.2, { duration: duration / 2 })
          ),
          -1,
          true
        )
      )
    );

    // 上升动画
    y.value = withDelay(
      delay,
      withTiming(-50, {
        duration: duration * 2,
        easing: Easing.out(Easing.quad),
      })
    );

    // 横向漂移
    x.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(startX + startOffset, { duration: duration }),
          withTiming(startX - startOffset, { duration: duration })
        ),
        -1,
        true
      )
    );

    // 旋转
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: duration * 2, easing: Easing.linear }),
        -1
      )
    );
  }, [config, duration, delay, startX, startOffset]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  // 根据形状渲染不同样式
  const renderShape = () => {
    const isPrimary = index % 2 === 0;
    const color = isPrimary ? config.primaryColor : (config.secondaryColor || config.primaryColor);
    
    switch (shape) {
      case '魂火':
        return (
          <View
            style={[
              styles.fireParticle,
              {
                width: size,
                height: size * 1.5,
                borderRadius: size * 0.5,
                backgroundColor: color,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: size * 0.5,
              },
            ]}
          />
        );
      
      case '剑气':
        return (
          <View
            style={[
              styles.swordParticle,
              {
                width: size * 0.3,
                height: size * 3,
                backgroundColor: color,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: size * 0.3,
              },
            ]}
          />
        );
      
      case '流云':
        return (
          <View
            style={[
              styles.cloudParticle,
              {
                width: size * 2,
                height: size,
                borderRadius: size,
                backgroundColor: color,
                opacity: 0.4,
              },
            ]}
          />
        );
      
      case '花瓣':
        return (
          <View
            style={[
              styles.petalParticle,
              {
                width: size,
                height: size * 1.3,
                borderRadius: size * 0.5,
                backgroundColor: color,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: size * 0.3,
              },
            ]}
          />
        );
      
      case '火焰':
        return (
          <View
            style={[
              styles.fireParticle,
              {
                width: size * 0.8,
                height: size * 1.4,
                borderRadius: size * 0.3,
                backgroundColor: color,
                shadowColor: '#FF4500',
                shadowOffset: { width: 0, height: -size * 0.2 },
                shadowOpacity: 0.8,
                shadowRadius: size * 0.6,
              },
            ]}
          />
        );
      
      case '星尘':
        return (
          <View
            style={[
              styles.starParticle,
              {
                width: size * 0.5,
                height: size * 0.5,
                borderRadius: size * 0.25,
                backgroundColor: color,
                shadowColor: color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: size * 0.5,
              },
            ]}
          />
        );
      
      case '水墨晕染':
      default:
        return (
          <View
            style={[
              styles.inkParticle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: 0.3,
              },
            ]}
          />
        );
    }
  };

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      {renderShape()}
    </Animated.View>
  );
};

// 粒子生成器函数（纯工具函数，不涉及 React Hooks）
const generateParticleData = (
  actualCount: number,
  config: ParticleConfig
) => {
  return Array.from({ length: actualCount }).map((_, index) => {
    const shapeIndex = index % config.shapes.length;
    return {
      id: index,
      shape: config.shapes[shapeIndex],
      size: config.particleSize.min + Math.random() * (config.particleSize.max - config.particleSize.min),
      duration: 2000 + Math.random() * 3000,
      delay: Math.random() * 2000,
      startX: Math.random() * SCREEN_WIDTH,
      startOffset: (Math.random() - 0.5) * 100,
    };
  });
};

// 主粒子系统组件
interface ParticleSystemProps {
  config: ParticleConfig;
  intensity?: 'low' | 'medium' | 'high';
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  config,
  intensity = 'medium',
}) => {
  // 根据强度调整粒子数量
  const countMultiplier = intensity === 'low' ? 0.3 : intensity === 'high' ? 1.5 : 1;
  const actualCount = Math.floor(config.particleCount * countMultiplier);

  // 使用对象作为 key 来触发重新生成粒子
  // 当 config 或 intensity 变化时，生成新的粒子数据
  const particleKey = JSON.stringify({ 
    count: actualCount, 
    shapes: config.shapes,
    primaryColor: config.primaryColor 
  });

  return (
    <ParticleSystemInner 
      key={particleKey}
      actualCount={actualCount} 
      config={config} 
    />
  );
};

// 内部组件 - 负责实际渲染粒子
const ParticleSystemInner: React.FC<{
  actualCount: number;
  config: ParticleConfig;
}> = ({ actualCount, config }) => {
  // 在组件挂载时生成粒子数据（仅执行一次）
  // 通过父组件的 key 来控制重新生成
  const particleData = React.useMemo(() => 
    generateParticleData(actualCount, config),
    [actualCount, config] // 包含正确的依赖
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {particleData.map((particle) => (
        <Particle
          key={`particle-${particle.id}`}
          index={particle.id}
          config={config}
          shape={particle.shape}
          size={particle.size}
          duration={particle.duration}
          delay={particle.delay}
          startX={particle.startX}
          startOffset={particle.startOffset}
        />
      ))}
    </View>
  );
};

// 预设粒子配置
export const PARTICLE_PRESETS: Record<string, ParticleConfig> = {
  // 幽冥阵营
  youming: {
    primaryColor: '#4a0080',
    secondaryColor: '#1a1a2e',
    particleCount: 30,
    particleSize: { min: 4, max: 12 },
    speed: { min: 0.5, max: 1.5 },
    opacity: { min: 0.3, max: 0.8 },
    shapes: ['魂火', '水墨晕染'],
  },
  
  // 昆仑阵营
  kunlun: {
    primaryColor: '#4fc3f7',
    secondaryColor: '#ffffff',
    particleCount: 25,
    particleSize: { min: 3, max: 10 },
    speed: { min: 0.3, max: 1 },
    opacity: { min: 0.4, max: 0.9 },
    shapes: ['流云', '剑气'],
  },
  
  // 蓬莱阵营
  penglai: {
    primaryColor: '#f8bbd9',
    secondaryColor: '#fce4ec',
    particleCount: 35,
    particleSize: { min: 5, max: 15 },
    speed: { min: 0.5, max: 1.2 },
    opacity: { min: 0.5, max: 0.9 },
    shapes: ['花瓣', '流云'],
  },
  
  // 蛮荒阵营
  manhuang: {
    primaryColor: '#ff6f00',
    secondaryColor: '#ff4500',
    particleCount: 40,
    particleSize: { min: 6, max: 18 },
    speed: { min: 0.8, max: 2 },
    opacity: { min: 0.4, max: 0.95 },
    shapes: ['火焰', '星尘'],
  },
  
  // 万古阵营
  wangu: {
    primaryColor: '#ffd700',
    secondaryColor: '#ffffff',
    particleCount: 50,
    particleSize: { min: 2, max: 8 },
    speed: { min: 0.2, max: 0.8 },
    opacity: { min: 0.5, max: 1 },
    shapes: ['星尘', '剑气', '流云'],
  },
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  fireParticle: {},
  swordParticle: {},
  cloudParticle: {},
  petalParticle: {},
  starParticle: {},
  inkParticle: {},
});

export default ParticleSystem;
