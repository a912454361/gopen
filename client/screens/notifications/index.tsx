import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  data: any;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string }> = {
  'system': { icon: 'bell', color: '#8B5CF6' },
  'payment': { icon: 'credit-card', color: '#10B981' },
  'membership': { icon: 'crown', color: '#F59E0B' },
  'work': { icon: 'folder', color: '#06B6D4' },
  'comment': { icon: 'comment', color: '#EC4899' },
  'like': { icon: 'heart', color: '#EF4444' },
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      /**
       * 服务端文件：server/src/routes/notifications.ts
       * 接口：GET /api/v1/notifications/user/:userId
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/notifications/user/${userId}?limit=100`
      );
      const result = await response.json();

      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.unread_count || 0);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/notifications/${id}/read`,
        { method: 'PUT' }
      );
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;

    try {
      await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/notifications/read-all/${userId}`,
        { method: 'PUT' }
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      Alert.alert('成功', '全部已标记为已读');
    } catch (error) {
      console.error('Mark all read error:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="h4" color={theme.textPrimary}>消息通知</ThemedText>
        <ThemedText variant="label" color={theme.textMuted}>
          {unreadCount > 0 ? `${unreadCount} 条未读` : '暂无新消息'}
        </ThemedText>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.neonLine}
        />

        {/* Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.backgroundTertiary }]}
            onPress={handleMarkAllRead}
          >
            <ThemedText variant="labelSmall" color={theme.textSecondary}>全部已读</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 通知列表 */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}20` }]}>
              <FontAwesome6 name="bell-slash" size={32} color={theme.primary} />
            </View>
            <ThemedText variant="body" color={theme.textMuted}>暂无通知</ThemedText>
          </View>
        ) : (
          notifications.map(notification => {
            const iconConfig = NOTIFICATION_ICONS[notification.type] || { icon: 'bell', color: theme.primary };
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  { borderColor: theme.border },
                  !notification.is_read && [styles.notificationUnread, { borderLeftColor: theme.primary }],
                ]}
                onPress={() => !notification.is_read && handleMarkAsRead(notification.id)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationHeader}>
                  <View style={[styles.notificationIcon, { backgroundColor: `${iconConfig.color}20` }]}>
                    <FontAwesome6 name={iconConfig.icon as any} size={18} color={iconConfig.color} />
                    {!notification.is_read && (
                      <View style={[styles.badge, { backgroundColor: theme.error }]}>
                        <FontAwesome6 name="circle" size={6} color="#fff" solid />
                      </View>
                    )}
                  </View>
                  <View style={styles.notificationContent}>
                    <ThemedText variant="label" color={theme.textPrimary}>
                      {notification.title}
                    </ThemedText>
                    <View style={styles.notificationTime}>
                      <FontAwesome6 name="clock" size={10} color={theme.textMuted} />
                      <ThemedText variant="tiny" color={theme.textMuted} style={{ marginLeft: 4 }}>
                        {formatDate(notification.created_at)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                {notification.content && (
                  <View style={styles.notificationBody}>
                    <ThemedText variant="body" color={theme.textSecondary}>
                      {notification.content}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
