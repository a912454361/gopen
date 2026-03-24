/**
 * 移动端视频播放器组件
 * 使用 expo-video 播放视频
 */

import React, { useEffect } from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MobileVideoPlayerProps {
  videoUrl: string;
  isFullscreen: boolean;
  visible: boolean;
}

export function MobileVideoPlayer({ videoUrl, isFullscreen, visible }: MobileVideoPlayerProps) {
  // useVideoPlayer 必须在组件顶层调用，不能条件调用
  const player = useVideoPlayer(videoUrl || 'about:blank', (p) => {
    p.loop = false;
  });

  // 当视频可见时自动播放
  useEffect(() => {
    if (visible && videoUrl && videoUrl !== 'about:blank') {
      player.play();
    }
    return () => {
      if (visible) {
        player.pause();
      }
    };
  }, [visible, videoUrl, player]);

  if (!videoUrl || videoUrl === 'about:blank') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>加载中...</Text>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={{
        width: isFullscreen ? SCREEN_HEIGHT : SCREEN_WIDTH,
        height: isFullscreen ? SCREEN_WIDTH : SCREEN_WIDTH * 9 / 16,
      }}
      nativeControls={true}
      contentFit="contain"
    />
  );
}
