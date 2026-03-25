/**
 * Web端视频播放器组件
 * 使用HTML5 video标签
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

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
  const objectFit = contentFit === 'cover' ? 'cover' : contentFit === 'fill' ? 'fill' : 'contain';
  
  return (
    <View style={[styles.container, style]}>
      {/* @ts-ignore - Web only */}
      <video
        src={videoUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: objectFit,
        }}
        controls={controls}
        autoPlay={autoPlay}
        loop={loop}
        playsInline
        onEnded={onEnd}
      />
    </View>
  );
}

export function useVideoPlayer(url: string, callback?: (player: any) => void) {
  // Web端的虚拟播放器Hook
  return {
    play: () => {},
    pause: () => {},
    loop: false,
    currentTime: 0,
    duration: 0,
  };
}

export const VideoView = VideoPlayer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default VideoPlayer;
