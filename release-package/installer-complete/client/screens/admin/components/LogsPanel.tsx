/**
 * 操作日志面板
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface LogEntry {
  id: string;
  action: string;
  target: string;
  operator: string;
  details?: string;
  created_at: string;
}

interface LogsPanelProps {
  adminKey: string;
}

export function LogsPanel({ adminKey }: LogsPanelProps) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'order' | 'user' | 'system'>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = filter === 'all' ? '' : `&type=${filter}`;
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/logs?key=${adminKey}${typeParam}`
      );
      const result = await response.json();
      if (result.success) {
        setLogs(result.data || []);
      }
    } catch (error) {
      console.error('Fetch logs error:', error);
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    if (action.includes('approve')) return { icon: 'check-circle', color: theme.success };
    if (action.includes('reject')) return { icon: 'x-circle', color: theme.error };
    if (action.includes('create')) return { icon: 'plus-circle', color: theme.primary };
    if (action.includes('update')) return { icon: 'pen-circle', color: '#F59E0B' };
    if (action.includes('login')) return { icon: 'right-to-bracket', color: '#06B6D4' };
    return { icon: 'circle-info', color: '#64748B' };
  };

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'order', label: '订单' },
    { key: 'user', label: '用户' },
    { key: 'system', label: '系统' },
  ];

  // 模拟日志数据（实际从后端获取）
  const mockLogs: LogEntry[] = [
    { id: '1', action: 'order_approve', target: 'GO1773898300641DZWGW5', operator: 'admin', details: '订单审核通过，会员已激活', created_at: new Date().toISOString() },
    { id: '2', action: 'qrcode_update', target: 'alipay', operator: 'admin', details: '更新支付宝收款码', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', action: 'user_member_update', target: 'user_123', operator: 'admin', details: '开通超级会员(1月)', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', action: 'merchant_open', target: 'wechat', operator: 'admin', details: '开通微信商家收款', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '5', action: 'admin_login', target: 'admin', operator: 'admin', details: '管理员登录', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  ];

  const displayLogs = logs.length > 0 ? logs : mockLogs;

  return (
    <View style={{ gap: Spacing.xl }}>
      {/* 筛选栏 */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        {filterTabs.map(tab => (
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

      {/* 日志列表 */}
      {loading ? (
        <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'] }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <View style={{
          backgroundColor: theme.backgroundDefault,
          borderRadius: BorderRadius.xl,
          borderWidth: 1,
          borderColor: theme.border,
          overflow: 'hidden',
        }}>
          {/* 表头 */}
          <View style={{
            flexDirection: 'row',
            padding: Spacing.lg,
            backgroundColor: theme.backgroundTertiary,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          }}>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>操作</ThemedText></View>
            <View style={{ flex: 2 }}><ThemedText variant="caption" color={theme.textMuted}>目标</ThemedText></View>
            <View style={{ flex: 2 }}><ThemedText variant="caption" color={theme.textMuted}>详情</ThemedText></View>
            <View style={{ flex: 1 }}><ThemedText variant="caption" color={theme.textMuted}>时间</ThemedText></View>
          </View>

          {/* 日志行 */}
          {displayLogs.map((log, i) => {
            const { icon, color } = getActionIcon(log.action);
            return (
              <View
                key={log.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: Spacing.lg,
                  borderBottomWidth: i < displayLogs.length - 1 ? 1 : 0,
                  borderBottomColor: theme.border,
                }}
              >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <FontAwesome6 name={icon as any} size={14} color={color} />
                  <ThemedText variant="small" color={theme.textPrimary}>
                    {log.action.replace(/_/g, ' ')}
                  </ThemedText>
                </View>
                <View style={{ flex: 2 }}>
                  <ThemedText variant="small" color={theme.textSecondary}>{log.target}</ThemedText>
                </View>
                <View style={{ flex: 2 }}>
                  <ThemedText variant="caption" color={theme.textMuted}>{log.details}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="tiny" color={theme.textMuted}>{formatDate(log.created_at)}</ThemedText>
                </View>
              </View>
            );
          })}
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
          共 {displayLogs.length} 条日志
        </ThemedText>
        <TouchableOpacity onPress={fetchLogs} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <FontAwesome6 name="rotate" size={12} color={theme.primary} />
          <ThemedText variant="small" color={theme.primary}>刷新</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
