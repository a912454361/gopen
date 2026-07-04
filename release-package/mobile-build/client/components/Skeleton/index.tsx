/**
 * Skeleton 骨架屏组件
 * 加载占位展示
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ 
  width = '100%', 
  height = 16, 
  borderRadius = BorderRadius.sm,
  style 
}: SkeletonProps) {
  const { theme } = useTheme();
  
  // 使用useMemo创建动画值，避免在渲染期间访问ref
  const animatedValue = useMemo(() => new Animated.Value(0), []);
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.backgroundTertiary, theme.backgroundDefault],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

// 预设骨架屏组件
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={14}
          style={{ marginBottom: index < lines - 1 ? Spacing.sm : 0 }}
        />
      ))}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.cardContainer}>
      <Skeleton width={60} height={60} borderRadius={BorderRadius.md} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={16} style={{ marginBottom: Spacing.sm }} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={{ marginBottom: Spacing.md }}>
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  textContainer: {
    padding: Spacing.md,
  },
  cardContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
});

export default Skeleton;
