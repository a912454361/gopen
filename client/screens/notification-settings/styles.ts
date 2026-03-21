import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 120,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    infoIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    categorySection: {
      marginBottom: Spacing.xl,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    categoryIcon: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsList: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    settingItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    settingIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingContent: {
      flex: 1,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.md,
      marginBottom: Spacing.xl,
    },
    quickActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.xl,
    },
    dndSection: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
    },
    dndHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    dndTimeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.lg,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    dndTimeItem: {
      alignItems: 'center',
    },
    dndTimeValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
  });
};
