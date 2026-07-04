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
    header: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    title: {
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      textAlign: 'center',
    },
    // 粒子容器
    particleContainer: {
      height: 200,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      marginBottom: Spacing.xl,
      position: 'relative',
    },
    particleCanvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    particleOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    particleText: {
      fontSize: 48,
      fontWeight: 'bold',
    },
    // 进度区域
    progressSection: {
      marginBottom: Spacing.xl,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    progressBar: {
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
    },
    progressMessage: {
      marginTop: Spacing.sm,
      textAlign: 'center',
    },
    // 输入区域
    inputSection: {
      marginBottom: Spacing.xl,
    },
    inputLabel: {
      marginBottom: Spacing.sm,
    },
    input: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      fontSize: 16,
    },
    // 模型展示
    modelsSection: {
      marginBottom: Spacing.xl,
    },
    modelCard: {
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    modelIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    modelInfo: {
      flex: 1,
    },
    modelName: {
      fontWeight: '600',
    },
    modelTask: {
      fontSize: 12,
    },
    modelStatus: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    // 按钮
    createButton: {
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    createButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    // 结果区域
    resultSection: {
      marginTop: Spacing.lg,
    },
    resultCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    resultTitle: {
      marginBottom: Spacing.sm,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    resultDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: Spacing.sm,
    },
    // 粒子效果类型选择
    particleTypes: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    particleTypeButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    particleTypeText: {
      fontSize: 14,
    },
  });
};
