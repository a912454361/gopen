/**
 * 游戏首页样式
 */
import { StyleSheet, Dimensions } from 'react-native';
import { Theme, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    
    scrollContent: {
      flexGrow: 1,
      paddingBottom: Spacing['5xl'],
    },
    
    // Hero 区域
    heroSection: {
      paddingTop: Spacing['3xl'],
      paddingBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(212, 175, 55, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    
    title: {
      letterSpacing: 8,
      marginBottom: Spacing.sm,
      textShadowColor: 'rgba(212, 175, 55, 0.5)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 20,
    },
    
    subtitle: {
      letterSpacing: 2,
    },
    
    // 玩家卡片
    playerCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.xl,
      width: '100%',
      backgroundColor: theme.backgroundDefault,
      borderWidth: 1,
      borderColor: theme.border,
    },
    
    playerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.primary,
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
    
    // 菜单区域
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
      width: 56,
      height: 56,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    menuContent: {
      flex: 1,
      marginLeft: Spacing.lg,
    },
    
    // 阵营区域
    factionSection: {
      padding: Spacing.lg,
    },
    
    factionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    
    factionCard: {
      width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      borderWidth: 1,
    },
    
    factionIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    
    // 公告区域
    announcementSection: {
      padding: Spacing.lg,
    },
    
    announcementCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    
    // 底部
    footer: {
      alignItems: 'center',
      paddingVertical: Spacing['2xl'],
    },
  });
};
