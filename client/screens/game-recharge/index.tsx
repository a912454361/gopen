/**
 * 游戏充值中心
 * 
 * 功能：
 * 1. 代金券展示（上线送10000元）
 * 2. 0.05折充值套餐
 * 3. 充值订单管理
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 金色主题
const GOLD = '#D4AF37';

// 类型定义
interface RechargePackage {
  id: string;
  name: string;
  originalPrice: number;
  finalPrice: number;
  discountRate: number;
  icon: string;
  totalRewards: {
    gold: number;
    gems: number;
  };
}

interface UserInfo {
  uid: string;
  nickname: string;
  level: number;
  gold: number;
  gems: number;
  coupons: number;
  coupons_used: number;
  total_recharge: number;
}

interface Order {
  order_id: string;
  package_id: string;
  original_price: number;
  final_price: number;
  coupon_used: number;
  status: string;
  created_at: string;
  rewards: Array<{ type: string; amount: number }>;
}

export default function GameRechargeScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [useCoupon, setUseCoupon] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      // 获取或创建用户ID
      let playerId = await AsyncStorage.getItem('ink_player_id');
      if (!playerId) {
        playerId = `ink_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('ink_player_id', playerId);
      }

      // 初始化用户（新用户会获得10000代金券）
      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：POST /api/v1/game-recharge/init-user
       * Body 参数：uid: string
       */
      const initResponse = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/init-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: playerId }),
      });
      const initData = await initResponse.json();

      if (initData.success) {
        setUser(initData.user);
        
        if (initData.isNewUser) {
          Alert.alert('欢迎来到万古长夜！', initData.message);
        }
      }

      // 获取充值套餐
      await loadPackages();
      
      // 获取充值记录
      await loadOrders(playerId);
    } catch (error) {
      console.error('初始化失败:', error);
      Alert.alert('错误', '加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：GET /api/v1/game-recharge/packages
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/packages`);
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.packages);
        if (data.packages.length > 0) {
          setSelectedPackage(data.packages[0].id);
        }
      }
    } catch (error) {
      console.error('加载套餐失败:', error);
    }
  };

  const loadOrders = async (uid: string) => {
    try {
      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：GET /api/v1/game-recharge/orders/:uid
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/orders/${uid}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initUser();
    setRefreshing(false);
  };

  const handleRecharge = async () => {
    if (!selectedPackage || !user || processing) return;

    setProcessing(true);
    try {
      // 创建订单
      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：POST /api/v1/game-recharge/create-order
       * Body 参数：uid: string, packageId: string, useCoupon: boolean
       */
      const createResponse = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          packageId: selectedPackage,
          useCoupon,
        }),
      });
      const createData = await createResponse.json();

      if (!createData.success) {
        Alert.alert('创建订单失败', createData.error);
        return;
      }

      // 模拟支付（实际项目中接入真实支付）
      Alert.alert(
        '确认支付',
        `订单：${createData.orderInfo.packageName}\n` +
        `原价：¥${createData.orderInfo.originalPrice}\n` +
        `折扣价：¥${createData.orderInfo.discountPrice.toFixed(2)}\n` +
        `代金券抵扣：¥${createData.orderInfo.couponUsed.toFixed(2)}\n` +
        `实付：¥${createData.orderInfo.finalPrice.toFixed(2)}\n\n` +
        `获得：${createData.orderInfo.rewards.gold}金币 + ${createData.orderInfo.rewards.gems}灵石`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '确认支付', 
            onPress: () => completeOrder(createData.orderId) 
          },
        ]
      );
    } catch (error) {
      console.error('充值失败:', error);
      Alert.alert('充值失败', '请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  const completeOrder = async (orderId: string) => {
    setProcessing(true);
    try {
      /**
       * 服务端文件：server/src/routes/game-recharge.ts
       * 接口：POST /api/v1/game-recharge/complete-order
       * Body 参数：orderId: string, paymentMethod: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/game-recharge/complete-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentMethod: 'mock',
        }),
      });
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        await loadOrders(user!.uid);
        
        Alert.alert(
          '充值成功！',
          `恭喜获得：\n${data.rewards.map((r: any) => `${r.type === 'gold' ? '金币' : '灵石'} x${r.amount}`).join('\n')}`,
          [{ text: '太棒了！' }]
        );
      } else {
        Alert.alert('支付失败', data.error);
      }
    } catch (error) {
      console.error('完成订单失败:', error);
      Alert.alert('支付失败', '请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <ThemedText style={{ marginTop: Spacing.md }}>加载中...</ThemedText>
        </View>
      </Screen>
    );
  }

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 用户信息卡片 */}
        <ThemedView level="default" style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <FontAwesome6 name="user" size={20} color="#FFF" />
            </View>
            <View style={styles.userInfo}>
              <ThemedText variant="label" color={theme.textPrimary}>
                {user?.nickname || '修士'}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                Lv.{user?.level || 1}
              </ThemedText>
            </View>
            <ThemedText variant="caption" color={theme.textMuted}>
              累计充值: ¥{user?.total_recharge?.toFixed(2) || '0.00'}
            </ThemedText>
          </View>
          
          <View style={styles.currencyRow}>
            <View style={styles.currencyItem}>
              <FontAwesome6 name="coins" size={16} color={GOLD} />
              <ThemedText color={GOLD}>{user?.gold?.toLocaleString() || 0}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>金币</ThemedText>
            </View>
            <View style={styles.currencyItem}>
              <FontAwesome6 name="gem" size={16} color="#E91E63" />
              <ThemedText color="#E91E63">{user?.gems?.toLocaleString() || 0}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>灵石</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* 代金券卡片 */}
        <View style={styles.couponCard}>
          <View style={styles.couponHeader}>
            <FontAwesome6 name="ticket" size={24} color="#FFF" />
            <View style={styles.couponBadge}>
              <ThemedText variant="tiny" color="#FFF">新用户福利</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.couponAmount}>
            ¥ {user?.coupons?.toLocaleString() || 0}
          </ThemedText>
          <ThemedText variant="small" style={styles.couponDesc}>
            可用于充值抵扣 · 已使用 ¥{user?.coupons_used || 0}
          </ThemedText>
        </View>

        {/* 折扣信息 */}
        <View style={styles.discountBanner}>
          <FontAwesome6 name="fire" size={20} color={theme.error} />
          <ThemedText style={styles.discountText}>
            限时特惠：所有充值一律 0.05 折！
          </ThemedText>
        </View>

        {/* 充值套餐 */}
        <ThemedText variant="h4" color={theme.textPrimary}>
          选择充值套餐
        </ThemedText>
        
        <View style={styles.packagesGrid}>
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.packageCard,
                selectedPackage === pkg.id && styles.packageCardSelected,
              ]}
              onPress={() => setSelectedPackage(pkg.id)}
              activeOpacity={0.8}
            >
              <View style={styles.packageHeader}>
                <ThemedText style={styles.packageIcon}>{pkg.icon}</ThemedText>
                <View style={styles.packageInfo}>
                  <ThemedText variant="label" color={theme.textPrimary}>
                    {pkg.name}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.priceRow}>
                <ThemedText style={styles.originalPrice}>
                  ¥{pkg.originalPrice}
                </ThemedText>
                <ThemedText style={styles.finalPrice}>
                  ¥{pkg.finalPrice.toFixed(2)}
                </ThemedText>
              </View>
              
              <View style={styles.rewardsRow}>
                <View style={styles.rewardBadge}>
                  <FontAwesome6 name="coins" size={12} color={GOLD} />
                  <ThemedText variant="caption" color={theme.textPrimary}>
                    {pkg.totalRewards.gold.toLocaleString()}
                  </ThemedText>
                </View>
                <View style={styles.rewardBadge}>
                  <FontAwesome6 name="gem" size={12} color="#E91E63" />
                  <ThemedText variant="caption" color={theme.textPrimary}>
                    {pkg.totalRewards.gems}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 使用代金券选项 */}
        <TouchableOpacity
          style={styles.couponOption}
          onPress={() => setUseCoupon(!useCoupon)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <FontAwesome6
              name={useCoupon ? 'check-circle' : 'circle'}
              size={20}
              color={useCoupon ? GOLD : theme.textMuted}
            />
            <ThemedText color={theme.textPrimary}>使用代金券抵扣</ThemedText>
          </View>
          <ThemedText color={GOLD}>
            -¥{selectedPkg ? Math.min(user?.coupons || 0, selectedPkg.finalPrice).toFixed(2) : '0.00'}
          </ThemedText>
        </TouchableOpacity>

        {/* 支付按钮 */}
        <TouchableOpacity
          style={styles.payButton}
          onPress={handleRecharge}
          disabled={processing}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator color={theme.buttonPrimaryText} />
          ) : (
            <ThemedText style={styles.payButtonText}>
              立即充值
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* 充值记录 */}
        {orders.length > 0 && (
          <>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
              充值记录
            </ThemedText>
            
            {orders.slice(0, 5).map((order) => (
              <ThemedView key={order.order_id} level="default" style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {order.package_id.replace('pack_', '￥')}元礼包
                  </ThemedText>
                  <View style={[
                    styles.statusBadge,
                    order.status === 'completed' ? styles.statusCompleted : styles.statusPending,
                  ]}>
                    <ThemedText variant="tiny" color={order.status === 'completed' ? theme.success : theme.error}>
                      {order.status === 'completed' ? '已完成' : '待支付'}
                    </ThemedText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    实付：¥{order.final_price.toFixed(2)}
                    {order.coupon_used > 0 && ` (券抵¥${order.coupon_used.toFixed(2)})`}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </ThemedText>
                </View>
              </ThemedView>
            ))}
          </>
        )}

        {/* 底部提示 */}
        <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: Spacing.xl, textAlign: 'center' }}>
          充值即表示同意《用户协议》和《充值服务条款》
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}
