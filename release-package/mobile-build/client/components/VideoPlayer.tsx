/**
 * 跨平台视频播放器组件入口
 * 
 * React Native会根据平台自动选择正确的实现：
 * - Web端：VideoPlayer.web.tsx（使用HTML5 video标签）
 * - 移动端：VideoPlayer.native.tsx（使用expo-video）
 * 
 * 这个文件仅作为类型定义和文档说明使用
 */

// 类型定义
export interface VideoPlayerProps {
  videoUrl: string;
  style?: any;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  onEnd?: () => void;
  nativeControls?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
}

// 导出将在平台特定文件中实现
export { VideoPlayer, useVideoPlayer, VideoView } from './VideoPlayer.web';
