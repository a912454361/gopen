/**
 * 万古长夜 - 独立游戏平台后端
 * 支持云游戏、卡牌管理、对战系统、充值系统
 */

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 6091;

// CORS配置
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Player-Id'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== 健康检查 ====================
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'wangu-game', version: '1.0.0' });
});

// ==================== 玩家系统 ====================

// 玩家数据存储 (生产环境应使用数据库)
const players: Map<string, any> = new Map();

// 获取/创建玩家
app.get('/api/v1/player/:playerId', async (req: Request, res: Response) => {
  const { playerId } = req.params;
  
  if (!players.has(playerId)) {
    // 创建新玩家
    players.set(playerId, {
      id: playerId,
      nickname: `修士${playerId.slice(-4)}`,
      level: 1,
      exp: 0,
      gold: 10000,      // 金币
      gems: 100,        // 宝石
      vouchers: 10000,  // 代金券
      wins: 0,
      losses: 0,
      cards: [],
      deck: [],
      faction: null,
      createdAt: new Date().toISOString(),
    });
  }
  
  res.json({ success: true, player: players.get(playerId) });
});

// 更新玩家信息
app.put('/api/v1/player/:playerId', async (req: Request, res: Response) => {
  const { playerId } = req.params;
  const updates = req.body;
  
  const player = players.get(playerId);
  if (!player) {
    return res.status(404).json({ error: '玩家不存在' });
  }
  
  players.set(playerId, { ...player, ...updates, updatedAt: new Date().toISOString() });
  res.json({ success: true, player: players.get(playerId) });
});

// ==================== 卡牌系统 ====================

// 卡牌数据库
const CARD_DATABASE = [
  // 幽冥阵营
  { id: 'ym001', name: '幽冥鬼将', faction: '幽冥', rarity: '仙品', attack: 85, defense: 60, hp: 120, skill: '鬼影突袭', cost: 4 },
  { id: 'ym002', name: '黄泉引路人', faction: '幽冥', rarity: '灵品', attack: 65, defense: 70, hp: 90, skill: '彼岸花开', cost: 3 },
  { id: 'ym003', name: '幽冥女皇', faction: '幽冥', rarity: '圣品', attack: 120, defense: 80, hp: 150, skill: '冥界降临', cost: 7 },
  
  // 昆仑阵营
  { id: 'kl001', name: '昆仑剑仙', faction: '昆仑', rarity: '仙品', attack: 95, defense: 50, hp: 100, skill: '剑气纵横', cost: 4 },
  { id: 'kl002', name: '雪山圣女', faction: '昆仑', rarity: '灵品', attack: 70, defense: 75, hp: 85, skill: '冰封万里', cost: 3 },
  { id: 'kl003', name: '昆仑道祖', faction: '昆仑', rarity: '圣品', attack: 130, defense: 70, hp: 140, skill: '大道无形', cost: 7 },
  
  // 蓬莱阵营
  { id: 'pl001', name: '蓬莱仙子', faction: '蓬莱', rarity: '仙品', attack: 75, defense: 80, hp: 95, skill: '仙乐飘飘', cost: 4 },
  { id: 'pl002', name: '桃花妖', faction: '蓬莱', rarity: '灵品', attack: 55, defense: 65, hp: 80, skill: '花语祝福', cost: 2 },
  { id: 'pl003', name: '蓬莱岛主', faction: '蓬莱', rarity: '圣品', attack: 110, defense: 90, hp: 130, skill: '仙岛护佑', cost: 6 },
  
  // 蛮荒阵营
  { id: 'mh001', name: '蛮荒战神', faction: '蛮荒', rarity: '仙品', attack: 100, defense: 60, hp: 130, skill: '狂暴冲锋', cost: 5 },
  { id: 'mh002', name: '烈焰兽王', faction: '蛮荒', rarity: '灵品', attack: 80, defense: 55, hp: 110, skill: '烈焰焚天', cost: 3 },
  { id: 'mh003', name: '蛮荒始祖', faction: '蛮荒', rarity: '圣品', attack: 140, defense: 60, hp: 160, skill: '蛮荒之力', cost: 8 },
  
  // 万古阵营
  { id: 'wg001', name: '万古金仙', faction: '万古', rarity: '仙品', attack: 90, defense: 85, hp: 110, skill: '金光普照', cost: 5 },
  { id: 'wg002', name: '星辰使者', faction: '万古', rarity: '灵品', attack: 60, defense: 70, hp: 90, skill: '星尘守护', cost: 3 },
  { id: 'wg003', name: '万古至尊', faction: '万古', rarity: '万古品', attack: 150, defense: 100, hp: 180, skill: '永恒之怒', cost: 10 },
];

// 获取所有卡牌
app.get('/api/v1/cards', async (req: Request, res: Response) => {
  const { faction, rarity, limit = 50 } = req.query;
  
  let cards = [...CARD_DATABASE];
  
  if (faction) {
    cards = cards.filter(c => c.faction === faction);
  }
  if (rarity) {
    cards = cards.filter(c => c.rarity === rarity);
  }
  
  res.json({ success: true, cards: cards.slice(0, Number(limit)), total: cards.length });
});

// 抽卡
app.post('/api/v1/cards/draw', async (req: Request, res: Response) => {
  const { playerId, count = 1, type = 'normal' } = req.body;
  
  const player = players.get(playerId);
  if (!player) {
    return res.status(404).json({ error: '玩家不存在' });
  }
  
  // 抽卡消耗
  const cost = type === 'premium' ? 100 : 10; // 宝石
  if (player.gems < cost * count) {
    return res.status(400).json({ error: '宝石不足' });
  }
  
  // 随机抽卡
  const drawnCards = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * CARD_DATABASE.length);
    const card = { ...CARD_DATABASE[randomIndex], instanceId: `card_${Date.now()}_${i}` };
    drawnCards.push(card);
    player.cards.push(card);
  }
  
  player.gems -= cost * count;
  players.set(playerId, player);
  
  res.json({ 
    success: true, 
    cards: drawnCards,
    remainingGems: player.gems 
  });
});

// ==================== 对战系统 ====================

const battleQueue: any[] = [];
const activeBattles: Map<string, any> = new Map();

// 匹配对战
app.post('/api/v1/battle/match', async (req: Request, res: Response) => {
  const { playerId, deck } = req.body;
  
  const player = players.get(playerId);
  if (!player) {
    return res.status(404).json({ error: '玩家不存在' });
  }
  
  // 加入匹配队列
  const queueEntry = {
    playerId,
    player,
    deck,
    joinedAt: Date.now(),
  };
  
  // 检查是否有等待中的对手
  const opponent = battleQueue.find(e => e.playerId !== playerId);
  
  if (opponent) {
    // 开始对战
    const battleId = `battle_${Date.now()}`;
    const battle = {
      id: battleId,
      player1: { ...queueEntry, hp: 30 },
      player2: { ...opponent, hp: 30 },
      turn: 1,
      currentPlayer: playerId,
      status: 'active',
      startedAt: Date.now(),
    };
    
    activeBattles.set(battleId, battle);
    
    // 从队列移除
    const opponentIndex = battleQueue.findIndex(e => e.playerId === opponent.playerId);
    if (opponentIndex > -1) {
      battleQueue.splice(opponentIndex, 1);
    }
    
    res.json({ success: true, battle, status: 'matched' });
  } else {
    // 加入队列等待
    battleQueue.push(queueEntry);
    res.json({ success: true, status: 'waiting', message: '正在匹配对手...' });
  }
});

// 获取对战状态
app.get('/api/v1/battle/:battleId', async (req: Request, res: Response) => {
  const { battleId } = req.params;
  
  const battle = activeBattles.get(battleId);
  if (!battle) {
    return res.status(404).json({ error: '对战不存在' });
  }
  
  res.json({ success: true, battle });
});

// 出牌
app.post('/api/v1/battle/:battleId/play', async (req: Request, res: Response) => {
  const { battleId } = req.params;
  const { playerId, cardId, targetId } = req.body;
  
  const battle = activeBattles.get(battleId);
  if (!battle) {
    return res.status(404).json({ error: '对战不存在' });
  }
  
  // 简化战斗逻辑
  const isPlayer1 = battle.player1.playerId === playerId;
  const attacker = isPlayer1 ? battle.player1 : battle.player2;
  const defender = isPlayer1 ? battle.player2 : battle.player1;
  
  // 找到卡牌
  const card = attacker.deck.find((c: any) => c.id === cardId);
  if (!card) {
    return res.status(400).json({ error: '卡牌不在牌组中' });
  }
  
  // 造成伤害
  const damage = Math.max(card.attack - 10, 10);
  defender.hp -= Math.floor(damage / 10);
  
  // 判断胜负
  if (defender.hp <= 0) {
    battle.status = 'finished';
    battle.winner = playerId;
    
    // 更新玩家战绩
    const winner = players.get(playerId);
    const loser = players.get(defender.playerId);
    if (winner) {
      winner.wins++;
      winner.gold += 100;
      players.set(playerId, winner);
    }
    if (loser) {
      loser.losses++;
      players.set(defender.playerId, loser);
    }
  }
  
  battle.turn++;
  battle.currentPlayer = defender.playerId;
  activeBattles.set(battleId, battle);
  
  res.json({ success: true, battle, damage });
});

// ==================== 充值系统 ====================

// 充值套餐
const RECHARGE_PACKAGES = [
  { id: 'r1', name: '初级礼包', gold: 1000, gems: 10, price: 6, originalPrice: 60, discount: '0.05折' },
  { id: 'r2', name: '中级礼包', gold: 5000, gems: 50, price: 30, originalPrice: 300, discount: '0.05折' },
  { id: 'r3', name: '高级礼包', gold: 20000, gems: 200, price: 100, originalPrice: 1000, discount: '0.05折' },
  { id: 'r4', name: '至尊礼包', gold: 100000, gems: 1000, price: 500, originalPrice: 5000, discount: '0.05折' },
];

// 获取充值套餐
app.get('/api/v1/recharge/packages', async (req: Request, res: Response) => {
  res.json({ success: true, packages: RECHARGE_PACKAGES });
});

// 处理充值
app.post('/api/v1/recharge/process', async (req: Request, res: Response) => {
  const { playerId, packageId, paymentMethod } = req.body;
  
  const player = players.get(playerId);
  if (!player) {
    return res.status(404).json({ error: '玩家不存在' });
  }
  
  const pkg = RECHARGE_PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    return res.status(400).json({ error: '套餐不存在' });
  }
  
  // 模拟支付成功
  player.gold += pkg.gold;
  player.gems += pkg.gems;
  players.set(playerId, player);
  
  res.json({ 
    success: true, 
    message: '充值成功',
    gold: pkg.gold,
    gems: pkg.gems,
    currentGold: player.gold,
    currentGems: player.gems,
  });
});

// ==================== 云游戏系统 ====================

// 云游戏服务器状态
const cloudGameServers = [
  { id: 'cg1', region: '华东', status: 'available', latency: 15, load: 0.3 },
  { id: 'cg2', region: '华南', status: 'available', latency: 20, load: 0.5 },
  { id: 'cg3', region: '华北', status: 'available', latency: 18, load: 0.4 },
];

// 获取云游戏服务器
app.get('/api/v1/cloud/servers', async (req: Request, res: Response) => {
  res.json({ success: true, servers: cloudGameServers });
});

// 分配云游戏服务器
app.post('/api/v1/cloud/allocate', async (req: Request, res: Response) => {
  const { playerId, gameId, quality } = req.body;
  
  // 选择负载最低的服务器
  const server = cloudGameServers.reduce((best, s) => 
    s.load < best.load ? s : best
  );
  
  const sessionId = `session_${Date.now()}_${playerId}`;
  
  res.json({ 
    success: true, 
    session: {
      id: sessionId,
      server: server.id,
      region: server.region,
      wsUrl: `wss://cloud.wangu.game/${sessionId}`,
      token: `token_${Date.now()}`,
      expiresAt: Date.now() + 3600000, // 1小时
    }
  });
});

// ==================== 启动服务 ====================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     万古长夜 - 独立游戏平台后端服务                        ║
║                                                            ║
║     端口: ${PORT}                                          ║
║     版本: 1.0.0                                            ║
║                                                            ║
║     API: http://localhost:${PORT}/api/v1                   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
