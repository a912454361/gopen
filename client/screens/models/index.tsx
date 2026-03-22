import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 新的模型接口类型（匹配统一AI网关）
interface Model {
  code: string;
  name: string;
  provider: string;
  providerName: string;
  type: string;
  category: string;
  description: string;
  pricing: {
    input: number;
    output: number;
    tier: 'free' | 'standard' | 'premium' | 'enterprise';
  };
}

// 提供商接口
interface Provider {
  id: string;
  name: string;
  models: { code: string; name: string; type: string }[];
}

// Token使用情况
interface TokenUsage {
  today: { totalTokens: number; calls: number };
  month: { totalTokens: number; calls: number };
  balance: { available: number };
}

// 提供商图标映射
const PROVIDER_ICONS: Record<string, keyof typeof FontAwesome6.glyphMap> = {
  openai: 'openai',
  anthropic: 'robot',
  google: 'google',
  deepseek: 'brain',
  doubao: 'fire',
  qwen: 'cloud',
  wenxin: 'feather',
  zhipu: 'atom',
  moonshot: 'moon',
  minimax: 'infinity',
  spark: 'bolt',
  hunyuan: 'yin-yang',
  mistral: 'wind',
  groq: 'bolt-lightning',
  cohere: 'circle-nodes',
  stability: 'palette',
};

// 提供商颜色映射
const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97706',
  google: '#4285F4',
  deepseek: '#0066FF',
  doubao: '#3370FF',
  qwen: '#FF6A00',
  wenxin: '#2932E1',
  zhipu: '#1A73E8',
  moonshot: '#6366F1',
  minimax: '#EC4899',
  spark: '#E91E63',
  hunyuan: '#00BFA5',
  mistral: '#FF7000',
  groq: '#F55036',
  cohere: '#39594D',
  stability: '#9333EA',
};

const CATEGORIES = [
  { id: 'all', name: '全部', icon: 'grip' as const },
  { id: 'favorites', name: '收藏', icon: 'star' as const },
  { id: 'text', name: '文本对话', icon: 'message' as const },
  { id: 'multimodal', name: '多模态', icon: 'eye' as const },
  { id: 'image', name: '图像生成', icon: 'image' as const },
  { id: 'audio', name: '音频处理', icon: 'music' as const },
  { id: 'video', name: '视频生成', icon: 'video' as const },
  { id: 'embedding', name: '向量化', icon: 'cube' as const },
];

export default function ModelsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { isMember, isSuperMember } = useMembership();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModelCode, setSelectedModelCode] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    today: { totalTokens: 0, calls: 0 },
    month: { totalTokens: 0, calls: 0 },
    balance: { available: 0 },
  });
  const [favorites, setFavorites] = useState<string[]>([]);

  // 加载收藏列表
  useEffect(() => {
    const loadFavorites = async () => {
      const saved = await AsyncStorage.getItem('modelFavorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    };
    loadFavorites();
  }, []);

  // 切换收藏
  const toggleFavorite = useCallback((modelCode: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(modelCode)
        ? prev.filter(code => code !== modelCode)
        : [...prev, modelCode];
      AsyncStorage.setItem('modelFavorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  /**
   * 获取模型列表
   * 服务端文件：server/src/routes/ai-gateway.ts
   * 接口：GET /api/v1/ai/models
   */
  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/models`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setModels(data.data);
      }
    } catch (error) {
      console.error('Fetch models error:', error);
    }
  }, []);

  /**
   * 获取提供商列表
   * 服务端文件：server/src/routes/ai-gateway.ts
   * 接口：GET /api/v1/ai/providers
   */
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/providers`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Fetch providers error:', error);
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

  /**
   * 获取已选择的模型
   */
  const fetchSelectedModel = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedModel');
      if (saved) {
        const model = JSON.parse(saved);
        setSelectedModelCode(model.code);
      }
    } catch (error) {
      console.error('Fetch selected model error:', error);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchModels(),
      fetchProviders(),
      fetchTokenUsage(),
      fetchSelectedModel(),
    ]);
    setIsLoading(false);
  }, [fetchModels, fetchProviders, fetchTokenUsage, fetchSelectedModel]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchModels(),
      fetchProviders(),
      fetchTokenUsage(),
    ]);
    setIsRefreshing(false);
  }, [fetchModels, fetchProviders, fetchTokenUsage]);

  // 初始化加载模型数据
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData();
  }, [loadAllData]);

  // 页面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchTokenUsage();
    }, [fetchTokenUsage])
  );

  // 筛选后的模型
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (selectedProvider !== 'all' && model.provider !== selectedProvider) return false;
      if (selectedCategory === 'favorites' && !favorites.includes(model.code)) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'favorites' && model.category !== selectedCategory) return false;
      return true;
    });
  }, [models, selectedProvider, selectedCategory, favorites]);

  // 按提供商分组
  const groupedByProvider = useMemo(() => {
    const groups: Record<string, Model[]> = {};
    filteredModels.forEach(model => {
      if (!groups[model.provider]) {
        groups[model.provider] = [];
      }
      groups[model.provider].push(model);
    });
    return groups;
  }, [filteredModels]);

  // 检查模型是否锁定
  const isModelLocked = useCallback((model: Model) => {
    return (model.pricing.tier === 'enterprise' && !isSuperMember) ||
           (model.pricing.tier === 'premium' && !isMember);
  }, [isMember, isSuperMember]);

  // 选择模型
  const handleSelectModel = async (model: Model) => {
    if (isModelLocked(model)) {
      const tier = model.pricing.tier;
      if (tier === 'enterprise') {
        showUpgradeAlert('超级会员', '该模型需要超级会员才能使用', 9900, 'super_member');
      } else if (tier === 'premium') {
        showUpgradeAlert('普通会员', '该模型需要普通会员才能使用', 2900, 'membership');
      }
      return;
    }
    
    setSelectedModelCode(model.code);
    await AsyncStorage.setItem('selectedModel', JSON.stringify(model));
    Alert.alert('模型已选择', `已选择 ${model.name} 作为默认模型`);
  };

  const showUpgradeAlert = (title: string, message: string, amount: number, productType: string) => {
    Alert.alert(
      title,
      message,
      [
        { text: '取消', style: 'cancel' },
        { text: '立即开通', onPress: () => router.push('/payment', { amount, productType }) },
      ]
    );
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    if (price === 0) return '免费';
    return `¥${(price / 100).toFixed(2)}`;
  };

  // 获取类型图标
  const getTypeIcon = (category: string): keyof typeof FontAwesome6.glyphMap => {
    const icons: Record<string, keyof typeof FontAwesome6.glyphMap> = {
      text: 'message',
      multimodal: 'eye',
      image: 'image',
      audio: 'music',
      video: 'video',
      embedding: 'cube',
    };
    return icons[category] || 'brain';
  };

  // 渲染模型卡片
  const renderModelCard = (model: Model) => {
    const isLocked = isModelLocked(model);
    const isSelected = selectedModelCode === model.code;
    const isFavorite = favorites.includes(model.code);
    const providerColor = PROVIDER_COLORS[model.provider] || theme.primary;
    
    return (
      <TouchableOpacity
        key={model.code}
        style={[
          styles.modelCard,
          isSelected && { borderColor: theme.primary, borderWidth: 2 },
        ]}
        onPress={() => handleSelectModel(model)}
        activeOpacity={0.7}
      >
        <View style={styles.modelHeader}>
          <View style={[styles.modelIcon, { backgroundColor: providerColor + '20' }]}>
            <FontAwesome6
              name={getTypeIcon(model.category)}
              size={20}
              color={providerColor}
            />
          </View>
          <View style={styles.modelInfo}>
            <ThemedText variant="smallMedium" color={theme.textPrimary} numberOfLines={1}>
              {model.name}
            </ThemedText>
            <View style={styles.modelMeta}>
              <ThemedText variant="caption" color={theme.textMuted}>
                {model.providerName}
              </ThemedText>
              {model.pricing.tier === 'free' && (
                <View style={[styles.modelBadge, { backgroundColor: theme.success + '20' }]}>
                  <Text style={{ color: theme.success, fontSize: 10, fontWeight: '600' }}>免费</Text>
                </View>
              )}
              {model.pricing.tier === 'premium' && (
                <View style={[styles.modelBadge, { backgroundColor: '#D9770620' }]}>
                  <Text style={{ color: '#D97706', fontSize: 10, fontWeight: '600' }}>会员</Text>
                </View>
              )}
              {model.pricing.tier === 'enterprise' && (
                <View style={[styles.modelBadge, { backgroundColor: '#7C3AED20' }]}>
                  <Text style={{ color: '#7C3AED', fontSize: 10, fontWeight: '600' }}>超级会员</Text>
                </View>
              )}
            </View>
          </View>
          {/* 收藏按钮 */}
          <TouchableOpacity 
            style={{ padding: Spacing.sm }}
            onPress={() => toggleFavorite(model.code)}
          >
            <FontAwesome6 
              name={isFavorite ? 'star' : 'star'} 
              size={16} 
              color={isFavorite ? '#F59E0B' : theme.textMuted}
              solid={isFavorite}
            />
          </TouchableOpacity>
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
              <FontAwesome6 name="check" size={12} color="#fff" />
            </View>
          )}
          {isLocked && !isSelected && (
            <FontAwesome6 name="lock" size={16} color={theme.textMuted} />
          )}
        </View>

        <ThemedText variant="caption" color={theme.textSecondary} style={{ marginTop: Spacing.sm }} numberOfLines={2}>
          {model.description}
        </ThemedText>

        <View style={styles.modelFooter}>
          <View style={styles.priceGroup}>
            <ThemedText variant="caption" color={theme.textMuted}>输入 ¥/百万</ThemedText>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              {formatPrice(model.pricing.input)}
            </ThemedText>
          </View>
          <View style={styles.priceGroup}>
            <ThemedText variant="caption" color={theme.textMuted}>输出 ¥/百万</ThemedText>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              {formatPrice(model.pricing.output)}
            </ThemedText>
          </View>
          <View style={[styles.selectButton, isLocked && { backgroundColor: theme.textMuted }]}>
            <ThemedText variant="small" color={theme.backgroundRoot}>
              {isSelected ? '已选择' : isLocked ? '解锁' : '选择'}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染提供商分组
  const renderProviderSection = (providerId: string, providerModels: Model[]) => {
    const provider = providers.find(p => p.id === providerId);
    const providerName = provider?.name || providerId;
    const providerColor = PROVIDER_COLORS[providerId] || theme.primary;
    
    return (
      <View key={providerId} style={{ marginBottom: Spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
          <View style={{
            width: 28,
            height: 28,
            borderRadius: BorderRadius.sm,
            backgroundColor: providerColor + '20',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: Spacing.sm,
          }}>
            <FontAwesome6
              name={PROVIDER_ICONS[providerId] || 'cube'}
              size={14}
              color={providerColor}
            />
          </View>
          <ThemedText variant="label" color={theme.textPrimary}>
            {providerName}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={{ marginLeft: Spacing.sm }}>
            {providerModels.length} 个模型
          </ThemedText>
        </View>
        {providerModels.map(renderModelCard)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            加载模型数据...
          </ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
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
          <TouchableOpacity 
            onPress={() => router.push('/membership')}
            style={{ padding: Spacing.sm }}
          >
            <FontAwesome6 name="crown" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* 统计概览 */}
        <View style={[styles.statsOverview, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.primary}>
              {providers.length}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>提供商</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.accent}>
              {models.length}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>可用模型</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.success}>
              ¥{tokenUsage.balance.available.toFixed(2)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>账户余额</ThemedText>
          </View>
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

        {/* 类型筛选 */}
        <View style={{ marginBottom: Spacing.md }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
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
                  <FontAwesome6
                    name={category.icon}
                    size={12}
                    color={selectedCategory === category.id ? '#fff' : theme.textPrimary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[
                    styles.filterChipText,
                    { color: selectedCategory === category.id ? '#fff' : theme.textPrimary },
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 提供商筛选 */}
        <View style={{ marginBottom: Spacing.lg }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedProvider === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedProvider('all')}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: selectedProvider === 'all' ? '#fff' : theme.textPrimary },
                ]}>
                  全部提供商
                </Text>
              </TouchableOpacity>
              {providers.map((provider) => {
                const providerColor = PROVIDER_COLORS[provider.id] || theme.primary;
                const isSelected = selectedProvider === provider.id;
                
                return (
                  <TouchableOpacity
                    key={provider.id}
                    style={[
                      styles.filterChip,
                      isSelected && { backgroundColor: providerColor, borderColor: providerColor },
                    ]}
                    onPress={() => setSelectedProvider(provider.id)}
                  >
                    <FontAwesome6
                      name={PROVIDER_ICONS[provider.id] || 'cube'}
                      size={12}
                      color={isSelected ? '#fff' : providerColor}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[
                      styles.filterChipText,
                      { color: isSelected ? '#fff' : theme.textPrimary },
                    ]}>
                      {provider.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* 模型列表（按提供商分组） */}
        {Object.entries(groupedByProvider).map(([providerId, providerModels]) => 
          renderProviderSection(providerId, providerModels)
        )}

        {filteredModels.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome6 name="box-open" size={48} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              暂无匹配的模型
            </ThemedText>
          </View>
        )}

        {/* 底部提示 */}
        <View style={{ marginTop: Spacing.xl, alignItems: 'center' }}>
          <ThemedText variant="caption" color={theme.textMuted}>
            当前已集成 {providers.length} 家厂商的 {models.length} 个模型
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
            持续更新中...
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
