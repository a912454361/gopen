/**
 * 用户端推广中心页面
 * 包含：申请推广员、推广链接、收益统计、提现、推广用户列表
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FontAwesome6 } from '@expo/vector-icons';
import { createStyles } from './styles';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 推广员状态
interface PromoterInfo {
  id: string;
  promoter_code: string;
  status: string;
  total_clicks: number;
  total_conversions: number;
  total_earnings: number;
  available_earnings: number;
  commission_rate: number;
}

// 统计数据
interface Stats {
  todayClicks: number;
  todayConversions: number;
  todayEarnings: number;
  todayEarningsYuan: string;
  monthClicks: number;
  monthConversions: number;
  monthEarnings: number;
  monthEarningsYuan: string;
  conversionRate: string;
  availableEarnings: number;
  availableEarningsYuan: string;
}

// 推广用户
interface PromotedUser {
  id: string;
  conversion_time: string;
  total_spent: number;
  total_commission: number;
  converted_user: {
    id: string;
    device_id: string;
    member_level: string;
    created_at: string;
  };
}

// 提现记录
interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_account: string;
  applied_at: string;
  processed_at?: string;
}

type TabKey = 'overview' | 'users' | 'earnings' | 'withdrawals';

export default function PromotionScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 状态
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPromoter, setIsPromoter] = useState(false);
  const [promoterInfo, setPromoterInfo] = useState<PromoterInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [promotedUsers, setPromotedUsers] = useState<PromotedUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [promoterLink, setPromoterLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // 提现弹窗
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'alipay' | 'wechat'>('alipay');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 从本地存储获取用户ID
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    } catch {
      setUserId(null);
    }
  };

  // 加载推广员信息
  const loadPromoterData = useCallback(async () => {
    if (!userId) return;

    try {
      // 检查是否是推广员
      const infoRes = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promotion/info?userId=${userId}`);
      const infoData = await infoRes.json();

      if (infoData.isPromoter) {
        setIsPromoter(true);
        setPromoterInfo(infoData.data);

        // 加载统计数据
        const statsRes = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promotion/stats?userId=${userId}`);
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }

        // 加载推广链接
        const linkRes = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promotion/link?userId=${userId}`);
        const linkData = await linkRes.json();
        if (linkData.success) {
          setPromoterLink(linkData.data.link);
          setQrCodeUrl(linkData.data.qrCode);
        }

        // 加载推广用户
        const usersRes = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promotion/users?userId=${userId}&pageSize=20`);
        const usersData = await usersRes.json();
        if (usersData.success) {
          setPromotedUsers(usersData.data.list);
        }

        // 加载提现记录
        const withdrawalsRes = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promotion/withdrawals?userId=${userId}&pageSize=20`);
        const withdrawalsData = await withdrawalsRes.json();
        if (withdrawalsData.success) {
          setWithdrawals(withdrawalsData.data.list);
        }
      } else {
        setIsPromoter(false);
      }
    } catch (error) {
      console.error('Load promoter data error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadPromoterData();
    }
  }, [userId, loadPromoterData]);

  // 页面返回时刷新数据
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadPromoterData();
      }
    }, [userId, loadPromoterData])
  );

  // 申请成为推广员
  const handleApplyPromoter = async () => {
    if (!userId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promotion/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        loadPromoterData();
      }
    } catch (error) {
      console.error('Apply promoter error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 复制推广链接
  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(promoterLink);
    alert('推广链接已复制');
  };

  // 分享二维码
  const handleShareQRCode = async () => {
    if (await Sharing.isAvailableAsync()) {
      // 下载二维码图片
      const downloadPath = (FileSystem as any).cacheDirectory + 'promotion_qrcode.png';
      await (FileSystem as any).downloadAsync(qrCodeUrl, downloadPath);
      await Sharing.shareAsync(downloadPath);
    }
  };

  // 提交提现申请
  const handleSubmitWithdraw = async () => {
    if (!userId || !withdrawAmount || !withdrawAccount || !withdrawName) {
      alert('请填写完整信息');
      return;
    }

    const amount = parseFloat(withdrawAmount) * 100; // 转换为分
    if (isNaN(amount) || amount < 1000) {
      alert('最低提现金额为10元');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promotion/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          paymentMethod: withdrawMethod,
          paymentAccount: withdrawAccount,
          paymentName: withdrawName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('提现申请已提交');
        setWithdrawModalVisible(false);
        setWithdrawAmount('');
        setWithdrawAccount('');
        setWithdrawName('');
        loadPromoterData();
      } else {
        alert(data.error || '申请失败');
      }
    } catch (error) {
      console.error('Submit withdraw error:', error);
      alert('申请失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 下拉刷新
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPromoterData();
  };

  // 渲染状态标签
  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; style: any }> = {
      pending: { text: '待处理', style: styles.statusPending },
      approved: { text: '已通过', style: styles.statusApproved },
      rejected: { text: '已拒绝', style: styles.statusRejected },
      paid: { text: '已打款', style: styles.statusApproved },
    };
    const { text, style } = statusMap[status] || { text: status, style: styles.statusPending };
    return (
      <View style={[styles.statusBadge, style]}>
        <ThemedText variant="caption" color={theme.textPrimary}>{text}</ThemedText>
      </View>
    );
  };

  // 渲染会员等级
  const renderMemberLevel = (level: string) => {
    const levelMap: Record<string, { text: string; color: string }> = {
      free: { text: '免费用户', color: theme.textMuted },
      member: { text: '普通会员', color: theme.primary },
      super: { text: '超级会员', color: '#FFD700' },
    };
    const { text, color } = levelMap[level] || levelMap.free;
    return (
      <ThemedText variant="caption" color={color}>{text}</ThemedText>
    );
  };

  // 如果未登录
  if (!userId) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={[styles.container, styles.emptyState]}>
          <FontAwesome6 name="user-slash" size={48} color={theme.textMuted} />
          <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
            请先登录
          </ThemedText>
          <TouchableOpacity style={styles.applyButton} onPress={() => router.push('/login')}>
            <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>去登录</ThemedText>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // 加载中
  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={[styles.container, styles.loading]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  // 非推广员，显示申请页面
  if (!isPromoter) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.applyCard}>
            <View style={styles.applyIcon}>
              <FontAwesome6 name="bullhorn" size={32} color={theme.primary} />
            </View>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.applyTitle}>
              成为推广员
            </ThemedText>
            <ThemedText variant="body" color={theme.textSecondary} style={styles.applyDesc}>
              分享您的专属推广链接，好友通过您的链接注册并消费，您可获得10%佣金分成！
            </ThemedText>
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={handleApplyPromoter}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.buttonPrimaryText} />
              ) : (
                <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>立即申请</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  // 推广员页面
  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* 标题 */}
        <ThemedView level="root" style={styles.header}>
          <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
            推广中心
          </ThemedText>
          <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
            推广码: {promoterInfo?.promoter_code}
          </ThemedText>
        </ThemedView>

        {/* Tab切换 */}
        <View style={styles.tabContainer}>
          {(['overview', 'users', 'earnings', 'withdrawals'] as TabKey[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText
                variant="smallMedium"
                color={activeTab === tab ? theme.buttonPrimaryText : theme.textMuted}
              >
                {tab === 'overview' ? '概览' : tab === 'users' ? '用户' : tab === 'earnings' ? '收益' : '提现'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* 概览 */}
        {activeTab === 'overview' && (
          <>
            {/* 统计卡片 */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
                  今日点击
                </ThemedText>
                <ThemedText variant="h2" color={theme.textPrimary} style={styles.statValue}>
                  {stats?.todayClicks || 0}
                </ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
                  今日转化
                </ThemedText>
                <ThemedText variant="h2" color={theme.textPrimary} style={styles.statValue}>
                  {stats?.todayConversions || 0}
                </ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
                  本月收益
                </ThemedText>
                <ThemedText variant="h2" color={theme.primary} style={styles.statValue}>
                  ¥{stats?.monthEarningsYuan || '0.00'}
                </ThemedText>
              </View>
              <View style={styles.statCard}>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.statLabel}>
                  转化率
                </ThemedText>
                <ThemedText variant="h2" color={theme.textPrimary} style={styles.statValue}>
                  {stats?.conversionRate || '0%'}
                </ThemedText>
              </View>
            </View>

            {/* 推广链接 */}
            <View style={styles.linkCard}>
              <View style={styles.linkHeader}>
                <ThemedText variant="h4" color={theme.textPrimary}>推广链接</ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  分享链接赚取佣金
                </ThemedText>
              </View>
              <View style={styles.linkBox}>
                <ThemedText variant="small" color={theme.textPrimary} style={styles.linkText}>
                  {promoterLink}
                </ThemedText>
              </View>
              <View style={styles.linkActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
                  <FontAwesome6 name="copy" size={16} color={theme.buttonPrimaryText} />
                  <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>复制链接</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={handleShareQRCode}>
                  <FontAwesome6 name="share-nodes" size={16} color={theme.textPrimary} />
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>分享二维码</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* 提现卡片 */}
            <View style={styles.withdrawCard}>
              <View style={styles.withdrawHeader}>
                <ThemedText variant="h4" color={theme.textPrimary}>可提现收益</ThemedText>
              </View>
              <View style={styles.availableAmount}>
                <ThemedText variant="h1" color={theme.primary}>
                  ¥{stats?.availableEarningsYuan || '0.00'}
                </ThemedText>
              </View>
              <TouchableOpacity 
                style={styles.withdrawButton}
                onPress={() => setWithdrawModalVisible(true)}
              >
                <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>申请提现</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* 推广用户 */}
        {activeTab === 'users' && (
          <View style={styles.userList}>
            {promotedUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome6 name="users" size={48} color={theme.textMuted} />
                <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                  暂无推广用户
                </ThemedText>
              </View>
            ) : (
              promotedUsers.map((user) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                        用户 {user.converted_user.device_id?.slice(0, 8)}...
                      </ThemedText>
                      {renderMemberLevel(user.converted_user.member_level)}
                    </View>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {new Date(user.conversion_time).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  <View style={styles.userStats}>
                    <View style={styles.userStat}>
                      <ThemedText variant="caption" color={theme.textMuted}>消费金额</ThemedText>
                      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                        ¥{(user.total_spent / 100).toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.userStat}>
                      <ThemedText variant="caption" color={theme.textMuted}>产生佣金</ThemedText>
                      <ThemedText variant="bodyMedium" color={theme.primary}>
                        ¥{(user.total_commission / 100).toFixed(2)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* 收益明细 */}
        {activeTab === 'earnings' && (
          <View style={styles.userList}>
            <View style={styles.statCard}>
              <ThemedText variant="body" color={theme.textMuted}>
                总收益: ¥{(promoterInfo?.total_earnings || 0) / 100}
              </ThemedText>
            </View>
          </View>
        )}

        {/* 提现记录 */}
        {activeTab === 'withdrawals' && (
          <View style={styles.withdrawalList}>
            {withdrawals.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome6 name="money-bill-transfer" size={48} color={theme.textMuted} />
                <ThemedText variant="body" color={theme.textMuted} style={styles.emptyText}>
                  暂无提现记录
                </ThemedText>
              </View>
            ) : (
              withdrawals.map((item) => (
                <View key={item.id} style={styles.withdrawalCard}>
                  <View style={styles.withdrawalHeader}>
                    <ThemedText variant="h4" color={theme.primary}>
                      ¥{(item.amount / 100).toFixed(2)}
                    </ThemedText>
                    {renderStatusBadge(item.status)}
                  </View>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {item.payment_method === 'alipay' ? '支付宝' : '微信'} · {item.payment_account}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    申请时间: {new Date(item.applied_at).toLocaleString()}
                  </ThemedText>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* 提现弹窗 */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.modalTitle}>
              申请提现
            </ThemedText>
            
            <TextInput
              style={styles.input}
              placeholder="提现金额（元）"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />
            
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity
                style={[styles.tab, withdrawMethod === 'alipay' && styles.activeTab]}
                onPress={() => setWithdrawMethod('alipay')}
              >
                <ThemedText variant="small" color={withdrawMethod === 'alipay' ? theme.buttonPrimaryText : theme.textMuted}>
                  支付宝
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, withdrawMethod === 'wechat' && styles.activeTab]}
                onPress={() => setWithdrawMethod('wechat')}
              >
                <ThemedText variant="small" color={withdrawMethod === 'wechat' ? theme.buttonPrimaryText : theme.textMuted}>
                  微信
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder={`${withdrawMethod === 'alipay' ? '支付宝' : '微信'}账号`}
              placeholderTextColor={theme.textMuted}
              keyboardType="default"
              value={withdrawAccount}
              onChangeText={setWithdrawAccount}
            />
            
            <TextInput
              style={styles.input}
              placeholder="收款人姓名"
              placeholderTextColor={theme.textMuted}
              value={withdrawName}
              onChangeText={setWithdrawName}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setWithdrawModalVisible(false)}>
                <ThemedText variant="bodyMedium" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitWithdraw}>
                {isSubmitting ? (
                  <ActivityIndicator color={theme.buttonPrimaryText} />
                ) : (
                  <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>提交</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
