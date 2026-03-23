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
      paddingBottom: Spacing['5xl'],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    headerIcon: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.lg,
      backgroundColor: `${theme.primary}10`,
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginBottom: Spacing.xl,
      width: 100,
    },
    // 创作类型
    typeSection: {
      marginBottom: Spacing.xl,
    },
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: Spacing.sm,
      gap: Spacing.sm,
    },
    typeCard: {
      width: '48%',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundDefault,
      alignItems: 'center',
      gap: Spacing.xs,
    },
    typeCardDisabled: {
      opacity: 0.5,
    },
    typeIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    // 模型选择
    modelSection: {
      marginBottom: Spacing.xl,
    },
    modelSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      marginTop: Spacing.sm,
    },
    selectedModelInfo: {
      flex: 1,
    },
    // 输入区域
    inputSection: {
      marginBottom: Spacing.xl,
    },
    inputWrap: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      padding: Spacing.md,
      marginTop: Spacing.sm,
    },
    promptInput: {
      minHeight: 120,
      maxHeight: 300,
      fontSize: 15,
      color: theme.textPrimary,
      lineHeight: 22,
    },
    inputActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    // 生成按钮
    generateButton: {
      marginBottom: Spacing.xl,
    },
    generateButtonGradient: {
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    // 结果区域
    resultSection: {
      marginBottom: Spacing.xl,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    resultCard: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    resultImage: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: theme.backgroundTertiary,
    },
    resultTextContainer: {
      padding: Spacing.lg,
      maxHeight: 400,
    },
    resultActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
    // 快捷入口
    shortcutsSection: {
      marginBottom: Spacing.lg,
    },
    shortcutsGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    shortcutCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      backgroundColor: theme.backgroundDefault,
    },
    // 模型选择器 Modal
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    pickerContainer: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '70%',
    },
    pickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    pickerList: {
      padding: Spacing.md,
    },
    modelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
    },
    modelItemDisabled: {
      opacity: 0.5,
    },
    modelInfo: {
      flex: 1,
    },
    modelNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    freeTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    memberTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    superTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    favoriteSection: {
      marginBottom: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.xs,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: Spacing.md,
    },
  });
};
