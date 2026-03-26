import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

// 国风水墨卡牌游戏风格
export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0D0D0D', // 万古长夜黑
    },
    
    // 顶部区域
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#F5F5F0', // 宣纸白
      letterSpacing: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#8B7355', // 朱砂褐
      marginTop: 4,
    },
    
    // 玩家信息栏
    playerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: 'rgba(26, 26, 26, 0.8)',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(139, 115, 85, 0.3)',
    },
    playerInfo: {
      flex: 1,
    },
    playerName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#F5F5F0',
    },
    playerLevel: {
      fontSize: 12,
      color: '#D4AF37', // 鎏金色
      marginTop: 2,
    },
    resourceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: Spacing.lg,
      gap: 4,
    },
    resourceIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goldIcon: {
      backgroundColor: '#D4AF37',
    },
    gemIcon: {
      backgroundColor: '#9B59B6',
    },
    resourceValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#F5F5F0',
    },
    
    // 阵营筛选
    factionFilter: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    factionScroll: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    factionButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(139, 115, 85, 0.3)',
    },
    factionButtonActive: {
      borderColor: '#D4AF37',
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
    },
    factionText: {
      fontSize: 13,
      color: '#8B7355',
    },
    factionTextActive: {
      color: '#D4AF37',
      fontWeight: '600',
    },
    
    // 卡牌网格
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.md,
    },
    
    // 卡牌卡片
    card: {
      width: 160,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      backgroundColor: '#1A1A1A',
      borderWidth: 1,
    },
    cardImage: {
      width: '100%',
      height: 200,
      backgroundColor: '#252525',
    },
    cardInfo: {
      padding: Spacing.md,
    },
    cardName: {
      fontSize: 14,
      fontWeight: '700',
      color: '#F5F5F0',
      letterSpacing: 1,
    },
    cardFaction: {
      fontSize: 11,
      color: '#8B7355',
      marginTop: 2,
    },
    cardStats: {
      flexDirection: 'row',
      marginTop: Spacing.sm,
      gap: Spacing.md,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    statValue: {
      fontSize: 12,
      fontWeight: '600',
      color: '#F5F5F0',
    },
    cardRarity: {
      position: 'absolute',
      top: 8,
      right: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    
    // 品级颜色
    rarityCommon: {
      backgroundColor: 'rgba(128, 128, 128, 0.8)',
      borderColor: '#808080',
    },
    raritySpirit: {
      backgroundColor: 'rgba(46, 204, 113, 0.8)',
      borderColor: '#2ECC71',
    },
    rarityImmortal: {
      backgroundColor: 'rgba(52, 152, 219, 0.8)',
      borderColor: '#3498DB',
    },
    raritySaint: {
      backgroundColor: 'rgba(155, 89, 182, 0.8)',
      borderColor: '#9B59B6',
    },
    rarityAncient: {
      backgroundColor: 'rgba(212, 175, 55, 0.9)',
      borderColor: '#D4AF37',
    },
    rarityText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFF',
      letterSpacing: 1,
    },
    
    // 底部操作栏
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingBottom: Spacing.xl,
      backgroundColor: '#0D0D0D',
      borderTopWidth: 1,
      borderTopColor: 'rgba(139, 115, 85, 0.3)',
      gap: Spacing.md,
    },
    actionButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: '#D4AF37',
    },
    secondaryButton: {
      backgroundColor: 'rgba(139, 115, 85, 0.2)',
      borderWidth: 1,
      borderColor: '#8B7355',
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#0D0D0D',
      letterSpacing: 1,
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#D4AF37',
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
    
    // 空状态
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyText: {
      fontSize: 16,
      color: '#8B7355',
      marginTop: Spacing.md,
    },
    
    // 抽卡模态框
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 400,
      backgroundColor: '#1A1A1A',
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: '#D4AF37',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#D4AF37',
      textAlign: 'center',
      letterSpacing: 2,
    },
    modalCard: {
      marginTop: Spacing.xl,
      alignItems: 'center',
    },
    modalCardImage: {
      width: 200,
      height: 280,
      borderRadius: BorderRadius.lg,
    },
    modalCardName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#F5F5F0',
      marginTop: Spacing.md,
      letterSpacing: 1,
    },
    modalCloseButton: {
      marginTop: Spacing.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing['2xl'],
      borderRadius: BorderRadius.lg,
      backgroundColor: '#D4AF37',
    },
    modalCloseText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#0D0D0D',
    },
  });
};
