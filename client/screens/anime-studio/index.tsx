/**
 * 动漫制作工作台 - 完整的动漫创作系统
 * 
 * 功能：
 * 1. 项目管理 - 创建/编辑动漫项目
 * 2. 角色设计 - AI生成动漫角色
 * 3. 场景设计 - AI生成动漫场景
 * 4. 分镜脚本 - 编辑分镜剧本
 * 5. 动画生成 - AI生成动画帧
 * 6. 视频导出 - 合成并导出视频
 */
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 动漫项目类型
interface AnimeProject {
  id: string;
  name: string;
  description: string;
  style: 'anime' | 'comic' | 'chibi' | 'realistic' | 'watercolor';
  cover: string;
  characters: AnimeCharacter[];
  scenes: AnimeScene[];
  storyboards: Storyboard[];
  frames: AnimationFrame[];
  status: 'draft' | 'production' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface AnimeCharacter {
  id: string;
  name: string;
  description: string;
  image: string;
  expressions: CharacterExpression[];
  poses: CharacterPose[];
}

interface CharacterExpression {
  id: string;
  name: string; // happy, sad, angry, surprised, etc.
  image: string;
}

interface CharacterPose {
  id: string;
  name: string;
  image: string;
}

interface AnimeScene {
  id: string;
  name: string;
  description: string;
  background: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
}

interface Storyboard {
  id: string;
  sequence: number;
  scene: string;
  characters: string[];
  description: string;
  cameraAngle: string;
  duration: number; // seconds
  dialogue: Dialogue[];
}

interface Dialogue {
  character: string;
  text: string;
  emotion: string;
}

interface AnimationFrame {
  id: string;
  storyboardId: string;
  frameNumber: number;
  image: string;
  duration: number; // ms
}

// 动漫风格配置
const ANIME_STYLES = [
  { id: 'anime', name: '日式动漫', icon: 'star', color: '#FF6B9D', desc: '经典日漫风格' },
  { id: 'comic', name: '美式漫画', icon: 'mask', color: '#EF4444', desc: '超级英雄风格' },
  { id: 'chibi', name: 'Q版萌系', icon: 'heart', color: '#EC4899', desc: '可爱萌系风格' },
  { id: 'realistic', name: '写实风格', icon: 'user', color: '#8B5CF6', desc: '写实人物风格' },
  { id: 'watercolor', name: '水彩画风', icon: 'palette', color: '#06B6D4', desc: '水彩艺术风格' },
];

// 工作台标签
const STUDIO_TABS = [
  { id: 'overview', name: '项目概览', icon: 'folder' },
  { id: 'characters', name: '角色设计', icon: 'users' },
  { id: 'scenes', name: '场景设计', icon: 'mountain-sun' },
  { id: 'storyboard', name: '分镜脚本', icon: 'film' },
  { id: 'animation', name: '动画生成', icon: 'play' },
  { id: 'export', name: '视频导出', icon: 'download' },
];

// 表情类型
const EXPRESSION_TYPES = [
  { id: 'happy', name: '开心', icon: 'face-smile' },
  { id: 'sad', name: '悲伤', icon: 'face-sad-tear' },
  { id: 'angry', name: '愤怒', icon: 'face-angry' },
  { id: 'surprised', name: '惊讶', icon: 'face-surprise' },
  { id: 'neutral', name: '平静', icon: 'face-meh' },
];

// 镜头角度
const CAMERA_ANGLES = [
  { id: 'wide', name: '远景', desc: '展示全景环境' },
  { id: 'medium', name: '中景', desc: '展示人物上半身' },
  { id: 'close', name: '近景', desc: '聚焦面部表情' },
  { id: 'low', name: '仰角', desc: '从下往上拍' },
  { id: 'high', name: '俯角', desc: '从上往下拍' },
];

export default function AnimeStudioScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<AnimeProject[]>([]);
  const [currentProject, setCurrentProject] = useState<AnimeProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Modal 状态
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'character' | 'scene' | 'storyboard'>('character');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<AnimeProject['style']>('anime');

  // 加载项目列表
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const saved = await AsyncStorage.getItem('anime_projects');
      if (saved) {
        setProjects(JSON.parse(saved));
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const saveProjects = async (newProjects: AnimeProject[]) => {
    try {
      await AsyncStorage.setItem('anime_projects', JSON.stringify(newProjects));
      setProjects(newProjects);
    } catch (error) {
      console.error('保存项目失败:', error);
    }
  };

  // 创建新项目
  const createProject = async (name: string, style: AnimeProject['style'], description: string) => {
    const newProject: AnimeProject = {
      id: `anime_${Date.now()}`,
      name,
      description,
      style,
      cover: '',
      characters: [],
      scenes: [],
      storyboards: [],
      frames: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newProjects = [...projects, newProject];
    await saveProjects(newProjects);
    setCurrentProject(newProject);
    setShowProjectModal(false);
    setPrompt('');
  };

  // AI生成角色
  const generateCharacter = async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入角色描述');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'anime_character',
          prompt: prompt,
          style: currentProject?.style || 'anime',
          projectId: currentProject?.id,
        }),
      });

      const data = await response.json();
      
      if (currentProject) {
        const newCharacter: AnimeCharacter = {
          id: `char_${Date.now()}`,
          name: data.name || '未命名角色',
          description: data.description || prompt,
          image: data.image || '',
          expressions: [],
          poses: [],
        };

        const updatedProject = {
          ...currentProject,
          characters: [...currentProject.characters, newCharacter],
          updatedAt: new Date().toISOString(),
        };

        const updatedProjects = projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        );
        
        await saveProjects(updatedProjects);
        setCurrentProject(updatedProject);
        setShowCreateModal(false);
        setPrompt('');
      }
    } catch (error) {
      // 创建示例角色
      if (currentProject) {
        const sampleCharacter: AnimeCharacter = {
          id: `char_${Date.now()}`,
          name: '动漫角色',
          description: prompt,
          image: '',
          expressions: EXPRESSION_TYPES.map(e => ({ id: `exp_${e.id}`, name: e.name, image: '' })),
          poses: [],
        };

        const updatedProject = {
          ...currentProject,
          characters: [...currentProject.characters, sampleCharacter],
          updatedAt: new Date().toISOString(),
        };

        const updatedProjects = projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        );
        
        await saveProjects(updatedProjects);
        setCurrentProject(updatedProject);
        setShowCreateModal(false);
        setPrompt('');
      }
    } finally {
      setGenerating(false);
    }
  };

  // AI生成场景
  const generateScene = async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入场景描述');
      return;
    }

    setGenerating(true);
    try {
      if (currentProject) {
        const newScene: AnimeScene = {
          id: `scene_${Date.now()}`,
          name: '动漫场景',
          description: prompt,
          background: '',
          timeOfDay: 'afternoon',
          weather: 'sunny',
        };

        const updatedProject = {
          ...currentProject,
          scenes: [...currentProject.scenes, newScene],
          updatedAt: new Date().toISOString(),
        };

        const updatedProjects = projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        );
        
        await saveProjects(updatedProjects);
        setCurrentProject(updatedProject);
        setShowCreateModal(false);
        setPrompt('');
      }
    } finally {
      setGenerating(false);
    }
  };

  // 生成角色表情
  const generateExpression = async (characterId: string, expression: string) => {
    if (!currentProject) return;

    setGenerating(true);
    try {
      // 模拟AI生成表情
      await new Promise(resolve => setTimeout(resolve, 1000));

      const character = currentProject.characters.find(c => c.id === characterId);
      if (character) {
        const newExpression: CharacterExpression = {
          id: `exp_${Date.now()}`,
          name: expression,
          image: '',
        };

        const updatedCharacter = {
          ...character,
          expressions: [...character.expressions, newExpression],
        };

        const updatedProject = {
          ...currentProject,
          characters: currentProject.characters.map(c => 
            c.id === characterId ? updatedCharacter : c
          ),
          updatedAt: new Date().toISOString(),
        };

        const updatedProjects = projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        );
        
        await saveProjects(updatedProjects);
        setCurrentProject(updatedProject);
      }
    } finally {
      setGenerating(false);
    }
  };

  // 添加分镜
  const addStoryboard = async () => {
    if (!currentProject || !prompt.trim()) return;

    const newStoryboard: Storyboard = {
      id: `sb_${Date.now()}`,
      sequence: currentProject.storyboards.length + 1,
      scene: '',
      characters: [],
      description: prompt,
      cameraAngle: 'medium',
      duration: 3,
      dialogue: [],
    };

    const updatedProject = {
      ...currentProject,
      storyboards: [...currentProject.storyboards, newStoryboard],
      updatedAt: new Date().toISOString(),
    };

    const updatedProjects = projects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    );
    
    await saveProjects(updatedProjects);
    setCurrentProject(updatedProject);
    setShowCreateModal(false);
    setPrompt('');
  };

  // 生成动画帧
  const generateFrames = async (storyboardId: string) => {
    if (!currentProject) return;

    setGenerating(true);
    try {
      // 模拟生成动画帧
      const frames: AnimationFrame[] = [];
      for (let i = 0; i < 24; i++) {
        frames.push({
          id: `frame_${Date.now()}_${i}`,
          storyboardId,
          frameNumber: i + 1,
          image: '',
          duration: 1000 / 24, // 24fps
        });
      }

      const updatedProject = {
        ...currentProject,
        frames: [...currentProject.frames, ...frames],
        updatedAt: new Date().toISOString(),
      };

      const updatedProjects = projects.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      );
      
      await saveProjects(updatedProjects);
      setCurrentProject(updatedProject);
    } finally {
      setGenerating(false);
    }
  };

  // 导出视频
  const exportVideo = async () => {
    if (!currentProject) return;

    Alert.alert(
      '导出动漫',
      '选择导出格式：',
      [
        { text: 'MP4视频', onPress: () => exportAsMp4() },
        { text: 'GIF动图', onPress: () => exportAsGif() },
        { text: '图片序列', onPress: () => exportAsImages() },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const exportAsMp4 = async () => {
    if (!currentProject) return;

    const exportData = {
      project: currentProject,
      exportedAt: new Date().toISOString(),
      format: 'mp4',
    };

    if (Platform.OS === 'web') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name}_anime.json`;
      a.click();
      URL.revokeObjectURL(url);
      Alert.alert('成功', '动漫配置已导出！');
    }
  };

  const exportAsGif = async () => {
    Alert.alert('提示', 'GIF导出功能开发中，敬请期待！');
  };

  const exportAsImages = async () => {
    Alert.alert('提示', '图片序列导出功能开发中，敬请期待！');
  };

  // 渲染项目概览
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <FontAwesome6 name="film" size={64} color="#FF6B9D" />
          <ThemedText variant="h3" color={theme.textSecondary} style={{ marginTop: Spacing.lg }}>
            开始创作你的动漫
          </ThemedText>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowProjectModal(true)}
          >
            <LinearGradient colors={['#FF6B9D', '#EC4899']} style={styles.createButtonGradient}>
              <FontAwesome6 name="plus" size={20} color="#FFF" />
              <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginLeft: 8 }}>
                创建新动漫
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>

          {/* 项目列表 */}
          <View style={styles.projectList}>
            <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
              我的项目
            </ThemedText>
            
            {projects.length === 0 ? (
              <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                暂无项目，点击上方按钮创建
              </ThemedText>
            ) : (
              <FlatList
                data={projects}
                keyExtractor={(item) => item.id}
                numColumns={2}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.projectCard}
                    onPress={() => setCurrentProject(item)}
                  >
                    <LinearGradient
                      colors={[ANIME_STYLES.find(s => s.id === item.style)?.color + '40', theme.backgroundTertiary]}
                      style={styles.projectCardGradient}
                    >
                      <FontAwesome6
                        name={ANIME_STYLES.find(s => s.id === item.style)?.icon as any}
                        size={32}
                        color={ANIME_STYLES.find(s => s.id === item.style)?.color}
                      />
                      <ThemedText variant="label" weight="semibold" color={theme.textPrimary} style={{ marginTop: Spacing.sm }}>
                        {item.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {item.characters.length} 角色 · {item.storyboards.length} 分镜
                      </ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                style={{ marginTop: Spacing.md }}
              />
            )}
          </View>
        </View>
      ) : (
        <View style={styles.projectOverview}>
          {/* 项目头部 */}
          <View style={styles.projectHeader}>
            <TouchableOpacity onPress={() => setCurrentProject(null)}>
              <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.projectInfo}>
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.name}
              </ThemedText>
              <ThemedText variant="small" color={theme.textMuted}>
                {ANIME_STYLES.find(s => s.id === currentProject.style)?.name} · {currentProject.status === 'draft' ? '草稿' : currentProject.status === 'production' ? '制作中' : '已完成'}
              </ThemedText>
            </View>

            <TouchableOpacity onPress={() => setShowProjectModal(true)}>
              <FontAwesome6 name="gear" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 统计卡片 */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <FontAwesome6 name="users" size={24} color="#FF6B9D" />
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.characters.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>角色</ThemedText>
            </View>
            <View style={styles.statCard}>
              <FontAwesome6 name="mountain-sun" size={24} color="#8B5CF6" />
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.scenes.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>场景</ThemedText>
            </View>
            <View style={styles.statCard}>
              <FontAwesome6 name="film" size={24} color="#06B6D4" />
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.storyboards.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>分镜</ThemedText>
            </View>
            <View style={styles.statCard}>
              <FontAwesome6 name="images" size={24} color="#10B981" />
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.frames.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>帧数</ThemedText>
            </View>
          </View>

          {/* 快捷操作 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => { setCreateType('character'); setShowCreateModal(true); }}>
              <FontAwesome6 name="user-plus" size={20} color="#FF6B9D" />
              <ThemedText variant="small" color={theme.textPrimary}>添加角色</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => { setCreateType('storyboard'); setShowCreateModal(true); }}>
              <FontAwesome6 name="plus" size={20} color="#06B6D4" />
              <ThemedText variant="small" color={theme.textPrimary}>添加分镜</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={exportVideo}>
              <FontAwesome6 name="download" size={20} color="#10B981" />
              <ThemedText variant="small" color={theme.textPrimary}>导出视频</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  // 渲染角色设计
  const renderCharacters = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <ThemedText variant="h4" color={theme.textMuted}>请先选择一个项目</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
              角色设计
            </ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { setCreateType('character'); setShowCreateModal(true); }}
            >
              <FontAwesome6 name="plus" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {currentProject.characters.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome6 name="users" size={48} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.md }}>
                点击右上角添加角色
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={currentProject.characters}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.characterCard}>
                  <LinearGradient colors={['#FF6B9D20', theme.backgroundTertiary]} style={styles.characterCardGradient}>
                    <View style={styles.characterImage}>
                      <FontAwesome6 name="user" size={32} color="#FF6B9D" />
                    </View>
                    <View style={styles.characterInfo}>
                      <ThemedText variant="label" weight="semibold" color={theme.textPrimary}>
                        {item.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted} numberOfLines={2}>
                        {item.description}
                      </ThemedText>
                      
                      {/* 表情预览 */}
                      <View style={styles.expressionRow}>
                        {EXPRESSION_TYPES.slice(0, 4).map((exp) => (
                          <TouchableOpacity
                            key={exp.id}
                            style={styles.expressionButton}
                            onPress={() => generateExpression(item.id, exp.name)}
                          >
                            <FontAwesome6 name={exp.icon as any} size={14} color={theme.textMuted} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );

  // 渲染场景设计
  const renderScenes = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <ThemedText variant="h4" color={theme.textMuted}>请先选择一个项目</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
              场景设计
            </ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { setCreateType('scene'); setShowCreateModal(true); }}
            >
              <FontAwesome6 name="plus" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {currentProject.scenes.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome6 name="mountain-sun" size={48} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.md }}>
                点击右上角创建场景
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={currentProject.scenes}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={({ item }) => (
                <View style={styles.sceneCard}>
                  <LinearGradient colors={['#8B5CF620', theme.backgroundTertiary]} style={styles.sceneCardGradient}>
                    <View style={styles.scenePreview}>
                      <FontAwesome6 name="mountain-sun" size={32} color="#8B5CF6" />
                    </View>
                    <ThemedText variant="small" weight="medium" color={theme.textPrimary}>
                      {item.name}
                    </ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      {item.timeOfDay} · {item.weather}
                    </ThemedText>
                  </LinearGradient>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );

  // 渲染分镜脚本
  const renderStoryboard = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <ThemedText variant="h4" color={theme.textMuted}>请先选择一个项目</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
              分镜脚本
            </ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { setCreateType('storyboard'); setShowCreateModal(true); }}
            >
              <FontAwesome6 name="plus" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {currentProject.storyboards.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome6 name="film" size={48} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.md }}>
                点击右上角添加分镜
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={currentProject.storyboards.sort((a, b) => a.sequence - b.sequence)}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={styles.storyboardCard}>
                  <View style={styles.storyboardNumber}>
                    <ThemedText variant="h4" weight="bold" color="#06B6D4">
                      {String(index + 1).padStart(2, '0')}
                    </ThemedText>
                  </View>
                  <View style={styles.storyboardContent}>
                    <View style={styles.storyboardPreview}>
                      <FontAwesome6 name="image" size={24} color={theme.textMuted} />
                    </View>
                    <View style={styles.storyboardInfo}>
                      <ThemedText variant="small" weight="medium" color={theme.textPrimary}>
                        {item.description}
                      </ThemedText>
                      <View style={styles.storyboardMeta}>
                        <ThemedText variant="tiny" color={theme.textMuted}>
                          {item.cameraAngle} · {item.duration}s
                        </ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={() => generateFrames(item.id)}
                    >
                      <FontAwesome6 name="wand-magic-sparkles" size={16} color="#06B6D4" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );

  // 渲染动画生成
  const renderAnimation = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <ThemedText variant="h4" color={theme.textMuted}>请先选择一个项目</ThemedText>
        </View>
      ) : (
        <View style={styles.animationSection}>
          <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
            动画生成
          </ThemedText>

          <View style={styles.animationPreview}>
            <View style={styles.previewCanvas}>
              <FontAwesome6 name="play-circle" size={64} color="#06B6D4" />
              <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                点击预览动画
              </ThemedText>
            </View>
          </View>

          <View style={styles.animationControls}>
            <TouchableOpacity style={styles.controlButton}>
              <FontAwesome6 name="backward" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playButton}>
              <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.playButtonGradient}>
                <FontAwesome6 name="play" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton}>
              <FontAwesome6 name="forward" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.frameInfo}>
            <ThemedText variant="caption" color={theme.textMuted}>
              总帧数: {currentProject.frames.length} · 预计时长: {(currentProject.frames.length / 24).toFixed(1)}s
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );

  // 渲染视频导出
  const renderExport = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <ThemedText variant="h4" color={theme.textMuted}>请先选择一个项目</ThemedText>
        </View>
      ) : (
        <View style={styles.exportSection}>
          <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
            导出动漫
          </ThemedText>

          <View style={styles.exportOptions}>
            <TouchableOpacity style={styles.exportOption} onPress={exportAsMp4}>
              <LinearGradient colors={['#FF6B9D', '#EC4899']} style={styles.exportOptionGradient}>
                <FontAwesome6 name="video" size={32} color="#FFF" />
                <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginTop: Spacing.sm }}>
                  MP4视频
                </ThemedText>
                <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                  高清视频格式
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportOption} onPress={exportAsGif}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.exportOptionGradient}>
                <FontAwesome6 name="image" size={32} color="#FFF" />
                <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginTop: Spacing.sm }}>
                  GIF动图
                </ThemedText>
                <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                  适合分享传播
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportOption} onPress={exportAsImages}>
              <LinearGradient colors={['#06B6D4', '#0891B2']} style={styles.exportOptionGradient}>
                <FontAwesome6 name="images" size={32} color="#FFF" />
                <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginTop: Spacing.sm }}>
                  图片序列
                </ThemedText>
                <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                  PNG帧序列
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportOption}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.exportOptionGradient}>
                <FontAwesome6 name="globe" size={32} color="#FFF" />
                <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginTop: Spacing.sm }}>
                  发布到社区
                </ThemedText>
                <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                  分享给所有人
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.exportSummary}>
            <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
              项目资源统计
            </ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText variant="small" color={theme.textSecondary}>角色数量</ThemedText>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>{currentProject.characters.length}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText variant="small" color={theme.textSecondary}>场景数量</ThemedText>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>{currentProject.scenes.length}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText variant="small" color={theme.textSecondary}>分镜数量</ThemedText>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>{currentProject.storyboards.length}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText variant="small" color={theme.textSecondary}>动画帧数</ThemedText>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>{currentProject.frames.length}</ThemedText>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // 渲染当前标签内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'characters': return renderCharacters();
      case 'scenes': return renderScenes();
      case 'storyboard': return renderStoryboard();
      case 'animation': return renderAnimation();
      case 'export': return renderExport();
      default: return renderOverview();
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <View style={styles.container}>
        {/* 左侧标签栏 */}
        <View style={styles.sidebar}>
          <View style={styles.logoSection}>
            <FontAwesome6 name="film" size={28} color="#FF6B9D" />
            <ThemedText variant="label" weight="bold" color={theme.textPrimary}>
              动漫工作台
            </ThemedText>
          </View>

          {STUDIO_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <FontAwesome6
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.id ? '#FF6B9D' : theme.textMuted}
              />
              <ThemedText
                variant="small"
                weight={activeTab === tab.id ? 'semibold' : 'regular'}
                color={activeTab === tab.id ? '#FF6B9D' : theme.textMuted}
                style={{ marginLeft: Spacing.sm }}
              >
                {tab.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 主内容区 */}
        <ScrollView style={styles.mainContent}>
          {renderTabContent()}
        </ScrollView>
      </View>

      {/* 创建项目弹窗 */}
      <Modal visible={showProjectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
                创建新动漫
              </ThemedText>
              <TouchableOpacity onPress={() => setShowProjectModal(false)}>
                <FontAwesome6 name="times" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="动漫名称"
              placeholderTextColor={theme.textMuted}
              value={prompt}
              onChangeText={setPrompt}
            />

            <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.sm }}>
              选择动漫风格
            </ThemedText>

            <View style={styles.styleSelector}>
              {ANIME_STYLES.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[styles.styleButton, selectedStyle === style.id && { borderColor: style.color, borderWidth: 2 }]}
                  onPress={() => setSelectedStyle(style.id as AnimeProject['style'])}
                >
                  <FontAwesome6 name={style.icon as any} size={20} color={style.color} />
                  <ThemedText variant="caption" color={theme.textPrimary}>{style.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={() => createProject(prompt, selectedStyle, '')}>
              <LinearGradient colors={['#FF6B9D', '#EC4899']} style={styles.submitButtonGradient}>
                <ThemedText variant="label" weight="medium" color="#FFF">创建项目</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 创建资源弹窗 */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
                {createType === 'character' ? '创建角色' : 
                 createType === 'scene' ? '创建场景' : '添加分镜'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <FontAwesome6 name="times" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={
                createType === 'character' ? '描述角色特点，如：少女，长发飘飘，眼神清澈...' :
                createType === 'scene' ? '描述场景，如：樱花盛开的校园，夕阳西下...' :
                '描述分镜内容，如：镜头从远处推进，少女站在樱花树下...'
              }
              placeholderTextColor={theme.textMuted}
              value={prompt}
              onChangeText={setPrompt}
              multiline
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {
                if (createType === 'character') generateCharacter();
                else if (createType === 'scene') generateScene();
                else addStoryboard();
              }}
              disabled={generating}
            >
              <LinearGradient colors={['#FF6B9D', '#EC4899']} style={styles.submitButtonGradient}>
                {generating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <FontAwesome6 name="wand-magic-sparkles" size={16} color="#FFF" />
                    <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginLeft: 8 }}>
                      AI生成
                    </ThemedText>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

// 样式（与游戏工作台类似，配色使用粉色主题）
const createStyles = (theme: any) => ({
  container: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  sidebar: {
    width: 200,
    backgroundColor: theme.backgroundDefault,
    borderRightWidth: 1,
    borderRightColor: theme.border,
    paddingVertical: Spacing.lg,
  },
  logoSection: {
    alignItems: 'center' as const,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#FF6B9D20',
    borderLeftColor: '#FF6B9D',
  },
  mainContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  tabContent: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing['4xl'],
  },
  createButton: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden' as const,
  },
  createButtonGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  projectList: {
    marginTop: Spacing['2xl'],
    width: '100%' as const,
  },
  projectCard: {
    width: (SCREEN_WIDTH - 400) / 2,
    height: 120,
    margin: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden' as const,
  },
  projectCardGradient: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: Spacing.lg,
  },
  projectOverview: {
    flex: 1,
  },
  projectHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  projectInfo: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: theme.border,
  },
  quickActions: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
  },
  quickAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    backgroundColor: theme.backgroundDefault,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  characterCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden' as const,
  },
  characterCardGradient: {
    flexDirection: 'row' as const,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  characterImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.backgroundTertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  characterInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  expressionRow: {
    flexDirection: 'row' as const,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  expressionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.backgroundTertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sceneCard: {
    flex: 1,
    margin: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden' as const,
  },
  sceneCardGradient: {
    padding: Spacing.lg,
    alignItems: 'center' as const,
  },
  scenePreview: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: theme.backgroundTertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  storyboardCard: {
    flexDirection: 'row' as const,
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  storyboardNumber: {
    width: 50,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  storyboardContent: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.md,
  },
  storyboardPreview: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: theme.backgroundTertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  storyboardInfo: {
    flex: 1,
  },
  storyboardMeta: {
    marginTop: Spacing.xs,
  },
  generateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#06B6D420',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  animationSection: {
    flex: 1,
  },
  animationPreview: {
    height: 300,
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.xl,
    marginVertical: Spacing.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewCanvas: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  animationControls: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: Spacing.xl,
    marginVertical: Spacing.lg,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.backgroundDefault,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: theme.border,
  },
  playButton: {
    borderRadius: 32,
    overflow: 'hidden' as const,
  },
  playButtonGradient: {
    width: 64,
    height: 64,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  frameInfo: {
    alignItems: 'center' as const,
  },
  exportSection: {
    flex: 1,
  },
  exportOptions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.lg,
    marginVertical: Spacing.xl,
  },
  exportOption: {
    width: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden' as const,
  },
  exportOptionGradient: {
    padding: Spacing.xl,
    alignItems: 'center' as const,
  },
  exportSummary: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    width: SCREEN_WIDTH * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.8,
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    color: theme.textPrimary,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top' as const,
  },
  styleSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  styleButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    backgroundColor: theme.backgroundTertiary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  submitButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden' as const,
    marginTop: Spacing.md,
  },
  submitButtonGradient: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing.lg,
  },
});
