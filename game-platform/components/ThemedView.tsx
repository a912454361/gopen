/**
 * 主题视图组件
 */
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Theme } from '@/constants/theme';

type ViewLevel = 'root' | 'default' | 'tertiary';

interface ThemedViewProps extends ViewProps {
  level?: ViewLevel;
}

const levelStyles: Record<ViewLevel, (theme: Theme) => { backgroundColor: string }> = {
  root: (theme) => ({ backgroundColor: theme.backgroundRoot }),
  default: (theme) => ({ backgroundColor: theme.backgroundDefault }),
  tertiary: (theme) => ({ backgroundColor: theme.backgroundTertiary }),
};

export function ThemedView({ 
  children, 
  level = 'default',
  style,
  ...rest 
}: ThemedViewProps) {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        levelStyles[level](theme),
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
