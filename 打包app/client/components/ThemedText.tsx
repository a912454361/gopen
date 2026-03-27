import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

type TextVariant = 'hero' | 'h1' | 'h2' | 'h3' | 'h4' | 'label' | 'small' | 'caption' | 'tiny';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  children: React.ReactNode;
}

const variantStyles: Record<TextVariant, any> = {
  hero: { fontSize: 40, lineHeight: 48 },
  h1: { fontSize: 32, lineHeight: 40 },
  h2: { fontSize: 24, lineHeight: 32 },
  h3: { fontSize: 20, lineHeight: 28 },
  h4: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12, lineHeight: 16 },
  caption: { fontSize: 11, lineHeight: 14 },
  tiny: { fontSize: 10, lineHeight: 12 },
};

const weightStyles: Record<TextWeight, any> = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  heavy: { fontWeight: '900' },
};

export function ThemedText({
  variant = 'label',
  weight = 'regular',
  color = '#FFFFFF',
  style,
  children,
  ...props
}: ThemedTextProps) {
  return (
    <Text
      style={[
        variantStyles[variant],
        weightStyles[weight],
        { color },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
