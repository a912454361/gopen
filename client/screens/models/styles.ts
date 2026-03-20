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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    filterRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    filterChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    modelCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    selectedCard: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    modelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modelIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modelInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    modelMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    modelBadge: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    modelFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    priceGroup: {
      alignItems: 'center',
    },
    selectButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['5xl'],
    },
    tokenUsageCard: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
  });
};
