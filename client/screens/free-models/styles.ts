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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.md,
    },
    header: {
      marginBottom: Spacing.xl,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    title: {
      marginLeft: Spacing.sm,
    },
    subtitle: {
      lineHeight: 22,
    },
    summaryCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    summaryItem: {
      alignItems: 'center',
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    modelList: {
      gap: Spacing.md,
    },
    modelCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    modelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    modelInfo: {
      flex: 1,
    },
    modelName: {
      marginBottom: 2,
    },
    typeBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    featuresRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    featureTag: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.sm,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    usageRow: {
      marginTop: Spacing.sm,
    },
    usageBar: {
      height: 4,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 2,
      marginBottom: Spacing.xs,
      overflow: 'hidden',
    },
    usageProgress: {
      height: '100%',
      borderRadius: 2,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    actionText: {
      marginLeft: Spacing.sm,
    },
    tipsCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.md,
    },
    tipsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    inputContainer: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    textInput: {
      minHeight: 80,
      textAlignVertical: 'top',
      fontSize: 16,
      color: theme.textPrimary,
    },
    noPermissionCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing['2xl'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    noPermissionText: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
  });
};
