/**
 * 移动端视频播放器组件
 * 使用expo-video
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView as ExpoVideoView } from 'expo-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerProps {
  videoUrl: string;
  style?: any;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  onEnd?: () => void;
  nativeControls?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
}

export function VideoPlayer({ 
  videoUrl, 
  style, 
  autoPlay = false, 
  loop = false, 
  controls = true,
  onEnd,
  nativeControls = true,
  contentFit = 'contain',
}: VideoPlayerProps) {
  const player = useVideoPlayer(videoUrl || 'about:blank', (p) => {
    p.loop = loop;
  });

  useEffect(() => {
    if (autoPlay && videoUrl && videoUrl !== 'about:blank') {
      player.play();
    }
    return () => {
      if (autoPlay) {
        player.pause();
      }
    };
  }, [autoPlay, videoUrl, player]);

  if (!videoUrl || videoUrl === 'about:blank') {
    return (
      <View style={[styles.container, styles.placeholder, style]}>
        <Text style={styles.placeholderText}>等待视频加载...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ExpoVideoView
        player={player}
        style={styles.video}
        nativeControls={nativeControls}
        contentFit={contentFit}
      />
    </View>
  );
}

// 导出expo-video的原始Hook和组件供高级用法使用
export { useVideoPlayer, ExpoVideoView as VideoView };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#1a1a2e',
  },
  placeholderText: {
    color: '#888',
    fontSize: 14,
  },
});

export default VideoPlayer;
