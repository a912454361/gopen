/**
 * 充值中心样式
 */

import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    
    // 用户信息卡片
    userCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    
    userInfo: {
      flex: 1,
    },
    
    currencyRow: {
      flexDirection: 'row',
      gap: Spacing.xl,
      marginTop: Spacing.md,
    },
    
    currencyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    
    // 代金券卡片
    couponCard: {
      backgroundColor: '#F59E0B',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      position: 'relative',
      overflow: 'hidden',
    },
    
    couponHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    
    couponBadge: {
      backgroundColor: 'rgba(255,255,255,0.3)',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    
    couponAmount: {
      fontSize: 36,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    
    couponDesc: {
      color: 'rgba(255,255,255,0.9)',
      marginTop: Spacing.xs,
    },
    
    // 折扣信息
    discountBanner: {
      backgroundColor: `${theme.error}15`,
      borderWidth: 1,
      borderColor: theme.error,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    discountText: {
      color: theme.error,
      fontWeight: '700',
      marginLeft: Spacing.sm,
    },
    
    // 套餐列表
    packagesGrid: {
      gap: Spacing.md,
    },
    
    packageCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    
    packageCardSelected: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}10`,
    },
    
    packageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    
    packageIcon: {
      fontSize: 24,
      marginRight: Spacing.md,
    },
    
    packageInfo: {
      flex: 1,
    },
    
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    
    originalPrice: {
      textDecorationLine: 'line-through',
      color: theme.textMuted,
    },
    
    finalPrice: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.error,
    },
    
    rewardsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    
    rewardBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: theme.backgroundTertiary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    
    // 使用代金券选项
    couponOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.backgroundDefault,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
    },
    
    // 支付按钮
    payButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    
    payButtonText: {
      color: theme.buttonPrimaryText,
      fontWeight: '700',
      fontSize: 16,
    },
    
    // 订单记录
    sectionTitle: {
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    
    orderCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    
    statusCompleted: {
      backgroundColor: `${theme.success}20`,
    },
    
    statusPending: {
      backgroundColor: `${theme.error}20`,
    },
    
    // 加载状态
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
  });
};
