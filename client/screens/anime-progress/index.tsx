import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';

const PROJECT_ID = '4757e981-0239-4ef7-a178-9245e1612b43';

interface SceneProgress {
  episode: number;
  sceneId: number;
  title: string;
  status: 'completed' | 'pending' | 'generating';
  videoUrl?: string;
}

export default function AnimeProgressScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [scenes, setScenes] = useState<SceneProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 定义所有场景
  const allScenes: SceneProgress[] = [
    // 第一集
    { episode: 1, sceneId: 1, title: '开场-云端剑影', status: 'completed' },
    { episode: 1, sceneId: 2, title: '少年云澈', status: 'completed' },
    { episode: 1, sceneId: 3, title: '剑魂降临', status: 'completed' },
    { episode: 1, sceneId: 4, title: '剑魂融合', status: 'completed' },
    { episode: 1, sceneId: 5, title: '力量觉醒', status: 'completed' },
    { episode: 1, sceneId: 6, title: '神秘老者', status: 'pending' },
    { episode: 1, sceneId: 7, title: '剑圣指点', status: 'pending' },
    { episode: 1, sceneId: 8, title: '踏上征途', status: 'pending' },
    // 第二集
    { episode: 2, sceneId: 1, title: '离开山村', status: 'pending' },
    { episode: 2, sceneId: 2, title: '小镇集市', status: 'pending' },
    { episode: 2, sceneId: 3, title: '路见不平', status: 'pending' },
    { episode: 2, sceneId: 4, title: '初试剑法', status: 'pending' },
    { episode: 2, sceneId: 5, title: '神秘女子', status: 'pending' },
    { episode: 2, sceneId: 6, title: '江湖路远', status: 'pending' },
    // 第三集
    { episode: 3, sceneId: 1, title: '夜宿古庙', status: 'pending' },
    { episode: 3, sceneId: 2, title: '妖气弥漫', status: 'pending' },
    { episode: 3, sceneId: 3, title: '妖兽现身', status: 'pending' },
    { episode: 3, sceneId: 4, title: '激战妖兽', status: 'pending' },
    { episode: 3, sceneId: 5, title: '剑魂之力', status: 'pending' },
    { episode: 3, sceneId: 6, title: '斩妖除魔', status: 'pending' },
    { episode: 3, sceneId: 7, title: '神秘符文', status: 'pending' },
  ];

  const fetchProgress = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/anime-video/project/${PROJECT_ID}/videos`
      );
      const data = await response.json();
      
      if (data.success) {
        const completedIds = new Set(
          (data.data || []).map((v: any) => v.scene_id)
        );
        
        setScenes(allScenes.map(s => ({
          ...s,
          status: completedIds.has(s.episode * 100 + s.sceneId) ? 'completed' : s.status,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      setScenes(allScenes);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    // 每30秒自动刷新
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProgress();
  };

  const completedCount = scenes.filter(s => s.status === 'completed').length;
  const totalCount = scenes.length;
  const progress = totalCount > 0 ? Math.floor((completedCount / totalCount) * 100) : 0;

  // 按集数分组
  const episodes = scenes.reduce((acc, scene) => {
    if (!acc[scene.episode]) acc[scene.episode] = [];
    acc[scene.episode].push(scene);
    return acc;
  }, {} as Record<number, SceneProgress[]>);

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <ThemedView level="root" style={styles.header}>
          <View style={styles.titleRow}>
            <FontAwesome6 name="play-circle" size={24} color={theme.primary} />
            <ThemedText variant="h2" style={styles.title}>生成进度</ThemedText>
          </View>
          <ThemedText variant="body" color={theme.textSecondary}>
            《剑破苍穹》80集国风燃爆动漫
          </ThemedText>
        </ThemedView>

        {/* Progress Summary */}
        <ThemedView level="default" style={styles.summaryCard}>
          <View style={styles.progressHeader}>
            <ThemedText variant="h3">总体进度</ThemedText>
            <ThemedText variant="h2" style={{ color: theme.primary }}>{progress}%</ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%`, backgroundColor: theme.primary }
              ]} 
            />
          </View>
          <View style={styles.progressStats}>
            <ThemedText variant="body" color={theme.textSecondary}>
              已完成 {completedCount} / {totalCount} 场景
            </ThemedText>
          </View>
        </ThemedView>

        {/* Episode List */}
        {Object.entries(episodes).map(([epNum, epScenes]) => {
          const epCompleted = epScenes.filter(s => s.status === 'completed').length;
          const epTotal = epScenes.length;
          const epProgress = Math.floor((epCompleted / epTotal) * 100);
          
          return (
            <ThemedView key={epNum} level="default" style={styles.episodeCard}>
              <View style={styles.episodeHeader}>
                <View style={styles.episodeInfo}>
                  <ThemedText variant="h4">第{epNum}集</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {epCompleted}/{epTotal} 场景
                  </ThemedText>
                </View>
                <ThemedText variant="h4" style={{ color: epProgress === 100 ? theme.success : theme.primary }}>
                  {epProgress}%
                </ThemedText>
              </View>
              
              <View style={styles.sceneList}>
                {epScenes.map((scene) => (
                  <View key={`${scene.episode}-${scene.sceneId}`} style={styles.sceneItem}>
                    <View style={styles.sceneStatus}>
                      {scene.status === 'completed' ? (
                        <FontAwesome6 name="check-circle" size={16} color={theme.success} />
                      ) : (
                        <FontAwesome6 name="circle" size={16} color={theme.textMuted} />
                      )}
                    </View>
                    <ThemedText 
                      variant="small" 
                      color={scene.status === 'completed' ? theme.textPrimary : theme.textMuted}
                    >
                      场景{scene.sceneId}: {scene.title}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </ThemedView>
          );
        })}

        {/* Status Info */}
        <ThemedView level="tertiary" style={styles.statusCard}>
          <View style={styles.statusRow}>
            <FontAwesome6 name="info-circle" size={16} color={theme.accent} />
            <ThemedText variant="small" color={theme.textSecondary} style={styles.statusText}>
              后台脚本持续运行中，每30秒检测API状态
            </ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textMuted}>
            下拉刷新查看最新进度
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </Screen>
  );
}
