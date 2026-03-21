import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundRoot,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
      alignItems: 'center',
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: 120,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    searchInput: {
      flex: 1,
      marginLeft: Spacing.sm,
      fontSize: 14,
    },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    tab: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      marginRight: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    tabActive: {
      borderWidth: 0,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    postCard: {
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    authorInfo: {
      flex: 1,
    },
    followButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    postTitle: {
      padding: Spacing.md,
      paddingTop: 0,
    },
    postContent: {
      padding: Spacing.md,
      paddingTop: 0,
    },
    postImage: {
      width: '100%',
      height: 200,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    postWorkRef: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      marginTop: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    postFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderTopWidth: 1,
      gap: Spacing.xl,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    commentsPreview: {
      padding: Spacing.md,
      borderTopWidth: 1,
    },
    commentItem: {
      flexDirection: 'row',
      marginBottom: Spacing.sm,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalContent: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '90%',
      minHeight: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderBottomWidth: 1,
    },
    modalBody: {
      flex: 1,
      padding: Spacing.lg,
    },
    modalFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderTopWidth: 1,
      gap: Spacing.md,
    },
    commentInput: {
      flex: 1,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    sendButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    commentsList: {
      marginTop: Spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: Spacing['3xl'],
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    featuredSection: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    featuredCard: {
      width: 280,
      backgroundColor: theme.backgroundDefault,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      marginRight: Spacing.md,
      overflow: 'hidden',
    },
    featuredImage: {
      width: '100%',
      height: 150,
    },
    featuredInfo: {
      padding: Spacing.md,
    },
  });
};
