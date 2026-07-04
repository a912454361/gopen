/**
 * LazyImage 图片懒加载组件
 * 支持占位图、加载失败处理、渐显效果
 */

import React, { useState, useCallback } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontAwesome6 } from '@expo/vector-icons';
import { BorderRadius, Spacing } from '@/constants/theme';

interface LazyImageProps {
  uri?: string | null;
  style?: any;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  placeholder?: React.ReactNode;
  showLoading?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  uri,
  style,
  width,
  height,
  borderRadius = BorderRadius.md,
  placeholder,
  showLoading = true,
  onLoad,
  onError,
}: LazyImageProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
    onError?.();
  }, [onError]);

  // 无图片或错误时显示占位符
  if (!uri || error) {
    return (
      <View 
        style={[
          styles.container,
          { width, height, borderRadius, backgroundColor: theme.backgroundTertiary },
          style,
        ]}
      >
        {placeholder || (
          <FontAwesome6 name="image" size={32} color={theme.textMuted} />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      {loading && showLoading && (
        <View style={[styles.loadingContainer, { borderRadius }]}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { borderRadius },
        ]}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default LazyImage;
