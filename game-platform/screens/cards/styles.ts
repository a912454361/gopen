/**
 * 卡牌收藏页面样式
 */
import { StyleSheet, Dimensions } from 'react-native';
import { Theme, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    
    header: {
      marginBottom: Spacing.xl,
    },
    
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: Spacing.lg,
    },
    
    statItem: {
      alignItems: 'center',
    },
    
    statNumber: {
      marginBottom: Spacing.xs,
    },
    
    // 卡牌网格
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    
    card: {
      width: CARD_WIDTH,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      backgroundColor: theme.backgroundDefault,
      borderWidth: 2,
    },
    
    cardImage: {
      width: '100%',
      aspectRatio: 3 / 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    cardInfo: {
      padding: Spacing.md,
    },
    
    cardName: {
      marginBottom: Spacing.xs,
    },
    
    cardMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    // 筛选器
    filterRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    
    filterChip: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    
    filterChipActive: {
      backgroundColor: 'rgba(212, 175, 55, 0.2)',
    },
  });
};
