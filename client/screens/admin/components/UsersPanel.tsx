/**
 * 用户管理面板
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface User {
  id: string;
  nickname?: string;
  phone?: string;
  member_level: string;
  member_expire_at?: string;
  created_at: string;
  total_spent?: number;
  order_count?: number;
}

interface UsersPanelProps {
  adminKey: string;
}

export function UsersPanel({ adminKey }: UsersPanelProps) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'free' | 'member' | 'super'>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const levelParam = filter === 'all' ? '' : `&level=${filter}`;
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/users?key=${adminKey}${levelParam}`
      );
      const result = await response.json();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateMember = async (userId: string, level: string, months: number) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, userId, memberLevel: level, months }),
      });
      
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', '会员状态已更新');
        fetchUsers();
        setSelectedUser(null);
      } else {
        Alert.alert('错误', result.error || '操作失败');
      }
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchText) return true;
    return user.id?.includes(searchText) || 
           user.nickname?.includes(searchText) ||
           user.phone?.includes(searchText);
  });

  const getMemberBadge = (level: string) => {
    switch (level) {
      case 'super':
        return { label: '超级会员', color: '#FFD700', bg: 'rgba(255,215,0,0.1)' };
      case 'member':
        return { label: '普通会员', color: theme.primary, bg: 'rgba(79,70,229,0.1)' };
      default:
        return { label: '免费用户', color: '#64748B', bg: 'rgba(100,116,139,0.1)' };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const levelTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'free', label: '免费用户' },
    { key: 'member', label: '普通会员' },
    { key: 'super', label: '超级会员' },
  ];

  return (
    <View style={{ gap: Spacing.xl }}>
      {/* 筛选栏 */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: Spacing.md,
      }}>
        {/* 等级筛选 */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {levelTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={{
                paddingVertical: Spacing.sm,
                paddingHorizontal: Spacing.lg,
                backgroundColor: filter === tab.key ? theme.primary : theme.backgroundTertiary,
                borderRadius: BorderRadius.lg,
              }}
              onPress={() => setFilter(tab.key)}
            >
              <ThemedText variant="small" color={filter === tab.key ? '#fff' : theme.textPrimary}>
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 搜索框 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
          backgroundColor: theme.backgroundTertiary,
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          minWidth: 250,
        }}>
          <FontAwesome6 name="search" size={14} color={theme.textMuted} />
          <TextInput
            style={{ flex: 1, color: theme.textPrimary, outline: 'none' }}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="搜索用户ID/昵称/手机号"
            placeholderTextColor={theme.textMuted}
          />
        </View>
      </View>

      {/* 用户列表 */}
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'] }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={{ 
          alignItems: 'center', 
          paddingVertical: Spacing['3xl'],
          backgroundColor: theme.backgroundDefault,
          borderRadius: BorderRadius.xl,
        }}>
          <FontAwesome6 name="users-slash" size={48} color={theme.textMuted} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            暂无用户
          </ThemedText>
        </View>
      ) : (
        <View style={{ gap: Spacing.md }}>
          {/* 表头 */}
          <View style={{
            flexDirection: 'row',
            paddingVertical: Spacing.md,
            paddingHorizontal: Spacing.lg,
            backgroundColor: theme.backgroundTertiary,
            borderRadius: BorderRadius.lg,
          }}>
            <View style={{ flex: 2 }}><ThemedText variant="caption" color={theme.textMuted}>用户</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>会员等级</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>到期时间</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>消费金额</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>订单数</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>注册时间</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>操作</ThemedText></View>
          </View>

          {/* 用户行 */}
          {filteredUsers.map(user => {
            const badge = getMemberBadge(user.member_level);
            return (
              <View
                key={user.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: Spacing.lg,
                  paddingHorizontal: Spacing.lg,
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: theme.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <FontAwesome6 name="user" size={16} color="#fff" />
                  </View>
                  <View>
                    <ThemedText variant="small" color={theme.textPrimary}>
                      {user.nickname || '未设置昵称'}
                    </ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      {user.id.substring(0, 12)}...
                    </ThemedText>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing.xs,
                    backgroundColor: badge.bg,
                    borderRadius: BorderRadius.sm,
                    alignSelf: 'flex-start',
                  }}>
                    <ThemedText variant="tiny" color={badge.color}>{badge.label}</ThemedText>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="small" color={theme.textPrimary}>
                    {formatDate(user.member_expire_at || '')}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="smallMedium" color={theme.primary}>
                    ¥{((user.total_spent || 0) / 100).toFixed(2)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="small" color={theme.textPrimary}>
                    {user.order_count || 0} 笔
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {formatDate(user.created_at)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    style={{
                      paddingVertical: Spacing.xs,
                      paddingHorizontal: Spacing.md,
                      backgroundColor: theme.backgroundTertiary,
                      borderRadius: BorderRadius.md,
                    }}
                    onPress={() => setSelectedUser(user)}
                  >
                    <ThemedText variant="tiny" color={theme.primary}>管理</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 用户详情弹窗 */}
      {selectedUser && (
        <View style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <View style={{
            width: 500,
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <ThemedText variant="h4" color={theme.textPrimary}>用户管理</ThemedText>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: Spacing.md, marginBottom: Spacing.xl }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText variant="small" color={theme.textMuted}>用户ID</ThemedText>
                <ThemedText variant="small" color={theme.textPrimary}>{selectedUser.id}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText variant="small" color={theme.textMuted}>昵称</ThemedText>
                <ThemedText variant="small" color={theme.textPrimary}>{selectedUser.nickname || '-'}</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ThemedText variant="small" color={theme.textMuted}>当前等级</ThemedText>
                <ThemedText variant="small" color={theme.textPrimary}>{getMemberBadge(selectedUser.member_level).label}</ThemedText>
              </View>
            </View>

            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
              快捷操作
            </ThemedText>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              <TouchableOpacity
                style={{
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  backgroundColor: theme.primary,
                  borderRadius: BorderRadius.lg,
                }}
                onPress={() => handleUpdateMember(selectedUser.id, 'member', 1)}
              >
                <ThemedText variant="small" color="#fff">开通普通会员(1月)</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  backgroundColor: '#FFD700',
                  borderRadius: BorderRadius.lg,
                }}
                onPress={() => handleUpdateMember(selectedUser.id, 'super', 1)}
              >
                <ThemedText variant="small" color="#000">开通超级会员(1月)</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  backgroundColor: theme.error,
                  borderRadius: BorderRadius.lg,
                }}
                onPress={() => handleUpdateMember(selectedUser.id, 'free', 0)}
              >
                <ThemedText variant="small" color="#fff">取消会员</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 统计 */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        backgroundColor: theme.backgroundTertiary,
        borderRadius: BorderRadius.lg,
      }}>
        <ThemedText variant="small" color={theme.textMuted}>
          共 {filteredUsers.length} 位用户
        </ThemedText>
        <TouchableOpacity onPress={fetchUsers} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <FontAwesome6 name="rotate" size={12} color={theme.primary} />
          <ThemedText variant="small" color={theme.primary}>刷新</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
