/**
 * 推广横幅组件
 * 显示在首页，引导用户参与推广
 */

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

interface PromoBannerProps {
  onPress: () => void;
  onClose?: () => void;
}

const BANNER_DISMISSED_KEY = 'promo_banner_dismissed';

export function PromoBanner({ onPress, onClose }: PromoBannerProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    // 检查是否已关闭
    AsyncStorage.getItem(BANNER_DISMISSED_KEY).then(dismissed => {
      if (dismissed !== 'true') {
        setVisible(true);
        // 滑入动画
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [slideAnim]);

  const handleClose = async () => {
    // 滑出动画
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setVisible(false);
    }, 300);

    await AsyncStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    onClose?.();
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.touchable}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53', '#FFA726']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.iconWrap}>
            <FontAwesome6 name="gift" size={20} color="#fff" />
          </View>
          
          <View style={styles.content}>
            <ThemedText variant="smallMedium" color="#fff">
              邀请好友赚佣金
            </ThemedText>
            <ThemedText variant="caption" color="rgba(255,255,255,0.9)">
              分享链接，好友消费你得10%佣金
            </ThemedText>
          </View>

          <View style={styles.actionButton}>
            <ThemedText variant="captionMedium" color="#FF6B6B">立即参与</ThemedText>
          </View>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleClose}
          >
            <FontAwesome6 name="xmark" size={14} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  touchable: {
    borderRadius: BorderRadius.lg,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PromoBanner;
