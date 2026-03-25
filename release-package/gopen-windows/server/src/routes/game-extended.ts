/**
 * 游戏扩展API - 排行榜、竞技场、战盟、宠物、好友
 */

import express, { type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = express.Router();
const supabase = getSupabaseClient();

// ==================== 排行榜 ====================

/**
 * 获取排行榜
 * GET /api/v1/game/ranking/:type
 */
router.get('/ranking/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { limit = 50 } = req.query;
    
    let query;
    
    switch (type) {
      case 'power':
        // 战力排行
        query = supabase
          .from('game_users')
          .select('uid, nickname, level, vip, power, avatar')
          .order('power', { ascending: false })
          .limit(Number(limit));
        break;
        
      case 'arena':
        // 竞技场排行
        query = supabase
          .from('game_arena')
          .select('uid, rank, wins, losses, game_users(nickname, level, power)')
          .eq('season', getCurrentSeason())
          .order('rank', { ascending: false })
          .limit(Number(limit));
        break;
        
      case 'guild':
        // 战盟排行
        query = supabase
          .from('game_guilds')
          .select('guild_id, name, level, members_count, power, leader_uid')
          .order('power', { ascending: false })
          .limit(Number(limit));
        break;
        
      case 'chapter':
        // 章节进度排行
        query = supabase
          .from('game_users')
          .select('uid, nickname, level, chapter, power')
          .order('chapter', { ascending: false })
          .order('power', { ascending: false })
          .limit(Number(limit));
        break;
        
      default:
        return res.status(400).json({ error: '无效的排行榜类型' });
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // 添加排名
    const rankings = data?.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    res.json({
      success: true,
      type,
      rankings,
      updateTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// 获取当前赛季
function getCurrentSeason(): number {
  const now = new Date();
  return now.getFullYear() * 100 + now.getMonth() + 1;
}

// ==================== 竞技场 ====================

/**
 * 获取竞技场信息
 * GET /api/v1/game/arena/:uid
 */
router.get('/arena/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    const { data, error } = await supabase
      .from('game_arena')
      .select('*')
      .eq('uid', uid)
      .eq('season', getCurrentSeason())
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }
    
    // 获取排名
    const { count } = await supabase
      .from('game_arena')
      .select('*', { count: 'exact', head: true })
      .eq('season', getCurrentSeason())
      .gt('rank', data?.rank || 0);
    
    const rank = (count || 0) + 1;
    
    res.json({
      success: true,
      arena: {
        ...data,
        rank,
        totalPlayers: count || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 竞技场匹配对手
 * GET /api/v1/game/arena/:uid/match
 */
router.get('/arena/:uid/match', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    // 获取玩家当前积分
    const { data: playerData } = await supabase
      .from('game_arena')
      .select('rank')
      .eq('uid', uid)
      .eq('season', getCurrentSeason())
      .single();
    
    const playerRank = playerData?.rank || 1000;
    
    // 匹配积分相近的对手（±200分）
    const { data: opponents, error } = await supabase
      .from('game_users')
      .select('uid, nickname, level, power, avatar, game_arena(rank)')
      .neq('uid', uid)
      .limit(5);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // 过滤积分相近的对手
    const validOpponents = opponents?.filter((o: any) => {
      const oppRank = o.game_arena?.[0]?.rank || 1000;
      return Math.abs(oppRank - playerRank) <= 200;
    }).slice(0, 3);
    
    res.json({
      success: true,
      opponents: validOpponents || []
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 竞技场战斗结算
 * POST /api/v1/game/arena/battle
 */
router.post('/arena/battle', async (req: Request, res: Response) => {
  try {
    const { uid, opponentUid, isWin } = req.body;
    const season = getCurrentSeason();
    
    // 获取双方积分
    const { data: playerData } = await supabase
      .from('game_arena')
      .select('*')
      .eq('uid', uid)
      .eq('season', season)
      .single();
    
    const { data: opponentData } = await supabase
      .from('game_arena')
      .select('*')
      .eq('uid', opponentUid)
      .eq('season', season)
      .single();
    
    const playerRank = playerData?.rank || 1000;
    const opponentRank = opponentData?.rank || 1000;
    
    // 计算积分变化
    const K = 32; // ELO系数
    const expected = 1 / (1 + Math.pow(10, (opponentRank - playerRank) / 400));
    const actual = isWin ? 1 : 0;
    const rankChange = Math.round(K * (actual - expected));
    
    const newPlayerRank = Math.max(0, playerRank + rankChange);
    const newOpponentRank = Math.max(0, opponentRank - rankChange);
    
    // 更新玩家数据
    await supabase
      .from('game_arena')
      .upsert({
        uid,
        season,
        rank: newPlayerRank,
        wins: (playerData?.wins || 0) + (isWin ? 1 : 0),
        losses: (playerData?.losses || 0) + (isWin ? 0 : 1),
        streak: isWin ? (playerData?.streak || 0) + 1 : 0,
        best_rank: Math.max(playerData?.best_rank || 0, newPlayerRank),
        updated_at: new Date().toISOString()
      }, { onConflict: 'season,uid' });
    
    // 更新对手数据
    await supabase
      .from('game_arena')
      .upsert({
        uid: opponentUid,
        season,
        rank: newOpponentRank,
        wins: (opponentData?.wins || 0) + (isWin ? 0 : 1),
        losses: (opponentData?.losses || 0) + (isWin ? 1 : 0),
        streak: isWin ? 0 : (opponentData?.streak || 0),
        updated_at: new Date().toISOString()
      }, { onConflict: 'season,uid' });
    
    // 奖励计算
    const rewards = isWin ? {
      gold: 100 + Math.abs(rankChange) * 10,
      exp: 50 + Math.abs(rankChange) * 5
    } : {
      gold: 20,
      exp: 10
    };
    
    res.json({
      success: true,
      isWin,
      rankChange,
      newRank: newPlayerRank,
      rewards,
      streak: isWin ? (playerData?.streak || 0) + 1 : 0
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== 战盟 ====================

/**
 * 创建战盟
 * POST /api/v1/game/guild/create
 */
router.post('/guild/create', async (req: Request, res: Response) => {
  try {
    const { uid, name, icon } = req.body;
    
    // 检查是否已加入战盟
    const { data: existing } = await supabase
      .from('game_guild_members')
      .select('*')
      .eq('uid', uid)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: '您已加入战盟，请先退出' });
    }
    
    // 生成战盟ID
    const guildId = `guild_${Date.now()}`;
    
    // 创建战盟
    const { error: guildError } = await supabase
      .from('game_guilds')
      .insert({
        guild_id: guildId,
        name,
        leader_uid: uid,
        icon,
        created_at: new Date().toISOString()
      });
    
    if (guildError) {
      return res.status(500).json({ error: guildError.message });
    }
    
    // 添加盟主为成员
    await supabase
      .from('game_guild_members')
      .insert({
        guild_id: guildId,
        uid,
        role: 'leader',
        joined_at: new Date().toISOString()
      });
    
    // 扣除创建费用
    await supabase
      .from('game_users')
      .update({ gem: supabase.rpc('decrement', { amount: 500 }) })
      .eq('uid', uid);
    
    res.json({
      success: true,
      guild: {
        guild_id: guildId,
        name,
        leader_uid: uid
      }
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取战盟信息
 * GET /api/v1/game/guild/:guildId
 */
router.get('/guild/:guildId', async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    
    const { data: guild, error } = await supabase
      .from('game_guilds')
      .select(`
        *,
        members:game_guild_members(
          uid,
          role,
          contribution,
          joined_at,
          game_users(nickname, level, power, avatar)
        )
      `)
      .eq('guild_id', guildId)
      .single();
    
    if (error) {
      return res.status(404).json({ error: '战盟不存在' });
    }
    
    res.json({ success: true, guild });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 加入战盟
 * POST /api/v1/game/guild/join
 */
router.post('/guild/join', async (req: Request, res: Response) => {
  try {
    const { uid, guildId } = req.body;
    
    // 检查是否已加入
    const { data: existing } = await supabase
      .from('game_guild_members')
      .select('*')
      .eq('uid', uid)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: '您已加入战盟' });
    }
    
    // 检查战盟是否满员
    const { data: guild } = await supabase
      .from('game_guilds')
      .select('members_count, max_members')
      .eq('guild_id', guildId)
      .single();
    
    if (guild && guild.members_count >= guild.max_members) {
      return res.status(400).json({ error: '战盟已满员' });
    }
    
    // 加入战盟
    await supabase
      .from('game_guild_members')
      .insert({
        guild_id: guildId,
        uid,
        role: 'member',
        joined_at: new Date().toISOString()
      });
    
    // 更新成员数
    await supabase
      .from('game_guilds')
      .update({ members_count: (guild?.members_count || 0) + 1 })
      .eq('guild_id', guildId);
    
    res.json({ success: true, message: '加入成功' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== 宠物 ====================

/**
 * 获取宠物列表
 * GET /api/v1/game/pets/:uid
 */
router.get('/pets/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    const { data: pets, error } = await supabase
      .from('game_pets')
      .select('*')
      .eq('uid', uid);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, pets });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 喂养宠物
 * POST /api/v1/game/pets/feed
 */
router.post('/pets/feed', async (req: Request, res: Response) => {
  try {
    const { uid, petId, foodType } = req.body;
    
    // 食物效果配置
    const foodEffects: Record<string, { hunger: number; mood: number; cost: number }> = {
      common: { hunger: 20, mood: 5, cost: 100 },
      rare: { hunger: 50, mood: 20, cost: 500 },
      epic: { hunger: 100, mood: 50, cost: 2000 },
      legendary: { hunger: 200, mood: 100, cost: 10000 }
    };
    
    const effect = foodEffects[foodType] || foodEffects.common;
    
    // 检查金币
    const { data: user } = await supabase
      .from('game_users')
      .select('gold')
      .eq('uid', uid)
      .single();
    
    if (!user || user.gold < effect.cost) {
      return res.status(400).json({ error: '金币不足' });
    }
    
    // 扣除金币
    await supabase
      .from('game_users')
      .update({ gold: user.gold - effect.cost })
      .eq('uid', uid);
    
    // 更新宠物状态
    const { data: pet } = await supabase
      .from('game_pets')
      .select('*')
      .eq('uid', uid)
      .eq('pet_id', petId)
      .single();
    
    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }
    
    const newHunger = Math.min(200, pet.hunger + effect.hunger);
    const newMood = Math.min(200, pet.mood + effect.mood);
    const expGain = Math.floor(effect.cost / 100);
    const newExp = pet.exp + expGain;
    const levelUp = newExp >= pet.level * 100;
    
    await supabase
      .from('game_pets')
      .update({
        hunger: newHunger,
        mood: newMood,
        exp: levelUp ? newExp - pet.level * 100 : newExp,
        level: levelUp ? pet.level + 1 : pet.level,
        power: pet.power + (levelUp ? 100 : 0),
        last_feed: new Date().toISOString()
      })
      .eq('uid', uid)
      .eq('pet_id', petId);
    
    res.json({
      success: true,
      hunger: newHunger,
      mood: newMood,
      expGain,
      levelUp,
      newLevel: levelUp ? pet.level + 1 : pet.level
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== 好友 ====================

/**
 * 获取好友列表
 * GET /api/v1/game/friends/:uid
 */
router.get('/friends/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    const { data: friends, error } = await supabase
      .from('game_friends')
      .select(`
        friend_uid,
        intimacy,
        last_interact,
        game_users!game_friends_friend_uid_fkey(nickname, level, power, avatar, vip)
      `)
      .eq('uid', uid);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, friends });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 添加好友
 * POST /api/v1/game/friends/add
 */
router.post('/friends/add', async (req: Request, res: Response) => {
  try {
    const { uid, friendUid } = req.body;
    
    if (uid === friendUid) {
      return res.status(400).json({ error: '不能添加自己为好友' });
    }
    
    // 检查是否已是好友
    const { data: existing } = await supabase
      .from('game_friends')
      .select('*')
      .eq('uid', uid)
      .eq('friend_uid', friendUid)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: '已是好友' });
    }
    
    // 添加双向好友关系
    await supabase
      .from('game_friends')
      .insert([
        { uid, friend_uid: friendUid, created_at: new Date().toISOString() },
        { uid: friendUid, friend_uid: uid, created_at: new Date().toISOString() }
      ]);
    
    res.json({ success: true, message: '添加成功' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 赠送体力给好友
 * POST /api/v1/game/friends/gift
 */
router.post('/friends/gift', async (req: Request, res: Response) => {
  try {
    const { uid, friendUid } = req.body;
    
    // 检查今日是否已赠送
    const { data: friend } = await supabase
      .from('game_friends')
      .select('last_interact')
      .eq('uid', uid)
      .eq('friend_uid', friendUid)
      .single();
    
    const today = new Date().toDateString();
    if (friend?.last_interact && new Date(friend.last_interact).toDateString() === today) {
      return res.status(400).json({ error: '今日已赠送' });
    }
    
    // 更新亲密度和最后互动时间
    await supabase
      .from('game_friends')
      .update({
        intimacy: supabase.rpc('increment', { amount: 1 }),
        last_interact: new Date().toISOString()
      })
      .eq('uid', uid)
      .eq('friend_uid', friendUid);
    
    // 给好友加体力
    await supabase
      .from('game_users')
      .update({ energy: supabase.rpc('increment', { amount: 10 }) })
      .eq('uid', friendUid);
    
    res.json({ success: true, message: '赠送成功，好友获得10点体力' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== 关卡扫荡 ====================

/**
 * 一键扫荡关卡
 * POST /api/v1/game/stage/sweep
 */
router.post('/stage/sweep', async (req: Request, res: Response) => {
  try {
    const { uid, chapter, stage, usePower } = req.body;
    
    // 获取玩家数据
    const { data: user } = await supabase
      .from('game_users')
      .select('power, energy, chapter, gold, exp')
      .eq('uid', uid)
      .single();
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 检查关卡是否已通关
    const { data: stageRecord } = await supabase
      .from('game_stages')
      .select('*')
      .eq('uid', uid)
      .eq('chapter', chapter)
      .eq('stage', stage)
      .single();
    
    if (!stageRecord || stageRecord.stars === 0) {
      // 未通关，需要战力碾压
      const requiredPower = chapter * 1000 + stage * 100;
      
      if (user.power < requiredPower * 3) {
        return res.status(400).json({ 
          error: '战力不足，无法扫荡',
          required: requiredPower * 3,
          current: user.power
        });
      }
    }
    
    // 检查体力
    const energyCost = 6;
    if (user.energy < energyCost) {
      return res.status(400).json({ error: '体力不足' });
    }
    
    // 扣除体力
    await supabase
      .from('game_users')
      .update({ energy: user.energy - energyCost })
      .eq('uid', uid);
    
    // 计算奖励
    const baseGold = chapter * 100 + stage * 50;
    const baseExp = chapter * 20 + stage * 10;
    const goldReward = Math.floor(baseGold * (1 + Math.random()));
    const expReward = Math.floor(baseExp * (1 + Math.random() * 0.5));
    
    // 发放奖励
    await supabase
      .from('game_users')
      .update({
        gold: user.gold + goldReward,
        exp: user.exp + expReward
      })
      .eq('uid', uid);
    
    // 更新扫荡次数
    await supabase
      .from('game_stages')
      .upsert({
        uid,
        chapter,
        stage,
        sweep_count: (stageRecord?.sweep_count || 0) + 1,
        updated_at: new Date().toISOString()
      }, { onConflict: 'uid,chapter,stage' });
    
    res.json({
      success: true,
      rewards: {
        gold: goldReward,
        exp: expReward
      },
      energyLeft: user.energy - energyCost
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 批量扫荡
 * POST /api/v1/game/stage/sweep-batch
 */
router.post('/stage/sweep-batch', async (req: Request, res: Response) => {
  try {
    const { uid, chapter, count } = req.body;
    
    // 获取玩家数据
    const { data: user } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', uid)
      .single();
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 检查章节是否解锁
    if (user.chapter < chapter) {
      return res.status(400).json({ error: '章节未解锁' });
    }
    
    // 获取已通关关卡
    const { data: stages } = await supabase
      .from('game_stages')
      .select('*')
      .eq('uid', uid)
      .eq('chapter', chapter)
      .gt('stars', 0);
    
    if (!stages || stages.length === 0) {
      return res.status(400).json({ error: '没有可扫荡的关卡' });
    }
    
    // 计算总消耗和奖励
    const energyCost = 6 * count;
    if (user.energy < energyCost) {
      return res.status(400).json({ error: '体力不足' });
    }
    
    let totalGold = 0;
    let totalExp = 0;
    
    for (let i = 0; i < count; i++) {
      totalGold += Math.floor(chapter * 100 * (1 + Math.random()));
      totalExp += Math.floor(chapter * 20 * (1 + Math.random() * 0.5));
    }
    
    // 扣除体力和发放奖励
    await supabase
      .from('game_users')
      .update({
        energy: user.energy - energyCost,
        gold: user.gold + totalGold,
        exp: user.exp + totalExp
      })
      .eq('uid', uid);
    
    res.json({
      success: true,
      sweepCount: count,
      rewards: {
        gold: totalGold,
        exp: totalExp
      },
      energyLeft: user.energy - energyCost
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
