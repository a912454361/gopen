/**
 * 道具背包样式
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
    
    // 背包头部
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    
    capacityInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    
    // 道具网格
    itemGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    
    itemCard: {
      width: '48%',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    itemIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    
    itemInfo: {
      flex: 1,
    },
    
    itemName: {
      marginBottom: 2,
    },
    
    itemQuantity: {
      color: theme.primary,
      fontWeight: '700',
    },
    
    itemType: {
      marginTop: 2,
    },
    
    // 使用按钮
    useButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    
    useButtonDisabled: {
      backgroundColor: theme.backgroundTertiary,
    },
    
    // 批量使用
    batchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    
    quantityInput: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    // 空背包
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    
    emptyIcon: {
      marginBottom: Spacing.md,
    },
    
    // 道具详情弹窗
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    
    modalContent: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      width: '100%',
      maxWidth: 320,
    },
    
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    
    modalClose: {
      marginLeft: 'auto',
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
