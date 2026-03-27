/**
 * 战斗对战页面
 */
import React, { useState, useMemo } from 'react';
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

export default function BattleScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isMatching, setIsMatching] = useState(false);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ParticleBackground intensity="high" />
      
      <ScrollView 
        contentContainerStyle={{ 
          padding: Spacing.lg, 
          paddingTop: insets.top + Spacing.md,
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* 战斗图标 */}
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: Spacing.xl,
          borderWidth: 3,
          borderColor: '#EF4444',
        }}>
          <FontAwesome6 name="swords" size={48} color="#EF4444" />
        </View>

        <ThemedText variant="h2" weight="bold" color={GOLD} style={{ marginBottom: Spacing.sm }}>
          即刻对战
        </ThemedText>
        <ThemedText variant="body" color={theme.textSecondary} style={{ textAlign: 'center', marginBottom: Spacing['2xl'] }}>
          匹配全服玩家{'\n'}争夺荣耀与奖励
        </ThemedText>

        {/* 开始匹配按钮 */}
        <TouchableOpacity
          onPress={() => setIsMatching(!isMatching)}
          activeOpacity={0.8}
          style={{ marginBottom: Spacing['2xl'] }}
        >
          <LinearGradient
            colors={isMatching ? ['#6B7280', '#4B5563'] : ['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: Spacing.xl,
              paddingHorizontal: Spacing['3xl'],
              borderRadius: BorderRadius.lg,
              minWidth: 200,
              alignItems: 'center',
            }}
          >
            <ThemedText variant="label" weight="bold" color="#FFF">
              {isMatching ? '取消匹配' : '开始匹配'}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>

        {/* 匹配状态 */}
        {isMatching && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
          }}>
            <FontAwesome6 name="spinner" size={16} color={GOLD} spin />
            <ThemedText variant="small" color={theme.textMuted}>
              正在寻找对手...
            </ThemedText>
          </View>
        )}

        {/* 战绩统计 */}
        <View style={{
          flexDirection: 'row',
          gap: Spacing.xl,
          marginTop: Spacing['2xl'],
        }}>
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="h3" weight="bold" color="#10B981">0</ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>胜利</ThemedText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="h3" weight="bold" color="#EF4444">0</ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>失败</ThemedText>
          </View>
          <View style={{ alignItems: 'center' }}>
            <ThemedText variant="h3" weight="bold" color={GOLD}>-</ThemedText>
            <ThemedText variant="tiny" color={theme.textMuted}>胜率</ThemedText>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
