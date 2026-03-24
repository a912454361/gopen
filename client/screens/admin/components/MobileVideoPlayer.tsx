/**
 * 移动端视频播放器组件
 * 使用平台特定的VideoPlayer组件
 */

import React from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import { VideoPlayer } from '@/components/VideoPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MobileVideoPlayerProps {
  videoUrl: string;
  isFullscreen: boolean;
  visible: boolean;
}

export function MobileVideoPlayer({ videoUrl, isFullscreen, visible }: MobileVideoPlayerProps) {
  if (!videoUrl || videoUrl === 'about:blank') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#888' }}>加载中...</Text>
      </View>
    );
  }

  return (
    <VideoPlayer
      videoUrl={videoUrl}
      style={{
        width: isFullscreen ? SCREEN_HEIGHT : SCREEN_WIDTH,
        height: isFullscreen ? SCREEN_WIDTH : SCREEN_WIDTH * 9 / 16,
      }}
      autoPlay={visible}
      controls={true}
      nativeControls={true}
      contentFit="contain"
    />
  );
}
