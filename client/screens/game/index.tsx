/**
 * 游戏页面 - 《剑破苍穹》互动剧情
 * 
 * 功能：
 * - 视频场景播放
 * - 剧情文本展示
 * - 玩家选择交互
 * - 角色属性追踪
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 类型定义
interface Choice {
  text: string;
  next_node: string;
  effect?: Record<string, number>;
}

interface StoryNode {
  id: string;
  node_id: string;
  episode: number;
  title: string;
  description: string;
  video_prompt?: string;
  video_url?: string;
  video_duration?: number;
  choices: Choice[];
  is_start: boolean;
  is_ending: boolean;
  ending_type?: 'good' | 'normal' | 'bad';
}

interface GameSave {
  id: string;
  current_node: string;
  current_episode: number;
  choices_made: Array<{
    from: string;
    to: string;
    choice: string;
    timestamp: string;
  }>;
  stats: Record<string, number>;
}

// 预置视频URL（使用已生成的动漫视频）
const PRESET_VIDEOS: Record<string, string> = {
  'start': 'https://picsum.photos/seed/sword-cloud/800/450',
  'follow_light': 'https://picsum.photos/seed/young-hero/800/450',
  'check_jade': 'https://picsum.photos/seed/sword-soul/800/450',
  'touch_sword': 'https://picsum.photos/seed/sword-merge/800/450',
  'power_awaken': 'https://picsum.photos/seed/power-awaken/800/450',
};

export default function GameScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 状态
  const [loading, setLoading] = useState(true);
  const [storyId] = useState('jianpo');
  const [playerId, setPlayerId] = useState<string>('');
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
  const [save, setSave] = useState<GameSave | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  
  // expo-video 播放器
  const player = useVideoPlayer(currentVideoUrl, (p) => {
    p.loop = true;
    p.muted = true;
  });
  
  // 当视频URL变化时自动播放
  useEffect(() => {
    if (currentVideoUrl && player) {
      player.play();
    }
  }, [currentVideoUrl, player]);

  // 初始化
  useEffect(() => {
    initGame();
  }, []);

  const initGame = async () => {
    try {
      // 获取或创建玩家ID
      let storedPlayerId = await AsyncStorage.getItem('game_player_id');
      if (!storedPlayerId) {
        storedPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('game_player_id', storedPlayerId);
      }
      setPlayerId(storedPlayerId);

      // 检查存档
      /**
       * 服务端文件：server/src/routes/game.ts
       * 接口：GET /api/v1/game/save/:playerId/:storyId
       */
      const saveResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game/save/${storedPlayerId}/${storyId}`
      );
      const saveData = await saveResponse.json();
      
      if (saveData.save) {
        setSave(saveData.save);
        setStats(saveData.save.stats || {});
        
        // 加载当前节点
        await loadNode(saveData.save.current_node);
      } else {
        // 新游戏，加载起始节点
        await loadNode('start');
      }
    } catch (error) {
      console.error('初始化游戏失败:', error);
      // 使用默认节点
      loadNode('start');
    } finally {
      setLoading(false);
    }
  };

  const loadNode = async (nodeId: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/game.ts
       * 接口：GET /api/v1/game/node/:storyId/:nodeId
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game/node/${storyId}/${nodeId}`
      );
      const data = await response.json();
      
      if (data.node) {
        setCurrentNode(data.node);
        setSelectedChoice(null);
      }
    } catch (error) {
      console.error('加载节点失败:', error);
    }
  };

  const handleChoice = async (choiceIndex: number) => {
    if (!currentNode || !playerId) return;
    
    const choice = currentNode.choices[choiceIndex];
    if (!choice) return;

    setSelectedChoice(choiceIndex);
    setVideoLoading(true);

    try {
      /**
       * 服务端文件：server/src/routes/game.ts
       * 接口：POST /api/v1/game/choose
       * Body 参数：playerId: string, storyId: string, nodeId: string, choiceIndex: number
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game/choose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          storyId,
          nodeId: currentNode.node_id,
          choiceIndex,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.nextNode) {
        // 更新属性
        if (data.effects) {
          setStats(prev => ({
            ...prev,
            ...Object.entries(data.effects).reduce((acc, [key, value]) => ({
              ...acc,
              [key]: (prev[key] || 0) + (value as number),
            }), {}),
          }));
        }
        
        // 加载下一个节点
        setTimeout(() => {
          setCurrentNode(data.nextNode);
          setSelectedChoice(null);
          setVideoLoading(false);
        }, 500);
      }
    } catch (error) {
      console.error('选择处理失败:', error);
      setVideoLoading(false);
      Alert.alert('错误', '处理选择时出错，请重试');
    }
  };

  const handleRestart = async () => {
    try {
      await AsyncStorage.removeItem('game_player_id');
      const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('game_player_id', newPlayerId);
      setPlayerId(newPlayerId);
      setStats({});
      setSave(null);
      loadNode('start');
    } catch (error) {
      console.error('重新开始失败:', error);
    }
  };

  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={styles.loadingText}>正在进入游戏...</ThemedText>
        </View>
      </Screen>
    );
  }

  // 无数据
  if (!currentNode) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ThemedText>无法加载游戏内容</ThemedText>
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <ThemedText style={styles.restartText}>重新开始</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // 结局页面
  if (currentNode.is_ending) {
    const endingStyles = {
      good: styles.goodEnding,
      normal: styles.normalEnding,
      bad: styles.badEnding,
    };
    const endingLabels = {
      good: '完美结局',
      normal: '普通结局',
      bad: '悲剧结局',
    };

    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ScrollView contentContainerStyle={styles.endingContainer}>
          <ThemedText variant="h2" style={styles.endingTitle}>
            {currentNode.title}
          </ThemedText>
          
          <View style={[styles.endingBadge, endingStyles[currentNode.ending_type || 'normal']]}>
            <ThemedText style={styles.endingText}>
              {endingLabels[currentNode.ending_type || 'normal']}
            </ThemedText>
          </View>
          
          <ThemedText color={theme.textSecondary} style={{ textAlign: 'center' }}>
            {currentNode.description}
          </ThemedText>
          
          {/* 最终属性 */}
          <View style={styles.statsContainer}>
            {Object.entries(stats).map(([key, value]) => (
              <View key={key} style={styles.statBadge}>
                <ThemedText style={styles.statLabel}>{key}</ThemedText>
                <ThemedText style={styles.statValue}>{value}</ThemedText>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <ThemedText style={styles.restartText}>重新开始</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    );
  }

  // 主游戏界面
  const videoUrl = currentNode.video_url || PRESET_VIDEOS[currentNode.node_id];
  
  // 更新视频URL
  useEffect(() => {
    if (videoUrl) {
      setCurrentVideoUrl(videoUrl);
    }
  }, [videoUrl]);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView style={styles.container}>
        {/* 视频区域 */}
        <View style={styles.videoContainer}>
          {currentVideoUrl ? (
            Platform.OS === 'web' ? (
              <video
                src={currentVideoUrl}
                style={{ width: '100%', height: 'auto' }}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <VideoView
                player={player}
                style={styles.video}
                nativeControls={false}
                contentFit="contain"
              />
            )
          ) : (
            <View style={styles.videoPlaceholder}>
              <FontAwesome6 name="film" size={48} color={theme.textMuted} />
              <ThemedText color={theme.textMuted} style={{ marginTop: 12 }}>
                {currentNode.video_prompt ? '视频生成中...' : '暂无视频'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* 剧情内容 */}
        <View style={styles.contentContainer}>
          {/* 章节标签 */}
          <View style={styles.episodeBadge}>
            <ThemedText style={styles.episodeText}>
              第 {currentNode.episode} 章
            </ThemedText>
          </View>

          {/* 节点标题 */}
          <ThemedView level="root" style={styles.nodeTitle}>
            <ThemedText variant="h2" color={theme.textPrimary}>
              {currentNode.title}
            </ThemedText>
          </ThemedView>

          {/* 剧情描述 */}
          <View style={styles.descriptionContainer}>
            <ThemedText color={theme.textSecondary} style={styles.descriptionText}>
              {currentNode.description}
            </ThemedText>
          </View>

          {/* 选择按钮 */}
          {currentNode.choices && currentNode.choices.length > 0 && (
            <View style={styles.choicesContainer}>
              <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: 12 }}>
                你的选择：
              </ThemedText>
              
              {currentNode.choices.map((choice, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.choiceButton,
                    selectedChoice === index && styles.choiceButtonPressed,
                  ]}
                  onPress={() => handleChoice(index)}
                  disabled={videoLoading}
                  activeOpacity={0.7}
                >
                  <View style={styles.choiceIcon}>
                    <ThemedText style={styles.choiceIconText}>
                      {String.fromCharCode(65 + index)}
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={[
                      styles.choiceText,
                      selectedChoice === index && styles.choiceTextActive,
                    ]}
                    color={selectedChoice === index ? theme.buttonPrimaryText : theme.textPrimary}
                  >
                    {choice.text}
                  </ThemedText>
                  {videoLoading && selectedChoice === index && (
                    <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 属性面板 */}
          {Object.keys(stats).length > 0 && (
            <View style={styles.statsContainer}>
              <ThemedText variant="caption" color={theme.textMuted}>
                角色属性
              </ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {Object.entries(stats).map(([key, value]) => (
                  <View key={key} style={styles.statBadge}>
                    <ThemedText style={styles.statLabel}>{key}</ThemedText>
                    <ThemedText style={styles.statValue}>{value}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 特权入口：UE5 引擎创作 */}
          <TouchableOpacity
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 16,
              backgroundColor: `${theme.primary}10`,
              borderWidth: 1,
              borderColor: `${theme.primary}30`,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
            onPress={() => router.push('/ue-engine')}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FontAwesome6 name="wand-magic-sparkles" size={20} color={theme.buttonPrimaryText} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="label" color={theme.primary}>UE 5.7.4 引擎创作</ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>多模型协同 · 80GB GPU · 特权用户专属</ThemedText>
            </View>
            <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          {/* 24小时极速制作入口 */}
          <TouchableOpacity
            style={{
              marginTop: 12,
              padding: 16,
              borderRadius: 16,
              backgroundColor: '#F59E0B10',
              borderWidth: 1,
              borderColor: '#F59E0B30',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
            onPress={() => router.push('/one-day-production')}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#F59E0B',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FontAwesome6 name="rocket" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="label" color="#F59E0B">24小时极速制作</ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>一天完成80集动漫 · AI全流程自动化</ThemedText>
            </View>
            <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
