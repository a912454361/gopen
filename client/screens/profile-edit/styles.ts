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
      paddingBottom: Spacing['5xl'],
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      marginBottom: Spacing.lg,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: `${theme.primary}10`,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
    },
    navTitle: {
      marginLeft: Spacing.md,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: Spacing.md,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.backgroundTertiary,
      borderWidth: 3,
      borderColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: Spacing.sm,
      alignItems: 'center',
    },
    editButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.backgroundRoot,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      marginBottom: Spacing.sm,
    },
    inputWrap: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundDefault,
      padding: Spacing.md,
    },
    input: {
      fontSize: 16,
      color: theme.textPrimary,
    },
    bioInput: {
      minHeight: 120,
      maxHeight: 200,
      textAlignVertical: 'top',
    },
    charCount: {
      textAlign: 'right',
      marginTop: Spacing.sm,
    },
    hint: {
      marginTop: Spacing.sm,
    },
    buttonSection: {
      marginTop: Spacing['2xl'],
    },
    saveButton: {
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
    },
    saveButtonGradient: {
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
