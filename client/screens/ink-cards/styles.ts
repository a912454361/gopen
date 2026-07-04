import { StyleSheet, Platform, Dimensions } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 国风粒子卡牌游戏 - 移动端优先设计
 * 
 * 设计原则：
 * - 触摸区域最小 44x44px
 * - 卡牌尺寸适配手机屏幕
 * - 底部操作栏固定定位
 * - 舒适的手持操作体验
 */

// ==================== 卡牌尺寸常量 ====================
export const CARD_GAP = 12;
export const SCREEN_PADDING = 16;
export const CARD_WIDTH = (SCREEN_WIDTH - SCREEN_PADDING * 2 - CARD_GAP) / 2;
export const CARD_HEIGHT = CARD_WIDTH * 1.35; // 卡牌宽高比约 0.74

// 手牌尺寸（对战页面）
export const HAND_CARD_WIDTH = 72;
export const HAND_CARD_HEIGHT = 100;

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // ==================== 页面容器 ====================
    container: {
      flex: 1,
      backgroundColor: '#0A0A0A',
    },
    
    // ==================== 英雄区域 ====================
    heroSection: {
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingBottom: 24,
      paddingHorizontal: 20,
      backgroundColor: '#0A0A0A',
      position: 'relative',
      overflow: 'hidden',
    },
    heroGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(212, 175, 55, 0.03)',
    },
    heroInkEffect: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(212, 175, 55, 0.02)',
    },
    headerContent: {
      alignItems: 'center',
      zIndex: 1,
    },
    headerLabel: {
      fontSize: 10,
      color: 'rgba(212, 175, 55, 0.6)',
      letterSpacing: 3,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '200',
      color: '#FAF8F5',
      letterSpacing: 8,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.5)',
      letterSpacing: 1,
      marginBottom: 16,
    },
    goldDivider: {
      width: 60,
      height: 1,
      backgroundColor: '#D4AF37',
      opacity: 0.3,
    },
    
    // ==================== 玩家状态栏 ====================
    playerSection: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.15)',
    },
    playerAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    playerInfo: {
      flex: 1,
      marginLeft: 14,
    },
    playerName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FAF8F5',
      marginBottom: 2,
    },
    playerLevel: {
      fontSize: 12,
      color: 'rgba(212, 175, 55, 0.8)',
      marginBottom: 2,
    },
    playerRank: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.4)',
    },
    resourceContainer: {
      alignItems: 'flex-end',
    },
    resourceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    resourceIconBg: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },
    goldBg: {
      backgroundColor: 'rgba(212, 175, 55, 0.15)',
    },
    gemBg: {
      backgroundColor: 'rgba(147, 112, 219, 0.15)',
    },
    resourceValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FAF8F5',
      minWidth: 40,
    },
    
    // ==================== 阵营筛选 ====================
    factionSection: {
      marginBottom: 16,
    },
    factionScroll: {
      paddingHorizontal: 16,
    },
    factionContent: {
      flexDirection: 'row',
      gap: 8,
    },
    factionButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      minWidth: 60,
      alignItems: 'center',
    },
    factionButtonActive: {
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      borderColor: '#D4AF37',
    },
    factionText: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.6)',
      fontWeight: '500',
    },
    factionTextActive: {
      color: '#D4AF37',
      fontWeight: '600',
    },
    
    // ==================== 卡牌列表 ====================
    cardSection: {
      flex: 1,
      paddingHorizontal: 16,
    },
    cardGrid: {
      gap: CARD_GAP,
      paddingBottom: 20,
    },
    
    // ==================== 卡牌卡片 ====================
    card: {
      width: CARD_WIDTH,
      backgroundColor: '#111111',
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    cardImageContainer: {
      width: '100%',
      height: CARD_WIDTH * 1.2,
      position: 'relative',
      backgroundColor: '#1A1A1A',
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardImageOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '40%',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    cardFactionBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    cardRarityBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    cardRarityText: {
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    cardInfo: {
      padding: 12,
    },
    cardName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FAF8F5',
      marginBottom: 4,
    },
    cardFaction: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.4)',
      marginBottom: 8,
    },
    cardStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FAF8F5',
    },
    
    // ==================== 底部操作栏 ====================
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(212, 175, 55, 0.1)',
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 12,
      minWidth: 44, // 确保触摸区域足够大
    },
    primaryButton: {
      backgroundColor: '#D4AF37',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0A0A0A',
      letterSpacing: 1,
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#D4AF37',
      letterSpacing: 1,
    },
    
    // ==================== 空状态 ====================
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.2)',
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.4)',
    },
    
    // ==================== 加载状态 ====================
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0A0A0A',
    },
    loadingText: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.4)',
      marginTop: 16,
      letterSpacing: 1,
    },
    
    // ==================== 抽卡模态框 ====================
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: '#111111',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    modalTitle: {
      fontSize: 10,
      color: 'rgba(212, 175, 55, 0.6)',
      letterSpacing: 3,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    modalSubtitle: {
      fontSize: 20,
      fontWeight: '300',
      color: '#FAF8F5',
      marginBottom: 16,
    },
    modalCardContainer: {
      alignItems: 'center',
      marginVertical: 16,
    },
    modalCardImage: {
      width: 180,
      height: 252,
      borderRadius: 12,
    },
    modalCardName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FAF8F5',
      marginTop: 12,
    },
    modalCardInfo: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.5)',
      marginTop: 4,
    },
    modalCloseButton: {
      marginTop: 24,
      paddingVertical: 14,
      paddingHorizontal: 32,
      backgroundColor: '#D4AF37',
      borderRadius: 12,
      minWidth: 120,
      alignItems: 'center',
    },
    modalCloseText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0A0A0A',
      letterSpacing: 1,
    },
  });
};
