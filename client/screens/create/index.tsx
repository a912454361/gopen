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
    id: 'anime', 
    name: '动漫创作', 
    icon: 'wand-magic-sparkles', 
    color: '#FF6B9D', 
    desc: 'AI动漫，梦幻生成',
    category: 'image' 
  },
  { 
    id: 'game', 
    name: '游戏创作', 
    icon: 'gamepad', 
    color: '#10B981', 
    desc: '游戏场景，一键生成',
    category: 'image' 
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

// 创作任务接口
interface GenerationTask {
  id: string;
  user_id: string;
  task_type: 'chat' | 'image' | 'audio' | 'video' | 'anime' | 'game';
  prompt: string;
  model: string;
  parameters: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result_url?: string;
  result_data?: Record<string, any>;
  error_message?: string;
  g_points_cost: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  is_privileged: boolean;
}

// 特权用户ID（郭涛）
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

// 视频生成配置
const VIDEO_DURATIONS = [
  { value: 30, label: '30秒', gPoints: 30 },
  { value: 120, label: '2分钟', gPoints: 120 },
  { value: 300, label: '5分钟', gPoints: 300 },
];

// 特权用户视频生成配置（更长时长，免费）
const PRIVILEGED_VIDEO_DURATIONS = [
  { value: 30, label: '30秒', gPoints: 0 },
  { value: 60, label: '1分钟', gPoints: 0 },
  { value: 120, label: '2分钟', gPoints: 0 },
  { value: 180, label: '3分钟', gPoints: 0 },
  { value: 300, label: '5分钟', gPoints: 0 },
  { value: 600, label: '10分钟', gPoints: 0 },
  { value: 900, label: '15分钟', gPoints: 0 },
  { value: 1800, label: '30分钟', gPoints: 0 },
  { value: 3600, label: '1小时', gPoints: 0 },
];

// 特权用户特效选项
const VIDEO_EFFECTS = [
  { value: 'none', label: '无特效', icon: 'ban' },
  { value: 'particle', label: '粒子效果', icon: 'sparkles' },
  { value: 'cinematic', label: '电影质感', icon: 'film' },
  { value: 'anime', label: '动漫风格', icon: 'palette' },
  { value: 'realistic', label: '超写实', icon: 'camera' },
];

// 特权用户分辨率选项
const PRIVILEGED_RESOLUTIONS = [
  { value: '720p', label: '720p HD' },
  { value: '1080p', label: '1080p FHD' },
  { value: '2K', label: '2K QHD' },
  { value: '4K', label: '4K UHD' },
  { value: '8K', label: '8K UHD' },
];

// 主流视频生成模型推荐（支持特权用户高质量输出）
const RECOMMENDED_VIDEO_MODELS = [
  { 
    id: 'seedance-1.5-pro',
    code: 'seedance-1.5-pro',
    name: 'Seedance 1.5 Pro',
    provider: '字节跳动',
    description: '高质量文生视频，支持多种风格',
    features: ['4K画质', '流畅动画', '多样风格'],
    color: '#00D9FF',
    recommended: true,
  },
  { 
    id: 'sora',
    code: 'sora',
    name: 'Sora',
    provider: 'OpenAI',
    description: '顶尖视频生成模型，画面细腻真实',
    features: ['真实感强', '长视频支持', '物理准确'],
    color: '#10A37F',
    recommended: true,
  },
  { 
    id: 'kling',
    code: 'kling',
    name: '可灵 Kling',
    provider: '快手',
    description: '国产优秀视频生成模型',
    features: ['国风优化', '中文理解', '性价比高'],
    color: '#FF4906',
    recommended: true,
  },
  { 
    id: 'runway-gen3',
    code: 'runway-gen3',
    name: 'Runway Gen-3',
    provider: 'Runway',
    description: '专业级视频创作工具',
    features: ['电影级画质', '创意控制', '风格迁移'],
    color: '#7C3AED',
    recommended: true,
  },
  { 
    id: 'pika-labs',
    code: 'pika-labs',
    name: 'Pika Labs',
    provider: 'Pika',
    description: '创意视频生成新锐',
    features: ['创意无限', '操作简单', '快速生成'],
    color: '#F472B6',
    recommended: true,
  },
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
  const [videoEffect, setVideoEffect] = useState('none');
  const [videoResolution, setVideoResolution] = useState('720p');
  const [gPointsBalance, setGPointsBalance] = useState(0);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteModels, setFavoriteModels] = useState<Model[]>([]);
  
  // 创作任务进度状态
  const [activeTasks, setActiveTasks] = useState<GenerationTask[]>([]);
  const [showProgressPanel, setShowProgressPanel] = useState(true);

  // 特权用户检查
  const isPrivilegedUser = userId === PRIVILEGED_USER_ID;

  // 获取用户ID
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  // 从后端加载收藏列表
  const loadFavorites = useCallback(async () => {
    if (!userId) {
      // 如果没有userId，从本地存储加载
      const saved = await AsyncStorage.getItem('modelFavorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
      return;
    }
    
    try {
      /**
       * 服务端文件：server/src/routes/user.ts
       * 接口：GET /api/v1/user/:userId/favorites
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/${userId}/favorites`
      );
      const data = await response.json();
      if (data.success) {
        setFavorites(data.data.modelIds);
        // 同步到本地存储
        await AsyncStorage.setItem('modelFavorites', JSON.stringify(data.data.modelIds));
      }
    } catch (error) {
      console.error('Load favorites error:', error);
      // 失败时从本地加载
      const saved = await AsyncStorage.getItem('modelFavorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    }
  }, [userId]);

  // 加载收藏列表
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

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

  // 获取活动中的创作任务
  const fetchActiveTasks = useCallback(async () => {
    if (!userId) return;
    try {
      /**
       * 服务端文件：server/src/routes/generation-tasks.ts
       * 接口：GET /api/v1/generation-tasks/user/:userId/active
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/generation-tasks/user/${userId}/active`
      );
      const data = await response.json();
      if (data.success) {
        setActiveTasks(data.data);
      }
    } catch (error) {
      console.error('Fetch active tasks error:', error);
    }
  }, [userId]);

  // 获取活动任务
  useEffect(() => {
    if (userId) {
      fetchActiveTasks();
    }
  }, [userId, fetchActiveTasks]);

  // 轮询活动任务进度（每3秒）
  useEffect(() => {
    if (!userId || activeTasks.length === 0) return;
    
    const hasProcessing = activeTasks.some(t => t.status === 'pending' || t.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchActiveTasks();
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, activeTasks, fetchActiveTasks]);

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
        // 更新收藏模型列表
        updateFavoriteModels(data.data || []);
      }
    } catch (error) {
      console.error('Fetch models error:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // 更新收藏模型列表
  const updateFavoriteModels = (modelList: Model[]) => {
    const favModels = modelList.filter(m => favorites.includes(m.id));
    setFavoriteModels(favModels);
  };

  // 当收藏列表变化时，更新收藏模型
  useEffect(() => {
    if (models.length > 0) {
      updateFavoriteModels(models);
    }
  }, [favorites, models]);

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
      } else if (activeType === 'anime') {
        // 动漫创作 - 使用Kimi生成剧本
        /**
         * 服务端文件：server/src/routes/anime.ts
         * 接口：POST /api/v1/anime/generate
         * Body 参数：user_id: string, prompt: string, style?: string, theme?: string
         */
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/anime/generate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              prompt: prompt,
              style: 'japanese',
              theme: 'fantasy',
              generate_images: isPrivilegedUser,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          // 提示用户任务已启动
          Alert.alert(
            '动漫创作已启动',
            '剧本正在生成中，请查看创作进度面板',
            [{ text: '好的' }]
          );
          
          // 刷新活动任务列表
          fetchActiveTasks();
          
          setResult({
            type: 'text',
            content: `动漫创作任务已创建！\n任务ID: ${data.data.task_id}\n\n提示词: ${prompt}\n\n剧本生成中，请稍后查看进度面板...`,
            model: 'Kimi (Moonshot)',
            prompt: prompt,
            createdAt: new Date().toISOString(),
          });
        } else {
          throw new Error(data.error || '动漫创作启动失败');
        }
      } else if (activeType === 'game') {
        // 游戏创作 - 使用Kimi生成游戏场景
        /**
         * 服务端文件：server/src/routes/anime.ts
         * 接口：POST /api/v1/anime/script
         * Body 参数：user_id: string, prompt: string, style?: string, theme?: string
         */
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/anime/script`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              prompt: `游戏场景设定：${prompt}`,
              style: 'fantasy',
              theme: 'action',
              character_count: 2,
              scene_count: 3,
            }),
          }
        );

        const data = await response.json();

        if (data.success && data.data?.script) {
          const script = data.data.script;
          setResult({
            type: 'text',
            content: `【${script.title}】\n\n${script.synopsis}\n\n角色：\n${script.characters?.map((c: any) => `• ${c.name}(${c.role})：${c.personality}`).join('\n') || '暂无'}\n\n场景：\n${script.scenes?.map((s: any) => `• ${s.location}(${s.timeOfDay})`).join('\n') || '暂无'}`,
            model: 'Kimi (Moonshot)',
            prompt: prompt,
            createdAt: new Date().toISOString(),
          });
        } else {
          throw new Error(data.error || '游戏场景生成失败');
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
        // 特权用户无需检查G点，使用特权配置
        const durationConfig = isPrivilegedUser 
          ? PRIVILEGED_VIDEO_DURATIONS.find(d => d.value === videoDuration)
          : VIDEO_DURATIONS.find(d => d.value === videoDuration);
        const requiredGPoints = isPrivilegedUser ? 0 : (durationConfig?.gPoints || 30);
        
        // 非特权用户检查G点余额
        if (!isPrivilegedUser && gPointsBalance < requiredGPoints) {
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
        
        // 非特权用户扣除G点
        if (!isPrivilegedUser) {
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
        }
        
        // 调用视频生成API（特权用户可使用特效和更高质量）
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
              ...(isPrivilegedUser && {
                resolution: videoResolution,
                effect: videoEffect,
              }),
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
            gPointsCost: isPrivilegedUser ? 0 : requiredGPoints,
          });
        } else {
          // 视频生成失败，非特权用户退还G点
          if (!isPrivilegedUser) {
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
          }
          throw new Error(videoData.error || '视频生成失败');
        }
      }
    } catch (error) {
      console.error('Generate error:', error);
      Alert.alert('生成失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedModel, activeType, userId, isMember, isSuperMember, router, videoDuration, gPointsBalance, videoEffect, videoResolution, isPrivilegedUser, fetchActiveTasks]);

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
              {/* 视频生成推荐模型区域 */}
              {activeType === 'video' && (
                <View style={styles.favoriteSection}>
                  <View style={styles.sectionHeader}>
                    <FontAwesome6 name="fire" size={14} color="#F59E0B" solid />
                    <ThemedText variant="label" color={theme.textPrimary} style={{ marginLeft: 6 }}>
                      主流推荐
                    </ThemedText>
                  </View>
                  {RECOMMENDED_VIDEO_MODELS.map((model) => {
                    const isSelected = selectedModel?.code === model.code;
                    return (
                      <TouchableOpacity
                        key={`rec-${model.id}`}
                        style={[
                          styles.modelItem,
                          isSelected && { borderColor: model.color, backgroundColor: `${model.color}10` },
                        ]}
                        onPress={() => {
                          // 设置选中的推荐模型
                          setSelectedModel({
                            id: model.id,
                            code: model.code,
                            name: model.name,
                            provider: model.provider,
                            category: 'video',
                            inputPrice: '0',
                            outputPrice: '0',
                            is_free: false,
                            member_only: false,
                            super_member_only: false,
                            max_tokens: 0,
                            description: model.description,
                          });
                          setShowModelPicker(false);
                        }}
                      >
                        <View style={styles.modelInfo}>
                          <View style={styles.modelNameRow}>
                            <ThemedText variant="label" color={theme.textPrimary}>{model.name}</ThemedText>
                            <View style={[styles.freeTag, { backgroundColor: `${model.color}20` }]}>
                              <ThemedText variant="tiny" color={model.color}>推荐</ThemedText>
                            </View>
                          </View>
                          <ThemedText variant="caption" color={theme.textMuted}>
                            {model.provider} · {model.description}
                          </ThemedText>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {model.features.map((feature, idx) => (
                              <View 
                                key={idx}
                                style={{ 
                                  paddingHorizontal: 6, 
                                  paddingVertical: 2, 
                                  borderRadius: 4, 
                                  backgroundColor: `${model.color}15` 
                                }}
                              >
                                <ThemedText variant="tiny" color={model.color}>{feature}</ThemedText>
                              </View>
                            ))}
                          </View>
                        </View>
                        {isSelected && (
                          <FontAwesome6 name="check" size={16} color={model.color} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.sectionDivider} />
                </View>
              )}

              {/* 收藏模型区域 */}
              {favoriteModels.length > 0 && (
                <View style={styles.favoriteSection}>
                  <View style={styles.sectionHeader}>
                    <FontAwesome6 name="star" size={14} color="#FFD700" solid />
                    <ThemedText variant="label" color={theme.textPrimary} style={{ marginLeft: 6 }}>
                      我的收藏
                    </ThemedText>
                  </View>
                  {favoriteModels.map((model) => {
                    const hasPermission = checkModelPermission(model);
                    return (
                      <TouchableOpacity
                        key={`fav-${model.id}`}
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
                            <FontAwesome6 name="star" size={12} color="#FFD700" solid style={{ marginLeft: 6 }} />
                          </View>
                          <ThemedText variant="caption" color={theme.textMuted}>
                            {model.provider} · {model.max_tokens} tokens
                          </ThemedText>
                        </View>
                        {selectedModel?.id === model.id && (
                          <FontAwesome6 name="check" size={16} color={theme.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.sectionDivider} />
                </View>
              )}

              {/* 全部模型 */}
              <View style={styles.sectionHeader}>
                <ThemedText variant="label" color={theme.textMuted}>全部模型</ThemedText>
              </View>
              {models.map((model) => {
                const hasPermission = checkModelPermission(model);
                const isFavorite = favorites.includes(model.id);
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
            <TouchableOpacity 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: `${theme.primary}15`,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => router.push('/projects')}
            >
              <FontAwesome6 name="arrow-left" size={16} color={theme.primary} />
            </TouchableOpacity>
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

          {/* 创作进度面板 */}
          {activeTasks.length > 0 && showProgressPanel && (
            <View style={[styles.progressPanel, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <View style={styles.progressPanelHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <FontAwesome6 name="spinner" size={16} color={theme.primary} spin />
                  <ThemedText variant="label" color={theme.textPrimary}>创作进度</ThemedText>
                  <View style={[styles.taskBadge, { backgroundColor: theme.primary }]}>
                    <ThemedText variant="tiny" color="#fff">{activeTasks.length}</ThemedText>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowProgressPanel(false)}>
                  <FontAwesome6 name="chevron-up" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taskList}>
                {activeTasks.map((task) => (
                  <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.backgroundTertiary, borderColor: theme.borderLight }]}>
                    <View style={styles.taskHeader}>
                      <View style={[styles.taskTypeIcon, { backgroundColor: `${CREATE_TYPES.find(t => t.id === task.task_type)?.color || theme.primary}20` }]}>
                        <FontAwesome6 
                          name={CREATE_TYPES.find(t => t.id === task.task_type)?.icon as any || 'cube'} 
                          size={14} 
                          color={CREATE_TYPES.find(t => t.id === task.task_type)?.color || theme.primary} 
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <ThemedText variant="smallMedium" color={theme.textPrimary} numberOfLines={1}>
                          {CREATE_TYPES.find(t => t.id === task.task_type)?.name || task.task_type}
                        </ThemedText>
                        <ThemedText variant="tiny" color={theme.textMuted}>
                          {task.status === 'pending' ? '等待中...' : task.status === 'processing' ? '生成中...' : task.status === 'completed' ? '已完成' : '失败'}
                        </ThemedText>
                      </View>
                    </View>
                    
                    {/* 进度条 */}
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                        <View 
                          style={[
                            styles.progressBarFill, 
                            { 
                              width: `${task.progress}%`,
                              backgroundColor: task.status === 'failed' ? theme.error : theme.primary 
                            }
                          ]} 
                        />
                      </View>
                      <ThemedText variant="tiny" color={theme.textMuted}>{task.progress}%</ThemedText>
                    </View>
                    
                    {/* 提示词预览 */}
                    <ThemedText variant="caption" color={theme.textSecondary} numberOfLines={2} style={{ marginTop: 8 }}>
                      {task.prompt || '无提示词'}
                    </ThemedText>
                    
                    {/* 完成后显示结果 */}
                    {task.status === 'completed' && task.result_url && (
                      <TouchableOpacity 
                        style={[styles.viewResultBtn, { backgroundColor: theme.primary }]}
                        onPress={() => {
                          if (task.task_type === 'video' || task.task_type === 'anime' || task.task_type === 'game') {
                            // 视频类型，设置结果
                            setResult({
                              type: 'video',
                              content: task.prompt,
                              videoUrl: task.result_url,
                              model: task.model,
                              prompt: task.prompt,
                              createdAt: task.completed_at || task.created_at,
                            });
                          } else if (task.task_type === 'image') {
                            setResult({
                              type: 'image',
                              content: task.prompt,
                              imageUrl: task.result_url,
                              model: task.model,
                              prompt: task.prompt,
                              createdAt: task.completed_at || task.created_at,
                            });
                          }
                        }}
                      >
                        <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>查看结果</ThemedText>
                      </TouchableOpacity>
                    )}
                    
                    {/* 失败显示错误 */}
                    {task.status === 'failed' && task.error_message && (
                      <ThemedText variant="tiny" color={theme.error} style={{ marginTop: 8 }}>
                        {task.error_message}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </ScrollView>
              </View>
            </View>
          )}

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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ThemedText variant="label" color={theme.textMuted}>选择时长</ThemedText>
                  {isPrivilegedUser && (
                    <View style={{ 
                      marginLeft: 8, 
                      paddingHorizontal: 8, 
                      paddingVertical: 2, 
                      borderRadius: 4, 
                      backgroundColor: 'rgba(245, 158, 11, 0.2)' 
                    }}>
                      <ThemedText variant="tiny" color="#F59E0B">VIP特权</ThemedText>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => setShowRechargeModal(true)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome6 name="coins" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                    <ThemedText variant="label" color="#F59E0B">{gPointsBalance} G点</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* 时长选择 */}
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {(isPrivilegedUser ? PRIVILEGED_VIDEO_DURATIONS : VIDEO_DURATIONS).map((duration) => (
                    <TouchableOpacity
                      key={duration.value}
                      style={{
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: videoDuration === duration.value ? '#F59E0B' : theme.border,
                        backgroundColor: videoDuration === duration.value ? 'rgba(245, 158, 11, 0.1)' : theme.backgroundTertiary,
                        alignItems: 'center',
                        minWidth: 80,
                      }}
                      onPress={() => setVideoDuration(duration.value)}
                    >
                      <ThemedText variant="label" color={videoDuration === duration.value ? '#F59E0B' : theme.textPrimary}>
                        {duration.label}
                      </ThemedText>
                      <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: 4 }}>
                        {isPrivilegedUser ? '免费' : `${duration.gPoints} G点`}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              </View>

              {/* 特权用户特效和分辨率选择 */}
              {isPrivilegedUser && (
                <>
                  {/* 分辨率选择 */}
                  <View style={{ marginTop: 16 }}>
                    <ThemedText variant="label" color={theme.textMuted} style={{ marginBottom: 8 }}>分辨率</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {PRIVILEGED_RESOLUTIONS.map((res) => (
                        <TouchableOpacity
                          key={res.value}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: videoResolution === res.value ? '#F59E0B' : theme.border,
                            backgroundColor: videoResolution === res.value ? 'rgba(245, 158, 11, 0.1)' : theme.backgroundTertiary,
                          }}
                          onPress={() => setVideoResolution(res.value)}
                        >
                          <ThemedText variant="captionMedium" color={videoResolution === res.value ? '#F59E0B' : theme.textPrimary}>
                            {res.label}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 特效选择 */}
                  <View style={{ marginTop: 16 }}>
                    <ThemedText variant="label" color={theme.textMuted} style={{ marginBottom: 8 }}>特效</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {VIDEO_EFFECTS.map((effect) => (
                        <TouchableOpacity
                          key={effect.value}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: videoEffect === effect.value ? '#F59E0B' : theme.border,
                            backgroundColor: videoEffect === effect.value ? 'rgba(245, 158, 11, 0.1)' : theme.backgroundTertiary,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          onPress={() => setVideoEffect(effect.value)}
                        >
                          <FontAwesome6 name={effect.icon} size={12} color={videoEffect === effect.value ? '#F59E0B' : theme.textMuted} style={{ marginRight: 6 }} />
                          <ThemedText variant="captionMedium" color={videoEffect === effect.value ? '#F59E0B' : theme.textPrimary}>
                            {effect.label}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* 非特权用户G点不足提示 */}
              {!isPrivilegedUser && gPointsBalance < (VIDEO_DURATIONS.find(d => d.value === videoDuration)?.gPoints || 30) && (
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
                    onPress={() => {
                      // 跳转到钱包页面进行正规充值
                      setShowRechargeModal(false);
                      router.push('/wallet');
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
