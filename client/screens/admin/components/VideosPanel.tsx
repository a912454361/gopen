/**
 * 视频管理面板
 * 功能：视频列表、预览、下载、删除
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface VideoInfo {
  id: string;
  filename: string;
  title: string;
  episodeNumber: number;
  size: number;
  duration: number;
  resolution: string;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
  outputPath: string;
  scenesCount: number;
}

interface VideosPanelProps {
  adminKey: string;
}

export function VideosPanel({ adminKey }: VideosPanelProps) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);

  // 获取视频列表
  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/videos?key=${adminKey}`
      );
      const result = await response.json();
      if (result.success) {
        setVideos(result.data.videos || []);
      }
    } catch (error) {
      console.error('Fetch videos error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // 刷新
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVideos();
  }, [fetchVideos]);

  // 删除视频
  const handleDelete = useCallback(async (video: VideoInfo) => {
    Alert.alert(
      '确认删除',
      `确定要删除 "${video.title} 第${video.episodeNumber}集" 吗？\n\n文件大小: ${formatSize(video.size)}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/videos/${video.id}?key=${adminKey}`,
                { method: 'DELETE' }
              );
              const result = await response.json();
              if (result.success) {
                Alert.alert('成功', '视频已删除');
                fetchVideos();
              } else {
                Alert.alert('错误', result.error || '删除失败');
              }
            } catch (error) {
              console.error('Delete video error:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  }, [adminKey, fetchVideos]);

  // 下载视频
  const handleDownload = useCallback(async (video: VideoInfo) => {
    try {
      Alert.alert('下载中', '正在准备下载...');
      
      // 在Web端直接打开链接
      if (Platform.OS === 'web') {
        window.open(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/videos/${video.id}/download?key=${adminKey}`, '_blank');
        return;
      }
      
      // 移动端使用Sharing
      const downloadUrl = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/videos/${video.id}/download?key=${adminKey}`;
      const localPath = `${(FileSystem as any).documentDirectory}${video.filename}`;
      
      const downloadResult = await (FileSystem as any).downloadAsync(downloadUrl, localPath);
      
      if (downloadResult.uri) {
        await Sharing.shareAsync(downloadResult.uri);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('错误', '下载失败');
    }
  }, [adminKey]);

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}分${secs}秒`;
  };

  // 渲染视频项
  const renderVideo = ({ item }: { item: VideoInfo }) => (
    <ThemedView
      level="default"
      style={{
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: selectedVideo?.id === item.id ? theme.primary : theme.border,
      }}
    >
      {/* 视频信息 */}
      <TouchableOpacity onPress={() => setSelectedVideo(selectedVideo?.id === item.id ? null : item)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
              <View style={{
                paddingHorizontal: Spacing.sm,
                paddingVertical: 2,
                borderRadius: BorderRadius.sm,
                backgroundColor: item.status === 'completed' ? theme.success : 
                  item.status === 'processing' ? '#F59E0B' : theme.error,
              }}>
                <ThemedText variant="tiny" color="#fff" style={{ fontWeight: '600' }}>
                  EP{String(item.episodeNumber).padStart(2, '0')}
                </ThemedText>
              </View>
              <ThemedText variant="bodyMedium" color={theme.textPrimary} style={{ flex: 1 }} numberOfLines={1}>
                {item.title}
              </ThemedText>
            </View>
            
            <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                <ThemedText variant="caption" color={theme.textMuted}>
                  {formatDuration(item.duration)}
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <FontAwesome6 name="hard-drive" size={12} color={theme.textMuted} />
                <ThemedText variant="caption" color={theme.textMuted}>
                  {formatSize(item.size)}
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                <FontAwesome6 name="expand" size={12} color={theme.textMuted} />
                <ThemedText variant="caption" color={theme.textMuted}>
                  {item.resolution}
                </ThemedText>
              </View>
            </View>
          </View>
          
          {/* 状态图标 */}
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: item.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 
              item.status === 'processing' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <FontAwesome6 
              name={item.status === 'completed' ? 'check' : item.status === 'processing' ? 'spinner' : 'xmark'} 
              size={14} 
              color={item.status === 'completed' ? theme.success : item.status === 'processing' ? '#F59E0B' : theme.error} 
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* 展开详情 */}
      {selectedVideo?.id === item.id && (
        <View style={{ marginTop: Spacing.lg, paddingTop: Spacing.lg, borderTopWidth: 1, borderTopColor: theme.border }}>
          {/* 详细信息 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <FontAwesome6 name="film" size={12} color={theme.primary} />
              <ThemedText variant="caption" color={theme.textSecondary}>
                {item.scenesCount} 个场景
              </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <FontAwesome6 name="calendar" size={12} color={theme.primary} />
              <ThemedText variant="caption" color={theme.textSecondary}>
                {new Date(item.createdAt).toLocaleString('zh-CN')}
              </ThemedText>
            </View>
          </View>

          {/* 操作按钮 */}
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            {item.status === 'completed' && (
              <>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                    paddingVertical: Spacing.md,
                    backgroundColor: theme.primary,
                    borderRadius: BorderRadius.lg,
                  }}
                  onPress={() => handleDownload(item)}
                >
                  <FontAwesome6 name="download" size={14} color={theme.buttonPrimaryText} />
                  <ThemedText variant="small" color={theme.buttonPrimaryText}>下载</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                    paddingVertical: Spacing.md,
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.lg,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      window.open(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/videos/${item.id}/preview?key=${adminKey}`, '_blank');
                    }
                  }}
                >
                  <FontAwesome6 name="play" size={14} color={theme.textPrimary} />
                  <ThemedText variant="small" color={theme.textPrimary}>预览</ThemedText>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: BorderRadius.lg,
                borderWidth: 1,
                borderColor: theme.error,
              }}
              onPress={() => handleDelete(item)}
            >
              <FontAwesome6 name="trash" size={14} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ThemedView>
  );

  // 加载中
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing['2xl'] }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
          加载视频列表...
        </ThemedText>
      </View>
    );
  }

  // 统计信息
  const totalSize = videos.reduce((sum, v) => sum + v.size, 0);
  const completedCount = videos.filter(v => v.status === 'completed').length;

  return (
    <View style={{ gap: Spacing.lg }}>
      {/* 统计卡片 */}
      <View style={{ flexDirection: 'row', gap: Spacing.md }}>
        <ThemedView
          level="default"
          style={{
            flex: 1,
            padding: Spacing.lg,
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: BorderRadius.md,
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <FontAwesome6 name="video" size={14} color={theme.primary} />
            </View>
            <ThemedText variant="small" color={theme.textMuted}>总视频数</ThemedText>
          </View>
          <ThemedText variant="h3" color={theme.textPrimary}>{videos.length}</ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            已完成 {completedCount} 个
          </ThemedText>
        </ThemedView>

        <ThemedView
          level="default"
          style={{
            flex: 1,
            padding: Spacing.lg,
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: BorderRadius.md,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <FontAwesome6 name="database" size={14} color={theme.success} />
            </View>
            <ThemedText variant="small" color={theme.textMuted}>存储占用</ThemedText>
          </View>
          <ThemedText variant="h3" color={theme.textPrimary}>{formatSize(totalSize)}</ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            共 {videos.length} 个文件
          </ThemedText>
        </ThemedView>
      </View>

      {/* 视频列表 */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
          <ThemedText variant="h3" color={theme.textPrimary}>视频列表</ThemedText>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.md,
              backgroundColor: theme.backgroundTertiary,
              borderRadius: BorderRadius.md,
            }}
            onPress={handleRefresh}
          >
            <FontAwesome6 name={refreshing ? 'spinner' : 'rotate'} size={12} color={theme.textPrimary} />
            <ThemedText variant="small" color={theme.textPrimary}>刷新</ThemedText>
          </TouchableOpacity>
        </View>

        {videos.length === 0 ? (
          <ThemedView
            level="default"
            style={{
              padding: Spacing['2xl'],
              borderRadius: BorderRadius.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <FontAwesome6 name="video-slash" size={32} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              暂无视频
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={videos}
            renderItem={renderVideo}
            keyExtractor={(item) => item.id}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
}

export default VideosPanel;
