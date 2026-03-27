/**
 * GM后台管理系统
 * 
 * 功能：
 * 1. 用户数据管理（金币、灵石、道具等）
 * 2. 道具数量精确控制
 * 3. 操作日志查看
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// GM 密钥
const GM_SECRET = 'jianpo_gm_secret_2024';

// 道具列表
const ITEM_LIST = [
  { id: 'item_energy_potion', name: '体力药水' },
  { id: 'item_gold_pack_s', name: '金币礼包(小)' },
  { id: 'item_gold_pack_m', name: '金币礼包(中)' },
  { id: 'item_gold_pack_l', name: '金币礼包(大)' },
  { id: 'item_card_fragment', name: '卡牌碎片' },
  { id: 'item_equip_scroll', name: '装备卷轴' },
];

// Tab 类型
type TabType = 'users' | 'items' | 'logs';

export default function GMAdminScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [gmToken, setGmToken] = useState<string>('');
  
  // 登录表单
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  // 用户管理
  const [users, setUsers] = useState<any[]>([]);
  const [searchUid, setSearchUid] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // 道具管理
  const [itemUid, setItemUid] = useState('');
  const [selectedItem, setSelectedItem] = useState(ITEM_LIST[0].id);
  const [itemQuantity, setItemQuantity] = useState('0');
  const [itemReason, setItemReason] = useState('gm_gift');
  
  // 统计数据
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayNew: 0,
    totalRecharge: 0,
    vipUsers: 0,
  });
  
  // 日志
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // 检查是否已登录
    const token = GM_SECRET; // 简化：直接使用预设密钥
    if (token) {
      setGmToken(token);
      setLoggedIn(true);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadLogs(),
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/gm.ts
       * 接口：GET /api/v1/gm/stats
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/gm/stats`, {
        headers: { 'x-gm-token': GM_SECRET },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const loadUsers = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/gm.ts
       * 接口：GET /api/v1/gm/users
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/gm/users?limit=50`, {
        headers: { 'x-gm-token': GM_SECRET },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const loadLogs = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/gm.ts
       * 接口：GET /api/v1/gm/logs
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/gm/logs`, {
        headers: { 'x-gm-token': GM_SECRET },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('加载日志失败:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogin = async () => {
    if (username === 'admin' && password === GM_SECRET) {
      setGmToken(GM_SECRET);
      setLoggedIn(true);
      loadData();
    } else {
      Alert.alert('登录失败', '用户名或密码错误');
    }
  };

  // 修改用户数值
  const handleModifyUser = async (field: string, operation: 'add' | 'reduce' | 'set', value: number) => {
    if (!selectedUser) return;

    try {
      /**
       * 服务端文件：server/src/routes/gm.ts
       * 接口：POST /api/v1/gm/user/:uid/modify
       * Body 参数：field: string, value: number, operation: 'add' | 'reduce' | 'set'
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/gm/user/${selectedUser.uid}/modify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gm-token': GM_SECRET,
        },
        body: JSON.stringify({ field, value, operation }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert('成功', `数值已修改：${data.oldValue} → ${data.newValue}`);
        loadUsers();
        setSelectedUser({ ...selectedUser, [field]: data.newValue });
      } else {
        Alert.alert('失败', data.error);
      }
    } catch (error) {
      Alert.alert('错误', (error as Error).message);
    }
  };

  // 修改道具数量
  const handleModifyItem = async () => {
    if (!itemUid) {
      Alert.alert('提示', '请输入用户ID');
      return;
    }

    const qty = parseInt(itemQuantity, 10);
    if (isNaN(qty)) {
      Alert.alert('提示', '请输入有效数量');
      return;
    }

    try {
      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：POST /api/v1/game-recharge/gm/modify-item
       * Body 参数：uid: string, itemId: string, quantity: number, reason: string, gmToken: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/gm/modify-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: itemUid,
          itemId: selectedItem,
          quantity: qty,
          reason: itemReason,
          gmToken: GM_SECRET,
        }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert('成功', `道具${selectedItem}数量已修改：${data.beforeQuantity} → ${data.afterQuantity}`);
        loadLogs();
      } else {
        Alert.alert('失败', data.error);
      }
    } catch (error) {
      Alert.alert('错误', (error as Error).message);
    }
  };

  // 验证道具数量
  const handleVerifyItem = async () => {
    if (!itemUid) {
      Alert.alert('提示', '请输入用户ID');
      return;
    }

    try {
      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：POST /api/v1/game-recharge/verify-inventory
       * Body 参数：uid: string, itemId: string, expectedQuantity: number
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/verify-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: itemUid,
          itemId: selectedItem,
          expectedQuantity: parseInt(itemQuantity, 10) || 0,
        }),
      });
      const data = await response.json();

      if (data.success) {
        Alert.alert(
          data.isMatch ? '验证通过' : '数据不一致',
          data.message
        );
      }
    } catch (error) {
      Alert.alert('错误', (error as Error).message);
    }
  };

  // 登录界面
  if (!loggedIn) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loginContainer}>
          <FontAwesome6 name="shield-halved" size={48} color={theme.primary} />
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.loginTitle}>
            GM 后台管理
          </ThemedText>
          
          <TextInput
            style={styles.input}
            placeholder="用户名"
            placeholderTextColor={theme.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <ThemedText color={theme.buttonPrimaryText} variant="label">登录</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={{ marginTop: Spacing.md }}>加载中...</ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 统计概览 */}
        <View style={styles.statsGrid}>
          <ThemedView level="default" style={styles.statCard}>
            <FontAwesome6 name="users" size={20} color={theme.primary} />
            <ThemedText style={styles.statValue} color={theme.textPrimary}>
              {stats.totalUsers?.toLocaleString() || 0}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>总用户</ThemedText>
          </ThemedView>
          
          <ThemedView level="default" style={styles.statCard}>
            <FontAwesome6 name="user-plus" size={20} color={theme.success} />
            <ThemedText style={styles.statValue} color={theme.textPrimary}>
              {stats.todayNew || 0}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>今日新增</ThemedText>
          </ThemedView>
          
          <ThemedView level="default" style={styles.statCard}>
            <FontAwesome6 name="coins" size={20} color="#F59E0B" />
            <ThemedText style={styles.statValue} color={theme.textPrimary}>
              ¥{((stats.totalRecharge || 0) / 100).toFixed(0)}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>总充值</ThemedText>
          </ThemedView>
          
          <ThemedView level="default" style={styles.statCard}>
            <FontAwesome6 name="crown" size={20} color="#E91E63" />
            <ThemedText style={styles.statValue} color={theme.textPrimary}>
              {stats.vipUsers || 0}
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>VIP用户</ThemedText>
          </ThemedView>
        </View>

        {/* Tab 导航 */}
        <View style={styles.tabBar}>
          {[
            { key: 'users' as TabType, label: '用户管理', icon: 'users' },
            { key: 'items' as TabType, label: '道具管理', icon: 'box' },
            { key: 'logs' as TabType, label: '操作日志', icon: 'clipboard-list' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <FontAwesome6
                name={tab.icon as any}
                size={14}
                color={activeTab === tab.key ? theme.buttonPrimaryText : theme.textMuted}
              />
              <ThemedText
                variant="tiny"
                color={activeTab === tab.key ? theme.buttonPrimaryText : theme.textMuted}
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 用户管理 */}
        {activeTab === 'users' && (
          <View>
            {/* 用户列表 */}
            {users.map((user) => (
              <TouchableOpacity
                key={user.uid}
                style={[
                  styles.userItem,
                  selectedUser?.uid === user.uid && { borderColor: theme.primary, borderWidth: 2 },
                ]}
                onPress={() => setSelectedUser(user)}
              >
                <View style={styles.userHeader}>
                  <FontAwesome6 name="user-circle" size={24} color={theme.textMuted} />
                  <View style={styles.userInfo}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {user.nickname}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      UID: {user.uid}
                    </ThemedText>
                  </View>
                  <ThemedText variant="caption" color={theme.primary}>
                    Lv.{user.level}
                  </ThemedText>
                </View>
                
                <View style={styles.userStats}>
                  <View style={styles.userStat}>
                    <FontAwesome6 name="coins" size={12} color="#F59E0B" />
                    <ThemedText variant="caption">{user.gold?.toLocaleString() || 0}</ThemedText>
                  </View>
                  <View style={styles.userStat}>
                    <FontAwesome6 name="gem" size={12} color="#E91E63" />
                    <ThemedText variant="caption">{user.gems || 0}</ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* 选中用户的操作 */}
            {selectedUser && (
              <ThemedView level="default" style={styles.formSection}>
                <ThemedText variant="label" color={theme.textPrimary} style={styles.formTitle}>
                  修改用户数据: {selectedUser.nickname}
                </ThemedText>
                
                {['gold', 'gems', 'energy', 'level'].map((field) => (
                  <View key={field} style={styles.formRow}>
                    <ThemedText style={styles.formLabel} color={theme.textSecondary}>
                      {field === 'gold' ? '金币' : field === 'gems' ? '灵石' : field === 'energy' ? '体力' : '等级'}
                    </ThemedText>
                    <ThemedText color={theme.textPrimary} style={{ flex: 1 }}>
                      当前: {selectedUser[field]?.toLocaleString() || 0}
                    </ThemedText>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonSecondary, { padding: Spacing.sm }]}
                      onPress={() => {
                        Alert.prompt(
                          `修改${field}`,
                          `当前值: ${selectedUser[field] || 0}`,
                          [
                            { text: '取消', style: 'cancel' },
                            { 
                              text: '设置', 
                              onPress: (value: string | undefined) => handleModifyUser(field, 'set', parseInt(value || '0', 10))
                            },
                          ]
                        );
                      }}
                    >
                      <ThemedText variant="tiny" color={theme.textPrimary}>修改</ThemedText>
                    </TouchableOpacity>
                  </View>
                ))}
              </ThemedView>
            )}
          </View>
        )}

        {/* 道具管理 */}
        {activeTab === 'items' && (
          <ThemedView level="default" style={styles.formSection}>
            <ThemedText variant="label" color={theme.textPrimary} style={styles.formTitle}>
              道具数量管理（精确控制）
            </ThemedText>
            
            <View style={styles.formRow}>
              <ThemedText style={styles.formLabel} color={theme.textSecondary}>用户ID</ThemedText>
              <TextInput
                style={styles.formInput}
                placeholder="输入用户UID"
                placeholderTextColor={theme.textMuted}
                value={itemUid}
                onChangeText={setItemUid}
              />
            </View>
            
            <View style={styles.formRow}>
              <ThemedText style={styles.formLabel} color={theme.textSecondary}>道具</ThemedText>
              <View style={styles.formSelect}>
                {ITEM_LIST.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={{
                      padding: Spacing.sm,
                      backgroundColor: selectedItem === item.id ? theme.primary : 'transparent',
                      borderRadius: 4,
                      marginBottom: 2,
                    }}
                    onPress={() => setSelectedItem(item.id)}
                  >
                    <ThemedText
                      variant="small"
                      color={selectedItem === item.id ? theme.buttonPrimaryText : theme.textPrimary}
                    >
                      {item.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formRow}>
              <ThemedText style={styles.formLabel} color={theme.textSecondary}>数量变化</ThemedText>
              <TextInput
                style={styles.formInput}
                placeholder="正数增加，负数减少"
                placeholderTextColor={theme.textMuted}
                value={itemQuantity}
                onChangeText={setItemQuantity}
                keyboardType="numeric"
              />
            </View>
            
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
              <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={handleModifyItem}>
                <FontAwesome6 name="check" size={14} color={theme.buttonPrimaryText} />
                <ThemedText variant="small" color={theme.buttonPrimaryText}>确认修改</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary, { flex: 1 }]} 
                onPress={handleVerifyItem}
              >
                <FontAwesome6 name="magnifying-glass" size={14} color={theme.textPrimary} />
                <ThemedText variant="small" color={theme.textPrimary}>验证数量</ThemedText>
              </TouchableOpacity>
            </View>
            
            <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              提示：道具数量严格控制，不可为负数，不可超过堆叠上限（999）
            </ThemedText>
          </ThemedView>
        )}

        {/* 操作日志 */}
        {activeTab === 'logs' && (
          <View>
            {logs.map((log, index) => (
              <ThemedView key={log.id || index} level="default" style={styles.logItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {log.action}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    {new Date(log.created_at).toLocaleString()}
                  </ThemedText>
                </View>
                {log.target_uid && (
                  <ThemedText variant="caption" color={theme.textSecondary}>
                    目标用户: {log.target_uid}
                  </ThemedText>
                )}
                {log.field && (
                  <ThemedText variant="caption" color={theme.textSecondary}>
                    字段: {log.field} | {log.old_value} → {log.new_value}
                  </ThemedText>
                )}
              </ThemedView>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
