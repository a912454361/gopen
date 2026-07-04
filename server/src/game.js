// 游戏系统 - SQLite本地版本
// 国风粒子卡牌游戏

import { all, one, run, uuid } from './storage/db.js';

// ========== 配置 ==========

const FACTIONS = {
  '幽冥': { name: '幽冥', colors: ['#1a1a2e', '#4a0080'], desc: '幽暗冥界，魂火飘渺' },
  '昆仑': { name: '昆仑', colors: ['#f0f8ff', '#4fc3f7'], desc: '雪白仙境，云海飘渺' },
  '蓬莱': { name: '蓬莱', colors: ['#fce4ec', '#f8bbd9'], desc: '桃花仙岛，芬芳四溢' },
  '蛮荒': { name: '蛮荒', colors: ['#3e2723', '#ff6f00'], desc: '荒野大地，火焰燃烧' },
  '万古': { name: '万古', colors: ['#1a1a1a', '#ffd700'], desc: '万古长夜，星光璀璨' }
};

const RARITIES = {
  '凡品': { stars: 1, mult: 1 },
  '灵品': { stars: 2, mult: 1.5 },
  '仙品': { stars: 3, mult: 2 },
  '圣品': { stars: 4, mult: 3 },
  '万古品': { stars: 5, mult: 5 }
};

const CARD_NAMES = {
  '幽冥': ['幽冥剑主', '魂火使者', '冥界判官', '幽影刺客', '鬼王'],
  '昆仑': ['昆仑剑仙', '云游真人', '天道行者', '剑圣', '玄天剑客'],
  '蓬莱': ['蓬莱仙子', '桃花仙尊', '药王', '花神', '瑶池仙女'],
  '蛮荒': ['蛮荒战神', '火焰巨兽', '部落首领', '狂战士', '兽王'],
  '万古': ['万古至尊', '永恒圣者', '时空行者', '天道化身', '混沌主宰']
};

// ========== 初始化游戏表 ==========

export const initGameTables = () => {
  // 卡牌表
  run(`CREATE TABLE IF NOT EXISTS game_cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    faction TEXT NOT NULL,
    rarity TEXT NOT NULL,
    attack INTEGER DEFAULT 10,
    defense INTEGER DEFAULT 5,
    hp INTEGER DEFAULT 100,
    cost INTEGER DEFAULT 1,
    skill_name TEXT,
    skill_desc TEXT,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  
  // 玩家表
  run(`CREATE TABLE IF NOT EXISTS game_players (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    nickname TEXT,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 1000,
    gems INTEGER DEFAULT 100,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  
  // 玩家卡牌表
  run(`CREATE TABLE IF NOT EXISTS game_player_cards (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    stars INTEGER DEFAULT 1,
    obtained_at TEXT DEFAULT (datetime('now'))
  )`);
  
  // 对战记录表
  run(`CREATE TABLE IF NOT EXISTS game_battles (
    id TEXT PRIMARY KEY,
    player1_id TEXT NOT NULL,
    player2_id TEXT,
    winner_id TEXT,
    status TEXT DEFAULT 'finished',
    turns INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  
  // 生成初始卡牌
  generateInitialCards();
  
  console.log('游戏系统已初始化');
};

// ========== 生成初始卡牌 ==========

const generateInitialCards = () => {
  const existing = one('SELECT COUNT(*) as count FROM game_cards');
  if (existing && existing.count > 0) return;
  
  const rarities = Object.keys(RARITIES);
  
  for (const faction of Object.keys(FACTIONS)) {
    const names = CARD_NAMES[faction];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const rarity = rarities[Math.min(i, rarities.length - 1)];
      const mult = RARITIES[rarity].mult;
      
      run(`INSERT INTO game_cards (id, name, faction, rarity, attack, defense, hp, cost, skill_name, skill_desc, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        uuid(),
        name,
        faction,
        rarity,
        Math.round(10 * mult + Math.random() * 10),
        Math.round(5 * mult + Math.random() * 5),
        Math.round(100 * mult + Math.random() * 50),
        Math.min(5, Math.ceil(RARITIES[rarity].stars * 0.8)),
        `${name}·绝技`,
        `发动强力攻击，造成伤害`,
        `https://picsum.photos/seed/${encodeURIComponent(name)}/512/768`
      ]);
    }
  }
  
  console.log('初始卡牌已生成');
};

// ========== 游戏API ==========

export const gameAPI = {
  // 获取所有卡牌
  getCards: (faction?: string, rarity?: string) => {
    let sql = 'SELECT * FROM game_cards WHERE 1=1';
    const params: any[] = [];
    if (faction) { sql += ' AND faction = ?'; params.push(faction); }
    if (rarity) { sql += ' AND rarity = ?'; params.push(rarity); }
    sql += ' ORDER BY rarity, faction';
    return all(sql, params);
  },
  
  // 获取单张卡牌
  getCard: (id: string) => one('SELECT * FROM game_cards WHERE id = ?', [id]),
  
  // 获取或创建玩家
  getPlayer: (userId: string) => {
    let player = one('SELECT * FROM game_players WHERE user_id = ?', [userId]);
    if (!player) {
      const id = uuid();
      run(`INSERT INTO game_players (id, user_id, nickname, gold, gems) VALUES (?, ?, ?, 1000, 100)`, 
        [id, userId, `修士${userId.slice(-4)}`]);
      player = one('SELECT * FROM game_players WHERE id = ?', [id]);
    }
    return player;
  },
  
  // 获取玩家卡牌
  getPlayerCards: (playerId: string) => {
    return all(`SELECT pc.*, c.name, c.faction, c.rarity, c.attack, c.defense, c.hp, c.cost, c.skill_name, c.skill_desc, c.image_url
      FROM game_player_cards pc
      JOIN game_cards c ON pc.card_id = c.id
      WHERE pc.player_id = ?`, [playerId]);
  },
  
  // 抽卡
  drawCards: (playerId: string, count: number = 1) => {
    const player = one('SELECT * FROM game_players WHERE id = ?', [playerId]);
    if (!player) return { error: '玩家不存在' };
    
    const cost = count * 100;
    if (player.gold < cost) return { error: '金币不足' };
    
    // 抽卡
    const allCards = all('SELECT * FROM game_cards');
    const drawnCards: any[] = [];
    
    for (let i = 0; i < count; i++) {
      // 稀有度概率
      const rand = Math.random();
      let targetRarity = '凡品';
      if (rand > 0.99) targetRarity = '万古品';
      else if (rand > 0.95) targetRarity = '圣品';
      else if (rand > 0.80) targetRarity = '仙品';
      else if (rand > 0.50) targetRarity = '灵品';
      
      let pool = allCards.filter(c => c.rarity === targetRarity);
      if (pool.length === 0) pool = allCards;
      
      const card = pool[Math.floor(Math.random() * pool.length)];
      if (card) {
        run(`INSERT INTO game_player_cards (id, player_id, card_id, level, stars) VALUES (?, ?, ?, 1, 1)`,
          [uuid(), playerId, card.id]);
        drawnCards.push(card);
      }
    }
    
    // 扣除金币
    run('UPDATE game_players SET gold = gold - ? WHERE id = ?', [cost, playerId]);
    
    return { cards: drawnCards, cost };
  },
  
  // 创建对战
  createBattle: (playerId: string, deckCards: string[]) => {
    const battleId = uuid();
    run(`INSERT INTO game_battles (id, player1_id, player2_id, status) VALUES (?, ?, 'AI', 'playing')`, 
      [battleId, playerId]);
    return { battleId, playerHp: 100, aiHp: 100, playerMana: 5, aiMana: 5, turn: 1 };
  },
  
  // 对战行动
  battleAction: (battleId: string, playerId: string, cardId: string, action: string) => {
    const card = one('SELECT * FROM game_cards WHERE id = ?', [cardId]);
    if (!card) return { error: '卡牌不存在' };
    
    const damage = card.attack + Math.floor(Math.random() * 10);
    return { damage, cardName: card.name, action };
  },
  
  // 结束对战
  endBattle: (battleId: string, playerId: string, won: boolean) => {
    run(`UPDATE game_battles SET status = 'finished', winner_id = ?, turns = 10 WHERE id = ?`,
      [won ? playerId : null, battleId]);
    
    if (won) {
      run('UPDATE game_players SET wins = wins + 1, gold = gold + 50 WHERE id = ?', [playerId]);
    } else {
      run('UPDATE game_players SET losses = losses + 1 WHERE id = ?', [playerId]);
    }
    
    return { won, reward: won ? 50 : 0 };
  },
  
  // 排行榜
  getRanking: () => {
    return all(`SELECT id, nickname, level, wins, losses, 
      CASE WHEN wins + losses > 0 THEN ROUND(wins * 100.0 / (wins + losses)) ELSE 0 END as win_rate
      FROM game_players ORDER BY wins DESC LIMIT 50`);
  },
  
  // 阵营信息
  getFactions: () => FACTIONS,
  
  // 稀有度信息
  getRarities: () => RARITIES
};
