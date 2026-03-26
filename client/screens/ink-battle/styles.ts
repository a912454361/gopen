import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

// 国风水墨卡牌对战风格
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0D0D0D',
    },
    
    // 战斗场景
    battleScene: {
      flex: 1,
      position: 'relative',
    },
    
    // 敌方区域
    enemyArea: {
      height: 180,
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(139, 115, 85, 0.2)',
    },
    enemyInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    enemyAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#2D2D2D',
      borderWidth: 2,
      borderColor: '#FF4444',
      alignItems: 'center',
      justifyContent: 'center',
    },
    enemyName: {
      marginLeft: Spacing.md,
      flex: 1,
    },
    enemyHpBar: {
      height: 8,
      backgroundColor: '#2D2D2D',
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: Spacing.xs,
    },
    enemyHpFill: {
      height: '100%',
      borderRadius: 4,
    },
    enemyCard: {
      position: 'absolute',
      bottom: 10,
      right: 20,
      width: 60,
      height: 80,
      borderRadius: 8,
      backgroundColor: '#1A1A1A',
      borderWidth: 1,
      borderColor: 'rgba(255, 68, 68, 0.5)',
    },
    
    // 战斗日志区域
    battleLogArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    battleLogText: {
      fontSize: 16,
      color: '#F5F5F0',
      textAlign: 'center',
      lineHeight: 24,
    },
    turnIndicator: {
      fontSize: 12,
      color: '#D4AF37',
      letterSpacing: 2,
      marginTop: Spacing.md,
    },
    
    // 玩家区域
    playerArea: {
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: 'rgba(139, 115, 85, 0.2)',
    },
    playerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    playerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#2D2D2D',
      borderWidth: 2,
      borderColor: '#4ECDC4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerName: {
      marginLeft: Spacing.md,
      flex: 1,
    },
    playerHpBar: {
      height: 8,
      backgroundColor: '#2D2D2D',
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: Spacing.xs,
    },
    playerHpFill: {
      height: '100%',
      borderRadius: 4,
    },
    
    // 手牌区域
    handArea: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      marginBottom: Spacing.md,
    },
    handCard: {
      width: 70,
      height: 100,
      borderRadius: 8,
      backgroundColor: '#1A1A1A',
      borderWidth: 2,
      overflow: 'hidden',
    },
    handCardSelected: {
      borderColor: '#D4AF37',
      transform: [{ translateY: -10 }],
    },
    handCardImage: {
      width: '100%',
      height: 60,
    },
    handCardCost: {
      position: 'absolute',
      top: 4,
      left: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#D4AF37',
      alignItems: 'center',
      justifyContent: 'center',
    },
    handCardCostText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#0D0D0D',
    },
    
    // 操作按钮区域
    actionArea: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    actionButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    attackButton: {
      backgroundColor: '#FF4444',
    },
    skillButton: {
      backgroundColor: '#4ECDC4',
    },
    endTurnButton: {
      backgroundColor: '#D4AF37',
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFF',
      letterSpacing: 1,
    },
    
    // 法力值显示
    manaBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    manaOrb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    manaOrbFilled: {
      backgroundColor: '#4A90D9',
    },
    manaOrbEmpty: {
      backgroundColor: '#2D2D2D',
      borderWidth: 1,
      borderColor: '#4A90D9',
    },
    manaText: {
      fontSize: 12,
      fontWeight: '700',
    },
    
    // 结果弹窗
    resultOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultContent: {
      alignItems: 'center',
      padding: Spacing['2xl'],
    },
    resultTitle: {
      fontSize: 36,
      fontWeight: '700',
      letterSpacing: 4,
      marginBottom: Spacing.lg,
    },
    victoryTitle: {
      color: '#D4AF37',
    },
    defeatTitle: {
      color: '#FF4444',
    },
    resultSubtitle: {
      fontSize: 16,
      color: '#8B7355',
      marginBottom: Spacing.xl,
    },
    resultButton: {
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#D4AF37',
    },
    resultButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0D0D0D',
    },
    
    // 加载状态
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.md,
      color: '#8B7355',
      fontSize: 14,
    },
  });
};
