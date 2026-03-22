/**
 * 数据统计面板
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

  const formatAmount = (fen: number) => `¥${(fen / 100).toFixed(2)}`;

  // 主要统计卡片
  const mainStats = [
    { 
      label: '总用户数', 
      value: stats.totalUsers || 0, 
      subLabel: `本月新增 ${stats.newUsersMonth || 0}`,
      icon: 'users', 
      color: '#3B82F6',
      bgColor: 'rgba(59,130,246,0.1)',
    },
    { 
      label: '会员用户', 
      value: stats.memberUsers || 0, 
      subLabel: `超会${stats.superMemberUsers || 0} / 普通${stats.normalMemberUsers || 0}`,
      icon: 'crown', 
      color: '#F59E0B',
      bgColor: 'rgba(245,158,11,0.1)',
    },
    { 
      label: '今日订单', 
      value: stats.todayOrders || 0, 
      subLabel: `本月 ${stats.monthOrders || 0} 笔`,
      icon: 'clipboard-list', 
      color: '#10B981',
      bgColor: 'rgba(16,185,129,0.1)',
    },
    { 
      label: '今日收入', 
      value: formatAmount(stats.todayAmount || 0), 
      subLabel: `本月 ${formatAmount(stats.monthRevenue || 0)}`,
      icon: 'wallet', 
      color: '#8B5CF6',
      bgColor: 'rgba(139,92,246,0.1)',
    },
    { 
      label: '待审核订单', 
      value: stats.pendingOrders || 0, 
      subLabel: stats.timeoutPendingCount > 0 ? `${stats.timeoutPendingCount} 笔已超时` : '无超时订单',
      icon: 'clock', 
      color: '#EF4444',
      bgColor: 'rgba(239,68,68,0.1)',
      highlight: true,
    },
    { 
      label: '累计收入', 
      value: formatAmount(stats.totalRevenue || 0), 
      subLabel: `共 ${stats.totalPaidCount || 0} 笔订单`,
      icon: 'chart-line', 
      color: '#06B6D4',
      bgColor: 'rgba(6,182,212,0.1)',
    },
  ];

  // 收款账户统计
  const paymentStats = [
    {
      label: '支付宝收款',
      amount: formatAmount(stats.totalAlipayRevenue || 0),
      today: formatAmount(stats.todayAlipayAmount || 0),
      icon: 'alipay',
      color: '#1677FF',
      account: stats.paymentAccounts?.alipay?.account || '-',
      realName: stats.paymentAccounts?.alipay?.realName || '-',
    },
    {
      label: '微信收款',
      amount: formatAmount(stats.totalWechatRevenue || 0),
      today: formatAmount(stats.todayWechatAmount || 0),
      icon: 'weixin',
      color: '#07C160',
      account: stats.paymentAccounts?.wechat?.account || '-',
      realName: stats.paymentAccounts?.wechat?.realName || '-',
    },
    {
      label: '银联收款',
      amount: formatAmount(stats.totalUnionpayRevenue || 0),
      today: formatAmount(stats.todayUnionpayAmount || 0),
      icon: 'credit-card',
      color: '#E60012',
      account: stats.paymentAccounts?.unionpay?.account || '-',
      realName: stats.paymentAccounts?.unionpay?.realName || '-',
    },
    {
      label: '银行转账',
      amount: formatAmount(stats.totalBankRevenue || 0),
      today: formatAmount(stats.todayBankAmount || 0),
      icon: 'building-columns',
      color: '#C41230',
      account: stats.paymentAccounts?.bank?.account || '-',
      realName: stats.paymentAccounts?.bank?.realName || '-',
      bankName: stats.paymentAccounts?.bank?.bankName,
      bankBranch: stats.paymentAccounts?.bank?.bankBranch,
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ gap: Spacing.xl }}>
        {/* 统计卡片 */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg }}>
          {mainStats.map((card, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                minWidth: 200,
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.xl,
                padding: Spacing.lg,
                borderWidth: card.highlight && card.value > 0 ? 2 : 1,
                borderColor: card.highlight && card.value > 0 ? card.color : theme.border,
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
              {card.subLabel && (
                <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
                  {card.subLabel}
                </ThemedText>
              )}
            </View>
          ))}
        </View>

        {/* 收款账户信息 */}
        <View style={{ 
          backgroundColor: theme.backgroundDefault, 
          borderRadius: BorderRadius.xl, 
          padding: Spacing.lg,
          borderWidth: 1,
          borderColor: theme.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              收款账户统计
            </ThemedText>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}
              onPress={onRefresh}
            >
              <FontAwesome6 name="rotate" size={12} color={theme.primary} />
              <ThemedText variant="small" color={theme.primary}>刷新</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: Spacing.lg }}>
              {paymentStats.map((item, i) => (
                <View 
                  key={i}
                  style={{ 
                    width: 220,
                    padding: Spacing.lg,
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.lg,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
                    <FontAwesome6 name={item.icon as any} size={20} color={item.color} brand={item.icon === 'weixin' || item.icon === 'alipay'} />
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>{item.label}</ThemedText>
                  </View>
                  
                  <View style={{ marginBottom: Spacing.sm }}>
                    <ThemedText variant="caption" color={theme.textMuted}>收款账号</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary} style={{ marginTop: Spacing.xs }}>
                      {item.account || '-'}
                    </ThemedText>
                  </View>
                  
                  <View style={{ marginBottom: Spacing.sm }}>
                    <ThemedText variant="caption" color={theme.textMuted}>收款人</ThemedText>
                    <ThemedText variant="small" color={theme.textPrimary} style={{ marginTop: Spacing.xs }}>
                      {item.realName || '-'}
                    </ThemedText>
                  </View>
                  
                  {item.bankName && (
                    <View style={{ marginBottom: Spacing.sm }}>
                      <ThemedText variant="caption" color={theme.textMuted}>开户银行</ThemedText>
                      <ThemedText variant="small" color={theme.textPrimary} style={{ marginTop: Spacing.xs }}>
                        {item.bankName}
                      </ThemedText>
                    </View>
                  )}
                  
                  {item.bankBranch && (
                    <View style={{ marginBottom: Spacing.sm }}>
                      <ThemedText variant="caption" color={theme.textMuted}>开户支行</ThemedText>
                      <ThemedText variant="small" color={theme.textPrimary} style={{ marginTop: Spacing.xs }}>
                        {item.bankBranch}
                      </ThemedText>
                    </View>
                  )}
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: theme.border }}>
                    <View>
                      <ThemedText variant="caption" color={theme.textMuted}>累计收款</ThemedText>
                      <ThemedText variant="smallMedium" color={item.color} style={{ marginTop: Spacing.xs }}>
                        {item.amount}
                      </ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText variant="caption" color={theme.textMuted}>今日收款</ThemedText>
                      <ThemedText variant="small" color={theme.textPrimary} style={{ marginTop: Spacing.xs }}>
                        {item.today}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            </ScrollView>
          </View>
        </View>

        {/* 收入趋势 */}
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
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      ¥{day.amount.toFixed(0)}
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
                      {order.product_type === 'super_member' ? '超级会员' : '普通会员'} · 
                      {order.paymentAccount?.account || (order.pay_type === 'alipay' ? '支付宝' : '微信')}
                    </ThemedText>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
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
                  {order.transaction_id && (
                    <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
                      流水: {order.transaction_id}
                    </ThemedText>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
              <ThemedText variant="small" color={theme.textMuted}>暂无订单</ThemedText>
            </View>
          )}
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
              { label: '审核订单', icon: 'check-circle', color: theme.success, count: stats.pendingOrders },
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
                {action.count !== undefined && action.count > 0 && (
                  <View style={{
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: theme.error,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: Spacing.xs,
                  }}>
                    <ThemedText variant="tiny" color="#fff">{action.count}</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
