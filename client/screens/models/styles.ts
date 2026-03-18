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
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['2xl'],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    // 筛选栏
    filterRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
      flexWrap: 'wrap',
    },
    filterChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundTertiary,
    },
    filterChipActive: {
      backgroundColor: theme.primary,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
    },
    // 分类标题
    categoryHeader: {
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    categoryTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    // 模型卡片
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
      width: 48,
      height: 48,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    modelInfo: {
      flex: 1,
    },
    modelTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    modelMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    modelProvider: {
      color: theme.textMuted,
      fontSize: 11,
    },
    modelBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    freeBadge: {
      backgroundColor: '#05966920',
    },
    memberBadge: {
      backgroundColor: '#D9770620',
    },
    superBadge: {
      backgroundColor: '#7C3AED20',
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    modelDesc: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: Spacing.sm,
    },
    modelFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    priceGroup: {
      alignItems: 'flex-start',
    },
    priceLabel: {
      color: theme.textMuted,
      fontSize: 10,
      marginBottom: 2,
    },
    priceValue: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    selectButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.primary,
    },
    selectButtonText: {
      color: theme.buttonPrimaryText,
      fontSize: 13,
      fontWeight: '600',
    },
    selectedCard: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    // 估算卡片
    estimateCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginTop: Spacing.xl,
    },
    estimateTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: Spacing.md,
    },
    estimateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    estimateLabel: {
      color: theme.textMuted,
      fontSize: 12,
    },
    estimateValue: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    estimateTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    estimateTotalLabel: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    estimateTotalValue: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: '700',
    },
    // GPU实例卡片
    gpuCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    gpuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    gpuIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.sm,
      backgroundColor: '#7C3AED20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    gpuInfo: {
      flex: 1,
    },
    gpuName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    gpuSpecs: {
      color: theme.textMuted,
      fontSize: 11,
    },
    gpuPrice: {
      alignItems: 'flex-end',
    },
    gpuPriceValue: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
    },
    gpuPriceUnit: {
      color: theme.textMuted,
      fontSize: 11,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
  });
};
