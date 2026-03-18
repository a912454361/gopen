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
    title: 'Neon Samurai',
    type: 'GAME CHARACTER',
    status: 'active',
    progress: 75,
    assets: 24,
    lastUpdated: '2h ago',
  },
  {
    id: '2',
    title: 'Cyber Cityscape',
    type: 'ANIME SCENE',
    status: 'active',
    progress: 45,
    assets: 12,
    lastUpdated: '5h ago',
  },
  {
    id: '3',
    title: 'Mecha Warrior',
    type: 'GAME CHARACTER',
    status: 'pending',
    progress: 20,
    assets: 6,
    lastUpdated: '1d ago',
  },
  {
    id: '4',
    title: 'Forest Spirit',
    type: 'ANIME SCENE',
    status: 'pending',
    progress: 10,
    assets: 3,
    lastUpdated: '2d ago',
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
            {project.status === 'active' ? 'ACTIVE' : 'PENDING'}
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
          {project.progress}% complete
        </ThemedText>
      </View>

      <View style={styles.projectMeta}>
        <View style={styles.metaItem}>
          <FontAwesome6 name="cube" size={12} color={theme.textMuted} />
          <ThemedText variant="caption" color={theme.textMuted}>
            {project.assets} assets
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
            Project Dashboard
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>
            CREATION WORKSPACE
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
              ACTIVE
            </ThemedText>
            <ThemedText variant="stat" color={theme.primary}>
              {activeProjects.length}
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              PENDING
            </ThemedText>
            <ThemedText variant="stat" color={theme.textPrimary}>
              {pendingProjects.length}
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              ASSETS
            </ThemedText>
            <ThemedText variant="stat" color={theme.textPrimary}>
              {mockProjects.reduce((acc, p) => acc + p.assets, 0)}
            </ThemedText>
          </View>
        </View>

        {/* Active Projects */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="label" color={theme.textPrimary}>
            ACTIVE PROJECTS
          </ThemedText>
          <TouchableOpacity>
            <ThemedText variant="captionMedium" color={theme.primary}>
              SEE ALL
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.projectList}>
          {activeProjects.map(renderProjectCard)}
        </View>

        {/* Pending Projects */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <ThemedText variant="label" color={theme.textPrimary}>
            PENDING PROJECTS
          </ThemedText>
        </View>
        <View style={styles.projectList}>
          {pendingProjects.map(renderProjectCard)}
        </View>

        {/* Create New Button */}
        <TouchableOpacity style={styles.createButton}>
          <FontAwesome6 name="plus" size={16} color={theme.primary} />
          <ThemedText variant="labelTitle" color={theme.primary}>
            NEW PROJECT
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

import { Spacing } from '@/constants/theme';
