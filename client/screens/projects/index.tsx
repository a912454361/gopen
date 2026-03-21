import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const CARD_HEIGHT = 200;

// 项目类型配置 - 对应Unsplash图片搜索关键词
const TYPE_CONFIG: Record<string, { icon: string; imageKeyword: string; gradient: string[] }> = {
  '古风场景': { icon: 'pagoda', imageKeyword: 'chinese-ancient-architecture', gradient: ['#4A5568', '#2D3748'] },
  '国风热血': { icon: 'fire', imageKeyword: 'martial-arts-sword', gradient: ['#DC2626', '#7F1D1D'] },
  '唯美风': { icon: 'leaf', imageKeyword: 'cherry-blossom-spring', gradient: ['#EC4899', '#831843'] },
  '仙侠唯美': { icon: 'cloud', imageKeyword: 'misty-mountain-china', gradient: ['#8B5CF6', '#4C1D95'] },
  '水墨场景': { icon: 'brush', imageKeyword: 'chinese-ink-painting', gradient: ['#1F2937', '#111827'] },
  '古风角色': { icon: 'user-ninja', imageKeyword: 'chinese-warrior', gradient: ['#059669', '#064E3B'] },
  '国风城池': { icon: 'landmark', imageKeyword: 'forbidden-city', gradient: ['#D97706', '#92400E'] },
  '仙侠场景': { icon: 'mountain-sun', imageKeyword: 'heavenly-mountain', gradient: ['#6366F1', '#312E81'] },
  '古风剧情': { icon: 'book-open', imageKeyword: 'ancient-scroll', gradient: ['#0891B2', '#164E63'] },
};

// 精选项目数据 - 每个类型保留优质项目
const PROJECT_DATA = {
  active: [
    // 古风场景
    { id: 'a1', title: '山河入梦', type: '古风场景', progress: 92, assets: 56, lastUpdated: '刚刚', imageId: 'chinese-ancient-village-mist' },
    { id: 'a2', title: '烟雨江南', type: '古风场景', progress: 85, assets: 48, lastUpdated: '20分钟前', imageId: 'jiangnan-water-town' },
    // 国风热血
    { id: 'a3', title: '剑定山河', type: '国风热血', progress: 95, assets: 68, lastUpdated: '刚刚', imageId: 'sword-warrior-battle' },
    { id: 'a4', title: '血染苍穹', type: '国风热血', progress: 88, assets: 52, lastUpdated: '15分钟前', imageId: 'epic-battle-china' },
    // 唯美风
    { id: 'a5', title: '樱花漫舞', type: '唯美风', progress: 78, assets: 42, lastUpdated: '35分钟前', imageId: 'cherry-blossom-pink' },
    { id: 'a6', title: '星空梦境', type: '唯美风', progress: 72, assets: 38, lastUpdated: '1小时前', imageId: 'starry-night-dream' },
    // 仙侠唯美
    { id: 'a7', title: '蓬莱仙境', type: '仙侠唯美', progress: 82, assets: 46, lastUpdated: '30分钟前', imageId: 'fairyland-mountain' },
    { id: 'a8', title: '云端仙宫', type: '仙侠唯美', progress: 75, assets: 44, lastUpdated: '1小时前', imageId: 'heavenly-palace-clouds' },
    // 水墨场景
    { id: 'a9', title: '一纸江南', type: '水墨场景', progress: 78, assets: 42, lastUpdated: '35分钟前', imageId: 'ink-painting-landscape' },
    { id: 'a10', title: '墨染山河', type: '水墨场景', progress: 58, assets: 28, lastUpdated: '2小时前', imageId: 'chinese-ink-mountain' },
    // 古风角色
    { id: 'a11', title: '风月入怀', type: '古风角色', progress: 85, assets: 48, lastUpdated: '20分钟前', imageId: 'chinese-swordsman' },
    { id: 'a12', title: '青衫烟雨', type: '古风角色', progress: 65, assets: 32, lastUpdated: '2小时前', imageId: 'ancient-scholar' },
  ],
  pending: [
    // 待处理 - 古风场景
    { id: 'p1', title: '竹影清风', type: '古风场景', progress: 35, assets: 15, lastUpdated: '5小时前', imageId: 'bamboo-forest-mist' },
    { id: 'p2', title: '古镇夜市', type: '古风场景', progress: 20, assets: 8, lastUpdated: '8小时前', imageId: 'ancient-town-night' },
    // 待处理 - 国风热血
    { id: 'p3', title: '武林大会', type: '国风热血', progress: 0, assets: 0, lastUpdated: '待启动', imageId: 'martial-arts-tournament' },
    { id: 'p4', title: '江湖对决', type: '国风热血', progress: 0, assets: 0, lastUpdated: '待启动', imageId: 'sword-fight-duel' },
    // 待处理 - 唯美风
    { id: 'p5', title: '落樱缤纷', type: '唯美风', progress: 15, assets: 6, lastUpdated: '6小时前', imageId: 'falling-petals' },
    { id: 'p6', title: '月光如水', type: '唯美风', progress: 0, assets: 0, lastUpdated: '待启动', imageId: 'moonlight-water' },
    // 待处理 - 仙侠唯美
    { id: 'p7', title: '昆仑雪域', type: '仙侠唯美', progress: 25, assets: 10, lastUpdated: '4小时前', imageId: 'snow-mountain-mystic' },
    { id: 'p8', title: '仙湖倒影', type: '仙侠唯美', progress: 0, assets: 0, lastUpdated: '待启动', imageId: 'fairy-lake-reflection' },
    // 待处理 - 水墨场景
    { id: 'p9', title: '泼墨山水', type: '水墨场景', progress: 10, assets: 4, lastUpdated: '10小时前', imageId: 'splash-ink-mountain' },
    { id: 'p10', title: '丹青妙笔', type: '水墨场景', progress: 0, assets: 0, lastUpdated: '待启动', imageId: 'traditional-painting' },
  ],
};

interface Project {
  id: string;
  title: string;
  type: string;
  progress: number;
  assets: number;
  lastUpdated: string;
  imageId: string;
}

// 项目卡片组件
function ProjectCard({ 
  project, 
  onPress 
}: { 
  project: Project; 
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const typeConfig = TYPE_CONFIG[project.type] || TYPE_CONFIG['古风场景'];
  const imageUrl = `https://source.unsplash.com/400x300/?${typeConfig.imageKeyword}&sig=${project.id}`;
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          width: CARD_WIDTH,
          backgroundColor: theme.backgroundDefault,
          borderColor: project.progress > 50 ? theme.primary : theme.border,
        }
      ]} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* 封面图片 */}
      <Image 
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {/* 渐变遮罩 */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.cardGradient}
      />
      {/* 类型标签 */}
      <View style={[styles.typeTag, { backgroundColor: typeConfig.gradient[0] }]}>
        <FontAwesome6 name={typeConfig.icon as any} size={10} color="#fff" />
        <ThemedText variant="tiny" color="#fff">{project.type}</ThemedText>
      </View>
      {/* 标题 */}
      <View style={styles.cardTitleWrap}>
        <ThemedText variant="title" color="#fff" numberOfLines={1}>{project.title}</ThemedText>
      </View>
      {/* 进度条 */}
      <View style={styles.cardProgress}>
        <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <LinearGradient
            colors={typeConfig.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${project.progress}%` }]}
          />
        </View>
        <ThemedText variant="tiny" color="rgba(255,255,255,0.8)">{project.progress}%</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// 项目详情Modal组件
function ProjectDetailModal({
  visible,
  project,
  onClose,
  onStartCreate,
}: {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onStartCreate: (serviceType: string) => void;
}) {
  const { theme } = useTheme();
  // 使用 useMemo 创建动画值，确保只创建一次
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  
  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  if (!project) return null;
  
  const typeConfig = TYPE_CONFIG[project.type] || TYPE_CONFIG['古风场景'];
  const imageUrl = `https://source.unsplash.com/800x400/?${typeConfig.imageKeyword}&sig=${project.id}`;

  // 创作服务选项
  const createServices = [
    { id: 'scene', icon: 'image', title: '场景创作', desc: '生成唯美场景画面', color: '#8B5CF6' },
    { id: 'character', icon: 'user-astronaut', title: '角色设计', desc: '创作角色形象设定', color: '#EC4899' },
    { id: 'story', icon: 'book-open', title: '剧情编写', desc: '生成故事情节内容', color: '#06B6D4' },
    { id: 'music', icon: 'music', title: '配乐推荐', desc: '匹配氛围音乐', color: '#F59E0B' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          {/* 封面图片 */}
          <Image 
            source={{ uri: imageUrl }}
            style={styles.modalImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', theme.backgroundDefault]}
            style={styles.modalImageGradient}
          />
          
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome6 name="xmark" size={20} color="#fff" />
          </TouchableOpacity>
          
          {/* 项目信息 */}
          <View style={styles.modalInfo}>
            <View style={[styles.modalTypeTag, { backgroundColor: typeConfig.gradient[0] }]}>
              <FontAwesome6 name={typeConfig.icon as any} size={12} color="#fff" />
              <ThemedText variant="labelSmall" color="#fff">{project.type}</ThemedText>
            </View>
            <ThemedText variant="h2" color={theme.textPrimary}>{project.title}</ThemedText>
            
            {/* 统计信息 */}
            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <FontAwesome6 name="cube" size={14} color={theme.primary} />
                <ThemedText variant="label" color={theme.textSecondary}>{project.assets} 资源</ThemedText>
              </View>
              <View style={styles.modalStatItem}>
                <FontAwesome6 name="clock" size={14} color={theme.accent} />
                <ThemedText variant="label" color={theme.textSecondary}>{project.lastUpdated}</ThemedText>
              </View>
              <View style={styles.modalStatItem}>
                <FontAwesome6 name="chart-line" size={14} color={theme.success} />
                <ThemedText variant="label" color={theme.textSecondary}>{project.progress}% 完成</ThemedText>
              </View>
            </View>
            
            {/* 进度条 */}
            <View style={styles.modalProgressWrap}>
              <View style={[styles.modalProgressBar, { backgroundColor: theme.backgroundTertiary }]}>
                <LinearGradient
                  colors={typeConfig.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.modalProgressFill, { width: `${project.progress}%` }]}
                />
              </View>
            </View>
          </View>
          
          {/* 创作服务 */}
          <View style={styles.modalServices}>
            <ThemedText variant="label" color={theme.textPrimary}>选择创作服务</ThemedText>
            <View style={styles.servicesGrid}>
              {createServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceCard, { backgroundColor: theme.backgroundTertiary }]}
                  activeOpacity={0.7}
                  onPress={() => onStartCreate(service.id)}
                >
                  <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
                    <FontAwesome6 name={service.icon as any} size={20} color={service.color} />
                  </View>
                  <ThemedText variant="labelSmall" color={theme.textPrimary}>{service.title}</ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>{service.desc}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function ProjectsScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();
  
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 按类型分组项目
  const groupedProjects = useMemo(() => {
    const projects = activeTab === 'all' 
      ? [...PROJECT_DATA.active, ...PROJECT_DATA.pending]
      : activeTab === 'active' 
        ? PROJECT_DATA.active 
        : PROJECT_DATA.pending;
    
    // 按类型分组
    const groups: Record<string, Project[]> = {};
    projects.forEach(project => {
      if (!groups[project.type]) {
        groups[project.type] = [];
      }
      groups[project.type].push(project);
    });
    
    return groups;
  }, [activeTab]);

  // 统计数据
  const stats = useMemo(() => ({
    active: PROJECT_DATA.active.length,
    pending: PROJECT_DATA.pending.length,
    total: PROJECT_DATA.active.length + PROJECT_DATA.pending.length,
  }), []);

  const handleProjectPress = (project: Project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const handleStartCreate = (serviceType: string) => {
    if (selectedProject) {
      setModalVisible(false);
      // 跳转到聊天页面，传递项目信息和服务类型
      router.push('/', { 
        projectId: selectedProject.id, 
        projectTitle: selectedProject.title,
        projectType: selectedProject.type,
        serviceType,
        autoCreate: 'true'
      });
    }
  };

  const tabs = [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'active', label: '进行中', count: stats.active },
    { key: 'pending', label: '待处理', count: stats.pending },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="h4" color={theme.textPrimary}>
          项目仪表盘
        </ThemedText>
        <ThemedText variant="label" color={theme.textMuted}>
          创作工作空间
        </ThemedText>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.neonLine}
        />
      </View>

      {/* Tab 切换 */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { 
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              }
            ]}
            onPress={() => setActiveTab(tab.key as 'all' | 'active' | 'pending')}
          >
            <ThemedText 
              variant="labelSmall" 
              color={activeTab === tab.key ? '#fff' : theme.textMuted}
            >
              {tab.label}
            </ThemedText>
            <View style={[
              styles.tabCount,
              { backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : theme.backgroundTertiary }
            ]}>
              <ThemedText 
                variant="tiny" 
                color={activeTab === tab.key ? '#fff' : theme.textMuted}
              >
                {tab.count}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 分类项目列表 */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedProjects).map(([type, projects]) => (
          <View key={type} style={styles.categorySection}>
            {/* 分类标题 */}
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleWrap}>
                <View style={[
                  styles.categoryIcon, 
                  { backgroundColor: `${TYPE_CONFIG[type]?.gradient[0] || theme.primary}20` }
                ]}>
                  <FontAwesome6 
                    name={TYPE_CONFIG[type]?.icon as any || 'folder'} 
                    size={14} 
                    color={TYPE_CONFIG[type]?.gradient[0] || theme.primary} 
                  />
                </View>
                <ThemedText variant="label" color={theme.textPrimary}>{type}</ThemedText>
              </View>
              <ThemedText variant="captionMedium" color={theme.textMuted}>
                {projects.length} 个项目
              </ThemedText>
            </View>
            
            {/* 横向滚动卡片 */}
            <View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}
              >
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onPress={() => handleProjectPress(project)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 项目详情Modal */}
      <ProjectDetailModal
        visible={modalVisible}
        project={selectedProject}
        onClose={() => setModalVisible(false)}
        onStartCreate={handleStartCreate}
      />
    </Screen>
  );
}

// 组件内部样式
const styles = {
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    alignItems: 'center' as const,
  },
  neonLine: {
    height: 2,
    borderRadius: 1,
    marginTop: Spacing.lg,
    width: 120,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden' as const,
    marginRight: Spacing.md,
  },
  cardImage: {
    width: '100%' as const,
    height: '100%' as const,
    position: 'absolute' as const,
  },
  cardGradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  typeTag: {
    position: 'absolute' as const,
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  cardTitleWrap: {
    position: 'absolute' as const,
    bottom: 40,
    left: Spacing.md,
    right: Spacing.md,
  },
  cardProgress: {
    position: 'absolute' as const,
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%' as const,
    borderRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  tabCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  categoryTitleWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  cardsRow: {
    paddingRight: Spacing.lg,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end' as const,
  },
  modalBackdrop: {
    ...{ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 },
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%' as const,
    overflow: 'hidden' as const,
  },
  modalImage: {
    width: '100%' as const,
    height: 200,
  },
  modalImageGradient: {
    position: 'absolute' as const,
    top: 150,
    left: 0,
    right: 0,
    height: 50,
  },
  closeButton: {
    position: 'absolute' as const,
    top: Spacing.lg,
    right: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalInfo: {
    padding: Spacing.lg,
  },
  modalTypeTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  modalStats: {
    flexDirection: 'row' as const,
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  modalStatItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  modalProgressWrap: {
    marginTop: Spacing.lg,
  },
  modalProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  modalProgressFill: {
    height: '100%' as const,
    borderRadius: 4,
  },
  modalServices: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  servicesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  serviceCard: {
    width: '47%' as const,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center' as const,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
};
