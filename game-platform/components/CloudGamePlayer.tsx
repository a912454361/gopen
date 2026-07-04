/**
 * 云游戏播放器组件
 * 实现流畅的云游戏流式传输体验
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Text,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Video } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 云游戏状态
type CloudGameState = 'idle' | 'connecting' | 'ready' | 'playing' | 'paused' | 'error';

interface CloudGameConfig {
  gameId: string;
  gameName: string;
  serverUrl: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  frameRate: 30 | 60;
}

interface CloudGamePlayerProps {
  config: CloudGameConfig;
  onClose: () => void;
  onReady?: () => void;
  onError?: (error: string) => void;
}

// 金色主题
const GOLD = '#D4AF37';

export function CloudGamePlayer({ config, onClose, onReady, onError }: CloudGamePlayerProps) {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState<CloudGameState>('idle');
  const [latency, setLatency] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);
  const [quality, setQuality] = useState<string>(config.quality);
  const [showControls, setShowControls] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const connectionProgress = useRef(new Animated.Value(0)).current;
  
  // 模拟连接过程
  useEffect(() => {
    if (gameState === 'idle') {
      startConnection();
    }
  }, []);

  // 控制栏自动隐藏
  useEffect(() => {
    if (showControls && gameState === 'playing') {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, gameState]);

  // 模拟延迟和帧率更新
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setLatency(Math.floor(Math.random() * 20 + 10)); // 10-30ms
        setFps(Math.floor(Math.random() * 5 + 56)); // 56-60 fps
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // 脉冲动画
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const startConnection = async () => {
    setGameState('connecting');
    
    // 模拟连接进度
    Animated.timing(connectionProgress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // 模拟连接过程
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGameState('ready');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setGameState('playing');
    onReady?.();
  };

  const handlePause = () => {
    setGameState(gameState === 'playing' ? 'paused' : 'playing');
  };

  const handleQualityChange = () => {
    const qualities = ['low', 'medium', 'high', 'ultra'];
    const currentIndex = qualities.indexOf(quality);
    const nextQuality = qualities[(currentIndex + 1) % qualities.length];
    setQuality(nextQuality);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // 连接中界面
  if (gameState === 'connecting') {
    return (
      <View style={styles.container}>
        <View style={styles.connectingOverlay}>
          <Animated.View style={[styles.connectingRing, { transform: [{ scale: pulseAnim }] }]}>
            <FontAwesome6 name="cloud" size={48} color={GOLD} />
          </Animated.View>
          
          <ThemedText variant="h3" weight="bold" color={GOLD} style={{ marginTop: 24 }}>
            连接云游戏服务器
          </ThemedText>
          
          <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: 8 }}>
            正在为您分配最佳节点...
          </ThemedText>
          
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { 
                  width: connectionProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  })
                }
              ]} 
            />
          </View>
          
          <View style={styles.connectionSteps}>
            <View style={styles.connectionStep}>
              <FontAwesome6 name="check-circle" size={16} color={GOLD} />
              <ThemedText variant="caption" color={GOLD}>认证成功</ThemedText>
            </View>
            <View style={styles.connectionStep}>
              <ActivityIndicator size="small" color={GOLD} />
              <ThemedText variant="caption" color={theme.textSecondary}>分配节点</ThemedText>
            </View>
            <View style={styles.connectionStep}>
              <FontAwesome6 name="circle" size={16} color={theme.textMuted} />
              <ThemedText variant="caption" color={theme.textMuted}>建立连接</ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // 错误界面
  if (gameState === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.errorOverlay}>
          <FontAwesome6 name="exclamation-triangle" size={48} color={theme.error} />
          <ThemedText variant="h3" weight="bold" color={theme.textPrimary} style={{ marginTop: 16 }}>
            连接失败
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: 8 }}>
            请检查网络连接后重试
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={startConnection}>
            <ThemedText variant="label" weight="medium" color="#000">重新连接</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 游戏界面
  return (
    <View style={styles.container}>
      {/* 游戏画面区域 - 这里是云游戏渲染区域 */}
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.gameArea}
        onPress={toggleControls}
      >
        {/* 模拟游戏画面背景 */}
        <View style={styles.gameBackground}>
          <View style={styles.gamePlaceholder}>
            <FontAwesome6 name="gamepad" size={64} color={GOLD} />
            <ThemedText variant="h2" weight="bold" color={GOLD} style={{ marginTop: 16 }}>
              {config.gameName}
            </ThemedText>
            <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: 8 }}>
              云游戏流式传输中...
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      {/* 控制栏 */}
      {showControls && (
        <Animated.View style={[styles.controls, { opacity: fadeAnim }]}>
          {/* 顶部栏 */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome6 name="arrow-left" size={20} color="#FFF" />
            </TouchableOpacity>
            
            <View style={styles.gameInfo}>
              <ThemedText variant="label" weight="medium" color="#FFF">
                {config.gameName}
              </ThemedText>
              <ThemedText variant="tiny" color={theme.textSecondary}>
                云游戏 · {quality.toUpperCase()}
              </ThemedText>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome6 name="signal" size={12} color={latency < 30 ? '#10B981' : '#F59E0B'} />
                <Text style={[styles.statText, { color: latency < 30 ? '#10B981' : '#F59E0B' }]}>
                  {latency}ms
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome6 name="film" size={12} color={GOLD} />
                <Text style={[styles.statText, { color: GOLD }]}>{fps}fps</Text>
              </View>
            </View>
          </View>

          {/* 底部控制 */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePause}>
              <FontAwesome6 
                name={gameState === 'playing' ? 'pause' : 'play'} 
                size={24} 
                color="#FFF" 
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleQualityChange}>
              <FontAwesome6 name="sliders" size={20} color="#FFF" />
              <Text style={styles.qualityLabel}>{quality.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <FontAwesome6 name="expand" size={20} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton}>
              <FontAwesome6 name="volume-high" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* 状态指示器 */}
      {gameState === 'paused' && (
        <View style={styles.pausedOverlay}>
          <FontAwesome6 name="pause-circle" size={64} color={GOLD} />
          <ThemedText variant="h3" weight="bold" color="#FFF" style={{ marginTop: 16 }}>
            已暂停
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  gameArea: {
    flex: 1,
  },
  gameBackground: {
    flex: 1,
    backgroundColor: '#050508',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gamePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  qualityLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  connectingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
    padding: 24,
  },
  connectingRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GOLD,
  },
  progressBarContainer: {
    width: 240,
    height: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 2,
    marginTop: 32,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 2,
  },
  connectionSteps: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 32,
  },
  connectionStep: {
    alignItems: 'center',
    gap: 8,
  },
  errorOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
    padding: 24,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: GOLD,
    borderRadius: 12,
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});
