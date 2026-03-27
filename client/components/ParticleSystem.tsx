/**
 * 粒子特效组件 - 国风水墨风格
 * 
 * Web 端使用简化版渐变背景，原生端使用 Reanimated 粒子动画
 */

import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

// 主粒子系统组件
interface ParticleSystemProps {
  config: ParticleConfig;
  intensity?: 'low' | 'medium' | 'high';
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  config,
  intensity = 'medium',
}) => {
  // Web 端使用简化的渐变背景
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container} pointerEvents="none">
        <LinearGradient
          colors={[
            config.primaryColor + '30',
            config.secondaryColor + '10' || config.primaryColor + '10',
            'transparent',
          ]}
          style={styles.gradient}
        />
        {/* 装饰性圆点 */}
        {[...Array(5)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 3) * 30}%`,
                width: 4 + i * 2,
                height: 4 + i * 2,
                backgroundColor: config.primaryColor,
                opacity: 0.3 - i * 0.05,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  // 原生端暂时也返回简化版本（避免 Reanimated 问题）
  return (
    <View style={styles.container} pointerEvents="none">
      <LinearGradient
        colors={[
          config.primaryColor + '20',
          'transparent',
        ]}
        style={styles.gradient}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  dot: {
    position: 'absolute',
    borderRadius: 100,
  },
});

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
    shapes: ['花瓣', '云雾'],
  },
  
  // 蛮荒阵营
  manhuang: {
    primaryColor: '#ff6f00',
    secondaryColor: '#3e2723',
    particleCount: 40,
    particleSize: { min: 6, max: 18 },
    speed: { min: 0.8, max: 2 },
    opacity: { min: 0.4, max: 0.9 },
    shapes: ['火焰', '星尘'],
  },
  
  // 万古阵营
  wangu: {
    primaryColor: '#ffd700',
    secondaryColor: '#ffffff',
    particleCount: 50,
    particleSize: { min: 2, max: 8 },
    speed: { min: 0.2, max: 0.8 },
    opacity: { min: 0.3, max: 0.7 },
    shapes: ['星尘', '光点'],
  },
};

export default ParticleSystem;
