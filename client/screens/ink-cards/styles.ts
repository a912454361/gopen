import { StyleSheet, Platform } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

/**
 * 国风水墨卡牌游戏 - 极致高端UI设计
 * 
 * 设计理念：
 * - 万古长夜黑 + 鎏金色点缀
 * - 水墨晕染效果
 * - 极致留白与精金细线
 * - 奢侈品级视觉质感
 */

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // ==================== 页面容器 ====================
    container: {
      flex: 1,
      backgroundColor: '#080808', // 万古长夜黑
    },
    
    // ==================== 顶部英雄区 ====================
    heroSection: {
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingHorizontal: 0,
      paddingBottom: Spacing['2xl'],
      position: 'relative',
      overflow: 'hidden',
    },
    heroGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 300,
      backgroundColor: '#0D0D0D',
    },
    heroInkEffect: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(212, 175, 55, 0.03)',
    },
    headerContent: {
      paddingHorizontal: Spacing.xl,
    },
    headerLabel: {
      fontSize: 10,
      letterSpacing: 6,
      textTransform: 'uppercase',
      color: '#D4AF37',
      fontWeight: '300',
      marginBottom: Spacing.sm,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '200',
      color: '#FAF8F5',
      letterSpacing: 4,
      lineHeight: 42,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#8B7355',
      marginTop: Spacing.sm,
      letterSpacing: 1,
      fontWeight: '300',
    },
    goldDivider: {
      width: 60,
      height: 0.5,
      backgroundColor: '#D4AF37',
      marginTop: Spacing.lg,
    },
    
    // ==================== 玩家状态栏 ====================
    playerSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      backgroundColor: 'rgba(20, 20, 20, 0.8)',
      borderRadius: BorderRadius.xl,
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.2)',
      ...Platform.select({
        ios: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    playerAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: '#D4AF37',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#151515',
    },
    playerAvatarInner: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#1A1A1A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerInfo: {
      flex: 1,
      marginLeft: Spacing.lg,
    },
    playerName: {
      fontSize: 17,
      fontWeight: '500',
      color: '#FAF8F5',
      letterSpacing: 0.5,
    },
    playerLevel: {
      fontSize: 11,
      color: '#D4AF37',
      marginTop: 2,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    playerRank: {
      fontSize: 10,
      color: '#666',
      marginTop: 4,
    },
    resourceContainer: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    resourceItem: {
      alignItems: 'center',
    },
    resourceIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    goldBg: {
      backgroundColor: 'rgba(212, 175, 55, 0.15)',
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.4)',
    },
    gemBg: {
      backgroundColor: 'rgba(147, 112, 219, 0.15)',
      borderWidth: 0.5,
      borderColor: 'rgba(147, 112, 219, 0.4)',
    },
    resourceValue: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FAF8F5',
      letterSpacing: 0.5,
    },
    
    // ==================== 阵营筛选 ====================
    factionSection: {
      paddingVertical: Spacing.lg,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(212, 175, 55, 0.1)',
    },
    factionScroll: {
      paddingHorizontal: Spacing.lg,
    },
    factionContent: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    factionButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.xl,
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.2)',
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    factionButtonActive: {
      borderColor: '#D4AF37',
      backgroundColor: 'rgba(212, 175, 55, 0.08)',
    },
    factionText: {
      fontSize: 12,
      color: '#666',
      letterSpacing: 1,
      fontWeight: '500',
    },
    factionTextActive: {
      color: '#D4AF37',
      fontWeight: '600',
    },
    
    // ==================== 卡牌网格 ====================
    cardSection: {
      paddingVertical: Spacing.xl,
    },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.md,
      gap: Spacing.md,
    },
    
    // ==================== 卡牌卡片（核心） ====================
    card: {
      width: 165,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      backgroundColor: '#111111',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    cardImageContainer: {
      width: '100%',
      aspectRatio: 3/4,
      position: 'relative',
      overflow: 'hidden',
    },
    cardImage: {
      width: '100%',
      height: '100%',
      backgroundColor: '#1A1A1A',
    },
    cardImageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    cardRarityBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardRarityText: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    cardFactionBadge: {
      position: 'absolute',
      top: 10,
      left: 10,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
    },
    cardInfo: {
      padding: Spacing.md,
    },
    cardName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FAF8F5',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    cardFaction: {
      fontSize: 10,
      color: '#666',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },
    cardStats: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(212, 175, 55, 0.1)',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    statValue: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FAF8F5',
    },
    
    // ==================== 品级样式 ====================
    rarityCommon: {
      backgroundColor: 'rgba(128, 128, 128, 0.9)',
      borderColor: '#808080',
    },
    raritySpirit: {
      backgroundColor: 'rgba(46, 204, 113, 0.9)',
      borderColor: '#2ECC71',
    },
    rarityImmortal: {
      backgroundColor: 'rgba(52, 152, 219, 0.9)',
      borderColor: '#3498DB',
    },
    raritySaint: {
      backgroundColor: 'rgba(155, 89, 182, 0.9)',
      borderColor: '#9B59B6',
    },
    rarityAncient: {
      backgroundColor: 'rgba(212, 175, 55, 0.95)',
      borderColor: '#D4AF37',
    },
    
    // ==================== 底部操作栏 ====================
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
      backgroundColor: 'rgba(8, 8, 8, 0.95)',
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(212, 175, 55, 0.15)',
      gap: Spacing.md,
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
    primaryButton: {
      backgroundColor: '#D4AF37',
      ...Platform.select({
        ios: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 0.5,
      borderColor: '#D4AF37',
    },
    primaryButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#0A0A0A',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    secondaryButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#D4AF37',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    
    // ==================== 抽卡模态框 ====================
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 380,
      backgroundColor: '#111111',
      borderRadius: BorderRadius.xl,
      padding: Spacing['2xl'],
      borderWidth: 0.5,
      borderColor: '#D4AF37',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.2,
          shadowRadius: 40,
        },
        android: {
          elevation: 20,
        },
      }),
    },
    modalTitle: {
      fontSize: 11,
      letterSpacing: 6,
      textTransform: 'uppercase',
      color: '#D4AF37',
      fontWeight: '300',
    },
    modalSubtitle: {
      fontSize: 24,
      fontWeight: '200',
      color: '#FAF8F5',
      marginTop: Spacing.md,
      letterSpacing: 2,
    },
    modalDivider: {
      width: 40,
      height: 0.5,
      backgroundColor: '#D4AF37',
      marginVertical: Spacing.lg,
    },
    modalCardContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    modalCardImage: {
      width: 200,
      height: 280,
      borderRadius: BorderRadius.lg,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.5,
          shadowRadius: 24,
        },
        android: {
          elevation: 16,
        },
      }),
    },
    modalCardName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FAF8F5',
      marginTop: Spacing.lg,
      letterSpacing: 1,
    },
    modalCardInfo: {
      fontSize: 12,
      color: '#666',
      marginTop: Spacing.xs,
      letterSpacing: 1,
    },
    modalCloseButton: {
      marginTop: Spacing.xl,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: BorderRadius.lg,
      backgroundColor: '#D4AF37',
      alignItems: 'center',
    },
    modalCloseText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#0A0A0A',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    
    // ==================== 加载与空状态 ====================
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.lg,
      color: '#666',
      fontSize: 12,
      letterSpacing: 2,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: 'rgba(212, 175, 55, 0.2)',
    },
    emptyText: {
      fontSize: 13,
      color: '#666',
      marginTop: Spacing.lg,
      letterSpacing: 1,
    },
  });
};
