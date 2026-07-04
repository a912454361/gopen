/**
 * Loading 加载组件
 * 统一的加载状态展示
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
}

export function Loading({ message, fullScreen = false, size = 'large' }: LoadingProps) {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container,
      fullScreen && styles.fullScreen,
      { backgroundColor: fullScreen ? theme.backgroundRoot : 'transparent' }
    ]}>
      <ActivityIndicator size={size} color={theme.primary} />
      {message && (
        <ThemedText 
          variant="small" 
          color={theme.textMuted} 
          style={styles.message}
        >
          {message}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: Spacing.md,
  },
});

export default Loading;
