import { StyleSheet } from 'react-native';
import { Spacing, BorderRadius, Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing['2xl'],
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing['2xl'],
    },
    header: {
      marginBottom: Spacing.xl,
    },
    title: {
      marginBottom: Spacing.sm,
    },
    metaInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    metaTag: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
    },
    metaText: {
      fontSize: 12,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      marginBottom: Spacing.md,
    },
    synopsisBox: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
    },
    synopsisText: {
      lineHeight: 24,
    },
    characterCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    characterName: {
      marginBottom: Spacing.xs,
    },
    characterRole: {
      marginBottom: Spacing.sm,
    },
    characterDesc: {
      lineHeight: 20,
    },
    videoGrid: {
      gap: Spacing.md,
    },
    videoCard: {
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    videoThumbnail: {
      width: '100%',
      aspectRatio: 16 / 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    videoInfo: {
      padding: Spacing.md,
    },
    videoTitle: {
      marginBottom: Spacing.xs,
    },
    videoMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    sceneBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    emptyContainer: {
      padding: Spacing['2xl'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    generateButton: {
      marginTop: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    progressContainer: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      textAlign: 'center',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
  });
};
