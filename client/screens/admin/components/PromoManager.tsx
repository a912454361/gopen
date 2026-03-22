/**
 * 推广管理中心 - 完整版
 * 功能：执行推广、任务管理、执行日志、文案管理、新建任务
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

interface PromoManagerProps {
  adminKey: string;
}

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 平台列表
const ALL_PLATFORMS = [
  { key: 'weibo', name: '微博', icon: 'weibo', color: '#E6162D' },
  { key: 'wechat', name: '微信', icon: 'wechat', color: '#07C160' },
  { key: 'wechat_moments', name: '朋友圈', icon: 'comments', color: '#07C160' },
  { key: 'douyin', name: '抖音', icon: 'play', color: '#000000' },
  { key: 'xiaohongshu', name: '小红书', icon: 'book', color: '#FF2442' },
  { key: 'zhihu', name: '知乎', icon: 'question', color: '#0084FF' },
  { key: 'bilibili', name: 'B站', icon: 'tv', color: '#00A1D6' },
  { key: 'toutiao', name: '今日头条', icon: 'newspaper', color: '#F85959' },
];

// 任务类型
interface PromoTask {
  id: string;
  name: string;
  type: string;
  platforms: string[];
  content_template: string;
  schedule_type: string;
  status: string;
  run_count: number;
  success_count: number;
  fail_count: number;
  last_run_at: string | null;
  next_run_at: string | null;
}

// 执行记录
interface Execution {
  id: string;
  task_id: string;
  platform: string;
  action: string;
  status: string;
  success_count: number;
  fail_count: number;
  started_at: string;
  completed_at: string | null;
  logs?: any[];
  promo_tasks?: { name: string };
}

// 推广文案
interface PromoContent {
  id: string;
  title: string;
  content: string;
  platform: string;
  category: string;
  tags: string[];
  status: string;
  use_count: number;
}

type TabKey = 'execute' | 'tasks' | 'logs' | 'contents' | 'create';

export function PromoManager({ adminKey }: PromoManagerProps) {
  const { theme, isDark } = useTheme();

  // 状态
  const [activeTab, setActiveTab] = useState<TabKey>('execute');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // 数据
  const [tasks, setTasks] = useState<PromoTask[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [contents, setContents] = useState<PromoContent[]>([]);

  // 弹窗
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PromoTask | null>(null);
  const [selectedContent, setSelectedContent] = useState<PromoContent | null>(null);

  // 表单
  const [taskForm, setTaskForm] = useState({
    name: '',
    platforms: [] as string[],
    contentTemplate: '',
    scheduleType: 'daily',
  });
  const [contentForm, setContentForm] = useState({
    title: '',
    content: '',
    platform: 'weibo',
  });

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, executionsRes, contentsRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/tasks?key=${adminKey}`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/executions?key=${adminKey}&limit=30`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/contents?key=${adminKey}`),
      ]);

      const tasksData = await tasksRes.json();
      const executionsData = await executionsRes.json();
      const contentsData = await contentsRes.json();

      if (tasksData.success) setTasks(tasksData.data || []);
      if (executionsData.success) setExecutions(executionsData.data || []);
      if (contentsData.success) setContents(contentsData.data || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 立即执行推广
  const handleExecuteTask = async (taskId: string) => {
    setIsExecuting(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/tasks/${taskId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('执行成功', data.message);
        loadAllData();
      } else {
        Alert.alert('执行失败', data.error || '未知错误');
      }
    } catch (error) {
      Alert.alert('执行失败', '网络错误');
    } finally {
      setIsExecuting(false);
    }
  };

  // 创建任务
  const handleCreateTask = async () => {
    if (!taskForm.name || taskForm.platforms.length === 0) {
      Alert.alert('提示', '请填写任务名称并选择平台');
      return;
    }

    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey,
          name: taskForm.name,
          platforms: taskForm.platforms,
          contentTemplate: taskForm.contentTemplate,
          scheduleType: taskForm.scheduleType,
        }),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert('成功', '任务创建成功');
        setTaskModalVisible(false);
        setTaskForm({ name: '', platforms: [], contentTemplate: '', scheduleType: 'daily' });
        loadAllData();
      } else {
        Alert.alert('失败', data.error || '创建失败');
      }
    } catch (error) {
      Alert.alert('失败', '网络错误');
    }
  };

  // 更新任务状态
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, status: newStatus }),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert('成功', `任务已${newStatus === 'active' ? '启动' : '暂停'}`);
        loadAllData();
      }
    } catch (error) {
      Alert.alert('失败', '操作失败');
    }
  };

  // 创建文案
  const handleCreateContent = async () => {
    if (!contentForm.title || !contentForm.content) {
      Alert.alert('提示', '请填写标题和内容');
      return;
    }

    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/contents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey,
          title: contentForm.title,
          content: contentForm.content,
          platform: contentForm.platform,
        }),
      });
      const data = await res.json();

      if (data.success) {
        Alert.alert('成功', '文案创建成功');
        setContentModalVisible(false);
        setContentForm({ title: '', content: '', platform: 'weibo' });
        loadAllData();
      }
    } catch (error) {
      Alert.alert('失败', '网络错误');
    }
  };

  // 删除文案
  const handleDeleteContent = async (contentId: string) => {
    Alert.alert('确认', '确定要删除这条文案吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/contents/${contentId}?key=${adminKey}`, {
              method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
              Alert.alert('成功', '文案已删除');
              loadAllData();
            }
          } catch (error) {
            Alert.alert('失败', '删除失败');
          }
        },
      },
    ]);
  };

  // 复制文案
  const handleCopyContent = async (content: string) => {
    await Clipboard.setStringAsync(content);
    Alert.alert('成功', '已复制到剪贴板');
  };

  // 切换平台选择
  const togglePlatform = (platformKey: string) => {
    setTaskForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformKey)
        ? prev.platforms.filter(p => p !== platformKey)
        : [...prev.platforms, platformKey],
    }));
  };

  // 获取平台名称
  const getPlatformName = (key: string) => {
    return ALL_PLATFORMS.find(p => p.key === key)?.name || key;
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: '#10B98120', text: '#10B981', label: '运行中' };
      case 'paused':
      case 'pending':
        return { bg: '#F59E0B20', text: '#F59E0B', label: '已暂停' };
      case 'completed':
        return { bg: '#3B82F620', text: '#3B82F6', label: '已完成' };
      case 'running':
        return { bg: '#8B5CF620', text: '#8B5CF6', label: '执行中' };
      default:
        return { bg: '#6B728020', text: '#6B7280', label: status };
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tab 切换 */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {[
            { key: 'execute', label: '立即推广', icon: 'rocket' },
            { key: 'tasks', label: '任务管理', icon: 'list-check' },
            { key: 'logs', label: '执行日志', icon: 'clock-rotate-left' },
            { key: 'contents', label: '文案库', icon: 'file-lines' },
            { key: 'create', label: '新建任务', icon: 'plus' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.lg,
                borderRadius: BorderRadius.lg,
                backgroundColor: activeTab === tab.key ? theme.primary : theme.backgroundDefault,
                borderWidth: 1,
                borderColor: activeTab === tab.key ? theme.primary : theme.border,
              }}
              onPress={() => setActiveTab(tab.key as TabKey)}
            >
              <FontAwesome6
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.key ? theme.buttonPrimaryText : theme.textPrimary}
              />
              <ThemedText
                variant="small"
                color={activeTab === tab.key ? theme.buttonPrimaryText : theme.textPrimary}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          {/* 立即推广 */}
          {activeTab === 'execute' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                选择任务立即执行
              </ThemedText>
              
              {tasks.filter(t => t.status === 'active').length === 0 ? (
                <View style={{
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.xl,
                  alignItems: 'center',
                }}>
                  <FontAwesome6 name="inbox" size={48} color={theme.textMuted} />
                  <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                    暂无运行中的任务
                  </ThemedText>
                  <TouchableOpacity
                    style={{
                      marginTop: Spacing.lg,
                      backgroundColor: theme.primary,
                      paddingHorizontal: Spacing.xl,
                      paddingVertical: Spacing.md,
                      borderRadius: BorderRadius.lg,
                    }}
                    onPress={() => setActiveTab('create')}
                  >
                    <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>创建新任务</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : (
                tasks.filter(t => t.status === 'active').map((task) => (
                  <View
                    key={task.id}
                    style={{
                      backgroundColor: theme.backgroundDefault,
                      borderRadius: BorderRadius.lg,
                      padding: Spacing.lg,
                      marginBottom: Spacing.md,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                      <ThemedText variant="h4" color={theme.textPrimary}>{task.name}</ThemedText>
                      <View style={{
                        backgroundColor: '#10B98120',
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 4,
                        borderRadius: BorderRadius.sm,
                      }}>
                        <ThemedText variant="caption" color="#10B981">运行中</ThemedText>
                      </View>
                    </View>
                    
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm }}>
                      {task.platforms.slice(0, 6).map(p => (
                        <View key={p} style={{
                          backgroundColor: theme.backgroundTertiary,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: BorderRadius.sm,
                        }}>
                          <ThemedText variant="caption" color={theme.textSecondary}>{getPlatformName(p)}</ThemedText>
                        </View>
                      ))}
                      {task.platforms.length > 6 && (
                        <ThemedText variant="caption" color={theme.textMuted}>+{task.platforms.length - 6}</ThemedText>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md }}>
                      <View>
                        <ThemedText variant="caption" color={theme.textMuted}>执行次数</ThemedText>
                        <ThemedText variant="h4" color={theme.textPrimary}>{task.run_count}</ThemedText>
                      </View>
                      <View>
                        <ThemedText variant="caption" color={theme.textMuted}>成功</ThemedText>
                        <ThemedText variant="h4" color="#10B981">{task.success_count}</ThemedText>
                      </View>
                      <View>
                        <ThemedText variant="caption" color={theme.textMuted}>失败</ThemedText>
                        <ThemedText variant="h4" color="#EF4444">{task.fail_count}</ThemedText>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={{
                        backgroundColor: theme.primary,
                        paddingVertical: Spacing.md,
                        borderRadius: BorderRadius.lg,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: Spacing.sm,
                      }}
                      onPress={() => handleExecuteTask(task.id)}
                      disabled={isExecuting}
                    >
                      {isExecuting ? (
                        <ActivityIndicator color={theme.buttonPrimaryText} size="small" />
                      ) : (
                        <>
                          <FontAwesome6 name="rocket" size={14} color={theme.buttonPrimaryText} />
                          <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>立即执行</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* 任务管理 */}
          {activeTab === 'tasks' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                <ThemedText variant="h4" color={theme.textPrimary}>所有任务</ThemedText>
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.xs,
                  }}
                  onPress={() => setActiveTab('create')}
                >
                  <FontAwesome6 name="plus" size={12} color={theme.buttonPrimaryText} />
                  <ThemedText variant="small" color={theme.buttonPrimaryText}>新建</ThemedText>
                </TouchableOpacity>
              </View>

              {tasks.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                  <FontAwesome6 name="folder-open" size={48} color={theme.textMuted} />
                  <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                    暂无任务
                  </ThemedText>
                </View>
              ) : (
                tasks.map((task) => {
                  const statusStyle = getStatusStyle(task.status);
                  return (
                    <View
                      key={task.id}
                      style={{
                        backgroundColor: theme.backgroundDefault,
                        borderRadius: BorderRadius.lg,
                        padding: Spacing.lg,
                        marginBottom: Spacing.md,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                        <ThemedText variant="h4" color={theme.textPrimary}>{task.name}</ThemedText>
                        <View style={{
                          backgroundColor: statusStyle.bg,
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: 4,
                          borderRadius: BorderRadius.sm,
                        }}>
                          <ThemedText variant="caption" color={statusStyle.text}>{statusStyle.label}</ThemedText>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm }}>
                        {task.platforms.slice(0, 5).map(p => (
                          <View key={p} style={{
                            backgroundColor: theme.backgroundTertiary,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: BorderRadius.sm,
                          }}>
                            <ThemedText variant="caption" color={theme.textSecondary}>{getPlatformName(p)}</ThemedText>
                          </View>
                        ))}
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ThemedText variant="caption" color={theme.textMuted}>
                          调度: {task.schedule_type === 'daily' ? '每天' : task.schedule_type === 'hourly' ? '每小时' : task.schedule_type}
                        </ThemedText>
                        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: task.status === 'active' ? '#F59E0B20' : '#10B98120',
                              paddingHorizontal: Spacing.md,
                              paddingVertical: Spacing.sm,
                              borderRadius: BorderRadius.md,
                            }}
                            onPress={() => handleToggleTask(task.id, task.status)}
                          >
                            <ThemedText variant="small" color={task.status === 'active' ? '#F59E0B' : '#10B981'}>
                              {task.status === 'active' ? '暂停' : '启动'}
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              backgroundColor: theme.primary,
                              paddingHorizontal: Spacing.md,
                              paddingVertical: Spacing.sm,
                              borderRadius: BorderRadius.md,
                            }}
                            onPress={() => handleExecuteTask(task.id)}
                          >
                            <ThemedText variant="small" color={theme.buttonPrimaryText}>执行</ThemedText>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* 执行日志 */}
          {activeTab === 'logs' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                最近执行记录
              </ThemedText>

              {executions.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                  <FontAwesome6 name="clock" size={48} color={theme.textMuted} />
                  <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                    暂无执行记录
                  </ThemedText>
                </View>
              ) : (
                executions.map((exec) => {
                  const statusStyle = getStatusStyle(exec.status);
                  return (
                    <View
                      key={exec.id}
                      style={{
                        backgroundColor: theme.backgroundDefault,
                        borderRadius: BorderRadius.lg,
                        padding: Spacing.lg,
                        marginBottom: Spacing.md,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                        <ThemedText variant="smallMedium" color={theme.textPrimary}>
                          {exec.promo_tasks?.name || '未知任务'}
                        </ThemedText>
                        <View style={{
                          backgroundColor: statusStyle.bg,
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: 4,
                          borderRadius: BorderRadius.sm,
                        }}>
                          <ThemedText variant="caption" color={statusStyle.text}>{statusStyle.label}</ThemedText>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.sm }}>
                        <View>
                          <ThemedText variant="caption" color={theme.textMuted}>成功</ThemedText>
                          <ThemedText variant="h4" color="#10B981">{exec.success_count}</ThemedText>
                        </View>
                        <View>
                          <ThemedText variant="caption" color={theme.textMuted}>失败</ThemedText>
                          <ThemedText variant="h4" color="#EF4444">{exec.fail_count}</ThemedText>
                        </View>
                      </View>

                      <ThemedText variant="caption" color={theme.textMuted}>
                        {new Date(exec.started_at).toLocaleString()}
                        {exec.completed_at && ` · 耗时 ${Math.round((new Date(exec.completed_at).getTime() - new Date(exec.started_at).getTime()) / 1000)}秒`}
                      </ThemedText>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* 文案库 */}
          {activeTab === 'contents' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                <ThemedText variant="h4" color={theme.textPrimary}>推广文案库</ThemedText>
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.primary,
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.sm,
                    borderRadius: BorderRadius.lg,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.xs,
                  }}
                  onPress={() => setContentModalVisible(true)}
                >
                  <FontAwesome6 name="plus" size={12} color={theme.buttonPrimaryText} />
                  <ThemedText variant="small" color={theme.buttonPrimaryText}>新建文案</ThemedText>
                </TouchableOpacity>
              </View>

              {contents.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
                  <FontAwesome6 name="file-lines" size={48} color={theme.textMuted} />
                  <ThemedText variant="body" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                    暂无文案
                  </ThemedText>
                </View>
              ) : (
                contents.map((content) => (
                  <View
                    key={content.id}
                    style={{
                      backgroundColor: theme.backgroundDefault,
                      borderRadius: BorderRadius.lg,
                      padding: Spacing.lg,
                      marginBottom: Spacing.md,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                        <ThemedText variant="h4" color={theme.textPrimary}>{content.title}</ThemedText>
                        <View style={{
                          backgroundColor: theme.backgroundTertiary,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: BorderRadius.sm,
                        }}>
                          <ThemedText variant="caption" color={theme.textSecondary}>{getPlatformName(content.platform)}</ThemedText>
                        </View>
                      </View>
                      <ThemedText variant="caption" color={theme.textMuted}>使用 {content.use_count} 次</ThemedText>
                    </View>

                    <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.md }} numberOfLines={3}>
                      {content.content}
                    </ThemedText>

                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: theme.primary,
                          paddingVertical: Spacing.sm,
                          borderRadius: BorderRadius.md,
                          alignItems: 'center',
                        }}
                        onPress={() => handleCopyContent(content.content)}
                      >
                        <ThemedText variant="small" color={theme.buttonPrimaryText}>复制</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#EF444420',
                          paddingHorizontal: Spacing.md,
                          paddingVertical: Spacing.sm,
                          borderRadius: BorderRadius.md,
                          alignItems: 'center',
                        }}
                        onPress={() => handleDeleteContent(content.id)}
                      >
                        <FontAwesome6 name="trash" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* 新建任务 */}
          {activeTab === 'create' && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
                创建新推广任务
              </ThemedText>

              {/* 任务名称 */}
              <View style={{ marginBottom: Spacing.lg }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
                  任务名称
                </ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundDefault,
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    fontSize: 14,
                  }}
                  placeholder="输入任务名称"
                  placeholderTextColor={theme.textMuted}
                  value={taskForm.name}
                  onChangeText={(text) => setTaskForm(prev => ({ ...prev, name: text }))}
                />
              </View>

              {/* 选择平台 */}
              <View style={{ marginBottom: Spacing.lg }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
                  推广平台 (已选 {taskForm.platforms.length} 个)
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                  {ALL_PLATFORMS.map((platform) => (
                    <TouchableOpacity
                      key={platform.key}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: Spacing.xs,
                        paddingHorizontal: Spacing.lg,
                        paddingVertical: Spacing.sm,
                        borderRadius: BorderRadius.lg,
                        backgroundColor: taskForm.platforms.includes(platform.key) ? theme.primary : theme.backgroundDefault,
                        borderWidth: 1,
                        borderColor: taskForm.platforms.includes(platform.key) ? theme.primary : theme.border,
                      }}
                      onPress={() => togglePlatform(platform.key)}
                    >
                      <FontAwesome6 name={platform.icon as any} size={12} color={taskForm.platforms.includes(platform.key) ? theme.buttonPrimaryText : theme.textPrimary} />
                      <ThemedText variant="small" color={taskForm.platforms.includes(platform.key) ? theme.buttonPrimaryText : theme.textPrimary}>
                        {platform.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 推广内容模板 */}
              <View style={{ marginBottom: Spacing.lg }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
                  推广内容模板 (可选)
                </ThemedText>
                <TextInput
                  style={{
                    backgroundColor: theme.backgroundDefault,
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.lg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    color: theme.textPrimary,
                    fontSize: 14,
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                  placeholder="输入推广文案模板，留空则使用默认文案"
                  placeholderTextColor={theme.textMuted}
                  value={taskForm.contentTemplate}
                  onChangeText={(text) => setTaskForm(prev => ({ ...prev, contentTemplate: text }))}
                  multiline
                />
              </View>

              {/* 调度频率 */}
              <View style={{ marginBottom: Spacing.xl }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
                  调度频率
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {[
                    { key: 'hourly', label: '每小时' },
                    { key: 'daily', label: '每天' },
                    { key: 'weekly', label: '每周' },
                  ].map((schedule) => (
                    <TouchableOpacity
                      key={schedule.key}
                      style={{
                        flex: 1,
                        paddingVertical: Spacing.md,
                        borderRadius: BorderRadius.lg,
                        backgroundColor: taskForm.scheduleType === schedule.key ? theme.primary : theme.backgroundDefault,
                        borderWidth: 1,
                        borderColor: taskForm.scheduleType === schedule.key ? theme.primary : theme.border,
                        alignItems: 'center',
                      }}
                      onPress={() => setTaskForm(prev => ({ ...prev, scheduleType: schedule.key }))}
                    >
                      <ThemedText variant="small" color={taskForm.scheduleType === schedule.key ? theme.buttonPrimaryText : theme.textPrimary}>
                        {schedule.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 创建按钮 */}
              <TouchableOpacity
                style={{
                  backgroundColor: theme.primary,
                  paddingVertical: Spacing.lg,
                  borderRadius: BorderRadius.lg,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                }}
                onPress={handleCreateTask}
              >
                <FontAwesome6 name="check" size={16} color={theme.buttonPrimaryText} />
                <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>创建任务</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          )}
        </>
      )}

      {/* 新建文案弹窗 */}
      <Modal
        visible={contentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContentModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: theme.backgroundRoot,
            borderTopLeftRadius: BorderRadius.xl,
            borderTopRightRadius: BorderRadius.xl,
            padding: Spacing.lg,
            maxHeight: '80%',
          }}>
            <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
              新建推广文案
            </ThemedText>

            <View style={{ marginBottom: Spacing.md }}>
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.xs }}>标题</ThemedText>
              <TextInput
                style={{
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                }}
                placeholder="文案标题"
                placeholderTextColor={theme.textMuted}
                value={contentForm.title}
                onChangeText={(text) => setContentForm(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.xs }}>平台</ThemedText>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {ALL_PLATFORMS.slice(0, 4).map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    style={{
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      borderRadius: BorderRadius.md,
                      backgroundColor: contentForm.platform === p.key ? theme.primary : theme.backgroundDefault,
                    }}
                    onPress={() => setContentForm(prev => ({ ...prev, platform: p.key }))}
                  >
                    <ThemedText variant="small" color={contentForm.platform === p.key ? theme.buttonPrimaryText : theme.textPrimary}>
                      {p.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginBottom: Spacing.lg }}>
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.xs }}>内容</ThemedText>
              <TextInput
                style={{
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                  minHeight: 120,
                  textAlignVertical: 'top',
                }}
                placeholder="输入推广文案内容..."
                placeholderTextColor={theme.textMuted}
                value={contentForm.content}
                onChangeText={(text) => setContentForm(prev => ({ ...prev, content: text }))}
                multiline
              />
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: theme.backgroundDefault,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                }}
                onPress={() => setContentModalVisible(false)}
              >
                <ThemedText variant="body" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: theme.primary,
                  alignItems: 'center',
                }}
                onPress={handleCreateContent}
              >
                <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>保存</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
