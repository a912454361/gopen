/**
 * 首页样式
 */

import { StyleSheet } from 'react-native';
import { Theme, Spacing, BorderRadius, SCREEN_WIDTH } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    heroSection: {
      paddingTop: Spacing['3xl'],
      paddingBottom: Spacing['2xl'],
      paddingHorizontal: Spacing.lg,
    },
    
    heroContent: {
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    
    logoContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.backgroundCard,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      shadowColor: theme.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    
    title: {
      letterSpacing: 4,
      marginBottom: Spacing.sm,
    },
    
    subtitle: {
      letterSpacing: 1,
    },
    
    playerCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.lg,
    },
    
    playerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    playerDetails: {
      marginLeft: Spacing.md,
    },
    
    currencyRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    
    currencyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    
    menuSection: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    
    menuCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    menuIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    menuContent: {
      flex: 1,
      marginLeft: Spacing.lg,
    },
    
    announcementSection: {
      padding: Spacing.lg,
    },
    
    announcementCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
    },
    
    footer: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
  });
};
