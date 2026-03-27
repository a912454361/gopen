/**
 * 对战页面样式
 */

import { StyleSheet } from 'react-native';
import { Theme, Spacing, BorderRadius } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.lg,
    },
    
    header: {
      alignItems: 'center',
      marginBottom: Spacing['2xl'],
    },
    
    matchArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    matchingContainer: {
      alignItems: 'center',
    },
    
    matchButton: {
      width: 200,
      height: 200,
      borderRadius: 100,
      overflow: 'hidden',
    },
    
    matchButtonGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    cancelButton: {
      marginTop: Spacing['2xl'],
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
    },
    
    quickMatchRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
      marginTop: Spacing['2xl'],
    },
    
    quickButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
    
    statsSection: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    
    statCard: {
      flex: 1,
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
  });
};
