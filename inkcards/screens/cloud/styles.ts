/**
 * 云游戏样式
 */

import { StyleSheet } from 'react-native';
import { Theme, Spacing, BorderRadius } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    
    statusInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    
    latencyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    
    qualityInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    
    gameArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    connectPrompt: {
      alignItems: 'center',
      padding: Spacing.xl,
    },
    
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    connectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing['2xl'],
    },
    
    gameCanvas: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.backgroundDefault,
    },
    
    gamePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    controlBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      backgroundColor: theme.backgroundDefault,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    
    controlButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    actionButton: {
      backgroundColor: theme.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
    },
  });
};
