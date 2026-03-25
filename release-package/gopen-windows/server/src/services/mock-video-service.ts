/**
 * 服务端文件：server/src/services/mock-video-service.ts
 * 模拟视频服务 - 返回真实可用的视频
 * 
 * 功能：
 * - 根据场景描述智能匹配视频
 * - 返回真实可播放的视频URL
 * - 支持多种场景类型
 */

// 场景类型与视频映射
const SCENE_VIDEOS: Record<string, string[]> = {
  // 仙侠/武侠场景
  'xianxia': [
    'https://cdn.pixabay.com/video/2020/07/30/45557-446003562_large.mp4', // 山峦云海
    'https://cdn.pixabay.com/video/2021/10/11/91364-602415498_large.mp4', // 云雾缭绕
    'https://cdn.pixabay.com/video/2022/07/23/125680-733014384_large.mp4', // 雪山
  ],
  // 战斗场景
  'battle': [
    'https://cdn.pixabay.com/video/2020/05/25/40168-425489522_large.mp4', // 闪电风暴
    'https://cdn.pixabay.com/video/2019/06/04/24226-342039702_large.mp4', // 火焰
    'https://cdn.pixabay.com/video/2021/02/23/66370-513677067_large.mp4', // 烟雾
  ],
  // 自然风光
  'nature': [
    'https://cdn.pixabay.com/video/2020/07/30/45557-446003562_large.mp4', // 山峦
    'https://cdn.pixabay.com/video/2022/08/05/126235-741126988_large.mp4', // 森林
    'https://cdn.pixabay.com/video/2022/07/26/125816-734425236_large.mp4', // 日落
  ],
  // 室内场景
  'interior': [
    'https://cdn.pixabay.com/video/2020/04/13/35468-408788797_large.mp4', // 蜡烛
    'https://cdn.pixabay.com/video/2020/03/18/35449-407614745_large.mp4', // 火焰
  ],
  // 人物/动作
  'action': [
    'https://cdn.pixabay.com/video/2019/10/27/28005-369525693_large.mp4', // 飞鸟
    'https://cdn.pixabay.com/video/2020/07/30/45557-446003562_large.mp4', // 云海
  ],
  // 默认
  'default': [
    'https://cdn.pixabay.com/video/2020/07/30/45557-446003562_large.mp4', // 山峦云海
    'https://cdn.pixabay.com/video/2021/10/11/91364-602415498_large.mp4', // 云雾
    'https://cdn.pixabay.com/video/2022/07/23/125680-733014384_large.mp4', // 雪山
    'https://cdn.pixabay.com/video/2022/08/05/126235-741126988_large.mp4', // 森林
    'https://cdn.pixabay.com/video/2022/07/26/125816-734425236_large.mp4', // 日落
  ],
};

// 场景关键词映射
const SCENE_KEYWORDS: Record<string, string[]> = {
  'xianxia': ['仙侠', '剑', '武侠', '修仙', '剑气', '剑宗', '剑匣', '剑光', '剑影', '仙鹤', '灵', '道'],
  'battle': ['战斗', '打斗', '对决', '激战', '厮杀', '闪电', '风暴', '火焰', '爆炸'],
  'nature': ['山', '林', '竹林', '溪流', '云海', '云雾', '雪', '森林', '日落', '黄昏', '清晨', '阳光'],
  'interior': ['房', '庙', '殿', '堂', '室', '烛', '火', '暗'],
  'action': ['跳跃', '奔跑', '飞行', '追逐', '动作'],
};

/**
 * 根据描述匹配场景类型
 */
function matchSceneType(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  for (const [type, keywords] of Object.entries(SCENE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return type;
      }
    }
  }
  
  return 'default';
}

/**
 * 获取场景视频
 */
export function getSceneVideo(description: string, sceneId?: string): { videoUrl: string; lastFrameUrl: string } {
  const sceneType = matchSceneType(description);
  const videos = SCENE_VIDEOS[sceneType] || SCENE_VIDEOS['default'];
  
  // 基于描述哈希选择视频（相同描述返回相同视频）
  const hash = description.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const videoUrl = videos[hash % videos.length];
  
  // 生成最后一帧URL（使用静态图片）
  const lastFrameUrl = `https://cdn.pixabay.com/photo/2015/12/01/20/28/road-1072823_640.jpg`;
  
  return { videoUrl, lastFrameUrl };
}

/**
 * 获取多个场景视频
 */
export function getSceneVideos(descriptions: string[]): Array<{ videoUrl: string; lastFrameUrl: string }> {
  return descriptions.map(desc => getSceneVideo(desc));
}

/**
 * 获取所有可用视频列表
 */
export function getAvailableVideos(): Record<string, string[]> {
  return SCENE_VIDEOS;
}

export default {
  getSceneVideo,
  getSceneVideos,
  getAvailableVideos,
};
