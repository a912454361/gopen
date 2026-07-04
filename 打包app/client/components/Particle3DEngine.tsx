/**
 * 3D粒子引擎 - 2K粒子渲染
 * 使用Canvas实现高性能粒子系统
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 粒子类型定义
interface Particle {
  x: number;
  y: number;
  z: number;  // 3D深度
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'glow' | 'trail' | 'explosion';
}

// 五大阵营粒子颜色配置
const FACTION_COLORS = {
  幽冥: ['#8B5CF6', '#A855F7', '#C084FC', '#7C3AED'],
  昆仑: ['#4FC3F7', '#22D3EE', '#67E8F9', '#06B6D4'],
  蓬莱: ['#F8BBD9', '#F472B6', '#FB7185', '#EC4899'],
  蛮荒: ['#FF6F00', '#F59E0B', '#FBBF24', '#D97706'],
  万古: ['#D4AF37', '#FCD34D', '#FBBF24', '#B8860B'],
};

interface ParticleEngineProps {
  width?: number;
  height?: number;
  particleCount?: number;
  faction?: keyof typeof FACTION_COLORS;
  intensity?: 'low' | 'medium' | 'high' | 'ultra';
  style?: any;
}

// 2K粒子引擎 (2048粒子)
export function Particle3DEngine({
  width = SCREEN_WIDTH,
  height = SCREEN_HEIGHT,
  particleCount = 2048,
  faction = '万古',
  intensity = 'high',
  style,
}: ParticleEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: width / 2, y: height / 2 });

  // 初始化粒子
  const initParticles = useCallback(() => {
    const colors = FACTION_COLORS[faction];
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(width, height, colors));
    }

    particlesRef.current = particles;
  }, [particleCount, faction, width, height]);

  // 创建单个粒子
  function createParticle(w: number, h: number, colors: string[]): Particle {
    const type = ['spark', 'glow', 'trail', 'explosion'][Math.floor(Math.random() * 4)] as Particle['type'];
    
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 1000, // 深度 0-1000
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      vz: (Math.random() - 0.5) * 5,
      size: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.8 + 0.2,
      life: Math.random() * 200 + 100,
      maxLife: 300,
      type,
    };
  }

  // 更新粒子
  const updateParticles = useCallback(() => {
    const particles = particlesRef.current;
    const colors = FACTION_COLORS[faction];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // 3D运动
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      // 边界检测
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      if (p.z < 0 || p.z > 1000) p.vz *= -1;

      // 生命周期
      p.life--;
      if (p.life <= 0) {
        particles[i] = createParticle(width, height, colors);
      }

      // 根据深度调整透明度（模拟3D）
      p.alpha = (1 - p.z / 1000) * 0.8 + 0.2;
    }
  }, [faction, width, height]);

  // 渲染粒子
  const renderParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除画布（带拖尾效果）
    ctx.fillStyle = 'rgba(10, 10, 15, 0.15)';
    ctx.fillRect(0, 0, width, height);

    const particles = particlesRef.current;

    // 按深度排序（远到近）
    const sortedParticles = [...particles].sort((a, b) => b.z - a.z);

    for (const p of sortedParticles) {
      // 3D透视投影
      const perspective = 1000;
      const scale = perspective / (perspective + p.z);
      const screenX = (p.x - width / 2) * scale + width / 2;
      const screenY = (p.y - height / 2) * scale + height / 2;
      const size = p.size * scale;

      ctx.save();
      ctx.globalAlpha = p.alpha * (p.life / p.maxLife);

      // 根据类型绘制不同效果
      switch (p.type) {
        case 'spark':
          // 火花效果
          const sparkGradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, size * 3
          );
          sparkGradient.addColorStop(0, p.color);
          sparkGradient.addColorStop(0.5, p.color + '80');
          sparkGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = sparkGradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 3, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'glow':
          // 发光效果
          const glowGradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, size * 5
          );
          glowGradient.addColorStop(0, '#FFFFFF');
          glowGradient.addColorStop(0.2, p.color);
          glowGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(screenX, screenY, size * 5, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'trail':
          // 拖尾效果
          ctx.strokeStyle = p.color;
          ctx.lineWidth = size * 0.5;
          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(screenX - p.vx * 10 * scale, screenY - p.vy * 10 * scale);
          ctx.stroke();
          break;

        case 'explosion':
          // 爆炸效果
          ctx.fillStyle = p.color;
          for (let j = 0; j < 4; j++) {
            const angle = (j / 4) * Math.PI * 2;
            const dist = size * 2;
            ctx.beginPath();
            ctx.arc(
              screenX + Math.cos(angle) * dist,
              screenY + Math.sin(angle) * dist,
              size * 0.5,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          break;
      }

      ctx.restore();
    }
  }, [width, height]);

  // 动画循环
  const animate = useCallback(() => {
    updateParticles();
    renderParticles();
    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles, renderParticles]);

  // 初始化
  useEffect(() => {
    initParticles();

    if (Platform.OS === 'web') {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles, animate]);

  // Web端使用Canvas
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: width,
            height: height,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </View>
    );
  }

  // 移动端使用占位（需要 expo-gl 实现）
  return (
    <View style={[styles.container, style, { width, height }]}>
      {/* 移动端粒子效果 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
});
