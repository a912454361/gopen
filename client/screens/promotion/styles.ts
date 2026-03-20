import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing["2xl"],
      paddingBottom: Spacing["5xl"],
    },
    
    // 头部区域
    header: {
      marginBottom: Spacing.xl,
    },
    title: {
      marginBottom: Spacing.xs,
    },
    subtitle: {
      opacity: 0.7,
    },
    
    // 统计卡片
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statLabel: {
      marginBottom: Spacing.xs,
    },
    statValue: {
      marginBottom: Spacing.xs,
    },
    statChange: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    
    // 推广链接卡片
    linkCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
    },
    linkHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    linkBox: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    linkText: {
      fontFamily: 'monospace',
    },
    linkActions: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      backgroundColor: theme.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    actionButtonText: {
      color: theme.buttonPrimaryText,
    },
    secondaryButton: {
      backgroundColor: theme.backgroundTertiary,
    },
    secondaryButtonText: {
      color: theme.textPrimary,
    },
    
    // 二维码区域
    qrContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    qrImage: {
      width: 200,
      height: 200,
      borderRadius: BorderRadius.md,
    },
    
    // 提现卡片
    withdrawCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
    },
    withdrawHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    availableAmount: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: Spacing.md,
    },
    withdrawButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    withdrawButtonText: {
      color: theme.buttonPrimaryText,
    },
    
    // 用户列表
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    userList: {
      gap: Spacing.md,
    },
    userCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    userInfo: {
      flex: 1,
    },
    userStats: {
      flexDirection: 'row',
      gap: Spacing.lg,
      marginTop: Spacing.sm,
    },
    userStat: {
      flex: 1,
    },
    
    // 提现记录
    withdrawalList: {
      gap: Spacing.md,
    },
    withdrawalCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    withdrawalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    statusPending: {
      backgroundColor: '#FEF3C7',
    },
    statusApproved: {
      backgroundColor: '#D1FAE5',
    },
    statusRejected: {
      backgroundColor: '#FEE2E2',
    },
    
    // 申明推广员
    applyCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
    },
    applyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    applyTitle: {
      marginBottom: Spacing.sm,
    },
    applyDesc: {
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    applyButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing["2xl"],
      borderRadius: BorderRadius.md,
    },
    applyButtonText: {
      color: theme.buttonPrimaryText,
    },
    
    // Tab切换
    tabContainer: {
      flexDirection: 'row',
      marginBottom: Spacing.lg,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
      borderRadius: BorderRadius.sm,
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    tabText: {
      color: theme.textMuted,
    },
    activeTabText: {
      color: theme.buttonPrimaryText,
    },
    
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
    },
    modalTitle: {
      marginBottom: Spacing.lg,
    },
    input: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
    },
    submitButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      backgroundColor: theme.primary,
    },
    
    // 加载状态
    loading: {
      paddingVertical: Spacing.xl,
      alignItems: 'center',
    },
    
    // 空状态
    emptyState: {
      paddingVertical: Spacing["2xl"],
      alignItems: 'center',
    },
    emptyText: {
      marginTop: Spacing.md,
      color: theme.textMuted,
    },
  });
};
