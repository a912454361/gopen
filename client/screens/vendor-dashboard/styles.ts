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
    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: Spacing.lg,
    },
    tab: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    content: {
      gap: Spacing.md,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      gap: Spacing.sm,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    card: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      marginBottom: Spacing.md,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    typeBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    typeBadgeText: {
      fontSize: 11,
      color: theme.primary,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    serviceName: {
      marginBottom: 2,
    },
    cardBody: {
      gap: Spacing.md,
    },
    description: {
      lineHeight: 20,
    },
    priceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.lg,
    },
    priceItem: {
      flex: 1,
      minWidth: 100,
    },
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    cardFooter: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    actionButton: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing['3xl'],
      gap: Spacing.md,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 500,
      maxHeight: '80%',
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
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
    formGroup: {
      marginBottom: Spacing.md,
    },
    input: {
      marginTop: Spacing.xs,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      fontSize: 14,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    typeOption: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    priceInputs: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    submitButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
};
