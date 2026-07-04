import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface ChatSession {
  id: string;
  title: string;
  model: string;
  modelName: string;
  provider: string;
  messageCount: number;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
}

// 提供商颜色
const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97706',
  google: '#4285F4',
  deepseek: '#0066FF',
  zhipu: '#1A73E8',
  qwen: '#FF6A00',
  doubao: '#3370FF',
};

export default function ChatHistoryScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  /**
   * 服务端文件：server/src/routes/chat-history.ts
   * 接口：GET /api/v1/chat-history/user/:userId
   */
  const fetchSessions = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat-history/user/${userId}`
      );
      const data = await res.json();

      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error('Fetch chat history error:', error);
      // 使用模拟数据
      setSessions([
        {
          id: '1',
          title: '关于AI创作的讨论',
          model: 'gpt-4o',
          modelName: 'GPT-4o',
          provider: 'openai',
          messageCount: 12,
          lastMessage: '好的，我来帮你生成一个创意故事...',
          lastMessageAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          title: '代码优化建议',
          model: 'claude-3-5-sonnet',
          modelName: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          messageCount: 8,
          lastMessage: '这段代码可以优化为更高效的实现...',
          lastMessageAt: new Date(Date.now() - 172800000).toISOString(),
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchSessions();
    }, [fetchSessions])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSessions();
  };

  const deleteSession = async (sessionId: string) => {
    Alert.alert(
      '删除对话',
      '确定要删除这个对话吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat-history/${sessionId}`,
                { method: 'DELETE' }
              );
              setSessions(prev => prev.filter(s => s.id !== sessionId));
            } catch (error) {
              console.error('Delete session error:', error);
            }
          },
        },
      ]
    );
  };

  const continueSession = (session: ChatSession) => {
    // 跳转到聊天页面并传递会话ID
    router.push('/', { sessionId: session.id });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      s => s.title.toLowerCase().includes(query) || 
           s.lastMessage.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* 导航栏 */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <ThemedText variant="h4" color={theme.textPrimary} style={styles.navTitle}>对话历史</ThemedText>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <FontAwesome6 name="comments" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText variant="h3" color={theme.textPrimary}>对话历史</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                共 {sessions.length} 个对话
              </ThemedText>
            </View>
          </View>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* 搜索 */}
        <View style={styles.searchSection}>
          <ThemedView 
            level="tertiary" 
            style={[styles.searchInput, { borderColor: theme.border }]}
          >
            <FontAwesome6 name="magnifying-glass" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchTextInput, { color: theme.textPrimary }]}
              placeholder="搜索对话..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome6 name="xmark" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </ThemedView>
        </View>

        {/* 对话列表 */}
        {filteredSessions.length > 0 ? (
          <View style={styles.sessionList}>
            {filteredSessions.map((session) => {
              const providerColor = PROVIDER_COLORS[session.provider] || theme.primary;

              return (
                <ThemedView
                  key={session.id}
                  level="default"
                  style={[styles.sessionCard, { borderColor: theme.border }]}
                >
                  <TouchableOpacity 
                    style={styles.sessionHeader}
                    onPress={() => continueSession(session)}
                  >
                    <View style={[styles.sessionIcon, { backgroundColor: providerColor + '20' }]}>
                      <FontAwesome6 name="message" size={18} color={providerColor} />
                    </View>
                    <View style={styles.sessionInfo}>
                      <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.sessionTitle}>
                        {session.title}
                      </ThemedText>
                      <View style={styles.sessionMeta}>
                        <FontAwesome6 name="robot" size={10} color={theme.textMuted} />
                        <ThemedText variant="caption" color={theme.textMuted}>
                          {session.modelName}
                        </ThemedText>
                        <FontAwesome6 name="circle" size={4} color={theme.textMuted} />
                        <FontAwesome6 name="clock" size={10} color={theme.textMuted} />
                        <ThemedText variant="caption" color={theme.textMuted}>
                          {formatDate(session.lastMessageAt)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.sessionActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.backgroundTertiary }]}
                        onPress={() => continueSession(session)}
                      >
                        <FontAwesome6 name="arrow-right" size={12} color={theme.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: `${theme.error}20` }]}
                        onPress={() => deleteSession(session.id)}
                      >
                        <FontAwesome6 name="trash" size={12} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.sessionPreview}>
                    <ThemedText variant="small" color={theme.textSecondary} style={styles.previewText} numberOfLines={2}>
                      {session.lastMessage}
                    </ThemedText>
                    <View style={styles.messageCount}>
                      <FontAwesome6 name="message" size={10} color={theme.textMuted} />
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {session.messageCount} 条消息
                      </ThemedText>
                    </View>
                  </View>
                </ThemedView>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}20` }]}>
              <FontAwesome6 name="comments" size={32} color={theme.primary} />
            </View>
            <ThemedText variant="body" color={theme.textSecondary}>
              {searchQuery ? '未找到匹配的对话' : '暂无对话记录'}
            </ThemedText>
            <TouchableOpacity 
              style={styles.newSessionButton}
              onPress={() => router.push('/')}
            >
              <LinearGradient
                colors={[theme.primary, theme.accent]}
                style={styles.newSessionGradient}
              >
                <FontAwesome6 name="plus" size={14} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText variant="smallMedium" color="#fff">开始新对话</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
