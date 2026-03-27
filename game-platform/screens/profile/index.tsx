/**
 * 个人中心页面
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

const MENU_ITEMS = [
  { id: 'inventory', icon: 'backpack', title: '道具背包', subtitle: '管理你的道具' },
  { id: 'records', icon: 'scroll', title: '战斗记录', subtitle: '查看对战历史' },
  { id: 'achievements', icon: 'trophy', title: '成就系统', subtitle: '解锁成就奖励' },
  { id: 'settings', icon: 'gear', title: '设置', subtitle: '账号与系统设置' },
];

export default function ProfileScreen() {
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
        {/* 用户卡片 */}
        <LinearGradient
          colors={['rgba(212, 175, 55, 0.2)', 'rgba(212, 175, 55, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: Spacing.xl,
            borderRadius: BorderRadius.lg,
            marginBottom: Spacing.xl,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <FontAwesome6 name="user" size={28} color="#000" />
            </View>
            <View style={{ marginLeft: Spacing.lg, flex: 1 }}>
              <ThemedText variant="label" weight="semibold">修士</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>Lv.1 · 新手修士</ThemedText>
            </View>
            <FontAwesome6 name="chevron-right" size={16} color={theme.textMuted} />
          </View>
        </LinearGradient>

        {/* 资产 */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          padding: Spacing.lg,
          backgroundColor: theme.backgroundDefault,
          borderRadius: BorderRadius.lg,
          marginBottom: Spacing.xl,
        }}>
          <View style={{ alignItems: 'center' }}>
            <FontAwesome6 name="coins" size={20} color={GOLD} />
            <ThemedText variant="h4" weight="bold" color={GOLD} style={{ marginTop: Spacing.xs }}>10,000</ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>金币</ThemedText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <FontAwesome6 name="gem" size={20} color="#E91E63" />
            <ThemedText variant="h4" weight="bold" color="#E91E63" style={{ marginTop: Spacing.xs }}>100</ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>钻石</ThemedText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <FontAwesome6 name="ticket" size={20} color={GOLD} />
            <ThemedText variant="h4" weight="bold" color={GOLD} style={{ marginTop: Spacing.xs }}>10,000</ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>代金券</ThemedText>
          </View>
        </View>

        {/* 菜单列表 */}
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: Spacing.lg,
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.md,
              marginBottom: Spacing.md,
            }}
            activeOpacity={0.7}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: BorderRadius.md,
              backgroundColor: theme.backgroundTertiary,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <FontAwesome6 name={item.icon as any} size={18} color={GOLD} />
            </View>
            <View style={{ marginLeft: Spacing.md, flex: 1 }}>
              <ThemedText variant="small" weight="medium">{item.title}</ThemedText>
              <ThemedText variant="tiny" color={theme.textMuted}>{item.subtitle}</ThemedText>
            </View>
            <FontAwesome6 name="chevron-right" size={14} color={theme.textMuted} />
          </TouchableOpacity>
        ))}

        {/* 版本信息 */}
        <View style={{ alignItems: 'center', marginTop: Spacing.xl }}>
          <ThemedText variant="tiny" color={theme.textMuted}>
            万古长夜 v1.0.0
          </ThemedText>
          <ThemedText variant="tiny" color={theme.textMuted}>
            Powered by G open
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
