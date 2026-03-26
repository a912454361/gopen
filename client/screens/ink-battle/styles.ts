import { StyleSheet, Platform, Dimensions } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 国风粒子卡牌对战 - 移动端优化版
 * 
 * 设计原则：
 * - 触摸区域最小 44x44px
 * - 战斗场景适配手机屏幕
 * - 手牌可滑动查看
 * - 操作按钮固定底部
 */

export const createStyles = (theme: Theme) => {
  // 手牌尺寸
  const HAND_CARD_WIDTH = 72;
  const HAND_CARD_HEIGHT = 100;

  return StyleSheet.create({
    // ==================== 页面容器 ====================
    container: {
      flex: 1,
      backgroundColor: '#0A0A0A',
    },
    
    // ==================== 战斗场景 ====================
    battleScene: {
      flex: 1,
      position: 'relative',
    },
    
    // ==================== 敌方区域 ====================
    enemyArea: {
      paddingTop: Platform.OS === 'ios' ? 50 : 30,
      paddingHorizontal: 20,
      paddingBottom: 20,
      position: 'relative',
    },
    enemyGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 180,
      backgroundColor: 'rgba(255, 68, 68, 0.03)',
    },
    enemyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    enemyAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#FF4444',
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
      marginLeft: 14,
      flex: 1,
    },
    enemyName: {
      fontSize: 16,
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
      marginTop: 12,
    },
    enemyHpBarBg: {
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    enemyHpBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    
    // ==================== 战斗日志区域 ====================
    battleLogArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 20,
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
      fontSize: 15,
      color: '#FAF8F5',
      textAlign: 'center',
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    turnIndicator: {
      fontSize: 10,
      color: '#D4AF37',
      letterSpacing: 3,
      marginTop: 12,
      textTransform: 'uppercase',
    },
    
    // ==================== 玩家区域 ====================
    playerArea: {
      padding: 20,
      position: 'relative',
    },
    playerGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 180,
      backgroundColor: 'rgba(78, 205, 196, 0.03)',
    },
    playerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playerAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(78, 205, 196, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#4ECDC4',
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
      marginLeft: 14,
      flex: 1,
    },
    playerName: {
      fontSize: 16,
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
      marginTop: 12,
    },
    playerHpBarBg: {
      height: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
      gap: 6,
      marginVertical: 12,
    },
    manaOrb: {
      width: 20,
      height: 20,
      borderRadius: 10,
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
      fontSize: 9,
      fontWeight: '700',
    },
    
    // ==================== 手牌区域 ====================
    handArea: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
    },
    handCard: {
      width: HAND_CARD_WIDTH,
      height: HAND_CARD_HEIGHT,
      borderRadius: 12,
      backgroundColor: '#111111',
      borderWidth: 1.5,
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    handCardSelected: {
      borderColor: '#D4AF37',
      transform: [{ translateY: -10 }],
      ...Platform.select({
        ios: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
        },
      }),
    },
    handCardImage: {
      width: '100%',
      height: 55,
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
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: Platform.OS === 'ios' ? 30 : 12,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(212, 175, 55, 0.1)',
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
      minWidth: 44, // 确保触摸区域足够大
    },
    attackButton: {
      backgroundColor: '#FF4444',
      ...Platform.select({
        ios: {
          shadowColor: '#FF4444',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
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
          shadowRadius: 10,
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
          shadowRadius: 10,
        },
      }),
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFF',
      letterSpacing: 1,
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
      padding: 20,
    },
    resultContent: {
      alignItems: 'center',
      padding: 24,
    },
    resultIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
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
      fontSize: 32,
      fontWeight: '200',
      letterSpacing: 8,
      marginBottom: 8,
    },
    victoryTitle: {
      color: '#D4AF37',
    },
    defeatTitle: {
      color: '#FF4444',
    },
    resultSubtitle: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.5)',
      marginBottom: 24,
      letterSpacing: 1,
    },
    resultButton: {
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#D4AF37',
      minWidth: 120,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
      }),
    },
    resultButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#0A0A0A',
      letterSpacing: 2,
    },
    
    // ==================== 加载状态 ====================
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0A0A0A',
    },
    loadingIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    loadingText: {
      marginTop: 16,
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: 12,
      letterSpacing: 2,
    },
  });
};
