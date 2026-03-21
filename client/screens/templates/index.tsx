import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  prompt_template: string;
  preview_image: string;
  use_count: number;
}

const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  '场景': { icon: 'mountain-sun', color: '#8B5CF6' },
  '角色': { icon: 'user', color: '#EC4899' },
  '剧情': { icon: 'book-open', color: '#06B6D4' },
  '文案': { icon: 'feather', color: '#F59E0B' },
  '战斗': { icon: 'fire', color: '#EF4444' },
  '世界观': { icon: 'globe', color: '#10B981' },
};

export default function TemplatesScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [customParams, setCustomParams] = useState<Record<string, string>>({});

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      /**
       * 服务端文件：server/src/routes/templates.ts
       * 接口：GET /api/v1/templates
       * Query 参数：page?: number, limit?: number, category?: string
       */
      const url = activeCategory === 'all'
        ? `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/templates?limit=50`
        : `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/templates?limit=50&category=${activeCategory}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      console.error('Fetch templates error:', error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      /**
       * 服务端文件：server/src/routes/templates.ts
       * 接口：GET /api/v1/templates/categories/list
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/templates/categories/list`
      );
      const result = await response.json();

      if (result.success) {
        setCategories(['all', ...result.data]);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      fetchTemplates();
    }, [fetchCategories, fetchTemplates])
  );

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    // 提取模板中的占位符
    const placeholders = template.prompt_template.match(/\{([^}]+)\}/g) || [];
    const params: Record<string, string> = {};
    placeholders.forEach(p => {
      const key = p.replace(/[{}]/g, '');
      params[key] = '';
    });
    setCustomParams(params);
    setDetailModalVisible(true);
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;

    // 检查是否填写了所有参数
    const unfilled = Object.entries(customParams).filter(([_, v]) => !v.trim());
    if (unfilled.length > 0) {
      Alert.alert('提示', `请填写: ${unfilled.map(([k]) => k).join(', ')}`);
      return;
    }

    try {
      // 记录使用次数
      await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/templates/${selectedTemplate.id}/use`,
        { method: 'POST' }
      );

      // 替换占位符
      let prompt = selectedTemplate.prompt_template;
      Object.entries(customParams).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      });

      // 保存用户ID并跳转到聊天页面
      const userId = await AsyncStorage.getItem('userId');
      router.push('/', { 
        templatePrompt: prompt,
        templateName: selectedTemplate.name,
        userId: userId || undefined,
      });

      setDetailModalVisible(false);
    } catch (error) {
      console.error('Use template error:', error);
      Alert.alert('错误', '使用模板失败');
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="h4" color={theme.textPrimary}>模板市场</ThemedText>
        <ThemedText variant="label" color={theme.textMuted}>快速开始创作</ThemedText>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.neonLine}
        />
      </View>

      {/* Category Tab Bar */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={{ paddingRight: Spacing.lg }}
        >
          {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.tab,
              activeCategory === category && styles.tabActive,
              activeCategory === category
                ? { backgroundColor: theme.primary }
                : { borderColor: theme.border },
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <ThemedText
              variant="labelSmall"
              color={activeCategory === category ? '#fff' : theme.textMuted}
            >
              {category === 'all' ? '全部' : category}
            </ThemedText>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* 模板列表 */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}20` }]}>
              <FontAwesome6 name="folder-open" size={32} color={theme.primary} />
            </View>
            <ThemedText variant="body" color={theme.textMuted}>暂无模板</ThemedText>
          </View>
        ) : (
          templates.map(template => {
            const categoryConfig = CATEGORY_ICONS[template.category] || { icon: 'file', color: theme.primary };
            return (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleViewTemplate(template)}
                activeOpacity={0.8}
              >
                {/* 预览图 */}
                <Image
                  source={{ uri: template.preview_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' }}
                  style={styles.templateImage}
                  resizeMode="cover"
                />

                <View style={styles.templateContent}>
                  {/* Header */}
                  <View style={styles.templateHeader}>
                    <View style={[styles.templateIcon, { backgroundColor: `${categoryConfig.color}20` }]}>
                      <FontAwesome6 name={categoryConfig.icon as any} size={18} color={categoryConfig.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText variant="label" color={theme.textPrimary}>{template.name}</ThemedText>
                      <ThemedText variant="tiny" color={theme.textMuted}>{template.category}</ThemedText>
                    </View>
                  </View>

                  {/* Description */}
                  <ThemedText variant="body" color={theme.textSecondary} numberOfLines={2}>
                    {template.description}
                  </ThemedText>

                  {/* Meta */}
                  <View style={styles.templateMeta}>
                    <View style={styles.metaItem}>
                      <FontAwesome6 name="fire" size={12} color={theme.accent} />
                      <ThemedText variant="tiny" color={theme.textMuted}>
                        {template.use_count} 次使用
                      </ThemedText>
                    </View>
                    <View style={styles.metaItem}>
                      <FontAwesome6 name="tag" size={12} color={theme.textMuted} />
                      <ThemedText variant="tiny" color={theme.textMuted}>
                        {template.category}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Use Button */}
                <TouchableOpacity
                  style={[styles.useButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleViewTemplate(template)}
                >
                  <ThemedText variant="label" color="#fff">使用模板</ThemedText>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 详情Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDetailModalVisible(false)} />
          <ThemedView level="default" style={[styles.modalContent]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText variant="h4" color={theme.textPrimary}>
                {selectedTemplate?.name}
              </ThemedText>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedTemplate && (
                <>
                  <ThemedText variant="body" color={theme.textSecondary}>
                    {selectedTemplate.description}
                  </ThemedText>

                  {/* 参数输入 */}
                  {Object.keys(customParams).length > 0 && (
                    <View style={{ marginTop: Spacing.lg }}>
                      <ThemedText variant="label" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                        填写参数
                      </ThemedText>
                      {Object.keys(customParams).map(key => (
                        <View key={key} style={{ marginBottom: Spacing.md }}>
                          <ThemedText variant="labelSmall" color={theme.textSecondary} style={{ marginBottom: Spacing.xs }}>
                            {key}
                          </ThemedText>
                          <TextInput
                            style={{
                              backgroundColor: theme.backgroundTertiary,
                              borderRadius: 8,
                              padding: Spacing.md,
                              color: theme.textPrimary,
                            }}
                            placeholder={`请输入${key}`}
                            placeholderTextColor={theme.textMuted}
                            value={customParams[key]}
                            onChangeText={text => setCustomParams(prev => ({ ...prev, [key]: text }))}
                          />
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 预览提示词 */}
                  <View style={[styles.promptPreview, { backgroundColor: theme.backgroundTertiary }]}>
                    <ThemedText variant="labelSmall" color={theme.textMuted}>提示词预览</ThemedText>
                    <ThemedText variant="body" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
                      {selectedTemplate.prompt_template}
                    </ThemedText>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => setDetailModalVisible(false)}
              >
                <ThemedText variant="label" color={theme.textSecondary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.primary }]}
                onPress={handleUseTemplate}
              >
                <FontAwesome6 name="wand-magic-sparkles" size={14} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText variant="label" color="#fff">开始创作</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </Screen>
  );
}
