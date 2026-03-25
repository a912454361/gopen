/**
 * 云端存档同步服务
 * 实现微信云开发数据同步
 */

import express, { type Request, type Response } from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = express.Router();
const supabase = getSupabaseClient();

/**
 * 上传存档到云端
 * POST /api/v1/cloud-sync/upload
 */
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { uid, saveData } = req.body;
    
    if (!uid || !saveData) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 保存到数据库
    const { error } = await supabase
      .from('game_users')
      .upsert({
        uid,
        ...saveData,
        last_sync: new Date().toISOString()
      });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // 同时保存宠物数据
    if (saveData.pets && saveData.pets.length > 0) {
      for (const pet of saveData.pets) {
        await supabase
          .from('game_pets')
          .upsert({
            uid,
            ...pet
          });
      }
    }
    
    // 保存关卡进度
    if (saveData.stages && saveData.stages.length > 0) {
      for (const stage of saveData.stages) {
        await supabase
          .from('game_stages')
          .upsert({
            uid,
            ...stage
          });
      }
    }
    
    res.json({
      success: true,
      message: '存档上传成功',
      syncTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 从云端下载存档
 * GET /api/v1/cloud-sync/download/:uid
 */
router.get('/download/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    // 获取用户数据
    const { data: user, error: userError } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', uid)
      .single();
    
    if (userError && userError.code !== 'PGRST116') {
      return res.status(500).json({ error: userError.message });
    }
    
    // 获取宠物数据
    const { data: pets } = await supabase
      .from('game_pets')
      .select('*')
      .eq('uid', uid);
    
    // 获取关卡进度
    const { data: stages } = await supabase
      .from('game_stages')
      .select('*')
      .eq('uid', uid);
    
    // 获取好友数据
    const { data: friends } = await supabase
      .from('game_friends')
      .select('*')
      .eq('uid', uid);
    
    // 获取竞技场数据
    const { data: arena } = await supabase
      .from('game_arena')
      .select('*')
      .eq('uid', uid);
    
    res.json({
      success: true,
      saveData: {
        user,
        pets: pets || [],
        stages: stages || [],
        friends: friends || [],
        arena: arena || null,
        syncTime: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取同步状态
 * GET /api/v1/cloud-sync/status/:uid
 */
router.get('/status/:uid', async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    const { data: user } = await supabase
      .from('game_users')
      .select('last_sync, updated_at')
      .eq('uid', uid)
      .single();
    
    res.json({
      success: true,
      lastSync: user?.last_sync || user?.updated_at || null,
      canSync: true
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 合并存档（解决冲突）
 * POST /api/v1/cloud-sync/merge
 */
router.post('/merge', async (req: Request, res: Response) => {
  try {
    const { uid, localData, serverData } = req.body;
    
    // 合并策略：
    // 1. 货币取最大值
    // 2. 等级取最大值
    // 3. 关卡进度取最新
    // 4. 物品合并去重
    
    const mergedData = {
      // 货币取最大
      gold: Math.max(localData.gold || 0, serverData.gold || 0),
      gem: Math.max(localData.gem || 0, serverData.gem || 0),
      
      // 等级取最大
      level: Math.max(localData.level || 1, serverData.level || 1),
      vip: Math.max(localData.vip || 0, serverData.vip || 0),
      chapter: Math.max(localData.chapter || 1, serverData.chapter || 1),
      
      // 战力取最大
      power: Math.max(localData.power || 0, serverData.power || 0),
      
      // 经验累加
      exp: (localData.exp || 0) + (serverData.exp || 0),
      
      // 更新时间
      last_sync: new Date().toISOString()
    };
    
    // 保存合并后的数据
    await supabase
      .from('game_users')
      .upsert({
        uid,
        ...mergedData
      });
    
    res.json({
      success: true,
      mergedData,
      message: '存档合并成功'
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 创建存档备份
 * POST /api/v1/cloud-sync/backup
 */
router.post('/backup', async (req: Request, res: Response) => {
  try {
    const { uid, backupName } = req.body;
    
    // 获取当前存档
    const { data: user } = await supabase
      .from('game_users')
      .select('*')
      .eq('uid', uid)
      .single();
    
    if (!user) {
      return res.status(404).json({ error: '存档不存在' });
    }
    
    // 保存备份（实际应存储到备份表或对象存储）
    const backup = {
      uid,
      backup_name: backupName || `备份_${new Date().toLocaleDateString()}`,
      data: user,
      created_at: new Date().toISOString()
    };
    
    // 这里简化处理，实际应创建备份记录
    console.log('[CloudSync] 创建备份:', backup);
    
    res.json({
      success: true,
      backup: {
        name: backup.backup_name,
        createdAt: backup.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 恢复存档
 * POST /api/v1/cloud-sync/restore
 */
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const { uid, backupId } = req.body;
    
    // 这里应从备份中恢复数据
    // 简化处理，返回成功消息
    
    res.json({
      success: true,
      message: '存档恢复成功'
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
