/**
 * EmptyState 空状态组件
 * 统一的空状态展示
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

interface EmptyStateProps {
  icon: keyof typeof FontAwesome6.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon, 
  title, 
  message, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
        <FontAwesome6 name={icon} size={32} color={theme.primary} />
      </View>
      
      <ThemedText variant="h4" color={theme.textPrimary} style={styles.title}>
        {title}
      </ThemedText>
      
      {message && (
        <ThemedText variant="small" color={theme.textMuted} style={styles.message}>
          {message}
        </ThemedText>
      )}
      
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <ThemedText variant="smallMedium" color="#fff">{actionLabel}</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    marginTop: Spacing.md,
  },
  actionGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});

export default EmptyState;
