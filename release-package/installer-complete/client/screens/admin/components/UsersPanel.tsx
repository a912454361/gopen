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
  Modal,
  ScrollView,
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
  email?: string;
  member_level: string;
  member_expire_at?: string;
  created_at: string;
  total_spent?: number;
  order_count?: number;
  balance?: number;      // 余额（分）
  g_points?: number;     // G点
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
  
  // 资金调整相关状态
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'balance' | 'g_points'>('balance');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  /**
   * 服务端文件：server/src/routes/admin.ts
   * 接口：POST /api/v1/admin/users/update
   * Body 参数：adminKey: string, userId: string, memberLevel: string, months: number
   */
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

  /**
   * 服务端文件：server/src/routes/admin.ts
   * 接口：POST /api/v1/admin/funds/adjust
   * Body 参数：adminKey: string, userId: string, type: 'balance' | 'g_points', amount: number, remark: string
   */
  const handleAdjustFunds = useCallback(async () => {
    if (!selectedUser) return;
    
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount === 0) {
      Alert.alert('提示', '请输入有效的调整金额（正数增加，负数减少）');
      return;
    }
    
    if (!adjustRemark.trim()) {
      Alert.alert('提示', '请输入调整原因（必填）');
      return;
    }
    
    setIsProcessing(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/funds/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminKey,
          userId: selectedUser.id,
          type: adjustType,
          amount,
          remark: adjustRemark,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('成功', '资金调整成功');
        setShowAdjustModal(false);
        setAdjustAmount('');
        setAdjustRemark('');
        // 刷新用户列表
        await fetchUsers();
        // 更新选中用户信息
        const updatedUser = {
          ...selectedUser,
          [adjustType]: data.data.newValue,
        };
        setSelectedUser(updatedUser);
      } else {
        Alert.alert('失败', data.error || '调整失败');
      }
    } catch (error) {
      console.error('Adjust funds error:', error);
      Alert.alert('错误', '网络错误');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedUser, adjustType, adjustAmount, adjustRemark, adminKey, fetchUsers]);

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
          <FontAwesome6 name="magnifying-glass" size={14} color={theme.textMuted} />
          <TextInput
            style={{ flex: 1, color: theme.textPrimary }}
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
            <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>会员等级</ThemedText></View>
            <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>余额</ThemedText></View>
            <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>G点</ThemedText></View>
            <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>消费金额</ThemedText></View>
            <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>订单数</ThemedText></View>
            <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>注册时间</ThemedText></View>
            <View style={{ flex: 1, alignItems: 'center' }}><ThemedText variant="caption" color={theme.textMuted}>操作</ThemedText></View>
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
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    ¥{((user.balance || 0) / 100).toFixed(2)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText variant="smallMedium" color={theme.accent}>
                    {(user.g_points || 0).toLocaleString()}
                  </ThemedText>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText variant="smallMedium" color={theme.primary}>
                    ¥{((user.total_spent || 0) / 100).toFixed(2)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText variant="small" color={theme.textPrimary}>
                    {user.order_count || 0} 笔
                  </ThemedText>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {formatDate(user.created_at)}
                  </ThemedText>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
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
          position: 'absolute',
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
            maxWidth: '90%',
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

            <View style={{ gap: Spacing.md, marginBottom: Spacing.lg }}>
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

            {/* 资金信息 */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-around', 
              paddingVertical: Spacing.md,
              backgroundColor: theme.backgroundTertiary,
              borderRadius: BorderRadius.lg,
              marginBottom: Spacing.lg,
            }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <ThemedText variant="tiny" color={theme.textMuted}>账户余额</ThemedText>
                <ThemedText variant="h4" color={theme.textPrimary}>
                  ¥{((selectedUser.balance || 0) / 100).toFixed(2)}
                </ThemedText>
                <TouchableOpacity
                  style={{
                    marginTop: Spacing.xs,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    backgroundColor: theme.primary + '20',
                    borderRadius: BorderRadius.sm,
                  }}
                  onPress={() => {
                    setAdjustType('balance');
                    setShowAdjustModal(true);
                  }}
                >
                  <FontAwesome6 name="pen" size={10} color={theme.primary} />
                  <ThemedText variant="tiny" color={theme.primary}>调整</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <ThemedText variant="tiny" color={theme.textMuted}>G点余额</ThemedText>
                <ThemedText variant="h4" color={theme.accent}>
                  {(selectedUser.g_points || 0).toLocaleString()}
                </ThemedText>
                <TouchableOpacity
                  style={{
                    marginTop: Spacing.xs,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    backgroundColor: theme.accent + '20',
                    borderRadius: BorderRadius.sm,
                  }}
                  onPress={() => {
                    setAdjustType('g_points');
                    setShowAdjustModal(true);
                  }}
                >
                  <FontAwesome6 name="pen" size={10} color={theme.accent} />
                  <ThemedText variant="tiny" color={theme.accent}>调整</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
              会员管理
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

      {/* 资金调整弹窗 */}
      <Modal
        visible={showAdjustModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: 420,
            maxWidth: '90%',
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
          }}>
            {/* 弹窗标题 */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: Spacing.lg,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: BorderRadius.md,
                  backgroundColor: adjustType === 'balance' ? theme.primary + '20' : theme.accent + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <FontAwesome6 
                    name={adjustType === 'balance' ? 'wallet' : 'coins'} 
                    size={18} 
                    color={adjustType === 'balance' ? theme.primary : theme.accent} 
                  />
                </View>
                <ThemedText variant="h4" color={theme.textPrimary}>
                  {adjustType === 'balance' ? '调整余额' : '调整G点'}
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* 用户信息 */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              padding: Spacing.md,
              backgroundColor: theme.backgroundTertiary,
              borderRadius: BorderRadius.lg,
              marginBottom: Spacing.lg,
            }}>
              <FontAwesome6 name="user" size={14} color={theme.textMuted} />
              <ThemedText variant="small" color={theme.textSecondary}>
                用户: {selectedUser?.nickname || selectedUser?.email?.split('@')[0] || selectedUser?.id.substring(0, 12)}
              </ThemedText>
            </View>

            {/* 当前余额 */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingVertical: Spacing.md,
              marginBottom: Spacing.lg,
            }}>
              <View style={{ alignItems: 'center' }}>
                <ThemedText variant="tiny" color={theme.textMuted}>当前余额</ThemedText>
                <ThemedText variant="h4" color={theme.textPrimary}>
                  ¥{((selectedUser?.balance || 0) / 100).toFixed(2)}
                </ThemedText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ThemedText variant="tiny" color={theme.textMuted}>当前G点</ThemedText>
                <ThemedText variant="h4" color={theme.accent}>
                  {(selectedUser?.g_points || 0).toLocaleString()}
                </ThemedText>
              </View>
            </View>

            {/* 调整类型切换 */}
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
              调整类型
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  paddingVertical: Spacing.md,
                  borderWidth: 2,
                  borderColor: adjustType === 'balance' ? theme.primary : theme.border,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: adjustType === 'balance' ? theme.primary + '10' : 'transparent',
                }}
                onPress={() => setAdjustType('balance')}
              >
                <FontAwesome6 
                  name="wallet" 
                  size={16} 
                  color={adjustType === 'balance' ? theme.primary : theme.textMuted} 
                />
                <ThemedText 
                  variant="small" 
                  color={adjustType === 'balance' ? theme.primary : theme.textPrimary}
                >
                  余额（分）
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.sm,
                  paddingVertical: Spacing.md,
                  borderWidth: 2,
                  borderColor: adjustType === 'g_points' ? theme.accent : theme.border,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: adjustType === 'g_points' ? theme.accent + '10' : 'transparent',
                }}
                onPress={() => setAdjustType('g_points')}
              >
                <FontAwesome6 
                  name="coins" 
                  size={16} 
                  color={adjustType === 'g_points' ? theme.accent : theme.textMuted} 
                />
                <ThemedText 
                  variant="small" 
                  color={adjustType === 'g_points' ? theme.accent : theme.textPrimary}
                >
                  G点
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* 调整金额输入 */}
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
              调整金额
            </ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted} style={{ marginBottom: Spacing.sm }}>
              {adjustType === 'balance' 
                ? '输入调整金额（分），正数增加余额，负数减少余额'
                : '输入调整数量，正数增加G点，负数减少G点'
              }
            </ThemedText>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                fontSize: 16,
                backgroundColor: theme.backgroundTertiary,
                color: theme.textPrimary,
                marginBottom: Spacing.lg,
              }}
              placeholder={adjustType === 'balance' ? '例如: 1000 表示增加10元' : '例如: 100 表示增加100G点'}
              placeholderTextColor={theme.textMuted}
              value={adjustAmount}
              onChangeText={setAdjustAmount}
              keyboardType="numeric"
            />

            {/* 调整原因输入 */}
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.sm }}>
              调整原因 <ThemedText variant="tiny" color={theme.error}>（必填）</ThemedText>
            </ThemedText>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                fontSize: 14,
                backgroundColor: theme.backgroundTertiary,
                color: theme.textPrimary,
                minHeight: 80,
                textAlignVertical: 'top',
                marginBottom: Spacing.lg,
              }}
              placeholder="请输入调整原因，将记录到操作日志"
              placeholderTextColor={theme.textMuted}
              value={adjustRemark}
              onChangeText={setAdjustRemark}
              multiline
              numberOfLines={3}
            />

            {/* 快捷调整按钮 */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {[100, 500, 1000, 5000].map(val => (
                <TouchableOpacity
                  key={val}
                  style={{
                    paddingVertical: Spacing.sm,
                    paddingHorizontal: Spacing.md,
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  onPress={() => setAdjustAmount(val.toString())}
                >
                  <ThemedText variant="tiny" color={theme.textPrimary}>
                    +{adjustType === 'balance' ? `${val}分` : val}
                  </ThemedText>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  backgroundColor: theme.error + '10',
                  borderRadius: BorderRadius.md,
                  borderWidth: 1,
                  borderColor: theme.error + '30',
                }}
                onPress={() => setAdjustAmount('-' + adjustAmount.replace('-', ''))}
              >
                <ThemedText variant="tiny" color={theme.error}>
                  切换+/-
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* 操作按钮 */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md }}>
              <TouchableOpacity
                style={{
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: BorderRadius.lg,
                }}
                onPress={() => setShowAdjustModal(false)}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.sm,
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                  backgroundColor: adjustType === 'balance' ? theme.primary : theme.accent,
                  borderRadius: BorderRadius.lg,
                }}
                onPress={handleAdjustFunds}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FontAwesome6 name="check" size={14} color="#fff" />
                    <ThemedText variant="smallMedium" color="#fff">确认调整</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
