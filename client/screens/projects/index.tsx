import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';

interface Project {
  id: string;
  title: string;
  type: string;
  status: 'active' | 'pending';
  progress: number;
  assets: number;
  lastUpdated: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    title: '霓虹武士',
    type: '游戏角色',
    status: 'active',
    progress: 75,
    assets: 24,
    lastUpdated: '2小时前',
  },
  {
    id: '2',
    title: '赛博城市',
    type: '动漫场景',
    status: 'active',
    progress: 45,
    assets: 12,
    lastUpdated: '5小时前',
  },
  {
    id: '3',
    title: '机甲战士',
    type: '游戏角色',
    status: 'pending',
    progress: 20,
    assets: 6,
    lastUpdated: '1天前',
  },
  {
    id: '4',
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

  const activeProjects = mockProjects.filter(p => p.status === 'active');
  const pendingProjects = mockProjects.filter(p => p.status === 'pending');

  const renderProjectCard = (project: Project) => (
    <TouchableOpacity
      key={project.id}
      style={[styles.projectCard, project.status === 'active' && styles.projectCardActive]}
    >
      <View style={styles.projectHeader}>
        <View>
          <ThemedText variant="title" color={theme.textPrimary}>
            {project.title}
          </ThemedText>
          <ThemedText variant="labelSmall" color={theme.textMuted}>
            {project.type}
          </ThemedText>
        </View>
        <View
          style={[
            styles.projectStatus,
            project.status === 'active' ? styles.statusActive : styles.statusPending,
          ]}
        >
          <FontAwesome6
            name={project.status === 'active' ? 'circle' : 'clock'}
            size={8}
            color={project.status === 'active' ? theme.success : theme.accent}
          />
          <ThemedText
            variant="tiny"
            color={project.status === 'active' ? theme.success : theme.accent}
          >
            {project.status === 'active' ? '进行中' : '待处理'}
          </ThemedText>
        </View>
      </View>

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
  );

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
          <View style={[styles.statCard, styles.statCardActive]}>
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              进行中
            </ThemedText>
            <ThemedText variant="stat" color={theme.primary}>
              {activeProjects.length}
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              待处理
            </ThemedText>
            <ThemedText variant="stat" color={theme.textPrimary}>
              {pendingProjects.length}
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              总资源
            </ThemedText>
            <ThemedText variant="stat" color={theme.textPrimary}>
              {mockProjects.reduce((acc, p) => acc + p.assets, 0)}
            </ThemedText>
          </View>
        </View>

        {/* Active Projects */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="label" color={theme.textPrimary}>
            进行中的项目
          </ThemedText>
          <TouchableOpacity>
            <ThemedText variant="captionMedium" color={theme.primary}>
              查看全部
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.projectList}>
          {activeProjects.map(renderProjectCard)}
        </View>

        {/* Pending Projects */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <ThemedText variant="label" color={theme.textPrimary}>
            待处理项目
          </ThemedText>
        </View>
        <View style={styles.projectList}>
          {pendingProjects.map(renderProjectCard)}
        </View>

        {/* Create New Button */}
        <TouchableOpacity style={styles.createButton}>
          <FontAwesome6 name="plus" size={16} color={theme.primary} />
          <ThemedText variant="labelTitle" color={theme.primary}>
            新建项目
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

import { Spacing } from '@/constants/theme';
