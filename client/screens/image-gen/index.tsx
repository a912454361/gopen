import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Modal,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 图像模型接口
interface ImageModel {
  code: string;
  name: string;
  provider: string;
  providerName: string;
  pricing: { input: number; output: number; tier: string };
  description?: string;
}

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
  { id: '1024x1024', name: '1:1', width: 1024, height: 1024, desc: '方形' },
  { id: '1024x1792', name: '9:16', width: 1024, height: 1792, desc: '竖版' },
  { id: '1792x1024', name: '16:9', width: 1792, height: 1024, desc: '横版' },
];

// 示例提示词
const EXAMPLE_PROMPTS = [
  '一位身穿汉服的少女，站在桃花树下，花瓣飘落，唯美意境',
  '仙侠风格的山峰，云雾缭绕，仙鹤飞过，金色阳光',
  '古风城池夜景，灯火辉煌，烟花绽放，繁华盛世',
  '国风热血战斗场景，剑气纵横，火焰环绕，气势磅礴',
];

// 提供商颜色
const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  stability: '#9333EA',
  zhipu: '#1A73E8',
  qwen: '#FF6A00',
};

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  model: string;
  createdAt: string;
}

export default function ImageGenScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember, isSuperMember } = useMembership();
  const router = useSafeRouter();

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('guofeng');
  const [selectedSize, setSelectedSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 模型选择
  const [availableModels, setAvailableModels] = useState<ImageModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ImageModel | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 获取用户ID和模型列表
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
    fetchImageModels();
  }, []);

  // 页面获得焦点时刷新模型
  useFocusEffect(
    useCallback(() => {
      loadSelectedModel();
    }, [])
  );

  /**
   * 获取图像模型列表
   * 服务端文件：server/src/routes/ai-gateway.ts
   * 接口：GET /api/v1/ai/models?type=image
   */
  const fetchImageModels = async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/models?type=image`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setAvailableModels(data.data);
        // 默认选择第一个可用模型
        if (data.data.length > 0) {
          loadSelectedModel(data.data);
        }
      }
    } catch (error) {
      console.error('Fetch image models error:', error);
    }
  };

  // 加载用户选择的模型
  const loadSelectedModel = async (models?: ImageModel[]) => {
    try {
      const saved = await AsyncStorage.getItem('selectedImageModel');
      if (saved) {
        const model = JSON.parse(saved);
        setSelectedModel(model);
      } else if (models && models.length > 0) {
        // 默认选择第一个模型
        setSelectedModel(models[0]);
      }
    } catch (error) {
      console.error('Load selected image model error:', error);
    }
  };

  // 选择模型
  const handleSelectModel = (model: ImageModel) => {
    // 检查权限
    if (model.pricing.tier === 'enterprise' && !isSuperMember) {
      Alert.alert(
        '需要超级会员',
        '该模型需要超级会员才能使用',
        [
          { text: '取消', style: 'cancel' },
          { text: '升级会员', onPress: () => router.push('/membership') },
        ]
      );
      return;
    }
    if (model.pricing.tier === 'premium' && !isMember) {
      Alert.alert(
        '需要会员',
        '该模型需要普通会员才能使用',
        [
          { text: '取消', style: 'cancel' },
          { text: '升级会员', onPress: () => router.push('/membership') },
        ]
      );
      return;
    }
    
    setSelectedModel(model);
    AsyncStorage.setItem('selectedImageModel', JSON.stringify(model));
    setShowModelPicker(false);
  };

  // 检查模型权限
  const checkModelAccess = (): boolean => {
    if (!selectedModel) {
      Alert.alert('提示', '请先选择一个图像模型');
      return false;
    }
    if (selectedModel.pricing.tier === 'enterprise' && !isSuperMember) {
      Alert.alert('需要超级会员', '当前模型需要超级会员才能使用', [
        { text: '取消', style: 'cancel' },
        { text: '升级会员', onPress: () => router.push('/membership') },
      ]);
      return false;
    }
    if (selectedModel.pricing.tier === 'premium' && !isMember) {
      Alert.alert('需要会员', '当前模型需要普通会员才能使用', [
        { text: '取消', style: 'cancel' },
        { text: '升级会员', onPress: () => router.push('/membership') },
      ]);
      return false;
    }
    return true;
  };

  // 生成图像
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入创作描述');
      return;
    }

    if (!checkModelAccess()) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const styleInfo = IMAGE_STYLES.find(s => s.id === selectedStyle);
      
      // 构建增强后的提示词
      const enhancedPrompt = `${styleInfo?.name || ''}风格：${prompt.trim()}`;

      /**
       * 服务端文件：server/src/routes/ai-gateway.ts
       * 接口：POST /api/v1/ai/image
       * Body 参数：userId: string, model: string, prompt: string, size: string, n: number, quality: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 'anonymous',
          model: selectedModel?.code,
          prompt: enhancedPrompt,
          size: selectedSize,
          n: 1,
          quality: 'standard',
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // 根据不同模型处理返回数据
        const imageUrl = result.data.url || 
                        result.data.data?.[0]?.url || 
                        result.data.image_url;
        
        if (imageUrl) {
          const newImage = {
            id: Date.now().toString(),
            url: imageUrl,
            prompt: prompt.trim(),
            style: selectedStyle,
            model: selectedModel?.name || 'unknown',
            createdAt: new Date().toISOString(),
          };
          setGeneratedImage(newImage);
          
          // 自动保存到作品库
          autoSaveToWorks(newImage, selectedStyle);
        } else {
          throw new Error('未获取到图像URL');
        }
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (error) {
      console.error('Generate image error:', error);
      Alert.alert('生成失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedStyle, selectedSize, selectedModel, userId]);

  // 自动保存到作品库
  const autoSaveToWorks = async (image: GeneratedImage, style: string) => {
    if (!userId || !image) return;
    
    try {
      const styleName = IMAGE_STYLES.find(s => s.id === style)?.name || style;
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_title: `AI图像 - ${styleName}`,
          project_type: 'AI图像生成',
          service_type: 'image-gen',
          service_name: `${image.model}图像创作`,
          content: image.prompt,
          content_type: 'image',
          image_url: image.url,
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Image auto-saved to works');
      }
    } catch (error) {
      console.error('Auto save image error:', error);
    }
  };

  // 保存到相册
  const handleSaveToGallery = useCallback(async () => {
    if (!generatedImage) return;

    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要相册权限才能保存图片');
        return;
      }

      const localUri = `${(FileSystem as any).documentDirectory}image_${Date.now()}.jpg`;
      const downloadResult = await (FileSystem as any).downloadAsync(generatedImage.url, localUri);
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
      const styleName = IMAGE_STYLES.find(s => s.id === selectedStyle)?.name || selectedStyle;

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_title: `AI图像 - ${styleName}`,
          project_type: 'AI图像生成',
          service_type: 'image-gen',
          service_name: `${generatedImage.model}图像创作`,
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
  }, [generatedImage, selectedStyle, userId, router]);

  const handleUseExample = (example: string) => {
    setPrompt(example);
  };

  const providerColor = selectedModel ? (PROVIDER_COLORS[selectedModel.provider] || theme.primary) : theme.primary;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* 模型选择Modal */}
      <Modal visible={showModelPicker} transparent animationType="slide" onRequestClose={() => setShowModelPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>选择图像模型</ThemedText>
              <TouchableOpacity onPress={() => setShowModelPicker(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {availableModels.map((model) => {
                const color = PROVIDER_COLORS[model.provider] || theme.primary;
                const isSelected = selectedModel?.code === model.code;
                const isLocked = (model.pricing.tier === 'enterprise' && !isSuperMember) ||
                                (model.pricing.tier === 'premium' && !isMember);
                
                return (
                  <TouchableOpacity
                    key={model.code}
                    style={[
                      styles.modelPickerItem,
                      { borderColor: isSelected ? color : theme.border, borderWidth: isSelected ? 2 : 1 },
                    ]}
                    onPress={() => handleSelectModel(model)}
                    disabled={isLocked}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.modelPickerIcon, { backgroundColor: color + '20' }]}>
                        <FontAwesome6 name="image" size={16} color={color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ThemedText variant="smallMedium" color={theme.textPrimary}>{model.name}</ThemedText>
                          {model.pricing.tier === 'free' && (
                            <View style={[styles.tierBadge, { backgroundColor: theme.success + '20' }]}>
                              <Text style={{ color: theme.success, fontSize: 10 }}>免费</Text>
                            </View>
                          )}
                          {model.pricing.tier === 'premium' && (
                            <View style={[styles.tierBadge, { backgroundColor: '#D9770620' }]}>
                              <Text style={{ color: '#D97706', fontSize: 10 }}>会员</Text>
                            </View>
                          )}
                          {model.pricing.tier === 'enterprise' && (
                            <View style={[styles.tierBadge, { backgroundColor: '#7C3AED20' }]}>
                              <Text style={{ color: '#7C3AED', fontSize: 10 }}>超级会员</Text>
                            </View>
                          )}
                        </View>
                        <ThemedText variant="caption" color={theme.textMuted}>{model.providerName}</ThemedText>
                      </View>
                      {isLocked && <FontAwesome6 name="lock" size={14} color={theme.textMuted} />}
                      {isSelected && !isLocked && <FontAwesome6 name="check" size={16} color={color} />}
                    </View>
                    <View style={{ marginTop: 8 }}>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        约 ¥{(model.pricing.input / 100).toFixed(2)}/张
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/models')}
            >
              <FontAwesome6 name="grip" size={14} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText variant="label" color="#fff">查看全部模型</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

          {/* 模型选择器 */}
          <TouchableOpacity 
            style={[styles.modelSelector, { borderColor: providerColor }]}
            onPress={() => setShowModelPicker(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.modelSelectorIcon, { backgroundColor: providerColor + '20' }]}>
                <FontAwesome6 name="image" size={16} color={providerColor} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {selectedModel?.name || '选择模型'}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {selectedModel?.providerName || '点击选择'}
                </ThemedText>
              </View>
            </View>
            <FontAwesome6 name="chevron-down" size={14} color={theme.textMuted} />
          </TouchableOpacity>

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
            style={[styles.generateButton, (!prompt.trim() || !selectedModel) && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !selectedModel}
          >
            <LinearGradient
              colors={prompt.trim() && selectedModel ? [theme.primary, theme.accent] : ['#374151', '#4B5563']}
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

          {/* 价格提示 */}
          {selectedModel && (
            <View style={styles.priceHint}>
              <FontAwesome6 name="circle-info" size={12} color={theme.textMuted} />
              <ThemedText variant="caption" color={theme.textMuted}>
                预计消费：约 ¥{(selectedModel.pricing.input / 100).toFixed(2)}/张
              </ThemedText>
            </View>
          )}

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
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      {IMAGE_STYLES.find(s => s.id === generatedImage.style)?.name}
                    </ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      | {generatedImage.model}
                    </ThemedText>
                  </View>
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
