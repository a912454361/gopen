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
      marginBottom: Spacing.xs,
    },
    subtitle: {
      opacity: 0.7,
    },
    
    // Engine Status Card
    statusCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    statusTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    statusGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    statusItem: {
      flex: 1,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      alignItems: 'center',
    },
    statusValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
    },
    statusLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 4,
    },
    
    // Model Providers
    providersSection: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    providerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    providerCard: {
      width: '48%',
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    providerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    providerStatus: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    providerName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    providerType: {
      fontSize: 11,
      color: theme.textMuted,
    },
    providerTask: {
      fontSize: 10,
      color: theme.textMuted,
      marginTop: 4,
    },
    
    // Project Creation
    inputContainer: {
      marginBottom: Spacing.lg,
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
      minHeight: 100,
      textAlignVertical: 'top',
    },
    
    // Style Selection
    styleGrid: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    styleOption: {
      flex: 1,
      padding: Spacing.md,
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
    styleName: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    
    // Buttons
    primaryButton: {
      backgroundColor: theme.primary,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    secondaryButton: {
      backgroundColor: theme.backgroundDefault,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    
    // Project Card
    projectCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    projectTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
    },
    projectStatus: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    projectInfo: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    projectInfoItem: {
      alignItems: 'center',
    },
    
    // Scene List
    sceneList: {
      marginTop: Spacing.md,
    },
    sceneCard: {
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    sceneHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sceneName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    sceneLocation: {
      fontSize: 12,
      color: theme.textMuted,
    },
    
    // Render Button
    renderButton: {
      backgroundColor: theme.primary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    renderButtonText: {
      fontSize: 12,
      color: theme.buttonPrimaryText,
      fontWeight: '600',
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
    
    // Access Denied
    deniedContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing['3xl'],
    },
    deniedIcon: {
      marginBottom: Spacing.lg,
    },
    deniedTitle: {
      marginBottom: Spacing.sm,
    },
    deniedText: {
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    
    // Ultra Render
    ultraCard: {
      backgroundColor: `${theme.primary}10`,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
      marginBottom: Spacing.lg,
    },
    ultraTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: Spacing.sm,
    },
    ultraDesc: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: Spacing.md,
    },
    ultraOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    ultraOption: {
      backgroundColor: theme.backgroundDefault,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: BorderRadius.md,
    },
    ultraOptionActive: {
      backgroundColor: theme.primary,
    },
    
    // GPU Meter
    gpuMeter: {
      height: 8,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: Spacing.sm,
    },
    gpuMeterFill: {
      height: '100%',
      borderRadius: 4,
    },
  });
};
