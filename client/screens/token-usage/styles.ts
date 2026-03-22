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
      marginBottom: Spacing.xl,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      backgroundColor: `${theme.primary}10`,
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 80,
    },
    balanceCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: Spacing.xs,
    },
    balanceCurrency: {
      fontSize: 20,
      fontWeight: '600',
    },
    balanceAmount: {
      fontSize: 40,
      fontWeight: '700',
    },
    balanceLabel: {
      marginTop: Spacing.xs,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      borderWidth: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
    },
    statLabel: {
      marginTop: Spacing.xs,
    },
    statTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: 4,
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
    usageItem: {
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
    },
    usageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    usageModel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    usageModelIcon: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    usageTokens: {
      alignItems: 'flex-end',
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      marginTop: Spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: Spacing.lg,
      borderRadius: BorderRadius.md,
      padding: 4,
    },
    tabButton: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
    },
    tabButtonActive: {},
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    rechargeButton: {
      marginTop: Spacing.lg,
    },
    rechargeButtonGradient: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
