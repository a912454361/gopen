import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing['5xl'],
    },
    heroSection: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
      paddingHorizontal: Spacing.lg,
      borderBottomLeftRadius: BorderRadius.xl,
      borderBottomRightRadius: BorderRadius.xl,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    appName: {
      fontWeight: '700',
    },
    appSlogan: {
      marginTop: Spacing.xs,
    },
    appDesc: {
      marginTop: Spacing.xs,
    },
    featuresSection: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
    },
    sectionTitle: {
      marginBottom: Spacing.lg,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    featureItem: {
      width: '47%',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    downloadSection: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      gap: Spacing.md,
    },
    downloadCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    downloadCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    platformIcon: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    platformInfo: {
      flex: 1,
      marginLeft: Spacing.lg,
    },
    recommendCard: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
    },
    recommendHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recommendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.lg,
    },
    backupSection: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      gap: Spacing.sm,
    },
    backupLink: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    footer: {
      alignItems: 'center',
      paddingTop: Spacing['2xl'],
      gap: Spacing.xs,
    },
  });
};
