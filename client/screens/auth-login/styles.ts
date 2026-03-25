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
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
    },
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: Spacing.lg,
    },
    backText: {
      marginLeft: Spacing.xs,
    },
    logo: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius.xl,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      marginBottom: Spacing.xs,
    },
    subtitle: {
      textAlign: 'center',
    },
    form: {
      marginBottom: Spacing.xl,
    },
    inputGroup: {
      marginBottom: Spacing.lg,
    },
    inputLabel: {
      marginBottom: Spacing.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: Spacing.md,
    },
    input: {
      flex: 1,
      paddingVertical: Spacing.md,
      color: theme.textPrimary,
      fontSize: 16,
    },
    inputIcon: {
      marginRight: Spacing.sm,
    },
    codeButton: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.md,
      marginLeft: Spacing.sm,
    },
    codeButtonText: {
      fontSize: 13,
    },
    codeButtonDisabled: {
      backgroundColor: theme.backgroundTertiary,
    },
    loginButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      fontWeight: '600',
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: Spacing.sm,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: Spacing.xl,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      marginHorizontal: Spacing.md,
    },
    oauthSection: {
      marginBottom: Spacing.xl,
    },
    oauthTitle: {
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    oauthButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.md,
      flexWrap: 'wrap',
    },
    oauthButton: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      marginRight: Spacing.xs,
    },
    footerLink: {
      fontWeight: '600',
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xl,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderRadius: BorderRadius.md,
    },
    tabActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontWeight: '500',
    },
    tabTextActive: {
      color: theme.buttonPrimaryText,
    },
    errorText: {
      color: theme.error,
      marginTop: Spacing.xs,
      fontSize: 13,
    },
    // 密码可见性切换
    eyeButton: {
      padding: Spacing.sm,
    },
  });
};
