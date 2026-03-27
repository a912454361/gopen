/**
 * 主题文本组件
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, FontWeight, Theme } from '@/constants/theme';

type TextVariant = 'tiny' | 'caption' | 'small' | 'body' | 'label' | 'h4' | 'h3' | 'h2' | 'h1' | 'hero';
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'heavy';

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
}

const variantStyles: Record<TextVariant, { fontSize: number }> = {
  tiny: { fontSize: FontSize.tiny },
  caption: { fontSize: FontSize.caption },
  small: { fontSize: FontSize.small },
  body: { fontSize: FontSize.body },
  label: { fontSize: FontSize.label },
  h4: { fontSize: FontSize.h4 },
  h3: { fontSize: FontSize.h3 },
  h2: { fontSize: FontSize.h2 },
  h1: { fontSize: FontSize.h1 },
  hero: { fontSize: FontSize.hero },
};

const weightStyles: Record<TextWeight, { fontWeight: '400' | '500' | '600' | '700' | '800' }> = {
  normal: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  heavy: { fontWeight: '800' },
};

export function ThemedText({ 
  children, 
  variant = 'body', 
  weight = 'normal',
  color,
  style,
  ...rest 
}: ThemedTextProps) {
  const { theme } = useTheme();
  
  return (
    <Text
      style={[
        { color: color || theme.textPrimary },
        variantStyles[variant],
        weightStyles[weight],
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
