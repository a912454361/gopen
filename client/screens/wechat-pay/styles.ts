import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing["2xl"],
      paddingBottom: Spacing["5xl"],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      left: 0,
      padding: Spacing.sm,
      zIndex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
    },
    // 订单信息卡片
    orderCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    orderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    orderLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    orderValue: {
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    amountText: {
      fontSize: 28,
      fontWeight: '700',
      color: '#07C160',
    },
    // 二维码区域
    qrSection: {
      alignItems: 'center',
      padding: Spacing.xl,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
    },
    qrTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: Spacing.lg,
      color: theme.textPrimary,
    },
    qrContainer: {
      padding: Spacing.lg,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
    },
    qrImage: {
      width: 220,
      height: 220,
    },
    qrPlaceholder: {
      width: 220,
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F5F5',
      borderRadius: BorderRadius.md,
    },
    // 倒计时
    countdownBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    countdownText: {
      fontSize: 14,
    },
    countdownWarning: {
      color: theme.error,
    },
    // 状态卡片
    statusCard: {
      alignItems: 'center',
      padding: Spacing.xl,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
    },
    statusIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    statusText: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: Spacing.sm,
    },
    statusDesc: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    // 操作按钮
    buttonGroup: {
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: '#07C160',
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    // 提示信息
    tipsSection: {
      padding: Spacing.lg,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.lg,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: Spacing.sm,
      color: theme.textPrimary,
    },
    tipsItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    tipsDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#07C160',
      marginRight: Spacing.sm,
      marginTop: 6,
    },
    tipsText: {
      flex: 1,
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    // 模拟模式提示
    mockBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      backgroundColor: '#FEF3C7',
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
    },
    mockText: {
      flex: 1,
      fontSize: 13,
      color: '#92400E',
    },
    // 刷新按钮
    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      padding: Spacing.sm,
    },
    refreshText: {
      fontSize: 14,
      color: '#07C160',
    },
  });
};
