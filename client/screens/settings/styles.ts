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
    profileCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 1,
      borderColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    profileEmail: {
      color: theme.textMuted,
      fontSize: 13,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      color: theme.textMuted,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '600',
      marginBottom: Spacing.md,
    },
    menuList: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    menuItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    menuIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: '500',
    },
    menuSubtitle: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: Spacing.xs,
    },
    menuValue: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    versionInfo: {
      alignItems: 'center',
      marginTop: Spacing['3xl'],
    },
    versionText: {
      color: theme.textMuted,
      fontSize: 12,
    },
    versionNumber: {
      color: theme.primary,
    },
  });
};
