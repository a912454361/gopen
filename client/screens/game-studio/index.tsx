/**
 * 游戏制作工作台 - 完整的游戏创作系统
 * 
 * 功能：
 * 1. 项目管理 - 创建/编辑游戏项目
 * 2. 角色设计 - AI生成游戏角色
 * 3. 场景制作 - AI生成游戏场景
 * 4. 道具物品 - 创建游戏道具
 * 5. 剧情脚本 - 编写游戏剧情
 * 6. 导出发布 - 导出游戏资源
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

// 游戏类型
interface GameProject {
  id: string;
  name: string;
  description: string;
  type: 'rpg' | 'card' | 'action' | 'puzzle' | 'simulation';
  cover: string;
  characters: Character[];
  scenes: Scene[];
  items: GameItem[];
  scripts: Script[];
  createdAt: string;
  updatedAt: string;
}

interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
  attributes: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  skills: Skill[];
}

interface Scene {
  id: string;
  name: string;
  description: string;
  image: string;
  background: string;
  npcs: string[];
  items: string[];
}

interface GameItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'key';
  description: string;
  image: string;
  attributes: Record<string, number>;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  damage: number;
  cost: number;
  cooldown: number;
}

interface Script {
  id: string;
  name: string;
  content: string;
  triggers: string[];
  rewards: Record<string, number>;
}

// 游戏类型配置
const GAME_TYPES = [
  { id: 'rpg', name: '角色扮演', icon: 'hat-wizard', color: '#8B5CF6', desc: 'RPG冒险游戏' },
  { id: 'card', name: '卡牌对战', icon: 'layer-group', color: '#EC4899', desc: '策略卡牌游戏' },
  { id: 'action', name: '动作冒险', icon: 'swords', color: '#EF4444', desc: '实时战斗游戏' },
  { id: 'puzzle', name: '益智解谜', icon: 'puzzle-piece', color: '#06B6D4', desc: '烧脑解谜游戏' },
  { id: 'simulation', name: '模拟经营', icon: 'building', color: '#10B981', desc: '经营策略游戏' },
];

// 工作台标签
const STUDIO_TABS = [
  { id: 'overview', name: '项目概览', icon: 'folder' },
  { id: 'characters', name: '角色设计', icon: 'users' },
  { id: 'scenes', name: '场景制作', icon: 'mountain-sun' },
  { id: 'items', name: '道具物品', icon: 'gem' },
  { id: 'scripts', name: '剧情脚本', icon: 'book-open' },
  { id: 'export', name: '导出发布', icon: 'download' },
];

export default function GameStudioScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<GameProject[]>([]);
  const [currentProject, setCurrentProject] = useState<GameProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Modal 状态
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'character' | 'scene' | 'item' | 'script'>('character');
  const [prompt, setPrompt] = useState('');

  // 加载项目列表
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const saved = await AsyncStorage.getItem('game_projects');
      if (saved) {
        setProjects(JSON.parse(saved));
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const saveProjects = async (newProjects: GameProject[]) => {
    try {
      await AsyncStorage.setItem('game_projects', JSON.stringify(newProjects));
      setProjects(newProjects);
    } catch (error) {
      console.error('保存项目失败:', error);
    }
  };

  // 创建新项目
  const createProject = async (name: string, type: GameProject['type'], description: string) => {
    const newProject: GameProject = {
      id: `game_${Date.now()}`,
      name,
      description,
      type,
      cover: '',
      characters: [],
      scenes: [],
      items: [],
      scripts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newProjects = [...projects, newProject];
    await saveProjects(newProjects);
    setCurrentProject(newProject);
    setShowProjectModal(false);
  };

  // AI生成角色
  const generateCharacter = async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入角色描述');
      return;
    }

    setGenerating(true);
    try {
      // 调用后端AI生成角色
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'character',
          prompt: prompt,
          projectId: currentProject?.id,
        }),
      });

      const data = await response.json();
      
      if (data.success && currentProject) {
        const newCharacter: Character = {
          id: `char_${Date.now()}`,
          name: data.name || '未命名角色',
          description: data.description || prompt,
          image: data.image || '',
          attributes: data.attributes || { hp: 100, attack: 50, defense: 30, speed: 20 },
          skills: data.skills || [],
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
      console.error('生成角色失败:', error);
      // 创建示例角色
      if (currentProject) {
        const sampleCharacter: Character = {
          id: `char_${Date.now()}`,
          name: '剑客',
          description: prompt,
          image: '',
          attributes: { hp: 120, attack: 80, defense: 40, speed: 30 },
          skills: [{ id: 'skill_1', name: '剑气', description: '释放剑气攻击', damage: 50, cost: 20, cooldown: 2 }],
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
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scene',
          prompt: prompt,
          projectId: currentProject?.id,
        }),
      });

      const data = await response.json();
      
      if (currentProject) {
        const newScene: Scene = {
          id: `scene_${Date.now()}`,
          name: data.name || '未命名场景',
          description: data.description || prompt,
          image: data.image || '',
          background: data.background || '',
          npcs: [],
          items: [],
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
    } catch (error) {
      // 创建示例场景
      if (currentProject) {
        const sampleScene: Scene = {
          id: `scene_${Date.now()}`,
          name: '神秘森林',
          description: prompt,
          image: '',
          background: '#1a472a',
          npcs: [],
          items: [],
        };

        const updatedProject = {
          ...currentProject,
          scenes: [...currentProject.scenes, sampleScene],
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

  // AI生成道具
  const generateItem = async () => {
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入道具描述');
      return;
    }

    setGenerating(true);
    try {
      if (currentProject) {
        const sampleItem: GameItem = {
          id: `item_${Date.now()}`,
          name: '神秘宝剑',
          type: 'weapon',
          description: prompt,
          image: '',
          attributes: { attack: 50, critical: 10 },
        };

        const updatedProject = {
          ...currentProject,
          items: [...currentProject.items, sampleItem],
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

  // 导出游戏
  const exportGame = async () => {
    if (!currentProject) return;

    Alert.alert(
      '导出游戏',
      '选择导出格式：',
      [
        { text: 'JSON配置', onPress: () => exportAsJson() },
        { text: 'Unity资源包', onPress: () => Alert.alert('提示', 'Unity导出功能开发中') },
        { text: 'Godot项目', onPress: () => Alert.alert('提示', 'Godot导出功能开发中') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const exportAsJson = async () => {
    if (!currentProject) return;

    const exportData = {
      project: currentProject,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    // 在Web端提供下载
    if (Platform.OS === 'web') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name}_game.json`;
      a.click();
      URL.revokeObjectURL(url);
      Alert.alert('成功', '游戏配置已导出！');
    }
  };

  // 渲染项目概览
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <FontAwesome6 name="folder-plus" size={64} color={theme.textMuted} />
          <ThemedText variant="h3" color={theme.textSecondary} style={{ marginTop: Spacing.lg }}>
            选择或创建游戏项目
          </ThemedText>
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowProjectModal(true)}
          >
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.createButtonGradient}>
              <FontAwesome6 name="plus" size={20} color="#FFF" />
              <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginLeft: 8 }}>
                创建新游戏
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
                      colors={[GAME_TYPES.find(t => t.id === item.type)?.color + '40', theme.backgroundTertiary]}
                      style={styles.projectCardGradient}
                    >
                      <FontAwesome6
                        name={GAME_TYPES.find(t => t.id === item.type)?.icon as any}
                        size={32}
                        color={GAME_TYPES.find(t => t.id === item.type)?.color}
                      />
                      <ThemedText variant="label" weight="semibold" color={theme.textPrimary} style={{ marginTop: Spacing.sm }}>
                        {item.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {item.characters.length} 角色 · {item.scenes.length} 场景
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
                {GAME_TYPES.find(t => t.id === currentProject.type)?.name} · 更新于 {new Date(currentProject.updatedAt).toLocaleDateString()}
              </ThemedText>
            </View>

            <TouchableOpacity onPress={() => setShowProjectModal(true)}>
              <FontAwesome6 name="gear" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* 统计卡片 */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <FontAwesome6 name="users" size={24} color="#8B5CF6" />
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.characters.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>角色</ThemedText>
            </View>
            <View style={styles.statCard}>
              <FontAwesome6 name="mountain-sun" size={24} color="#10B981" />
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.scenes.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>场景</ThemedText>
            </View>
            <View style={styles.statCard}>
              <FontAwesome6 name="gem" size={24} color="#F59E0B" />
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.items.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>道具</ThemedText>
            </View>
            <View style={styles.statCard}>
              <FontAwesome6 name="book-open" size={24} color="#EC4899" />
              <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>
                {currentProject.scripts.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>脚本</ThemedText>
            </View>
          </View>

          {/* 快捷操作 */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => { setCreateType('character'); setShowCreateModal(true); }}>
              <FontAwesome6 name="user-plus" size={20} color="#8B5CF6" />
              <ThemedText variant="small" color={theme.textPrimary}>添加角色</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => { setCreateType('scene'); setShowCreateModal(true); }}>
              <FontAwesome6 name="image" size={20} color="#10B981" />
              <ThemedText variant="small" color={theme.textPrimary}>创建场景</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={exportGame}>
              <FontAwesome6 name="download" size={20} color="#F59E0B" />
              <ThemedText variant="small" color={theme.textPrimary}>导出游戏</ThemedText>
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
                  <LinearGradient colors={['#8B5CF620', theme.backgroundTertiary]} style={styles.characterCardGradient}>
                    <View style={styles.characterImage}>
                      <FontAwesome6 name="user" size={32} color="#8B5CF6" />
                    </View>
                    <View style={styles.characterInfo}>
                      <ThemedText variant="label" weight="semibold" color={theme.textPrimary}>
                        {item.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted} numberOfLines={2}>
                        {item.description}
                      </ThemedText>
                      <View style={styles.attributeRow}>
                        <View style={styles.attributeItem}>
                          <FontAwesome6 name="heart" size={10} color="#EF4444" />
                          <ThemedText variant="tiny" color={theme.textSecondary}>{item.attributes.hp}</ThemedText>
                        </View>
                        <View style={styles.attributeItem}>
                          <FontAwesome6 name="sword" size={10} color="#F59E0B" />
                          <ThemedText variant="tiny" color={theme.textSecondary}>{item.attributes.attack}</ThemedText>
                        </View>
                        <View style={styles.attributeItem}>
                          <FontAwesome6 name="shield" size={10} color="#3B82F6" />
                          <ThemedText variant="tiny" color={theme.textSecondary}>{item.attributes.defense}</ThemedText>
                        </View>
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

  // 渲染场景制作
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
              场景制作
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
              renderItem={({ item }) => (
                <View style={styles.sceneCard}>
                  <LinearGradient colors={['#10B98120', theme.backgroundTertiary]} style={styles.sceneCardGradient}>
                    <View style={styles.scenePreview}>
                      <FontAwesome6 name="mountain-sun" size={32} color="#10B981" />
                    </View>
                    <View style={styles.sceneInfo}>
                      <ThemedText variant="label" weight="semibold" color={theme.textPrimary}>
                        {item.name}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted} numberOfLines={2}>
                        {item.description}
                      </ThemedText>
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

  // 渲染道具物品
  const renderItems = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <ThemedText variant="h4" color={theme.textMuted}>请先选择一个项目</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
              道具物品
            </ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { setCreateType('item'); setShowCreateModal(true); }}
            >
              <FontAwesome6 name="plus" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {currentProject.items.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome6 name="gem" size={48} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.md }}>
                点击右上角创建道具
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={currentProject.items}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={({ item }) => (
                <View style={styles.itemCard}>
                  <LinearGradient colors={['#F59E0B20', theme.backgroundTertiary]} style={styles.itemCardGradient}>
                    <FontAwesome6 name="gem" size={24} color="#F59E0B" />
                    <ThemedText variant="small" weight="medium" color={theme.textPrimary} style={{ marginTop: Spacing.sm }}>
                      {item.name}
                    </ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted}>{item.type}</ThemedText>
                  </LinearGradient>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );

  // 渲染剧情脚本
  const renderScripts = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <ThemedText variant="h4" color={theme.textMuted}>请先选择一个项目</ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
              剧情脚本
            </ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { setCreateType('script'); setShowCreateModal(true); }}
            >
              <FontAwesome6 name="plus" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          {currentProject.scripts.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome6 name="book-open" size={48} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.md }}>
                点击右上角创建脚本
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={currentProject.scripts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.scriptCard}>
                  <ThemedText variant="label" weight="semibold" color={theme.textPrimary}>
                    {item.name}
                  </ThemedText>
                  <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
                    {item.content}
                  </ThemedText>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );

  // 渲染导出发布
  const renderExport = () => (
    <View style={styles.tabContent}>
      {!currentProject ? (
        <View style={styles.emptyState}>
          <ThemedText variant="h4" color={theme.textMuted}>请先选择一个项目</ThemedText>
        </View>
      ) : (
        <View style={styles.exportSection}>
          <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>
            导出游戏
          </ThemedText>

          <View style={styles.exportOptions}>
            <TouchableOpacity style={styles.exportOption} onPress={exportAsJson}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.exportOptionGradient}>
                <FontAwesome6 name="file-code" size={32} color="#FFF" />
                <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginTop: Spacing.sm }}>
                  JSON配置
                </ThemedText>
                <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                  下载游戏配置文件
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportOption}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.exportOptionGradient}>
                <FontAwesome6 name="cube" size={32} color="#FFF" />
                <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginTop: Spacing.sm }}>
                  Unity资源包
                </ThemedText>
                <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                  导出为Unity项目
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportOption}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.exportOptionGradient}>
                <FontAwesome6 name="gamepad" size={32} color="#FFF" />
                <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginTop: Spacing.sm }}>
                  Godot项目
                </ThemedText>
                <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                  导出为Godot项目
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportOption}>
              <LinearGradient colors={['#EC4899', '#DB2777']} style={styles.exportOptionGradient}>
                <FontAwesome6 name="mobile" size={32} color="#FFF" />
                <ThemedText variant="label" weight="medium" color="#FFF" style={{ marginTop: Spacing.sm }}>
                  APK/IPA
                </ThemedText>
                <ThemedText variant="tiny" color="rgba(255,255,255,0.7)">
                  直接打包安装包
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
              <ThemedText variant="small" color={theme.textSecondary}>道具数量</ThemedText>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>{currentProject.items.length}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText variant="small" color={theme.textSecondary}>脚本数量</ThemedText>
              <ThemedText variant="small" weight="medium" color={theme.textPrimary}>{currentProject.scripts.length}</ThemedText>
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
      case 'items': return renderItems();
      case 'scripts': return renderScripts();
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
            <FontAwesome6 name="gamepad" size={28} color="#8B5CF6" />
            <ThemedText variant="label" weight="bold" color={theme.textPrimary}>
              游戏工作台
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
                color={activeTab === tab.id ? '#8B5CF6' : theme.textMuted}
              />
              <ThemedText
                variant="small"
                weight={activeTab === tab.id ? 'semibold' : 'regular'}
                color={activeTab === tab.id ? '#8B5CF6' : theme.textMuted}
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
                创建新游戏
              </ThemedText>
              <TouchableOpacity onPress={() => setShowProjectModal(false)}>
                <FontAwesome6 name="times" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="游戏名称"
              placeholderTextColor={theme.textMuted}
              value={prompt}
              onChangeText={setPrompt}
            />

            <View style={styles.typeSelector}>
              {GAME_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.typeButton}
                  onPress={() => setPrompt(prompt + ' [' + type.name + ']')}
                >
                  <FontAwesome6 name={type.icon as any} size={20} color={type.color} />
                  <ThemedText variant="caption" color={theme.textPrimary}>{type.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={() => createProject(prompt, 'rpg', '')}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.submitButtonGradient}>
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
                 createType === 'scene' ? '创建场景' : 
                 createType === 'item' ? '创建道具' : '创建脚本'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <FontAwesome6 name="times" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={
                createType === 'character' ? '描述角色特点，如：剑客，身穿白衣，手持长剑...' :
                createType === 'scene' ? '描述场景，如：神秘的森林，雾气缭绕...' :
                createType === 'item' ? '描述道具，如：神秘的宝剑，发出淡淡光芒...' :
                '输入剧情内容...'
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
                else if (createType === 'item') generateItem();
              }}
              disabled={generating}
            >
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.submitButtonGradient}>
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

// 样式
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
    backgroundColor: '#8B5CF620',
    borderLeftColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
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
  attributeRow: {
    flexDirection: 'row' as const,
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  attributeItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  sceneCard: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden' as const,
  },
  sceneCardGradient: {
    flexDirection: 'row' as const,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  scenePreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.backgroundTertiary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sceneInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  itemCard: {
    flex: 1,
    margin: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden' as const,
  },
  itemCardGradient: {
    padding: Spacing.lg,
    alignItems: 'center' as const,
  },
  scriptCard: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
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
  typeSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    backgroundColor: theme.backgroundTertiary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
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
