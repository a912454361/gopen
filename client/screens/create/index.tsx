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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 创作类型配置
const CREATE_TYPES = [
  { 
    id: 'chat', 
    name: 'AI对话', 
    icon: 'message', 
    color: '#8B5CF6', 
    desc: '智能对话，创意无限',
    category: 'chat' 
  },
  { 
    id: 'image', 
    name: '图像生成', 
    icon: 'image', 
    color: '#EC4899', 
    desc: '文字转图，想象成真',
    category: 'image' 
  },
  { 
    id: 'audio', 
    name: '语音转写', 
    icon: 'microphone', 
    color: '#06B6D4', 
    desc: '语音识别，高效转录',
    category: 'audio' 
  },
  { 
    id: 'video', 
    name: '视频生成', 
    icon: 'video', 
    color: '#F59E0B', 
    desc: 'AI生成，创意无限',
    category: 'video' 
  },
];

// 模型配置
interface Model {
  id: string;
  code: string;
  name: string;
  provider: string;
  category: string;
  inputPrice: string;
  outputPrice: string;
  is_free: boolean;
  member_only: boolean;
  super_member_only: boolean;
  max_tokens: number;
  description?: string;
}

interface GeneratedResult {
  type: 'text' | 'image' | 'audio' | 'video';
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  model: string;
  prompt: string;
  createdAt: string;
  duration?: number;
  gPointsCost?: number;
}

// 视频生成配置
const VIDEO_DURATIONS = [
  { value: 30, label: '30秒', gPoints: 30 },
  { value: 120, label: '2分钟', gPoints: 120 },
  { value: 300, label: '5分钟', gPoints: 300 },
];

export default function CreateScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember, isSuperMember } = useMembership();
  const router = useSafeRouter();

  // 状态
  const [activeType, setActiveType] = useState('chat');
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  
  // 视频生成状态
  const [videoDuration, setVideoDuration] = useState(30);
  const [gPointsBalance, setGPointsBalance] = useState(0);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  // 获取用户ID
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  // 获取G点余额
  const fetchGPointsBalance = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/g-points/${userId}`
      );
      const data = await response.json();
      if (data.success) {
        setGPointsBalance(data.data.gPoints);
      }
    } catch (error) {
      console.error('Fetch G-points error:', error);
    }
  }, [userId]);

  // 获取G点余额
  useEffect(() => {
    if (userId) {
      fetchGPointsBalance();
    }
  }, [userId, fetchGPointsBalance]);

  // 获取模型列表
  useEffect(() => {
    fetchModels(activeType);
  }, [activeType]);

  const fetchModels = async (type: string) => {
    setLoadingModels(true);
    try {
      const category = CREATE_TYPES.find(t => t.id === type)?.category || 'chat';
      /**
       * 服务端文件：server/src/routes/models.ts
       * 接口：GET /api/v1/models
       * Query 参数：category?: string, provider?: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/models?category=${category}`
      );
      const data = await response.json();

      if (data.success) {
        setModels(data.data || []);
        // 默认选择第一个可用模型
        if (data.data?.length > 0 && !selectedModel) {
          setSelectedModel(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Fetch models error:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // 切换创作类型
  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setSelectedModel(null);
    setResult(null);
    setPrompt('');
  };

  // 检查模型权限
  const checkModelPermission = (model: Model): boolean => {
    if (model.is_free) return true;
    if (model.super_member_only && !isSuperMember) return false;
    if (model.member_only && !isMember) return false;
    return true;
  };

  // 生成内容
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入创作内容');
      return;
    }

    if (!selectedModel) {
      Alert.alert('提示', '请先选择模型');
      return;
    }

    if (!checkModelPermission(selectedModel)) {
      Alert.alert(
        '权限不足',
        selectedModel.super_member_only 
          ? '该模型仅限超级会员使用' 
          : '该模型需要会员权限',
        [
          { text: '取消', style: 'cancel' },
          { text: '升级会员', onPress: () => router.push('/membership') },
        ]
      );
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      if (activeType === 'chat') {
        // AI对话
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/chat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              model: selectedModel.code,
              messages: [{ role: 'user', content: prompt }],
              stream: false,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          setResult({
            type: 'text',
            content: data.data.content,
            model: selectedModel.name,
            prompt: prompt,
            createdAt: new Date().toISOString(),
          });
        } else {
          throw new Error(data.error || '生成失败');
        }
      } else if (activeType === 'image') {
        // 图像生成
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/image-gen/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompt,
              style: 'auto',
              width: 512,
              height: 512,
              user_id: userId,
            }),
          }
        );

        const data = await response.json();

        if (data.success && data.data?.image_url) {
          setResult({
            type: 'image',
            content: prompt,
            imageUrl: data.data.image_url,
            model: selectedModel.name,
            prompt: prompt,
            createdAt: new Date().toISOString(),
          });
        } else {
          throw new Error(data.error || '图像生成失败');
        }
      } else if (activeType === 'video') {
        // 视频生成
        // 计算所需G点
        const durationConfig = VIDEO_DURATIONS.find(d => d.value === videoDuration);
        const requiredGPoints = durationConfig?.gPoints || 30;
        
        // 检查G点余额
        if (gPointsBalance < requiredGPoints) {
          Alert.alert(
            'G点不足',
            `生成${durationConfig?.label}视频需要${requiredGPoints}G点，当前余额${gPointsBalance}G点`,
            [
              { text: '取消', style: 'cancel' },
              { text: '充值G点', onPress: () => setShowRechargeModal(true) },
            ]
          );
          setIsGenerating(false);
          return;
        }
        
        // 扣除G点
        const deductResponse = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/g-points/deduct`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              gPoints: requiredGPoints,
              description: `生成${durationConfig?.label}视频`,
              relatedType: 'video_generation',
            }),
          }
        );
        
        const deductData = await deductResponse.json();
        
        if (!deductData.success) {
          throw new Error(deductData.error || 'G点扣除失败');
        }
        
        // 更新G点余额
        setGPointsBalance(deductData.data.balanceAfter);
        
        // 调用视频生成API
        const videoResponse = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/video/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompt,
              duration: videoDuration,
              user_id: userId,
              model: selectedModel?.code,
            }),
          }
        );
        
        const videoData = await videoResponse.json();
        
        if (videoData.success && videoData.data?.video_url) {
          setResult({
            type: 'video',
            content: prompt,
            videoUrl: videoData.data.video_url,
            model: selectedModel?.name || 'Video AI',
            prompt: prompt,
            createdAt: new Date().toISOString(),
            duration: videoDuration,
            gPointsCost: requiredGPoints,
          });
        } else {
          // 视频生成失败，退还G点
          await fetch(
            `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/g-points/refund`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                gPoints: requiredGPoints,
                description: '视频生成失败，退还G点',
              }),
            }
          );
          setGPointsBalance(prev => prev + requiredGPoints);
          throw new Error(videoData.error || '视频生成失败');
        }
      }
    } catch (error) {
      console.error('Generate error:', error);
      Alert.alert('生成失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, activeType, userId, isMember, isSuperMember, router, videoDuration, gPointsBalance]);

  // 保存到作品库
  const handleSaveToWorks = async () => {
    if (!result || !userId) return;

    try {
      /**
       * 服务端文件：server/src/routes/works.ts
       * 接口：POST /api/v1/works
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_title: `AI创作 - ${result.model}`,
          project_type: activeType === 'chat' ? 'AI对话' : 'AI图像',
          service_type: activeType,
          service_name: result.model,
          content: result.content,
          content_type: result.type,
          image_url: result.imageUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('保存成功', '作品已保存到「我的作品」', [
          { text: '继续创作', style: 'default' },
          { text: '查看作品', onPress: () => router.push('/my-works') },
        ]);
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('保存失败', '请稍后重试');
    }
  };

  // 渲染模型选择器
  const renderModelPicker = () => (
    <Modal
      visible={showModelPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModelPicker(false)}
    >
      <View style={styles.pickerOverlay}>
        <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.pickerHeader}>
            <ThemedText variant="h4" color={theme.textPrimary}>选择模型</ThemedText>
            <TouchableOpacity onPress={() => setShowModelPicker(false)}>
              <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {loadingModels ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView style={styles.pickerList}>
              {models.map((model) => {
                const hasPermission = checkModelPermission(model);
                return (
                  <TouchableOpacity
                    key={model.id}
                    style={[
                      styles.modelItem,
                      selectedModel?.id === model.id && { borderColor: theme.primary },
                      !hasPermission && styles.modelItemDisabled,
                    ]}
                    onPress={() => {
                      if (hasPermission) {
                        setSelectedModel(model);
                        setShowModelPicker(false);
                      } else {
                        Alert.alert(
                          '权限不足',
                          model.super_member_only 
                            ? '该模型仅限超级会员使用' 
                            : '该模型需要会员权限',
                          [
                            { text: '取消', style: 'cancel' },
                            { text: '升级会员', onPress: () => {
                              setShowModelPicker(false);
                              router.push('/membership');
                            }},
                          ]
                        );
                      }
                    }}
                  >
                    <View style={styles.modelInfo}>
                      <View style={styles.modelNameRow}>
                        <ThemedText variant="label" color={theme.textPrimary}>{model.name}</ThemedText>
                        {model.is_free && (
                          <View style={[styles.freeTag, { backgroundColor: `${theme.success}20` }]}>
                            <ThemedText variant="tiny" color={theme.success}>免费</ThemedText>
                          </View>
                        )}
                        {model.member_only && !model.super_member_only && (
                          <View style={[styles.memberTag, { backgroundColor: `${theme.primary}20` }]}>
                            <ThemedText variant="tiny" color={theme.primary}>会员</ThemedText>
                          </View>
                        )}
                        {model.super_member_only && (
                          <View style={[styles.superTag, { backgroundColor: `${theme.accent}20` }]}>
                            <ThemedText variant="tiny" color={theme.accent}>超级会员</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {model.provider} · {model.max_tokens} tokens
                      </ThemedText>
                      {!model.is_free && (
                        <ThemedText variant="tiny" color={theme.textMuted}>
                          ¥{model.inputPrice}/百万输入 · ¥{model.outputPrice}/百万输出
                        </ThemedText>
                      )}
                    </View>
                    {selectedModel?.id === model.id && (
                      <FontAwesome6 name="check" size={16} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

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
            <View style={styles.headerIcon}>
              <FontAwesome6 name="wand-magic-sparkles" size={28} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <ThemedText variant="h2" color={theme.textPrimary}>AI 创作中心</ThemedText>
              <ThemedText variant="label" color={theme.textMuted}>
                一键调用所有AI模型，释放无限创意
              </ThemedText>
            </View>
          </View>

          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />

          {/* 创作类型选择 */}
          <View style={styles.typeSection}>
            <ThemedText variant="label" color={theme.textMuted}>选择创作类型</ThemedText>
            <View style={styles.typeGrid}>
              {CREATE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    activeType === type.id && { 
                      borderColor: type.color,
                      shadowColor: type.color,
                      shadowOpacity: 0.3,
                    },
                  ]}
                  onPress={() => handleTypeChange(type.id)}
                >
                  <View style={[styles.typeIcon, { backgroundColor: `${type.color}20` }]}>
                    <FontAwesome6 name={type.icon as any} size={20} color={type.color} />
                  </View>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>{type.name}</ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>{type.desc}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 模型选择 */}
          <View style={styles.modelSection}>
            <ThemedText variant="label" color={theme.textMuted}>选择模型</ThemedText>
            <TouchableOpacity
              style={[styles.modelSelector, { borderColor: theme.border, backgroundColor: theme.backgroundTertiary }]}
              onPress={() => setShowModelPicker(true)}
            >
              {selectedModel ? (
                <View style={styles.selectedModelInfo}>
                  <ThemedText variant="label" color={theme.textPrimary}>{selectedModel.name}</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {selectedModel.provider} · {selectedModel.is_free ? '免费' : `¥${selectedModel.inputPrice}/百万`}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText variant="label" color={theme.textMuted}>点击选择模型</ThemedText>
              )}
              <FontAwesome6 name="chevron-down" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 视频时长选择（仅视频生成时显示） */}
          {activeType === 'video' && (
            <View style={styles.modelSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <ThemedText variant="label" color={theme.textMuted}>选择时长</ThemedText>
                <TouchableOpacity onPress={() => setShowRechargeModal(true)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome6 name="coins" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                    <ThemedText variant="label" color="#F59E0B">{gPointsBalance} G点</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {VIDEO_DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration.value}
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: videoDuration === duration.value ? '#F59E0B' : theme.border,
                      backgroundColor: videoDuration === duration.value ? 'rgba(245, 158, 11, 0.1)' : theme.backgroundTertiary,
                      alignItems: 'center',
                    }}
                    onPress={() => setVideoDuration(duration.value)}
                  >
                    <ThemedText variant="label" color={videoDuration === duration.value ? '#F59E0B' : theme.textPrimary}>
                      {duration.label}
                    </ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: 4 }}>
                      {duration.gPoints} G点
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              {gPointsBalance < (VIDEO_DURATIONS.find(d => d.value === videoDuration)?.gPoints || 30) && (
                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: `${theme.error || '#EF4444'}20`,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => setShowRechargeModal(true)}
                >
                  <FontAwesome6 name="triangle-exclamation" size={14} color={theme.error || '#EF4444'} style={{ marginRight: 8 }} />
                  <ThemedText variant="captionMedium" color={theme.error || '#EF4444'}>
                    G点不足，点击充值
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* 输入区域 */}
          <View style={styles.inputSection}>
            <ThemedText variant="label" color={theme.textMuted}>
              {activeType === 'chat' ? '输入你的问题或创意' : 
               activeType === 'image' ? '描述你想要的图像' : '上传音频文件'}
            </ThemedText>
            <View style={[styles.inputWrap, { borderColor: theme.primary, backgroundColor: theme.backgroundTertiary }]}>
              <TextInput
                style={styles.promptInput}
                value={prompt}
                onChangeText={setPrompt}
                placeholder={
                  activeType === 'chat' ? '输入任何问题，AI将为你解答...' :
                  activeType === 'image' ? '描述你想要生成的图像，例如：一位身穿汉服的少女...' :
                  '请上传音频文件...'
                }
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.inputActions}>
                <TouchableOpacity onPress={() => setPrompt('')}>
                  <FontAwesome6 name="xmark" size={14} color={theme.textMuted} />
                </TouchableOpacity>
                <ThemedText variant="tiny" color={theme.textMuted}>{prompt.length}/2000</ThemedText>
              </View>
            </View>
          </View>

          {/* 生成按钮 */}
          <TouchableOpacity
            style={styles.generateButton}
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
                  <FontAwesome6 name="play" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <ThemedText variant="label" color="#fff">开始创作</ThemedText>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* 生成结果 */}
          {result && (
            <View style={styles.resultSection}>
              <View style={styles.resultHeader}>
                <ThemedText variant="label" color={theme.textMuted}>生成结果</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>模型: {result.model}</ThemedText>
              </View>
              
              <View style={[styles.resultCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.primary }]}>
                {result.type === 'image' && result.imageUrl ? (
                  <Image
                    source={{ uri: result.imageUrl }}
                    style={styles.resultImage}
                    resizeMode="cover"
                  />
                ) : (
                  <ScrollView style={styles.resultTextContainer}>
                    <ThemedText variant="body" color={theme.textPrimary}>
                      {result.content}
                    </ThemedText>
                  </ScrollView>
                )}
              </View>

              {/* 操作按钮 */}
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: theme.success }]}
                  onPress={handleSaveToWorks}
                >
                  <FontAwesome6 name="bookmark" size={14} color={theme.success} />
                  <ThemedText variant="captionMedium" color={theme.success}>保存作品</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: theme.primary }]}
                  onPress={() => {
                    setResult(null);
                    setPrompt('');
                  }}
                >
                  <FontAwesome6 name="rotate" size={14} color={theme.primary} />
                  <ThemedText variant="captionMedium" color={theme.primary}>重新创作</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 快捷入口 */}
          <View style={styles.shortcutsSection}>
            <ThemedText variant="label" color={theme.textMuted}>快捷入口</ThemedText>
            <View style={styles.shortcutsGrid}>
              <TouchableOpacity 
                style={[styles.shortcutCard, { borderColor: theme.border }]}
                onPress={() => router.push('/models')}
              >
                <FontAwesome6 name="store" size={18} color={theme.primary} />
                <ThemedText variant="small" color={theme.textPrimary}>模型市场</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shortcutCard, { borderColor: theme.border }]}
                onPress={() => router.push('/my-works')}
              >
                <FontAwesome6 name="folder-open" size={18} color={theme.accent} />
                <ThemedText variant="small" color={theme.textPrimary}>我的作品</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.shortcutCard, { borderColor: theme.border }]}
                onPress={() => router.push('/membership')}
              >
                <FontAwesome6 name="crown" size={18} color="#F59E0B" />
                <ThemedText variant="small" color={theme.textPrimary}>会员中心</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 模型选择器 */}
      {renderModelPicker()}

      {/* G点充值模态框 */}
      <Modal
        visible={showRechargeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRechargeModal(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.pickerHeader}>
              <ThemedText variant="h4" color={theme.textPrimary}>充值G点</ThemedText>
              <TouchableOpacity onPress={() => setShowRechargeModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <FontAwesome6 name="coins" size={48} color="#F59E0B" />
                <ThemedText variant="h3" color={theme.textPrimary} style={{ marginTop: 12 }}>
                  当前余额：{gPointsBalance} G点
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
                  1元 = 100G点
                </ThemedText>
              </View>

              <View style={{ gap: 12 }}>
                {[10, 50, 100, 200, 500].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      backgroundColor: theme.backgroundTertiary,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onPress={async () => {
                      try {
                        const response = await fetch(
                          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/billing/g-points/recharge`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId,
                              amount,
                            }),
                          }
                        );
                        
                        const data = await response.json();
                        
                        if (data.success) {
                          setGPointsBalance(data.data.balanceAfter);
                          setShowRechargeModal(false);
                          Alert.alert('充值成功', `成功充值${amount}元，获得${data.data.gPointsReceived}G点`);
                        } else {
                          Alert.alert('充值失败', data.error || '请稍后重试');
                        }
                      } catch (error) {
                        console.error('Recharge error:', error);
                        Alert.alert('充值失败', '请稍后重试');
                      }
                    }}
                  >
                    <View>
                      <ThemedText variant="label" color={theme.textPrimary}>充值 {amount} 元</ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>获得 {amount * 100} G点</ThemedText>
                    </View>
                    <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: 24, padding: 16, borderRadius: 12, backgroundColor: `${theme.primary}10` }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <FontAwesome6 name="circle-info" size={16} color={theme.primary} style={{ marginRight: 8, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="caption" color={theme.textSecondary}>
                      • 视频生成：1秒 = 1G点{'\n'}
                      • 30秒视频 = 30G点{'\n'}
                      • 2分钟视频 = 120G点{'\n'}
                      • 5分钟视频 = 300G点{'\n'}
                      • 平台仅收取服务费，token费用另计
                    </ThemedText>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
