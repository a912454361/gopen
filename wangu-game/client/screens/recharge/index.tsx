/**
 * 充值中心页面
 */
import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ParticleBackground } from '@/components/ParticleBackground';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

const GOLD = '#D4AF37';

const RECHARGE_PACKAGES = [
  { id: '1', amount: 60, bonus: 6, price: 6 },
  { id: '2', amount: 300, bonus: 30, price: 30, hot: true },
  { id: '3', amount: 680, bonus: 68, price: 68 },
  { id: '4', amount: 1280, bonus: 128, price: 128 },
  { id: '5', amount: 3280, bonus: 328, price: 328 },
  { id: '6', amount: 6480, bonus: 648, price: 648 },
];

export default function RechargeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ParticleBackground intensity="low" />
      
      <ScrollView 
        contentContainerStyle={{ 
          padding: Spacing.lg, 
          paddingTop: insets.top + Spacing.md,
          paddingBottom: Spacing['5xl'],
        }}
      >
        {/* 标题 */}
        <ThemedText variant="h2" weight="bold" color={GOLD} style={{ marginBottom: Spacing.sm }}>
          充值中心
        </ThemedText>
        <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: Spacing.xl }}>
          新用户送10000元代金券 · 充值一律0.05折
        </ThemedText>

        {/* 代金券卡片 */}
        <LinearGradient
          colors={['#D4AF37', '#B8860B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: Spacing.xl,
            borderRadius: BorderRadius.lg,
            marginBottom: Spacing.xl,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <ThemedText variant="tiny" color="rgba(0,0,0,0.6)">我的代金券</ThemedText>
              <ThemedText variant="h2" weight="bold" color="#000">¥10,000</ThemedText>
            </View>
            <FontAwesome6 name="ticket" size={32} color="rgba(0,0,0,0.3)" />
          </View>
        </LinearGradient>

        {/* 充值套餐 */}
        <ThemedText variant="label" weight="semibold" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
          充值套餐
        </ThemedText>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
          {RECHARGE_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={{
                width: '47%',
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                borderWidth: 1,
                borderColor: pkg.hot ? '#EF4444' : theme.border,
                position: 'relative',
              }}
              activeOpacity={0.7}
            >
              {pkg.hot && (
                <View style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: '#EF4444',
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: 2,
                  borderRadius: BorderRadius.sm,
                }}>
                  <ThemedText variant="tiny" weight="bold" color="#FFF">HOT</ThemedText>
                </View>
              )}
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <FontAwesome6 name="gem" size={16} color="#E91E63" />
                  <ThemedText variant="h3" weight="bold" color="#E91E63" style={{ marginLeft: 4 }}>
                    {pkg.amount}
                  </ThemedText>
                </View>
                {pkg.bonus > 0 && (
                  <ThemedText variant="tiny" color={GOLD}>+{pkg.bonus}赠送</ThemedText>
                )}
                <View style={{ 
                  marginTop: Spacing.sm, 
                  paddingHorizontal: Spacing.md, 
                  paddingVertical: Spacing.xs,
                  backgroundColor: theme.primary,
                  borderRadius: BorderRadius.sm,
                }}>
                  <ThemedText variant="tiny" weight="bold" color="#000">¥{(pkg.price * 0.0005).toFixed(2)}</ThemedText>
                </View>
                <ThemedText variant="tiny" color={theme.textMuted} style={{ marginTop: 4 }}>
                  <ThemedText variant="tiny" style={{ textDecorationLine: 'line-through' }}>¥{pkg.price}</ThemedText>
                  {' '}0.05折
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 提示 */}
        <View style={{
          marginTop: Spacing.xl,
          padding: Spacing.md,
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderRadius: BorderRadius.md,
          borderLeftWidth: 3,
          borderLeftColor: GOLD,
        }}>
          <ThemedText variant="caption" color={theme.textSecondary}>
            温馨提示：所有充值均享受0.05折优惠，代金券可直接抵扣消费。
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
