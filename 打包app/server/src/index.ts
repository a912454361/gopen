/**
 * 万古长夜 - 游戏后端服务
 */
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 6091;

// 中间件
app.use(cors());
app.use(express.json());

// 卡牌数据
const CARDS = [
  { id: 'ym001', name: '幽冥鬼将', faction: '幽冥', rarity: '仙品', attack: 85, defense: 60, hp: 120, skill: '鬼影突袭', cost: 4 },
  { id: 'ym002', name: '黄泉引路人', faction: '幽冥', rarity: '灵品', attack: 65, defense: 70, hp: 90, skill: '彼岸花开', cost: 3 },
  { id: 'ym003', name: '幽冥女皇', faction: '幽冥', rarity: '圣品', attack: 120, defense: 80, hp: 150, skill: '冥界降临', cost: 7 },
  { id: 'kl001', name: '昆仑剑仙', faction: '昆仑', rarity: '仙品', attack: 95, defense: 50, hp: 100, skill: '剑气纵横', cost: 4 },
  { id: 'kl002', name: '雪山圣女', faction: '昆仑', rarity: '灵品', attack: 70, defense: 75, hp: 85, skill: '冰封万里', cost: 3 },
  { id: 'kl003', name: '昆仑道祖', faction: '昆仑', rarity: '圣品', attack: 130, defense: 70, hp: 140, skill: '大道无形', cost: 7 },
  { id: 'pl001', name: '蓬莱仙子', faction: '蓬莱', rarity: '仙品', attack: 75, defense: 80, hp: 95, skill: '仙乐飘飘', cost: 4 },
  { id: 'pl002', name: '桃花妖', faction: '蓬莱', rarity: '灵品', attack: 55, defense: 65, hp: 80, skill: '花语祝福', cost: 2 },
  { id: 'pl003', name: '蓬莱岛主', faction: '蓬莱', rarity: '圣品', attack: 110, defense: 90, hp: 130, skill: '仙岛护佑', cost: 6 },
  { id: 'mh001', name: '蛮荒战神', faction: '蛮荒', rarity: '仙品', attack: 100, defense: 60, hp: 130, skill: '狂暴冲锋', cost: 5 },
  { id: 'mh002', name: '烈焰兽王', faction: '蛮荒', rarity: '灵品', attack: 80, defense: 55, hp: 110, skill: '烈焰焚天', cost: 3 },
  { id: 'mh003', name: '蛮荒始祖', faction: '蛮荒', rarity: '圣品', attack: 140, defense: 60, hp: 160, skill: '蛮荒之力', cost: 8 },
  { id: 'wg001', name: '万古金仙', faction: '万古', rarity: '仙品', attack: 90, defense: 85, hp: 110, skill: '金光普照', cost: 5 },
  { id: 'wg002', name: '星辰使者', faction: '万古', rarity: '灵品', attack: 60, defense: 70, hp: 90, skill: '星尘守护', cost: 3 },
  { id: 'wg003', name: '万古至尊', faction: '万古', rarity: '万古品', attack: 150, defense: 100, hp: 180, skill: '永恒之怒', cost: 10 },
];

// API路由
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'wangu-game-3d', version: '1.0.0' });
});

app.get('/api/v1/cards', (req, res) => {
  const { faction } = req.query;
  let cards = CARDS;
  if (faction) {
    cards = cards.filter(c => c.faction === faction);
  }
  res.json({ success: true, cards, total: cards.length });
});

app.get('/api/v1/cards/:id', (req, res) => {
  const card = CARDS.find(c => c.id === req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json({ success: true, card });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     万古长夜 - 3D粒子卡牌游戏                              ║
║                                                            ║
║     端口: ${PORT}                                          ║
║     版本: 1.0.0                                            ║
║                                                            ║
║     API: http://localhost:${PORT}/api/v1                   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
