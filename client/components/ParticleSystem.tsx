/**
 * 粒子系统组件 - 通用版本
 * 使用 expo-linear-gradient 渐变背景，不依赖 Reanimated
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 粒子配置类型
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

// 简化版粒子系统 - 仅使用渐变背景
export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  config,
  intensity = 'medium',
  style,
}) => {
  // 根据强度计算粒子数量
  const particleMultiplier = intensity === 'low' ? 0.5 : intensity === 'high' ? 1.5 : 1;
  const actualParticleCount = Math.floor(config.particleCount * particleMultiplier);

  // 生成静态粒子位置
  const particles = useMemo(() => {
    return Array.from({ length: actualParticleCount }, (_, index) => {
      const size = config.particleSize.min + Math.random() * (config.particleSize.max - config.particleSize.min);
      const opacity = config.opacity.min + Math.random() * (config.opacity.max - config.opacity.min);
      
      return {
        size,
        opacity,
        left: Math.random() * 100,
        top: Math.random() * 100,
      };
    });
  }, [actualParticleCount, config]);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* 渐变背景层 */}
      <LinearGradient
        colors={[
          config.primaryColor + '40',
          config.secondaryColor + '20' || config.primaryColor + '20',
          'transparent',
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* 粒子层（静态装饰点） */}
      {particles.map((particle, index) => (
        <View
          key={index}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: config.primaryColor,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              opacity: particle.opacity * 0.6,
            },
          ]}
        />
      ))}
      
      {/* 光晕效果层 */}
      <View
        style={[
          styles.glowLayer,
          {
            backgroundColor: config.primaryColor + '15',
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
  particle: {
    position: 'absolute',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
});

// 预设粒子配置
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
