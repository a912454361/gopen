/**
 * 游戏API路由
 * 互动剧情游戏《剑破苍穹》
 */

import express from 'express';
import { getSupabaseClient } from '../storage/database/supabase-client.js';
import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';

const router = express.Router();
const supabase = getSupabaseClient();

// 视频生成客户端
let videoClient: VideoGenerationClient | null = null;
const getVideoClient = () => {
  if (!videoClient) {
    videoClient = new VideoGenerationClient(new Config(), {});
  }
  return videoClient;
};

/**
 * 获取故事信息
 * GET /api/v1/game/story/:storyId
 */
router.get('/story/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;
    
    const { data, error } = await supabase
      .from('game_story_nodes')
      .select('*')
      .eq('story_id', storyId)
      .order('episode')
      .order('created_at');
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    // 获取起始节点
    const startNode = data?.find(n => n.is_start);
    
    res.json({
      story: {
        id: storyId,
        name: '剑破苍穹',
        description: '一段关于剑道、命运与成长的传奇故事',
        total_episodes: 80,
        nodes: data,
        start_node: startNode?.node_id,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取剧情节点
 * GET /api/v1/game/node/:storyId/:nodeId
 */
router.get('/node/:storyId/:nodeId', async (req, res) => {
  try {
    const { storyId, nodeId } = req.params;
    
    const { data, error } = await supabase
      .from('game_story_nodes')
      .select('*')
      .eq('story_id', storyId)
      .eq('node_id', nodeId)
      .single();
    
    if (error) {
      return res.status(404).json({ error: '节点不存在' });
    }
    
    res.json({ node: data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 玩家选择
 * POST /api/v1/game/choose
 * Body: { playerId, storyId, nodeId, choiceIndex }
 */
router.post('/choose', async (req, res) => {
  try {
    const { playerId, storyId, nodeId, choiceIndex } = req.body;
    
    // 获取当前节点
    const { data: currentNode, error: nodeError } = await supabase
      .from('game_story_nodes')
      .select('*')
      .eq('story_id', storyId)
      .eq('node_id', nodeId)
      .single();
    
    if (nodeError || !currentNode) {
      return res.status(404).json({ error: '当前节点不存在' });
    }
    
    // 获取选择的分支
    const choices = currentNode.choices || [];
    const choice = choices[choiceIndex];
    
    if (!choice) {
      return res.status(400).json({ error: '无效的选择' });
    }
    
    const nextNodeId = choice.next_node;
    const effects = choice.effect || {};
    
    // 获取下一个节点
    const { data: nextNode, error: nextError } = await supabase
      .from('game_story_nodes')
      .select('*')
      .eq('story_id', storyId)
      .eq('node_id', nextNodeId)
      .single();
    
    if (nextError || !nextNode) {
      return res.status(404).json({ error: '下一节点不存在' });
    }
    
    // 更新或创建存档
    const { data: existingSave } = await supabase
      .from('game_saves')
      .select('*')
      .eq('player_id', playerId)
      .eq('story_id', storyId)
      .single();
    
    if (existingSave) {
      // 更新存档
      const newChoices = [...(existingSave.choices_made || []), {
        from: nodeId,
        to: nextNodeId,
        choice: choice.text,
        timestamp: new Date().toISOString(),
      }];
      
      const newStats = { ...(existingSave.stats || {}) };
      Object.entries(effects).forEach(([key, value]) => {
        newStats[key] = (newStats[key] || 0) + (value as number);
      });
      
      await supabase
        .from('game_saves')
        .update({
          current_node: nextNodeId,
          current_episode: nextNode.episode,
          choices_made: newChoices,
          stats: newStats,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSave.id);
    } else {
      // 创建新存档
      await supabase
        .from('game_saves')
        .insert({
          player_id: playerId,
          story_id: storyId,
          current_node: nextNodeId,
          current_episode: nextNode.episode,
          choices_made: [{
            from: nodeId,
            to: nextNodeId,
            choice: choice.text,
            timestamp: new Date().toISOString(),
          }],
          stats: effects,
        });
    }
    
    res.json({
      success: true,
      nextNode,
      effects,
      choice: choice.text,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 获取玩家存档
 * GET /api/v1/game/save/:playerId/:storyId
 */
router.get('/save/:playerId/:storyId', async (req, res) => {
  try {
    const { playerId, storyId } = req.params;
    
    const { data, error } = await supabase
      .from('game_saves')
      .select('*')
      .eq('player_id', playerId)
      .eq('story_id', storyId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ save: data || null });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 为节点生成视频
 * POST /api/v1/game/generate-video
 * Body: { storyId, nodeId }
 */
router.post('/generate-video', async (req, res) => {
  try {
    const { storyId, nodeId } = req.body;
    
    // 获取节点信息
    const { data: node, error: nodeError } = await supabase
      .from('game_story_nodes')
      .select('*')
      .eq('story_id', storyId)
      .eq('node_id', nodeId)
      .single();
    
    if (nodeError || !node) {
      return res.status(404).json({ error: '节点不存在' });
    }
    
    if (!node.video_prompt) {
      return res.status(400).json({ error: '该节点没有视频提示词' });
    }
    
    // 生成视频
    const client = getVideoClient();
    const contentItems = [
      {
        type: 'text' as const,
        text: node.video_prompt,
      },
    ];
    
    const result = await client.videoGeneration(contentItems, {
      model: 'doubao-seedance-1-5-pro-251215',
      duration: node.video_duration || 5,
      ratio: '16:9',
      resolution: '720p' as any,
      generateAudio: true,
      watermark: false,
    });
    
    // 等待生成完成
    let videoUrl: string | null = result.videoUrl || null;
    
    if (!videoUrl) {
      return res.status(500).json({ error: '视频生成超时' });
    }
    
    // 更新节点的视频URL
    await supabase
      .from('game_story_nodes')
      .update({ video_url: videoUrl })
      .eq('id', node.id);
    
    res.json({
      success: true,
      video_url: videoUrl,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * 添加剧情节点
 * POST /api/v1/game/node
 */
router.post('/node', async (req, res) => {
  try {
    const {
      story_id,
      node_id,
      episode,
      title,
      description,
      video_prompt,
      video_duration,
      choices,
      is_start,
      is_ending,
      ending_type,
    } = req.body;
    
    const { data, error } = await supabase
      .from('game_story_nodes')
      .insert({
        story_id,
        node_id,
        episode: episode || 1,
        title,
        description,
        video_prompt,
        video_duration: video_duration || 5,
        choices: choices || [],
        is_start: is_start || false,
        is_ending: is_ending || false,
        ending_type,
      })
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ success: true, node: data });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
