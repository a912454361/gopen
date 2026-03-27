/**
 * ThemedText 组件 - 统一文本样式
 */

import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';

type TextVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4'
  | 'body' | 'bodyLarge'
  | 'small' | 'smallMedium'
  | 'label' | 'labelSmall' | 'labelLarge'
  | 'caption' | 'tiny' | 'tinyMedium';

interface ThemedTextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: string;
  style?: TextStyle | TextStyle[];
}

const variantStyles: Record<TextVariant, TextStyle> = {
  h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
  h2: { fontSize: 28, fontWeight: 'bold', lineHeight: 36 },
  h3: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  h4: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: 16, lineHeight: 24 },
  bodyLarge: { fontSize: 18, lineHeight: 28 },
  small: { fontSize: 14, lineHeight: 20 },
  smallMedium: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0.5 },
  labelSmall: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
  labelLarge: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  caption: { fontSize: 11, lineHeight: 14 },
  tiny: { fontSize: 10, lineHeight: 12 },
  tinyMedium: { fontSize: 10, fontWeight: '500', lineHeight: 12 },
};

export const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  variant = 'body',
  color = '#FFFFFF',
  style,
}) => {
  return (
    <Text style={[variantStyles[variant], { color }, style]}>
      {children}
    </Text>
  );
};
