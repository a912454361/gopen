import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing['2xl'],
    },
    title: {
      marginBottom: Spacing.sm,
    },
    description: {
      lineHeight: 22,
    },
    sectionTitle: {
      marginBottom: Spacing.lg,
      marginTop: Spacing.sm,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    themeCard: {
      width: '47%',
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 2,
    },
    themeCardActive: {
      borderWidth: 2,
    },
    themePreview: {
      height: 80,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
      overflow: 'hidden',
      position: 'relative',
    },
    themeGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeName: {
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    themeDescription: {
      textAlign: 'center',
      fontSize: 11,
      lineHeight: 16,
    },
    checkMark: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorPreview: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    colorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
  });
};
