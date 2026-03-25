import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xl,
    },
    content: {
      flex: 1,
    },
    sectionTitle: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    updateDate: {
      marginBottom: Spacing.lg,
    },
    paragraph: {
      lineHeight: 22,
      marginBottom: Spacing.md,
    },
    listItem: {
      lineHeight: 22,
      marginBottom: Spacing.xs,
      paddingLeft: Spacing.md,
    },
  });
};
