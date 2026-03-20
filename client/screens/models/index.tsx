import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Model {
  id: string;
  code: string;
  name: string;
  provider: string;
  category: string;
  inputPrice: string;
  outputPrice: string;
  gpuHourPrice: string | null;
  is_free: boolean;
  member_only: boolean;
  super_member_only: boolean;
  max_tokens: number;
  description?: string;
}

// 预置模型数据（当API无数据时使用）
const DEFAULT_MODELS: Model[] = [
  // 对话模型
  { id: '1', code: 'doubao-pro-32k', name: '豆包 Pro 32K', provider: 'doubao', category: 'chat', inputPrice: '0.80', outputPrice: '2.00', gpuHourPrice: null, is_free: false, member_only: false, super_member_only: false, max_tokens: 32768, description: '高质量对话，支持长文本' },
  { id: '2', code: 'doubao-lite-4k', name: '豆包 Lite 4K', provider: 'doubao', category: 'chat', inputPrice: '0.30', outputPrice: '0.60', gpuHourPrice: null, is_free: true, member_only: false, super_member_only: false, max_tokens: 4096, description: '轻量级模型，日常对话' },
  { id: '3', code: 'gpt-4o', name: 'GPT-4o', provider: 'openai', category: 'chat', inputPrice: '35.00', outputPrice: '105.00', gpuHourPrice: null, is_free: false, member_only: true, super_member_only: false, max_tokens: 128000, description: 'OpenAI旗舰模型' },
  { id: '4', code: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', category: 'chat', inputPrice: '1.75', outputPrice: '7.00', gpuHourPrice: null, is_free: false, member_only: true, super_member_only: false, max_tokens: 128000, description: '高性价比GPT模型' },
  { id: '5', code: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', category: 'chat', inputPrice: '105.00', outputPrice: '525.00', gpuHourPrice: null, is_free: false, member_only: false, super_member_only: true, max_tokens: 200000, description: '最强推理能力' },
  { id: '6', code: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', category: 'chat', inputPrice: '21.00', outputPrice: '105.00', gpuHourPrice: null, is_free: false, member_only: true, super_member_only: false, max_tokens: 200000, description: '平衡性能与成本' },
  { id: '7', code: 'llama3-70b', name: 'Llama 3 70B', provider: 'ollama', category: 'chat', inputPrice: '0.00', outputPrice: '0.00', gpuHourPrice: '15.00', is_free: true, member_only: false, super_member_only: false, max_tokens: 8192, description: '开源大模型，本地部署' },
  { id: '8', code: 'qwen-max', name: '通义千问 Max', provider: 'doubao', category: 'chat', inputPrice: '14.00', outputPrice: '56.00', gpuHourPrice: null, is_free: false, member_only: true, super_member_only: false, max_tokens: 32000, description: '阿里云大模型旗舰版' },
  // 图像模型
  { id: '9', code: 'dall-e-3', name: 'DALL-E 3', provider: 'openai', category: 'image', inputPrice: '280.00', outputPrice: '280.00', gpuHourPrice: null, is_free: false, member_only: false, super_member_only: true, max_tokens: 4096, description: '高质量图像生成' },
  { id: '10', code: 'midjourney-v6', name: 'Midjourney V6', provider: 'openai', category: 'image', inputPrice: '350.00', outputPrice: '350.00', gpuHourPrice: null, is_free: false, member_only: false, super_member_only: true, max_tokens: 4096, description: '艺术级图像生成' },
  { id: '11', code: 'stable-diffusion-xl', name: 'SD XL', provider: 'ollama', category: 'image', inputPrice: '0.00', outputPrice: '0.00', gpuHourPrice: '12.00', is_free: true, member_only: false, super_member_only: false, max_tokens: 2048, description: '开源图像生成' },
  // 视频模型
  { id: '12', code: 'sora', name: 'Sora', provider: 'openai', category: 'video', inputPrice: '500.00', outputPrice: '500.00', gpuHourPrice: null, is_free: false, member_only: false, super_member_only: true, max_tokens: 8192, description: 'OpenAI视频生成' },
  { id: '13', code: 'runway-gen3', name: 'Runway Gen-3', provider: 'openai', category: 'video', inputPrice: '280.00', outputPrice: '280.00', gpuHourPrice: null, is_free: false, member_only: false, super_member_only: true, max_tokens: 4096, description: '专业视频创作' },
  // 音频模型
  { id: '14', code: 'whisper-large', name: 'Whisper Large', provider: 'openai', category: 'audio', inputPrice: '0.42', outputPrice: '0.00', gpuHourPrice: null, is_free: false, member_only: true, super_member_only: false, max_tokens: 4096, description: '语音识别转写' },
  { id: '15', code: 'tts-1', name: 'TTS-1', provider: 'openai', category: 'audio', inputPrice: '105.00', outputPrice: '0.00', gpuHourPrice: null, is_free: false, member_only: true, super_member_only: false, max_tokens: 2048, description: '文本转语音' },
];

const PROVIDERS = [
  { id: 'all', name: '全部' },
  { id: 'doubao', name: '豆包' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'ollama', name: 'Ollama' },
  { id: 'anthropic', name: 'Claude' },
];

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'chat', name: '对话' },
  { id: 'image', name: '图像' },
  { id: 'video', name: '视频' },
  { id: 'audio', name: '音频' },
];

export default function ModelsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { isMember, isSuperMember } = useMembership();

  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState({
    today: { totalTokens: 0, calls: 0 },
    month: { totalTokens: 0, calls: 0 },
    balance: { available: 0 },
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/models`);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setModels(data.data);
      } else {
        // 使用预置数据
        setModels(DEFAULT_MODELS);
      }
    } catch (error) {
      console.error('Fetch models error:', error);
      // 网络错误时使用预置数据
      setModels(DEFAULT_MODELS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取Token使用情况
   * 服务端文件：server/src/routes/user.ts
   * 接口：GET /api/v1/user/:userId/token-usage
   */
  const fetchTokenUsage = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/${userId}/token-usage`);
      const data = await res.json();
      
      if (data.success) {
        setTokenUsage(data.data);
      }
    } catch (error) {
      console.error('Fetch token usage error:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchTokenUsage();
  }, [fetchData, fetchTokenUsage]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (selectedProvider !== 'all' && model.provider !== selectedProvider) return false;
      if (selectedCategory !== 'all' && model.category !== selectedCategory) return false;
      return true;
    });
  }, [models, selectedProvider, selectedCategory]);

  const chatModels = filteredModels.filter((m) => m.category === 'chat');
  const imageModels = filteredModels.filter((m) => m.category === 'image');
  const videoModels = filteredModels.filter((m) => m.category === 'video');
  const audioModels = filteredModels.filter((m) => m.category === 'audio');

  const handleSelectModel = async (model: Model) => {
    // 检查权限
    if (model.super_member_only && !isSuperMember) {
      showUpgradeAlert('超级会员', '该模型需要超级会员才能使用', 9900, 'super_member');
      return;
    }
    if (model.member_only && !isMember) {
      showUpgradeAlert('普通会员', '该模型需要普通会员才能使用', 2900, 'membership');
      return;
    }
    
    setSelectedModel(model.id);
    await AsyncStorage.setItem('selectedModel', JSON.stringify(model));
    
    if (Platform.OS === 'web') {
      window.alert(`已选择 ${model.name} 作为默认模型`);
    } else {
      Alert.alert('模型已选择', `已选择 ${model.name} 作为默认模型`);
    }
  };

  const showUpgradeAlert = (title: string, message: string, amount: number, productType: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${message}\n\n是否立即开通${title}？`)) {
        router.push('/payment', { amount, productType });
      }
    } else {
      Alert.alert(
        title,
        message,
        [
          { text: '取消', style: 'cancel' },
          { text: '立即开通', onPress: () => router.push('/payment', { amount, productType }) },
        ]
      );
    }
  };

  const getModelIcon = (category: string): keyof typeof FontAwesome6.glyphMap => {
    if (category === 'image') return 'image';
    if (category === 'video') return 'video';
    if (category === 'audio') return 'music';
    return 'brain';
  };

  const getProviderColor = (provider: string): string => {
    const colors: Record<string, string> = {
      openai: '#10A37F',
      doubao: '#3370FF',
      anthropic: '#D97706',
      ollama: '#7C3AED',
    };
    return colors[provider] || theme.primary;
  };

  const renderModelCard = (model: Model) => {
    const isLocked = (model.super_member_only && !isSuperMember) || (model.member_only && !isMember);
    
    return (
      <TouchableOpacity
        key={model.id}
        style={[styles.modelCard, selectedModel === model.id && styles.selectedCard]}
        onPress={() => handleSelectModel(model)}
        activeOpacity={0.7}
      >
        <View style={styles.modelHeader}>
          <View style={[styles.modelIcon, { backgroundColor: getProviderColor(model.provider) + '20' }]}>
            <FontAwesome6
              name={getModelIcon(model.category)}
              size={22}
              color={getProviderColor(model.provider)}
            />
          </View>
          <View style={styles.modelInfo}>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              {model.name}
            </ThemedText>
            <View style={styles.modelMeta}>
              <ThemedText variant="caption" color={theme.textMuted}>
                {model.provider.toUpperCase()}
              </ThemedText>
              {model.is_free && (
                <View style={[styles.modelBadge, { backgroundColor: theme.success + '20' }]}>
                  <Text style={{ color: theme.success, fontSize: 10, fontWeight: '600' }}>免费</Text>
                </View>
              )}
              {model.member_only && !model.is_free && (
                <View style={[styles.modelBadge, { backgroundColor: '#D9770620' }]}>
                  <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '600' }}>会员</Text>
                </View>
              )}
              {model.super_member_only && (
                <View style={[styles.modelBadge, { backgroundColor: '#7C3AED20' }]}>
                  <Text style={{ color: '#7C3AED', fontSize: 10, fontWeight: '600' }}>超级会员</Text>
                </View>
              )}
            </View>
          </View>
          {isLocked && (
            <FontAwesome6 name="lock" size={16} color={theme.textMuted} />
          )}
        </View>

        {model.description && (
          <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
            {model.description}
          </ThemedText>
        )}

        <View style={styles.modelFooter}>
          <View style={styles.priceGroup}>
            <ThemedText variant="caption" color={theme.textMuted}>输入 ¥/百万</ThemedText>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>{model.inputPrice}</ThemedText>
          </View>
          <View style={styles.priceGroup}>
            <ThemedText variant="caption" color={theme.textMuted}>输出 ¥/百万</ThemedText>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>{model.outputPrice}</ThemedText>
          </View>
          <View style={[styles.selectButton, isLocked && { backgroundColor: theme.textMuted }]}>
            <ThemedText variant="small" color={theme.backgroundRoot}>
              {isLocked ? '解锁' : '选择'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, sectionModels: Model[]) => {
    if (sectionModels.length === 0) return null;
    
    return (
      <View style={{ marginBottom: Spacing.lg }}>
        {selectedCategory === 'all' && (
          <ThemedText variant="label" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
            {title}
          </ThemedText>
        )}
        {sectionModels.map(renderModelCard)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ padding: Spacing.sm }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary}>
            模型市场
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        {/* 会员快捷入口 */}
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push('/payment', { amount: 2900, productType: 'membership' })}
          >
            <LinearGradient
              colors={['#00F0FF', '#BF00FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' }}
            >
              <FontAwesome6 name="crown" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 }}>普通会员 ¥29/月</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => router.push('/payment', { amount: 9900, productType: 'super_member' })}
          >
            <LinearGradient
              colors={['#FFD700', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' }}
            >
              <FontAwesome6 name="rocket" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 4 }}>超级会员 ¥99/月</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Token使用情况卡片 */}
        <View style={[styles.tokenUsageCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>Token使用统计</ThemedText>
            <TouchableOpacity onPress={fetchTokenUsage}>
              <FontAwesome6 name="rotate" size={14} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
            <View style={{ flex: 1 }}>
              <ThemedText variant="caption" color={theme.textMuted}>今日使用</ThemedText>
              <ThemedText variant="h3" color={theme.primary}>
                {tokenUsage.today.totalTokens.toLocaleString()}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                {tokenUsage.today.calls} 次调用
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="caption" color={theme.textMuted}>本月使用</ThemedText>
              <ThemedText variant="h3" color={theme.accent}>
                {tokenUsage.month.totalTokens.toLocaleString()}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                {tokenUsage.month.calls} 次调用
              </ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText variant="caption" color={theme.textMuted}>账户余额</ThemedText>
              <ThemedText variant="h3" color={theme.success}>
                ¥{tokenUsage.balance.available.toFixed(2)}
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/payment', { amount: 1000, productType: 'balance' })}>
                <ThemedText variant="caption" color={theme.primary}>充值</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 提供商筛选 */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            <View style={styles.filterRow}>
              {PROVIDERS.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[
                    styles.filterChip,
                    selectedProvider === provider.id && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedProvider(provider.id)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedProvider === provider.id ? theme.backgroundRoot : theme.textPrimary },
                  ]}>
                    {provider.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 分类筛选 */}
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
            <View style={styles.filterRow}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterChip,
                    selectedCategory === category.id && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedCategory === category.id ? theme.backgroundRoot : theme.textPrimary },
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 模型列表 */}
        {(selectedCategory === 'all' || selectedCategory === 'chat') && renderSection('对话模型', chatModels)}
        {(selectedCategory === 'all' || selectedCategory === 'image') && renderSection('图像生成', imageModels)}
        {(selectedCategory === 'all' || selectedCategory === 'video') && renderSection('视频生成', videoModels)}
        {(selectedCategory === 'all' || selectedCategory === 'audio') && renderSection('音频处理', audioModels)}

        {filteredModels.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome6 name="box-open" size={48} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              暂无匹配的模型
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
