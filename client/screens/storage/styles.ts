import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    headerSubtitle: {
      color: theme.textMuted,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 80,
    },
    storageOverview: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      alignItems: 'center',
    },
    storageIcon: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    storageValue: {
      color: theme.primary,
      fontSize: 36,
      fontWeight: '700',
    },
    storageLabel: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: Spacing.xs,
    },
    storageBar: {
      width: '100%',
      height: 8,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: Spacing.lg,
    },
    storageStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: Spacing.lg,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    statLabel: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: Spacing.xs,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 1,
    },
    fileList: {
      gap: Spacing.md,
    },
    fileCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    fileIcon: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    fileMeta: {
      color: theme.textMuted,
      fontSize: 11,
    },
    fileActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    fileAction: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.xs,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    serverCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    serverHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    serverName: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    serverStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusOnline: {
      backgroundColor: theme.success,
    },
    statusOffline: {
      backgroundColor: theme.error,
    },
    serverInfo: {
      gap: Spacing.sm,
    },
    serverInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    serverInfoLabel: {
      color: theme.textMuted,
      fontSize: 12,
    },
    serverInfoValue: {
      color: theme.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    upgradeCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.primary,
      padding: Spacing.lg,
      marginTop: Spacing.xl,
    },
    upgradeTitle: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    upgradeDesc: {
      color: theme.textSecondary,
      fontSize: 13,
      marginBottom: Spacing.md,
    },
    upgradeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.primary,
    },
    upgradeButtonText: {
      color: theme.backgroundRoot,
      fontSize: 13,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
    },
  });
};
