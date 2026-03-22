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
    header: {
      marginBottom: Spacing.xl,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      backgroundColor: `${theme.primary}10`,
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 80,
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: Spacing.xl,
      borderRadius: BorderRadius.md,
      backgroundColor: theme.backgroundTertiary,
      padding: 4,
    },
    tabButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
    },
    tabButtonActive: {
      backgroundColor: theme.primary,
    },
    modelSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      marginBottom: Spacing.lg,
      backgroundColor: theme.backgroundTertiary,
    },
    modelSelectorIcon: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // 语音转文字
    recordSection: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    recordButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    recordButtonInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordWave: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    recordTime: {
      fontFamily: 'JetBrainsMono',
      fontSize: 24,
      color: theme.primary,
      marginTop: Spacing.md,
    },
    resultSection: {
      marginBottom: Spacing.lg,
    },
    resultCard: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundDefault,
      padding: Spacing.lg,
      marginTop: Spacing.sm,
    },
    resultText: {
      fontSize: 15,
      lineHeight: 24,
      color: theme.textPrimary,
    },
    // 文字转语音
    inputSection: {
      marginBottom: Spacing.lg,
    },
    inputWrap: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      padding: Spacing.md,
      marginTop: Spacing.sm,
    },
    textInput: {
      minHeight: 150,
      maxHeight: 300,
      fontSize: 15,
      color: theme.textPrimary,
      lineHeight: 22,
    },
    charCount: {
      textAlign: 'right',
      marginTop: Spacing.sm,
    },
    voiceSection: {
      marginBottom: Spacing.lg,
    },
    voiceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    voiceOption: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundDefault,
    },
    voiceOptionActive: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}10`,
    },
    // 音频播放器
    playerSection: {
      marginBottom: Spacing.lg,
    },
    playerCard: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: theme.primary,
      backgroundColor: theme.backgroundDefault,
      padding: Spacing.lg,
      marginTop: Spacing.sm,
    },
    playerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xl,
      marginBottom: Spacing.md,
    },
    playButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    progressBar: {
      height: 4,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 2,
      marginBottom: Spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    timeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    // 按钮样式
    actionButton: {
      marginBottom: Spacing.lg,
    },
    actionButtonGradient: {
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: BorderRadius.lg,
      borderTopRightRadius: BorderRadius.lg,
      padding: Spacing.lg,
      paddingBottom: Spacing['2xl'],
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    modelPickerItem: {
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
      backgroundColor: theme.backgroundTertiary,
    },
    modelPickerIcon: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tierBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    modalButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
    },
    priceHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.lg,
    },
  });
};
