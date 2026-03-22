import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
// @ts-ignore - react-native-sse lacks proper type definitions
import RNSSE from 'react-native-sse';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;
const CARD_HEIGHT = 200;

// 项目类型配置 - 对应Unsplash图片搜索关键词
const TYPE_CONFIG: Record<string, { icon: string; gradient: string[] }> = {
  '古风场景': { icon: 'pagoda', gradient: ['#4A5568', '#2D3748'] },
  '国风热血': { icon: 'fire', gradient: ['#DC2626', '#7F1D1D'] },
  '唯美风': { icon: 'leaf', gradient: ['#EC4899', '#831843'] },
  '仙侠唯美': { icon: 'cloud', gradient: ['#8B5CF6', '#4C1D95'] },
  '水墨场景': { icon: 'brush', gradient: ['#1F2937', '#111827'] },
  '古风角色': { icon: 'user-ninja', gradient: ['#059669', '#064E3B'] },
  '国风城池': { icon: 'landmark', gradient: ['#D97706', '#92400E'] },
  '仙侠场景': { icon: 'mountain-sun', gradient: ['#6366F1', '#312E81'] },
  '古风剧情': { icon: 'book-open', gradient: ['#0891B2', '#164E63'] },
};

// 根据项目类型获取不同的创作服务配置
const getServicesByType = (type: string) => {
  const servicesMap: Record<string, Array<{ id: string; icon: string; title: string; desc: string; color: string }>> = {
    '古风场景': [
      { id: 'scene_render', icon: 'mountain-sun', title: '场景渲染', desc: '生成唯美古风场景', color: '#8B5CF6' },
      { id: 'weather', icon: 'cloud-sun', title: '天气变化', desc: '添加雨雪风霜效果', color: '#06B6D4' },
      { id: 'lighting', icon: 'sun', title: '光影设计', desc: '设计日出日落光影', color: '#F59E0B' },
      { id: 'season', icon: 'leaf', title: '季节变换', desc: '切换春夏秋冬景象', color: '#10B981' },
    ],
    '国风热血': [
      { id: 'battle_action', icon: 'bolt', title: '战斗动作', desc: '设计热血战斗动作', color: '#EF4444' },
      { id: 'skill_effect', icon: 'explosion', title: '技能特效', desc: '创建绚丽技能效果', color: '#F59E0B' },
      { id: 'martial_arts', icon: 'hand-fist', title: '武术招式', desc: '设计武术招式套路', color: '#DC2626' },
      { id: 'battle_scene', icon: 'fire', title: '战斗场景', desc: '生成热血战斗场景', color: '#7C3AED' },
    ],
    '唯美风': [
      { id: 'atmosphere', icon: 'wind', title: '氛围营造', desc: '营造梦幻唯美氛围', color: '#EC4899' },
      { id: 'color_match', icon: 'palette', title: '色彩搭配', desc: '设计柔和色彩方案', color: '#8B5CF6' },
      { id: 'artistic', icon: 'feather', title: '意境表达', desc: '表达唯美情感意境', color: '#06B6D4' },
      { id: 'camera', icon: 'video', title: '镜头语言', desc: '设计唯美镜头构图', color: '#F59E0B' },
    ],
    '仙侠唯美': [
      { id: 'immortal_art', icon: 'wand-magic-sparkles', title: '仙术特效', desc: '设计绚丽仙术效果', color: '#8B5CF6' },
      { id: 'artifact', icon: 'gem', title: '法宝设计', desc: '创作仙家法宝设定', color: '#EC4899' },
      { id: 'fairyland', icon: 'cloud', title: '仙境构建', desc: '构建缥缈仙境世界', color: '#06B6D4' },
      { id: 'aura', icon: 'star', title: '灵气环境', desc: '设计灵气飘渺氛围', color: '#10B981' },
    ],
    '水墨场景': [
      { id: 'ink_layer', icon: 'droplet', title: '墨色层次', desc: '设计墨色浓淡变化', color: '#1F2937' },
      { id: 'composition', icon: 'square', title: '留白构图', desc: '讲究留白意境构图', color: '#6B7280' },
      { id: 'brush_style', icon: 'brush', title: '笔触风格', desc: '选择水墨笔触风格', color: '#374151' },
      { id: 'artistic_ink', icon: 'paintbrush', title: '意境渲染', desc: '渲染水墨画意境', color: '#4B5563' },
    ],
    '古风角色': [
      { id: 'costume', icon: 'shirt', title: '服饰设计', desc: '设计古风服饰造型', color: '#059669' },
      { id: 'face', icon: 'face-smile', title: '面部特征', desc: '刻画角色面部特点', color: '#EC4899' },
      { id: 'pose', icon: 'person', title: '姿态动作', desc: '设计角色姿态动作', color: '#8B5CF6' },
      { id: 'accessory', icon: 'crown', title: '配饰道具', desc: '设计发簪饰品等', color: '#F59E0B' },
    ],
    '国风城池': [
      { id: 'architecture', icon: 'building', title: '建筑风格', desc: '设计古风建筑风格', color: '#D97706' },
      { id: 'city_layout', icon: 'map', title: '城池布局', desc: '规划城池整体布局', color: '#059669' },
      { id: 'defense', icon: 'shield', title: '防御工事', desc: '设计城墙防御体系', color: '#DC2626' },
      { id: 'city_style', icon: 'city', title: '城市风貌', desc: '打造独特城市风貌', color: '#7C3AED' },
    ],
    '仙侠场景': [
      { id: 'fairy_mountain', icon: 'mountain', title: '仙山构建', desc: '构建缥缈仙山景象', color: '#6366F1' },
      { id: 'cloud_effect', icon: 'cloud', title: '云雾效果', desc: '添加缭绕云雾效果', color: '#06B6D4' },
      { id: 'spirit_flow', icon: 'wind', title: '灵气流动', desc: '设计灵气流动效果', color: '#8B5CF6' },
      { id: 'fairy_atmos', icon: 'star', title: '仙境氛围', desc: '营造仙气飘渺氛围', color: '#EC4899' },
    ],
    '古风剧情': [
      { id: 'plot_arch', icon: 'sitemap', title: '剧情架构', desc: '构建故事主线框架', color: '#0891B2' },
      { id: 'dialogue', icon: 'comments', title: '人物对话', desc: '创作古风对话台词', color: '#6366F1' },
      { id: 'branch', icon: 'code-branch', title: '情节分支', desc: '设计剧情分支走向', color: '#8B5CF6' },
      { id: 'emotion', icon: 'heart', title: '情感表达', desc: '刻画人物情感变化', color: '#EC4899' },
    ],
  };

  return servicesMap[type] || [
    { id: 'scene', icon: 'image', title: '场景创作', desc: '生成唯美场景画面', color: '#8B5CF6' },
    { id: 'character', icon: 'user', title: '角色设计', desc: '创作角色形象设定', color: '#EC4899' },
    { id: 'story', icon: 'book-open', title: '剧情编写', desc: '生成故事情节内容', color: '#06B6D4' },
    { id: 'music', icon: 'music', title: '配乐推荐', desc: '匹配氛围音乐', color: '#F59E0B' },
  ];
};

// 真实Unsplash图片链接 - 中国风/古风/唯美风格
const PROJECT_IMAGES: Record<string, string> = {
  // 古风场景
  'a1': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop', // 中国古建筑
  'a2': 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400&h=300&fit=crop', // 江南水乡
  // 国风热血
  'a3': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // 山峰剑影
  'a4': 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=300&fit=crop', // 雪山
  // 唯美风
  'a5': 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=300&fit=crop', // 樱花
  'a6': 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop', // 星空
  // 仙侠唯美
  'a7': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // 仙山
  'a8': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop', // 云海
  // 水墨场景
  'a9': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop', // 山水
  'a10': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', // 雾林
  // 古风角色
  'a11': 'https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=400&h=300&fit=crop', // 古风人物
  'a12': 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop', // 书法
  // 待处理项目
  'p1': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop', // 竹林
  'p2': 'https://images.unsplash.com/photo-1517309230475-6736d926b979?w=400&h=300&fit=crop', // 古镇夜景
  'p3': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop', // 武侠
  'p4': 'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=400&h=300&fit=crop', // 对决
  'p5': 'https://images.unsplash.com/photo-1522413171819-61c5fee00f52?w=400&h=300&fit=crop', // 落花
  'p6': 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=300&fit=crop', // 月光
  'p7': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop', // 雪山
  'p8': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=300&fit=crop', // 湖泊
  'p9': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // 山水
  'p10': 'https://images.unsplash.com/photo-1580136607857-4c193a8f1e37?w=400&h=300&fit=crop', // 画作
};

// 精选项目数据 - 每个类型保留优质项目
const PROJECT_DATA = {
  active: [
    // 古风场景
    { id: 'a1', title: '山河入梦', type: '古风场景', progress: 92, assets: 56, lastUpdated: '刚刚' },
    { id: 'a2', title: '烟雨江南', type: '古风场景', progress: 85, assets: 48, lastUpdated: '20分钟前' },
    // 国风热血
    { id: 'a3', title: '剑定山河', type: '国风热血', progress: 95, assets: 68, lastUpdated: '刚刚' },
    { id: 'a4', title: '血染苍穹', type: '国风热血', progress: 88, assets: 52, lastUpdated: '15分钟前' },
    // 唯美风
    { id: 'a5', title: '樱花漫舞', type: '唯美风', progress: 78, assets: 42, lastUpdated: '35分钟前' },
    { id: 'a6', title: '星空梦境', type: '唯美风', progress: 72, assets: 38, lastUpdated: '1小时前' },
    // 仙侠唯美
    { id: 'a7', title: '蓬莱仙境', type: '仙侠唯美', progress: 82, assets: 46, lastUpdated: '30分钟前' },
    { id: 'a8', title: '云端仙宫', type: '仙侠唯美', progress: 75, assets: 44, lastUpdated: '1小时前' },
    // 水墨场景
    { id: 'a9', title: '一纸江南', type: '水墨场景', progress: 78, assets: 42, lastUpdated: '35分钟前' },
    { id: 'a10', title: '墨染山河', type: '水墨场景', progress: 58, assets: 28, lastUpdated: '2小时前' },
    // 古风角色
    { id: 'a11', title: '风月入怀', type: '古风角色', progress: 85, assets: 48, lastUpdated: '20分钟前' },
    { id: 'a12', title: '青衫烟雨', type: '古风角色', progress: 65, assets: 32, lastUpdated: '2小时前' },
  ],
  pending: [
    // 待处理 - 古风场景
    { id: 'p1', title: '竹影清风', type: '古风场景', progress: 35, assets: 15, lastUpdated: '5小时前' },
    { id: 'p2', title: '古镇夜市', type: '古风场景', progress: 20, assets: 8, lastUpdated: '8小时前' },
    // 待处理 - 国风热血
    { id: 'p3', title: '武林大会', type: '国风热血', progress: 0, assets: 0, lastUpdated: '待启动' },
    { id: 'p4', title: '江湖对决', type: '国风热血', progress: 0, assets: 0, lastUpdated: '待启动' },
    // 待处理 - 唯美风
    { id: 'p5', title: '落樱缤纷', type: '唯美风', progress: 15, assets: 6, lastUpdated: '6小时前' },
    { id: 'p6', title: '月光如水', type: '唯美风', progress: 0, assets: 0, lastUpdated: '待启动' },
    // 待处理 - 仙侠唯美
    { id: 'p7', title: '昆仑雪域', type: '仙侠唯美', progress: 25, assets: 10, lastUpdated: '4小时前' },
    { id: 'p8', title: '仙湖倒影', type: '仙侠唯美', progress: 0, assets: 0, lastUpdated: '待启动' },
    // 待处理 - 水墨场景
    { id: 'p9', title: '泼墨山水', type: '水墨场景', progress: 10, assets: 4, lastUpdated: '10小时前' },
    { id: 'p10', title: '丹青妙笔', type: '水墨场景', progress: 0, assets: 0, lastUpdated: '待启动' },
  ],
};

interface Project {
  id: string;
  title: string;
  type: string;
  progress: number;
  assets: number;
  lastUpdated: string;
}

// 根据项目类型和服务类型生成创作提示词
const generateProjectPrompt = (title: string, type: string, serviceType?: string): string => {
  // 服务类型名称映射
  const serviceNames: Record<string, string> = {
    // 古风场景
    'scene_render': '场景渲染',
    'weather': '天气变化',
    'lighting': '光影设计',
    'season': '季节变换',
    // 国风热血
    'battle_action': '战斗动作',
    'skill_effect': '技能特效',
    'martial_arts': '武术招式',
    'battle_scene': '战斗场景',
    // 唯美风
    'atmosphere': '氛围营造',
    'color_match': '色彩搭配',
    'artistic': '意境表达',
    'camera': '镜头语言',
    // 仙侠唯美
    'immortal_art': '仙术特效',
    'artifact': '法宝设计',
    'fairyland': '仙境构建',
    'aura': '灵气环境',
    // 水墨场景
    'ink_layer': '墨色层次',
    'composition': '留白构图',
    'brush_style': '笔触风格',
    'artistic_ink': '意境渲染',
    // 古风角色
    'costume': '服饰设计',
    'face': '面部特征',
    'pose': '姿态动作',
    'accessory': '配饰道具',
    // 国风城池
    'architecture': '建筑风格',
    'city_layout': '城池布局',
    'defense': '防御工事',
    'city_style': '城市风貌',
    // 仙侠场景
    'fairy_mountain': '仙山构建',
    'cloud_effect': '云雾效果',
    'spirit_flow': '灵气流动',
    'fairy_atmos': '仙境氛围',
    // 古风剧情
    'plot_arch': '剧情架构',
    'dialogue': '人物对话',
    'branch': '情节分支',
    'emotion': '情感表达',
    // 默认
    'scene': '场景创作',
    'character': '角色设计',
    'story': '剧情编写',
    'music': '配乐推荐',
  };

  // 服务类型提示词模板
  const servicePrompts: Record<string, string> = {
    // === 古风场景 ===
    'scene_render': `请为《${title}》项目创作一个${type}设计方案。

要求：
1. 场景氛围：体现古风韵味，意境深远
2. 色调：典雅古朴的配色方案
3. 元素：亭台楼阁、小桥流水等古风元素
4. 光影：自然光线处理，晨昏变化
5. 风格：符合项目整体风格定位

请输出：
- 场景详细描述（200字以上）
- 主要构成元素清单
- 色彩搭配方案
- 氛围营造建议`,

    'weather': `请为《${title}》项目设计天气变化效果。

项目类型：${type}

请设计：
1. 雨景效果：细雨、暴雨、烟雨江南
2. 雪景效果：飘雪、积雪、雪后初晴
3. 雾景效果：晨雾、山雾、薄暮烟霭
4. 风景效果：春风、秋风、狂风

请输出：
- 各天气场景描述
- 粒子特效建议
- 环境音效推荐
- 情感氛围说明`,

    'lighting': `请为《${title}》项目设计光影效果。

项目类型：${type}

请设计：
1. 日出：朝霞、晨光、初阳
2. 正午：阳光直射、阴影处理
3. 黄昏：晚霞、余晖、金色光芒
4. 夜景：月光、灯火、星空

请输出：
- 各时段光影描述
- 光源位置与角度
- 色温变化建议
- 情感氛围营造`,

    'season': `请为《${title}》项目设计四季变换效果。

项目类型：${type}

请设计：
1. 春景：柳绿花红、春风得意
2. 夏景：绿树成荫、荷塘月色
3. 秋景：枫叶如丹、秋高气爽
4. 冬景：白雪皑皑、寒梅傲雪

请输出：
- 各季节场景描述
- 植被变化方案
- 天气联动效果
- 情感表达建议`,

    // === 国风热血 ===
    'battle_action': `请为《${title}》项目设计热血战斗动作。

项目类型：${type}

请设计：
1. 攻击动作：剑法、刀法、拳脚
2. 防御动作：格挡、闪避、护体
3. 必杀技能：大招演出、终结技
4. 连招系统：招式衔接、组合技

请输出：
- 动作设计描述
- 关键帧说明
- 节奏把控建议
- 视觉冲击力分析`,

    'skill_effect': `请为《${title}》项目设计绚丽技能特效。

项目类型：${type}

请设计：
1. 剑气特效：剑芒、剑影、剑域
2. 内力特效：真气、罡气、气场
3. 元素特效：火焰、雷电、冰霜
4. 终结特效：必杀技演出

请输出：
- 各特效视觉描述
- 颜色与形状设计
- 动态效果建议
- 性能优化方案`,

    'martial_arts': `请为《${title}》项目设计武术招式。

项目类型：${type}

请设计：
1. 剑法套路：剑招名称、起手式
2. 刀法套路：刀法精髓、攻防兼备
3. 拳掌功夫：拳法、掌法、指法
4. 轻功身法：闪转腾挪、身形变换

请输出：
- 招式名称与描述
- 武学理念说明
- 招式特点分析
- 实战应用建议`,

    'battle_scene': `请为《${title}》项目设计热血战斗场景。

项目类型：${type}

请设计：
1. 单挑场景：英雄对决、巅峰之战
2. 群战场景：两军对垒、混战场面
3. 追逐场景：林中追逐、屋顶大战
4. 决战场景：最终BOSS战、巅峰对决

请输出：
- 场景详细描述
- 战斗氛围营造
- 镜头设计建议
- 背景音乐推荐`,

    // === 唯美风 ===
    'atmosphere': `请为《${title}》项目营造梦幻唯美氛围。

项目类型：${type}

请设计：
1. 整体基调：柔美、梦幻、诗意
2. 色彩氛围：柔和色调、渐变过渡
3. 光线氛围：柔光、逆光、光斑
4. 动态氛围：飘落花瓣、飞舞萤火

请输出：
- 氛围描述与意境
- 色彩氛围方案
- 光影处理建议
- 动态效果推荐`,

    'color_match': `请为《${title}》项目设计柔和色彩方案。

项目类型：${type}

请设计：
1. 主色调：确定核心色系
2. 辅助色：搭配色、过渡色
3. 强调色：点缀色、高光色
4. 色彩情感：温暖、清新、浪漫

请输出：
- 完整色板方案
- 色彩比例分配
- 场景应用建议
- 情感共鸣说明`,

    'artistic': `请为《${title}》项目表达唯美情感意境。

项目类型：${type}

请表达：
1. 核心意境：思念、眷恋、温柔
2. 情感层次：初见、相知、离别
3. 意象选择：月亮、花朵、流水
4. 诗意表达：古风诗词、现代诗情

请输出：
- 意境描述文字
- 情感层次设计
- 关键意象清单
- 诗意文案建议`,

    'camera': `请为《${title}》项目设计唯美镜头构图。

项目类型：${type}

请设计：
1. 特写镜头：面部表情、手部特写
2. 中景镜头：人物半身、环境互动
3. 远景镜头：大场景、意境渲染
4. 运镜设计：推拉摇移、跟拍

请输出：
- 分镜脚本描述
- 构图比例说明
- 运镜节奏建议
- 视觉美感分析`,

    // === 仙侠唯美 ===
    'immortal_art': `请为《${title}》项目设计绚丽仙术特效。

项目类型：${type}

请设计：
1. 仙法特效：御剑、仙术、神通
2. 灵力特效：灵气、法力、真元
3. 结界特效：防护阵法、封印术
4. 神通特效：大神通、秘术

请输出：
- 仙术视觉描述
- 粒子效果建议
- 配色方案设计
- 动画节奏说明`,

    'artifact': `请为《${title}》项目设计仙家法宝。

项目类型：${type}

请设计：
1. 法宝外形：造型、材质、纹饰
2. 法宝属性：五行、灵性、威力
3. 法宝来历：传说故事、前任主人
4. 法宝技能：特殊能力、使用方式

请输出：
- 法宝详细设定
- 视觉设计描述
- 背景故事
- 能力数值建议`,

    'fairyland': `请为《${title}》项目构建缥缈仙境世界。

项目类型：${type}

请构建：
1. 仙山：浮空岛屿、仙峰玉宇
2. 仙水：仙池、银河、琼浆玉液
3. 仙植：仙草、灵药、长生树
4. 仙兽：神兽、仙禽、灵兽

请输出：
- 仙境全景描述
- 区域划分设计
- 特色元素清单
- 探索路线建议`,

    'aura': `请为《${title}》项目设计灵气飘渺氛围。

项目类型：${type}

请设计：
1. 灵气形态：飘渺、凝聚、流转
2. 灵气颜色：五彩、七色、混沌
3. 灵气环境：灵气浓度、品质等级
4. 灵气动态：流动方向、聚集方式

请输出：
- 灵气视觉描述
- 颜色渐变方案
- 环境效果建议
- 动态表现手法`,

    // === 水墨场景 ===
    'ink_layer': `请为《${title}》项目设计墨色浓淡变化。

项目类型：${type}

请设计：
1. 浓墨：近景、主体、强调
2. 淡墨：远景、过渡、意境
3. 干墨：苍劲、古拙、风骨
4. 湿墨：晕染、流动、朦胧

请输出：
- 墨色层次方案
- 浓淡分布设计
- 画面层次说明
- 意境营造建议`,

    'composition': `请为《${title}》项目讲究留白意境构图。

项目类型：${type}

请设计：
1. 实景位置：山石、树木、建筑
2. 留白区域：天空、水面、云雾
3. 虚实对比：疏密有致、虚实相生
4. 意境延伸：画外之意、联想空间

请输出：
- 构图布局描述
- 留白比例说明
- 视觉焦点设计
- 意境表达建议`,

    'brush_style': `请为《${title}》项目选择水墨笔触风格。

项目类型：${type}

请设计：
1. 勾线笔法：勾勒轮廓、线条粗细
2. 皴法表现：山石纹理、质感表达
3. 点染技法：墨点、渲染、泼墨
4. 风格定位：写意、工笔、兼工带写

请输出：
- 笔法风格描述
- 技法组合建议
- 画面效果预期
- 艺术风格说明`,

    'artistic_ink': `请为《${title}》项目渲染水墨画意境。

项目类型：${type}

请渲染：
1. 意境基调：空灵、幽远、诗意
2. 情感表达：宁静、悠然、超脱
3. 气韵生动：生命力、动态美
4. 诗意融合：诗画结合、情景交融

请输出：
- 意境描述文字
- 情感氛围设计
- 气韵表达手法
- 诗意文案建议`,

    // === 古风角色 ===
    'costume': `请为《${title}》项目设计古风服饰造型。

项目类型：${type}

请设计：
1. 服装款式：朝代风格、身份特点
2. 面料材质：丝绸、锦缎、棉麻
3. 纹饰图案：云纹、花鸟、吉祥纹
4. 配饰搭配：发簪、玉佩、香囊

请输出：
- 服装设计方案
- 色彩搭配建议
- 纹饰细节说明
- 配饰清单`,

    'face': `请为《${title}》项目刻画角色面部特点。

项目类型：${type}

请刻画：
1. 脸型轮廓：鹅蛋脸、瓜子脸、方脸
2. 五官特征：眉眼、鼻子、嘴唇
3. 表情气质：温柔、英气、冷峻
4. 标志性特征：痣、疤痕、特色

请输出：
- 面部详细描述
- 五官特点说明
- 表情设计方案
- 气质定位建议`,

    'pose': `请为《${title}》项目设计角色姿态动作。

项目类型：${type}

请设计：
1. 站姿：端庄、挺拔、优雅
2. 坐姿：休闲、正式、慵懒
3. 行走姿态：轻盈、稳健、婀娜
4. 战斗姿态：持剑、拉弓、运功

请输出：
- 各姿态描述
- 动作要点说明
- 气质体现方式
- 适用场景建议`,

    'accessory': `请为《${title}》项目设计配饰道具。

项目类型：${type}

请设计：
1. 发饰：发簪、步摇、发带
2. 首饰：耳饰、项链、手镯
3. 腰饰：玉佩、香囊、腰封
4. 手持道具：扇子、伞、灯笼

请输出：
- 配饰设计方案
- 材质颜色建议
- 搭配原则说明
- 寓意象征解读`,

    // === 国风城池 ===
    'architecture': `请为《${title}》项目设计古风建筑风格。

项目类型：${type}

请设计：
1. 建筑类型：宫殿、庙宇、民居
2. 结构特点：斗拱、飞檐、歇山顶
3. 装饰风格：彩绘、雕刻、琉璃
4. 朝代特征：汉唐宋明风格

请输出：
- 建筑设计方案
- 结构特点说明
- 装饰细节描述
- 风格定位建议`,

    'city_layout': `请为《${title}》项目规划城池整体布局。

项目类型：${type}

请规划：
1. 整体格局：城墙轮廓、街道走向
2. 功能分区：官署区、商业区、居民区
3. 交通系统：主干道、小巷、桥梁
4. 地标建筑：城楼、钟楼、望楼

请输出：
- 布局规划方案
- 区域功能说明
- 交通流线设计
- 标志性建筑描述`,

    'defense': `请为《${title}》项目设计城墙防御体系。

项目类型：${type}

请设计：
1. 城墙结构：墙体、城门、城楼
2. 防御设施：瓮城、角楼、马面
3. 陷阱机关：护城河、拒马、陷阱
4. 兵力配置：守城器械、兵力部署

请输出：
- 防御体系方案
- 设施布局说明
- 防御战术建议
- 应急预案设计`,

    'city_style': `请为《${title}》项目打造独特城市风貌。

项目类型：${type}

请打造：
1. 整体风格：繁华、古朴、仙气
2. 特色元素：标志性景观、特产
3. 文化氛围：市井、官场、江湖
4. 夜景风貌：灯火、夜市、星空

请输出：
- 城市风貌描述
- 特色元素清单
- 文化氛围营造
- 夜景设计方案`,

    // === 仙侠场景 ===
    'fairy_mountain': `请为《${title}》项目构建缥缈仙山景象。

项目类型：${type}

请构建：
1. 山体形态：浮空岛屿、悬峰、云台
2. 仙家建筑：仙宫、洞府、天门
3. 灵气环境：云雾、仙光、灵气
4. 仙禽灵兽：仙鹤、灵鹿、瑞兽

请输出：
- 仙山全景描述
- 区域划分设计
- 特色元素清单
- 探索内容建议`,

    'cloud_effect': `请为《${title}》项目添加缭绕云雾效果。

项目类型：${type}

请设计：
1. 云海：翻涌云海、浩瀚无垠
2. 瑞云：五彩祥云、仙气飘渺
3. 雾气：晨雾、山岚、仙雾
4. 动态效果：流动、翻涌、凝聚

请输出：
- 云雾效果描述
- 动态表现方案
- 色彩渐变建议
- 性能优化方案`,

    'spirit_flow': `请为《${title}》项目设计灵气流动效果。

项目类型：${type}

请设计：
1. 灵气来源：灵脉、仙井、灵石
2. 流动形态：溪流、旋涡、瀑布
3. 颜色变化：五行颜色、品质变化
4. 浓度分布：灵气浓度、修炼效果

请输出：
- 灵气系统描述
- 流动路径设计
- 视觉效果方案
- 与玩法关联建议`,

    'fairy_atmos': `请为《${title}》项目营造仙气飘渺氛围。

项目类型：${type}

请营造：
1. 整体基调：空灵、超凡、缥缈
2. 光影效果：仙光、神光、灵光
3. 音效氛围：仙乐、梵音、自然音
4. 情感体验：超脱、向往、神秘

请输出：
- 氛围描述文字
- 光影设计方案
- 音效推荐清单
- 情感体验建议`,

    // === 古风剧情 ===
    'plot_arch': `请为《${title}》项目构建故事主线框架。

项目类型：${type}

请构建：
1. 世界观：背景设定、势力划分
2. 主线剧情：起承转合、高潮节点
3. 支线任务：分支故事、隐藏剧情
4. 结局设计：多种结局、条件触发

请输出：
- 完整剧情大纲
- 关键节点设计
- 支线任务清单
- 结局分支方案`,

    'dialogue': `请为《${title}》项目创作古风对话台词。

项目类型：${type}

请创作：
1. 对话风格：文雅、豪迈、婉约
2. 角色语气：性格体现、身份特点
3. 情感表达：含蓄、直白、诗意
4. 名言金句：经典台词、诗词引用

请输出：
- 角色对话示例
- 语气风格说明
- 情感表达建议
- 经典台词设计`,

    'branch': `请为《${title}》项目设计剧情分支走向。

项目类型：${type}

请设计：
1. 分支触发：选择条件、隐藏触发
2. 分支内容：不同路径、不同结局
3. 回收设计：分支汇聚、蝴蝶效应
4. 重玩价值：多周目内容、隐藏剧情

请输出：
- 分支结构图
- 触发条件说明
- 各分支内容概要
- 回收方案设计`,

    'emotion': `请为《${title}》项目刻画人物情感变化。

项目类型：${type}

请刻画：
1. 情感基调：爱恨情仇、悲欢离合
2. 情感线索：情感发展、情感转折
3. 情感高潮：催泪时刻、感动瞬间
4. 情感余韵：回味无穷、意犹未尽

请输出：
- 情感曲线设计
- 关键情感场景
- 人物心理描写
- 玩家共鸣建议`,

    // === 默认 ===
    'scene': `请为《${title}》项目创作一个${type}设计方案。

项目类型：${type}

请输出：
- 场景详细描述
- 主要元素清单
- 色彩搭配方案
- 氛围营造建议`,

    'character': `请为《${title}》项目设计一个角色。

项目类型：${type}

请输出：
- 角色设定描述
- 外貌设计方案
- 性格特点说明
- 标志性特征`,

    'story': `请为《${title}》项目构思一段剧情。

项目类型：${type}

请输出：
- 故事梗概
- 主要人物设定
- 关键情节设计
- 情感线索`,

    'music': `请为《${title}》项目推荐合适的配乐。

项目类型：${type}

请推荐：
- 主旋律风格建议
- 场景配乐清单
- 音效设计建议
- 整体音乐风格定位`,
  };
  
  const serviceName = serviceType ? serviceNames[serviceType] || '创作' : '创作';
  const prompt = serviceType ? servicePrompts[serviceType] : null;
  
  if (prompt) {
    return prompt;
  }
  
  return `请为《${title}》项目进行${serviceName}设计。

项目类型：${type}

请输出：
- 项目概述
- 设计理念
- 主要元素
- 实施方案`;
};

// 项目卡片组件
function ProjectCard({ 
  project, 
  onPress 
}: { 
  project: Project; 
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const typeConfig = TYPE_CONFIG[project.type] || TYPE_CONFIG['古风场景'];
  const imageUrl = PROJECT_IMAGES[project.id] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          width: CARD_WIDTH,
          backgroundColor: theme.backgroundDefault,
          borderColor: project.progress > 50 ? theme.primary : theme.border,
        }
      ]} 
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* 封面图片 */}
      <Image 
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {/* 渐变遮罩 */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.cardGradient}
      />
      {/* 类型标签 */}
      <View style={[styles.typeTag, { backgroundColor: typeConfig.gradient[0] }]}>
        <FontAwesome6 name={typeConfig.icon as any} size={10} color="#fff" />
        <ThemedText variant="tiny" color="#fff">{project.type}</ThemedText>
      </View>
      {/* 标题 */}
      <View style={styles.cardTitleWrap}>
        <ThemedText variant="title" color="#fff" numberOfLines={1}>{project.title}</ThemedText>
      </View>
      {/* 进度条 */}
      <View style={styles.cardProgress}>
        <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <LinearGradient
            colors={typeConfig.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${project.progress}%` }]}
          />
        </View>
        <ThemedText variant="tiny" color="rgba(255,255,255,0.8)">{project.progress}%</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

// Modal阶段类型
type ModalStage = 'services' | 'confirm' | 'creating' | 'result';

// 项目详情Modal组件
function ProjectDetailModal({
  visible,
  project,
  onClose,
}: {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [stage, setStage] = useState<ModalStage>('services');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [createdContent, setCreatedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sseRef = useRef<any>(null);
  const typingAnim = useMemo(() => new Animated.Value(1), []);

  // 重置状态
  React.useEffect(() => {
    if (!visible) {
      setStage('services');
      setSelectedService(null);
      setPrompt('');
      setCreatedContent('');
      setIsLoading(false);
    }
  }, [visible]);

  // 打字动画
  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(1);
    }
  }, [isLoading, typingAnim]);

  // 清理SSE连接
  React.useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  if (!project || !visible) return null;
  
  const typeConfig = TYPE_CONFIG[project.type] || TYPE_CONFIG['古风场景'];
  const imageUrl = PROJECT_IMAGES[project.id] || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop';

  // 根据项目类型获取对应的创作服务选项
  const createServices = getServicesByType(project.type);

  // 选择服务 - 进入确认阶段
  const handleSelectService = (serviceId: string) => {
    const generatedPrompt = generateProjectPrompt(project.title, project.type, serviceId);
    setSelectedService(serviceId);
    setPrompt(generatedPrompt);
    setStage('confirm');
  };

  // 返回服务选择
  const handleBackToServices = () => {
    setStage('services');
    setSelectedService(null);
    setPrompt('');
  };

  // 自动保存作品到数据库（SSE完成后调用）
  const autoSaveWork = async (content: string, imageUrl?: string) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        return;
      }

      const serviceConfig = createServices.find(s => s.id === selectedService);
      
      /**
       * 服务端文件：server/src/routes/works.ts
       * 接口：POST /api/v1/works
       * Body 参数：user_id: number, project_id: string, project_title: string, project_type: string, service_type: string, service_name: string, content: string, content_type: string, image_url?: string
       */
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId, 10),
          project_id: project.id,
          project_title: project.title,
          project_type: project.type,
          service_type: selectedService,
          service_name: serviceConfig?.title || '创作',
          content,
          content_type: imageUrl ? 'image' : 'text',
          image_url: imageUrl,
        }),
      });
    } catch (error) {
      console.error('Save work error:', error);
    }
  };

  // 确认创作 - 开始AI生成
  const handleConfirmCreate = async () => {
    setStage('creating');
    setIsLoading(true);
    setCreatedContent('');

    try {
      const url = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat/stream`;
      const sse = new RNSSE(url, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
        method: 'POST',
      });

      sseRef.current = sse;
      let finalContent = '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sse.addEventListener('message', (event: any) => {
        const data = event.data;
        
        if (data === '[DONE]') {
          setIsLoading(false);
          setStage('result');
          sse.close();
          // 自动保存作品
          autoSaveWork(finalContent);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            finalContent += parsed.content;
            setCreatedContent(prev => prev + parsed.content);
          }
        } catch {
          if (data && data !== '[DONE]') {
            finalContent += data;
            setCreatedContent(prev => prev + data);
          }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sse.addEventListener('error', (_event: any) => {
        setCreatedContent('连接错误，请重试');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Create error:', error);
      setCreatedContent('连接错误，请重试');
      setIsLoading(false);
    }
  };

  // 重新创作
  const handleRecreate = () => {
    setStage('confirm');
    setCreatedContent('');
  };

  // 保存作品
  const handleSaveWork = async () => {
    if (!createdContent || !project) return;

    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      Alert.alert('提示', '请先登录');
      return;
    }

    try {
      const service = createServices.find(s => s.id === selectedService);
      /**
       * 服务端文件：server/src/routes/works.ts
       * 接口：POST /api/v1/works
       * Body 参数：user_id: number, project_id: string, project_title: string, project_type: string, service_type: string, service_name: string, content: string, content_type: string
       */
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(userId, 10),
          project_id: project.id,
          project_title: project.title,
          project_type: project.type,
          service_type: selectedService,
          service_name: service?.title || '创作',
          content: createdContent,
          content_type: 'text',
        }),
      });
      const result = await response.json();

      if (result.success) {
        Alert.alert('保存成功', '作品已保存到「我的作品」');
      }
    } catch (error) {
      console.error('Save work error:', error);
      Alert.alert('保存失败', '请重试');
    }
  };

  // 渲染不同阶段的内容
  const renderContent = () => {
    switch (stage) {
      case 'services':
        return (
          <>
            {/* 项目信息 */}
            <View style={styles.modalInfo}>
              <View style={[styles.modalTypeTag, { backgroundColor: typeConfig.gradient[0] }]}>
                <FontAwesome6 name={typeConfig.icon as any} size={12} color="#fff" />
                <ThemedText variant="labelSmall" color="#fff">{project.type}</ThemedText>
              </View>
              <ThemedText variant="h2" color={theme.textPrimary}>{project.title}</ThemedText>
              
              {/* 统计信息 */}
              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <FontAwesome6 name="cube" size={14} color={theme.primary} />
                  <ThemedText variant="label" color={theme.textSecondary}>{project.assets} 资源</ThemedText>
                </View>
                <View style={styles.modalStatItem}>
                  <FontAwesome6 name="clock" size={14} color={theme.accent} />
                  <ThemedText variant="label" color={theme.textSecondary}>{project.lastUpdated}</ThemedText>
                </View>
                <View style={styles.modalStatItem}>
                  <FontAwesome6 name="chart-line" size={14} color={theme.success} />
                  <ThemedText variant="label" color={theme.textSecondary}>{project.progress}%</ThemedText>
                </View>
              </View>
            </View>
            
            {/* 创作服务 */}
            <View style={styles.modalServices}>
              <ThemedText variant="label" color={theme.textPrimary}>选择创作服务</ThemedText>
              <View style={styles.servicesGrid}>
                {createServices.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, { backgroundColor: theme.backgroundTertiary }]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectService(service.id)}
                  >
                    <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
                      <FontAwesome6 name={service.icon as any} size={20} color={service.color} />
                    </View>
                    <ThemedText variant="labelSmall" color={theme.textPrimary}>{service.title}</ThemedText>
                    <ThemedText variant="tiny" color={theme.textMuted}>{service.desc}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        );

      case 'confirm':
        return (
          <>
            {/* 项目信息 */}
            <View style={styles.modalInfo}>
              <View style={[styles.modalTypeTag, { backgroundColor: typeConfig.gradient[0] }]}>
                <FontAwesome6 name={typeConfig.icon as any} size={12} color="#fff" />
                <ThemedText variant="labelSmall" color="#fff">{project.type}</ThemedText>
              </View>
              <ThemedText variant="h2" color={theme.textPrimary}>{project.title}</ThemedText>
            </View>
            
            {/* 提示词预览 */}
            <View style={styles.promptPreview}>
              <View style={styles.promptHeader}>
                <FontAwesome6 name="wand-magic-sparkles" size={16} color={theme.primary} />
                <ThemedText variant="label" color={theme.textPrimary}>创作提示</ThemedText>
              </View>
              <ScrollView style={styles.promptScroll} nestedScrollEnabled>
                <ThemedText variant="body" color={theme.textSecondary}>{prompt}</ThemedText>
              </ScrollView>
            </View>
            
            {/* 操作按钮 */}
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmButton, { borderColor: theme.border }]}
                onPress={handleBackToServices}
              >
                <ThemedText variant="label" color={theme.textSecondary}>返回</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmPrimary, { backgroundColor: theme.primary }]}
                onPress={handleConfirmCreate}
              >
                <FontAwesome6 name="paper-plane" size={14} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText variant="label" color="#fff">开始创作</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        );

      case 'creating':
      case 'result':
        return (
          <>
            {/* 项目标题 */}
            <View style={styles.modalInfo}>
              <ThemedText variant="h3" color={theme.textPrimary}>{project.title}</ThemedText>
              <ThemedText variant="label" color={theme.textMuted}>
                {createServices.find(s => s.id === selectedService)?.title}
              </ThemedText>
            </View>
            
            {/* 创作结果 */}
            <ScrollView style={styles.resultScroll} nestedScrollEnabled>
              {createdContent ? (
                <View style={[styles.resultContent, { backgroundColor: theme.backgroundTertiary }]}>
                  <ThemedText variant="body" color={theme.textPrimary}>{createdContent}</ThemedText>
                </View>
              ) : isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={{ opacity: typingAnim }}>
                    <View style={[styles.loadingDots, { backgroundColor: theme.primary }]}>
                      <ThemedText variant="body" color={theme.textSecondary}>AI 正在创作中</ThemedText>
                    </View>
                  </Animated.View>
                </View>
              ) : null}
              {isLoading && createdContent && (
                <ThemedText variant="body" color={theme.textMuted}>▌</ThemedText>
              )}
            </ScrollView>
            
            {/* 操作按钮 */}
            <View style={styles.confirmActions}>
              <TouchableOpacity 
                style={[styles.confirmButton, { borderColor: theme.border }]}
                onPress={handleRecreate}
                disabled={isLoading}
              >
                <FontAwesome6 name="rotate" size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
                <ThemedText variant="label" color={theme.textSecondary}>重新创作</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmPrimary, { backgroundColor: theme.success }]}
                onPress={handleSaveWork}
                disabled={isLoading || !createdContent}
              >
                <FontAwesome6 name="bookmark" size={14} color="#fff" style={{ marginRight: 6 }} />
                <ThemedText variant="label" color="#fff">保存</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.confirmPrimary, { backgroundColor: theme.primary }]}
                onPress={onClose}
              >
                <ThemedText variant="label" color="#fff">完成</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          {/* 封面图片 - 仅服务选择阶段显示 */}
          {stage === 'services' && (
            <>
              <Image 
                source={{ uri: imageUrl }}
                style={styles.modalImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', theme.backgroundDefault]}
                style={styles.modalImageGradient}
              />
            </>
          )}
          
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome6 name="xmark" size={20} color={stage === 'services' ? '#fff' : theme.textPrimary} />
          </TouchableOpacity>
          
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

export default function ProjectsScreen() {
  const { theme } = useTheme();
  const router = useSafeRouter();
  
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 按类型分组项目
  const groupedProjects = useMemo(() => {
    const projects = activeTab === 'all' 
      ? [...PROJECT_DATA.active, ...PROJECT_DATA.pending]
      : activeTab === 'active' 
        ? PROJECT_DATA.active 
        : PROJECT_DATA.pending;
    
    // 按类型分组
    const groups: Record<string, Project[]> = {};
    projects.forEach(project => {
      if (!groups[project.type]) {
        groups[project.type] = [];
      }
      groups[project.type].push(project);
    });
    
    return groups;
  }, [activeTab]);

  // 统计数据
  const stats = useMemo(() => ({
    active: PROJECT_DATA.active.length,
    pending: PROJECT_DATA.pending.length,
    total: PROJECT_DATA.active.length + PROJECT_DATA.pending.length,
  }), []);

  const handleProjectPress = (project: Project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  const tabs = [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'active', label: '进行中', count: stats.active },
    { key: 'pending', label: '待处理', count: stats.pending },
  ];

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="h4" color={theme.textPrimary}>
              项目仪表盘
            </ThemedText>
            <ThemedText variant="label" color={theme.textMuted}>
              创作工作空间
            </ThemedText>
          </View>
          {/* AI创作中心入口 */}
          <TouchableOpacity 
            style={styles.createCenterButton}
            onPress={() => router.push('/create')}
          >
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createCenterGradient}
            >
              <FontAwesome6 name="wand-magic-sparkles" size={14} color="#fff" />
              <ThemedText variant="captionMedium" color="#fff">AI创作中心</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.neonLine}
        />
      </View>

      {/* Tab 切换 */}
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { 
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              }
            ]}
            onPress={() => setActiveTab(tab.key as 'all' | 'active' | 'pending')}
          >
            <ThemedText 
              variant="labelSmall" 
              color={activeTab === tab.key ? '#fff' : theme.textMuted}
            >
              {tab.label}
            </ThemedText>
            <View style={[
              styles.tabCount,
              { backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : theme.backgroundTertiary }
            ]}>
              <ThemedText 
                variant="tiny" 
                color={activeTab === tab.key ? '#fff' : theme.textMuted}
              >
                {tab.count}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 分类项目列表 */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedProjects).map(([type, projects]) => (
          <View key={type} style={styles.categorySection}>
            {/* 分类标题 */}
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleWrap}>
                <View style={[
                  styles.categoryIcon, 
                  { backgroundColor: `${TYPE_CONFIG[type]?.gradient[0] || theme.primary}20` }
                ]}>
                  <FontAwesome6 
                    name={TYPE_CONFIG[type]?.icon as any || 'folder'} 
                    size={14} 
                    color={TYPE_CONFIG[type]?.gradient[0] || theme.primary} 
                  />
                </View>
                <ThemedText variant="label" color={theme.textPrimary}>{type}</ThemedText>
              </View>
              <ThemedText variant="captionMedium" color={theme.textMuted}>
                {projects.length} 个项目
              </ThemedText>
            </View>
            
            {/* 横向滚动卡片 */}
            <View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardsRow}
              >
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onPress={() => handleProjectPress(project)}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 项目详情Modal */}
      <ProjectDetailModal
        visible={modalVisible}
        project={selectedProject}
        onClose={() => setModalVisible(false)}
      />
    </Screen>
  );
}

// 组件内部样式
const styles = {
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  createCenterButton: {
    marginLeft: Spacing.md,
  },
  createCenterGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  neonLine: {
    height: 2,
    borderRadius: 1,
    marginTop: Spacing.lg,
    width: 120,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden' as const,
    marginRight: Spacing.md,
  },
  cardImage: {
    width: '100%' as const,
    height: '100%' as const,
    position: 'absolute' as const,
  },
  cardGradient: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  typeTag: {
    position: 'absolute' as const,
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  cardTitleWrap: {
    position: 'absolute' as const,
    bottom: 40,
    left: Spacing.md,
    right: Spacing.md,
  },
  cardProgress: {
    position: 'absolute' as const,
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%' as const,
    borderRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  tabCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['5xl'],
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.md,
  },
  categoryTitleWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  cardsRow: {
    paddingRight: Spacing.lg,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end' as const,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%' as const,
    minHeight: 400,
    overflow: 'hidden' as const,
  },
  modalImage: {
    width: '100%' as const,
    height: 200,
  },
  modalImageGradient: {
    position: 'absolute' as const,
    top: 150,
    left: 0,
    right: 0,
    height: 50,
  },
  closeButton: {
    position: 'absolute' as const,
    top: Spacing.lg,
    right: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalInfo: {
    padding: Spacing.lg,
  },
  modalTypeTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  modalStats: {
    flexDirection: 'row' as const,
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  modalStatItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  modalProgressWrap: {
    marginTop: Spacing.lg,
  },
  modalProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  modalProgressFill: {
    height: '100%' as const,
    borderRadius: 4,
  },
  modalServices: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  servicesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  serviceCard: {
    width: '47%' as const,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center' as const,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.sm,
  },
  // 新阶段样式
  promptPreview: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.3)',
    maxHeight: 200,
  },
  promptHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  promptScroll: {
    maxHeight: 150,
  },
  confirmActions: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  confirmPrimary: {
    borderWidth: 0,
  },
  resultScroll: {
    flex: 1,
    padding: Spacing.lg,
  },
  resultContent: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing['3xl'],
  },
  loadingDots: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
};
