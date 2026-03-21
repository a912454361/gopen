import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
// @ts-ignore - react-native-sse lacks proper type definitions
import RNSSE from 'react-native-sse';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const CARD_HEIGHT = 200;

// 项目类型配置 - 对应Unsplash图片搜索关键词
const TYPE_CONFIG: Record<string, { icon: string; gradient: string[] }> = {
  '古风场景': { icon: 'pagoda', gradient: ['#4A5568', '#2D3748'] },
  '国风热血': { icon: 'fire', gradient: ['#DC2626', '#7F1D1D'] },
  '唯美风': { icon: 'leaf', gradient: ['#EC4899', '#831843'] },
  '仙侠唯美': { icon: 'cloud', gradient: ['#8B5CF6', '#4C1D95'] },
  '水墨场景': { icon: 'brush', gradient: ['#1F2937', '#111827'] },
  '古风角色': { icon: 'user-ninja', gradient: ['#059669', '#064E3B'] },
  '国风城池': { icon: 'landmark', gradient: ['#D97706', '#92400E'] },
  '仙侠场景': { icon: 'mountain-sun', gradient: ['#6366F1', '#312E81'] },
  '古风剧情': { icon: 'book-open', gradient: ['#0891B2', '#164E63'] },
};

// 真实Unsplash图片链接 - 中国风/古风/唯美风格
const PROJECT_IMAGES: Record<string, string> = {
  // 古风场景
  'a1': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop', // 中国古建筑
  'a2': 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400&h=300&fit=crop', // 江南水乡
  // 国风热血
  'a3': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // 山峰剑影
  'a4': 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=300&fit=crop', // 雪山
  // 唯美风
  'a5': 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=300&fit=crop', // 樱花
  'a6': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop', // 星空
  // 仙侠唯美
  'a7': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // 仙山
  'a8': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop', // 云海
  // 水墨场景
  'a9': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop', // 山水
  'a10': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', // 雾林
  // 古风角色
  'a11': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=400&h=300&fit=crop', // 古风人物
  'a12': 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop', // 书法
  // 待处理项目
  'p1': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', // 竹林
  'p2': 'https://images.unsplash.com/photo-1517309230475-6736d926b979?w=400&h=300&fit=crop', // 古镇夜景
  'p3': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop', // 武侠
  'p4': 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400&h=300&fit=crop', // 对决
  'p5': 'https://images.unsplash.com/photo-1522413171819-61c5fee00f52?w=400&h=300&fit=crop', // 落花
  'p6': 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=300&fit=crop', // 月光
  'p7': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop', // 雪山
  'p8': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop', // 湖泊
  'p9': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // 山水
  'p10': 'https://images.unsplash.com/photo-1580136607857-4c193a8f1e37?w=400&h=300&fit=crop', // 画作
};

// 精选项目数据 - 每个类型保留优质项目
const PROJECT_DATA = {
  active: [
    // 古风场景
    { id: 'a1', title: '山河入梦', type: '古风场景', progress: 92, assets: 56, lastUpdated: '刚刚' },
    { id: 'a2', title: '烟雨江南', type: '古风场景', progress: 85, assets: 48, lastUpdated: '20分钟前' },
    // 国风热血
    { id: 'a3', title: '剑定山河', type: '国风热血', progress: 95, assets: 68, lastUpdated: '刚刚' },
    { id: 'a4', title: '血染苍穹', type: '国风热血', progress: 88, assets: 52, lastUpdated: '15分钟前' },
    // 唯美风
    { id: 'a5', title: '樱花漫舞', type: '唯美风', progress: 78, assets: 42, lastUpdated: '35分钟前' },
    { id: 'a6', title: '星空梦境', type: '唯美风', progress: 72, assets: 38, lastUpdated: '1小时前' },
    // 仙侠唯美
    { id: 'a7', title: '蓬莱仙境', type: '仙侠唯美', progress: 82, assets: 46, lastUpdated: '30分钟前' },
    { id: 'a8', title: '云端仙宫', type: '仙侠唯美', progress: 75, assets: 44, lastUpdated: '1小时前' },
    // 水墨场景
    { id: 'a9', title: '一纸江南', type: '水墨场景', progress: 78, assets: 42, lastUpdated: '35分钟前' },
    { id: 'a10', title: '墨染山河', type: '水墨场景', progress: 58, assets: 28, lastUpdated: '2小时前' },
    // 古风角色
    { id: 'a11', title: '风月入怀', type: '古风角色', progress: 85, assets: 48, lastUpdated: '20分钟前' },
    { id: 'a12', title: '青衫烟雨', type: '古风角色', progress: 65, assets: 32, lastUpdated: '2小时前' },
  ],
  pending: [
    // 待处理 - 古风场景
    { id: 'p1', title: '竹影清风', type: '古风场景', progress: 35, assets: 15, lastUpdated: '5小时前' },
    { id: 'p2', title: '古镇夜市', type: '古风场景', progress: 20, assets: 8, lastUpdated: '8小时前' },
    // 待处理 - 国风热血
    { id: 'p3', title: '武林大会', type: '国风热血', progress: 0, assets: 0, lastUpdated: '待启动' },
    { id: 'p4', title: '江湖对决', type: '国风热血', progress: 0, assets: 0, lastUpdated: '待启动' },
    // 待处理 - 唯美风
    { id: 'p5', title: '落樱缤纷', type: '唯美风', progress: 15, assets: 6, lastUpdated: '6小时前' },
    { id: 'p6', title: '月光如水', type: '唯美风', progress: 0, assets: 0, lastUpdated: '待启动' },
    // 待处理 - 仙侠唯美
    { id: 'p7', title: '昆仑雪域', type: '仙侠唯美', progress: 25, assets: 10, lastUpdated: '4小时前' },
    { id: 'p8', title: '仙湖倒影', type: '仙侠唯美', progress: 0, assets: 0, lastUpdated: '待启动' },
    // 待处理 - 水墨场景
    { id: 'p9', title: '泼墨山水', type: '水墨场景', progress: 10, assets: 4, lastUpdated: '10小时前' },
    { id: 'p10', title: '丹青妙笔', type: '水墨场景', progress: 0, assets: 0, lastUpdated: '待启动' },
  ],
};

interface Project {
  id: string;
  title: string;
  type: string;
  progress: number;
  assets: number;
  lastUpdated: string;
}

// 根据项目类型和服务类型生成创作提示词
const generateProjectPrompt = (title: string, type: string, serviceType?: string): string => {
  const serviceNames: Record<string, string> = {
    'scene': '场景创作',
    'character': '角色设计',
    'story': '剧情编写',
    'music': '配乐推荐',
  };
  
  const serviceName = serviceType ? serviceNames[serviceType] : '创作';
  
  if (serviceType === 'scene') {
    return `请为《${title}》项目创作一个${type.replace(/角色|剧情/g, '场景')}设计方案。

要求：
1. 场景氛围：根据${type}风格设定
2. 色调：与风格匹配的配色方案
3. 元素：场景中的主要构成元素
4. 光影：光线和阴影的处理
5. 风格：整体艺术风格把控

请输出：
- 场景描述（200字）
- 主要元素清单
- 色彩搭配方案
- 氛围营造建议`;
  }
  
  if (serviceType === 'character') {
    return `请为《${title}》项目设计一个${type.replace(/场景|剧情/g, '角色')}。

要求：
1. 造型：符合${type}风格，细节精致
2. 配色：与主题相符的配色
3. 配饰：标志性装饰和道具
4. 气质：角色的性格特点
5. 背景：与角色相关的背景暗示

请输出：
- 角色设定（姓名、性格、背景）
- 外貌描述
- 服装设计方案
- 标志性特征`;
  }
  
  if (serviceType === 'story') {
    return `请为《${title}》项目构思一段${type.replace(/场景|角色/g, '剧情')}。

要求：
1. 背景：符合${type}的世界观设定
2. 人物：角色鲜活，性格鲜明
3. 情节：曲折动人，情感真挚
4. 语言：风格化的叙事语言
5. 主题：核心情感表达

请输出：
- 故事梗概
- 主要人物设定
- 关键情节设计
- 情感线索`;
  }
  
  if (serviceType === 'music') {
    return `请为《${title}》项目推荐合适的配乐。

项目类型：${type}

请推荐：
1. 主旋律风格建议（乐器、节奏、情绪）
2. 场景配乐清单（3-5首参考曲目风格）
3. 音效设计建议（环境音、特效音）
4. 整体音乐风格定位`;
  }
  
  return `请为《${title}》项目进行${serviceName}设计。

项目类型：${type}

请输出：
- 项目概述
- 设计理念
- 主要元素
- 实施方案`;
};

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
  const imageUrl = PROJECT_IMAGES[project.id] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
  
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

// Modal阶段类型
type ModalStage = 'services' | 'confirm' | 'creating' | 'result';

// 项目详情Modal组件
function ProjectDetailModal({
  visible,
  project,
  onClose,
}: {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [stage, setStage] = useState<ModalStage>('services');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [createdContent, setCreatedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sseRef = useRef<any>(null);
  const typingAnim = useMemo(() => new Animated.Value(1), []);

  // 重置状态
  React.useEffect(() => {
    if (!visible) {
      setStage('services');
      setSelectedService(null);
      setPrompt('');
      setCreatedContent('');
      setIsLoading(false);
    }
  }, [visible]);

  // 打字动画
  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(1);
    }
  }, [isLoading, typingAnim]);

  // 清理SSE连接
  React.useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  if (!project || !visible) return null;
  
  const typeConfig = TYPE_CONFIG[project.type] || TYPE_CONFIG['古风场景'];
  const imageUrl = PROJECT_IMAGES[project.id] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop';

  // 创作服务选项
  const createServices = [
    { id: 'scene', icon: 'image', title: '场景创作', desc: '生成唯美场景画面', color: '#8B5CF6' },
    { id: 'character', icon: 'user-astronaut', title: '角色设计', desc: '创作角色形象设定', color: '#EC4899' },
    { id: 'story', icon: 'book-open', title: '剧情编写', desc: '生成故事情节内容', color: '#06B6D4' },
    { id: 'music', icon: 'music', title: '配乐推荐', desc: '匹配氛围音乐', color: '#F59E0B' },
  ];

  // 选择服务 - 进入确认阶段
  const handleSelectService = (serviceId: string) => {
    const generatedPrompt = generateProjectPrompt(project.title, project.type, serviceId);
    setSelectedService(serviceId);
    setPrompt(generatedPrompt);
    setStage('confirm');
  };

  // 返回服务选择
  const handleBackToServices = () => {
    setStage('services');
    setSelectedService(null);
    setPrompt('');
  };

  // 确认创作 - 开始AI生成
  const handleConfirmCreate = async () => {
    setStage('creating');
    setIsLoading(true);
    setCreatedContent('');

    try {
      const url = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat/stream`;
      const sse = new RNSSE(url, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
        method: 'POST',
      });

      sseRef.current = sse;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sse.addEventListener('message', (event: any) => {
        const data = event.data;
        
        if (data === '[DONE]') {
          setIsLoading(false);
          setStage('result');
          sse.close();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            setCreatedContent(prev => prev + parsed.content);
          }
        } catch {
          if (data && data !== '[DONE]') {
            setCreatedContent(prev => prev + data);
          }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sse.addEventListener('error', (_event: any) => {
        setCreatedContent('连接错误，请重试');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Create error:', error);
      setCreatedContent('连接错误，请重试');
      setIsLoading(false);
    }
  };

  // 重新创作
  const handleRecreate = () => {
    setStage('confirm');
    setCreatedContent('');
  };

  // 渲染不同阶段的内容
  const renderContent = () => {
    switch (stage) {
      case 'services':
        return (
          <>
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
                  <ThemedText variant="label" color={theme.textSecondary}>{project.progress}%</ThemedText>
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
                    onPress={() => handleSelectService(service.id)}
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
          </>
        );

      case 'confirm':
        return (
          <>
            {/* 项目信息 */}
            <View style={styles.modalInfo}>
              <View style={[styles.modalTypeTag, { backgroundColor: typeConfig.gradient[0] }]}>
                <FontAwesome6 name={typeConfig.icon as any} size={12} color="#fff" />
                <ThemedText variant="labelSmall" color="#fff">{project.type}</ThemedText>
              </View>
              <ThemedText variant="h2" color={theme.textPrimary}>{project.title}</ThemedText>
            </View>
            
            {/* 提示词预览 */}
            <View style={styles.promptPreview}>
              <View style={styles.promptHeader}>
                <FontAwesome6 name="wand-magic-sparkles" size={16} color={theme.primary} />
                <ThemedText variant="label" color={theme.textPrimary}>创作提示</ThemedText>
              </View>
              <ScrollView style={styles.promptScroll} nestedScrollEnabled>
                <ThemedText variant="body" color={theme.textSecondary}>{prompt}</ThemedText>
              </ScrollView>
            </View>
            
            {/* 操作按钮 */}
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmButton, { borderColor: theme.border }]}
                onPress={handleBackToServices}
              >
                <ThemedText variant="label" color={theme.textSecondary}>返回</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmPrimary, { backgroundColor: theme.primary }]}
                onPress={handleConfirmCreate}
              >
                <FontAwesome6 name="paper-plane" size={14} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText variant="label" color="#fff">开始创作</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'creating':
      case 'result':
        return (
          <>
            {/* 项目标题 */}
            <View style={styles.modalInfo}>
              <ThemedText variant="h3" color={theme.textPrimary}>{project.title}</ThemedText>
              <ThemedText variant="label" color={theme.textMuted}>
                {createServices.find(s => s.id === selectedService)?.title}
              </ThemedText>
            </View>
            
            {/* 创作结果 */}
            <ScrollView style={styles.resultScroll} nestedScrollEnabled>
              {createdContent ? (
                <View style={[styles.resultContent, { backgroundColor: theme.backgroundTertiary }]}>
                  <ThemedText variant="body" color={theme.textPrimary}>{createdContent}</ThemedText>
                </View>
              ) : isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={{ opacity: typingAnim }}>
                    <View style={[styles.loadingDots, { backgroundColor: theme.primary }]}>
                      <ThemedText variant="body" color={theme.textSecondary}>AI 正在创作中</ThemedText>
                    </View>
                  </Animated.View>
                </View>
              ) : null}
              {isLoading && createdContent && (
                <ThemedText variant="body" color={theme.textMuted}>▌</ThemedText>
              )}
            </ScrollView>
            
            {/* 操作按钮 */}
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmButton, { borderColor: theme.border }]}
                onPress={handleRecreate}
                disabled={isLoading}
              >
                <FontAwesome6 name="rotate" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
                <ThemedText variant="label" color={theme.textSecondary}>重新创作</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmPrimary, { backgroundColor: theme.primary }]}
                onPress={onClose}
              >
                <ThemedText variant="label" color="#fff">完成</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          {/* 封面图片 - 仅服务选择阶段显示 */}
          {stage === 'services' && (
            <>
              <Image 
                source={{ uri: imageUrl }}
                style={styles.modalImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', theme.backgroundDefault]}
                style={styles.modalImageGradient}
              />
            </>
          )}
          
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome6 name="xmark" size={20} color={stage === 'services' ? '#fff' : theme.textPrimary} />
          </TouchableOpacity>
          
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

export default function ProjectsScreen() {
  const { theme } = useTheme();
  
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%' as const,
    minHeight: 400,
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
  // 新阶段样式
  promptPreview: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    maxHeight: 200,
  },
  promptHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  promptScroll: {
    maxHeight: 150,
  },
  confirmActions: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  confirmPrimary: {
    borderWidth: 0,
  },
  resultScroll: {
    flex: 1,
    padding: Spacing.lg,
  },
  resultContent: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing['3xl'],
  },
  loadingDots: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
};
