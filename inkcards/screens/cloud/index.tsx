/**
 * 云游戏页面 - 流式传输体验
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
// @ts-ignore
import RNSSE from 'react-native-sse';

const CLOUD_GAME_URL = process.env.EXPO_PUBLIC_CLOUD_GAME_URL || 'wss://cloud.gopen.com.cn';

export default function CloudGameScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [latency, setLatency] = useState<number>(0);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  
  const wsRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectToCloud = async () => {
    setConnecting(true);
    
    try {
      const ws = new RNSSE(CLOUD_GAME_URL, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      wsRef.current = ws;

      ws.addEventListener('open', () => {
        setConnected(true);
        setConnecting(false);
        console.log('[云游戏] 连接成功');
      });

      ws.addEventListener('message', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              setPlayerId(data.playerId);
              break;
            case 'ping':
              // 响应心跳
              ws.send(JSON.stringify({ type: 'pong' }));
              setLatency(Date.now());
              break;
            case 'pong':
              setLatency(Date.now() - latency);
              break;
            case 'frame_update':
              // 处理游戏画面帧
              handleFrameUpdate(data);
              break;
          }
        } catch (error) {
          console.error('[云游戏] 消息解析错误:', error);
        }
      });

      ws.addEventListener('error', (event: any) => {
        console.error('[云游戏] 连接错误:', event);
        setConnected(false);
        setConnecting(false);
      });

      ws.addEventListener('close', () => {
        setConnected(false);
        console.log('[云游戏] 连接关闭');
      });

    } catch (error) {
      console.error('[云游戏] 连接失败:', error);
      setConnecting(false);
    }
  };

  const handleFrameUpdate = (data: any) => {
    // 这里处理游戏画面帧
    // 在实际实现中，会使用 WebGL 或 Canvas 渲染
    console.log('[云游戏] 收到画面帧:', data.timestamp);
  };

  const sendAction = (action: string, data?: any) => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'game_action',
        action,
        ...data,
      }));
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot}>
      <View style={styles.container}>
        {/* 顶部状态栏 */}
        <LinearGradient
          colors={['#1A1A2E', 'transparent']}
          style={styles.statusBar}
        >
          <View style={styles.statusInfo}>
            <View style={styles.connectionStatus}>
              <View style={[
                styles.statusDot,
                { backgroundColor: connected ? theme.success : theme.error }
              ]} />
              <ThemedText variant="tiny" color={theme.textSecondary}>
                {connected ? '已连接' : '未连接'}
              </ThemedText>
            </View>
            
            {connected && (
              <>
                <View style={styles.latencyInfo}>
                  <FontAwesome6 name="signal" size={10} color={theme.success} />
                  <ThemedText variant="tiny" color={theme.textSecondary}>
                    {latency}ms
                  </ThemedText>
                </View>
                
                <View style={styles.qualityInfo}>
                  <FontAwesome6 name="wifi" size={10} color={theme.primary} />
                  <ThemedText variant="tiny" color={theme.textSecondary}>
                    {quality === 'high' ? '高清' : quality === 'medium' ? '标清' : '流畅'}
                  </ThemedText>
                </View>
              </>
            )}
          </View>
        </LinearGradient>

        {/* 游戏画面区域 */}
        <View style={styles.gameArea}>
          {!connected ? (
            <View style={styles.connectPrompt}>
              <View style={[styles.logoContainer, { backgroundColor: theme.backgroundCard }]}>
                <FontAwesome6 name="cloud" size={48} color={theme.primary} />
              </View>
              
              <ThemedText variant="h3" color={theme.textPrimary} style={{ marginTop: 24 }}>
                云游戏
              </ThemedText>
              
              <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: 8, textAlign: 'center' }}>
                流畅体验，无需下载{'\n'}随时随地畅玩万古长夜
              </ThemedText>
              
              <TouchableOpacity
                style={[styles.connectButton, { backgroundColor: theme.primary }]}
                onPress={connectToCloud}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <FontAwesome6 name="play" size={16} color="#FFF" />
                    <ThemedText variant="smallMedium" color="#FFF" style={{ marginLeft: 8 }}>
                      开始游戏
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.gameCanvas}>
              {/* 这里渲染游戏画面 */}
              <View style={styles.gamePlaceholder}>
                <FontAwesome6 name="gamepad" size={64} color={theme.textMuted} />
                <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: 16 }}>
                  游戏画面加载中...
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* 底部控制栏 */}
        {connected && (
          <View style={styles.controlBar}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => sendAction('move', { direction: 'left' })}
            >
              <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.actionButton]}
              onPress={() => sendAction('attack')}
            >
              <FontAwesome6 name="hand-fist" size={20} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.controlButton, styles.actionButton, { backgroundColor: theme.accent }]}
              onPress={() => sendAction('skill')}
            >
              <FontAwesome6 name="wand-magic-sparkles" size={20} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => sendAction('move', { direction: 'right' })}
            >
              <FontAwesome6 name="arrow-right" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Screen>
  );
}
