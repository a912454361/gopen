import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing['5xl'],
    },
    header: {
      marginBottom: Spacing.xl,
      alignItems: 'center',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 120,
    },
    currentPlan: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      alignItems: 'center',
    },
    currentPlanActive: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    planBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    tierGrid: {
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    tierCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      position: 'relative',
      overflow: 'hidden',
    },
    tierCardSelected: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    tierCardRecommended: {
      borderColor: theme.primary,
    },
    recommendedBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderBottomLeftRadius: BorderRadius.xs,
    },
    tierHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    tierIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tierPrice: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    tierFeaturesPreview: {
      gap: Spacing.xs,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    selectedIndicator: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
    },
    featureCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    featureCardHeader: {
      marginBottom: Spacing.md,
    },
    featureSection: {
      marginBottom: Spacing.md,
    },
    subscribeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
    },
    paymentInfo: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginTop: Spacing.lg,
    },
    paymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    copyButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.xs,
      marginLeft: 'auto',
    },
    disclaimer: {
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.md,
    },
  });
};
