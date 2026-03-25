/**
 * 免费动漫创作页面
 * 整合 LLM + 图像生成 + 视频生成 + 音频处理
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNSSE from 'react-native-sse';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 动漫风格配置
const ANIME_STYLES = [
  { id: 'japanese', name: '日式', icon: 'yin-yang', desc: '经典日漫风格' },
  { id: 'chinese', name: '国风', icon: 'yin-yang', desc: '中国风元素' },
  { id: 'korean', name: '韩式', icon: 'yin-yang', desc: '韩漫风格' },
  { id: 'western', name: '西式', icon: 'yin-yang', desc: '欧美动漫' },
];

// 创作结果接口
interface ConceptResult {
  title: string;
  synopsis: string;
  mainCharacters: string[];
  keyScenes: string[];
}

interface Character {
  name: string;
  role: string;
  appearance: string;
  personality: string;
  voiceType: string;
  portrait?: string;
}

interface Scene {
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  description: string;
  action: string;
  mood: string;
}

interface Episode {
  episodeNumber: number;
  title: string;
  summary: string;
  scenes: Scene[];
}

interface Story {
  title: string;
  synopsis: string;
  genre: string;
  themes: string[];
  episodes: Episode[];
}

interface CreationResult {
  story: Story;
  characters: Record<string, Character>;
  sceneImages: Record<string, string>;
  videos: Record<string, string>;
  audioClips: Record<string, string>;
}

export default function FreeAnimeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  
  // 输入状态
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('japanese');
  const [episodeCount, setEpisodeCount] = useState(2);
  const [generateImages, setGenerateImages] = useState(false);
  const [generateVideos, setGenerateVideos] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);
  
  // UI状态
  const [activeTab, setActiveTab] = useState<'concept' | 'story' | 'characters' | 'media'>('concept');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // 创作结果
  const [concept, setConcept] = useState<ConceptResult | null>(null);
  const [storyText, setStoryText] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [mediaList, setMediaList] = useState<{ type: string; url: string; label: string }[]>([]);
  
  // SSE连接
  const sseRef = useRef<any>(null);

  // 清理SSE连接
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  // 快速构思
  const handleQuickConcept = useCallback(async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入故事主题');
      return;
    }

    setIsGenerating(true);
    setLoadingText('正在构思创意...');
    setActiveTab('concept');

    try {
      /**
       * 服务端文件：server/src/routes/free-anime.ts
       * 接口：POST /api/v1/free-anime/concept
       * Body 参数：prompt: string, style?: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/free-anime/concept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            style: selectedStyle,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setConcept(data.data);
      } else {
        throw new Error(data.error || '生成失败');
      }
    } catch (error) {
      console.error('Quick concept error:', error);
      Alert.alert('错误', error instanceof Error ? error.message : '生成失败');
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  }, [prompt, selectedStyle]);

  // 流式生成故事
  const handleStreamStory = useCallback(async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入故事主题');
      return;
    }

    setIsGenerating(true);
    setLoadingText('正在生成故事...');
    setActiveTab('story');
    setStoryText('');

    try {
      // 使用 SSE 流式生成
      const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/free-anime/story/stream`;
      
      sseRef.current = new RNSSE(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          prompt,
          style: selectedStyle,
        }),
      });

      sseRef.current.addEventListener('message', (event: any) => {
        if (event.data === '[DONE]') {
          setIsGenerating(false);
          setLoadingText('');
          sseRef.current?.close();
          return;
        }

        try {
          const json = JSON.parse(event.data);
          if (json.content) {
            setStoryText(prev => prev + json.content);
          }
        } catch (e) {
          // 忽略解析错误
        }
      });

      sseRef.current.addEventListener('error', (error: any) => {
        console.error('SSE error:', error);
        setIsGenerating(false);
        setLoadingText('');
        
        // 降级到非流式请求
        fallbackToNonStreaming();
      });

    } catch (error) {
      console.error('Stream story error:', error);
      fallbackToNonStreaming();
    }
  }, [prompt, selectedStyle]);

  // 降级到非流式请求
  const fallbackToNonStreaming = async () => {
    try {
      /**
       * 服务端文件：server/src/index.ts
       * 接口：POST /api/v1/chat
       * Body 参数：message: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `请创作一个动漫故事，主题：${prompt}，风格：${selectedStyle === 'japanese' ? '日式动漫' : selectedStyle === 'chinese' ? '国风动漫' : '动漫'}`,
          }),
        }
      );

      const data = await response.json();

      if (data.content) {
        setStoryText(data.content);
      }
    } catch (error) {
      console.error('Fallback error:', error);
      Alert.alert('错误', '故事生成失败');
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  };

  // 完整创作
  const handleCreateFull = useCallback(async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入故事主题');
      return;
    }

    setIsGenerating(true);
    setLoadingText('正在进行完整创作...');
    setActiveTab('concept');

    try {
      /**
       * 服务端文件：server/src/routes/free-anime.ts
       * 接口：POST /api/v1/free-anime/create
       * Body 参数：prompt: string, style?: string, episodeCount?: number, generateImages?: boolean, generateVideos?: boolean, generateAudio?: boolean
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/free-anime/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            style: selectedStyle,
            episodeCount,
            generateImages,
            generateVideos,
            generateAudio,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const result: CreationResult = data.data;
        
        // 更新构思
        setConcept({
          title: result.story.title,
          synopsis: result.story.synopsis,
          mainCharacters: Object.keys(result.characters),
          keyScenes: result.story.episodes[0]?.scenes?.slice(0, 3).map(s => s.description) || [],
        });

        // 更新故事文本
        setStoryText(formatStory(result.story));

        // 更新角色列表
        setCharacters(Object.entries(result.characters).map(([charName, char]) => ({
          name: charName,
          role: char.role,
          appearance: char.appearance,
          personality: char.personality,
          voiceType: char.voiceType,
          portrait: char.portrait,
        })));

        // 更新媒体列表
        setMediaList(extractMediaList(result));

        Alert.alert('成功', '动漫创作完成！');
      } else {
        throw new Error(data.error || '创作失败');
      }
    } catch (error) {
      console.error('Full creation error:', error);
      Alert.alert('错误', error instanceof Error ? error.message : '创作失败');
    } finally {
      setIsGenerating(false);
      setLoadingText('');
    }
  }, [prompt, selectedStyle, episodeCount, generateImages, generateVideos, generateAudio]);

  // 格式化故事文本
  const formatStory = (story: Story): string => {
    let text = `《${story.title}》\n\n`;
    text += `【故事简介】\n${story.synopsis}\n\n`;
    
    for (const episode of story.episodes) {
      text += `【第${episode.episodeNumber}集：${episode.title}】\n`;
      text += `${episode.summary}\n\n`;
      
      for (const scene of episode.scenes) {
        text += `  场景${scene.sceneNumber}：${scene.location}（${scene.timeOfDay}）\n`;
        text += `  ${scene.description}\n\n`;
      }
    }

    return text;
  };

  // 提取媒体列表
  const extractMediaList = (result: CreationResult): { type: string; url: string; label: string }[] => {
    const list: { type: string; url: string; label: string }[] = [];

    // 场景图片
    for (const [key, url] of Object.entries(result.sceneImages)) {
      list.push({ type: 'image', url, label: `场景 ${key}` });
    }

    // 视频
    for (const [key, url] of Object.entries(result.videos)) {
      list.push({ type: 'video', url, label: `视频 ${key}` });
    }

    // 音频
    for (const [key, url] of Object.entries(result.audioClips)) {
      list.push({ type: 'audio', url, label: `配音 ${key}` });
    }

    return list;
  };

  // 渲染内容区
  const renderContent = () => {
    if (isGenerating) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="body" color={theme.textMuted} style={styles.loadingText}>
            {loadingText}
          </ThemedText>
        </View>
      );
    }

    switch (activeTab) {
      case 'concept':
        if (concept) {
          return (
            <ThemedView level="default" style={styles.resultContainer}>
              <ThemedText variant="h3" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                {concept.title}
              </ThemedText>
              <ThemedText variant="body" color={theme.textSecondary} style={{ marginBottom: Spacing.lg }}>
                {concept.synopsis}
              </ThemedText>
              
              <ThemedText variant="label" color={theme.primary} style={{ marginBottom: Spacing.sm }}>
                主要角色
              </ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg }}>
                {concept.mainCharacters.map((char, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: `${theme.primary}20`,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                    }}
                  >
                    <ThemedText variant="small" color={theme.primary}>{char}</ThemedText>
                  </View>
                ))}
              </View>

              <ThemedText variant="label" color={theme.primary} style={{ marginBottom: Spacing.sm }}>
                关键场景
              </ThemedText>
              {concept.keyScenes.map((scene, i) => (
                <ThemedText key={i} variant="body" color={theme.textSecondary} style={{ marginBottom: 4 }}>
                  {i + 1}. {scene}
                </ThemedText>
              ))}
            </ThemedView>
          );
        }
        return (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="wand-magic-sparkles" size={48} color={theme.textMuted} />
            <ThemedText variant="body" color={theme.textMuted}>
              点击「快速构思」开始创作
            </ThemedText>
          </View>
        );

      case 'story':
        if (storyText) {
          return (
            <ThemedView level="default" style={styles.resultContainer}>
              <ThemedText variant="body" color={theme.textSecondary} style={{ lineHeight: 28 }}>
                {storyText}
              </ThemedText>
            </ThemedView>
          );
        }
        return (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="book-open" size={48} color={theme.textMuted} />
            <ThemedText variant="body" color={theme.textMuted}>
              点击「生成故事」查看完整剧情
            </ThemedText>
          </View>
        );

      case 'characters':
        if (characters.length > 0) {
          return (
            <View style={styles.characterGrid}>
              {characters.map((char, i) => (
                <ThemedView key={i} level="default" style={styles.characterCard}>
                  {char.portrait ? (
                    <Image source={{ uri: char.portrait }} style={styles.characterImage} />
                  ) : (
                    <View style={[styles.characterImage, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 36, opacity: 0.3 }}>{char.name[0]}</Text>
                    </View>
                  )}
                  <View style={styles.characterInfo}>
                    <ThemedText variant="label" color={theme.textPrimary}>{char.name}</ThemedText>
                    <ThemedText variant="tiny" color={theme.primary}>{char.role}</ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted} numberOfLines={2}>
                      {char.appearance}
                    </ThemedText>
                  </View>
                </ThemedView>
              ))}
            </View>
          );
        }
        return (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="users" size={48} color={theme.textMuted} />
            <ThemedText variant="body" color={theme.textMuted}>
              完整创作后查看角色设计
            </ThemedText>
          </View>
        );

      case 'media':
        if (mediaList.length > 0) {
          return (
            <View style={styles.mediaGrid}>
              {mediaList.map((item, i) => (
                <View key={i} style={styles.mediaItem}>
                  {item.type === 'image' && (
                    <Image source={{ uri: item.url }} style={styles.mediaImage} />
                  )}
                  <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    padding: 6,
                  }}>
                    <ThemedText variant="tiny" color="#fff">{item.label}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          );
        }
        return (
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="film" size={48} color={theme.textMuted} />
            <ThemedText variant="body" color={theme.textMuted}>
              勾选高级选项生成媒体内容
            </ThemedText>
          </View>
        );
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            AI 动漫创作
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
            输入你的创意，AI帮你生成完整动漫
          </ThemedText>
        </View>

        {/* 风格选择 */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
            动漫风格
          </ThemedText>
          <View style={styles.styleGrid}>
            {ANIME_STYLES.map(style => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleOption,
                  selectedStyle === style.id && styles.styleOptionActive,
                ]}
                onPress={() => setSelectedStyle(style.id)}
              >
                <FontAwesome6 name={style.icon} size={28} color={theme.textSecondary} />
                <ThemedText variant="small" color={theme.textSecondary}>
                  {style.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 主题输入 */}
        <View style={styles.inputContainer}>
          <ThemedText variant="label" color={theme.textPrimary} style={styles.inputLabel}>
            故事主题
          </ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="例如：一个少年穿越到异世界，与精灵伙伴一起冒险的故事..."
            placeholderTextColor={theme.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* 高级选项 */}
        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => setGenerateImages(!generateImages)}
          >
            <View style={[styles.checkbox, generateImages && styles.checkboxChecked]}>
              {generateImages && (
                <FontAwesome6 name="check" size={12} color={theme.buttonPrimaryText} />
              )}
            </View>
            <ThemedText variant="small" color={theme.textSecondary}>生成场景图</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => setGenerateVideos(!generateVideos)}
          >
            <View style={[styles.checkbox, generateVideos && styles.checkboxChecked]}>
              {generateVideos && (
                <FontAwesome6 name="check" size={12} color={theme.buttonPrimaryText} />
              )}
            </View>
            <ThemedText variant="small" color={theme.textSecondary}>生成视频</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => setGenerateAudio(!generateAudio)}
          >
            <View style={[styles.checkbox, generateAudio && styles.checkboxChecked]}>
              {generateAudio && (
                <FontAwesome6 name="check" size={12} color={theme.buttonPrimaryText} />
              )}
            </View>
            <ThemedText variant="small" color={theme.textSecondary}>生成配音</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 操作按钮 */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={handleQuickConcept}
            disabled={isGenerating}
          >
            <FontAwesome6 name="lightbulb" size={18} color={theme.textPrimary} />
            <ThemedText variant="label" color={theme.textPrimary}>快速构思</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.backgroundDefault }]}
            onPress={handleStreamStory}
            disabled={isGenerating}
          >
            <FontAwesome6 name="book" size={18} color={theme.textPrimary} />
            <ThemedText variant="label" color={theme.textPrimary}>生成故事</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleCreateFull}
            disabled={isGenerating}
          >
            <FontAwesome6 name="clapperboard" size={18} color={theme.buttonPrimaryText} />
            <ThemedText variant="label" color={theme.buttonPrimaryText}>完整创作</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 标签页 */}
        <View style={{ flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.sm }}>
          {[
            { id: 'concept', label: '构思' },
            { id: 'story', label: '故事' },
            { id: 'characters', label: '角色' },
            { id: 'media', label: '媒体' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={{
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.lg,
                borderRadius: BorderRadius.full,
                backgroundColor: activeTab === tab.id ? theme.primary : theme.backgroundDefault,
              }}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <ThemedText
                variant="label"
                color={activeTab === tab.id ? theme.buttonPrimaryText : theme.textSecondary}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 内容区 */}
        {renderContent()}
      </ScrollView>
    </Screen>
  );
}
