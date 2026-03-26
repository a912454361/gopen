/**
 * 国风粒子卡牌游戏 API
 * AI指令型国风粒子动态卡牌游戏
 * 
 * 核心功能：
 * - AI全自动生成卡牌（水墨立绘 + 粒子特效配置）
 * - 策略卡牌对战
 * - 卡牌养成系统
 */

import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { ImageGenerationClient, LLMClient, Config } from 'coze-coding-dev-sdk';

const router = express.Router();
const supabase = getSupabaseClient();

// AI 客户端
let imageClient: ImageGenerationClient | null = null;
let llmClient: LLMClient | null = null;

const getImageClient = () => {
  if (!imageClient) {
    imageClient = new ImageGenerationClient(new Config(), {});
  }
  return imageClient;
};

const getLLMClient = () => {
  if (!llmClient) {
    llmClient = new LLMClient(new Config(), {});
  }
  return llmClient;
};

// ========== 阵营和品级配置 ==========

const FACTION_CONFIG: Record<string, { name: string; colors: string[]; particleStyle: string; bgStyle: string }> = {
  '幽冥': {
    name: '幽冥',
    colors: ['#1a1a2e', '#4a0080', '#2d1b4e'],
    particleStyle: '魂火粒子，幽紫魂火漂浮，冥界阴冷气息',
    bgStyle: '幽暗墨黑，紫色魂火漂浮，阴冷氛围'
  },
  '昆仑': {
    name: '昆仑',
    colors: ['#f0f8ff', '#4fc3f7', '#e1f5fe'],
    particleStyle: '青蓝流云粒子，仙气飘渺，雪白云雾',
    bgStyle: '雪白仙境，青蓝流云，高山云海'
  },
  '蓬莱': {
    name: '蓬莱',
    colors: ['#fce4ec', '#f8bbd9', '#e91e63'],
    particleStyle: '青粉花瓣粒子，桃花飘落，仙岛芬芳',
    bgStyle: '粉色桃花岛，花瓣飘落，仙境氛围'
  },
  '蛮荒': {
    name: '蛮荒',
    colors: ['#3e2723', '#8d6e63', '#ff6f00'],
    particleStyle: '赤焰粒子，火焰燃烧，蛮荒狂野',
    bgStyle: '荒野大地，赤焰燃烧，原始狂野'
  },
  '万古': {
    name: '万古',
    colors: ['#1a1a1a', '#ffd700', '#ffffff'],
    particleStyle: '金白星尘粒子，万古长夜，星光璀璨',
    bgStyle: '万古长夜，金白星尘，深邃星空'
  }
};

const RARITY_CONFIG: Record<string, { name: string; stars: number; statMultiplier: number; particleComplexity: number }> = {
  '凡品': { name: '凡品', stars: 1, statMultiplier: 1, particleComplexity: 1 },
  '灵品': { name: '灵品', stars: 2, statMultiplier: 1.5, particleComplexity: 2 },
  '仙品': { name: '仙品', stars: 3, statMultiplier: 2, particleComplexity: 3 },
  '圣品': { name: '圣品', stars: 4, statMultiplier: 3, particleComplexity: 4 },
  '万古品': { name: '万古品', stars: 5, statMultiplier: 5, particleComplexity: 5 }
};

const CARD_TYPE_CONFIG: Record<string, { name: string; baseStats: { attack: number; defense: number; hp: number } }> = {
  '角色': { name: '角色卡', baseStats: { attack: 10, defense: 5, hp: 100 } },
  '技能': { name: '技能卡', baseStats: { attack: 15, defense: 0, hp: 0 } },
  '场景': { name: '场景卡', baseStats: { attack: 0, defense: 10, hp: 50 } }
};

// ========== 卡牌名称生成模板 ==========

const CARD_NAMES: Record<string, Record<string, string[]>> = {
  '幽冥': {
    '角色': ['幽冥剑主', '魂火使者', '冥界判官', '幽影刺客', '鬼王', '幽冥战将', '死灵法师', '暗夜君王'],
    '技能': ['幽冥斩', '魂火燃烧', '鬼影缠身', '冥界之门', '死神凝视', '暗影突袭'],
    '场景': ['幽冥地狱', '鬼域深渊', '冥河之畔', '幽暗魔宫']
  },
  '昆仑': {
    '角色': ['昆仑剑仙', '云游真人', '天道行者', '仙门长老', '剑圣', '昆仑弟子', '玄天剑客', '青云子'],
    '技能': ['昆仑剑诀', '流云剑气', '仙鹤化形', '天雷降世', '冰心诀', '万剑归宗'],
    '场景': ['昆仑仙山', '云海仙境', '天池之巅', '剑阁仙洞']
  },
  '蓬莱': {
    '角色': ['蓬莱仙子', '桃花仙尊', '药王', '月宫仙子', '花神', '蓬莱尊者', '瑶池仙女', '灵医圣手'],
    '技能': ['治愈灵雨', '桃花幻境', '仙药回春', '花影迷踪', '灵愈术', '百花绽放'],
    '场景': ['蓬莱仙岛', '桃花仙境', '瑶池圣境', '灵药仙谷']
  },
  '蛮荒': {
    '角色': ['蛮荒战神', '火焰巨兽', '部落首领', '狂战士', '兽王', '荒原猎手', '火焰领主', '蛮族勇士'],
    '技能': ['蛮荒狂斩', '烈焰焚烧', '大地崩裂', '兽血沸腾', '野蛮冲撞', '火焰风暴'],
    '场景': ['蛮荒之地', '火焰山脉', '荒野战场', '兽族部落']
  },
  '万古': {
    '角色': ['万古至尊', '永恒圣者', '时空行者', '天道化身', '万古仙人', '混沌主宰', '元始天尊', '万古剑神'],
    '技能': ['万古一击', '时空裂隙', '天道审判', '混沌灭世', '永恒之光', '万古长夜'],
    '场景': ['万古虚空', '混沌世界', '时空长河', '天道圣殿']
  }
};

// ========== 粒子特效配置生成 ==========

const generateParticleConfig = (faction: string, rarity: string, cardType: string) => {
  const factionConfig = FACTION_CONFIG[faction];
  const rarityConfig = RARITY_CONFIG[rarity];
  const complexity = rarityConfig.particleComplexity;
  
  const baseConfig = {
    primaryColor: factionConfig.colors[0],
    secondaryColor: factionConfig.colors[1] || factionConfig.colors[0],
    particleCount: 50 * complexity,
    particleSize: { min: 2, max: 8 * complexity },
    speed: { min: 0.5, max: 2 * complexity },
    opacity: { min: 0.3, max: 0.9 },
    // 国风粒子形态
    shapes: ['水墨晕染', '云雾', '星尘', '花瓣', '剑气', '魂火'].slice(0, complexity),
    // 动画模式
    animations: {
      idle: '缓慢流动，水墨晕染',
      appear: '绽放扩散，粒子聚拢',
      attack: '爆发冲刺，剑气纵横',
      defeat: '消散融墨，魂飞魄散'
    },
    // 特效参数
    effects: {
      glow: complexity >= 3,
      trail: complexity >= 2,
      ripple: complexity >= 4,
      aura: complexity >= 5
    }
  };
  
  return baseConfig;
};

// ========== 卡牌数值生成 ==========

const generateCardStats = (rarity: string, cardType: string) => {
  const rarityConfig = RARITY_CONFIG[rarity];
  const typeConfig = CARD_TYPE_CONFIG[cardType];
  const multiplier = rarityConfig.statMultiplier;
  
  return {
    attack: Math.round(typeConfig.baseStats.attack * multiplier * (0.8 + Math.random() * 0.4)),
    defense: Math.round(typeConfig.baseStats.defense * multiplier * (0.8 + Math.random() * 0.4)),
    hp: Math.round(typeConfig.baseStats.hp * multiplier * (0.8 + Math.random() * 0.4)),
    cost: Math.min(5, Math.ceil(rarityConfig.stars * 0.8))
  };
};

// ========== AI 生成卡牌图像 ==========

const generateCardImage = async (name: string, faction: string, cardType: string, rarity: string): Promise<string> => {
  try {
    const factionConfig = FACTION_CONFIG[faction];
    
    // 构建国风水墨风格的图像提示词
    const prompt = `Chinese ink wash painting style, traditional guohua, ${cardType} card art, 
    ${name}, ${factionConfig.bgStyle}, 
    elegant brush strokes, flowing ink, traditional Chinese painting aesthetic,
    ${factionConfig.particleStyle},
    minimalist composition with negative space, 
    high quality, masterpiece, detailed, 4K`;
    
    const client = getImageClient();
    const result = await client.imageGeneration(prompt, {
      model: 'doubao-seedream-3-0-t2i-250415',
      width: 512,
      height: 768,
    });
    
    return result.images?.[0]?.url || '';
  } catch (error) {
    console.error('生成卡牌图像失败:', error);
    // 返回默认图片
    return `https://picsum.photos/seed/${encodeURIComponent(name)}/512/768`;
  }
};

// ========== API 路由 ==========

/**
 * 获取所有卡牌
 * GET /api/v1/ink/cards
 */
router.get('/cards', async (req, res) => {
  try {
    const { faction, rarity, type, limit = 50 } = req.query;
    
    let query = supabase
      .from('ink_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(Number(limit));
    
    if (faction) query = query.eq('faction', faction);
    if (rarity) query = query.eq('rarity', rarity);
    if (type) query = query.eq('card_type', type);
    
    const { data, error } = await query;
    
    if (error) return res.status(500).json({ error: error.message });
    
    res.json({ cards: data, total: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取单张卡牌
 * GET /api/v1/ink/cards/:id
 */
router.get('/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('ink_cards')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return res.status(404).json({ error: '卡牌不存在' });
    
    res.json({ card: data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * AI 生成新卡牌
 * POST /api/v1/ink/generate
 * Body: { faction, rarity, cardType, count? }
 */
router.post('/generate', async (req, res) => {
  try {
    const { faction, rarity, cardType, count = 1 } = req.body;
    
    // 验证参数
    if (!FACTION_CONFIG[faction]) return res.status(400).json({ error: '无效的阵营' });
    if (!RARITY_CONFIG[rarity]) return res.status(400).json({ error: '无效的品级' });
    if (!CARD_TYPE_CONFIG[cardType]) return res.status(400).json({ error: '无效的卡牌类型' });
    
    const generatedCards = [];
    const namePool = CARD_NAMES[faction]?.[cardType] || ['未知卡牌'];
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      // 随机选择名称
      const baseName = namePool[Math.floor(Math.random() * namePool.length)];
      const suffix = count > 1 ? `·${i + 1}` : '';
      const name = `${baseName}${suffix}`;
      
      // 生成数值
      const stats = generateCardStats(rarity, cardType);
      
      // 生成粒子配置
      const particleConfig = generateParticleConfig(faction, rarity, cardType);
      
      // 生成技能
      const skillName = `${name}·绝技`;
      const skillEffects = {
        '角色': { type: 'damage', value: stats.attack * 2, description: `造成${stats.attack * 2}点伤害` },
        '技能': { type: 'effect', value: stats.attack, description: `附加${stats.attack}点效果伤害` },
        '场景': { type: 'buff', value: stats.defense, description: `全场防御+${stats.defense}` }
      };
      
      // 生成卡牌图像
      const imageUrl = await generateCardImage(name, faction, cardType, rarity);
      
      // 插入数据库
      const { data: card, error } = await supabase
        .from('ink_cards')
        .insert({
          name,
          description: `${faction}${cardType}，${rarity}级别。${FACTION_CONFIG[faction].particleStyle}`,
          faction,
          rarity,
          card_type: cardType,
          ...stats,
          skill_name: skillName,
          skill_description: skillEffects[cardType as keyof typeof skillEffects].description,
          skill_effect: skillEffects[cardType as keyof typeof skillEffects],
          image_url: imageUrl,
          particle_config: particleConfig,
          keywords: [faction, rarity, cardType]
        })
        .select()
        .single();
      
      if (error) {
        console.error('插入卡牌失败:', error);
        continue;
      }
      
      generatedCards.push(card);
    }
    
    res.json({
      success: true,
      generated: generatedCards.length,
      cards: generatedCards
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 批量生成卡牌（极速制作）
 * POST /api/v1/ink/batch-generate
 * Body: { count?: number }
 */
router.post('/batch-generate', async (req, res) => {
  try {
    const { count = 20 } = req.body;
    const factions = Object.keys(FACTION_CONFIG);
    const rarities = Object.keys(RARITY_CONFIG);
    const cardTypes = Object.keys(CARD_TYPE_CONFIG);
    
    const generatedCards = [];
    
    // 批量生成，每个阵营每种类型至少一张
    for (const faction of factions) {
      for (const cardType of cardTypes) {
        // 根据卡牌类型选择合适的品级分布
        let selectedRarity: string;
        if (cardType === '角色') {
          selectedRarity = rarities[Math.floor(Math.random() * 3)]; // 凡灵仙
        } else if (cardType === '技能') {
          selectedRarity = rarities[Math.floor(Math.random() * 4)]; // 凡灵仙圣
        } else {
          selectedRarity = rarities[Math.floor(Math.random() * 2)]; // 凡灵
        }
        
        const namePool = CARD_NAMES[faction]?.[cardType] || ['未知卡牌'];
        const baseName = namePool[Math.floor(Math.random() * namePool.length)];
        const name = `${baseName}`;
        
        const stats = generateCardStats(selectedRarity, cardType);
        const particleConfig = generateParticleConfig(faction, selectedRarity, cardType);
        
        const skillEffects = {
          '角色': { type: 'damage', value: stats.attack * 2, description: `造成${stats.attack * 2}点伤害` },
          '技能': { type: 'effect', value: stats.attack, description: `附加${stats.attack}点效果伤害` },
          '场景': { type: 'buff', value: stats.defense, description: `全场防御+${stats.defense}` }
        };
        
        const imageUrl = await generateCardImage(name, faction, cardType, selectedRarity);
        
        const { data: card, error } = await supabase
          .from('ink_cards')
          .insert({
            name,
            description: `${faction}${cardType}，${selectedRarity}级别。${FACTION_CONFIG[faction].particleStyle}`,
            faction,
            rarity: selectedRarity,
            card_type: cardType,
            ...stats,
            skill_name: `${name}·绝技`,
            skill_description: skillEffects[cardType as keyof typeof skillEffects].description,
            skill_effect: skillEffects[cardType as keyof typeof skillEffects],
            image_url: imageUrl,
            particle_config: particleConfig,
            keywords: [faction, selectedRarity, cardType]
          })
          .select()
          .single();
        
        if (!error && card) {
          generatedCards.push(card);
        }
        
        if (generatedCards.length >= count) break;
      }
      if (generatedCards.length >= count) break;
    }
    
    res.json({
      success: true,
      generated: generatedCards.length,
      cards: generatedCards
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ========== 玩家系统 ==========

/**
 * 获取/创建玩家
 * GET /api/v1/ink/player/:playerId
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    let { data: player, error } = await supabase
      .from('ink_players')
      .select('*')
      .eq('player_id', playerId)
      .single();
    
    if (!player) {
      // 创建新玩家
      const { data: newPlayer, error: createError } = await supabase
        .from('ink_players')
        .insert({
          player_id: playerId,
          nickname: `修士${playerId.slice(-4)}`,
          gold: 1000,
          gems: 100,
          energy: 100
        })
        .select()
        .single();
      
      if (createError) return res.status(500).json({ error: createError.message });
      player = newPlayer;
      
      // 给新玩家发初始卡牌
      await supabase
        .from('ink_player_cards')
        .insert([
          { player_id: playerId, card_id: null, level: 1, stars: 1 }
        ]);
    }
    
    // 获取玩家卡牌
    const { data: playerCards } = await supabase
      .from('ink_player_cards')
      .select('*, ink_cards(*)')
      .eq('player_id', playerId);
    
    res.json({ player, cards: playerCards });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 抽卡
 * POST /api/v1/ink/draw
 * Body: { playerId, count?: number, faction? }
 */
router.post('/draw', async (req, res) => {
  try {
    const { playerId, count = 1, faction } = req.body;
    
    // 获取玩家资源
    const { data: player } = await supabase
      .from('ink_players')
      .select('*')
      .eq('player_id', playerId)
      .single();
    
    if (!player) return res.status(404).json({ error: '玩家不存在' });
    
    const cost = count * 100; // 每抽100金币
    if (player.gold < cost) {
      return res.status(400).json({ error: '金币不足' });
    }
    
    // 随机获取卡牌
    let query = supabase.from('ink_cards').select('*').eq('is_active', true);
    if (faction) query = query.eq('faction', faction);
    
    const { data: allCards } = await query;
    if (!allCards || allCards.length === 0) {
      return res.status(400).json({ error: '没有可抽的卡牌' });
    }
    
    // 抽卡逻辑（品级权重）
    const drawCards = [];
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let targetRarity: string;
      if (rand < 0.5) targetRarity = '凡品';
      else if (rand < 0.8) targetRarity = '灵品';
      else if (rand < 0.95) targetRarity = '仙品';
      else if (rand < 0.99) targetRarity = '圣品';
      else targetRarity = '万古品';
      
      const rarityCards = allCards.filter(c => c.rarity === targetRarity);
      const cardPool = rarityCards.length > 0 ? rarityCards : allCards;
      const selectedCard = cardPool[Math.floor(Math.random() * cardPool.length)];
      
      if (selectedCard) {
        // 添加到玩家卡牌
        await supabase
          .from('ink_player_cards')
          .insert({
            player_id: playerId,
            card_id: selectedCard.id,
            level: 1,
            stars: 1
          });
        
        drawCards.push(selectedCard);
      }
    }
    
    // 扣除金币
    await supabase
      .from('ink_players')
      .update({ gold: player.gold - cost })
      .eq('player_id', playerId);
    
    res.json({
      success: true,
      cards: drawCards,
      cost
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ========== 对战系统 ==========

/**
 * 创建对战
 * POST /api/v1/ink/battle/create
 * Body: { playerId, deckId?, isAi?: boolean }
 */
router.post('/battle/create', async (req, res) => {
  try {
    const { playerId, deckId, isAi = true } = req.body;
    
    // 获取玩家卡组
    let deckCards: any[] = [];
    if (deckId) {
      const { data: deck } = await supabase
        .from('ink_decks')
        .select('*, ink_cards(*)')
        .eq('id', deckId)
        .single();
      deckCards = deck?.cards || [];
    } else {
      // 使用玩家所有卡牌
      const { data: playerCards } = await supabase
        .from('ink_player_cards')
        .select('*, ink_cards(*)')
        .eq('player_id', playerId)
        .limit(15);
      deckCards = playerCards?.map(pc => pc.ink_cards).filter(Boolean) || [];
    }
    
    if (deckCards.length < 5) {
      return res.status(400).json({ error: '卡组卡牌不足，至少需要5张' });
    }
    
    // 创建对战
    const { data: battle, error } = await supabase
      .from('ink_battles')
      .insert({
        player1_id: playerId,
        player1_deck_id: deckId,
        status: 'playing',
        battle_log: {
          player1_hp: 100,
          player2_hp: 100,
          player1_mana: 5,
          player2_mana: 5,
          turn: 1,
          current_player: 1,
          logs: []
        }
      })
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    
    // 更新玩家当前对战
    await supabase
      .from('ink_players')
      .update({ current_battle_id: battle.id })
      .eq('player_id', playerId);
    
    res.json({
      battle,
      playerDeck: deckCards
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 对战操作
 * POST /api/v1/ink/battle/action
 * Body: { battleId, playerId, action, cardId?, targetId? }
 */
router.post('/battle/action', async (req, res) => {
  try {
    const { battleId, playerId, action, cardId, targetId } = req.body;
    
    // 获取对战数据
    const { data: battle } = await supabase
      .from('ink_battles')
      .select('*')
      .eq('id', battleId)
      .single();
    
    if (!battle || battle.status !== 'playing') {
      return res.status(400).json({ error: '对战不存在或已结束' });
    }
    
    const log = battle.battle_log as any;
    let damage = 0;
    let logEntry = '';
    
    if (action === 'attack' && cardId) {
      // 获取卡牌
      const { data: card } = await supabase
        .from('ink_cards')
        .select('*')
        .eq('id', cardId)
        .single();
      
      if (!card) return res.status(400).json({ error: '卡牌不存在' });
      
      // 计算伤害
      damage = card.attack + Math.floor(Math.random() * 10);
      
      if (battle.player1_id === playerId) {
        log.player2_hp = Math.max(0, log.player2_hp - damage);
        logEntry = `你的【${card.name}】发动攻击，造成${damage}点伤害！`;
      } else {
        log.player1_hp = Math.max(0, log.player1_hp - damage);
        logEntry = `对方【${card.name}】发动攻击，造成${damage}点伤害！`;
      }
      
      log.logs.push({ turn: log.turn, action: 'attack', card: card.name, damage, log: logEntry });
      
      // 消耗法力
      if (battle.player1_id === playerId) {
        log.player1_mana = Math.max(0, log.player1_mana - 1);
      } else {
        log.player2_mana = Math.max(0, log.player2_mana - 1);
      }
    }
    
    if (action === 'skill' && cardId) {
      const { data: card } = await supabase
        .from('ink_cards')
        .select('*')
        .eq('id', cardId)
        .single();
      
      if (!card || !card.skill_effect) return res.status(400).json({ error: '技能无效' });
      
      const effect = card.skill_effect as any;
      damage = effect.value || card.attack;
      
      if (battle.player1_id === playerId) {
        if (effect.type === 'damage') {
          log.player2_hp = Math.max(0, log.player2_hp - damage);
          logEntry = `你的【${card.name}】释放【${card.skill_name}】，造成${damage}点伤害！`;
        } else if (effect.type === 'buff') {
          log.player1_hp = Math.min(100, log.player1_hp + damage);
          logEntry = `你的【${card.name}】释放【${card.skill_name}】，恢复${damage}点生命！`;
        }
      } else {
        if (effect.type === 'damage') {
          log.player1_hp = Math.max(0, log.player1_hp - damage);
          logEntry = `对方【${card.name}】释放【${card.skill_name}】，造成${damage}点伤害！`;
        }
      }
      
      log.logs.push({ turn: log.turn, action: 'skill', card: card.name, effect: effect.type, damage, log: logEntry });
    }
    
    // 切换回合
    log.turn += 1;
    log.player1_mana = Math.min(10, log.player1_mana + 1);
    log.player2_mana = Math.min(10, log.player2_mana + 1);
    
    // 检查胜负
    let winner = null;
    if (log.player1_hp <= 0) {
      winner = battle.player2_id || 'AI';
      battle.status = 'finished';
    } else if (log.player2_hp <= 0) {
      winner = battle.player1_id;
      battle.status = 'finished';
    }
    
    // 更新对战
    await supabase
      .from('ink_battles')
      .update({
        battle_log: log,
        status: battle.status,
        winner_id: winner,
        turns: log.turn,
        finished_at: battle.status === 'finished' ? new Date().toISOString() : null
      })
      .eq('id', battleId);
    
    // 更新玩家战绩
    if (winner) {
      await supabase
        .from('ink_players')
        .update({
          wins: winner === playerId ? 1 : 0,
          losses: winner !== playerId ? 1 : 0,
          current_battle_id: null
        })
        .eq('player_id', playerId);
    }
    
    res.json({
      success: true,
      battle: {
        ...battle,
        battle_log: log,
        winner_id: winner
      },
      action: { damage, log: logEntry }
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取对战状态
 * GET /api/v1/ink/battle/:battleId
 */
router.get('/battle/:battleId', async (req, res) => {
  try {
    const { battleId } = req.params;
    
    const { data: battle, error } = await supabase
      .from('ink_battles')
      .select('*')
      .eq('id', battleId)
      .single();
    
    if (error) return res.status(404).json({ error: '对战不存在' });
    
    res.json({ battle });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 排行榜
 * GET /api/v1/ink/ranking
 */
router.get('/ranking', async (req, res) => {
  try {
    const { type = 'wins' } = req.query;
    
    const { data, error } = await supabase
      .from('ink_players')
      .select('player_id, nickname, level, wins, losses')
      .order(type as string, { ascending: false })
      .limit(50);
    
    if (error) return res.status(500).json({ error: error.message });
    
    // 计算胜率
    const ranking = data?.map((p, index) => ({
      rank: index + 1,
      ...p,
      winRate: p.wins + p.losses > 0 ? Math.round(p.wins / (p.wins + p.losses) * 100) : 0
    }));
    
    res.json({ ranking });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
