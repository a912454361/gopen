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
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.xl,
    },
    providerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
    },
    providerIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
    },
    configuredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingBottom: Spacing['3xl'],
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalBody: {
      padding: Spacing.lg,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    input: {
      marginTop: Spacing.sm,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      fontSize: 14,
    },
    cancelButton: {
      flex: 1,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    saveButton: {
      flex: 1,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      backgroundColor: theme.primary,
    },
  });
};
