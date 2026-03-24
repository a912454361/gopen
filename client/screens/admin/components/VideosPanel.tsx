/**
 * 视频管理面板
 * 功能：视频列表、预览播放、下载、删除、生成测试视频
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
  Modal,
  Text,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { FontAwesome6 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// 视频主题选项
const VIDEO_THEMES = [
  { key: 'xianxia', label: '仙侠', color: '#1a0a2e' },
  { key: 'wuxia', label: '武侠', color: '#0a1a0a' },
  { key: 'zhanDou', label: '战斗', color: '#2e0a0a' },
  { key: 'senlin', label: '森林', color: '#0a2e1a' },
  { key: 'yejing', label: '夜景', color: '#0a0a2e' },
  { key: 'richu', label: '日出', color: '#3e2a0a' },
];

export function VideosPanel({ adminKey }: VideosPanelProps) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoInfo | null>(null);
  
  // 视频播放器状态
  const [playerVisible, setPlayerVisible] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<VideoInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<Video>(null);
  
  // 生成测试视频状态
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateTitle, setGenerateTitle] = useState('');
  const [generateDuration, setGenerateDuration] = useState('15');
  const [generateTheme, setGenerateTheme] = useState('xianxia');
  const [generating, setGenerating] = useState(false);

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
  
  // 生成测试视频
  const handleGenerateVideo = useCallback(async () => {
    if (!generateTitle.trim()) {
      Alert.alert('提示', '请输入视频标题');
      return;
    }
    
    const dur = parseInt(generateDuration, 10);
    if (isNaN(dur) || dur < 5 || dur > 60) {
      Alert.alert('提示', '时长请在5-60秒之间');
      return;
    }
    
    setGenerating(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/videos/generate-test?key=${adminKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: generateTitle,
            duration: dur,
            theme: generateTheme,
          }),
        }
      );
      const result = await response.json();
      
      if (result.success) {
        Alert.alert('成功', '测试视频已生成');
        setShowGenerateModal(false);
        setGenerateTitle('');
        await fetchVideos();
      } else {
        Alert.alert('失败', result.error || '生成失败');
      }
    } catch (error) {
      console.error('Generate video error:', error);
      Alert.alert('错误', '网络错误');
    } finally {
      setGenerating(false);
    }
  }, [adminKey, generateTitle, generateDuration, generateTheme, fetchVideos]);

  // 打开视频播放器
  const openPlayer = useCallback((video: VideoInfo) => {
    setPlayingVideo(video);
    setPlayerVisible(true);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // 关闭播放器
  const closePlayer = useCallback(async () => {
    if (videoRef.current) {
      await videoRef.current.stopAsync();
      await videoRef.current.unloadAsync();
    }
    setPlayerVisible(false);
    setPlayingVideo(null);
    setIsPlaying(false);
  }, []);

  // 播放/暂停
  const togglePlayPause = useCallback(async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // 快进/快退
  const seek = useCallback(async (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
      await videoRef.current.setPositionAsync(newTime * 1000);
      setCurrentTime(newTime);
    }
  }, [currentTime, duration]);

  // 播放状态回调
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      setIsPlaying(status.isPlaying);
      
      // 播放结束
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  }, []);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      // 在Web端直接打开链接
      if (Platform.OS === 'web') {
        window.open(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/videos/${video.id}/download?key=${adminKey}`, '_blank');
        return;
      }
      
      Alert.alert('下载中', '正在准备下载...');
      
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

  // 获取视频预览URL
  const getVideoUrl = (video: VideoInfo): string => {
    return `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/videos/${video.id}/preview?key=${adminKey}`;
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
          
          {/* 播放按钮预览图 */}
          {item.status === 'completed' && (
            <TouchableOpacity
              style={{
                width: 48,
                height: 48,
                borderRadius: BorderRadius.lg,
                backgroundColor: theme.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => openPlayer(item)}
            >
              <FontAwesome6 name="play" size={18} color={theme.buttonPrimaryText} />
            </TouchableOpacity>
          )}
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
                  onPress={() => openPlayer(item)}
                >
                  <FontAwesome6 name="play" size={14} color={theme.buttonPrimaryText} />
                  <ThemedText variant="small" color={theme.buttonPrimaryText}>播放预览</ThemedText>
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
                  onPress={() => handleDownload(item)}
                >
                  <FontAwesome6 name="download" size={14} color={theme.textPrimary} />
                  <ThemedText variant="small" color={theme.textPrimary}>下载</ThemedText>
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

  // 渲染视频播放器模态框
  const renderVideoPlayer = () => {
    if (!playingVideo) return null;

    const videoUrl = getVideoUrl(playingVideo);
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <Modal
        visible={playerVisible}
        animationType="slide"
        onRequestClose={closePlayer}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={{
          flex: 1,
          backgroundColor: '#000',
        }}>
          {/* 顶部控制栏 */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: Platform.OS === 'ios' ? 50 : 20,
            paddingHorizontal: Spacing.lg,
            paddingBottom: Spacing.md,
            backgroundColor: 'rgba(0,0,0,0.7)',
          }}>
            <TouchableOpacity onPress={closePlayer} style={{ padding: Spacing.sm }}>
              <FontAwesome6 name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            
            <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
                EP{String(playingVideo.episodeNumber).padStart(2, '0')} - {playingVideo.title}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                {playingVideo.resolution} · {formatSize(playingVideo.size)}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => setIsFullscreen(!isFullscreen)}
              style={{ padding: Spacing.sm }}
            >
              <FontAwesome6 name={isFullscreen ? "compress" : "expand"} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* 视频播放器 */}
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={{
                width: isFullscreen ? SCREEN_HEIGHT : SCREEN_WIDTH,
                height: isFullscreen ? SCREEN_WIDTH : SCREEN_WIDTH * 9 / 16,
              }}
              resizeMode={isFullscreen ? ResizeMode.STRETCH : ResizeMode.CONTAIN}
              shouldPlay={isPlaying}
              isLooping={false}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              useNativeControls={false}
            />
          </View>

          {/* 播放控制栏 */}
          <View style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            paddingTop: Spacing.md,
            paddingHorizontal: Spacing.lg,
            paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
          }}>
            {/* 进度条 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
              <Text style={{ color: '#fff', fontSize: 12, width: 45 }}>{formatTime(currentTime)}</Text>
              <View style={{
                flex: 1,
                height: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <View style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: theme.primary,
                  borderRadius: 2,
                }} />
              </View>
              <Text style={{ color: '#fff', fontSize: 12, width: 45, textAlign: 'right' }}>{formatTime(duration)}</Text>
            </View>

            {/* 控制按钮 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing['2xl'] }}>
              {/* 快退10秒 */}
              <TouchableOpacity onPress={() => seek(-10)} style={{ padding: Spacing.md }}>
                <FontAwesome6 name="rotate-left" size={24} color="#fff" />
              </TouchableOpacity>

              {/* 播放/暂停 */}
              <TouchableOpacity
                onPress={togglePlayPause}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: theme.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <FontAwesome6 
                  name={isPlaying ? "pause" : "play"} 
                  size={28} 
                  color={theme.buttonPrimaryText} 
                  style={{ marginLeft: isPlaying ? 0 : 4 }}
                />
              </TouchableOpacity>

              {/* 快进10秒 */}
              <TouchableOpacity onPress={() => seek(10)} style={{ padding: Spacing.md }}>
                <FontAwesome6 name="rotate-right" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* 快捷操作 */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing['2xl'], marginTop: Spacing.lg }}>
              <TouchableOpacity 
                onPress={() => seek(-30)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}
              >
                <FontAwesome6 name="backward" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>30秒</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleDownload(playingVideo)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}
              >
                <FontAwesome6 name="download" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>下载</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => seek(30)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}
              >
                <FontAwesome6 name="forward" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>30秒</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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

      {/* 生成测试视频按钮 */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.sm,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          backgroundColor: theme.primary,
          borderRadius: BorderRadius.lg,
        }}
        onPress={() => setShowGenerateModal(true)}
      >
        <FontAwesome6 name="wand-magic-sparkles" size={16} color={theme.buttonPrimaryText} />
        <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>生成测试视频</ThemedText>
      </TouchableOpacity>

      {/* 视频列表 */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
          <ThemedText variant="h3" color={theme.textPrimary}>视频列表</ThemedText>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
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

      {/* 生成测试视频模态框 */}
      <Modal
        visible={showGenerateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: Spacing.lg,
          }}>
            <ThemedView
              level="default"
              style={{
                width: '100%',
                maxWidth: 400,
                borderRadius: BorderRadius.lg,
                padding: Spacing.xl,
              }}
            >
              {/* 标题 */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
                <ThemedText variant="h4" color={theme.textPrimary}>生成测试视频</ThemedText>
                <TouchableOpacity onPress={() => setShowGenerateModal(false)}>
                  <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* 标题输入 */}
              <View style={{ marginBottom: Spacing.md }}>
                <ThemedText variant="smallMedium" color={theme.textSecondary} style={{ marginBottom: Spacing.sm }}>
                  视频标题
                </ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.md,
                    padding: Spacing.md,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  placeholder="请输入标题"
                  placeholderTextColor={theme.textMuted}
                  value={generateTitle}
                  onChangeText={setGenerateTitle}
                  maxLength={15}
                />
              </View>

              {/* 时长输入 */}
              <View style={{ marginBottom: Spacing.md }}>
                <ThemedText variant="smallMedium" color={theme.textSecondary} style={{ marginBottom: Spacing.sm }}>
                  视频时长（秒，5-60）
                </ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.md,
                    padding: Spacing.md,
                    color: theme.textPrimary,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  placeholder="15"
                  placeholderTextColor={theme.textMuted}
                  value={generateDuration}
                  onChangeText={setGenerateDuration}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              {/* 主题选择 */}
              <View style={{ marginBottom: Spacing.xl }}>
                <ThemedText variant="smallMedium" color={theme.textSecondary} style={{ marginBottom: Spacing.sm }}>
                  视频主题
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                  {VIDEO_THEMES.map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.xs,
                        paddingVertical: Spacing.sm,
                        paddingHorizontal: Spacing.md,
                        borderRadius: BorderRadius.md,
                        backgroundColor: generateTheme === t.key ? theme.primary : theme.backgroundTertiary,
                        borderWidth: 1,
                        borderColor: generateTheme === t.key ? theme.primary : theme.border,
                      }}
                      onPress={() => setGenerateTheme(t.key)}
                    >
                      <View style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: t.color,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.3)',
                      }} />
                      <ThemedText
                        variant="small"
                        color={generateTheme === t.key ? theme.buttonPrimaryText : theme.textPrimary}
                      >
                        {t.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 按钮 */}
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.md,
                    backgroundColor: theme.backgroundTertiary,
                    alignItems: 'center',
                  }}
                  onPress={() => setShowGenerateModal(false)}
                >
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.md,
                    backgroundColor: theme.primary,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                  }}
                  onPress={handleGenerateVideo}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                  ) : (
                    <FontAwesome6 name="wand-magic-sparkles" size={14} color={theme.buttonPrimaryText} />
                  )}
                  <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                    {generating ? '生成中...' : '生成视频'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 视频播放器模态框 */}
      {renderVideoPlayer()}
    </View>
  );
}

export default VideosPanel;
