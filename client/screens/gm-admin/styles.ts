/**
 * GM后台管理样式
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
    
    // 登录表单
    loginContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    
    loginTitle: {
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    
    input: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    loginButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    
    // 统计卡片
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
    },
    
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      marginTop: Spacing.xs,
    },
    
    statLabel: {
      marginTop: Spacing.xs,
    },
    
    // Tab 导航
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: BorderRadius.md,
    },
    
    tabActive: {
      backgroundColor: theme.primary,
    },
    
    // 表单区域
    formSection: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    
    formTitle: {
      marginBottom: Spacing.md,
    },
    
    formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    
    formLabel: {
      width: 80,
    },
    
    formInput: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    formSelect: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    // 按钮
    button: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    
    buttonSecondary: {
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    buttonDanger: {
      backgroundColor: theme.error,
    },
    
    // 用户列表
    userItem: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    
    userInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    
    userStats: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    
    userStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    
    // 日志
    logItem: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
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
