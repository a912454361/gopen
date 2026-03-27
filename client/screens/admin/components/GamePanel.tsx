/**
 * 游戏平台管理面板
 * 万古长夜 - 国风粒子卡牌游戏后台管理
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface GamePanelProps {
  adminKey: string;
}

// 游戏数据类型
interface GameStats {
  totalPlayers: number;
  activePlayers: number;
  totalCards: number;
  totalBattles: number;
  todayBattles: number;
  onlinePlayers: number;
}

interface Card {
  id: string;
  name: string;
  faction: string;
  rarity: string;
  card_type: string;
  attack: number;
  defense: number;
  hp: number;
  image_url: string;
  is_active: boolean;
}

interface Player {
  player_id: string;
  nickname: string;
  level: number;
  gold: number;
  gems: number;
  wins: number;
  losses: number;
  created_at: string;
}

type SubTab = 'overview' | 'cards' | 'players' | 'battles';

export function GamePanel({ adminKey }: GamePanelProps) {
  const { theme, isDark } = useTheme();
  
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 卡牌生成 Modal
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generateConfig, setGenerateConfig] = useState({
    faction: '幽冥',
    rarity: '凡品',
    cardType: '角色',
    count: 1,
  });

  // 加载游戏统计
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/admin/stats?key=${adminKey}`
      );
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Fetch game stats error:', error);
      // 使用模拟数据
      setStats({
        totalPlayers: 1284,
        activePlayers: 342,
        totalCards: 86,
        totalBattles: 15420,
        todayBattles: 286,
        onlinePlayers: 47,
      });
    }
  }, [adminKey]);

  // 加载卡牌列表
  const fetchCards = useCallback(async () => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/cards?limit=50`
      );
      const result = await response.json();
      setCards(result.cards || []);
    } catch (error) {
      console.error('Fetch cards error:', error);
      setCards([]);
    }
  }, []);

  // 加载玩家列表
  const fetchPlayers = useCallback(async () => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/admin/players?key=${adminKey}&limit=20`
      );
      const result = await response.json();
      setPlayers(result.players || []);
    } catch (error) {
      console.error('Fetch players error:', error);
      // 模拟数据
      setPlayers([
        { player_id: 'ink_001', nickname: '剑圣无双', level: 45, gold: 12500, gems: 380, wins: 156, losses: 42, created_at: '2024-01-15' },
        { player_id: 'ink_002', nickname: '幽冥主宰', level: 38, gold: 8900, gems: 120, wins: 89, losses: 67, created_at: '2024-02-03' },
        { player_id: 'ink_003', nickname: '昆仑仙子', level: 52, gold: 25000, gems: 890, wins: 234, losses: 56, created_at: '2024-01-02' },
      ]);
    }
  }, [adminKey]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchCards(), fetchPlayers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchCards, fetchPlayers]);

  // 生成卡牌
  const handleGenerateCards = async () => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generateConfig),
        }
      );
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', `成功生成 ${result.generated} 张卡牌`);
        fetchCards();
        fetchStats();
      }
    } catch (error) {
      Alert.alert('错误', '生成卡牌失败');
    }
    setGenerateModalVisible(false);
  };

  // 批量生成卡牌
  const handleBatchGenerate = async () => {
    Alert.alert(
      '批量生成',
      '将生成 20 张各阵营各类型卡牌，是否继续？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            try {
              const response = await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/batch-generate`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ count: 20 }),
                }
              );
              const result = await response.json();
              if (result.success) {
                Alert.alert('成功', `成功生成 ${result.generated} 张卡牌`);
                fetchCards();
                fetchStats();
              }
            } catch (error) {
              Alert.alert('错误', '批量生成失败');
            }
          },
        },
      ]
    );
  };

  // 子标签配置
  const subTabs: { key: SubTab; label: string; icon: string }[] = [
    { key: 'overview', label: '数据概览', icon: 'chart-pie' },
    { key: 'cards', label: '卡牌管理', icon: 'layer-group' },
    { key: 'players', label: '玩家管理', icon: 'users' },
    { key: 'battles', label: '对战记录', icon: 'swords' },
  ];

  if (loading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: Spacing['3xl'] }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
          加载游戏数据...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.lg }}>
      {/* 标题栏 */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: BorderRadius.lg,
            backgroundColor: 'rgba(212,175,55,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <FontAwesome6 name="moon" size={24} color="#D4AF37" />
          </View>
          <View>
            <ThemedText variant="h4" color={theme.textPrimary}>万古长夜</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>国风粒子卡牌游戏平台</ThemedText>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.lg,
              backgroundColor: theme.primary,
              borderRadius: BorderRadius.lg,
            }}
            onPress={() => setGenerateModalVisible(true)}
          >
            <FontAwesome6 name="wand-magic-sparkles" size={14} color="#fff" />
            <ThemedText variant="small" color="#fff">AI生成卡牌</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.lg,
              backgroundColor: theme.success,
              borderRadius: BorderRadius.lg,
            }}
            onPress={handleBatchGenerate}
          >
            <FontAwesome6 name="bolt" size={14} color="#fff" />
            <ThemedText variant="small" color="#fff">极速生成</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 子标签 */}
      <View style={{ 
        flexDirection: 'row', 
        gap: Spacing.md, 
        borderBottomWidth: 1, 
        borderBottomColor: theme.border,
        paddingBottom: Spacing.sm,
      }}>
        {subTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: Spacing.sm,
              paddingVertical: Spacing.sm,
              paddingHorizontal: Spacing.lg,
              borderBottomWidth: 2,
              borderBottomColor: activeSubTab === tab.key ? theme.primary : 'transparent',
            }}
            onPress={() => setActiveSubTab(tab.key)}
          >
            <FontAwesome6 
              name={tab.icon as any} 
              size={14} 
              color={activeSubTab === tab.key ? theme.primary : theme.textMuted} 
            />
            <ThemedText 
              variant="small" 
              color={activeSubTab === tab.key ? theme.primary : theme.textSecondary}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* 内容区 */}
      {activeSubTab === 'overview' && (
        <OverviewSection stats={stats} theme={theme} />
      )}

      {activeSubTab === 'cards' && (
        <CardsSection 
          cards={cards} 
          theme={theme} 
          onRefresh={fetchCards}
        />
      )}

      {activeSubTab === 'players' && (
        <PlayersSection players={players} theme={theme} />
      )}

      {activeSubTab === 'battles' && (
        <BattlesSection theme={theme} />
      )}

      {/* 卡牌生成 Modal */}
      <Modal
        visible={generateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGenerateModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: 400,
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            gap: Spacing.lg,
          }}>
            <ThemedText variant="h4" color={theme.textPrimary}>AI 生成卡牌</ThemedText>
            
            {/* 阵营选择 */}
            <View>
              <ThemedText variant="smallMedium" color={theme.textSecondary}>阵营</ThemedText>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                {['幽冥', '昆仑', '蓬莱', '蛮荒', '万古'].map(f => (
                  <TouchableOpacity
                    key={f}
                    style={{
                      paddingVertical: Spacing.sm,
                      paddingHorizontal: Spacing.md,
                      borderRadius: BorderRadius.md,
                      backgroundColor: generateConfig.faction === f ? theme.primary : theme.backgroundTertiary,
                    }}
                    onPress={() => setGenerateConfig({ ...generateConfig, faction: f })}
                  >
                    <ThemedText variant="small" color={generateConfig.faction === f ? '#fff' : theme.textPrimary}>
                      {f}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 品级选择 */}
            <View>
              <ThemedText variant="smallMedium" color={theme.textSecondary}>品级</ThemedText>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                {['凡品', '灵品', '仙品', '圣品', '万古品'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={{
                      paddingVertical: Spacing.sm,
                      paddingHorizontal: Spacing.md,
                      borderRadius: BorderRadius.md,
                      backgroundColor: generateConfig.rarity === r ? theme.primary : theme.backgroundTertiary,
                    }}
                    onPress={() => setGenerateConfig({ ...generateConfig, rarity: r })}
                  >
                    <ThemedText variant="small" color={generateConfig.rarity === r ? '#fff' : theme.textPrimary}>
                      {r}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 类型选择 */}
            <View>
              <ThemedText variant="smallMedium" color={theme.textSecondary}>类型</ThemedText>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                {['角色', '技能', '场景'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={{
                      paddingVertical: Spacing.sm,
                      paddingHorizontal: Spacing.md,
                      borderRadius: BorderRadius.md,
                      backgroundColor: generateConfig.cardType === t ? theme.primary : theme.backgroundTertiary,
                    }}
                    onPress={() => setGenerateConfig({ ...generateConfig, cardType: t })}
                  >
                    <ThemedText variant="small" color={generateConfig.cardType === t ? '#fff' : theme.textPrimary}>
                      {t}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 操作按钮 */}
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: theme.backgroundTertiary,
                  alignItems: 'center',
                }}
                onPress={() => setGenerateModalVisible(false)}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: theme.primary,
                  alignItems: 'center',
                }}
                onPress={handleGenerateCards}
              >
                <ThemedText variant="smallMedium" color="#fff">生成</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ========== 子组件 ==========

/** 数据概览 */
function OverviewSection({ stats, theme }: { stats: GameStats | null; theme: any }) {
  if (!stats) return null;

  const statCards = [
    { label: '总玩家', value: stats.totalPlayers, icon: 'users', color: '#3B82F6' },
    { label: '活跃玩家', value: stats.activePlayers, icon: 'user-check', color: '#10B981' },
    { label: '在线玩家', value: stats.onlinePlayers, icon: 'signal', color: '#F59E0B' },
    { label: '总卡牌', value: stats.totalCards, icon: 'layer-group', color: '#8B5CF6' },
    { label: '总对战', value: stats.totalBattles, icon: 'swords', color: '#EF4444' },
    { label: '今日对战', value: stats.todayBattles, icon: 'fire', color: '#EC4899' },
  ];

  return (
    <View style={{ gap: Spacing.lg }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg }}>
        {statCards.map((stat, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              minWidth: 200,
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: BorderRadius.md,
                backgroundColor: `${stat.color}20`,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <FontAwesome6 name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <View>
                <ThemedText variant="h3" color={theme.textPrimary}>{stat.value.toLocaleString()}</ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>{stat.label}</ThemedText>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 快捷操作 */}
      <View style={{
        backgroundColor: theme.backgroundDefault,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
          快捷操作
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <QuickAction icon="gift" label="发放奖励" color="#F59E0B" theme={theme} />
          <QuickAction icon="bullhorn" label="发布公告" color="#3B82F6" theme={theme} />
          <QuickAction icon="ban" label="封禁玩家" color="#EF4444" theme={theme} />
          <QuickAction icon="chart-line" label="数据导出" color="#10B981" theme={theme} />
        </View>
      </View>
    </View>
  );
}

/** 快捷操作按钮 */
function QuickAction({ icon, label, color, theme }: { icon: string; label: string; color: string; theme: any }) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        backgroundColor: `${color}15`,
        borderRadius: BorderRadius.md,
      }}
    >
      <FontAwesome6 name={icon as any} size={14} color={color} />
      <ThemedText variant="small" color={color}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

/** 卡牌管理 */
function CardsSection({ cards, theme, onRefresh }: { cards: Card[]; theme: any; onRefresh: () => void }) {
  const FACTION_COLORS: Record<string, string> = {
    '幽冥': '#8B5CF6',
    '昆仑': '#3B82F6',
    '蓬莱': '#EC4899',
    '蛮荒': '#F97316',
    '万古': '#D4AF37',
  };

  const RARITY_COLORS: Record<string, string> = {
    '凡品': '#9CA3AF',
    '灵品': '#10B981',
    '仙品': '#3B82F6',
    '圣品': '#A855F7',
    '万古品': '#D4AF37',
  };

  return (
    <View style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ThemedText variant="smallMedium" color={theme.textSecondary}>
          共 {cards.length} 张卡牌
        </ThemedText>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
            backgroundColor: theme.backgroundTertiary,
            borderRadius: BorderRadius.md,
          }}
          onPress={onRefresh}
        >
          <FontAwesome6 name="rotate" size={12} color={theme.textPrimary} />
          <ThemedText variant="small" color={theme.textPrimary}>刷新</ThemedText>
        </TouchableOpacity>
      </View>

      {cards.length === 0 ? (
        <View style={{
          padding: Spacing['2xl'],
          backgroundColor: theme.backgroundDefault,
          borderRadius: BorderRadius.lg,
          alignItems: 'center',
        }}>
          <FontAwesome6 name="layer-group" size={40} color={theme.textMuted} />
          <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
            暂无卡牌，点击上方按钮生成
          </ThemedText>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 400 }}>
          <View style={{ gap: Spacing.sm }}>
            {cards.slice(0, 20).map((card) => (
              <View
                key={card.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                  gap: Spacing.md,
                }}
              >
                {/* 卡牌图标 */}
                <View style={{
                  width: 48,
                  height: 64,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: `${FACTION_COLORS[card.faction] || '#6B7280'}20`,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderLeftWidth: 3,
                  borderLeftColor: FACTION_COLORS[card.faction] || '#6B7280',
                }}>
                  <FontAwesome6 name="image" size={16} color={FACTION_COLORS[card.faction] || '#6B7280'} />
                </View>

                {/* 卡牌信息 */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>{card.name}</ThemedText>
                    <View style={{
                      paddingVertical: 2,
                      paddingHorizontal: Spacing.sm,
                      borderRadius: BorderRadius.sm,
                      backgroundColor: `${RARITY_COLORS[card.rarity] || '#6B7280'}20`,
                    }}>
                      <ThemedText variant="tiny" color={RARITY_COLORS[card.rarity] || '#6B7280'}>
                        {card.rarity}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs }}>
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      攻击: {card.attack}
                    </ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      防御: {card.defense}
                    </ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted}>
                      生命: {card.hp}
                    </ThemedText>
                  </View>
                </View>

                {/* 操作按钮 */}
                <TouchableOpacity style={{
                  padding: Spacing.sm,
                  borderRadius: BorderRadius.md,
                  backgroundColor: theme.backgroundTertiary,
                }}>
                  <FontAwesome6 name="ellipsis-vertical" size={14} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** 玩家管理 */
function PlayersSection({ players, theme }: { players: Player[]; theme: any }) {
  return (
    <View style={{ gap: Spacing.md }}>
      <ThemedText variant="smallMedium" color={theme.textSecondary}>
        共 {players.length} 位玩家
      </ThemedText>

      <ScrollView style={{ maxHeight: 400 }}>
        <View style={{ gap: Spacing.sm }}>
          {players.map((player) => (
            <View
              key={player.player_id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                borderWidth: 1,
                borderColor: theme.border,
                gap: Spacing.md,
              }}
            >
              {/* 头像 */}
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <FontAwesome6 name="user" size={20} color="#fff" />
              </View>

              {/* 玩家信息 */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>{player.nickname}</ThemedText>
                  <View style={{
                    paddingVertical: 2,
                    paddingHorizontal: Spacing.sm,
                    borderRadius: BorderRadius.sm,
                    backgroundColor: theme.primary + '20',
                  }}>
                    <ThemedText variant="tiny" color={theme.primary}>Lv.{player.level}</ThemedText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs }}>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    <FontAwesome6 name="coins" size={10} color="#D4AF37" /> {player.gold}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    <FontAwesome6 name="gem" size={10} color="#EC4899" /> {player.gems}
                  </ThemedText>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    {player.wins}胜 {player.losses}负
                  </ThemedText>
                </View>
              </View>

              {/* 操作按钮 */}
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <TouchableOpacity style={{
                  padding: Spacing.sm,
                  borderRadius: BorderRadius.md,
                  backgroundColor: '#3B82F620',
                }}>
                  <FontAwesome6 name="eye" size={14} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity style={{
                  padding: Spacing.sm,
                  borderRadius: BorderRadius.md,
                  backgroundColor: '#EF444420',
                }}>
                  <FontAwesome6 name="ban" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

/** 对战记录 */
function BattlesSection({ theme }: { theme: any }) {
  // 模拟数据
  const battles = [
    { id: 'b001', player1: '剑圣无双', player2: '幽冥主宰', winner: '剑圣无双', turns: 12, time: '2分钟前' },
    { id: 'b002', player1: '昆仑仙子', player2: '蓬莱尊者', winner: '昆仑仙子', turns: 8, time: '5分钟前' },
    { id: 'b003', player1: '蛮荒战神', player2: '万古至尊', winner: '万古至尊', turns: 15, time: '10分钟前' },
  ];

  return (
    <View style={{ gap: Spacing.md }}>
      <ThemedText variant="smallMedium" color={theme.textSecondary}>
        最近对战记录
      </ThemedText>

      <View style={{ gap: Spacing.sm }}>
        {battles.map((battle) => (
          <View
            key={battle.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.md,
              borderWidth: 1,
              borderColor: theme.border,
              gap: Spacing.md,
            }}
          >
            <FontAwesome6 name="swords" size={20} color={theme.primary} />
            
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <ThemedText variant="small" color={battle.winner === battle.player1 ? theme.success : theme.textPrimary}>
                  {battle.player1}
                </ThemedText>
                <ThemedText variant="small" color={theme.textMuted}>VS</ThemedText>
                <ThemedText variant="small" color={battle.winner === battle.player2 ? theme.success : theme.textPrimary}>
                  {battle.player2}
                </ThemedText>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xs }}>
                <ThemedText variant="tiny" color={theme.textMuted}>{battle.turns} 回合</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>{battle.time}</ThemedText>
              </View>
            </View>

            <View style={{
              paddingVertical: 2,
              paddingHorizontal: Spacing.sm,
              borderRadius: BorderRadius.sm,
              backgroundColor: theme.success + '20',
            }}>
              <ThemedText variant="tiny" color={theme.success}>胜利: {battle.winner}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default GamePanel;
