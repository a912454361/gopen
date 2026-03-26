/**
 * 国风粒子卡牌游戏 - 卡牌收藏页面
 * 
 * 功能：
 * - 展示所有卡牌
 * - 阵营筛选
 * - 抽卡系统
 * - AI生成新卡牌
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 类型定义
interface Card {
  id: string;
  name: string;
  description: string;
  faction: string;
  rarity: string;
  card_type: string;
  attack: number;
  defense: number;
  hp: number;
  cost: number;
  skill_name: string;
  skill_description: string;
  image_url: string;
  particle_config: any;
  keywords: string[];
}

interface Player {
  player_id: string;
  nickname: string;
  level: number;
  gold: number;
  gems: number;
  wins: number;
  losses: number;
}

// 阵营配置
const FACTIONS = [
  { id: 'all', name: '全部', color: '#D4AF37' },
  { id: '幽冥', name: '幽冥', color: '#4a0080' },
  { id: '昆仑', name: '昆仑', color: '#4fc3f7' },
  { id: '蓬莱', name: '蓬莱', color: '#f8bbd9' },
  { id: '蛮荒', name: '蛮荒', color: '#ff6f00' },
  { id: '万古', name: '万古', color: '#ffd700' },
];

// 品级配置
const RARITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  '凡品': { bg: 'rgba(128, 128, 128, 0.8)', text: '#FFF', border: '#808080' },
  '灵品': { bg: 'rgba(46, 204, 113, 0.8)', text: '#FFF', border: '#2ECC71' },
  '仙品': { bg: 'rgba(52, 152, 219, 0.8)', text: '#FFF', border: '#3498DB' },
  '圣品': { bg: 'rgba(155, 89, 182, 0.8)', text: '#FFF', border: '#9B59B6' },
  '万古品': { bg: 'rgba(212, 175, 55, 0.9)', text: '#0D0D0D', border: '#D4AF37' },
};

export default function InkCardsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  // 状态
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [selectedFaction, setSelectedFaction] = useState('all');
  const [drawModalVisible, setDrawModalVisible] = useState(false);
  const [drawnCards, setDrawnCards] = useState<Card[]>([]);
  const [drawLoading, setDrawLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // 初始化
  useEffect(() => {
    initPlayer();
  }, []);

  const initPlayer = async () => {
    try {
      // 获取或创建玩家ID
      let storedPlayerId = await AsyncStorage.getItem('ink_player_id');
      if (!storedPlayerId) {
        storedPlayerId = `ink_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('ink_player_id', storedPlayerId);
      }
      setPlayerId(storedPlayerId);

      // 获取玩家数据
      /**
       * 服务端文件：server/src/routes/ink-card-game.ts
       * 接口：GET /api/v1/ink/player/:playerId
       */
      const playerResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/player/${storedPlayerId}`
      );
      const playerData = await playerResponse.json();
      setPlayer(playerData.player);

      // 获取卡牌列表
      await fetchCards();
    } catch (error) {
      console.error('初始化失败:', error);
      // 使用默认数据
      const fallbackId = playerId || 'default';
      setPlayer({
        player_id: fallbackId,
        nickname: '修士',
        level: 1,
        gold: 1000,
        gems: 100,
        wins: 0,
        losses: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async () => {
    try {
      /**
       * 服务端文件：server/src/routes/ink-card-game.ts
       * 接口：GET /api/v1/ink/cards
       * Query 参数：faction?: string, rarity?: string, type?: string
       */
      const url = selectedFaction === 'all'
        ? `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/cards?limit=50`
        : `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/cards?faction=${selectedFaction}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setCards(data.cards || []);
    } catch (error) {
      console.error('获取卡牌失败:', error);
    }
  };

  // 切换阵营筛选
  useEffect(() => {
    if (!loading) {
      fetchCards();
    }
  }, [selectedFaction]);

  // 抽卡
  const handleDraw = async () => {
    if (!playerId || (player && player.gold < 100)) {
      alert('金币不足，需要100金币');
      return;
    }

    setDrawLoading(true);
    try {
      /**
       * 服务端文件：server/src/routes/ink-card-game.ts
       * 接口：POST /api/v1/ink/draw
       * Body 参数：playerId: string, count: number, faction?: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          count: 1,
          faction: selectedFaction !== 'all' ? selectedFaction : undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.cards.length > 0) {
        setDrawnCards(data.cards);
        setDrawModalVisible(true);
        // 更新玩家金币
        if (player) {
          setPlayer({ ...player, gold: player.gold - data.cost });
        }
      } else {
        alert(data.error || '抽卡失败');
      }
    } catch (error) {
      console.error('抽卡失败:', error);
      alert('抽卡失败，请重试');
    } finally {
      setDrawLoading(false);
    }
  };

  // AI生成卡牌
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      /**
       * 服务端文件：server/src/routes/ink-card-game.ts
       * 接口：POST /api/v1/ink/batch-generate
       * Body 参数：count?: number
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/batch-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 20 }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`成功生成 ${data.generated} 张卡牌！`);
        fetchCards();
      }
    } catch (error) {
      console.error('生成卡牌失败:', error);
      alert('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 渲染卡牌
  const renderCard = useCallback(({ item }: { item: Card }) => {
    const rarityStyle = RARITY_STYLES[item.rarity] || RARITY_STYLES['凡品'];
    const faction = FACTIONS.find(f => f.id === item.faction);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { width: CARD_WIDTH, borderColor: rarityStyle.border },
        ]}
        activeOpacity={0.8}
        onPress={() => router.push('/ink-battle', { cardId: item.id })}
      >
        {/* 品级标签 */}
        <View style={[styles.cardRarity, { backgroundColor: rarityStyle.bg }]}>
          <ThemedText style={[styles.rarityText, { color: rarityStyle.text }]}>
            {item.rarity}
          </ThemedText>
        </View>

        {/* 卡牌图片 */}
        <Image
          source={{ uri: item.image_url || `https://picsum.photos/seed/${item.id}/320/400` }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* 卡牌信息 */}
        <View style={styles.cardInfo}>
          <ThemedText style={styles.cardName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.cardFaction}>
            {item.faction} · {item.card_type}
          </ThemedText>
          
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <FontAwesome6 name="hand-fist" size={10} color="#FF6B6B" />
              <ThemedText style={styles.statValue}>{item.attack}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="shield-halved" size={10} color="#4ECDC4" />
              <ThemedText style={styles.statValue}>{item.defense}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="heart" size={10} color="#FF6B9D" />
              <ThemedText style={styles.statValue}>{item.hp}</ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [CARD_WIDTH]);

  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor="#0D0D0D" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <ThemedText style={styles.loadingText}>正在进入万古长夜...</ThemedText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#0D0D0D" statusBarStyle="light">
      {/* 顶部区域 */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>万古长夜</ThemedText>
        <ThemedText style={styles.headerSubtitle}>水墨成卡，粒子为魂</ThemedText>
      </View>

      {/* 玩家信息栏 */}
      <View style={styles.playerBar}>
        <View style={styles.playerInfo}>
          <ThemedText style={styles.playerName}>{player?.nickname || '修士'}</ThemedText>
          <ThemedText style={styles.playerLevel}>Lv.{player?.level || 1}</ThemedText>
        </View>
        <View style={styles.resourceItem}>
          <View style={[styles.resourceIcon, styles.goldIcon]}>
            <FontAwesome6 name="coins" size={10} color="#0D0D0D" />
          </View>
          <ThemedText style={styles.resourceValue}>{player?.gold || 0}</ThemedText>
        </View>
        <View style={styles.resourceItem}>
          <View style={[styles.resourceIcon, styles.gemIcon]}>
            <FontAwesome6 name="gem" size={10} color="#FFF" />
          </View>
          <ThemedText style={styles.resourceValue}>{player?.gems || 0}</ThemedText>
        </View>
      </View>

      {/* 阵营筛选 */}
      <View style={styles.factionFilter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.factionScroll}>
            {FACTIONS.map((faction) => (
              <TouchableOpacity
                key={faction.id}
                style={[
                  styles.factionButton,
                  selectedFaction === faction.id && styles.factionButtonActive,
                ]}
                onPress={() => setSelectedFaction(faction.id)}
              >
                <ThemedText
                  style={[
                    styles.factionText,
                    selectedFaction === faction.id && styles.factionTextActive,
                  ]}
                >
                  {faction.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 卡牌列表 */}
      <FlatList
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.cardGrid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome6 name="scroll" size={48} color="#8B7355" />
            <ThemedText style={styles.emptyText}>暂无卡牌，点击生成</ThemedText>
          </View>
        }
      />

      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#D4AF37" />
          ) : (
            <>
              <FontAwesome6 name="wand-magic-sparkles" size={16} color="#D4AF37" />
              <ThemedText style={styles.secondaryButtonText}>生成卡牌</ThemedText>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleDraw}
          disabled={drawLoading}
        >
          {drawLoading ? (
            <ActivityIndicator size="small" color="#0D0D0D" />
          ) : (
            <>
              <FontAwesome6 name="box-open" size={16} color="#0D0D0D" />
              <ThemedText style={styles.primaryButtonText}>抽卡 (100金)</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 抽卡结果模态框 */}
      <Modal
        visible={drawModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>获得新卡</ThemedText>
            
            {drawnCards.map((card, index) => {
              const rarityStyle = RARITY_STYLES[card.rarity] || RARITY_STYLES['凡品'];
              return (
                <View key={card.id || index} style={styles.modalCard}>
                  <Image
                    source={{ uri: card.image_url || `https://picsum.photos/seed/${card.id}/400/560` }}
                    style={styles.modalCardImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.cardRarity, { backgroundColor: rarityStyle.bg, position: 'relative', marginTop: 12 }]}>
                    <ThemedText style={[styles.rarityText, { color: rarityStyle.text }]}>
                      {card.rarity}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.modalCardName}>{card.name}</ThemedText>
                  <ThemedText style={styles.cardFaction}>{card.faction} · {card.card_type}</ThemedText>
                </View>
              );
            })}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setDrawModalVisible(false);
                setDrawnCards([]);
              }}
            >
              <ThemedText style={styles.modalCloseText}>确认</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
