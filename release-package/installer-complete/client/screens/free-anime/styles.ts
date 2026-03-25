import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    
    // Header
    header: {
      marginBottom: Spacing.xl,
    },
    title: {
      marginBottom: Spacing.sm,
    },
    subtitle: {
      opacity: 0.7,
    },
    
    // Style Section
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    styleGrid: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    styleOption: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: theme.backgroundDefault,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    styleOptionActive: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}15`,
    },
    styleIcon: {
      fontSize: 28,
      marginBottom: Spacing.xs,
    },
    styleName: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    
    // Input
    inputContainer: {
      marginBottom: Spacing.xl,
    },
    inputLabel: {
      marginBottom: Spacing.sm,
    },
    textInput: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      fontSize: 16,
      color: theme.textPrimary,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    
    // Options
    optionsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    optionItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    optionText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    
    // Buttons
    buttonRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    primaryButton: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    secondaryButton: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: theme.backgroundDefault,
    },
    buttonIcon: {
      fontSize: 18,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    
    // Result
    resultContainer: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    resultTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    resultContent: {
      fontSize: 14,
      lineHeight: 24,
      color: theme.textSecondary,
    },
    
    // Loading
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    loadingText: {
      marginTop: Spacing.md,
      color: theme.textMuted,
    },
    
    // Empty
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: Spacing.md,
    },
    emptyText: {
      color: theme.textMuted,
    },
    
    // Character
    characterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    characterCard: {
      width: '48%',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    characterImage: {
      width: '100%',
      height: 120,
      backgroundColor: theme.backgroundTertiary,
    },
    characterInfo: {
      padding: Spacing.md,
    },
    characterName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    characterRole: {
      fontSize: 11,
      color: theme.primary,
      marginTop: 2,
    },
    
    // Media
    mediaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    mediaItem: {
      width: '48%',
      aspectRatio: 16/9,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    mediaImage: {
      width: '100%',
      height: '100%',
    },
  });
};
