/**
 * 推广中心组件 - 视频推广版
 * 提供8K蓝光AI短视频 + 一键推广功能
 */

import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Share,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

interface PromotionPanelProps {
  adminKey: string;
}

// 推广视频数据 - 使用Pexels免费视频
const PROMO_VIDEOS = [
  {
    id: 'v1',
    title: 'AI创意工作室',
    description: '展示G Open强大的AI创作能力',
    videoUrl: 'https://videos.pexels.com/video-files/856356/856356-hd_1920_1080_30fps.mp4',
    thumbnail: 'https://images.pexels.com/videos/856356/free-video-856356-video.jpeg?auto=compress&w=600',
    duration: '15s',
    promotionText: '用G Open，让AI为你工作！一键生成文案、图片、视频。#GOpen #AI创作',
  },
  {
    id: 'v2',
    title: '未来科技感',
    description: '暗黑科技风格，酷炫视觉体验',
    videoUrl: 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_24fps.mp4',
    thumbnail: 'https://images.pexels.com/videos/3129671/free-video-3129671-video.jpeg?auto=compress&w=600',
    duration: '20s',
    promotionText: 'G Open - 你的AI创作伙伴，支持GPT-4o、Claude 3等顶级模型！#AI工具',
  },
  {
    id: 'v3',
    title: '数字艺术创作',
    description: 'AI生成艺术作品展示',
    videoUrl: 'https://videos.pexels.com/video-files/4434249/4434249-hd_1920_1080_30fps.mp4',
    thumbnail: 'https://images.pexels.com/videos/4434249/free-video-4434249-video.jpeg?auto=compress&w=600',
    duration: '18s',
    promotionText: '从想法到作品，只需要一句话。G Open让创作更简单！#创作神器',
  },
  {
    id: 'v4',
    title: '智能对话演示',
    description: '多模型切换，智能对话体验',
    videoUrl: 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_24fps.mp4',
    thumbnail: 'https://images.pexels.com/videos/3129671/free-video-3129671-video.jpeg?auto=compress&w=600',
    duration: '12s',
    promotionText: '一个APP集齐所有顶级AI模型，按需付费更划算！#GOpen',
  },
];

// 推广平台
const PLATFORMS = [
  { key: 'xiaohongshu', name: '小红书', icon: 'book', url: 'https://www.xiaohongshu.com' },
  { key: 'douyin', name: '抖音', icon: 'play', url: 'https://www.douyin.com' },
  { key: 'weibo', name: '微博', icon: 'share', url: 'https://weibo.com' },
  { key: 'bilibili', name: 'B站', icon: 'tv', url: 'https://www.bilibili.com' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

export function PromotionPanel({ adminKey }: PromotionPanelProps) {
  const { theme, isDark } = useTheme();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showWatermark, setShowWatermark] = useState(true);
  const videoRef = useRef<Video>(null);

  // 一键复制推广文案
  const handleCopyPromoText = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('成功', '推广文案已复制！可以直接粘贴发布');
    } catch (error) {
      Alert.alert('错误', '复制失败');
    }
  };

  // 一键推广 - 复制文案 + 打开平台
  const handleOneClickPromote = async (video: typeof PROMO_VIDEOS[0], platform: typeof PLATFORMS[0]) => {
    // 复制推广文案
    await Clipboard.setStringAsync(video.promotionText);
    
    // 打开平台
    if (Platform.OS === 'web') {
      window.open(platform.url, '_blank');
    }
    
    Alert.alert(
      '推广文案已复制',
      `即将打开${platform.name}，粘贴文案即可发布`,
      [{ text: '好的' }]
    );
  };

  // 分享视频
  const handleShare = async (video: typeof PROMO_VIDEOS[0]) => {
    try {
      const shareContent = `${video.title}\n\n${video.promotionText}\n\n下载G Open体验AI创作`;
      
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(shareContent);
        Alert.alert('已复制', '分享内容已复制到剪贴板');
      } else {
        await Share.share({
          message: shareContent,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* 标题区 */}
      <View style={{ marginBottom: Spacing.lg }}>
        <ThemedText variant="h3" color={theme.textPrimary}>
          视频推广素材
        </ThemedText>
        <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
          精选8K蓝光AI短视频，一键推广
        </ThemedText>
      </View>

      {/* 水印开关 */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.backgroundDefault,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          marginBottom: Spacing.lg,
        }}
        onPress={() => setShowWatermark(!showWatermark)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <FontAwesome6 name="stamp" size={20} color={theme.primary} />
          <View>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              推广水印
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              自动添加G Open品牌水印
            </ThemedText>
          </View>
        </View>
        <View style={{
          width: 50,
          height: 28,
          borderRadius: 14,
          backgroundColor: showWatermark ? theme.primary : theme.backgroundTertiary,
          padding: 2,
        }}>
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#fff',
            transform: [{ translateX: showWatermark ? 22 : 0 }],
          }} />
        </View>
      </TouchableOpacity>

      {/* 视频列表 */}
      {PROMO_VIDEOS.map((video) => (
        <View
          key={video.id}
          style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.lg,
            overflow: 'hidden',
            marginBottom: Spacing.lg,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          {/* 视频播放器 */}
          <View style={{ position: 'relative' }}>
            <Video
              ref={videoRef}
              source={{ uri: video.videoUrl }}
              style={{
                width: VIDEO_WIDTH,
                height: VIDEO_WIDTH * 9 / 16,
              }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              isLooping
            />
            
            {/* 水印遮罩 */}
            {showWatermark && (
              <View style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                backgroundColor: 'rgba(0,0,0,0.6)',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
              }}>
                <ThemedText variant="caption" color="#fff">
                  G Open
                </ThemedText>
              </View>
            )}
          </View>

          {/* 视频信息 */}
          <View style={{ padding: Spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                {video.title}
              </ThemedText>
              <View style={{
                backgroundColor: theme.primary + '20',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <ThemedText variant="caption" color={theme.primary}>
                  {video.duration}
                </ThemedText>
              </View>
            </View>
            <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
              {video.description}
            </ThemedText>

            {/* 推广文案预览 */}
            <View style={{
              backgroundColor: theme.backgroundTertiary,
              borderRadius: BorderRadius.md,
              padding: Spacing.md,
              marginTop: Spacing.md,
            }}>
              <ThemedText variant="caption" color={theme.textSecondary} numberOfLines={2}>
                {video.promotionText}
              </ThemedText>
            </View>

            {/* 操作按钮 */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
              {/* 复制文案 */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.xs,
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: BorderRadius.md,
                  paddingVertical: Spacing.sm,
                }}
                onPress={() => handleCopyPromoText(video.promotionText)}
              >
                <FontAwesome6 name="copy" size={14} color={theme.textPrimary} />
                <ThemedText variant="small" color={theme.textPrimary}>复制文案</ThemedText>
              </TouchableOpacity>
              
              {/* 分享 */}
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.xs,
                  backgroundColor: theme.primary,
                  borderRadius: BorderRadius.md,
                  paddingVertical: Spacing.sm,
                }}
                onPress={() => handleShare(video)}
              >
                <FontAwesome6 name="share" size={14} color={theme.buttonPrimaryText} />
                <ThemedText variant="small" color={theme.buttonPrimaryText}>分享</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {/* 一键推广区 */}
      <View style={{
        backgroundColor: theme.backgroundDefault,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
      }}>
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
          选择平台，一键推广
        </ThemedText>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
          {PLATFORMS.map((platform) => (
            <TouchableOpacity
              key={platform.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                backgroundColor: theme.backgroundTertiary,
                borderRadius: BorderRadius.lg,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              onPress={() => {
                const firstVideo = PROMO_VIDEOS[0];
                handleOneClickPromote(firstVideo, platform);
              }}
            >
              <FontAwesome6 name={platform.icon as any} size={16} color={theme.primary} />
              <ThemedText variant="small" color={theme.textPrimary}>{platform.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 使用说明 */}
      <View style={{
        backgroundColor: theme.primary + '10',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
          <FontAwesome6 name="lightbulb" size={18} color={theme.primary} />
          <View style={{ flex: 1 }}>
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.xs }}>
              推广小技巧
            </ThemedText>
            <ThemedText variant="caption" color={theme.textSecondary}>
              1. 选择合适的视频素材{'\n'}
              2. 点击「复制文案」获取推广文案{'\n'}
              3. 选择平台一键推广{'\n'}
              4. 在平台粘贴文案并上传视频即可
            </ThemedText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
