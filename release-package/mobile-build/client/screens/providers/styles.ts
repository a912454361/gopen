import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    title: {
      marginBottom: Spacing.sm,
    },
    subtitle: {
      color: theme.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.primary,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textMuted,
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    providerList: {
      gap: Spacing.md,
    },
    providerCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    providerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    providerIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    providerInfo: {
      flex: 1,
    },
    providerName: {
      fontWeight: '600',
      marginBottom: 2,
    },
    providerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    providerStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusDotActive: {
      backgroundColor: theme.success,
    },
    statusDotInactive: {
      backgroundColor: theme.error,
    },
    statusDotSyncing: {
      backgroundColor: theme.primary,
    },
    statusText: {
      fontSize: 12,
      color: theme.textMuted,
    },
    providerStats: {
      flexDirection: 'row',
      gap: Spacing.lg,
      marginBottom: Spacing.md,
    },
    providerStat: {
      alignItems: 'center',
    },
    providerStatValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    providerStatLabel: {
      fontSize: 11,
      color: theme.textMuted,
    },
    providerTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    tag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
    },
    tagText: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    providerActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      gap: Spacing.xs,
    },
    actionButtonPrimary: {
      backgroundColor: theme.primary,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    actionButtonTextPrimary: {
      color: theme.buttonPrimaryText,
    },
    syncAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xl,
      gap: Spacing.sm,
    },
    syncAllButtonText: {
      color: theme.buttonPrimaryText,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['4xl'],
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['4xl'],
    },
    emptyText: {
      color: theme.textMuted,
      marginTop: Spacing.md,
    },
    categoryFilter: {
      flexDirection: 'row',
      marginBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    categoryChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.backgroundTertiary,
    },
    categoryChipActive: {
      backgroundColor: theme.primary,
    },
    categoryChipText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    categoryChipTextActive: {
      color: theme.buttonPrimaryText,
    },
    lastSyncInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    lastSyncText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      marginTop: Spacing.xs,
    },
  });
};
