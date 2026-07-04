import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing['5xl'],
    },
    container: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
    loading: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingVertical: Spacing['3xl'],
    },
    emptyText: {
      marginTop: Spacing.lg,
    },

    // 签到卡片
    signInCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginTop: Spacing.lg,
      marginBottom: Spacing.lg,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    signInHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.lg,
    },
    signInTitle: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    signInStreak: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    signInReward: {
      alignItems: 'center' as const,
      marginBottom: Spacing.xl,
    },
    signInButton: {
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center' as const,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    signedInButton: {
      backgroundColor: theme.backgroundTertiary,
      shadowOpacity: 0,
    },
    signInDays: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: Spacing.xl,
    },
    signInDay: {
      alignItems: 'center' as const,
      flex: 1,
    },
    signInDayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.xs,
    },
    signInDayActive: {
      backgroundColor: theme.primary,
    },
    signInDayInactive: {
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.border,
    },

    // 任务卡片
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.md,
      marginTop: Spacing.lg,
    },
    taskCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    taskHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    taskIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: Spacing.md,
    },
    taskInfo: {
      flex: 1,
    },
    taskReward: {
      alignItems: 'flex-end' as const,
    },
    taskAction: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    taskButton: {
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center' as const,
    },
    taskButtonCompleted: {
      backgroundColor: theme.backgroundTertiary,
    },

    // 统计卡片
    statsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: {
      marginTop: Spacing.xs,
    },
    statLabel: {
      marginTop: Spacing.xs,
    },

    // 邀请卡片
    inviteCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inviteHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.lg,
    },
    inviteCode: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    inviteButtons: {
      flexDirection: 'row' as const,
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    inviteButton: {
      flex: 1,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center' as const,
    },

    // Tab
    tabContainer: {
      flexDirection: 'row' as const,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center' as const,
      borderRadius: BorderRadius.md,
    },
    activeTab: {
      backgroundColor: theme.primary,
    },

    // 奖励记录
    recordCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    recordInfo: {
      flex: 1,
    },
    recordAmount: {
      alignItems: 'flex-end' as const,
    },
  });
};
