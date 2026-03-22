import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 图像风格配置
const IMAGE_STYLES = [
  { id: 'guofeng', name: '古风', icon: 'pagoda', color: '#8B5CF6', desc: '水墨丹青，意境悠远' },
  { id: 'xianxia', name: '仙侠', icon: 'cloud', color: '#06B6D4', desc: '仙气飘渺，超凡脱俗' },
  { id: 'weimei', name: '唯美', icon: 'leaf', color: '#EC4899', desc: '梦幻唯美，诗意盎然' },
  { id: 'anime', name: '动漫', icon: 'wand-magic-sparkles', color: '#F59E0B', desc: '日系动漫，色彩明快' },
  { id: 'game', name: '游戏', icon: 'gamepad', color: '#10B981', desc: '游戏场景，震撼视觉' },
  { id: 'cyberpunk', name: '赛博', icon: 'microchip', color: '#00F0FF', desc: '霓虹科技，未来感强' },
];

// 图像尺寸配置
const IMAGE_SIZES = [
  { id: 'square', name: '1:1', width: 512, height: 512, desc: '方形' },
  { id: 'portrait', name: '3:4', width: 512, height: 682, desc: '竖版' },
  { id: 'landscape', name: '4:3', width: 682, height: 512, desc: '横版' },
];

// 示例提示词
const EXAMPLE_PROMPTS = [
  '一位身穿汉服的少女，站在桃花树下，花瓣飘落，唯美意境',
  '仙侠风格的山峰，云雾缭绕，仙鹤飞过，金色阳光',
  '古风城池夜景，灯火辉煌，烟花绽放，繁华盛世',
  '国风热血战斗场景，剑气纵横，火焰环绕，气势磅礴',
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: string;
}

export default function ImageGenScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember } = useMembership();
  const router = useSafeRouter();

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('guofeng');
  const [selectedSize, setSelectedSize] = useState('square');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 生成图像
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入创作描述');
      return;
    }

    // 会员检查
    if (!isMember) {
      Alert.alert(
        '会员专享',
        'AI图像生成功能仅限会员使用，升级会员解锁更多创作能力',
        [
          { text: '稍后再说', style: 'cancel' },
          { text: '升级会员', onPress: () => router.push('/membership') },
        ]
      );
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const userId = await AsyncStorage.getItem('userId');
      const sizeConfig = IMAGE_SIZES.find(s => s.id === selectedSize);

      /**
       * 服务端文件：server/src/routes/image-gen.ts
       * 接口：POST /api/v1/image-gen/generate
       * Body 参数：prompt: string, style: string, width: number, height: number, user_id: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/image-gen/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          width: sizeConfig?.width || 512,
          height: sizeConfig?.height || 512,
          user_id: userId,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.image_url) {
        setGeneratedImage({
          id: result.data.id || Date.now().toString(),
          url: result.data.image_url,
          prompt: prompt.trim(),
          style: selectedStyle,
          createdAt: new Date().toISOString(),
        });
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (error) {
      console.error('Generate image error:', error);
      Alert.alert('生成失败', '请稍后重试，或检查网络连接');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedStyle, selectedSize, isMember, router]);

  // 保存到相册
  const handleSaveToGallery = useCallback(async () => {
    if (!generatedImage) return;

    setIsSaving(true);
    try {
      // 请求相册权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能保存图片');
        return;
      }

      // 下载图片到本地
      const localUri = `${(FileSystem as any).documentDirectory}image_${Date.now()}.jpg`;
      const downloadResult = await (FileSystem as any).downloadAsync(generatedImage.url, localUri);

      // 保存到相册
      await MediaLibrary.createAssetAsync(downloadResult.uri);

      Alert.alert('保存成功', '图片已保存到相册');
    } catch (error) {
      console.error('Save to gallery error:', error);
      Alert.alert('保存失败', '请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }, [generatedImage]);

  // 保存到作品库
  const handleSaveToWorks = useCallback(async () => {
    if (!generatedImage) return;

    setIsSaving(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const styleName = IMAGE_STYLES.find(s => s.id === selectedStyle)?.name || selectedStyle;

      /**
       * 服务端文件：server/src/routes/works.ts
       * 接口：POST /api/v1/works
       * Body 参数：user_id: string, project_title: string, project_type: string, content: string, content_type: string, image_url: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_title: `AI图像 - ${styleName}`,
          project_type: 'AI图像生成',
          service_type: 'image-gen',
          service_name: 'AI图像创作',
          content: generatedImage.prompt,
          content_type: 'image',
          image_url: generatedImage.url,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('保存成功', '作品已保存到「我的作品」', [
          { text: '继续创作', style: 'default' },
          { text: '查看作品', onPress: () => router.push('/my-works') },
        ]);
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Save to works error:', error);
      Alert.alert('保存失败', '请稍后重试');
    } finally {
      setIsSaving(false);
    }
  }, [generatedImage, selectedStyle, router]);

  // 使用示例提示词
  const handleUseExample = (example: string) => {
    setPrompt(example);
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerIcon}>
                <FontAwesome6 name="image" size={24} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText variant="h3" color={theme.textPrimary}>AI 图像创作</ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  描述你的创意，AI 为你生成精美图像
                </ThemedText>
              </View>
            </View>
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.neonLine}
            />
          </View>

          {/* 会员提示 */}
          {!isMember && (
            <View style={[styles.memberTip, { backgroundColor: theme.backgroundTertiary, borderColor: theme.border }]}>
              <FontAwesome6 name="crown" size={16} color={theme.primary} />
              <ThemedText variant="small" color={theme.textSecondary} style={{ flex: 1, marginLeft: 8 }}>
                AI图像生成功能仅限会员使用
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/membership')}>
                <ThemedText variant="smallMedium" color={theme.primary}>升级</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* 输入区域 */}
          <View style={styles.inputSection}>
            <ThemedText variant="label" color={theme.textMuted}>创作描述</ThemedText>
            <View style={[styles.inputWrap, { borderColor: theme.primary, backgroundColor: theme.backgroundTertiary }]}>
              <TextInput
                style={styles.promptInput}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="描述你想要生成的图像..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.inputActions}>
                <TouchableOpacity onPress={() => setPrompt('')}>
                  <FontAwesome6 name="xmark" size={14} color={theme.textMuted} />
                </TouchableOpacity>
                <ThemedText variant="tiny" color={theme.textMuted}>{prompt.length}/500</ThemedText>
              </View>
            </View>
          </View>

          {/* 示例提示词 */}
          <View style={styles.examplesSection}>
            <ThemedText variant="labelSmall" color={theme.textMuted}>快速选择示例</ThemedText>
            <View style={styles.examplesScrollWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examplesScroll}>
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.exampleChip, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}
                    onPress={() => handleUseExample(example)}
                  >
                    <ThemedText variant="small" color={theme.textSecondary} numberOfLines={1}>
                      {example.slice(0, 20)}...
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* 风格选择 */}
          <View style={styles.styleSection}>
            <ThemedText variant="label" color={theme.textMuted}>选择风格</ThemedText>
            <View style={styles.styleGrid}>
              {IMAGE_STYLES.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleCard,
                    selectedStyle === style.id && { borderColor: style.color, shadowColor: style.color },
                  ]}
                  onPress={() => setSelectedStyle(style.id)}
                >
                  <View style={[styles.styleIcon, { backgroundColor: `${style.color}20` }]}>
                    <FontAwesome6 name={style.icon as any} size={20} color={style.color} />
                  </View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>{style.name}</ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>{style.desc}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 尺寸选择 */}
          <View style={styles.sizeSection}>
            <ThemedText variant="label" color={theme.textMuted}>图像尺寸</ThemedText>
            <View style={styles.sizeOptions}>
              {IMAGE_SIZES.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  style={[
                    styles.sizeOption,
                    selectedSize === size.id && { borderColor: theme.primary, backgroundColor: `${theme.primary}10` },
                    { borderColor: theme.border },
                  ]}
                  onPress={() => setSelectedSize(size.id)}
                >
                  <ThemedText variant="smallMedium" color={selectedSize === size.id ? theme.primary : theme.textPrimary}>
                    {size.name}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>{size.desc}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 生成按钮 */}
          <TouchableOpacity
            style={[styles.generateButton, !prompt.trim() && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
          >
            <LinearGradient
              colors={prompt.trim() ? [theme.primary, theme.accent] : ['#374151', '#4B5563']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateButtonGradient}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome6 name="wand-magic-sparkles" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <ThemedText variant="label" color="#fff">开始生成</ThemedText>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* 生成结果 */}
          {generatedImage && (
            <View style={styles.resultSection}>
              <ThemedText variant="label" color={theme.textMuted}>生成结果</ThemedText>
              <View style={[styles.resultCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.primary }]}>
                <Image
                  source={{ uri: generatedImage.url }}
                  style={styles.resultImage}
                  resizeMode="cover"
                />
                <View style={styles.resultInfo}>
                  <ThemedText variant="small" color={theme.textPrimary} numberOfLines={2}>
                    {generatedImage.prompt}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    {IMAGE_STYLES.find(s => s.id === generatedImage.style)?.name || generatedImage.style}
                  </ThemedText>
                </View>
                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: theme.primary }]}
                    onPress={handleSaveToGallery}
                    disabled={isSaving}
                  >
                    <FontAwesome6 name="download" size={14} color={theme.primary} />
                    <ThemedText variant="captionMedium" color={theme.primary}>保存相册</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: theme.success }]}
                    onPress={handleSaveToWorks}
                    disabled={isSaving}
                  >
                    <FontAwesome6 name="bookmark" size={14} color={theme.success} />
                    <ThemedText variant="captionMedium" color={theme.success}>保存作品</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
