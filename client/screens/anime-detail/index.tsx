import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface AnimeProject {
  id: string;
  title: string;
  synopsis: string;
  characters: Array<{
    name: string;
    role: string;
    description: string;
  }>;
  scenes: Array<{
    sceneId: number;
    location: string;
    description: string;
    mood: string;
    imagePrompt?: string;
  }>;
  episodes: Array<{
    episodeNumber: number;
    title: string;
    summary: string;
  }>;
  style: string;
  theme: string;
  video_urls?: string[];
  video_status?: string;
  created_at: string;
}

interface SceneVideo {
  id: string;
  scene_id: number;
  video_url: string;
  duration: number;
  created_at: string;
}

export default function AnimeDetailScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [project, setProject] = useState<AnimeProject | null>(null);
  const [videos, setVideos] = useState<SceneVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<SceneVideo | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // 获取项目详情
  const fetchProject = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      
      // 获取动漫项目
      const projectResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/anime/project/${projectId}`
      );
      const projectResult = await projectResponse.json();
      
      if (projectResult.success) {
        setProject(projectResult.data);
      }

      // 获取场景视频
      const videosResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/anime-video/project/${projectId}/videos`
      );
      const videosResult = await videosResponse.json();
      
      if (videosResult.success) {
        setVideos(videosResult.data || []);
      }
    } catch (error) {
      console.error('Fetch anime project error:', error);
      Alert.alert('错误', '加载项目失败');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      fetchProject();
    }, [fetchProject])
  );

  // 生成视频
  const handleGenerateVideos = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/anime-video/project`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: '53714d80-6677-420b-9cf1-cb22a41191ca', // 郭涛
            anime_project_id: projectId,
            style: project?.style || '日系动漫',
            resolution: '1080p',
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', `已开始生成 ${result.data.scene_count} 个场景视频`);
        // 开始轮询进度
        fetchProject();
      } else {
        Alert.alert('错误', result.error || '生成失败');
      }
    } catch (error) {
      console.error('Generate videos error:', error);
      Alert.alert('错误', '生成视频失败');
    }
  };

  // 播放视频
  const handlePlayVideo = (video: SceneVideo) => {
    setSelectedVideo(video);
    setIsVideoPlaying(true);
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

  if (!project) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.errorContainer}>
          <FontAwesome6 name="film" size={48} color={theme.textMuted} />
          <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: Spacing.md }}>
            项目不存在
          </ThemedText>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={16} color={theme.primary} />
            <ThemedText variant="bodyMedium" color={theme.primary}>返回</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={16} color={theme.primary} />
          <ThemedText variant="bodyMedium" color={theme.primary}>返回</ThemedText>
        </TouchableOpacity>

        {/* 标题区 */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            {project.title}
          </ThemedText>
          <View style={styles.metaInfo}>
            <View style={[styles.metaTag, { backgroundColor: theme.primary + '20' }]}>
              <ThemedText variant="caption" color={theme.primary}>
                {project.style || '日系动漫'}
              </ThemedText>
            </View>
            <View style={[styles.metaTag, { backgroundColor: theme.accent + '20' }]}>
              <ThemedText variant="caption" color={theme.accent}>
                {project.theme || '奇幻'}
              </ThemedText>
            </View>
            <View style={[styles.metaTag, { backgroundColor: theme.success + '20' }]}>
              <ThemedText variant="caption" color={theme.success}>
                {videos.length}/{project.scenes?.length || 0} 视频
              </ThemedText>
            </View>
          </View>
        </View>

        {/* 故事梗概 */}
        <View style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            故事梗概
          </ThemedText>
          <ThemedView level="default" style={styles.synopsisBox}>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.synopsisText}>
              {project.synopsis}
            </ThemedText>
          </ThemedView>
        </View>

        {/* 角色设定 */}
        {project.characters && project.characters.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
              角色设定
            </ThemedText>
            {project.characters.map((char, index) => (
              <ThemedView key={index} level="default" style={styles.characterCard}>
                <ThemedText variant="h4" color={theme.textPrimary} style={styles.characterName}>
                  {char.name}
                </ThemedText>
                <ThemedText variant="caption" color={theme.primary} style={styles.characterRole}>
                  {char.role}
                </ThemedText>
                <ThemedText variant="small" color={theme.textSecondary} style={styles.characterDesc}>
                  {char.description}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}

        {/* 场景视频 */}
        <View style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            场景视频 ({videos.length}/{project.scenes?.length || 0})
          </ThemedText>

          {videos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome6 name="video-slash" size={48} color={theme.textMuted} />
              <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                暂无视频
              </ThemedText>
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: theme.primary }]}
                onPress={handleGenerateVideos}
              >
                <FontAwesome6 name="wand-magic-sparkles" size={16} color={theme.buttonPrimaryText} />
                <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>
                  生成场景视频
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoGrid}>
              {videos.map((video, index) => (
                <TouchableOpacity
                  key={video.id}
                  style={[styles.videoCard, { backgroundColor: theme.backgroundDefault }]}
                  onPress={() => handlePlayVideo(video)}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
                    style={styles.videoThumbnail}
                  >
                    <View style={[styles.playButton, { backgroundColor: theme.primary }]}>
                      <FontAwesome6 name="play" size={24} color={theme.buttonPrimaryText} />
                    </View>
                    <View style={[styles.sceneBadge, { backgroundColor: theme.primary, position: 'absolute', top: 8, left: 8 }]}>
                      <ThemedText variant="caption" color={theme.buttonPrimaryText}>
                        场景 {video.scene_id}
                      </ThemedText>
                    </View>
                  </LinearGradient>
                  <View style={styles.videoInfo}>
                    <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.videoTitle}>
                      {project.scenes?.[video.scene_id - 1]?.location || `场景 ${video.scene_id}`}
                    </ThemedText>
                    <View style={styles.videoMeta}>
                      <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {video.duration}秒
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 分集剧情 */}
        {project.episodes && project.episodes.length > 0 && (
          <View style={styles.section}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
              分集剧情
            </ThemedText>
            {project.episodes.map((ep, index) => (
              <ThemedView key={index} level="default" style={styles.characterCard}>
                <ThemedText variant="h4" color={theme.textPrimary} style={styles.characterName}>
                  第{ep.episodeNumber}集: {ep.title}
                </ThemedText>
                <ThemedText variant="small" color={theme.textSecondary} style={styles.characterDesc}>
                  {ep.summary}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 视频播放弹窗 */}
      {selectedVideo && isVideoPlaying && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'black',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              zIndex: 10,
              padding: Spacing.md,
            }}
            onPress={() => {
              setIsVideoPlaying(false);
              setSelectedVideo(null);
            }}
          >
            <FontAwesome6 name="xmark" size={24} color="white" />
          </TouchableOpacity>
          <Video
            source={{ uri: selectedVideo.video_url }}
            style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').width * 9 / 16 }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            useNativeControls
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsVideoPlaying(false);
                setSelectedVideo(null);
              }
            }}
          />
        </View>
      )}
    </Screen>
  );
}
