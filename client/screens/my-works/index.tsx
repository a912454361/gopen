import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
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

interface Work {
  id: number;
  user_id: number;
  project_id: string;
  project_title: string;
  project_type: string;
  service_type: string;
  service_name: string;
  content: string;
  content_type: string;
  image_url?: string;
  is_public: boolean;
  likes_count: number;
  created_at: string;
}

// 项目类型配置
const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  '古风场景': { icon: 'pagoda', color: '#4A5568' },
  '国风热血': { icon: 'fire', color: '#DC2626' },
  '唯美风': { icon: 'leaf', color: '#EC4899' },
  '仙侠唯美': { icon: 'cloud', color: '#8B5CF6' },
  '水墨场景': { icon: 'brush', color: '#1F2937' },
  '古风角色': { icon: 'user-ninja', color: '#059669' },
  '国风城池': { icon: 'landmark', color: '#D97706' },
  '仙侠场景': { icon: 'mountain-sun', color: '#6366F1' },
  '古风剧情': { icon: 'book-open', color: '#0891B2' },
};

export default function MyWorksScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'text' | 'image'>('all');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 获取用户ID
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  // 获取作品列表
  const fetchWorks = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      /**
       * 服务端文件：server/src/routes/works.ts
       * 接口：GET /api/v1/works/user/:userId
       * Query 参数：page?: number, limit?: number, type?: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works/user/${userId}?limit=100`
      );
      const result = await response.json();

      if (result.success) {
        setWorks(result.data || []);
      }
    } catch (error) {
      console.error('Fetch works error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchWorks();
      }
    }, [userId, fetchWorks])
  );

  // 按类型分组
  const groupedWorks = useMemo(() => {
    let filtered = works;
    if (activeTab === 'text') {
      filtered = works.filter(w => w.content_type === 'text');
    } else if (activeTab === 'image') {
      filtered = works.filter(w => w.content_type === 'image');
    }

    const groups: Record<string, Work[]> = {};
    filtered.forEach(work => {
      const type = work.project_type || '其他';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(work);
    });

    return groups;
  }, [works, activeTab]);

  // 统计数据
  const stats = useMemo(() => ({
    total: works.length,
    text: works.filter(w => w.content_type === 'text').length,
    image: works.filter(w => w.content_type === 'image').length,
    likes: works.reduce((sum, w) => sum + (w.likes_count || 0), 0),
  }), [works]);

  // 查看详情
  const handleViewDetail = (work: Work) => {
    setSelectedWork(work);
    setDetailModalVisible(true);
  };

  // 复制内容
  const handleCopy = async (content: string) => {
    await Clipboard.setStringAsync(content);
    Alert.alert('成功', '内容已复制到剪贴板');
  };

  // 导出为文本
  const handleExportText = async (work: Work) => {
    try {
      const fileName = `${work.project_title}_${work.service_name}_${Date.now()}.txt`;
      const filePath = `${(FileSystem as any).documentDirectory}${fileName}`;
      const content = `项目：${work.project_title}\n类型：${work.project_type}\n服务：${work.service_name}\n时间：${work.created_at}\n\n${work.content}`;

      await (FileSystem as any).writeAsStringAsync(filePath, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert('导出成功', `文件已保存到: ${filePath}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('导出失败', '请重试');
    }
  };

  // 分享
  const handleShare = async (work: Work) => {
    try {
      await Share.share({
        title: work.project_title,
        message: `【${work.project_title}】${work.service_name}\n\n${work.content.substring(0, 200)}...`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // 删除作品
  const handleDelete = async (work: Work) => {
    Alert.alert(
      '确认删除',
      '删除后无法恢复，确定要删除这个作品吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              /**
               * 服务端文件：server/src/routes/works.ts
               * 接口：DELETE /api/v1/works/:id
               */
              const response = await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works/${work.id}`,
                { method: 'DELETE' }
              );
              const result = await response.json();

              if (result.success) {
                setWorks(prev => prev.filter(w => w.id !== work.id));
                setDetailModalVisible(false);
                Alert.alert('成功', '作品已删除');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('删除失败', '请重试');
            }
          },
        },
      ]
    );
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const tabs = [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'text', label: '文字', count: stats.text },
    { key: 'image', label: '图片', count: stats.image },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* 导航栏 */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <ThemedText variant="h4" color={theme.textPrimary} style={styles.navTitle}>我的作品</ThemedText>
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="h4" color={theme.textPrimary}>我的作品</ThemedText>
        <ThemedText variant="label" color={theme.textMuted}>创作成果留存</ThemedText>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.neonLine}
        />

        {/* 统计数据 */}
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.primary}>{stats.total}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>总作品</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.accent}>{stats.text}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>文字创作</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.success}>{stats.likes}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>获赞</ThemedText>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              { borderColor: activeTab === tab.key ? theme.primary : theme.border },
            ]}
            onPress={() => setActiveTab(tab.key as 'all' | 'text' | 'image')}
          >
            <ThemedText
              variant="labelSmall"
              color={activeTab === tab.key ? '#fff' : theme.textMuted}
            >
              {tab.label} ({tab.count})
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* 作品列表 */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : works.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}20` }]}>
              <FontAwesome6 name="folder-open" size={32} color={theme.primary} />
            </View>
            <ThemedText variant="body" color={theme.textMuted}>还没有创作作品</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>去项目页面开始创作吧</ThemedText>
          </View>
        ) : (
          Object.entries(groupedWorks).map(([type, typeWorks]) => {
            const typeConfig = TYPE_CONFIG[type] || { icon: 'folder', color: theme.primary };
            return (
              <View key={type} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitleWrap}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${typeConfig.color}20` }]}>
                      <FontAwesome6 name={typeConfig.icon as any} size={14} color={typeConfig.color} />
                    </View>
                    <ThemedText variant="label" color={theme.textPrimary}>{type}</ThemedText>
                  </View>
                  <ThemedText variant="captionMedium" color={theme.textMuted}>
                    {typeWorks.length} 个作品
                  </ThemedText>
                </View>

                {typeWorks.map(work => (
                  <TouchableOpacity
                    key={work.id}
                    style={styles.workCard}
                    onPress={() => handleViewDetail(work)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.workHeader, { borderBottomColor: theme.border }]}>
                      <View style={[styles.workTypeIcon, { backgroundColor: `${typeConfig.color}20` }]}>
                        <FontAwesome6
                          name={work.content_type === 'image' ? 'image' : 'file-lines'}
                          size={16}
                          color={typeConfig.color}
                        />
                      </View>
                      <View style={styles.workTitleWrap}>
                        <ThemedText variant="label" color={theme.textPrimary} numberOfLines={1}>
                          {work.project_title}
                        </ThemedText>
                        <ThemedText variant="caption" color={theme.textMuted}>
                          {work.service_name}
                        </ThemedText>
                      </View>
                      <View style={styles.workActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: theme.backgroundTertiary }]}
                          onPress={() => handleCopy(work.content)}
                        >
                          <FontAwesome6 name="copy" size={14} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: theme.backgroundTertiary }]}
                          onPress={() => handleShare(work)}
                        >
                          <FontAwesome6 name="share" size={14} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.workContent}>
                      <ThemedText variant="body" color={theme.textSecondary} numberOfLines={3}>
                        {work.content}
                      </ThemedText>
                    </View>

                    <View style={[styles.workFooter, { borderTopColor: theme.border }]}>
                      <View style={styles.workDate}>
                        <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                        <ThemedText variant="tiny" color={theme.textMuted}>
                          {formatDate(work.created_at)}
                        </ThemedText>
                      </View>
                      <View style={styles.workStats}>
                        <View style={styles.workStat}>
                          <FontAwesome6 name="heart" size={12} color={theme.error} />
                          <ThemedText variant="tiny" color={theme.textMuted}>
                            {work.likes_count}
                          </ThemedText>
                        </View>
                        {work.is_public && (
                          <View style={styles.workStat}>
                            <FontAwesome6 name="globe" size={12} color={theme.success} />
                            <ThemedText variant="tiny" color={theme.textMuted}>公开</ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
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
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setDetailModalVisible(false)}
          />
          <ThemedView level="default" style={[styles.modalContent]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText variant="h4" color={theme.textPrimary}>
                {selectedWork?.project_title}
              </ThemedText>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedWork && (
                <>
                  <View style={styles.workService}>
                    <FontAwesome6 name="wand-magic-sparkles" size={14} color={theme.primary} />
                    <ThemedText variant="label" color={theme.textSecondary}>
                      {selectedWork.service_name}
                    </ThemedText>
                  </View>
                  <ThemedText variant="body" color={theme.textPrimary} style={styles.workText}>
                    {selectedWork.content}
                  </ThemedText>
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => selectedWork && handleExportText(selectedWork)}
              >
                <FontAwesome6 name="download" size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <ThemedText variant="label" color={theme.textSecondary}>导出</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => selectedWork && handleShare(selectedWork)}
              >
                <FontAwesome6 name="share-nodes" size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <ThemedText variant="label" color={theme.textSecondary}>分享</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: theme.error }]}
                onPress={() => selectedWork && handleDelete(selectedWork)}
              >
                <FontAwesome6 name="trash" size={14} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText variant="label" color="#fff">删除</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </Screen>
  );
}
