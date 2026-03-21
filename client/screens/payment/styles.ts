import { StyleSheet, Dimensions } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';
import { getQRCodeSize, scaleSize, isSmallScreen } from '@/utils/responsive';

// 屏幕宽度
const SCREEN_WIDTH = Dimensions.get('window').width;
const qrSize = getQRCodeSize();

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing['3xl'],
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.md,
    },

    // 支付方式选择
    payMethodRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },

    payMethodCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      position: 'relative',
    },

    payMethodIcon: {
      width: scaleSize(48),
      height: scaleSize(48),
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },

    selectedDot: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      width: scaleSize(16),
      height: scaleSize(16),
      borderRadius: scaleSize(8),
      justifyContent: 'center',
      alignItems: 'center',
    },

    // 收款码区域
    qrSection: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.xl,
    },

    qrCard: {
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#fff',
      marginBottom: Spacing.lg,
    },

    qrImage: {
      width: qrSize,
      height: qrSize,
    },

    qrPlaceholder: {
      width: qrSize,
      height: qrSize,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundTertiary,
    },

    // 收款账户信息
    accountInfo: {
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
    },

    accountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },

    // 表单区域
    formSection: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.xl,
    },

    inputGroup: {
      marginBottom: Spacing.lg,
    },

    input: {
      borderWidth: 1,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      fontSize: 14,
      marginTop: Spacing.xs,
    },

    // 提交按钮
    submitButton: {
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },

    // 状态卡片
    statusCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.backgroundDefault,
    },

    statusIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // 提示区域
    tipsSection: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
    },

    tipItem: {
      flexDirection: 'row',
      marginBottom: Spacing.sm,
    },
  });
};
