/**
 * 国风粒子卡牌游戏 - 极致高端卡牌收藏页面
 * 
 * 设计理念：
 * - 万古长夜黑 + 鎏金色点缀
 * - 水墨晕染效果
 * - 奢侈品级视觉质感
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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
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

// 阵营配置（带颜色）
const FACTIONS = [
  { id: 'all', name: '全部', color: '#D4AF37', bgColor: 'rgba(212, 175, 55, 0.1)' },
  { id: '幽冥', name: '幽冥', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.1)' },
  { id: '昆仑', name: '昆仑', color: '#3498DB', bgColor: 'rgba(52, 152, 219, 0.1)' },
  { id: '蓬莱', name: '蓬莱', color: '#E91E63', bgColor: 'rgba(233, 30, 99, 0.1)' },
  { id: '蛮荒', name: '蛮荒', color: '#FF6F00', bgColor: 'rgba(255, 111, 0, 0.1)' },
  { id: '万古', name: '万古', color: '#D4AF37', bgColor: 'rgba(212, 175, 55, 0.15)' },
];

// 品级样式配置
const RARITY_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  '凡品': { 
    bg: 'rgba(100, 100, 100, 0.95)', 
    text: '#FFFFFF', 
    border: '#808080',
    glow: 'transparent'
  },
  '灵品': { 
    bg: 'rgba(46, 204, 113, 0.95)', 
    text: '#FFFFFF', 
    border: '#2ECC71',
    glow: 'rgba(46, 204, 113, 0.3)'
  },
  '仙品': { 
    bg: 'rgba(52, 152, 219, 0.95)', 
    text: '#FFFFFF', 
    border: '#3498DB',
    glow: 'rgba(52, 152, 219, 0.3)'
  },
  '圣品': { 
    bg: 'rgba(155, 89, 182, 0.95)', 
    text: '#FFFFFF', 
    border: '#9B59B6',
    glow: 'rgba(155, 89, 182, 0.3)'
  },
  '万古品': { 
    bg: 'rgba(212, 175, 55, 0.98)', 
    text: '#0A0A0A', 
    border: '#D4AF37',
    glow: 'rgba(212, 175, 55, 0.4)'
  },
};

export default function InkCardsScreen() {
  const { theme } = useTheme();
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
      let storedPlayerId = await AsyncStorage.getItem('ink_player_id');
      if (!storedPlayerId) {
        storedPlayerId = `ink_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('ink_player_id', storedPlayerId);
      }
      setPlayerId(storedPlayerId);

      const playerResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/player/${storedPlayerId}`
      );
      const playerData = await playerResponse.json();
      setPlayer(playerData.player);
      await fetchCards();
    } catch (error) {
      console.error('初始化失败:', error);
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

  useEffect(() => {
    if (!loading) fetchCards();
  }, [selectedFaction]);

  const handleDraw = async () => {
    if (!playerId || (player && player.gold < 100)) {
      alert('金币不足，需要100金币');
      return;
    }

    setDrawLoading(true);
    try {
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
        if (player) setPlayer({ ...player, gold: player.gold - data.cost });
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

  const handleGenerate = async () => {
    setGenerating(true);
    try {
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
        style={[styles.card, { width: CARD_WIDTH }]}
        activeOpacity={0.85}
        onPress={() => router.push('/ink-battle', { cardId: item.id })}
      >
        {/* 卡牌图片区域 */}
        <View style={styles.cardImageContainer}>
          <Image
            source={{ uri: item.image_url || `https://picsum.photos/seed/${item.id}/320/400` }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardImageOverlay} />
          
          {/* 阵营徽章 */}
          <View style={[
            styles.cardFactionBadge, 
            { backgroundColor: faction?.bgColor, borderColor: faction?.color }
          ]}>
            <FontAwesome6 
              name={item.faction === '幽冥' ? 'ghost' : 
                   item.faction === '昆仑' ? 'mountain-sun' : 
                   item.faction === '蓬莱' ? 'cloud' : 
                   item.faction === '蛮荒' ? 'fire' : 
                   'star'} 
              size={10} 
              color={faction?.color} 
            />
          </View>
          
          {/* 品级徽章 */}
          <View style={[styles.cardRarityBadge, { backgroundColor: rarityStyle.bg }]}>
            <ThemedText style={[styles.cardRarityText, { color: rarityStyle.text }]}>
              {item.rarity}
            </ThemedText>
          </View>
        </View>

        {/* 卡牌信息区域 */}
        <View style={styles.cardInfo}>
          <ThemedText style={styles.cardName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.cardFaction}>
            {item.faction} · {item.card_type}
          </ThemedText>
          
          <View style={styles.cardStats}>
            <View style={styles.statItem}>
              <FontAwesome6 name="hand-fist" size={9} color="#FF6B6B" />
              <ThemedText style={styles.statValue}>{item.attack}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="shield-halved" size={9} color="#4ECDC4" />
              <ThemedText style={styles.statValue}>{item.defense}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="heart" size={9} color="#FF6B9D" />
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
      <Screen backgroundColor="#080808" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.emptyIcon}>
              <FontAwesome6 name="scroll" size={28} color="#D4AF37" />
            </View>
            <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 20 }} />
            <ThemedText style={styles.loadingText}>正在进入万古长夜...</ThemedText>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor="#080808" statusBarStyle="light">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 英雄区域 */}
        <View style={styles.heroSection}>
          <View style={styles.heroGradient} />
          <View style={styles.heroInkEffect} />
          
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerLabel}>AI Native Card Game</ThemedText>
            <ThemedText style={styles.headerTitle}>万古长夜</ThemedText>
            <ThemedText style={styles.headerSubtitle}>水墨成卡，粒子为魂，AI造万象</ThemedText>
            <View style={styles.goldDivider} />
          </View>
        </View>

        {/* 玩家状态栏 */}
        <View style={styles.playerSection}>
          <View style={styles.playerAvatar}>
            <View style={styles.playerAvatarInner}>
              <FontAwesome6 name="user" size={20} color="#D4AF37" />
            </View>
          </View>
          
          <View style={styles.playerInfo}>
            <ThemedText style={styles.playerName}>{player?.nickname || '修士'}</ThemedText>
            <ThemedText style={styles.playerLevel}>Lv.{player?.level || 1}</ThemedText>
            <ThemedText style={styles.playerRank}>
              战绩: {player?.wins || 0}胜 {player?.losses || 0}负
            </ThemedText>
          </View>
          
          <View style={styles.resourceContainer}>
            <View style={styles.resourceItem}>
              <View style={[styles.resourceIconBg, styles.goldBg]}>
                <FontAwesome6 name="coins" size={14} color="#D4AF37" />
              </View>
              <ThemedText style={styles.resourceValue}>{player?.gold || 0}</ThemedText>
            </View>
            <View style={styles.resourceItem}>
              <View style={[styles.resourceIconBg, styles.gemBg]}>
                <FontAwesome6 name="gem" size={14} color="#9370DB" />
              </View>
              <ThemedText style={styles.resourceValue}>{player?.gems || 0}</ThemedText>
            </View>
          </View>
        </View>

        {/* 阵营筛选 */}
        <View style={styles.factionSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.factionScroll}
          >
            <View style={styles.factionContent}>
              {FACTIONS.map((faction) => (
                <TouchableOpacity
                  key={faction.id}
                  style={[
                    styles.factionButton,
                    selectedFaction === faction.id && styles.factionButtonActive,
                    selectedFaction === faction.id && { borderColor: faction.color, backgroundColor: faction.bgColor }
                  ]}
                  onPress={() => setSelectedFaction(faction.id)}
                >
                  <ThemedText
                    style={[
                      styles.factionText,
                      selectedFaction === faction.id && styles.factionTextActive,
                      selectedFaction === faction.id && { color: faction.color }
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
        <View style={styles.cardSection}>
          <FlatList
            data={cards}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.cardGrid}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <FontAwesome6 name="scroll" size={28} color="#D4AF37" />
                </View>
                <ThemedText style={styles.emptyText}>暂无卡牌，点击生成</ThemedText>
              </View>
            }
          />
        </View>
        
        {/* 底部占位 */}
        <View style={{ height: 120 }} />
      </ScrollView>

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
              <FontAwesome6 name="wand-magic-sparkles" size={14} color="#D4AF37" />
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
            <ActivityIndicator size="small" color="#0A0A0A" />
          ) : (
            <>
              <FontAwesome6 name="box-open" size={14} color="#0A0A0A" />
              <ThemedText style={styles.primaryButtonText}>抽卡 100金</ThemedText>
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
            <ThemedText style={styles.modalTitle}>Card Acquired</ThemedText>
            <ThemedText style={styles.modalSubtitle}>获得新卡</ThemedText>
            <View style={styles.goldDivider} />
            
            {drawnCards.map((card) => {
              const rarityStyle = RARITY_STYLES[card.rarity] || RARITY_STYLES['凡品'];
              return (
                <View key={card.id} style={styles.modalCardContainer}>
                  <Image
                    source={{ uri: card.image_url || `https://picsum.photos/seed/${card.id}/400/560` }}
                    style={styles.modalCardImage}
                    resizeMode="cover"
                  />
                  <View style={[
                    styles.cardRarityBadge, 
                    { backgroundColor: rarityStyle.bg, position: 'relative', marginTop: 16 }
                  ]}>
                    <ThemedText style={[styles.cardRarityText, { color: rarityStyle.text }]}>
                      {card.rarity}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.modalCardName}>{card.name}</ThemedText>
                  <ThemedText style={styles.modalCardInfo}>{card.faction} · {card.card_type}</ThemedText>
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
