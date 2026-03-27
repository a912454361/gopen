/**
 * 粒子系统组件 - Web 端实现
 * 使用 CSS 动画和 expo-linear-gradient
 */

import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
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

// 单个粒子组件（Web 端使用 CSS 动画）
interface ParticleProps {
  index: number;
  config: ParticleConfig;
  totalParticles: number;
}

const Particle: React.FC<ParticleProps> = ({ index, config, totalParticles }) => {
  // 随机生成粒子属性
  const particle = useMemo(() => {
    const size = config.particleSize.min + Math.random() * (config.particleSize.max - config.particleSize.min);
    const opacity = config.opacity.min + Math.random() * (config.opacity.max - config.opacity.min);
    const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
    
    return {
      size,
      opacity,
      speed,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 20,
      drift: (Math.random() - 0.5) * 100, // 水平漂移
    };
  }, [config, index]);

  // CSS 动画样式（使用 any 绕过 React Native 类型检查，Web 端支持 CSS 属性）
  const animatedStyle = useMemo((): any => ({
    position: 'absolute',
    left: `${particle.startX}%`,
    top: `${particle.startY}%`,
    width: particle.size,
    height: particle.size,
    borderRadius: particle.size / 2,
    backgroundColor: config.primaryColor,
    opacity: particle.opacity,
    boxShadow: `0 0 ${particle.size * 2}px ${config.primaryColor}`,
    // CSS 动画属性
    animationName: 'floatParticle',
    animationDuration: `${particle.duration}s`,
    animationDelay: `${particle.delay}s`,
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
    animationDirection: 'alternate',
    transform: [
      { translateX: particle.drift },
    ],
  }), [particle, config.primaryColor]);

  return (
    <View
      style={animatedStyle}
      // 注入 CSS 动画 keyframes
      data-particle-index={index}
    />
  );
};

// 粒子系统主组件
export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  config,
  intensity = 'medium',
  style,
}) => {
  const [dimensions, setDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
      });
    };

    // 注入 CSS keyframes 动画
    const styleSheet = document.createElement('style');
    styleSheet.id = 'particle-keyframes';
    styleSheet.textContent = `
      @keyframes floatParticle {
        0% {
          transform: translateY(0) translateX(0) scale(1);
          opacity: ${config.opacity.min};
        }
        25% {
          transform: translateY(-30px) translateX(20px) scale(1.1);
          opacity: ${config.opacity.max};
        }
        50% {
          transform: translateY(-50px) translateX(-10px) scale(0.9);
          opacity: ${(config.opacity.min + config.opacity.max) / 2};
        }
        75% {
          transform: translateY(-20px) translateX(-30px) scale(1.05);
          opacity: ${config.opacity.max};
        }
        100% {
          transform: translateY(0) translateX(0) scale(1);
          opacity: ${config.opacity.min};
        }
      }
      
      @keyframes glowPulse {
        0%, 100% {
          filter: blur(0px) brightness(1);
        }
        50% {
          filter: blur(2px) brightness(1.3);
        }
      }
      
      @keyframes colorShift {
        0% {
          background-color: ${config.primaryColor};
        }
        50% {
          background-color: ${config.secondaryColor || config.primaryColor};
        }
        100% {
          background-color: ${config.primaryColor};
        }
      }
      
      @keyframes rippleEffect {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    
    if (!document.getElementById('particle-keyframes')) {
      document.head.appendChild(styleSheet);
    }

    // 监听窗口大小变化
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      const existingStyle = document.getElementById('particle-keyframes');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [config.primaryColor, config.secondaryColor, config.opacity]);

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
        totalParticles={actualParticleCount}
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
    // blurRadius 只在 Web 端有效，移除以兼容类型检查
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
