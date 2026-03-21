import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

interface Project {
  id: string;
  title: string;
  type: string;
  status: 'active' | 'pending';
  progress: number;
  assets: number;
  lastUpdated: string;
  coverImage?: string;
}

const mockProjects: Project[] = [
  // ═══════════════════════════════════════════════════════════
  // 进行中的项目（Active Projects）
  // ═══════════════════════════════════════════════════════════
  {
    id: '1',
    title: '山河入梦',
    type: '古风场景',
    status: 'active',
    progress: 92,
    assets: 56,
    lastUpdated: '刚刚',
  },
  {
    id: '2',
    title: '风月入怀',
    type: '古风角色',
    status: 'active',
    progress: 85,
    assets: 48,
    lastUpdated: '20分钟前',
  },
  {
    id: '3',
    title: '一纸江南',
    type: '水墨场景',
    status: 'active',
    progress: 78,
    assets: 42,
    lastUpdated: '35分钟前',
  },
  {
    id: '4',
    title: '长安旧梦',
    type: '国风城池',
    status: 'active',
    progress: 72,
    assets: 38,
    lastUpdated: '1小时前',
  },
  {
    id: '5',
    title: '半盏清欢',
    type: '古风剧情',
    status: 'active',
    progress: 68,
    assets: 35,
    lastUpdated: '1小时前',
  },
  {
    id: '6',
    title: '青衫烟雨',
    type: '古风角色',
    status: 'active',
    progress: 65,
    assets: 32,
    lastUpdated: '2小时前',
  },
  {
    id: '7',
    title: '墨染山河',
    type: '水墨场景',
    status: 'active',
    progress: 58,
    assets: 28,
    lastUpdated: '2小时前',
  },
  {
    id: '8',
    title: '醉卧红尘',
    type: '仙侠场景',
    status: 'active',
    progress: 55,
    assets: 26,
    lastUpdated: '3小时前',
  },
  {
    id: '9',
    title: '浮生若梦',
    type: '古风剧情',
    status: 'active',
    progress: 52,
    assets: 24,
    lastUpdated: '3小时前',
  },
  {
    id: '10',
    title: '清风渡月',
    type: '古风场景',
    status: 'active',
    progress: 48,
    assets: 22,
    lastUpdated: '4小时前',
  },
  {
    id: '11',
    title: '墨色流年',
    type: '水墨场景',
    status: 'active',
    progress: 45,
    assets: 20,
    lastUpdated: '5小时前',
  },
  {
    id: '12',
    title: '山河无恙',
    type: '国风场景',
    status: 'active',
    progress: 42,
    assets: 18,
    lastUpdated: '5小时前',
  },
  {
    id: '13',
    title: '霓虹武士',
    type: '游戏角色',
    status: 'active',
    progress: 75,
    assets: 24,
    lastUpdated: '2小时前',
  },
  {
    id: '14',
    title: '赛博城市',
    type: '动漫场景',
    status: 'active',
    progress: 45,
    assets: 12,
    lastUpdated: '5小时前',
  },
  // ═══════════════════════════════════════════════════════════
  // 待处理项目（Pending Projects）
  // ═══════════════════════════════════════════════════════════
  {
    id: '15',
    title: '国风拾遗',
    type: '古风剧情',
    status: 'pending',
    progress: 38,
    assets: 16,
    lastUpdated: '6小时前',
  },
  {
    id: '16',
    title: '古韵今声',
    type: '国风角色',
    status: 'pending',
    progress: 35,
    assets: 15,
    lastUpdated: '8小时前',
  },
  {
    id: '17',
    title: '东方雅集',
    type: '古风场景',
    status: 'pending',
    progress: 32,
    assets: 14,
    lastUpdated: '8小时前',
  },
  {
    id: '18',
    title: '人间归客',
    type: '古风角色',
    status: 'pending',
    progress: 30,
    assets: 12,
    lastUpdated: '10小时前',
  },
  {
    id: '19',
    title: '华夏风骨',
    type: '国风场景',
    status: 'pending',
    progress: 28,
    assets: 11,
    lastUpdated: '12小时前',
  },
  {
    id: '20',
    title: '千年一韵',
    type: '古风剧情',
    status: 'pending',
    progress: 25,
    assets: 10,
    lastUpdated: '1天前',
  },
  {
    id: '21',
    title: '枕雪听风',
    type: '古风场景',
    status: 'pending',
    progress: 22,
    assets: 9,
    lastUpdated: '1天前',
  },
  {
    id: '22',
    title: '水墨东方',
    type: '水墨场景',
    status: 'pending',
    progress: 20,
    assets: 8,
    lastUpdated: '1天前',
  },
  {
    id: '23',
    title: '云深不知处',
    type: '仙侠场景',
    status: 'pending',
    progress: 18,
    assets: 7,
    lastUpdated: '1天前',
  },
  {
    id: '24',
    title: '雅韵风华',
    type: '古风角色',
    status: 'pending',
    progress: 15,
    assets: 6,
    lastUpdated: '2天前',
  },
  {
    id: '25',
    title: '山河长歌',
    type: '国风场景',
    status: 'pending',
    progress: 12,
    assets: 5,
    lastUpdated: '2天前',
  },
  {
    id: '26',
    title: '清欢渡余生',
    type: '古风剧情',
    status: 'pending',
    progress: 10,
    assets: 4,
    lastUpdated: '2天前',
  },
  {
    id: '27',
    title: '机甲战士',
    type: '游戏角色',
    status: 'pending',
    progress: 20,
    assets: 6,
    lastUpdated: '1天前',
  },
  {
    id: '28',
    title: '森林精灵',
    type: '动漫场景',
    status: 'pending',
    progress: 10,
    assets: 3,
    lastUpdated: '2天前',
  },
];

export default function ProjectsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const activeProjects = mockProjects.filter(p => p.status === 'active');
  const pendingProjects = mockProjects.filter(p => p.status === 'pending');
  const totalAssets = mockProjects.reduce((acc, p) => acc + p.assets, 0);

  const handleProjectPress = (project: Project) => {
    router.push('/workflow', { projectId: project.id, title: project.title });
  };

  const handleCreateProject = () => {
    if (Platform.OS === 'web') {
      window.alert('新建项目功能即将上线');
    } else {
      Alert.alert('提示', '新建项目功能即将上线');
    }
  };

  const handleViewAll = () => {
    if (Platform.OS === 'web') {
      window.alert('查看全部项目功能即将上线');
    } else {
      Alert.alert('提示', '查看全部项目功能即将上线');
    }
  };

  const handleStatPress = (type: 'active' | 'pending' | 'assets') => {
    if (type === 'active') {
      // 滚动到进行中项目
      if (Platform.OS === 'web') {
        window.alert(`进行中的项目：${activeProjects.length} 个\n${activeProjects.map(p => p.title).join('\n')}`);
      } else {
        Alert.alert('进行中的项目', activeProjects.map(p => `${p.title} (${p.progress}%)`).join('\n'));
      }
    } else if (type === 'pending') {
      // 显示待处理项目
      if (Platform.OS === 'web') {
        window.alert(`待处理项目：${pendingProjects.length} 个\n${pendingProjects.map(p => p.title).join('\n')}`);
      } else {
        Alert.alert('待处理项目', pendingProjects.map(p => `${p.title} (${p.progress}%)`).join('\n'));
      }
    } else if (type === 'assets') {
      // 显示资源统计
      const assetList = mockProjects.map(p => `${p.title}: ${p.assets} 个资源`);
      if (Platform.OS === 'web') {
        window.alert(`总资源数：${totalAssets} 个\n${assetList.join('\n')}`);
      } else {
        Alert.alert('资源统计', assetList.join('\n'));
      }
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, styles.statCardActive]} onPress={() => handleStatPress('active')}>
            <FontAwesome6 name="circle-play" size={20} color={theme.primary} />
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              进行中
            </ThemedText>
            <ThemedText variant="stat" color={theme.primary}>
              {activeProjects.length}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('pending')}>
            <FontAwesome6 name="clock" size={20} color={theme.accent} />
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              待处理
            </ThemedText>
            <ThemedText variant="stat" color={theme.textPrimary}>
              {pendingProjects.length}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('assets')}>
            <FontAwesome6 name="cube" size={20} color={theme.textMuted} />
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              总资源
            </ThemedText>
            <ThemedText variant="stat" color={theme.textPrimary}>
              {totalAssets}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Active Projects */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="label" color={theme.textPrimary}>
            进行中的项目
          </ThemedText>
          <TouchableOpacity onPress={handleViewAll}>
            <ThemedText variant="captionMedium" color={theme.primary}>
              查看全部
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.projectList}>
          {activeProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[styles.projectCard, styles.projectCardActive]}
              activeOpacity={0.7}
              onPress={() => handleProjectPress(project)}
            >
              {/* Project Header */}
              <View style={styles.projectHeader}>
                <View style={styles.projectIcon}>
                  <FontAwesome6 
                    name={project.type.includes('角色') ? 'user-astronaut' : 'city'} 
                    size={20} 
                    color={theme.primary} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="title" color={theme.textPrimary}>
                    {project.title}
                  </ThemedText>
                  <ThemedText variant="labelSmall" color={theme.textMuted}>
                    {project.type}
                  </ThemedText>
                </View>
                <View style={styles.projectStatus}>
                  <FontAwesome6 name="circle" size={6} color={theme.success} />
                  <ThemedText variant="tiny" color={theme.success}>
                    进行中
                  </ThemedText>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.projectProgress}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={[theme.primary, theme.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${project.progress}%` }]}
                  />
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>
                  已完成 {project.progress}%
                </ThemedText>
              </View>

              {/* Meta Info */}
              <View style={styles.projectMeta}>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="cube" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {project.assets} 资源
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {project.lastUpdated}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Projects */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <ThemedText variant="label" color={theme.textPrimary}>
            待处理项目
          </ThemedText>
        </View>
        
        <View style={styles.projectList}>
          {pendingProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              activeOpacity={0.7}
              onPress={() => handleProjectPress(project)}
            >
              {/* Project Header */}
              <View style={styles.projectHeader}>
                <View style={[styles.projectIcon, { backgroundColor: theme.backgroundTertiary }]}>
                  <FontAwesome6 
                    name={project.type.includes('角色') ? 'user-astronaut' : 'city'} 
                    size={20} 
                    color={theme.textMuted} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="title" color={theme.textPrimary}>
                    {project.title}
                  </ThemedText>
                  <ThemedText variant="labelSmall" color={theme.textMuted}>
                    {project.type}
                  </ThemedText>
                </View>
                <View style={[styles.projectStatus, { backgroundColor: 'rgba(191,0,255,0.1)' }]}>
                  <FontAwesome6 name="clock" size={6} color={theme.accent} />
                  <ThemedText variant="tiny" color={theme.accent}>
                    待处理
                  </ThemedText>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.projectProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFillPlain, { width: `${project.progress}%`, backgroundColor: theme.textMuted }]} />
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>
                  已完成 {project.progress}%
                </ThemedText>
              </View>

              {/* Meta Info */}
              <View style={styles.projectMeta}>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="cube" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {project.assets} 资源
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {project.lastUpdated}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create New Button */}
        <TouchableOpacity style={styles.createButton} activeOpacity={0.8} onPress={handleCreateProject}>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.sm,
              padding: Spacing.lg,
              borderRadius: BorderRadius.md,
            }}
          >
            <FontAwesome6 name="plus" size={16} color={theme.backgroundRoot} />
            <ThemedText variant="labelTitle" color={theme.backgroundRoot}>
              新建项目
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
