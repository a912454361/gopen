/**
 * 国风粒子卡牌对战 - 极致高端UI设计
 * 
 * 功能：
 * - 回合制卡牌对战
 * - 技能释放与粒子特效
 * - 沉浸式战斗体验
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

interface Battle {
  id: string;
  player1_id: string;
  player2_id: string | null;
  status: string;
  winner_id: string | null;
  battle_log: {
    player1_hp: number;
    player2_hp: number;
    player1_mana: number;
    player2_mana: number;
    turn: number;
    current_player: number;
    logs: Array<{ turn: number; action: string; card: string; damage?: number; log: string }>;
  };
}

// 品级颜色
const RARITY_COLORS: Record<string, string> = {
  '凡品': '#808080',
  '灵品': '#2ECC71',
  '仙品': '#3498DB',
  '圣品': '#9B59B6',
  '万古品': '#D4AF37',
};

export default function InkBattleScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ cardId?: string }>();

  // 状态
  const [loading, setLoading] = useState(true);
  const [battle, setBattle] = useState<Battle | null>(null);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [gameEnded, setGameEnded] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  // 初始化战斗
  useEffect(() => {
    initBattle();
  }, []);

  const initBattle = async () => {
    try {
      let storedPlayerId = await AsyncStorage.getItem('ink_player_id');
      if (!storedPlayerId) {
        storedPlayerId = `ink_${Date.now()}`;
        await AsyncStorage.setItem('ink_player_id', storedPlayerId);
      }
      setPlayerId(storedPlayerId);

      const cardsResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/cards?limit=10`
      );
      const cardsData = await cardsResponse.json();
      setPlayerDeck(cardsData.cards || []);

      const battleResponse = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/battle/create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: storedPlayerId,
            isAi: true,
          }),
        }
      );
      const battleData = await battleResponse.json();
      setBattle(battleData.battle);
    } catch (error) {
      console.error('初始化战斗失败:', error);
      setBattle({
        id: `battle_${Date.now()}`,
        player1_id: playerId || 'player',
        player2_id: null,
        status: 'playing',
        winner_id: null,
        battle_log: {
          player1_hp: 100,
          player2_hp: 100,
          player1_mana: 5,
          player2_mana: 5,
          turn: 1,
          current_player: 1,
          logs: [],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttack = async () => {
    if (!selectedCard || !battle || actionLoading) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/battle/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleId: battle.id,
            playerId,
            action: 'attack',
            cardId: selectedCard.id,
          }),
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setBattle(data.battle);
        setSelectedCard(null);
        if (data.battle.status === 'finished') {
          setGameEnded(true);
          setIsVictory(data.battle.winner_id === playerId);
        }
      }
    } catch (error) {
      console.error('攻击失败:', error);
      if (battle) {
        const newLog = { ...battle.battle_log };
        newLog.player2_hp = Math.max(0, newLog.player2_hp - selectedCard.attack);
        newLog.logs.push({
          turn: newLog.turn,
          action: 'attack',
          card: selectedCard.name,
          damage: selectedCard.attack,
          log: `【${selectedCard.name}】发动攻击，造成${selectedCard.attack}点伤害！`,
        });
        setBattle({ ...battle, battle_log: newLog });
        if (newLog.player2_hp <= 0) {
          setGameEnded(true);
          setIsVictory(true);
        }
      }
      setSelectedCard(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkill = async () => {
    if (!selectedCard || !battle || actionLoading) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ink/battle/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            battleId: battle.id,
            playerId,
            action: 'skill',
            cardId: selectedCard.id,
          }),
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setBattle(data.battle);
        setSelectedCard(null);
        if (data.battle.status === 'finished') {
          setGameEnded(true);
          setIsVictory(data.battle.winner_id === playerId);
        }
      }
    } catch (error) {
      console.error('技能释放失败:', error);
      if (battle) {
        const newLog = { ...battle.battle_log };
        const damage = selectedCard.attack * 2;
        newLog.player2_hp = Math.max(0, newLog.player2_hp - damage);
        newLog.logs.push({
          turn: newLog.turn,
          action: 'skill',
          card: selectedCard.name,
          damage,
          log: `【${selectedCard.name}】释放【${selectedCard.skill_name}】，造成${damage}点伤害！`,
        });
        setBattle({ ...battle, battle_log: newLog });
        if (newLog.player2_hp <= 0) {
          setGameEnded(true);
          setIsVictory(true);
        }
      }
      setSelectedCard(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTurn = () => {
    if (!battle || actionLoading) return;
    
    const aiDamage = 5 + Math.floor(Math.random() * 15);
    const newLog = { ...battle.battle_log };
    newLog.player1_hp = Math.max(0, newLog.player1_hp - aiDamage);
    newLog.turn += 1;
    newLog.logs.push({
      turn: newLog.turn,
      action: 'ai_attack',
      card: 'AI',
      damage: aiDamage,
      log: `敌方发动攻击，造成${aiDamage}点伤害！`,
    });
    
    setBattle({ ...battle, battle_log: newLog });
    
    if (newLog.player1_hp <= 0) {
      setGameEnded(true);
      setIsVictory(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  // 渲染手牌
  const renderHandCard = useCallback(({ item }: { item: Card }) => {
    const isSelected = selectedCard?.id === item.id;
    const rarityColor = RARITY_COLORS[item.rarity] || '#808080';
    
    return (
      <TouchableOpacity
        style={[
          styles.handCard,
          { borderColor: isSelected ? '#D4AF37' : rarityColor },
          isSelected && styles.handCardSelected,
        ]}
        onPress={() => setSelectedCard(isSelected ? null : item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.image_url || `https://picsum.photos/seed/${item.id}/140/120` }}
          style={styles.handCardImage}
          resizeMode="cover"
        />
        <View style={styles.handCardCost}>
          <ThemedText style={styles.handCardCostText}>{item.cost}</ThemedText>
        </View>
        <View style={styles.handCardInfo}>
          <ThemedText style={styles.handCardName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <View style={styles.handCardStats}>
            <FontAwesome6 name="hand-fist" size={6} color="#FF6B6B" />
            <ThemedText style={[styles.handCardStatValue, { color: '#FF6B6B' }]}>{item.attack}</ThemedText>
            <FontAwesome6 name="shield-halved" size={6} color="#4ECDC4" />
            <ThemedText style={[styles.handCardStatValue, { color: '#4ECDC4' }]}>{item.defense}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [selectedCard]);

  // 加载中
  if (loading) {
    return (
      <Screen backgroundColor="#080808" statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <FontAwesome6 name="shield-halved" size={28} color="#D4AF37" />
          </View>
          <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 20 }} />
          <ThemedText style={styles.loadingText}>正在进入战场...</ThemedText>
        </View>
      </Screen>
    );
  }

  const battleLog = battle?.battle_log || {
    player1_hp: 100,
    player2_hp: 100,
    player1_mana: 5,
    player2_mana: 5,
    turn: 1,
    logs: [],
  };

  const latestLog = battleLog.logs[battleLog.logs.length - 1];

  return (
    <Screen backgroundColor="#080808" statusBarStyle="light">
      <View style={styles.battleScene}>
        {/* 敌方区域 */}
        <View style={styles.enemyArea}>
          <View style={styles.enemyGradient} />
          <View style={styles.enemyHeader}>
            <View style={styles.enemyAvatar}>
              <FontAwesome6 name="skull" size={20} color="#FF4444" />
            </View>
            <View style={styles.enemyInfo}>
              <ThemedText style={styles.enemyName}>AI 对手</ThemedText>
              <ThemedText style={styles.enemyHpText}>HP: {battleLog.player2_hp}/100</ThemedText>
            </View>
          </View>
          <View style={styles.enemyHpBarContainer}>
            <View style={styles.enemyHpBarBg}>
              <View
                style={[
                  styles.enemyHpBarFill,
                  { width: `${battleLog.player2_hp}%`, backgroundColor: '#FF4444' },
                ]}
              />
            </View>
          </View>
        </View>

        {/* 战斗日志区域 */}
        <View style={styles.battleLogArea}>
          <View style={styles.battleLogBg} />
          <ThemedText style={styles.battleLogText}>
            {latestLog?.log || '选择一张卡牌开始战斗'}
          </ThemedText>
          <ThemedText style={styles.turnIndicator}>
            第 {battleLog.turn} 回合
          </ThemedText>
        </View>

        {/* 玩家区域 */}
        <View style={styles.playerArea}>
          <View style={styles.playerGradient} />
          
          <View style={styles.playerHeader}>
            <View style={styles.playerAvatar}>
              <FontAwesome6 name="user" size={20} color="#4ECDC4" />
            </View>
            <View style={styles.playerInfo}>
              <ThemedText style={styles.playerName}>修士</ThemedText>
              <ThemedText style={styles.playerHpText}>HP: {battleLog.player1_hp}/100</ThemedText>
            </View>
          </View>
          
          <View style={styles.playerHpBarContainer}>
            <View style={styles.playerHpBarBg}>
              <View
                style={[
                  styles.playerHpBarFill,
                  { width: `${battleLog.player1_hp}%`, backgroundColor: '#4ECDC4' },
                ]}
              />
            </View>
          </View>

          {/* 法力值 */}
          <View style={styles.manaContainer}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.manaOrb,
                  i < battleLog.player1_mana ? styles.manaFilled : styles.manaEmpty,
                ]}
              >
                <ThemedText style={[styles.manaText, { color: i < battleLog.player1_mana ? '#FFF' : 'rgba(74, 144, 217, 0.5)' }]}>
                  {i + 1}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* 手牌区域 */}
          <FlatList
            data={playerDeck.slice(0, 5)}
            renderItem={renderHandCard}
            keyExtractor={(item) => item.id}
            horizontal
            contentContainerStyle={styles.handArea}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* 操作按钮区域 */}
        <View style={styles.actionArea}>
          <TouchableOpacity
            style={[styles.actionButton, styles.attackButton]}
            onPress={handleAttack}
            disabled={!selectedCard || actionLoading}
          >
            <FontAwesome6 name="hand-fist" size={12} color="#FFF" />
            <ThemedText style={styles.actionButtonText}>攻击</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.skillButton]}
            onPress={handleSkill}
            disabled={!selectedCard || actionLoading}
          >
            <FontAwesome6 name="wand-magic-sparkles" size={12} color="#FFF" />
            <ThemedText style={styles.actionButtonText}>技能</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.endTurnButton]}
            onPress={handleEndTurn}
            disabled={actionLoading}
          >
            <FontAwesome6 name="forward" size={12} color="#0A0A0A" />
            <ThemedText style={[styles.actionButtonText, styles.endTurnButtonText]}>结束回合</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 结果弹窗 */}
      {gameEnded && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultContent}>
            <View style={[
              styles.resultIcon, 
              isVictory ? styles.victoryIcon : styles.defeatIcon
            ]}>
              <FontAwesome6 
                name={isVictory ? 'trophy' : 'skull'} 
                size={36} 
                color={isVictory ? '#D4AF37' : '#FF4444'} 
              />
            </View>
            <ThemedText style={[styles.resultTitle, isVictory ? styles.victoryTitle : styles.defeatTitle]}>
              {isVictory ? '胜利' : '战败'}
            </ThemedText>
            <ThemedText style={styles.resultSubtitle}>
              {isVictory ? '恭喜获得胜利！' : '下次再接再厉'}
            </ThemedText>
            <TouchableOpacity style={styles.resultButton} onPress={handleBack}>
              <ThemedText style={styles.resultButtonText}>返回</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Screen>
  );
}
