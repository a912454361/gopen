import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      marginBottom: Spacing.xl,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    title: {
      marginLeft: Spacing.sm,
    },
    summaryCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    progressBar: {
      height: 12,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
      overflow: 'hidden',
      marginBottom: Spacing.md,
    },
    progressFill: {
      height: '100%',
      borderRadius: BorderRadius.sm,
    },
    progressStats: {
      alignItems: 'center',
    },
    episodeCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    episodeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    episodeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    sceneList: {
      gap: Spacing.xs,
    },
    sceneItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    sceneStatus: {
      width: 24,
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    statusCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.md,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    statusText: {
      marginLeft: Spacing.sm,
      flex: 1,
    },
  });
};
