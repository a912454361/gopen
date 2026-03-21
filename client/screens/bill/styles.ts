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
      paddingTop: Spacing.md,
      paddingBottom: Spacing['2xl'],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    summaryCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    summaryTitle: {
      color: theme.textMuted,
      fontSize: 12,
      marginBottom: Spacing.sm,
    },
    summaryAmount: {
      color: theme.textPrimary,
      fontSize: 32,
      fontWeight: '700',
      marginBottom: Spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.xl,
    },
    summaryItem: {
      flex: 1,
    },
    summaryLabel: {
      color: theme.textMuted,
      fontSize: 11,
      marginBottom: Spacing.xs,
    },
    summaryValue: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.xs,
      backgroundColor: theme.primary,
    },
    actionButtonText: {
      color: theme.buttonPrimaryText,
      fontSize: 12,
      fontWeight: '600',
    },
    billCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    billHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    billTitle: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    billStatus: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
    },
    statusSuccess: {
      backgroundColor: '#05966920',
    },
    statusPending: {
      backgroundColor: '#D9770620',
    },
    statusFailed: {
      backgroundColor: '#DC262620',
    },
    billStatusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    billDetail: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    billAmount: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    billFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    billTime: {
      color: theme.textMuted,
      fontSize: 11,
    },
    invoiceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    invoiceButtonText: {
      color: theme.primary,
      fontSize: 12,
    },
    invoiceModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    invoiceContent: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      maxHeight: '90%',
      padding: Spacing.xl,
    },
    invoiceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    invoiceTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    invoiceForm: {
      gap: Spacing.lg,
    },
    inputGroup: {
      gap: Spacing.sm,
    },
    inputLabel: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    input: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
      padding: Spacing.lg,
      color: theme.textPrimary,
      fontSize: 14,
    },
    submitButton: {
      backgroundColor: theme.primary,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    submitButtonText: {
      color: theme.buttonPrimaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      padding: Spacing['3xl'],
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
      marginTop: Spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
