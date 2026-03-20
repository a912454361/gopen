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
    logoContainer: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    logo: {
      width: 120,
      height: 120,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.md,
    },
    appName: {
      marginTop: Spacing.sm,
    },
    version: {
      marginTop: Spacing.xs,
    },
    card: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
    },
    cardTitle: {
      marginBottom: Spacing.md,
    },
    downloadSection: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      marginBottom: Spacing.lg,
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    buttonTextContainer: {
      marginLeft: Spacing.md,
    },
    orText: {
      textAlign: 'center',
      marginVertical: Spacing.md,
    },
    storeButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: Spacing.md,
    },
    storeButton: {
      flex: 1,
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      gap: Spacing.xs,
    },
    footer: {
      alignItems: 'center',
      marginTop: Spacing.xl,
    },
  });
};
