import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: `${theme.primary}10`,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
    },
    navTitle: {
      marginLeft: Spacing.md,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
      alignItems: 'center',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 120,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statCard: {
      width: '47%',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 12,
      marginTop: 4,
    },
    statChange: {
      fontSize: 11,
      marginTop: 4,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    chartCard: {
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      marginBottom: Spacing.lg,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    chartBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 120,
      gap: Spacing.sm,
    },
    chartBar: {
      flex: 1,
      borderRadius: 4,
      minHeight: 20,
    },
    chartLabels: {
      flexDirection: 'row',
      marginTop: Spacing.sm,
      gap: Spacing.sm,
    },
    chartLabel: {
      flex: 1,
      textAlign: 'center',
      fontSize: 10,
    },
    typeList: {
      gap: Spacing.sm,
    },
    typeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    typeColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: Spacing.md,
    },
    typeBar: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      marginHorizontal: Spacing.md,
    },
    typeCount: {
      fontSize: 12,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
  });
};
