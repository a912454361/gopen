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
    qrCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    qrContainer: {
      width: 220,
      height: 220,
      borderRadius: BorderRadius.md,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      padding: Spacing.lg,
    },
    qrPlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrText: {
      color: theme.textMuted,
      fontSize: 12,
      textAlign: 'center',
    },
    qrAmount: {
      color: theme.primary,
      fontSize: 36,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    qrProductType: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    qrOrderNo: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: Spacing.md,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    statusPending: {
      color: theme.textMuted,
      fontSize: 13,
    },
    statusPaid: {
      color: theme.success,
      fontSize: 13,
      fontWeight: '600',
    },
    statusFailed: {
      color: theme.error,
      fontSize: 13,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      marginTop: Spacing.lg,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 1,
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
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 1,
    },
    authCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    authHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    authTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    authBadge: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
    },
    authBadgeActive: {
      backgroundColor: 'rgba(0, 255, 136, 0.1)',
      borderWidth: 1,
      borderColor: theme.success,
    },
    authBadgeCancelled: {
      backgroundColor: 'rgba(255, 0, 60, 0.1)',
      borderWidth: 1,
      borderColor: theme.error,
    },
    authBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    authInfo: {
      gap: Spacing.sm,
    },
    authInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    authInfoLabel: {
      color: theme.textMuted,
      fontSize: 12,
    },
    authInfoValue: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    recordList: {
      gap: Spacing.md,
    },
    recordCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    recordIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordSuccess: {
      backgroundColor: 'rgba(0, 255, 136, 0.1)',
    },
    recordFailed: {
      backgroundColor: 'rgba(255, 0, 60, 0.1)',
    },
    recordPending: {
      backgroundColor: 'rgba(0, 240, 255, 0.1)',
    },
    recordInfo: {
      flex: 1,
    },
    recordAmount: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    recordDate: {
      color: theme.textMuted,
      fontSize: 11,
    },
    recordStatus: {
      color: theme.textMuted,
      fontSize: 11,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
      padding: Spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderRadius: BorderRadius.xs,
    },
    tabActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    tabTextActive: {
      color: theme.backgroundRoot,
    },
    inputContainer: {
      marginBottom: Spacing.md,
    },
    inputLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
      padding: Spacing.md,
      color: theme.textPrimary,
      fontSize: 14,
    },
    inputRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    inputHalf: {
      flex: 1,
    },
    countdown: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: Spacing.sm,
    },
  });
};
