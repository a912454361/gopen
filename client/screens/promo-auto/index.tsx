import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 平台配置 - 全面支持国内外主流平台
const PLATFORM_CATEGORIES = [
  {
    category: '国内社交',
    platforms: [
      { id: 'weibo', name: '微博', icon: 'weibo', color: '#E6162D' },
      { id: 'wechat', name: '微信', icon: 'weixin', color: '#07C160' },
      { id: 'wechat_moments', name: '朋友圈', icon: 'comments', color: '#07C160' },
      { id: 'wechat_mp', name: '公众号', icon: 'newspaper', color: '#07C160' },
    ],
  },
  {
    category: '短视频/直播',
    platforms: [
      { id: 'douyin', name: '抖音', icon: 'tiktok', color: '#000000' },
      { id: 'kuaishou', name: '快手', icon: 'video', color: '#FF4906' },
      { id: 'bilibili', name: 'B站', icon: 'bilibili', color: '#FB7299' },
      { id: 'shipinhao', name: '视频号', icon: 'video', color: '#07C160' },
    ],
  },
  {
    category: '内容社区',
    platforms: [
      { id: 'xiaohongshu', name: '小红书', icon: 'book', color: '#FE2C55' },
      { id: 'zhihu', name: '知乎', icon: 'zhihu', color: '#0084FF' },
      { id: 'tieba', name: '贴吧', icon: 'users', color: '#4879BD' },
      { id: 'douban', name: '豆瓣', icon: 'leaf', color: '#00B51D' },
      { id: 'jianshu', name: '简书', icon: 'pen', color: '#EA6F5A' },
    ],
  },
  {
    category: '自媒体平台',
    platforms: [
      { id: 'toutiao', name: '今日头条', icon: 'newspaper', color: '#F85959' },
      { id: 'baijiahao', name: '百家号', icon: 'pen', color: '#2932E1' },
      { id: 'dayuhao', name: '大鱼号', icon: 'fish', color: '#FF6A00' },
      { id: 'souhuhao', name: '搜狐号', icon: 'newspaper', color: '#FF6600' },
      { id: 'wangyihao', name: '网易号', icon: 'newspaper', color: '#D43C33' },
      { id: 'qiehao', name: '企鹅号', icon: 'qq', color: '#12B7F5' },
      { id: 'yidianzixun', name: '一点资讯', icon: 'circle-info', color: '#FF0000' },
    ],
  },
  {
    category: '电商/生活',
    platforms: [
      { id: 'xianyu', name: '闲鱼', icon: 'shopping-bag', color: '#FFE14D' },
      { id: 'zhuanzhuan', name: '转转', icon: 'recycle', color: '#FFC800' },
      { id: 'meituan', name: '美团', icon: 'shop', color: '#FFD000' },
      { id: 'dianping', name: '大众点评', icon: 'star', color: '#FF6633' },
      { id: 'xiecheng', name: '携程', icon: 'plane', color: '#2577E3' },
      { id: 'mafengwo', name: '马蜂窝', icon: 'location-dot', color: '#FF9900' },
    ],
  },
  {
    category: '财经/专业',
    platforms: [
      { id: 'xueqiu', name: '雪球', icon: 'chart-line', color: '#0078FF' },
      { id: 'eastmoney', name: '东方财富', icon: 'coins', color: '#FF6600' },
    ],
  },
  {
    category: '国际平台',
    platforms: [
      { id: 'twitter', name: 'Twitter/X', icon: 'x-twitter', color: '#000000' },
      { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#1877F2' },
      { id: 'instagram', name: 'Instagram', icon: 'instagram', color: '#E4405F' },
      { id: 'tiktok_global', name: 'TikTok', icon: 'tiktok', color: '#000000' },
      { id: 'youtube', name: 'YouTube', icon: 'youtube', color: '#FF0000' },
      { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2' },
      { id: 'pinterest', name: 'Pinterest', icon: 'pinterest', color: '#BD081C' },
      { id: 'reddit', name: 'Reddit', icon: 'reddit', color: '#FF4500' },
      { id: 'medium', name: 'Medium', icon: 'medium', color: '#000000' },
      { id: 'quora', name: 'Quora', icon: 'quora', color: '#B92B27' },
      { id: 'discord', name: 'Discord', icon: 'discord', color: '#5865F2' },
      { id: 'telegram', name: 'Telegram', icon: 'telegram', color: '#26A5E4' },
    ],
  },
  {
    category: 'SEO/搜索',
    platforms: [
      { id: 'baidu_seo', name: '百度收录', icon: 'magnifying-glass', color: '#2932E1' },
      { id: 'google_seo', name: 'Google收录', icon: 'google', color: '#4285F4' },
      { id: 'bing_seo', name: 'Bing收录', icon: 'microsoft', color: '#00809D' },
      { id: 'sogou_seo', name: '搜狗收录', icon: 'magnifying-glass', color: '#FF6600' },
      { id: 'so_seo', name: '360搜索', icon: 'magnifying-glass', color: '#19B955' },
    ],
  },
  {
    category: '其他',
    platforms: [
      { id: 'forum', name: '论坛', icon: 'comments', color: '#6B7280' },
      { id: 'community', name: '社区', icon: 'users', color: '#8B5CF6' },
      { id: 'blog', name: '博客', icon: 'pen', color: '#F59E0B' },
    ],
  },
];

// 扁平化平台列表（用于快速查找）
const PLATFORMS = PLATFORM_CATEGORIES.flatMap(cat => cat.platforms);

interface PromoLink {
  id: string;
  name: string;
  code: string;
  platform: string;
  target_url: string;
  promo_url: string;
  clicks: number;
  conversions: number;
  status: string;
}

interface PromoTask {
  id: string;
  name: string;
  type: string;
  platforms: string;
  status: string;
  run_count: number;
  success_count: number;
  fail_count: number;
}

interface Stats {
  total_links: number;
  total_tasks: number;
  total_visits: number;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: string;
  platform_stats: Record<string, number>;
}

export default function PromoAutoScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'links' | 'tasks' | 'stats'>('links');
  const [links, setLinks] = useState<PromoLink[]>([]);
  const [tasks, setTasks] = useState<PromoTask[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  
  // 创建链接表单
  const [linkForm, setLinkForm] = useState({
    name: '',
    platform: 'weibo',
    target_url: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
  });
  
  // 创建任务表单
  const [taskForm, setTaskForm] = useState({
    name: '',
    type: 'auto_post',
    platforms: [] as string[],
    content_template: '',
    schedule_type: 'daily',
    risk_control: {
      min_delay: 5000,
      max_delay: 30000,
      max_per_hour: 10,
    },
  });

  // 加载数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [linksRes, tasksRes, statsRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promo/links`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promo/tasks`),
        fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promo/stats/overview`),
      ]);
      
      const linksData = await linksRes.json();
      const tasksData = await tasksRes.json();
      const statsData = await statsRes.json();
      
      if (linksData.success) setLinks(linksData.data || []);
      if (tasksData.success) setTasks(tasksData.data || []);
      if (statsData.success) setStats(statsData.data);
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // 创建推广链接
  const handleCreateLink = async () => {
    if (!linkForm.name || !linkForm.target_url) {
      Alert.alert('提示', '请填写链接名称和目标URL');
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promo/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkForm),
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('成功', '推广链接创建成功');
        setCreateModalVisible(false);
        setLinkForm({ name: '', platform: 'weibo', target_url: '', utm_source: '', utm_medium: '', utm_campaign: '' });
        fetchData();
      } else {
        Alert.alert('错误', data.error || '创建失败');
      }
    } catch (error) {
      console.error('Create link error:', error);
      Alert.alert('错误', '创建失败');
    }
  };

  // 创建推广任务
  const handleCreateTask = async () => {
    if (!taskForm.name || taskForm.platforms.length === 0) {
      Alert.alert('提示', '请填写任务名称并选择推广平台');
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promo/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          link_ids: links.map(l => l.id).slice(0, 5),
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('成功', '推广任务创建成功');
        setTaskModalVisible(false);
        setTaskForm({
          name: '',
          type: 'auto_post',
          platforms: [],
          content_template: '',
          schedule_type: 'daily',
          risk_control: { min_delay: 5000, max_delay: 30000, max_per_hour: 10 },
        });
        fetchData();
      } else {
        Alert.alert('错误', data.error || '创建失败');
      }
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('错误', '创建失败');
    }
  };

  // 执行任务
  const handleExecuteTask = async (taskId: string) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promo/tasks/${taskId}/execute`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('成功', '任务已开始执行');
        fetchData();
      } else {
        Alert.alert('错误', data.error || '执行失败');
      }
    } catch (error) {
      console.error('Execute task error:', error);
      Alert.alert('错误', '执行失败');
    }
  };

  // 切换平台选择
  const togglePlatform = (platformId: string) => {
    setTaskForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId],
    }));
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="h4" color={theme.textPrimary}>自动推广系统</ThemedText>
        <ThemedText variant="label" color={theme.textMuted}>智能推广 + 效果监控</ThemedText>
        <LinearGradient colors={[theme.primary, theme.accent]} style={styles.neonLine} />
      </View>

      {/* Stats Overview */}
      {stats && (
        <View style={[styles.statsRow, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.statItem}>
            <ThemedText variant="h3" color={theme.primary}>{stats.total_links}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>推广链接</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText variant="h3" color={theme.accent}>{stats.total_clicks}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>总点击</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText variant="h3" color={theme.success}>{stats.conversion_rate}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>转化率</ThemedText>
          </View>
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'links', label: '推广链接', icon: 'link' },
          { key: 'tasks', label: '推广任务', icon: 'tasks' },
          { key: 'stats', label: '数据监控', icon: 'chart-line' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <FontAwesome6 name={tab.icon as any} size={14} color={activeTab === tab.key ? '#fff' : theme.textMuted} />
            <ThemedText variant="labelSmall" color={activeTab === tab.key ? '#fff' : theme.textMuted}>
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Links Tab */}
          {activeTab === 'links' && (
            <>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.primary }]}
                onPress={() => setCreateModalVisible(true)}
              >
                <FontAwesome6 name="plus" size={16} color="#fff" />
                <ThemedText variant="label" color="#fff" style={{ marginLeft: Spacing.sm }}>创建推广链接</ThemedText>
              </TouchableOpacity>

              {links.map(link => (
                <View key={link.id} style={[styles.linkCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                  <View style={styles.linkHeader}>
                    <ThemedText variant="label" color={theme.textPrimary}>{link.name}</ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: link.status === 'active' ? theme.success + '20' : theme.textMuted + '20' }]}>
                      <ThemedText variant="tiny" color={link.status === 'active' ? theme.success : theme.textMuted}>
                        {link.status === 'active' ? '运行中' : '已暂停'}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText variant="caption" color={theme.textMuted} numberOfLines={1}>{link.promo_url}</ThemedText>
                  <View style={styles.linkStats}>
                    <View style={styles.linkStatItem}>
                      <FontAwesome6 name="hand-pointer" size={12} color={theme.primary} />
                      <ThemedText variant="caption" color={theme.textSecondary}>{link.clicks} 点击</ThemedText>
                    </View>
                    <View style={styles.linkStatItem}>
                      <FontAwesome6 name="circle-check" size={12} color={theme.success} />
                      <ThemedText variant="caption" color={theme.textSecondary}>{link.conversions} 转化</ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.accent }]}
                onPress={() => setTaskModalVisible(true)}
              >
                <FontAwesome6 name="plus" size={16} color="#fff" />
                <ThemedText variant="label" color="#fff" style={{ marginLeft: Spacing.sm }}>创建推广任务</ThemedText>
              </TouchableOpacity>

              {tasks.map(task => (
                <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                  <View style={styles.taskHeader}>
                    <ThemedText variant="label" color={theme.textPrimary}>{task.name}</ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: theme.primary + '20' }]}>
                      <ThemedText variant="tiny" color={theme.primary}>{task.type}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.taskStats}>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      执行 {task.run_count} 次 | 成功 {task.success_count} | 失败 {task.fail_count}
                    </ThemedText>
                  </View>
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={[styles.executeButton, { backgroundColor: theme.success }]}
                      onPress={() => handleExecuteTask(task.id)}
                    >
                      <FontAwesome6 name="play" size={12} color="#fff" />
                      <ThemedText variant="caption" color="#fff" style={{ marginLeft: 4 }}>立即执行</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <View style={styles.statsContainer}>
              <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <ThemedText variant="label" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>平台分布</ThemedText>
                {Object.entries(stats.platform_stats).map(([platform, count]) => (
                  <View key={platform} style={styles.platformStatRow}>
                    <ThemedText variant="caption" color={theme.textSecondary}>{platform}</ThemedText>
                    <ThemedText variant="label" color={theme.primary}>{count}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <ThemedText variant="label" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>推广效果</ThemedText>
                <View style={styles.effectRow}>
                  <View style={styles.effectItem}>
                    <ThemedText variant="h2" color={theme.primary}>{stats.total_visits}</ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>访问量</ThemedText>
                  </View>
                  <View style={styles.effectItem}>
                    <ThemedText variant="h2" color={theme.accent}>{stats.total_conversions}</ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>转化数</ThemedText>
                  </View>
                </View>
              </View>

              {/* 风控提示 */}
              <View style={[styles.riskCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
                <View style={styles.riskHeader}>
                  <FontAwesome6 name="shield-halved" size={20} color={theme.success} />
                  <ThemedText variant="label" color={theme.textPrimary}>风控状态</ThemedText>
                </View>
                <ThemedText variant="caption" color={theme.textSecondary}>
                  已启用频率限制：每小时最多 10 次，随机延迟 5-30 秒
                </ThemedText>
                <ThemedText variant="caption" color={theme.success} style={{ marginTop: Spacing.sm }}>
                  当前运行正常，无异常行为
                </ThemedText>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Create Link Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>创建推广链接</ThemedText>
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="链接名称"
              placeholderTextColor={theme.textMuted}
              value={linkForm.name}
              onChangeText={text => setLinkForm(prev => ({ ...prev, name: text }))}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="目标URL"
              placeholderTextColor={theme.textMuted}
              value={linkForm.target_url}
              onChangeText={text => setLinkForm(prev => ({ ...prev, target_url: text }))}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="UTM Source (来源)"
              placeholderTextColor={theme.textMuted}
              value={linkForm.utm_source}
              onChangeText={text => setLinkForm(prev => ({ ...prev, utm_source: text }))}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, { borderColor: theme.border }]} onPress={() => setCreateModalVisible(false)}>
                <ThemedText variant="label" color={theme.textSecondary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primary }]} onPress={handleCreateLink}>
                <ThemedText variant="label" color="#fff">创建</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Task Modal */}
      <Modal visible={taskModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>创建推广任务</ThemedText>
            
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
              placeholder="任务名称"
              placeholderTextColor={theme.textMuted}
              value={taskForm.name}
              onChangeText={text => setTaskForm(prev => ({ ...prev, name: text }))}
            />

            <ThemedText variant="labelSmall" color={theme.textSecondary} style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>选择推广平台（按类别）</ThemedText>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {PLATFORM_CATEGORIES.map(category => (
                <View key={category.category} style={{ marginBottom: Spacing.md }}>
                  <ThemedText variant="tiny" color={theme.textMuted} style={{ marginBottom: Spacing.xs }}>
                    {category.category}
                  </ThemedText>
                  <View style={styles.platformGrid}>
                    {category.platforms.map(platform => (
                      <TouchableOpacity
                        key={platform.id}
                        style={[
                          styles.platformButton,
                          { borderColor: taskForm.platforms.includes(platform.id) ? theme.primary : theme.border },
                          taskForm.platforms.includes(platform.id) && { backgroundColor: theme.primary + '20' },
                        ]}
                        onPress={() => togglePlatform(platform.id)}
                      >
                        <FontAwesome6 name={platform.icon as any} size={14} color={taskForm.platforms.includes(platform.id) ? theme.primary : theme.textMuted} />
                        <ThemedText variant="tiny" color={taskForm.platforms.includes(platform.id) ? theme.primary : theme.textMuted}>
                          {platform.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            <ThemedText variant="labelSmall" color={theme.textSecondary} style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>风控配置</ThemedText>
            <View style={[styles.riskConfig, { backgroundColor: theme.backgroundTertiary }]}>
              <ThemedText variant="caption" color={theme.textSecondary}>
                每小时限制: {taskForm.risk_control.max_per_hour} 次
              </ThemedText>
              <ThemedText variant="caption" color={theme.textSecondary}>
                随机延迟: {taskForm.risk_control.min_delay / 1000}-{taskForm.risk_control.max_delay / 1000} 秒
              </ThemedText>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, { borderColor: theme.border }]} onPress={() => setTaskModalVisible(false)}>
                <ThemedText variant="label" color={theme.textSecondary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.accent }]} onPress={handleCreateTask}>
                <ThemedText variant="label" color="#fff">创建</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

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
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  tabBar: {
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
    gap: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  createButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  linkCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  linkHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  linkStats: {
    flexDirection: 'row' as const,
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  linkStatItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  taskCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  taskHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  taskStats: {
    marginBottom: Spacing.md,
  },
  taskActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
  },
  executeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statsContainer: {
    gap: Spacing.lg,
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  platformStatRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: Spacing.sm,
  },
  effectRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  effectItem: {
    alignItems: 'center' as const,
  },
  riskCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  riskHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  input: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  platformGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
  },
  platformButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  riskConfig: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  modalActions: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
};
