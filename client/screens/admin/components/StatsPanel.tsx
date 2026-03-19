/**
 * 数据统计面板
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface StatsPanelProps {
  stats: any;
  adminKey: string;
  onRefresh: () => void;
}

export function StatsPanel({ stats, adminKey, onRefresh }: StatsPanelProps) {
  const { theme, isDark } = useTheme();
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(
          `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/revenue-chart?key=${adminKey}`
        );
        const result = await response.json();
        if (result.success) {
          setChartData(result.data);
        }
      } catch (error) {
        console.error('Fetch chart data error:', error);
      }
    };
    fetchChartData();
  }, [adminKey]);

  if (!stats) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'] }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const statCards = [
    { 
      label: '总用户数', 
      value: stats.totalUsers || 0, 
      icon: 'users', 
      color: '#3B82F6',
      bgColor: 'rgba(59,130,246,0.1)',
    },
    { 
      label: '会员用户', 
      value: stats.memberUsers || 0, 
      icon: 'crown', 
      color: '#F59E0B',
      bgColor: 'rgba(245,158,11,0.1)',
    },
    { 
      label: '今日订单', 
      value: stats.todayOrders || 0, 
      icon: 'clipboard-list', 
      color: '#10B981',
      bgColor: 'rgba(16,185,129,0.1)',
    },
    { 
      label: '今日收入', 
      value: `¥${((stats.todayAmount || 0) / 100).toFixed(2)}`, 
      icon: 'wallet', 
      color: '#8B5CF6',
      bgColor: 'rgba(139,92,246,0.1)',
    },
    { 
      label: '待审核订单', 
      value: stats.pendingOrders || 0, 
      icon: 'clock', 
      color: '#EF4444',
      bgColor: 'rgba(239,68,68,0.1)',
      highlight: true,
    },
    { 
      label: '累计收入', 
      value: `¥${((stats.totalRevenue || 0) / 100).toFixed(2)}`, 
      icon: 'chart-line', 
      color: '#06B6D4',
      bgColor: 'rgba(6,182,212,0.1)',
    },
  ];

  return (
    <View style={{ gap: Spacing.xl }}>
      {/* 统计卡片 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg }}>
        {statCards.map((card, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.xl,
              padding: Spacing.lg,
              borderWidth: card.highlight ? 2 : 1,
              borderColor: card.highlight ? card.color : theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: BorderRadius.lg,
                backgroundColor: card.bgColor,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <FontAwesome6 name={card.icon as any} size={20} color={card.color} />
              </View>
              {card.highlight && card.value > 0 && (
                <View style={{
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing.xs,
                  backgroundColor: card.color,
                  borderRadius: BorderRadius.md,
                }}>
                  <ThemedText variant="tiny" color="#fff">需处理</ThemedText>
                </View>
              )}
            </View>
            <ThemedText variant="h2" color={theme.textPrimary} style={{ marginTop: Spacing.lg }}>
              {card.value}
            </ThemedText>
            <ThemedText variant="small" color={theme.textMuted}>
              {card.label}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* 快捷操作 */}
      <View style={{ 
        backgroundColor: theme.backgroundDefault, 
        borderRadius: BorderRadius.xl, 
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
          快捷操作
        </ThemedText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
          {[
            { label: '审核订单', icon: 'check-circle', color: theme.success },
            { label: '导出数据', icon: 'download', color: theme.primary },
            { label: '系统设置', icon: 'gear', color: '#64748B' },
            { label: '查看日志', icon: 'file-lines', color: '#8B5CF6' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.sm,
                paddingVertical: Spacing.md,
                paddingHorizontal: Spacing.lg,
                backgroundColor: theme.backgroundTertiary,
                borderRadius: BorderRadius.lg,
              }}
            >
              <FontAwesome6 name={action.icon as any} size={14} color={action.color} />
              <ThemedText variant="small" color={theme.textPrimary}>{action.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 收入趋势（简化版） */}
      <View style={{ 
        backgroundColor: theme.backgroundDefault, 
        borderRadius: BorderRadius.xl, 
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
          <ThemedText variant="smallMedium" color={theme.textPrimary}>
            近7日收入趋势
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            单位：元
          </ThemedText>
        </View>
        
        {chartData?.daily ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, height: 120 }}>
            {chartData.daily.map((day: any, i: number) => {
              const height = Math.max(10, (day.amount / (chartData.maxAmount || 1)) * 100);
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <View
                    style={{
                      width: '100%',
                      height: height,
                      backgroundColor: theme.primary,
                      borderRadius: BorderRadius.sm,
                      opacity: 0.8,
                    }}
                  />
                  <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
                    {day.label}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText variant="small" color={theme.textMuted}>暂无数据</ThemedText>
          </View>
        )}
      </View>

      {/* 最近订单 */}
      <View style={{ 
        backgroundColor: theme.backgroundDefault, 
        borderRadius: BorderRadius.xl, 
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.lg }}>
          最近订单
        </ThemedText>
        {stats.recentOrders?.length > 0 ? (
          stats.recentOrders.map((order: any, i: number) => (
            <View 
              key={i}
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingVertical: Spacing.md,
                borderBottomWidth: i < stats.recentOrders.length - 1 ? 1 : 0,
                borderBottomColor: theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                <FontAwesome6 
                  name={order.pay_type === 'alipay' ? 'wallet' : 'message'} 
                  size={16} 
                  color={order.pay_type === 'alipay' ? '#1677FF' : '#07C160'} 
                />
                <View>
                  <ThemedText variant="small" color={theme.textPrimary}>
                    ¥{(order.amount / 100).toFixed(2)}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {order.product_type === 'super_member' ? '超级会员' : '普通会员'}
                  </ThemedText>
                </View>
              </View>
              <View style={{
                paddingHorizontal: Spacing.sm,
                paddingVertical: Spacing.xs,
                backgroundColor: 
                  order.status === 'paid' ? 'rgba(16,185,129,0.1)' :
                  order.status === 'confirming' ? 'rgba(245,158,11,0.1)' :
                  'rgba(239,68,68,0.1)',
                borderRadius: BorderRadius.sm,
              }}>
                <ThemedText variant="tiny" color={
                  order.status === 'paid' ? theme.success :
                  order.status === 'confirming' ? '#F59E0B' :
                  theme.error
                }>
                  {order.status === 'paid' ? '已完成' :
                   order.status === 'confirming' ? '待审核' :
                   order.status === 'rejected' ? '已拒绝' : order.status}
                </ThemedText>
              </View>
            </View>
          ))
        ) : (
          <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
            <ThemedText variant="small" color={theme.textMuted}>暂无订单</ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}
