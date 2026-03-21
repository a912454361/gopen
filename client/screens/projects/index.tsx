import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

interface Project {
  id: string;
  title: string;
  type: string;
  status: 'active' | 'pending';
  progress: number;
  assets: number;
  lastUpdated: string;
  coverImage?: string;
}

const mockProjects: Project[] = [
  // ═══════════════════════════════════════════════════════════
  // 进行中的项目（Active Projects）
  // ═══════════════════════════════════════════════════════════
  {
    id: '1',
    title: '山河入梦',
    type: '古风场景',
    status: 'active',
    progress: 92,
    assets: 56,
    lastUpdated: '刚刚',
  },
  {
    id: '2',
    title: '风月入怀',
    type: '古风角色',
    status: 'active',
    progress: 85,
    assets: 48,
    lastUpdated: '20分钟前',
  },
  {
    id: '3',
    title: '剑定山河',
    type: '国风热血',
    status: 'active',
    progress: 95,
    assets: 68,
    lastUpdated: '刚刚',
  },
  {
    id: '4',
    title: '血染苍穹',
    type: '国风热血',
    status: 'active',
    progress: 88,
    assets: 52,
    lastUpdated: '15分钟前',
  },
  {
    id: '5',
    title: '一纸江南',
    type: '水墨场景',
    status: 'active',
    progress: 78,
    assets: 42,
    lastUpdated: '35分钟前',
  },
  {
    id: '6',
    title: '战破九霄',
    type: '国风热血',
    status: 'active',
    progress: 82,
    assets: 46,
    lastUpdated: '30分钟前',
  },
  {
    id: '7',
    title: '长安旧梦',
    type: '国风城池',
    status: 'active',
    progress: 72,
    assets: 38,
    lastUpdated: '1小时前',
  },
  {
    id: '8',
    title: '一怒封神',
    type: '国风热血',
    status: 'active',
    progress: 75,
    assets: 44,
    lastUpdated: '1小时前',
  },
  {
    id: '9',
    title: '铁血丹心',
    type: '国风热血',
    status: 'active',
    progress: 70,
    assets: 40,
    lastUpdated: '1小时前',
  },
  {
    id: '10',
    title: '半盏清欢',
    type: '古风剧情',
    status: 'active',
    progress: 68,
    assets: 35,
    lastUpdated: '1小时前',
  },
  {
    id: '11',
    title: '横扫八荒',
    type: '国风热血',
    status: 'active',
    progress: 65,
    assets: 38,
    lastUpdated: '2小时前',
  },
  {
    id: '12',
    title: '青衫烟雨',
    type: '古风角色',
    status: 'active',
    progress: 65,
    assets: 32,
    lastUpdated: '2小时前',
  },
  {
    id: '13',
    title: '烽火连城',
    type: '国风热血',
    status: 'active',
    progress: 62,
    assets: 36,
    lastUpdated: '2小时前',
  },
  {
    id: '14',
    title: '气吞山河',
    type: '国风热血',
    status: 'active',
    progress: 58,
    assets: 34,
    lastUpdated: '2小时前',
  },
  {
    id: '15',
    title: '墨染山河',
    type: '水墨场景',
    status: 'active',
    progress: 58,
    assets: 28,
    lastUpdated: '2小时前',
  },
  {
    id: '16',
    title: '傲视九州',
    type: '国风热血',
    status: 'active',
    progress: 55,
    assets: 32,
    lastUpdated: '3小时前',
  },
  {
    id: '17',
    title: '破军天下',
    type: '国风热血',
    status: 'active',
    progress: 52,
    assets: 30,
    lastUpdated: '3小时前',
  },
  {
    id: '18',
    title: '醉卧红尘',
    type: '仙侠场景',
    status: 'active',
    progress: 55,
    assets: 26,
    lastUpdated: '3小时前',
  },
  {
    id: '19',
    title: '龙吟九天',
    type: '国风热血',
    status: 'active',
    progress: 48,
    assets: 28,
    lastUpdated: '4小时前',
  },
  {
    id: '20',
    title: '浮生若梦',
    type: '古风剧情',
    status: 'active',
    progress: 52,
    assets: 24,
    lastUpdated: '3小时前',
  },
  {
    id: '21',
    title: '策马江湖',
    type: '国风热血',
    status: 'active',
    progress: 45,
    assets: 26,
    lastUpdated: '4小时前',
  },
  {
    id: '22',
    title: '清风渡月',
    type: '古风场景',
    status: 'active',
    progress: 48,
    assets: 22,
    lastUpdated: '4小时前',
  },
  {
    id: '23',
    title: '锋芒毕露',
    type: '国风热血',
    status: 'active',
    progress: 42,
    assets: 24,
    lastUpdated: '5小时前',
  },
  {
    id: '24',
    title: '百战封神',
    type: '国风热血',
    status: 'active',
    progress: 38,
    assets: 22,
    lastUpdated: '5小时前',
  },
  {
    id: '25',
    title: '墨色流年',
    type: '水墨场景',
    status: 'active',
    progress: 45,
    assets: 20,
    lastUpdated: '5小时前',
  },
  {
    id: '26',
    title: '赤胆忠魂',
    type: '国风热血',
    status: 'active',
    progress: 35,
    assets: 20,
    lastUpdated: '6小时前',
  },
  {
    id: '27',
    title: '山河无恙',
    type: '国风场景',
    status: 'active',
    progress: 42,
    assets: 18,
    lastUpdated: '5小时前',
  },
  {
    id: '28',
    title: '逐鹿中原',
    type: '国风热血',
    status: 'active',
    progress: 32,
    assets: 18,
    lastUpdated: '6小时前',
  },
  {
    id: '29',
    title: '霓虹武士',
    type: '游戏角色',
    status: 'active',
    progress: 75,
    assets: 24,
    lastUpdated: '2小时前',
  },
  {
    id: '30',
    title: '万夫莫敌',
    type: '国风热血',
    status: 'active',
    progress: 28,
    assets: 16,
    lastUpdated: '8小时前',
  },
  {
    id: '31',
    title: '剑啸长空',
    type: '国风热血',
    status: 'active',
    progress: 25,
    assets: 14,
    lastUpdated: '8小时前',
  },
  {
    id: '32',
    title: '赛博城市',
    type: '动漫场景',
    status: 'active',
    progress: 45,
    assets: 12,
    lastUpdated: '5小时前',
  },
  // ═══════════════════════════════════════════════════════════
  // 待处理项目（Pending Projects）
  // ═══════════════════════════════════════════════════════════
  {
    id: '33',
    title: '烽火再起',
    type: '国风热血',
    status: 'pending',
    progress: 22,
    assets: 12,
    lastUpdated: '10小时前',
  },
  {
    id: '34',
    title: '君临天下',
    type: '国风热血',
    status: 'pending',
    progress: 18,
    assets: 10,
    lastUpdated: '12小时前',
  },
  {
    id: '35',
    title: '剑指苍穹',
    type: '国风热血',
    status: 'pending',
    progress: 15,
    assets: 8,
    lastUpdated: '1天前',
  },
  {
    id: '36',
    title: '逆战乾坤',
    type: '国风热血',
    status: 'pending',
    progress: 12,
    assets: 6,
    lastUpdated: '1天前',
  },
  {
    id: '37',
    title: '国风拾遗',
    type: '古风剧情',
    status: 'pending',
    progress: 38,
    assets: 16,
    lastUpdated: '6小时前',
  },
  {
    id: '38',
    title: '破阵无双',
    type: '国风热血',
    status: 'pending',
    progress: 10,
    assets: 5,
    lastUpdated: '1天前',
  },
  {
    id: '39',
    title: '战魂不灭',
    type: '国风热血',
    status: 'pending',
    progress: 8,
    assets: 4,
    lastUpdated: '2天前',
  },
  {
    id: '40',
    title: '铁血战歌',
    type: '国风热血',
    status: 'pending',
    progress: 5,
    assets: 3,
    lastUpdated: '2天前',
  },
  {
    id: '41',
    title: '古韵今声',
    type: '国风角色',
    status: 'pending',
    progress: 35,
    assets: 15,
    lastUpdated: '8小时前',
  },
  {
    id: '42',
    title: '怒斩乾坤',
    type: '国风热血',
    status: 'pending',
    progress: 3,
    assets: 2,
    lastUpdated: '2天前',
  },
  {
    id: '43',
    title: '盖世英豪',
    type: '国风热血',
    status: 'pending',
    progress: 2,
    assets: 2,
    lastUpdated: '3天前',
  },
  {
    id: '44',
    title: '东方雅集',
    type: '古风场景',
    status: 'pending',
    progress: 32,
    assets: 14,
    lastUpdated: '8小时前',
  },
  {
    id: '45',
    title: '万敌不侵',
    type: '国风热血',
    status: 'pending',
    progress: 1,
    assets: 1,
    lastUpdated: '3天前',
  },
  {
    id: '46',
    title: '烽火狼烟',
    type: '国风热血',
    status: 'pending',
    progress: 1,
    assets: 1,
    lastUpdated: '3天前',
  },
  {
    id: '47',
    title: '人间归客',
    type: '古风角色',
    status: 'pending',
    progress: 30,
    assets: 12,
    lastUpdated: '10小时前',
  },
  {
    id: '48',
    title: '仗剑天涯',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '49',
    title: '血战八方',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '50',
    title: '威震九州',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '51',
    title: '华夏风骨',
    type: '国风场景',
    status: 'pending',
    progress: 28,
    assets: 11,
    lastUpdated: '12小时前',
  },
  {
    id: '52',
    title: '一剑惊鸿',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '53',
    title: '侠骨战魂',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '54',
    title: '千年一韵',
    type: '古风剧情',
    status: 'pending',
    progress: 25,
    assets: 10,
    lastUpdated: '1天前',
  },
  {
    id: '55',
    title: '问鼎苍穹',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '56',
    title: '战意凌云',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '57',
    title: '修罗战场',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '58',
    title: '枕雪听风',
    type: '古风场景',
    status: 'pending',
    progress: 22,
    assets: 9,
    lastUpdated: '1天前',
  },
  {
    id: '59',
    title: '龙战于野',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '60',
    title: '锋芒盖世',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '61',
    title: '水墨东方',
    type: '水墨场景',
    status: 'pending',
    progress: 20,
    assets: 8,
    lastUpdated: '1天前',
  },
  {
    id: '62',
    title: '以战止战',
    type: '国风热血',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '63',
    title: '云深不知处',
    type: '仙侠场景',
    status: 'pending',
    progress: 18,
    assets: 7,
    lastUpdated: '1天前',
  },
  {
    id: '64',
    title: '雅韵风华',
    type: '古风角色',
    status: 'pending',
    progress: 15,
    assets: 6,
    lastUpdated: '2天前',
  },
  {
    id: '65',
    title: '山河长歌',
    type: '国风场景',
    status: 'pending',
    progress: 12,
    assets: 5,
    lastUpdated: '2天前',
  },
  {
    id: '66',
    title: '清欢渡余生',
    type: '古风剧情',
    status: 'pending',
    progress: 10,
    assets: 4,
    lastUpdated: '2天前',
  },
  {
    id: '67',
    title: '机甲战士',
    type: '游戏角色',
    status: 'pending',
    progress: 20,
    assets: 6,
    lastUpdated: '1天前',
  },
  {
    id: '68',
    title: '森林精灵',
    type: '动漫场景',
    status: 'pending',
    progress: 10,
    assets: 3,
    lastUpdated: '2天前',
  },
  // ═══════════════════════════════════════════════════════════
  // 唯美风项目组（Aesthetic Style）
  // ═══════════════════════════════════════════════════════════
  {
    id: '69',
    title: '烟雨江南',
    type: '唯美风',
    status: 'active',
    progress: 92,
    assets: 45,
    lastUpdated: '刚刚',
  },
  {
    id: '70',
    title: '云裳羽衣',
    type: '唯美风',
    status: 'active',
    progress: 88,
    assets: 42,
    lastUpdated: '10分钟前',
  },
  {
    id: '71',
    title: '青丝挽风',
    type: '唯美风',
    status: 'active',
    progress: 85,
    assets: 40,
    lastUpdated: '15分钟前',
  },
  {
    id: '72',
    title: '月下倾城',
    type: '唯美风',
    status: 'active',
    progress: 82,
    assets: 38,
    lastUpdated: '20分钟前',
  },
  {
    id: '73',
    title: '墨染芳华',
    type: '唯美风',
    status: 'active',
    progress: 78,
    assets: 36,
    lastUpdated: '25分钟前',
  },
  {
    id: '74',
    title: '醉卧花间',
    type: '唯美风',
    status: 'active',
    progress: 75,
    assets: 35,
    lastUpdated: '30分钟前',
  },
  {
    id: '75',
    title: '清颜素衣',
    type: '唯美风',
    status: 'active',
    progress: 72,
    assets: 33,
    lastUpdated: '35分钟前',
  },
  {
    id: '76',
    title: '长安故梦',
    type: '唯美风',
    status: 'active',
    progress: 68,
    assets: 32,
    lastUpdated: '40分钟前',
  },
  {
    id: '77',
    title: '风拂玉簪',
    type: '唯美风',
    status: 'active',
    progress: 65,
    assets: 30,
    lastUpdated: '45分钟前',
  },
  {
    id: '78',
    title: '竹影青衫',
    type: '唯美风',
    status: 'active',
    progress: 62,
    assets: 28,
    lastUpdated: '50分钟前',
  },
  {
    id: '79',
    title: '落花盈袖',
    type: '唯美风',
    status: 'active',
    progress: 58,
    assets: 26,
    lastUpdated: '1小时前',
  },
  {
    id: '80',
    title: '浅黛微妆',
    type: '唯美风',
    status: 'active',
    progress: 55,
    assets: 25,
    lastUpdated: '1小时前',
  },
  {
    id: '81',
    title: '枕月听霜',
    type: '唯美风',
    status: 'active',
    progress: 52,
    assets: 24,
    lastUpdated: '1小时前',
  },
  {
    id: '82',
    title: '琼枝玉树',
    type: '唯美风',
    status: 'active',
    progress: 48,
    assets: 22,
    lastUpdated: '2小时前',
  },
  {
    id: '83',
    title: '红袖添香',
    type: '唯美风',
    status: 'active',
    progress: 45,
    assets: 20,
    lastUpdated: '2小时前',
  },
  {
    id: '84',
    title: '云水禅心',
    type: '唯美风',
    status: 'active',
    progress: 42,
    assets: 18,
    lastUpdated: '2小时前',
  },
  {
    id: '85',
    title: '素衣惊鸿',
    type: '唯美风',
    status: 'active',
    progress: 38,
    assets: 16,
    lastUpdated: '3小时前',
  },
  {
    id: '86',
    title: '清风入画',
    type: '唯美风',
    status: 'active',
    progress: 35,
    assets: 15,
    lastUpdated: '3小时前',
  },
  {
    id: '87',
    title: '瑶台月下',
    type: '唯美风',
    status: 'active',
    progress: 32,
    assets: 14,
    lastUpdated: '4小时前',
  },
  {
    id: '88',
    title: '温婉如初',
    type: '唯美风',
    status: 'active',
    progress: 28,
    assets: 12,
    lastUpdated: '5小时前',
  },
  // --- 仙侠唯美 ---
  {
    id: '89',
    title: '云间仙客',
    type: '仙侠唯美',
    status: 'active',
    progress: 90,
    assets: 48,
    lastUpdated: '刚刚',
  },
  {
    id: '90',
    title: '月下谪仙',
    type: '仙侠唯美',
    status: 'active',
    progress: 85,
    assets: 44,
    lastUpdated: '15分钟前',
  },
  {
    id: '91',
    title: '清梦星河',
    type: '仙侠唯美',
    status: 'active',
    progress: 78,
    assets: 40,
    lastUpdated: '30分钟前',
  },
  {
    id: '92',
    title: '雾隐仙踪',
    type: '仙侠唯美',
    status: 'active',
    progress: 72,
    assets: 36,
    lastUpdated: '45分钟前',
  },
  {
    id: '93',
    title: '瑶台清影',
    type: '仙侠唯美',
    status: 'active',
    progress: 65,
    assets: 32,
    lastUpdated: '1小时前',
  },
  {
    id: '94',
    title: '星河入梦',
    type: '仙侠唯美',
    status: 'active',
    progress: 58,
    assets: 28,
    lastUpdated: '2小时前',
  },
  {
    id: '95',
    title: '清风揽月',
    type: '仙侠唯美',
    status: 'active',
    progress: 52,
    assets: 25,
    lastUpdated: '2小时前',
  },
  {
    id: '96',
    title: '仙姿玉貌',
    type: '仙侠唯美',
    status: 'active',
    progress: 45,
    assets: 22,
    lastUpdated: '3小时前',
  },
  {
    id: '97',
    title: '雾里看花',
    type: '仙侠唯美',
    status: 'active',
    progress: 38,
    assets: 18,
    lastUpdated: '4小时前',
  },
  {
    id: '98',
    title: '青岚入梦',
    type: '仙侠唯美',
    status: 'active',
    progress: 32,
    assets: 15,
    lastUpdated: '5小时前',
  },
  // --- 待处理唯美风 ---
  {
    id: '99',
    title: '琼楼玉宇',
    type: '仙侠唯美',
    status: 'pending',
    progress: 28,
    assets: 14,
    lastUpdated: '6小时前',
  },
  {
    id: '100',
    title: '碧落凡尘',
    type: '仙侠唯美',
    status: 'pending',
    progress: 25,
    assets: 12,
    lastUpdated: '8小时前',
  },
  {
    id: '101',
    title: '雪落无尘',
    type: '唯美风',
    status: 'pending',
    progress: 22,
    assets: 11,
    lastUpdated: '10小时前',
  },
  {
    id: '102',
    title: '云深归仙',
    type: '仙侠唯美',
    status: 'pending',
    progress: 18,
    assets: 10,
    lastUpdated: '12小时前',
  },
  {
    id: '103',
    title: '醉揽星河',
    type: '仙侠唯美',
    status: 'pending',
    progress: 15,
    assets: 8,
    lastUpdated: '1天前',
  },
  {
    id: '104',
    title: '仙音缥缈',
    type: '仙侠唯美',
    status: 'pending',
    progress: 12,
    assets: 6,
    lastUpdated: '1天前',
  },
  {
    id: '105',
    title: '不染尘烟',
    type: '唯美风',
    status: 'pending',
    progress: 10,
    assets: 5,
    lastUpdated: '1天前',
  },
  {
    id: '106',
    title: '月照仙裳',
    type: '仙侠唯美',
    status: 'pending',
    progress: 8,
    assets: 4,
    lastUpdated: '2天前',
  },
  // --- 仙途问道系列 ---
  {
    id: '107',
    title: '御剑凌霄',
    type: '仙侠唯美',
    status: 'pending',
    progress: 5,
    assets: 3,
    lastUpdated: '2天前',
  },
  {
    id: '108',
    title: '扶摇九天',
    type: '仙侠唯美',
    status: 'pending',
    progress: 3,
    assets: 2,
    lastUpdated: '2天前',
  },
  {
    id: '109',
    title: '星落凡尘',
    type: '仙侠唯美',
    status: 'pending',
    progress: 2,
    assets: 2,
    lastUpdated: '3天前',
  },
  {
    id: '110',
    title: '云深寻仙',
    type: '仙侠唯美',
    status: 'pending',
    progress: 1,
    assets: 1,
    lastUpdated: '3天前',
  },
  {
    id: '111',
    title: '清霄揽月',
    type: '仙侠唯美',
    status: 'pending',
    progress: 1,
    assets: 1,
    lastUpdated: '3天前',
  },
  {
    id: '112',
    title: '灵汐入梦',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '113',
    title: '碧落星河',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '114',
    title: '紫霄仙阙',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '115',
    title: '尘缘仙梦',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '116',
    title: '霜华染衣',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '117',
    title: '灵韵天成',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '118',
    title: '青冥逐月',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '119',
    title: '仙途问道',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '120',
    title: '不染尘嚣',
    type: '唯美风',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '121',
    title: '瑶光映雪',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '122',
    title: '星河长庚',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '123',
    title: '风渡仙山',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '124',
    title: '素影清寒',
    type: '唯美风',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '125',
    title: '云汐逐月',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
  {
    id: '126',
    title: '醉枕星河',
    type: '仙侠唯美',
    status: 'pending',
    progress: 0,
    assets: 0,
    lastUpdated: '待启动',
  },
];

export default function ProjectsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const activeProjects = mockProjects.filter(p => p.status === 'active');
  const pendingProjects = mockProjects.filter(p => p.status === 'pending');
  const totalAssets = mockProjects.reduce((acc, p) => acc + p.assets, 0);

  const handleProjectPress = (project: Project) => {
    router.push('/workflow', { projectId: project.id, title: project.title });
  };

  const handleCreateProject = () => {
    if (Platform.OS === 'web') {
      window.alert('新建项目功能即将上线');
    } else {
      Alert.alert('提示', '新建项目功能即将上线');
    }
  };

  const handleViewAll = () => {
    if (Platform.OS === 'web') {
      window.alert('查看全部项目功能即将上线');
    } else {
      Alert.alert('提示', '查看全部项目功能即将上线');
    }
  };

  const handleStatPress = (type: 'active' | 'pending' | 'assets') => {
    if (type === 'active') {
      // 滚动到进行中项目
      if (Platform.OS === 'web') {
        window.alert(`进行中的项目：${activeProjects.length} 个\n${activeProjects.map(p => p.title).join('\n')}`);
      } else {
        Alert.alert('进行中的项目', activeProjects.map(p => `${p.title} (${p.progress}%)`).join('\n'));
      }
    } else if (type === 'pending') {
      // 显示待处理项目
      if (Platform.OS === 'web') {
        window.alert(`待处理项目：${pendingProjects.length} 个\n${pendingProjects.map(p => p.title).join('\n')}`);
      } else {
        Alert.alert('待处理项目', pendingProjects.map(p => `${p.title} (${p.progress}%)`).join('\n'));
      }
    } else if (type === 'assets') {
      // 显示资源统计
      const assetList = mockProjects.map(p => `${p.title}: ${p.assets} 个资源`);
      if (Platform.OS === 'web') {
        window.alert(`总资源数：${totalAssets} 个\n${assetList.join('\n')}`);
      } else {
        Alert.alert('资源统计', assetList.join('\n'));
      }
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h4" color={theme.textPrimary}>
            项目仪表盘
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>
            创作工作空间
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, styles.statCardActive]} onPress={() => handleStatPress('active')}>
            <FontAwesome6 name="circle-play" size={20} color={theme.primary} />
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              进行中
            </ThemedText>
            <ThemedText variant="stat" color={theme.primary}>
              {activeProjects.length}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('pending')}>
            <FontAwesome6 name="clock" size={20} color={theme.accent} />
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              待处理
            </ThemedText>
            <ThemedText variant="stat" color={theme.textPrimary}>
              {pendingProjects.length}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('assets')}>
            <FontAwesome6 name="cube" size={20} color={theme.textMuted} />
            <ThemedText variant="labelSmall" color={theme.textMuted}>
              总资源
            </ThemedText>
            <ThemedText variant="stat" color={theme.textPrimary}>
              {totalAssets}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Active Projects */}
        <View style={styles.sectionHeader}>
          <ThemedText variant="label" color={theme.textPrimary}>
            进行中的项目
          </ThemedText>
          <TouchableOpacity onPress={handleViewAll}>
            <ThemedText variant="captionMedium" color={theme.primary}>
              查看全部
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.projectList}>
          {activeProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[styles.projectCard, styles.projectCardActive]}
              activeOpacity={0.7}
              onPress={() => handleProjectPress(project)}
            >
              {/* Project Header */}
              <View style={styles.projectHeader}>
                <View style={styles.projectIcon}>
                  <FontAwesome6 
                    name={project.type.includes('角色') ? 'user-astronaut' : 'city'} 
                    size={20} 
                    color={theme.primary} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="title" color={theme.textPrimary}>
                    {project.title}
                  </ThemedText>
                  <ThemedText variant="labelSmall" color={theme.textMuted}>
                    {project.type}
                  </ThemedText>
                </View>
                <View style={styles.projectStatus}>
                  <FontAwesome6 name="circle" size={6} color={theme.success} />
                  <ThemedText variant="tiny" color={theme.success}>
                    进行中
                  </ThemedText>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.projectProgress}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={[theme.primary, theme.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${project.progress}%` }]}
                  />
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>
                  已完成 {project.progress}%
                </ThemedText>
              </View>

              {/* Meta Info */}
              <View style={styles.projectMeta}>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="cube" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {project.assets} 资源
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {project.lastUpdated}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Projects */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <ThemedText variant="label" color={theme.textPrimary}>
            待处理项目
          </ThemedText>
        </View>
        
        <View style={styles.projectList}>
          {pendingProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              activeOpacity={0.7}
              onPress={() => handleProjectPress(project)}
            >
              {/* Project Header */}
              <View style={styles.projectHeader}>
                <View style={[styles.projectIcon, { backgroundColor: theme.backgroundTertiary }]}>
                  <FontAwesome6 
                    name={project.type.includes('角色') ? 'user-astronaut' : 'city'} 
                    size={20} 
                    color={theme.textMuted} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="title" color={theme.textPrimary}>
                    {project.title}
                  </ThemedText>
                  <ThemedText variant="labelSmall" color={theme.textMuted}>
                    {project.type}
                  </ThemedText>
                </View>
                <View style={[styles.projectStatus, { backgroundColor: 'rgba(191,0,255,0.1)' }]}>
                  <FontAwesome6 name="clock" size={6} color={theme.accent} />
                  <ThemedText variant="tiny" color={theme.accent}>
                    待处理
                  </ThemedText>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.projectProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFillPlain, { width: `${project.progress}%`, backgroundColor: theme.textMuted }]} />
                </View>
                <ThemedText variant="caption" color={theme.textMuted}>
                  已完成 {project.progress}%
                </ThemedText>
              </View>

              {/* Meta Info */}
              <View style={styles.projectMeta}>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="cube" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {project.assets} 资源
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {project.lastUpdated}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create New Button */}
        <TouchableOpacity style={styles.createButton} activeOpacity={0.8} onPress={handleCreateProject}>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.sm,
              padding: Spacing.lg,
              borderRadius: BorderRadius.md,
            }}
          >
            <FontAwesome6 name="plus" size={16} color={theme.backgroundRoot} />
            <ThemedText variant="labelTitle" color={theme.backgroundRoot}>
              新建项目
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
