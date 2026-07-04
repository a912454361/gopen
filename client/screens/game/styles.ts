import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    
    // 视频区域
    videoContainer: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: '#000',
      position: 'relative',
    },
    video: {
      width: '100%',
      height: '100%',
    },
    videoPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
    },
    
    // 剧情内容
    contentContainer: {
      flex: 1,
      padding: Spacing.lg,
    },
    
    // 章节标题
    episodeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      marginBottom: Spacing.md,
    },
    episodeText: {
      color: theme.buttonPrimaryText,
      fontSize: 12,
      fontWeight: '600',
    },
    
    // 节点标题
    nodeTitle: {
      marginBottom: Spacing.md,
    },
    
    // 剧情描述
    descriptionContainer: {
      backgroundColor: theme.backgroundDefault,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: theme.border,
    },
    descriptionText: {
      lineHeight: 24,
    },
    
    // 选择区域
    choicesContainer: {
      gap: Spacing.md,
    },
    choiceButton: {
      backgroundColor: theme.backgroundDefault,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      borderColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    choiceButtonPressed: {
      backgroundColor: theme.primary,
    },
    choiceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    choiceIconText: {
      color: theme.buttonPrimaryText,
      fontSize: 18,
      fontWeight: 'bold',
    },
    choiceText: {
      flex: 1,
      fontSize: 16,
    },
    choiceTextActive: {
      color: theme.buttonPrimaryText,
    },
    
    // 属性面板
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    statBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundTertiary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      gap: Spacing.xs,
    },
    statLabel: {
      fontSize: 12,
    },
    statValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.primary,
    },
    
    // 加载状态
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing['2xl'],
    },
    loadingText: {
      marginTop: Spacing.md,
      color: theme.textMuted,
    },
    
    // 结局页面
    endingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing['2xl'],
    },
    endingTitle: {
      marginBottom: Spacing.lg,
      textAlign: 'center',
    },
    endingBadge: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      marginBottom: Spacing.xl,
    },
    goodEnding: {
      backgroundColor: '#10B981',
    },
    normalEnding: {
      backgroundColor: '#F59E0B',
    },
    badEnding: {
      backgroundColor: '#EF4444',
    },
    endingText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    restartButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: Spacing['2xl'],
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.xl,
    },
    restartText: {
      color: theme.buttonPrimaryText,
      fontSize: 16,
      fontWeight: '600',
    },
    
    // 导航按钮
    navButton: {
      position: 'absolute',
      bottom: Spacing['2xl'],
      right: Spacing.lg,
      backgroundColor: theme.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  });
};
