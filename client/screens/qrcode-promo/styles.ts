import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
      alignItems: 'center',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 120,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: Spacing.lg,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    statItem: {
      alignItems: 'center',
    },
    payTypeRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    payTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      gap: Spacing.sm,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    qrCard: {
      padding: Spacing.xl,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.lg,
      alignItems: 'center',
    },
    qrImage: {
      width: 240,
      height: 240,
      borderRadius: BorderRadius.lg,
    },
    qrPlaceholder: {
      width: 240,
      height: 240,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    promoText: {
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      width: '100%',
    },
    accountInfo: {
      marginTop: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      width: '100%',
    },
    accountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.xs,
    },
    shareCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
    },
    shareHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    shareButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    shareButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      gap: Spacing.xs,
    },
    linkBox: {
      padding: Spacing.md,
      borderRadius: BorderRadius.sm,
    },
    actionRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
    },
    platformCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    categoryTitle: {
      marginBottom: Spacing.md,
    },
    platformGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    platformButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      gap: Spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: Spacing.lg,
    },
    modalContent: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      maxHeight: '80%',
    },
    modalTitle: {
      marginBottom: Spacing.lg,
    },
    input: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
    },
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
    modalButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
    tipBox: {
      marginTop: Spacing.lg,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderLeftWidth: 3,
    },
  });
};
