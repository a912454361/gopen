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
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    statCardActive: {
      borderColor: theme.primary,
      backgroundColor: 'rgba(0,240,255,0.05)',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    projectList: {
      gap: Spacing.md,
    },
    projectCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
    },
    projectCardActive: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    projectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    projectIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(0,240,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    projectStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: 'rgba(22,163,74,0.1)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
    },
    projectProgress: {
      marginBottom: Spacing.md,
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressFillPlain: {
      height: '100%',
      borderRadius: 3,
    },
    projectMeta: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    createButton: {
      marginTop: Spacing.xl,
    },
  });
};
