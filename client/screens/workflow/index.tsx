import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useMembership, type FeatureType } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

interface WorkflowStep {
  id: string;
  number: number;
  title: string;
  description: string;
  feature: FeatureType;
  status: 'completed' | 'active' | 'locked';
  actions: string[];
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'env',
    number: 1,
    title: '环境打通',
    description: '配置创作环境，连接服务器和存储端',
    feature: 'env_setup',
    status: 'active',
    actions: ['服务器连接', '存储端配置', '环境检测'],
  },
  {
    id: 'create',
    number: 2,
    title: '内容制作',
    description: 'AI辅助创作角色、场景、剧情',
    feature: 'content_create',
    status: 'locked',
    actions: ['角色设计', '场景构建', '剧情生成', '动画制作'],
  },
  {
    id: 'output',
    number: 3,
    title: '成品输出',
    description: '导出可运行的动漫游戏成品',
    feature: 'output_pro',
    status: 'locked',
    actions: ['格式转换', '质量优化', '成品打包', '云端存储'],
  },
];

export default function WorkflowScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { level, canUseFeature, getFeatureLabel, storageUsed, maxStorageMB } = useMembership();

  const [stepStatus, setStepStatus] = useState<Record<string, string>>({
    env: 'active',
    create: 'locked',
    output: 'locked',
  });

  const handleAction = (stepId: string, action: string) => {
    const step = workflowSteps.find(s => s.id === stepId);
    if (!step) return;

    if (!canUseFeature(step.feature)) {
      const label = getFeatureLabel(step.feature);
      Alert.alert(
        '功能受限',
        `此功能需要${label}才能使用`,
        [
          { text: '稍后再说', style: 'cancel' },
          { text: '开通会员', onPress: () => router.push('/membership') },
        ]
      );
      return;
    }

    // Handle different actions
    switch (action) {
      case '服务器连接':
        Alert.alert('服务器连接', '正在连接 G open 服务器...');
        break;
      case '存储端配置':
        router.push('/storage');
        break;
      case '角色设计':
      case '场景构建':
      case '剧情生成':
        router.push('/');
        break;
      default:
        Alert.alert(action, '功能开发中，敬请期待');
    }
  };

  const getBadgeStyle = (feature: FeatureType) => {
    const label = getFeatureLabel(feature);
    if (label === '免费') return styles.badgeFree;
    if (label === '会员') return styles.badgeMember;
    return styles.badgeSuper;
  };

  const getBadgeColor = (feature: FeatureType) => {
    const label = getFeatureLabel(feature);
    if (label === '免费') return theme.success;
    if (label === '会员') return theme.accent;
    return theme.primary;
  };

  const storagePercent = (storageUsed / maxStorageMB) * 100;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', left: 0, padding: Spacing.sm, zIndex: 1 }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginLeft: Spacing['2xl'] }}>
            创作工作台
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted} style={{ marginLeft: Spacing['2xl'] }}>
            环境打通 → 内容制作 → 成品输出
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Storage Card */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              云端存储
            </ThemedText>
            <ThemedText variant="smallMedium" color={theme.primary}>
              {storageUsed}MB / {maxStorageMB >= 1000 ? `${(maxStorageMB/1000).toFixed(0)}GB` : `${maxStorageMB}MB`}
            </ThemedText>
          </View>
          <View style={styles.storageBar}>
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(storagePercent, 100)}%` }]}
            />
          </View>
          {storagePercent > 80 && (
            <View style={styles.storageWarning}>
              <FontAwesome6 name="triangle-exclamation" size={14} color={theme.error} />
              <ThemedText variant="caption" color={theme.error}>
                存储空间不足，请升级会员或清理文件
              </ThemedText>
            </View>
          )}
        </View>

        {/* Workflow Steps */}
        <View style={styles.workflowContainer}>
          {workflowSteps.map(step => {
            const isLocked = !canUseFeature(step.feature);
            const isActive = stepStatus[step.id] === 'active';
            
            return (
              <View
                key={step.id}
                style={[
                  styles.workflowStep,
                  isActive && styles.workflowStepActive,
                  isLocked && styles.workflowStepLocked,
                ]}
              >
                <View style={styles.stepHeader}>
                  <View style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                    <ThemedText variant="smallMedium" color={isActive ? theme.primary : theme.textPrimary}>
                      {step.number}
                    </ThemedText>
                  </View>
                  <View style={styles.stepInfo}>
                    <ThemedText variant="title" color={theme.textPrimary}>
                      {step.title}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {step.description}
                    </ThemedText>
                  </View>
                  <View style={[styles.stepBadge, getBadgeStyle(step.feature)]}>
                    <ThemedText
                      variant="tiny"
                      color={getBadgeColor(step.feature)}
                    >
                      {getFeatureLabel(step.feature)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.stepContent}>
                  <View style={styles.featureGrid}>
                    {step.actions.map((action, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.featureTag}
                        onPress={() => handleAction(step.id, action)}
                      >
                        <FontAwesome6
                          name={isLocked ? 'lock' : 'play'}
                          size={10}
                          color={isLocked ? theme.textMuted : theme.primary}
                        />
                        <ThemedText variant="caption" color={isLocked ? theme.textMuted : theme.textSecondary}>
                          {action}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.actionButton, isLocked && styles.actionButtonDisabled]}
                    onPress={() => handleAction(step.id, step.actions[0])}
                    disabled={isLocked}
                  >
                    <FontAwesome6
                      name={isLocked ? 'lock' : 'arrow-right'}
                      size={14}
                      color={isLocked ? theme.textMuted : theme.primary}
                    />
                    <ThemedText variant="labelSmall" color={isLocked ? theme.textMuted : theme.primary}>
                      {isLocked ? '解锁此功能' : '开始操作'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.storageCard}>
          <ThemedText variant="smallMedium" color={theme.textPrimary}>
            快捷入口
          </ThemedText>
          <View style={[styles.featureGrid, { marginTop: Spacing.md }]}>
            <TouchableOpacity style={styles.featureTag} onPress={() => router.push('/')}>
              <FontAwesome6 name="wand-magic-sparkles" size={12} color={theme.primary} />
              <ThemedText variant="caption" color={theme.textSecondary}>AI创作</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureTag} onPress={() => router.push('/projects')}>
              <FontAwesome6 name="layer-group" size={12} color={theme.primary} />
              <ThemedText variant="caption" color={theme.textSecondary}>项目管理</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureTag} onPress={() => router.push('/storage')}>
              <FontAwesome6 name="cloud" size={12} color={theme.primary} />
              <ThemedText variant="caption" color={theme.textSecondary}>云端存储</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.featureTag} onPress={() => router.push('/membership')}>
              <FontAwesome6 name="crown" size={12} color={theme.primary} />
              <ThemedText variant="caption" color={theme.textSecondary}>会员中心</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
