import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: Spacing['2xl'],
      paddingTop: Spacing.md,
      paddingBottom: Spacing['2xl'],
      justifyContent: 'center',
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: Spacing['3xl'],
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.backgroundDefault,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      marginBottom: Spacing.sm,
    },
    subtitle: {
      textAlign: 'center',
    },
    biometricButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      marginBottom: Spacing.xl,
      borderWidth: 1.5,
      borderColor: theme.primary,
      gap: Spacing.md,
    },
    biometricText: {
      marginLeft: Spacing.md,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.border,
    },
    dividerText: {
      marginHorizontal: Spacing.md,
    },
    form: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    inputGroup: {
      marginBottom: Spacing.lg,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.md,
      height: 52,
    },
    inputIcon: {
      marginRight: Spacing.md,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.textPrimary,
    },
    eyeButton: {
      padding: Spacing.xs,
    },
    loginButton: {
      backgroundColor: theme.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.xl,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    hintSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.lg,
      gap: Spacing.xs,
    },
    hintText: {
      marginLeft: Spacing.xs,
    },
    footer: {
      alignItems: 'center',
      marginTop: Spacing['3xl'],
    },
  });
};
