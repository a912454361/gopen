/**
 * 国风粒子卡牌游戏 - 深度游戏系统扩展
 * 
 * 新增功能：
 * 1. 羁绊系统 - 同阵营卡牌上阵加成
 * 2. 进化系统 - 卡牌升级进化
 * 3. 装备系统 - 武器/法宝装备
 * 4. 副本系统 - 挑战关卡
 */

import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = express.Router();
const supabase = getSupabaseClient();

// ==================== 羁绊系统 ====================

/**
 * 羁绊配置
 * 当队伍中存在特定组合的卡牌时触发
 */
const BOND_CONFIG = [
  // 幽冥羁绊
  {
    id: 'youming_3',
    name: '幽冥之力',
    description: '上阵3张幽冥卡牌，全队攻击+15%',
    faction: '幽冥',
    requiredCount: 3,
    effects: { attack_percent: 0.15 },
  },
  {
    id: 'youming_5',
    name: '冥界降临',
    description: '上阵5张幽冥卡牌，全队攻击+25%，防御+15%',
    faction: '幽冥',
    requiredCount: 5,
    effects: { attack_percent: 0.25, defense_percent: 0.15 },
  },
  // 昆仑羁绊
  {
    id: 'kunlun_3',
    name: '昆仑仙缘',
    description: '上阵3张昆仑卡牌，全队HP+20%',
    faction: '昆仑',
    requiredCount: 3,
    effects: { hp_percent: 0.20 },
  },
  {
    id: 'kunlun_5',
    name: '天道加持',
    description: '上阵5张昆仑卡牌，全队HP+30%，技能伤害+20%',
    faction: '昆仑',
    requiredCount: 5,
    effects: { hp_percent: 0.30, skill_damage_percent: 0.20 },
  },
  // 蓬莱羁绊
  {
    id: 'penglai_3',
    name: '蓬莱仙境',
    description: '上阵3张蓬莱卡牌，回合结束回复10%HP',
    faction: '蓬莱',
    requiredCount: 3,
    effects: { hp_regen_percent: 0.10 },
  },
  {
    id: 'penglai_5',
    name: '仙岛庇护',
    description: '上阵5张蓬莱卡牌，回合结束回复20%HP，全队防御+20%',
    faction: '蓬莱',
    requiredCount: 5,
    effects: { hp_regen_percent: 0.20, defense_percent: 0.20 },
  },
  // 蛮荒羁绊
  {
    id: 'manhuang_3',
    name: '蛮荒血统',
    description: '上阵3张蛮荒卡牌，全队攻击+20%',
    faction: '蛮荒',
    requiredCount: 3,
    effects: { attack_percent: 0.20 },
  },
  {
    id: 'manhuang_5',
    name: '兽族狂暴',
    description: '上阵5张蛮荒卡牌，全队攻击+35%，暴击率+15%',
    faction: '蛮荒',
    requiredCount: 5,
    effects: { attack_percent: 0.35, crit_rate: 0.15 },
  },
  // 万古羁绊
  {
    id: 'wangu_2',
    name: '万古之息',
    description: '上阵2张万古卡牌，全队所有属性+10%',
    faction: '万古',
    requiredCount: 2,
    effects: { all_stat_percent: 0.10 },
  },
  {
    id: 'wangu_3',
    name: '永恒存在',
    description: '上阵3张万古卡牌，全队所有属性+20%，免疫一次致命伤害',
    faction: '万古',
    requiredCount: 3,
    effects: { all_stat_percent: 0.20, death_immune: 1 },
  },
];

/**
 * 计算队伍羁绊加成
 */
router.post('/bonds/calculate', async (req, res) => {
  try {
    const { cardIds } = req.body;

    if (!cardIds || !Array.isArray(cardIds)) {
      res.status(400).json({ success: false, error: '无效的卡牌列表' });
      return;
    }

    // 获取卡牌信息
    const { data: cards, error } = await supabase
      .from('ink_cards')
      .select('*')
      .in('id', cardIds);

    if (error) throw error;

    // 统计各阵营数量
    const factionCounts: Record<string, number> = {};
    cards?.forEach((card: any) => {
      factionCounts[card.faction] = (factionCounts[card.faction] || 0) + 1;
    });

    // 计算触发的羁绊
    const activeBonds: any[] = [];
    BOND_CONFIG.forEach((bond) => {
      const count = factionCounts[bond.faction] || 0;
      if (count >= bond.requiredCount) {
        activeBonds.push({
          ...bond,
          currentCount: count,
        });
      }
    });

    // 计算总加成
    const totalEffects: Record<string, number> = {};
    activeBonds.forEach((bond) => {
      Object.entries(bond.effects).forEach(([key, value]) => {
        totalEffects[key] = (totalEffects[key] || 0) + (value as number);
      });
    });

    res.json({
      success: true,
      bonds: activeBonds,
      totalEffects,
      factionCounts,
    });
  } catch (error: any) {
    console.error('计算羁绊失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 进化系统 ====================

/**
 * 进化配置
 * 卡牌达到一定等级后可进化，提升属性和技能
 */
const EVOLUTION_CONFIG = {
  1: { name: '一阶', requiredLevel: 10, statBonus: 1.2, requiredCards: 2 },
  2: { name: '二阶', requiredLevel: 30, statBonus: 1.5, requiredCards: 3 },
  3: { name: '三阶', requiredLevel: 50, statBonus: 2.0, requiredCards: 5 },
  4: { name: '四阶', requiredLevel: 80, statBonus: 3.0, requiredCards: 8 },
  5: { name: '五阶', requiredLevel: 100, statBonus: 5.0, requiredCards: 10 },
};

/**
 * 进化卡牌
 */
router.post('/evolve', async (req, res) => {
  try {
    const { playerId, playerCardId } = req.body;

    // 获取玩家卡牌
    const { data: playerCard, error: pcError } = await supabase
      .from('ink_player_cards')
      .select('*, ink_cards(*)')
      .eq('id', playerCardId)
      .eq('player_id', playerId)
      .single();

    if (pcError || !playerCard) {
      res.status(404).json({ success: false, error: '卡牌不存在' });
      return;
    }

    const currentEvolution = playerCard.evolution || 0;
    const nextEvolution = currentEvolution + 1;

    // 检查进化配置
    const evolutionConfig = EVOLUTION_CONFIG[nextEvolution as keyof typeof EVOLUTION_CONFIG];
    if (!evolutionConfig) {
      res.status(400).json({ success: false, error: '已达最高进化等级' });
      return;
    }

    // 检查等级
    if ((playerCard.level || 1) < evolutionConfig.requiredLevel) {
      res.status(400).json({
        success: false,
        error: `需要达到${evolutionConfig.requiredLevel}级才能进化`,
      });
      return;
    }

    // 检查材料卡牌（同卡数量）
    const { data: sameCards, error: scError } = await supabase
      .from('ink_player_cards')
      .select('id')
      .eq('player_id', playerId)
      .eq('card_id', playerCard.card_id);

    if ((sameCards?.length || 0) < evolutionConfig.requiredCards) {
      res.status(400).json({
        success: false,
        error: `需要${evolutionConfig.requiredCards}张相同卡牌作为材料`,
      });
      return;
    }

    // 执行进化
    const { error: updateError } = await supabase
      .from('ink_player_cards')
      .update({
        evolution: nextEvolution,
        // 应用属性加成
        attack_bonus: (playerCard.attack_bonus || 0) * evolutionConfig.statBonus,
        defense_bonus: (playerCard.defense_bonus || 0) * evolutionConfig.statBonus,
        hp_bonus: (playerCard.hp_bonus || 0) * evolutionConfig.statBonus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', playerCardId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      evolution: nextEvolution,
      evolutionName: evolutionConfig.name,
      statBonus: evolutionConfig.statBonus,
    });
  } catch (error: any) {
    console.error('进化失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 装备系统 ====================

/**
 * 装备类型
 */
const EQUIPMENT_TYPES = {
  weapon: { name: '武器', slot: 'weapon', stat: 'attack' },
  armor: { name: '防具', slot: 'armor', stat: 'defense' },
  accessory: { name: '法宝', slot: 'accessory', stat: 'hp' },
};

/**
 * 获取装备列表
 */
router.get('/equipment', async (req, res) => {
  try {
    const { playerId } = req.query;

    const { data: equipment, error } = await supabase
      .from('ink_equipment')
      .select('*')
      .eq('player_id', playerId);

    if (error) throw error;

    res.json({ success: true, equipment: equipment || [] });
  } catch (error: any) {
    console.error('获取装备失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 装备穿戴
 */
router.post('/equip', async (req, res) => {
  try {
    const { playerId, playerCardId, equipmentId } = req.body;

    // 获取装备
    const { data: equipment, error: eqError } = await supabase
      .from('ink_equipment')
      .select('*')
      .eq('id', equipmentId)
      .eq('player_id', playerId)
      .single();

    if (eqError || !equipment) {
      res.status(404).json({ success: false, error: '装备不存在' });
      return;
    }

    // 获取玩家卡牌
    const { data: playerCard, error: pcError } = await supabase
      .from('ink_player_cards')
      .select('*')
      .eq('id', playerCardId)
      .eq('player_id', playerId)
      .single();

    if (pcError || !playerCard) {
      res.status(404).json({ success: false, error: '卡牌不存在' });
      return;
    }

    // 解除旧装备
    await supabase
      .from('ink_equipment')
      .update({ equipped_card_id: null })
      .eq('equipped_card_id', playerCardId)
      .eq('slot', equipment.slot);

    // 穿戴新装备
    const { error: updateError } = await supabase
      .from('ink_equipment')
      .update({ equipped_card_id: playerCardId })
      .eq('id', equipmentId);

    if (updateError) throw updateError;

    res.json({ success: true, equipment });
  } catch (error: any) {
    console.error('装备穿戴失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 副本系统 ====================

/**
 * 副本配置
 */
const DUNGEON_CONFIG = [
  {
    id: 'dungeon_1',
    name: '幽冥试炼',
    description: '探索幽冥边境，获取稀有材料',
    difficulty: 1,
    requiredLevel: 1,
    faction: '幽冥',
    stages: [
      { enemies: ['幽冥小鬼'], rewards: { gold: 100, exp: 50 } },
      { enemies: ['幽冥刺客'], rewards: { gold: 200, exp: 100 } },
      { enemies: ['幽冥剑主'], rewards: { gold: 500, exp: 300, card: '凡品' } },
    ],
  },
  {
    id: 'dungeon_2',
    name: '昆仑问道',
    description: '登昆仑仙山，寻找修仙之道',
    difficulty: 2,
    requiredLevel: 10,
    faction: '昆仑',
    stages: [
      { enemies: ['昆仑弟子'], rewards: { gold: 150, exp: 80 } },
      { enemies: ['云游真人'], rewards: { gold: 300, exp: 150 } },
      { enemies: ['昆仑剑仙'], rewards: { gold: 800, exp: 500, card: '灵品' } },
    ],
  },
  {
    id: 'dungeon_3',
    name: '蓬莱寻仙',
    description: '踏入蓬莱仙岛，寻觅长生不老',
    difficulty: 3,
    requiredLevel: 20,
    faction: '蓬莱',
    stages: [
      { enemies: ['蓬莱侍女'], rewards: { gold: 200, exp: 100 } },
      { enemies: ['花神'], rewards: { gold: 400, exp: 200 } },
      { enemies: ['蓬莱仙子'], rewards: { gold: 1000, exp: 600, card: '仙品' } },
    ],
  },
  {
    id: 'dungeon_4',
    name: '蛮荒征途',
    description: '深入蛮荒之地，征服狂野之魂',
    difficulty: 4,
    requiredLevel: 35,
    faction: '蛮荒',
    stages: [
      { enemies: ['蛮族勇士'], rewards: { gold: 300, exp: 150 } },
      { enemies: ['火焰巨兽'], rewards: { gold: 600, exp: 300 } },
      { enemies: ['蛮荒战神'], rewards: { gold: 1500, exp: 800, card: '圣品' } },
    ],
  },
  {
    id: 'dungeon_5',
    name: '万古长夜',
    description: '穿越万古时空，面对终极挑战',
    difficulty: 5,
    requiredLevel: 50,
    faction: '万古',
    stages: [
      { enemies: ['时空行者'], rewards: { gold: 500, exp: 250 } },
      { enemies: ['混沌主宰'], rewards: { gold: 1000, exp: 500 } },
      { enemies: ['万古至尊'], rewards: { gold: 3000, exp: 1500, card: '万古品' } },
    ],
  },
];

/**
 * 获取副本列表
 */
router.get('/dungeons', async (req, res) => {
  try {
    const { playerId } = req.query;

    // 获取玩家信息
    const { data: player } = await supabase
      .from('ink_players')
      .select('level')
      .eq('player_id', playerId)
      .single();

    const playerLevel = player?.level || 1;

    // 获取玩家副本进度
    const { data: progress } = await supabase
      .from('ink_dungeon_progress')
      .select('*')
      .eq('player_id', playerId);

    const progressMap = (progress || []).reduce((acc: any, p: any) => {
      acc[p.dungeon_id] = p;
      return acc;
    }, {});

    // 组装副本信息
    const dungeons = DUNGEON_CONFIG.map((dungeon) => ({
      ...dungeon,
      unlocked: playerLevel >= dungeon.requiredLevel,
      progress: progressMap[dungeon.id]?.current_stage || 0,
      completed: progressMap[dungeon.id]?.completed || false,
    }));

    res.json({ success: true, dungeons });
  } catch (error: any) {
    console.error('获取副本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 开始副本战斗
 */
router.post('/dungeon/start', async (req, res) => {
  try {
    const { playerId, dungeonId, cardIds } = req.body;

    const dungeon = DUNGEON_CONFIG.find((d) => d.id === dungeonId);
    if (!dungeon) {
      res.status(404).json({ success: false, error: '副本不存在' });
      return;
    }

    // 创建战斗
    const battleId = `dungeon_${dungeonId}_${Date.now()}`;
    
    // 保存战斗记录
    const { error } = await supabase.from('ink_battles').insert({
      id: battleId,
      player1_id: playerId,
      player2_id: null,
      status: 'playing',
      battle_log: {
        dungeon_id: dungeonId,
        stage: 0,
        player_cards: cardIds,
        current_hp: 100,
        turn: 1,
        logs: [],
      },
    });

    if (error) throw error;

    res.json({
      success: true,
      battleId,
      dungeon,
      enemy: dungeon.stages[0],
    });
  } catch (error: any) {
    console.error('开始副本失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
