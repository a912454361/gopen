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
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      color: theme.textMuted,
      fontSize: 14,
      textAlign: 'center',
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
    loginButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.md,
    },
    alipayButton: {
      backgroundColor: '#1677FF',
    },
    wechatButton: {
      backgroundColor: '#07C160',
    },
    douyinButton: {
      backgroundColor: '#000000',
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      color: theme.textMuted,
      fontSize: 12,
      marginHorizontal: Spacing.md,
    },
    terms: {
      alignItems: 'center',
      marginTop: Spacing.xl,
    },
    termsText: {
      color: theme.textMuted,
      fontSize: 11,
      textAlign: 'center',
    },
    termsLink: {
      color: theme.primary,
    },
    bindingsSection: {
      marginTop: Spacing['2xl'],
    },
    bindingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    bindingIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    bindingInfo: {
      flex: 1,
    },
    bindingPlatform: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    bindingStatus: {
      color: theme.textMuted,
      fontSize: 12,
    },
    bindingAction: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.xs,
    },
    bindAction: {
      backgroundColor: theme.primary,
    },
    unbindAction: {
      backgroundColor: theme.error,
    },
    bindingActionText: {
      fontSize: 12,
      fontWeight: '600',
    },
    userInfo: {
      alignItems: 'center',
      padding: Spacing.xl,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: Spacing.xl,
    },
    userAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    userName: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    userMember: {
      color: theme.primary,
      fontSize: 13,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.error,
      marginTop: Spacing.lg,
    },
    logoutText: {
      color: theme.error,
      fontSize: 14,
      fontWeight: '600',
    },
  });
};
