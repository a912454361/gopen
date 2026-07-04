/**
 * 伤害飘字组件 - 战斗伤害数字动画
 * 
 * 效果：
 * - 数字从攻击位置飘起
 * - 渐变放大后缩小
 * - 带颜色区分（伤害红色、治疗绿色、暴击金色）
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface DamageNumberProps {
  value: number;
  type: 'damage' | 'heal' | 'critical' | 'block';
  x: number;
  y: number;
  onComplete: () => void;
}

export const DamageNumber: React.FC<DamageNumberProps> = ({
  value,
  type,
  x,
  y,
  onComplete,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  
  // 使用 useState 存储随机值
  const [randomOffset] = useState(() => (Math.random() - 0.5) * 40);

  useEffect(() => {
    // 设置随机偏移
    translateX.value = randomOffset;
    
    // 入场动画
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(
        800,
        withTiming(0, { duration: 300 })
      )
    );

    scale.value = withSequence(
      withSpring(1.3, { damping: 8 }),
      withTiming(1, { duration: 200 }),
      withDelay(
        600,
        withTiming(0.5, { duration: 300 })
      )
    );

    translateY.value = withSequence(
      withTiming(-30, { duration: 200, easing: Easing.out(Easing.quad) }),
      withTiming(-80, { duration: 800, easing: Easing.out(Easing.quad) })
    );

    // 动画结束回调
    const timeout = setTimeout(onComplete, 1200);
    return () => clearTimeout(timeout);
  }, [randomOffset]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // 根据类型设置颜色和样式
  const getStyle = () => {
    switch (type) {
      case 'damage':
        return [styles.text, { color: '#FF4444' }];
      case 'heal':
        return [styles.text, { color: '#4CAF50' }];
      case 'critical':
        return [styles.text, { color: '#FFD700', fontSize: 32 }];
      case 'block':
        return [styles.text, { color: '#2196F3' }];
      default:
        return styles.text;
    }
  };

  const getPrefix = () => {
    switch (type) {
      case 'damage':
      case 'critical':
        return '-';
      case 'heal':
        return '+';
      default:
        return '';
    }
  };

  return (
    <Animated.View style={[styles.container, { left: x, top: y }, animatedStyle]}>
      <Text style={getStyle()}>
        {getPrefix()}{Math.abs(value)}
      </Text>
      {type === 'critical' && <Text style={styles.criticalLabel}>暴击!</Text>}
    </Animated.View>
  );
};

interface DamageNumbersProps {
  numbers: Array<{
    id: string;
    value: number;
    type: 'damage' | 'heal' | 'critical' | 'block';
    x: number;
    y: number;
  }>;
  onRemove: (id: string) => void;
}

export const DamageNumbers: React.FC<DamageNumbersProps> = ({ numbers, onRemove }) => {
  return (
    <>
      {numbers.map((item) => (
        <DamageNumber
          key={item.id}
          value={item.value}
          type={item.type}
          x={item.x}
          y={item.y}
          onComplete={() => onRemove(item.id)}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  criticalLabel: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: -5,
  },
});

export default DamageNumber;
