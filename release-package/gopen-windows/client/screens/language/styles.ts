import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing['2xl'],
    },
    title: {
      marginBottom: Spacing.sm,
    },
    description: {
      lineHeight: 22,
    },
    currentSection: {
      marginBottom: Spacing['2xl'],
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    currentLanguageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
    },
    currentLanguageInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    currentLanguageName: {
      marginBottom: Spacing.xs,
    },
    currentLanguageNative: {
      fontSize: 12,
    },
    checkIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    languageList: {
      gap: Spacing.md,
    },
    languageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
    },
    languageCardActive: {
      borderWidth: 2,
    },
    flagContainer: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    flagText: {
      fontSize: 16,
      fontWeight: '700',
    },
    languageInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    languageName: {
      marginBottom: Spacing.xs,
    },
    languageNative: {
      fontSize: 12,
    },
    selectedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    selectedText: {
      marginLeft: Spacing.xs,
      fontSize: 12,
    },
  });
};
