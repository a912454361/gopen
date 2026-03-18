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
    },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    headerSubtitle: {
      color: theme.textMuted,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 80,
    },
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
    },
    statLabel: {
      color: theme.textMuted,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    statValue: {
      color: theme.primary,
      fontSize: 28,
      fontWeight: '700',
    },
    statCardActive: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    seeAllButton: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1,
    },
    projectList: {
      gap: Spacing.md,
    },
    projectCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
    },
    projectCardActive: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    projectTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    projectType: {
      color: theme.textMuted,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    projectStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
      borderWidth: 1,
    },
    statusActive: {
      borderColor: theme.success,
      backgroundColor: 'rgba(0, 255, 136, 0.1)',
    },
    statusPending: {
      borderColor: theme.accent,
      backgroundColor: 'rgba(191, 0, 255, 0.1)',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    statusActiveText: {
      color: theme.success,
    },
    statusPendingText: {
      color: theme.accent,
    },
    projectProgress: {
      marginBottom: Spacing.sm,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: Spacing.xs,
    },
    projectMeta: {
      flexDirection: 'row',
      gap: Spacing.xl,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    metaText: {
      color: theme.textMuted,
      fontSize: 12,
    },
    createButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.primary,
      marginTop: Spacing.lg,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    createButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  });
};
