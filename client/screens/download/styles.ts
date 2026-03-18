import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    },
    header: {
      marginBottom: Spacing.xl,
      alignItems: 'center',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 120,
    },
    heroSection: {
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
      padding: Spacing.xl,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundDefault,
    },
    appIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      marginBottom: Spacing.lg,
    },
    platformGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.lg,
      justifyContent: 'center',
    },
    platformCard: {
      width: '45%',
      minWidth: 280,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      alignItems: 'center',
    },
    platformIcon: {
      width: 64,
      height: 64,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
      width: '100%',
    },
    featureList: {
      marginTop: Spacing.xl,
      padding: Spacing.lg,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    storeSection: {
      marginTop: Spacing.xl,
      alignItems: 'center',
    },
    storeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      justifyContent: 'center',
      marginTop: Spacing.lg,
    },
    storeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
    },
  });
};
