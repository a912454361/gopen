import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing.xl,
      alignItems: 'center',
    },
    // 步骤指示器
    stepsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.sm,
    },
    stepItem: {
      alignItems: 'center',
      position: 'relative',
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundDefault,
    },
    stepCircleActive: {
      backgroundColor: theme.primary + '15',
    },
    stepLabel: {
      marginTop: Spacing.xs,
    },
    stepLine: {
      position: 'absolute',
      top: 16,
      left: '100%',
      width: 20,
      height: 2,
    },
    // 产品卡片
    productCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    productIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: Spacing.sm,
    },
    benefitsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    benefitTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: BorderRadius.xs,
    },
    // 支付方式
    section: {
      marginBottom: Spacing.xl,
    },
    payMethodsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    payMethodCard: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.backgroundDefault,
      alignItems: 'center',
      position: 'relative',
    },
    payMethodIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    selectedDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 二维码区域
    qrSection: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    countdownBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.lg,
      width: '100%',
      justifyContent: 'center',
    },
    qrCard: {
      alignItems: 'center',
      width: '100%',
    },
    qrImageContainer: {
      padding: Spacing.lg,
      backgroundColor: '#FFFFFF',
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
    },
    qrPlaceholder: {
      width: 200,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrImage: {
      width: 200,
      height: 200,
    },
    amountDisplay: {
      alignItems: 'center',
      padding: Spacing.lg,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      width: '100%',
    },
    // 收款信息
    accountInfo: {
      width: '100%',
      marginTop: Spacing.lg,
      padding: Spacing.md,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
    },
    accountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    // 确认支付
    confirmSection: {
      width: '100%',
      marginTop: Spacing.xl,
    },
    transactionInput: {
      width: '100%',
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      color: theme.textPrimary,
      fontSize: 14,
      marginTop: Spacing.md,
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.lg,
    },
    // 状态卡片
    statusCard: {
      alignItems: 'center',
      padding: Spacing.xl,
    },
    statusIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    backButton: {
      marginTop: Spacing.xl,
      padding: Spacing.md,
    },
    retryButton: {
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.md,
    },
    // 帮助说明
    helpSection: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
    },
    helpHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    helpList: {
      gap: Spacing.md,
    },
    helpItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    helpNumber: {
      width: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 安全提示
    securityTip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      marginTop: Spacing.lg,
    },
    // 管理员入口
    adminEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
    },
  });
};
