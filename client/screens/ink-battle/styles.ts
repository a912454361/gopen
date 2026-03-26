import { StyleSheet, Platform } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

/**
 * 国风粒子卡牌对战 - 极致高端UI设计
 * 
 * 设计理念：
 * - 沉浸式对战体验
 * - 动态粒子光效
 * - 金黑配色为主
 * - 水墨元素装饰
 */

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // ==================== 页面容器 ====================
    container: {
      flex: 1,
      backgroundColor: '#080808',
    },
    
    // ==================== 战斗场景 ====================
    battleScene: {
      flex: 1,
      position: 'relative',
    },
    
    // ==================== 敌方区域 ====================
    enemyArea: {
      height: 200,
      padding: Spacing.xl,
      position: 'relative',
    },
    enemyGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      backgroundColor: 'rgba(255, 68, 68, 0.03)',
    },
    enemyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    enemyAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#151515',
      borderWidth: 1.5,
      borderColor: '#FF4444',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#FF4444',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
      }),
    },
    enemyInfo: {
      marginLeft: Spacing.lg,
      flex: 1,
    },
    enemyName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FAF8F5',
      letterSpacing: 0.5,
    },
    enemyHpText: {
      fontSize: 12,
      color: '#FF4444',
      marginTop: 2,
      letterSpacing: 1,
    },
    enemyHpBarContainer: {
      marginTop: Spacing.lg,
    },
    enemyHpBarBg: {
      height: 6,
      backgroundColor: '#1A1A1A',
      borderRadius: 3,
      overflow: 'hidden',
    },
    enemyHpBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    enemyHpGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 68, 68, 0.2)',
    },
    
    // ==================== 战斗日志区域 ====================
    battleLogArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing['2xl'],
      position: 'relative',
    },
    battleLogBg: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(212, 175, 55, 0.02)',
    },
    battleLogText: {
      fontSize: 16,
      color: '#FAF8F5',
      textAlign: 'center',
      lineHeight: 26,
      letterSpacing: 0.5,
    },
    turnIndicator: {
      fontSize: 11,
      color: '#D4AF37',
      letterSpacing: 3,
      marginTop: Spacing.lg,
      textTransform: 'uppercase',
    },
    
    // ==================== 玩家区域 ====================
    playerArea: {
      padding: Spacing.xl,
      position: 'relative',
    },
    playerGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 200,
      backgroundColor: 'rgba(78, 205, 196, 0.03)',
    },
    playerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playerAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#151515',
      borderWidth: 1.5,
      borderColor: '#4ECDC4',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#4ECDC4',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
      }),
    },
    playerInfo: {
      marginLeft: Spacing.lg,
      flex: 1,
    },
    playerName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FAF8F5',
      letterSpacing: 0.5,
    },
    playerHpText: {
      fontSize: 12,
      color: '#4ECDC4',
      marginTop: 2,
      letterSpacing: 1,
    },
    playerHpBarContainer: {
      marginTop: Spacing.lg,
    },
    playerHpBarBg: {
      height: 6,
      backgroundColor: '#1A1A1A',
      borderRadius: 3,
      overflow: 'hidden',
    },
    playerHpBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    
    // ==================== 法力值显示 ====================
    manaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginVertical: Spacing.lg,
    },
    manaOrb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
    },
    manaFilled: {
      backgroundColor: '#4A90D9',
      borderColor: '#4A90D9',
      ...Platform.select({
        ios: {
          shadowColor: '#4A90D9',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
        },
      }),
    },
    manaEmpty: {
      backgroundColor: 'transparent',
      borderColor: 'rgba(74, 144, 217, 0.3)',
    },
    manaText: {
      fontSize: 10,
      fontWeight: '700',
    },
    
    // ==================== 手牌区域 ====================
    handArea: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
    },
    handCard: {
      width: 72,
      height: 100,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#111111',
      borderWidth: 1.5,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    handCardSelected: {
      borderColor: '#D4AF37',
      transform: [{ translateY: -12 }],
      ...Platform.select({
        ios: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
        },
      }),
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
      borderWidth: 0.5,
      borderColor: '#D4AF37',
    },
    handCardCostText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#0A0A0A',
    },
    handCardInfo: {
      padding: 6,
      alignItems: 'center',
    },
    handCardName: {
      fontSize: 9,
      color: '#FAF8F5',
      fontWeight: '500',
    },
    handCardStats: {
      flexDirection: 'row',
      gap: 4,
      marginTop: 2,
    },
    handCardStatValue: {
      fontSize: 8,
      fontWeight: '600',
    },
    
    // ==================== 操作按钮区域 ====================
    actionArea: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
      backgroundColor: 'rgba(8, 8, 8, 0.9)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(212, 175, 55, 0.1)',
    },
    actionButton: {
      flex: 1,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    attackButton: {
      backgroundColor: '#FF4444',
      ...Platform.select({
        ios: {
          shadowColor: '#FF4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
      }),
    },
    skillButton: {
      backgroundColor: '#4ECDC4',
      ...Platform.select({
        ios: {
          shadowColor: '#4ECDC4',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
      }),
    },
    endTurnButton: {
      backgroundColor: '#D4AF37',
      ...Platform.select({
        ios: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
      }),
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFF',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    endTurnButtonText: {
      color: '#0A0A0A',
    },
    
    // ==================== 结果弹窗 ====================
    resultOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultContent: {
      alignItems: 'center',
      padding: Spacing['2xl'],
    },
    resultIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xl,
      borderWidth: 1,
    },
    victoryIcon: {
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      borderColor: '#D4AF37',
    },
    defeatIcon: {
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      borderColor: '#FF4444',
    },
    resultTitle: {
      fontSize: 36,
      fontWeight: '200',
      letterSpacing: 8,
      marginBottom: Spacing.md,
    },
    victoryTitle: {
      color: '#D4AF37',
    },
    defeatTitle: {
      color: '#FF4444',
    },
    resultSubtitle: {
      fontSize: 14,
      color: '#666',
      marginBottom: Spacing['2xl'],
      letterSpacing: 1,
    },
    resultButton: {
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: '#D4AF37',
      ...Platform.select({
        ios: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
      }),
    },
    resultButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#0A0A0A',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    
    // ==================== 加载状态 ====================
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    loadingText: {
      marginTop: Spacing.lg,
      color: '#666',
      fontSize: 12,
      letterSpacing: 2,
    },
  });
};
