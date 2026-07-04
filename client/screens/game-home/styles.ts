/**
 * 游戏首页样式
 */

import { StyleSheet, Dimensions } from 'react-native';
import { Theme, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    heroSection: {
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      position: 'relative',
    },
    
    logoGlow: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    
    title: {
      letterSpacing: 6,
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
      marginTop: Spacing.xl,
      width: '100%',
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
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    
    menuCardGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    
    menuIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255,255,255,0.2)',
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
