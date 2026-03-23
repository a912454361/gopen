import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerLeft: {
      flex: 1,
    },
    connectionBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      marginBottom: Spacing.xs,
    },
    subtitle: {
      opacity: 0.7,
    },
    timelineCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    timeline: {
      marginTop: Spacing.md,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      position: 'relative',
    },
    timelineIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      marginRight: Spacing.md,
    },
    timelineContent: {
      flex: 1,
    },
    timelineLine: {
      position: 'absolute',
      left: 19,
      top: 44,
      width: 2,
      height: 20,
    },
    statusCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.lg,
    },
    statusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    progressSection: {
      marginBottom: Spacing.lg,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    progressBar: {
      height: 12,
      borderRadius: BorderRadius.sm,
      overflow: 'hidden',
      marginBottom: Spacing.xs,
    },
    progressFill: {
      height: '100%',
      borderRadius: BorderRadius.sm,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    modelsSection: {
      marginBottom: Spacing.lg,
    },
    modelsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    modelCard: {
      width: '23%',
      padding: Spacing.sm,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    modelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    modelStatus: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: theme.primary,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      marginBottom: Spacing.lg,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
    infoContent: {
      flex: 1,
    },
    logsCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.lg,
      maxHeight: 200,
    },
    logsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    logsList: {
      maxHeight: 140,
    },
    logItem: {
      fontFamily: 'monospace',
      marginBottom: 2,
    },
    runningIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    systemStatusGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: Spacing.sm,
    },
    systemStatusItem: {
      alignItems: 'center',
      flex: 1,
    },
    systemStatusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
  });
};
