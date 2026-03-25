/**
 * UE 5.7.4 引擎特权用户创作页面
 * 多模型协同大型动漫开发
 * 
 * 专属特权用户：郭涛
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 动漫风格
const ANIME_STYLES = [
  { id: 'japanese', name: '日式动漫' },
  { id: 'chinese', name: '国风动漫' },
  { id: 'korean', name: '韩式动漫' },
  { id: 'western', name: '西式动漫' },
];

// 渲染质量
const RENDER_QUALITIES = [
  { id: '2K', name: '2K' },
  { id: '4K', name: '4K' },
  { id: '8K', name: '8K' },
];

// 帧率选项
const FRAME_RATES = [
  { id: 24, name: '24fps' },
  { id: 30, name: '30fps' },
  { id: 60, name: '60fps' },
];

// 模型提供商类型
interface ModelProvider {
  id: string;
  name: string;
  type: 'llm' | 'image' | 'video' | 'audio';
  status: 'idle' | 'working' | 'error';
  currentTask?: string;
}

// 场景类型
interface Scene {
  id: string;
  name: string;
  location: string;
  timeOfDay: string;
  mood: string;
  renderStatus: 'pending' | 'rendering' | 'completed';
}

// 项目类型
interface Project {
  id: string;
  name: string;
  style: string;
  status: string;
  scenes: Scene[];
  createdAt: string;
}

export default function UEEngineScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // 访问状态
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userName, setUserName] = useState('');

  // 引擎状态
  const [engineStatus, setEngineStatus] = useState<{
    gpuUtilization: number;
    activeTasks: number;
    providers: ModelProvider[];
  } | null>(null);

  // 创作状态
  const [projectName, setProjectName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('japanese');
  const [isCreating, setIsCreating] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // 渲染选项
  const [renderQuality, setRenderQuality] = useState('4K');
  const [frameRate, setFrameRate] = useState(30);
  const [rayTracing, setRayTracing] = useState(true);
  const [isRendering, setIsRendering] = useState(false);

  // 检查访问权限
  useEffect(() => {
    checkAccess();
  }, []);

  // 定时更新引擎状态
  useEffect(() => {
    if (!hasAccess) return;

    const interval = setInterval(() => {
      fetchEngineStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [hasAccess]);

  const checkAccess = async () => {
    try {
      // 从本地存储获取用户名
      let storedUserName = await AsyncStorage.getItem('ue_user_name');
      
      // 如果没有，尝试从登录信息获取
      if (!storedUserName) {
        storedUserName = await AsyncStorage.getItem('user_name');
      }

      if (storedUserName) {
        setUserName(storedUserName);
      }

      // 调用后端检查权限
      /**
       * 服务端文件：server/src/routes/ue-engine.ts
       * 接口：GET /api/v1/ue-engine/check-access
       * Header：x-user-name
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ue-engine/check-access`,
        {
          headers: storedUserName ? { 'x-user-name': storedUserName } : {},
        }
      );

      const data = await response.json();

      if (data.success && data.data.hasAccess) {
        setHasAccess(true);
        setUserName(data.data.userName);
        // 保存到本地
        await AsyncStorage.setItem('ue_user_name', data.data.userName);
        // 获取引擎状态
        fetchEngineStatus();
      } else {
        setHasAccess(false);
      }
    } catch (error) {
      console.error('Access check error:', error);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchEngineStatus = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/ue-engine.ts
       * 接口：GET /api/v1/ue-engine/status
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ue-engine/status`,
        {
          headers: { 'x-user-name': userName },
        }
      );

      const data = await response.json();

      if (data.success) {
        setEngineStatus(data.data);
      }
    } catch (error) {
      console.error('Status fetch error:', error);
    }
  };

  // 创建项目
  const handleCreateProject = async () => {
    if (!projectName.trim() || !prompt.trim()) {
      Alert.alert('提示', '请填写项目名称和故事主题');
      return;
    }

    setIsCreating(true);

    try {
      /**
       * 服务端文件：server/src/routes/ue-engine.ts
       * 接口：POST /api/v1/ue-engine/project
       * Body 参数：name: string, style: string, prompt: string, userName: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ue-engine/project`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-name': userName,
          },
          body: JSON.stringify({
            name: projectName,
            style: selectedStyle,
            prompt,
            userName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setCurrentProject(data.data);
        Alert.alert('成功', `项目 "${projectName}" 创建成功！`);
      } else {
        throw new Error(data.error || '创建失败');
      }
    } catch (error) {
      console.error('Project creation error:', error);
      Alert.alert('错误', error instanceof Error ? error.message : '创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 渲染场景
  const handleRenderScene = async (sceneId: string) => {
    if (!currentProject) return;

    setIsRendering(true);

    try {
      /**
       * 服务端文件：server/src/routes/ue-engine.ts
       * 接口：POST /api/v1/ue-engine/render
       * Body 参数：projectId: string, sceneId: string, userName: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ue-engine/render`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-name': userName,
          },
          body: JSON.stringify({
            projectId: currentProject.id,
            sceneId,
            userName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('成功', '场景渲染任务已启动，多模型协同工作中...');
        // 更新场景状态
        setCurrentProject(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map(s =>
              s.id === sceneId ? { ...s, renderStatus: 'rendering' } : s
            ),
          };
        });
      }
    } catch (error) {
      console.error('Render error:', error);
      Alert.alert('错误', '渲染启动失败');
    } finally {
      setIsRendering(false);
    }
  };

  // 超高质量渲染
  const handleUltraRender = async () => {
    if (!currentProject) return;

    setIsRendering(true);

    try {
      /**
       * 服务端文件：server/src/routes/ue-engine.ts
       * 接口：POST /api/v1/ue-engine/ultra-render
       * Body 参数：projectId: string, options: object, userName: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ue-engine/ultra-render`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-name': userName,
          },
          body: JSON.stringify({
            projectId: currentProject.id,
            options: {
              resolution: renderQuality,
              frameRate,
              rayTracing,
              motionBlur: true,
              depthOfField: true,
            },
            userName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          '超高质量渲染已启动',
          `预计渲染时间：${Math.round(data.data.estimatedTime / 60)} 分钟\n` +
          `已分配模型：${data.data.gpuAllocation.length} 个`
        );
      }
    } catch (error) {
      console.error('Ultra render error:', error);
      Alert.alert('错误', '渲染启动失败');
    } finally {
      setIsRendering(false);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return '#10B981'; // 绿色
      case 'working':
        return '#F59E0B'; // 黄色
      case 'error':
        return '#EF4444'; // 红色
      default:
        return '#9CA3AF'; // 灰色
    }
  };

  // 获取模型类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'llm':
        return 'brain';
      case 'image':
        return 'image';
      case 'video':
        return 'film';
      case 'audio':
        return 'volume-high';
      default:
        return 'cube';
    }
  };

  // 检查权限中
  if (checkingAccess) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText variant="body" color={theme.textMuted} style={styles.loadingText}>
            验证访问权限...
          </ThemedText>
        </View>
      </Screen>
    );
  }

  // 无权限
  if (!hasAccess) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.deniedContainer}>
          <FontAwesome6 name="lock" size={64} color={theme.textMuted} style={styles.deniedIcon} />
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.deniedTitle}>
            特权功能
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.deniedText}>
            此功能仅对特权用户开放{'\n'}
            如需使用，请联系管理员{'\n\n'}
            当前特权用户：郭涛
          </ThemedText>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }]}
            onPress={async () => {
              // 测试用：设置为郭涛
              await AsyncStorage.setItem('ue_user_name', '郭涛');
              checkAccess();
            }}
          >
            <ThemedText variant="label" color={theme.primary}>
              使用「郭涛」身份访问
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            UE 5.7.4 引擎
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
            欢迎回来，{userName} | 80GB GPU | 多模型协同
          </ThemedText>
        </View>

        {/* 引擎状态 */}
        {engineStatus && (
          <ThemedView level="default" style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={styles.statusTitle}>
                <FontAwesome6 name="microchip" size={20} color={theme.primary} />
                <ThemedText variant="label" color={theme.textPrimary}>引擎状态</ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${theme.success}20` }]}>
                <ThemedText variant="tiny" color={theme.success}>在线</ThemedText>
              </View>
            </View>

            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <ThemedText variant="h3" color={theme.primary}>{engineStatus.gpuUtilization}%</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>GPU 利用率</ThemedText>
              </View>
              <View style={styles.statusItem}>
                <ThemedText variant="h3" color={theme.primary}>{engineStatus.activeTasks}</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>活跃任务</ThemedText>
              </View>
              <View style={styles.statusItem}>
                <ThemedText variant="h3" color={theme.primary}>{engineStatus.providers?.length || 0}</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>可用模型</ThemedText>
              </View>
            </View>
          </ThemedView>
        )}

        {/* 模型提供商 */}
        {engineStatus?.providers && (
          <View style={styles.providersSection}>
            <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
              模型提供商
            </ThemedText>
            <View style={styles.providerGrid}>
              {engineStatus.providers.map(provider => (
                <ThemedView key={provider.id} level="default" style={styles.providerCard}>
                  <View style={styles.providerHeader}>
                    <View style={[styles.providerStatus, { backgroundColor: getStatusColor(provider.status) }]} />
                    <FontAwesome6 name={getTypeIcon(provider.type)} size={14} color={theme.textSecondary} />
                  </View>
                  <ThemedText variant="small" color={theme.textPrimary}>{provider.name}</ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>{provider.type.toUpperCase()}</ThemedText>
                  {provider.currentTask && (
                    <ThemedText variant="tiny" color={theme.textMuted} style={styles.providerTask}>
                      {provider.currentTask}
                    </ThemedText>
                  )}
                </ThemedView>
              ))}
            </View>
          </View>
        )}

        {/* 项目创建 */}
        {!currentProject ? (
          <>
            {/* 项目名称 */}
            <View style={styles.inputContainer}>
              <ThemedText variant="label" color={theme.textPrimary} style={styles.inputLabel}>
                项目名称
              </ThemedText>
              <TextInput
                style={[styles.textInput, { minHeight: 50 }]}
                placeholder="输入项目名称..."
                placeholderTextColor={theme.textMuted}
                value={projectName}
                onChangeText={setProjectName}
              />
            </View>

            {/* 故事主题 */}
            <View style={styles.inputContainer}>
              <ThemedText variant="label" color={theme.textPrimary} style={styles.inputLabel}>
                故事主题
              </ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="描述你想创作的动漫故事..."
                placeholderTextColor={theme.textMuted}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* 风格选择 */}
            <ThemedText variant="label" color={theme.textPrimary} style={styles.inputLabel}>
              动漫风格
            </ThemedText>
            <View style={styles.styleGrid}>
              {ANIME_STYLES.map(style => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleOption,
                    selectedStyle === style.id && styles.styleOptionActive,
                  ]}
                  onPress={() => setSelectedStyle(style.id)}
                >
                  <ThemedText variant="small" color={selectedStyle === style.id ? theme.primary : theme.textSecondary}>
                    {style.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* 创建按钮 */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateProject}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
              ) : (
                <>
                  <FontAwesome6 name="rocket" size={18} color={theme.buttonPrimaryText} />
                  <ThemedText variant="label" color={theme.buttonPrimaryText}>创建项目</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* 项目信息 */}
            <ThemedView level="default" style={styles.projectCard}>
              <View style={styles.projectHeader}>
                <ThemedText variant="h3" color={theme.textPrimary}>{currentProject.name}</ThemedText>
                <View style={[styles.projectStatus, { backgroundColor: `${theme.primary}20` }]}>
                  <ThemedText variant="tiny" color={theme.primary}>{currentProject.status}</ThemedText>
                </View>
              </View>
              <View style={styles.projectInfo}>
                <View style={styles.projectInfoItem}>
                  <ThemedText variant="h4" color={theme.primary}>{currentProject.scenes?.length || 0}</ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>场景</ThemedText>
                </View>
                <View style={styles.projectInfoItem}>
                  <ThemedText variant="h4" color={theme.primary}>{currentProject.style}</ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>风格</ThemedText>
                </View>
              </View>
            </ThemedView>

            {/* 场景列表 */}
            <ThemedText variant="label" color={theme.textPrimary} style={styles.sectionTitle}>
              场景列表
            </ThemedText>
            <View style={styles.sceneList}>
              {currentProject.scenes?.map(scene => (
                <ThemedView key={scene.id} level="tertiary" style={styles.sceneCard}>
                  <View style={styles.sceneHeader}>
                    <View>
                      <ThemedText variant="small" color={theme.textPrimary}>{scene.name}</ThemedText>
                      <ThemedText variant="tiny" color={theme.textMuted}>{scene.location} · {scene.timeOfDay}</ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.renderButton}
                      onPress={() => handleRenderScene(scene.id)}
                      disabled={isRendering || scene.renderStatus === 'rendering'}
                    >
                      <FontAwesome6
                        name={scene.renderStatus === 'rendering' ? 'spinner' : 'play'}
                        size={10}
                        color={theme.buttonPrimaryText}
                      />
                      <Text style={styles.renderButtonText}>
                        {scene.renderStatus === 'rendering' ? '渲染中' : scene.renderStatus === 'completed' ? '完成' : '渲染'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ThemedView>
              ))}
            </View>

            {/* 超高质量渲染 */}
            <ThemedView level="default" style={styles.ultraCard}>
              <ThemedText variant="label" color={theme.primary} style={styles.ultraTitle}>
                <FontAwesome6 name="bolt" size={16} color={theme.primary} /> 超高质量渲染
              </ThemedText>
              <ThemedText variant="small" color={theme.textSecondary} style={styles.ultraDesc}>
                使用全部模型资源进行最高质量渲染，支持光线追踪、运动模糊、景深效果
              </ThemedText>

              {/* 渲染选项 */}
              <ThemedText variant="tiny" color={theme.textMuted}>分辨率</ThemedText>
              <View style={styles.ultraOptions}>
                {RENDER_QUALITIES.map(q => (
                  <TouchableOpacity
                    key={q.id}
                    style={[styles.ultraOption, renderQuality === q.id && styles.ultraOptionActive]}
                    onPress={() => setRenderQuality(q.id)}
                  >
                    <ThemedText variant="tiny" color={renderQuality === q.id ? theme.buttonPrimaryText : theme.textSecondary}>
                      {q.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText variant="tiny" color={theme.textMuted}>帧率</ThemedText>
              <View style={styles.ultraOptions}>
                {FRAME_RATES.map(f => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.ultraOption, frameRate === f.id && styles.ultraOptionActive]}
                    onPress={() => setFrameRate(f.id)}
                  >
                    <ThemedText variant="tiny" color={frameRate === f.id ? theme.buttonPrimaryText : theme.textSecondary}>
                      {f.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUltraRender}
                disabled={isRendering}
              >
                {isRendering ? (
                  <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                ) : (
                  <>
                    <FontAwesome6 name="wand-magic-sparkles" size={18} color={theme.buttonPrimaryText} />
                    <ThemedText variant="label" color={theme.buttonPrimaryText}>启动超高质量渲染</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </ThemedView>

            {/* 新建项目 */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setCurrentProject(null);
                setProjectName('');
                setPrompt('');
              }}
            >
              <FontAwesome6 name="plus" size={18} color={theme.textPrimary} />
              <ThemedText variant="label" color={theme.textPrimary}>创建新项目</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
