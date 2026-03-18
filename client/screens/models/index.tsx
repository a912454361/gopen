import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
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

interface GpuInstance {
  id: string;
  code: string;
  name: string;
  gpu_model: string;
  vram_gb: number;
  pricePerHour: string;
  available_instances: number;
  description?: string;
}

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

  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState<Model[]>([]);
  const [gpuInstances, setGpuInstances] = useState<GpuInstance[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // 获取模型列表
      const modelsRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/models`
      );
      const modelsData = await modelsRes.json();
      if (modelsData.success) {
        setModels(modelsData.data || []);
      }

      // 获取GPU实例
      const gpuRes = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/gpu/instances`
      );
      const gpuData = await gpuRes.json();
      if (gpuData.success) {
        setGpuInstances(gpuData.data || []);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    setSelectedModel(model.id);
    
    // 保存选中的模型到本地
    await AsyncStorage.setItem('selectedModel', JSON.stringify(model));
    
    Alert.alert(
      '模型已选择',
      `已选择 ${model.name} 作为默认模型`,
      [
        { text: '确定' },
        { text: '前往创作', onPress: () => router.navigate('/') },
      ]
    );
  };

  const getModelIcon = (provider: string, category: string): keyof typeof FontAwesome6.glyphMap => {
    if (provider === 'ollama') return 'server';
    if (category === 'image') return 'image';
    if (category === 'video') return 'video';
    if (category === 'audio') return 'music';
    return 'brain';
  };

  const getIconBgColor = (provider: string): string => {
    const colors: Record<string, string> = {
      openai: '#10A37F20',
      doubao: '#3370FF20',
      anthropic: '#D9770620',
      ollama: '#7C3AED20',
    };
    return colors[provider] || '#64748B20';
  };

  const renderModelCard = (model: Model) => (
    <TouchableOpacity
      key={model.id}
      style={[styles.modelCard, selectedModel === model.id && styles.selectedCard]}
      onPress={() => handleSelectModel(model)}
    >
      <View style={styles.modelHeader}>
        <View style={[styles.modelIcon, { backgroundColor: getIconBgColor(model.provider) }]}>
          <FontAwesome6
            name={getModelIcon(model.provider, model.category)}
            size={22}
            color={theme.primary}
          />
        </View>
        <View style={styles.modelInfo}>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.modelTitle}>
            {model.name}
          </ThemedText>
          <View style={styles.modelMeta}>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.modelProvider}>
              {model.provider.toUpperCase()}
            </ThemedText>
            {model.is_free && (
              <View style={[styles.modelBadge, styles.freeBadge]}>
                <Text style={[styles.badgeText, { color: theme.success }]}>免费</Text>
              </View>
            )}
            {model.member_only && !model.is_free && (
              <View style={[styles.modelBadge, styles.memberBadge]}>
                <Text style={[styles.badgeText, { color: '#D97706' }]}>会员</Text>
              </View>
            )}
            {model.super_member_only && (
              <View style={[styles.modelBadge, styles.superBadge]}>
                <Text style={[styles.badgeText, { color: '#7C3AED' }]}>超级会员</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {model.description && (
        <ThemedText variant="small" color={theme.textSecondary} style={styles.modelDesc}>
          {model.description}
        </ThemedText>
      )}

      <View style={styles.modelFooter}>
        <View style={styles.priceGroup}>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.priceLabel}>
            输入 ¥/百万tokens
          </ThemedText>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.priceValue}>
            {model.inputPrice}
          </ThemedText>
        </View>
        <View style={styles.priceGroup}>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.priceLabel}>
            输出 ¥/百万tokens
          </ThemedText>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.priceValue}>
            {model.outputPrice}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.selectButton}>
          <ThemedText variant="small" color={theme.buttonPrimaryText} style={styles.selectButtonText}>
            选择
          </ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderGpuCard = (gpu: GpuInstance) => (
    <TouchableOpacity
      key={gpu.id}
      style={styles.gpuCard}
      onPress={() => Alert.alert('提示', 'GPU服务即将上线')}
    >
      <View style={styles.gpuHeader}>
        <View style={styles.gpuIcon}>
          <FontAwesome6 name="microchip" size={20} color="#7C3AED" />
        </View>
        <View style={styles.gpuInfo}>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.gpuName}>
            {gpu.name}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.gpuSpecs}>
            {gpu.gpu_model} · {gpu.vram_gb}GB显存 · {gpu.available_instances}台可用
          </ThemedText>
        </View>
        <View style={styles.gpuPrice}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.gpuPriceValue}>
            ¥{gpu.pricePerHour}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.gpuPriceUnit}>
            /小时
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h3" color={theme.textPrimary}>
            模型市场
          </ThemedText>
        </ThemedView>

        {/* 提供商筛选 */}
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
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedProvider === provider.id ? theme.buttonPrimaryText : theme.textPrimary },
                ]}
              >
                {provider.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 分类筛选 */}
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
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedCategory === category.id ? theme.buttonPrimaryText : theme.textPrimary },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 对话模型 */}
        {(selectedCategory === 'all' || selectedCategory === 'chat') && chatModels.length > 0 && (
          <View>
            {selectedCategory === 'all' && (
              <View style={styles.categoryHeader}>
                <ThemedText variant="caption" color={theme.textSecondary} style={styles.categoryTitle}>
                  对话模型
                </ThemedText>
              </View>
            )}
            {chatModels.map(renderModelCard)}
          </View>
        )}

        {/* 图像模型 */}
        {(selectedCategory === 'all' || selectedCategory === 'image') && imageModels.length > 0 && (
          <View>
            {selectedCategory === 'all' && (
              <View style={styles.categoryHeader}>
                <ThemedText variant="caption" color={theme.textSecondary} style={styles.categoryTitle}>
                  图像生成
                </ThemedText>
              </View>
            )}
            {imageModels.map(renderModelCard)}
          </View>
        )}

        {/* 视频模型 */}
        {(selectedCategory === 'all' || selectedCategory === 'video') && videoModels.length > 0 && (
          <View>
            {selectedCategory === 'all' && (
              <View style={styles.categoryHeader}>
                <ThemedText variant="caption" color={theme.textSecondary} style={styles.categoryTitle}>
                  视频生成
                </ThemedText>
              </View>
            )}
            {videoModels.map(renderModelCard)}
          </View>
        )}

        {/* 音频模型 */}
        {(selectedCategory === 'all' || selectedCategory === 'audio') && audioModels.length > 0 && (
          <View>
            {selectedCategory === 'all' && (
              <View style={styles.categoryHeader}>
                <ThemedText variant="caption" color={theme.textSecondary} style={styles.categoryTitle}>
                  音频处理
                </ThemedText>
              </View>
            )}
            {audioModels.map(renderModelCard)}
          </View>
        )}

        {/* GPU实例 */}
        {gpuInstances.length > 0 && (
          <View>
            <View style={styles.categoryHeader}>
              <ThemedText variant="caption" color={theme.textSecondary} style={styles.categoryTitle}>
                GPU算力
              </ThemedText>
            </View>
            {gpuInstances.map(renderGpuCard)}
          </View>
        )}

        {filteredModels.length === 0 && gpuInstances.length === 0 && (
          <View style={styles.emptyState}>
            <FontAwesome6 name="box-open" size={48} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted} style={styles.emptyText}>
              暂无匹配的模型
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
