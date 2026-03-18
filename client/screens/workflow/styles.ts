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
    workflowContainer: {
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    workflowStep: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    workflowStepActive: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    workflowStepLocked: {
      opacity: 0.6,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    stepNumber: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepNumberActive: {
      borderColor: theme.primary,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
    },
    stepNumberText: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    stepInfo: {
      flex: 1,
    },
    stepTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    stepDesc: {
      color: theme.textMuted,
      fontSize: 12,
    },
    stepBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
      borderWidth: 1,
    },
    badgeFree: {
      borderColor: theme.success,
      backgroundColor: 'rgba(0, 255, 136, 0.1)',
    },
    badgeMember: {
      borderColor: theme.accent,
      backgroundColor: 'rgba(191, 0, 255, 0.1)',
    },
    badgeSuper: {
      borderColor: theme.primary,
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },
    stepContent: {
      padding: Spacing.lg,
      paddingTop: 0,
      gap: Spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.primary,
      marginTop: Spacing.md,
    },
    actionButtonDisabled: {
      borderColor: theme.border,
      opacity: 0.5,
    },
    actionButtonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 1,
    },
    progressContainer: {
      marginTop: Spacing.md,
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
    featureGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    featureTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.xs,
    },
    featureTagText: {
      color: theme.textSecondary,
      fontSize: 11,
    },
    storageCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    storageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    storageTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    storageValue: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    storageBar: {
      height: 8,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 4,
      overflow: 'hidden',
    },
    storageWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      padding: Spacing.md,
      backgroundColor: 'rgba(255, 0, 60, 0.1)',
      borderRadius: BorderRadius.xs,
      borderWidth: 1,
      borderColor: theme.error,
    },
    storageWarningText: {
      color: theme.error,
      fontSize: 12,
    },
  });
};
