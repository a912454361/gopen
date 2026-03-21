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
      paddingBottom: Spacing['2xl'],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      color: theme.textSecondary,
      fontSize: 12,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: Spacing.md,
    },
    storageCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    storageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    storageIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    baiduIcon: {
      backgroundColor: '#2932E1',
    },
    alyunIcon: {
      backgroundColor: '#FF6A00',
    },
    storageInfo: {
      flex: 1,
    },
    storageName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    storageStatus: {
      color: theme.textMuted,
      fontSize: 12,
    },
    storageConnected: {
      color: theme.success,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
    },
    storageAction: {
      padding: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: BorderRadius.xs,
    },
    connectButton: {
      backgroundColor: theme.primary,
    },
    disconnectButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.error,
    },
    syncButton: {
      backgroundColor: theme.primary,
    },
    actionButtonText: {
      fontSize: 13,
      fontWeight: '600',
    },
    syncSection: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginTop: Spacing.md,
    },
    syncHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    syncTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    syncStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    syncStatusText: {
      color: theme.textMuted,
      fontSize: 12,
    },
    syncProgress: {
      height: 4,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 2,
      marginBottom: Spacing.md,
    },
    syncProgressFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 2,
    },
    syncStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    syncStat: {
      alignItems: 'center',
    },
    syncStatValue: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    syncStatLabel: {
      color: theme.textMuted,
      fontSize: 11,
    },
    fileList: {
      marginTop: Spacing.lg,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.xs,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    fileIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.xs,
      backgroundColor: theme.backgroundDefault,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '500',
      marginBottom: Spacing.xs,
    },
    fileSize: {
      color: theme.textMuted,
      fontSize: 11,
    },
    fileStatus: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    fileSynced: {
      backgroundColor: theme.success,
    },
    filePending: {
      backgroundColor: '#D97706',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      padding: Spacing['2xl'],
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    tipCard: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
      padding: Spacing.lg,
      marginTop: Spacing.xl,
    },
    tipTitle: {
      color: theme.textPrimary,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: Spacing.sm,
    },
    tipText: {
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
  });
};
