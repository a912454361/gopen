/**
 * 《剑破苍穹》80集极速制作API
 */

import express, { type Request, type Response } from 'express';
import { Jianpo80EpisodesProducer } from '../services/jianpo-80-episodes.js';

const router = express.Router();

// 特权用户ID
const PRIVILEGED_USER_ID = '53714d80-6677-420b-9cf1-cb22a41191ca';

/**
 * 启动80集制作
 * POST /api/v1/jianpo-80/start
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (user_id !== PRIVILEGED_USER_ID) {
      return res.status(403).json({ error: '此功能仅限特权用户使用' });
    }

    console.log('[Jianpo80] 启动80集制作系统...');

    // 异步启动制作（避免阻塞）
    const producer = new Jianpo80EpisodesProducer();
    
    // 立即返回，后台执行
    producer.produce().then(result => {
      console.log('[Jianpo80] 制作完成:', result);
    }).catch(error => {
      console.error('[Jianpo80] 制作失败:', error);
    });

    res.json({
      success: true,
      message: '🚀 《剑破苍穹》80集制作系统已启动！',
      data: {
        status: 'running',
        totalEpisodes: 80,
        totalDuration: 1600,
        estimatedTime: '约2-4小时',
      },
    });
  } catch (error) {
    console.error('[Jianpo80] 启动失败:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取制作进度
 * GET /api/v1/jianpo-80/progress
 */
router.get('/progress', async (req: Request, res: Response) => {
  try {
    // 从数据库获取项目状态
    const { data: projects, error } = await (await import('../storage/database/supabase-client.js')).getSupabaseClient()
      .from('anime_projects')
      .select('id, title, total_episodes, status, created_at, episodes')
      .eq('title', '剑破苍穹')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !projects || projects.length === 0) {
      return res.json({
        success: true,
        data: {
          status: 'not_started',
          message: '尚未启动制作',
        },
      });
    }

    const project = projects[0];
    const episodes = project.episodes || [];
    const completedEpisodes = episodes.length;

    res.json({
      success: true,
      data: {
        projectId: project.id,
        status: project.status,
        totalEpisodes: 80,
        completedEpisodes,
        progress: Math.round((completedEpisodes / 80) * 100),
        remainingEpisodes: 80 - completedEpisodes,
      },
    });
  } catch (error) {
    console.error('[Jianpo80] 获取进度失败:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取故事大纲
 * GET /api/v1/jianpo-80/story
 */
router.get('/story', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: '剑破苍穹',
      totalEpisodes: 80,
      totalDuration: 1600,
      storyArcs: [
        { arc: '入门篇', episodes: '1-10', synopsis: '少年林萧偶得苍穹剑诀，拜入剑圣陆青云门下' },
        { arc: '成长篇', episodes: '11-20', synopsis: '林萧功法精进，参与宗门大比，声名鹊起' },
        { arc: '危机篇', episodes: '21-30', synopsis: '暗影势力大举进攻，林萧踏上复仇之路' },
        { arc: '历练篇', episodes: '31-40', synopsis: '林萧游历天下，寻访神器，揭开身世之谜' },
        { arc: '觉醒篇', episodes: '41-50', synopsis: '林萧觉醒前世记忆，原来曾是天界剑神' },
        { arc: '大战篇', episodes: '51-60', synopsis: '正邪大战全面爆发，林萧率众对抗暗影势力' },
        { arc: '飞升篇', episodes: '61-70', synopsis: '林萧突破飞升境界，与苏婉儿共赴天界' },
        { arc: '终章篇', episodes: '71-80', synopsis: '林萧重返巅峰，与最终BOSS展开宿命决战' },
      ],
      mainCharacters: [
        { name: '林萧', role: '主角', ability: '苍穹剑诀' },
        { name: '苏婉儿', role: '女主', ability: '冰心诀' },
        { name: '萧峰', role: '挚友', ability: '金刚不坏体' },
        { name: '墨渊', role: '反派', ability: '暗影吞噬' },
        { name: '剑圣陆青云', role: '师父', ability: '万剑归宗' },
      ],
    },
  });
});

/**
 * 获取UE5脚本列表
 * GET /api/v1/jianpo-80/ue5-scripts
 */
router.get('/ue5-scripts', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      categories: [
        { name: '核心', count: 8, scripts: ['UE5_init_project.py', 'UE5_import_assets.py', 'UE5_create_materials.py', 'UE5_scene_setup.py', 'UE5_create_niagara.py', 'UE5_create_sequence.py', 'UE5_render_sequence.py', 'UE5_auto_all.py'] },
        { name: '场景', count: 8, scripts: ['UE5_foliage_generator.py', 'UE5_weather_system.py', 'UE5_camera_system.py', 'UE5_post_process_presets.py', 'UE5_sequencer_advanced.py', 'UE5_lumen_setup.py', 'UE5_nanite_optimizer.py', 'UE5_time_system.py'] },
        { name: '角色', count: 5, scripts: ['UE5_character_manager.py', 'UE5_character_customizer.py', 'UE5_anim_state_machine.py', 'UE5_physics_collision.py', 'UE5_mocap_setup.py'] },
        { name: '系统', count: 6, scripts: ['UE5_dialog_system.py', 'UE5_quest_system.py', 'UE5_save_system.py', 'UE5_cutscene_maker.py', 'UE5_audio_system.py', 'UE5_event_system.py'] },
        { name: '特效', count: 4, scripts: ['UE5_adjust_particles.py', 'UE5_create_triggers.py', 'UE5_cinema_camera.py', 'UE5_procedural_generation.py'] },
        { name: '性能', count: 4, scripts: ['UE5_health_check.py', 'UE5_performance_analyzer.py', 'UE5_bake_lightning.py', 'UE5_dynamic_scaling.py'] },
        { name: '工具', count: 4, scripts: ['UE5_batch_settings.py', 'UE5_automation_tests.py', 'UE5_one_click_deploy.py', 'UE5_cicd_pipeline.py'] },
      ],
      totalScripts: 39,
    },
  });
});

/**
 * 获取粒子特效配置
 * GET /api/v1/jianpo-80/particle-effects
 */
router.get('/particle-effects', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      effects: [
        { name: '苍穹剑气', type: 'niagara_sword_slash', intensity: 100, quality: '8K' },
        { name: '冰心诀', type: 'niagara_ice_crystal', intensity: 90, quality: '8K' },
        { name: '暗影吞噬', type: 'niagara_dark_smoke', intensity: 100, quality: '8K' },
        { name: '万剑归宗', type: 'niagara_sword_formation', intensity: 100, quality: '8K' },
        { name: '星辰陨落', type: 'niagara_stars', intensity: 100, quality: '8K' },
        { name: '烈焰爆发', type: 'niagara_fire_explosion', intensity: 100, quality: '8K' },
        { name: '天雷降临', type: 'niagara_lightning', intensity: 100, quality: '8K' },
        { name: '生命之光', type: 'niagara_healing_aura', intensity: 80, quality: '8K' },
      ],
    },
  });
});

export default router;
