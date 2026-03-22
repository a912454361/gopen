import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing['5xl'],
    },
    // 导航栏
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.backgroundTertiary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    navTitle: {
      flex: 1,
    },
    header: {
      marginBottom: Spacing.xl,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIcon: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.lg,
      backgroundColor: `${theme.primary}10`,
      borderWidth: 1,
      borderColor: `${theme.primary}30`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 80,
    },
    searchSection: {
      marginBottom: Spacing.lg,
    },
    searchInput: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    searchTextInput: {
      flex: 1,
      fontSize: 15,
      marginLeft: Spacing.sm,
    },
    sessionList: {
      gap: Spacing.md,
    },
    sessionCard: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      overflow: 'hidden',
    },
    sessionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
    },
    sessionIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sessionInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    sessionTitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    sessionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: 4,
    },
    sessionActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sessionPreview: {
      padding: Spacing.md,
      paddingTop: 0,
    },
    previewText: {
      fontSize: 14,
      lineHeight: 20,
    },
    messageCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: Spacing.sm,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    newSessionButton: {
      marginTop: Spacing.lg,
    },
    newSessionGradient: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // 详情页
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderBottomWidth: 1,
    },
    messageList: {
      padding: Spacing.md,
      gap: Spacing.md,
    },
    messageBubble: {
      maxWidth: '85%',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    userMessage: {
      alignSelf: 'flex-end',
    },
    assistantMessage: {
      alignSelf: 'flex-start',
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    messageTime: {
      fontSize: 11,
      marginTop: Spacing.xs,
    },
  });
};
