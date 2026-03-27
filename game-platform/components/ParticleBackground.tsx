/**
 * 金色粒子背景组件
 * 使用 React Native Animated API 实现粒子漂浮效果
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';

interface ParticleConfig {
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function ParticleItem({ config }: { config: ParticleConfig }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(config.opacity)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(config.delay),
        Animated.timing(translateY, {
          toValue: -1000,
          duration: config.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [config.delay, config.duration, translateY]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${config.left}%`,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

export function ParticleBackground() {
  const particlesRef = useRef<ParticleConfig[]>([]);
  
  // 初始化粒子配置（只执行一次）
  if (particlesRef.current.length === 0) {
    particlesRef.current = Array.from({ length: 25 }, () => ({
      left: Math.random() * 100,
      size: Math.random() * 4 + 2, // 2-6px
      duration: Math.random() * 10000 + 10000, // 10-20s
      delay: Math.random() * 5000, // 0-5s delay
      opacity: Math.random() * 0.5 + 0.3, // 0.3-0.8
    }));
  }

  const particles = particlesRef.current;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 深色背景 */}
      <View style={styles.gradientBackground} />
      
      {/* 金色粒子 */}
      {particles.map((particle, index) => (
        <ParticleItem key={index} config={particle} />
      ))}
      
      {/* 金色光晕 */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />
      <View style={styles.glow3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0F',
  },
  particle: {
    position: 'absolute',
    bottom: -50,
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  glow1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    top: '10%',
    right: '-5%',
  },
  glow2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    bottom: '20%',
    left: '-5%',
  },
  glow3: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(212, 175, 55, 0.06)',
    top: '50%',
    left: '30%',
  },
});
