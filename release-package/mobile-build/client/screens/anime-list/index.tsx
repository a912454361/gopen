import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface AnimeProject {
  id: string;
  title: string;
  synopsis: string;
  style: string;
  theme: string;
  scenes: any[];
  video_urls?: string[];
  video_status?: string;
  created_at: string;
}

// 风格渐变色配置
const STYLE_GRADIENTS: Record<string, readonly [string, string]> = {
  'japanese': ['#667eea', '#764ba2'] as const,
  'chinese': ['#f093fb', '#f5576c'] as const,
  'korean': ['#4facfe', '#00f2fe'] as const,
  'qstyle': ['#43e97b', '#38f9d7'] as const,
  'realistic': ['#fa709a', '#fee140'] as const,
  'fantasy': ['#a18cd1', '#fbc2eb'] as const,
};

export default function AnimeListScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [projects, setProjects] = useState<AnimeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 获取用户ID
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userId').then((id) => {
        setUserId(id);
        if (id) {
          fetchProjects(id);
        }
      });
    }, [])
  );

  // 获取项目列表
  const fetchProjects = async (uid: string) => {
    try {
      setLoading(true);
      /**
       * 服务端文件：server/src/routes/anime.ts
       * 接口：GET /api/v1/anime/projects/:userId
       * Query 参数：limit?: number, offset?: number
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/anime/projects/${uid}?limit=50`
      );
      const result = await response.json();

      if (result.success) {
        setProjects(result.data || []);
      }
    } catch (error) {
      console.error('Fetch anime projects error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 进入项目详情
  const handleProjectPress = (project: AnimeProject) => {
    router.push('/anime-detail', { projectId: project.id });
  };

  // 前往创作中心
  const handleCreateNew = () => {
    router.navigate('/(tabs)');
  };

  // 获取风格渐变色
  const getGradient = (style: string): readonly [string, string] => {
    return STYLE_GRADIENTS[style] || STYLE_GRADIENTS['japanese'];
  };

  // 获取风格名称
  const getStyleName = (style: string) => {
    const styleNames: Record<string, string> = {
      'japanese': '日系',
      'chinese': '国风',
      'korean': '韩系',
      'qstyle': 'Q版',
      'realistic': '写实',
      'fantasy': '奇幻',
    };
    return styleNames[style] || style;
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: Spacing.md }}>
            加载中...
          </ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            <FontAwesome6 name="play" size={12} color={theme.buttonPrimaryText} /> 我的动漫
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
            共 {projects.length} 个动漫项目
          </ThemedText>
        </View>

        {/* 项目列表 */}
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <FontAwesome6 name="film" size={64} color={theme.textMuted} />
            </View>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.emptyText}>
              还没有动漫项目\n前往AI创作中心开始创作
            </ThemedText>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateNew}
            >
              <FontAwesome6 name="plus" size={16} color={theme.buttonPrimaryText} />
              <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>
                创建动漫
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => handleProjectPress(project)}
            >
              <LinearGradient
                colors={getGradient(project.style)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.projectGradient}
              >
                <View style={styles.projectHeader}>
                  <ThemedText
                    variant="h4"
                    color="#FFFFFF"
                    style={styles.projectTitle}
                    numberOfLines={1}
                  >
                    {project.title}
                  </ThemedText>
                  <View style={[styles.projectBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <ThemedText variant="caption" color="#FFFFFF">
                      {getStyleName(project.style)}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText
                  variant="small"
                  color="rgba(255,255,255,0.9)"
                  numberOfLines={2}
                >
                  {project.synopsis}
                </ThemedText>

                <View style={styles.projectInfo}>
                  <View style={styles.projectStat}>
                    <FontAwesome6 name="images" size={12} color="rgba(255,255,255,0.8)" />
                    <ThemedText variant="caption" color="rgba(255,255,255,0.8)">
                      {project.scenes?.length || 0} 场景
                    </ThemedText>
                  </View>
                  <View style={styles.projectStat}>
                    <FontAwesome6 name="video" size={12} color="rgba(255,255,255,0.8)" />
                    <ThemedText variant="caption" color="rgba(255,255,255,0.8)">
                      {project.video_urls?.length || 0} 视频
                    </ThemedText>
                  </View>
                  {project.video_status === 'completed' && (
                    <View style={[styles.projectBadge, { backgroundColor: 'rgba(16,185,129,0.3)' }]}>
                      <ThemedText variant="caption" color="#FFFFFF">✓ 已完成</ThemedText>
                    </View>
                  )}
                </View>

                {/* 视频预览缩略图 */}
                {project.video_urls && project.video_urls.length > 0 && (
                  <View style={styles.videoPreview}>
                    {project.video_urls.slice(0, 4).map((_, index) => (
                      <View
                        key={index}
                        style={[styles.videoThumbnail, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
                      >
                        <View style={[styles.playIcon, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                          <FontAwesome6 name="play" size={10} color="#FFFFFF" />
                        </View>
                      </View>
                    ))}
                    {project.video_urls.length > 4 && (
                      <View style={[styles.videoThumbnail, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                        <ThemedText variant="caption" color="#FFFFFF">
                          +{project.video_urls.length - 4}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
