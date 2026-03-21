import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Post {
  id: number;
  user_id: number;
  work_id: number;
  title: string;
  content: string;
  images: string[];
  likes_count: number;
  comments_count: number;
  is_featured: boolean;
  created_at: string;
  project_title?: string;
  project_type?: string;
  work_content?: string;
  work_image?: string;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export default function CommunityScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'latest' | 'popular' | 'featured'>('latest');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const sort = activeTab === 'popular' ? 'popular' : 'latest';
      /**
       * 服务端文件：server/src/routes/community.ts
       * 接口：GET /api/v1/community/posts
       * Query 参数：page?: number, limit?: number, sort?: 'latest' | 'popular'
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/community/posts?limit=50&sort=${sort}`
      );
      const result = await response.json();

      if (result.success) {
        setPosts(result.data || []);
      }
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  const fetchComments = async (postId: number) => {
    try {
      /**
       * 服务端文件：server/src/routes/community.ts
       * 接口：GET /api/v1/community/posts/:id
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/community/posts/${postId}`
      );
      const result = await response.json();

      if (result.success) {
        setComments(result.data?.comments || []);
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
    }
  };

  const handleViewPost = (post: Post) => {
    setSelectedPost(post);
    setDetailModalVisible(true);
    fetchComments(post.id);
  };

  const handleLike = async (postId: number) => {
    if (!userId) {
      Alert.alert('提示', '请先登录');
      return;
    }

    try {
      /**
       * 服务端文件：server/src/routes/community.ts
       * 接口：POST /api/v1/community/posts/:id/like
       * Body 参数：user_id: number
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/community/posts/${postId}/like`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: parseInt(userId, 10) }),
        }
      );
      const result = await response.json();

      if (result.success) {
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, likes_count: p.likes_count + (result.liked ? 1 : -1) }
              : p
          )
        );
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (result.liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleAddComment = async () => {
    if (!userId || !selectedPost || !newComment.trim()) return;

    try {
      /**
       * 服务端文件：server/src/routes/community.ts
       * 接口：POST /api/v1/community/posts/:id/comments
       * Body 参数：user_id: number, content: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/community/posts/${selectedPost.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: parseInt(userId, 10),
            content: newComment.trim(),
          }),
        }
      );
      const result = await response.json();

      if (result.success) {
        setComments(prev => [...prev, result.data]);
        setNewComment('');
        setPosts(prev =>
          prev.map(p =>
            p.id === selectedPost.id
              ? { ...p, comments_count: p.comments_count + 1 }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const featuredPosts = useMemo(() => posts.filter(p => p.is_featured).slice(0, 5), [posts]);

  const tabs = [
    { key: 'latest', label: '最新' },
    { key: 'popular', label: '热门' },
    { key: 'featured', label: '精选' },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* Header */}
      <View style={styles.header}>
        <ThemedText variant="h4" color={theme.textPrimary}>创作社区</ThemedText>
        <ThemedText variant="label" color={theme.textMuted}>发现精彩作品</ThemedText>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.neonLine}
        />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              activeTab === tab.key
                ? { backgroundColor: theme.primary }
                : { borderColor: theme.border },
            ]}
            onPress={() => setActiveTab(tab.key as 'latest' | 'popular' | 'featured')}
          >
            <ThemedText
              variant="labelSmall"
              color={activeTab === tab.key ? '#fff' : theme.textMuted}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* 帖子列表 */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 精选推荐 */}
        {featuredPosts.length > 0 && activeTab === 'latest' && (
          <View style={styles.featuredSection}>
            <View style={styles.sectionTitle}>
              <FontAwesome6 name="star" size={16} color={theme.accent} />
              <ThemedText variant="label" color={theme.textPrimary}>精选推荐</ThemedText>
            </View>
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featuredPosts.map(post => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.featuredCard}
                  onPress={() => handleViewPost(post)}
                >
                  <Image
                    source={{ uri: post.work_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' }}
                    style={styles.featuredImage}
                  />
                  <View style={styles.featuredInfo}>
                    <ThemedText variant="label" color={theme.textPrimary} numberOfLines={1}>
                      {post.title || post.project_title}
                    </ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs }}>
                      <FontAwesome6 name="heart" size={12} color={theme.error} />
                      <ThemedText variant="tiny" color={theme.textMuted} style={{ marginLeft: 4 }}>
                        {post.likes_count}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              </ScrollView>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}20` }]}>
              <FontAwesome6 name="users" size={32} color={theme.primary} />
            </View>
            <ThemedText variant="body" color={theme.textMuted}>社区还没有内容</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>快去分享你的作品吧</ThemedText>
          </View>
        ) : (
          posts.map(post => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => handleViewPost(post)}
              activeOpacity={0.8}
            >
              {/* Header */}
              <View style={styles.postHeader}>
                <View style={[styles.avatar, { backgroundColor: `${theme.primary}20` }]}>
                  <FontAwesome6 name="user" size={18} color={theme.primary} />
                </View>
                <View style={styles.authorInfo}>
                  <ThemedText variant="label" color={theme.textPrimary}>
                    创作者 #{post.user_id}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    {formatDate(post.created_at)}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.followButton, { backgroundColor: theme.primary }]}
                >
                  <ThemedText variant="tiny" color="#fff">关注</ThemedText>
                </TouchableOpacity>
              </View>

              {/* Title */}
              {post.title && (
                <View style={styles.postTitle}>
                  <ThemedText variant="title" color={theme.textPrimary}>{post.title}</ThemedText>
                </View>
              )}

              {/* Content */}
              <View style={styles.postContent}>
                <ThemedText variant="body" color={theme.textSecondary} numberOfLines={4}>
                  {post.content || post.work_content}
                </ThemedText>

                {/* Work Reference */}
                {post.project_title && (
                  <View style={[styles.postWorkRef, { backgroundColor: theme.backgroundTertiary }]}>
                    <FontAwesome6 name="link" size={14} color={theme.primary} />
                    <ThemedText variant="labelSmall" color={theme.textSecondary} style={{ marginLeft: Spacing.sm }}>
                      作品：{post.project_title}
                    </ThemedText>
                  </View>
                )}

                {/* Image */}
                {post.work_image && (
                  <Image
                    source={{ uri: post.work_image }}
                    style={styles.postImage}
                  />
                )}
              </View>

              {/* Footer */}
              <View style={[styles.postFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleLike(post.id)}
                >
                  <FontAwesome6
                    name={likedPosts.has(post.id) ? 'heart' : 'heart'}
                    solid={likedPosts.has(post.id)}
                    size={18}
                    color={likedPosts.has(post.id) ? theme.error : theme.textMuted}
                  />
                  <ThemedText variant="labelSmall" color={theme.textMuted}>
                    {post.likes_count}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <FontAwesome6 name="comment" size={18} color={theme.textMuted} />
                  <ThemedText variant="labelSmall" color={theme.textMuted}>
                    {post.comments_count}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <FontAwesome6 name="share" size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 详情Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setDetailModalVisible(false)} />
          <ThemedView level="default" style={[styles.modalContent]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText variant="h4" color={theme.textPrimary}>
                {selectedPost?.title || selectedPost?.project_title || '帖子详情'}
              </ThemedText>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedPost && (
                <>
                  <ThemedText variant="body" color={theme.textPrimary}>
                    {selectedPost.content || selectedPost.work_content}
                  </ThemedText>

                  {/* Comments */}
                  <View style={styles.commentsList}>
                    <ThemedText variant="label" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                      评论 ({comments.length})
                    </ThemedText>
                    {comments.map(comment => (
                      <View key={comment.id} style={styles.commentItem}>
                        <View style={[styles.avatar, { width: 32, height: 32, borderRadius: 16, marginRight: Spacing.sm }]}>
                          <FontAwesome6 name="user" size={14} color={theme.textMuted} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText variant="labelSmall" color={theme.textSecondary}>
                            用户 #{comment.user_id}
                          </ThemedText>
                          <ThemedText variant="body" color={theme.textPrimary}>
                            {comment.content}
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TextInput
                style={[styles.commentInput, { borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="写下你的评论..."
                placeholderTextColor={theme.textMuted}
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={[styles.sendButton, { backgroundColor: theme.primary }]}
                onPress={handleAddComment}
              >
                <ThemedText variant="label" color="#fff">发送</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </Screen>
  );
}
