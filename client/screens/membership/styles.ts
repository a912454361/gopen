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
    headerTitle: {
      color: theme.textPrimary,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    headerSubtitle: {
      color: theme.textMuted,
      fontSize: 12,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '600',
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
    planBadgeText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 1,
    },
    planTitle: {
      color: theme.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    planExpiry: {
      color: theme.textMuted,
      fontSize: 13,
    },
    sectionTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1,
      marginBottom: Spacing.md,
    },
    plansGrid: {
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    planCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
    },
    planCardPopular: {
      borderColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    planCardSelected: {
      borderColor: theme.accent,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    planName: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    planDuration: {
      color: theme.textMuted,
      fontSize: 12,
    },
    popularBadge: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xs,
    },
    popularBadgeText: {
      color: theme.backgroundRoot,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },
    planPrice: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: Spacing.md,
    },
    priceSymbol: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: '700',
    },
    priceValue: {
      color: theme.primary,
      fontSize: 36,
      fontWeight: '700',
    },
    priceUnit: {
      color: theme.textMuted,
      fontSize: 14,
      marginLeft: Spacing.xs,
    },
    originalPrice: {
      color: theme.textMuted,
      fontSize: 14,
      textDecorationLine: 'line-through',
      marginLeft: Spacing.sm,
    },
    featuresList: {
      gap: Spacing.sm,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    featureText: {
      color: theme.textSecondary,
      fontSize: 13,
    },
    subscribeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      padding: Spacing.lg,
      borderRadius: BorderRadius.sm,
      marginTop: Spacing.lg,
    },
    subscribeButtonText: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    paymentInfo: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: theme.border,
      padding: Spacing.lg,
      marginTop: Spacing.xl,
    },
    paymentTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: Spacing.md,
    },
    paymentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    paymentLabel: {
      color: theme.textMuted,
      fontSize: 13,
      width: 80,
    },
    paymentValue: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    copyButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: BorderRadius.xs,
      marginLeft: 'auto',
    },
    copyButtonText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    disclaimer: {
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.md,
    },
    disclaimerText: {
      color: theme.textMuted,
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
};
