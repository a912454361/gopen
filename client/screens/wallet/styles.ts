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
    // 余额卡片
    balanceCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    balanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    balanceLabel: {
      color: theme.textMuted,
      fontSize: 13,
    },
    balanceAmount: {
      color: theme.textPrimary,
      fontSize: 36,
      fontWeight: '700',
    },
    balanceActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    balanceButton: {
      flex: 1,
      padding: Spacing.md,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
    },
    rechargeButton: {
      backgroundColor: theme.primary,
    },
    withdrawButton: {
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    balanceButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    // 统计卡片
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
      alignItems: 'center',
    },
    statValue: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    statLabel: {
      color: theme.textMuted,
      fontSize: 11,
    },
    // 模型选择
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
    modelCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    modelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    modelIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    modelInfo: {
      flex: 1,
    },
    modelName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    modelProvider: {
      color: theme.textMuted,
      fontSize: 12,
    },
    modelBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
      marginLeft: Spacing.sm,
    },
    freeBadge: {
      backgroundColor: '#05966920',
    },
    memberBadge: {
      backgroundColor: '#D9770620',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    modelPrice: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      paddingTop: Spacing.md,
    },
    priceLabel: {
      color: theme.textMuted,
      fontSize: 11,
    },
    priceValue: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    selectedModel: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    // 充值弹窗
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      maxHeight: '80%',
      padding: Spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    modalTitle: {
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
    amountOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    amountOption: {
      width: '30%',
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    amountSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primary,
    },
    amountValue: {
      fontSize: 18,
      fontWeight: '600',
    },
    amountBonus: {
      fontSize: 10,
      marginTop: Spacing.xs,
    },
    customAmount: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    customInput: {
      flex: 1,
      fontSize: 16,
      color: theme.textPrimary,
      textAlign: 'center',
    },
    submitButton: {
      backgroundColor: theme.primary,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
    },
    submitButtonText: {
      color: theme.buttonPrimaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
