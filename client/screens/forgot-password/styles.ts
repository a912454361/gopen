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
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: Spacing.lg,
    },
    backText: {
      marginLeft: Spacing.xs,
    },
    header: {
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
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
    submitButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontWeight: '600',
    },
    errorText: {
      color: theme.error,
      marginTop: Spacing.xs,
      fontSize: 13,
    },
    successContainer: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.success,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    successTitle: {
      marginBottom: Spacing.sm,
    },
    successText: {
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    backToLoginButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: BorderRadius.lg,
    },
    backToLoginText: {
      fontWeight: '600',
    },
  });
};
