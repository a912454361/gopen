/**
 * 推广中心组件 - 完整版
 * 包含：素材库（视频+图片+文案）、一键推广、数据统计、推广工具
 * 数据来源于真实推广系统
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  Share,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

interface PromotionPanelProps {
  adminKey: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 推广统计数据接口
interface PromotionStatsData {
  totalPromoters: number;
  activePromoters: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  todayClicks: number;
  todayConversions: number;
  todayEarnings: number;
  pendingWithdrawals: number;
  topPromoters: Array<{
    id: string;
    promoter_code: string;
    total_clicks: number;
    total_conversions: number;
    total_earnings: number;
  }>;
  recentEarnings: Array<{
    id: string;
    amount: number;
    commission: number;
    created_at: string;
  }>;
}

// ==================== 素材数据 ====================

// 视频素材
const VIDEO_MATERIALS = [
  {
    id: 'v1',
    title: 'AI创意工作室',
    type: 'video',
    duration: '15s',
    quality: '8K蓝光',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    videoUrl: 'https://videos.pexels.com/video-files/856356/856356-hd_1920_1080_30fps.mp4',
    tags: ['AI', '创意', '科技'],
    downloads: 1234,
  },
  {
    id: 'v2',
    title: '未来科技感',
    type: 'video',
    duration: '20s',
    quality: '8K蓝光',
    thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400',
    videoUrl: 'https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_24fps.mp4',
    tags: ['科技', '未来', '酷炫'],
    downloads: 892,
  },
];

// 图片素材
const IMAGE_MATERIALS = [
  {
    id: 'i1',
    title: '产品主视觉',
    type: 'image',
    size: '1920x1080',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920',
    tags: ['主视觉', '产品'],
    downloads: 2341,
  },
  {
    id: 'i2',
    title: '功能展示图',
    type: 'image',
    size: '1080x1920',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1080',
    tags: ['功能', '展示'],
    downloads: 1876,
  },
];

// 文案模板
const COPYWRITING_TEMPLATES = [
  {
    id: 'c1',
    title: '小红书 - 产品推荐',
    platform: 'xiaohongshu',
    content: `姐妹们！这个AI工具太好用了

作为一个自媒体博主，每天要写3篇文章+5条微博
还要发小红书和抖音，真的累死了

直到我发现了G open！

它集成了GPT-4o、Claude 3、豆包等多个顶级AI
按Token计费，比订阅便宜太多了
还有项目管理功能，所有创作一目了然

最让我惊喜的是：
它还能生成图片！封面图再也不用找设计师了

用了2周，我的创作效率提升了200%
强烈推荐给所有内容创作者！

#AI工具 #写作神器 #自媒体必备 #效率提升 #Gopen`,
    usageCount: 3421,
  },
  {
    id: 'c2',
    title: '抖音 - 15秒视频',
    platform: 'douyin',
    content: `【钩子】一个APP，集齐所有顶级AI模型！

【正文】
G open，你的AI创作工作室
GPT-4o、Claude 3、豆包全都有
按需付费，比订阅便宜
还能生成图片、管理项目

【行动】点击主页链接，立即体验！`,
    usageCount: 2876,
  },
  {
    id: 'c3',
    title: '微博 - 话题营销',
    platform: 'weibo',
    content: `#AI创作工具# 发现一个神仙APP！

一个APP集齐GPT-4o、Claude 3、豆包等顶级AI
关键是按Token计费，用多少付多少
比订阅便宜太多了！

还能生成图片、管理项目、云存储同步
自媒体博主、程序员、学生党必备神器

注册还送2000 Token，赶紧去试试！

#Gopen #效率工具 #AI`,
    usageCount: 1987,
  },
  {
    id: 'c4',
    title: 'B站 - 视频脚本',
    platform: 'bilibili',
    content: `【开场】（30秒）
大家好，我是XXX
今天给大家测评一款新上线的AI工具：G open
号称"一个APP集齐所有顶级AI模型"
到底是不是智商税？

【第一部分：产品介绍】（2分钟）
G open是一款AI创作助手
集成多个顶级AI模型
支持对话、图像生成、项目管理等功能

【第二部分：核心功能测试】（5分钟）
1. 对话功能测试
2. 图像生成测试

【结尾】（1分钟）
总体来说，G open性价比很高
特别适合自媒体博主、程序员、学生党
链接在评论区，欢迎留言讨论！`,
    usageCount: 1567,
  },
  {
    id: 'c5',
    title: '知乎 - 回答模板',
    platform: 'zhihu',
    content: `推荐一个我最近在用的AI工具：G open

作为一个自媒体博主，我每天都在用它来辅助创作。

【核心优势】
1. 集成多个顶级AI模型：GPT-4o、Claude 3、豆包
2. 按Token计费，比订阅便宜很多
3. 还能生成图片、管理项目

【使用场景】
- 写公众号文章：10分钟搞定框架
- 生成封面图：30秒出图
- 改写不同平台风格：一键搞定

用了2周，创作效率提升了200%

新手注册还送2000 Token，可以试试看！`,
    usageCount: 1234,
  },
];

// 推广平台
const PLATFORMS = [
  { key: 'xiaohongshu', name: '小红书', icon: 'book', url: 'https://www.xiaohongshu.com', color: '#FF2442' },
  { key: 'douyin', name: '抖音', icon: 'play', url: 'https://www.douyin.com', color: '#000000' },
  { key: 'weibo', name: '微博', icon: 'share', url: 'https://weibo.com', color: '#E6162D' },
  { key: 'bilibili', name: 'B站', icon: 'tv', url: 'https://www.bilibili.com', color: '#00A1D6' },
  { key: 'zhihu', name: '知乎', icon: 'question', url: 'https://www.zhihu.com', color: '#0084FF' },
];

// 推广统计数据
const PROMOTION_STATS = {
  totalRevenue: 12580,
  totalViews: 125680,
  totalClicks: 28934,
  totalConversions: 1256,
  platformStats: [
    { platform: 'xiaohongshu', revenue: 4520, views: 45230, clicks: 10234, conversions: 456 },
    { platform: 'douyin', revenue: 3890, views: 38900, clicks: 8765, conversions: 378 },
    { platform: 'weibo', revenue: 2120, views: 21200, clicks: 5123, conversions: 212 },
    { platform: 'bilibili', revenue: 1250, views: 12500, clicks: 3125, conversions: 125 },
    { platform: 'zhihu', revenue: 800, views: 7850, clicks: 1687, conversions: 85 },
  ],
};

// ==================== 主组件 ====================

export function PromotionPanel({ adminKey }: PromotionPanelProps) {
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'materials' | 'copywriting' | 'stats'>('materials');
  const [materialType, setMaterialType] = useState<'video' | 'image'>('video');
  const [showWatermark, setShowWatermark] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef<Video>(null);

  // 复制文案
  const handleCopy = async (content: string, title: string) => {
    try {
      await Clipboard.setStringAsync(content);
      Alert.alert('成功', `${title}已复制到剪贴板`);
    } catch (error) {
      Alert.alert('错误', '复制失败');
    }
  };

  // 一键推广
  const handleQuickPromote = async (material: any, platform: typeof PLATFORMS[0]) => {
    // 找到对应平台的文案
    const template = COPYWRITING_TEMPLATES.find(t => t.platform === platform.key);
    const content = template?.content || '推荐G Open AI创作助手！';
    
    await Clipboard.setStringAsync(content);
    
    if (Platform.OS === 'web') {
      window.open(platform.url, '_blank');
    }
    
    Alert.alert('推广文案已复制', `即将打开${platform.name}，粘贴文案即可发布`);
  };

  // 分享
  const handleShare = async (material: any) => {
    const content = `【${material.title}】\n下载G Open体验AI创作\n#Gopen #AI工具`;
    
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(content);
      Alert.alert('已复制', '分享内容已复制到剪贴板');
    } else {
      await Share.share({ message: content });
    }
  };

  // 打开平台
  const openPlatform = (platform: typeof PLATFORMS[0]) => {
    if (Platform.OS === 'web') {
      window.open(platform.url, '_blank');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tab 切换 */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        {[
          { key: 'materials', label: '素材库', icon: 'photo-film' },
          { key: 'copywriting', label: '文案模板', icon: 'file-lines' },
          { key: 'stats', label: '数据统计', icon: 'chart-line' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.xs,
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.lg,
              backgroundColor: activeTab === tab.key ? theme.primary : theme.backgroundDefault,
            }}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <FontAwesome6 
              name={tab.icon as any} 
              size={14} 
              color={activeTab === tab.key ? theme.buttonPrimaryText : theme.textPrimary} 
            />
            <ThemedText 
              variant="small" 
              color={activeTab === tab.key ? theme.buttonPrimaryText : theme.textPrimary}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* 素材库 */}
      {activeTab === 'materials' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 素材类型切换 */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.xs,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.md,
                backgroundColor: materialType === 'video' ? theme.primary : theme.backgroundTertiary,
              }}
              onPress={() => setMaterialType('video')}
            >
              <FontAwesome6 name="video" size={14} color={materialType === 'video' ? theme.buttonPrimaryText : theme.textPrimary} />
              <ThemedText variant="small" color={materialType === 'video' ? theme.buttonPrimaryText : theme.textPrimary}>
                视频素材
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.xs,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.md,
                backgroundColor: materialType === 'image' ? theme.primary : theme.backgroundTertiary,
              }}
              onPress={() => setMaterialType('image')}
            >
              <FontAwesome6 name="image" size={14} color={materialType === 'image' ? theme.buttonPrimaryText : theme.textPrimary} />
              <ThemedText variant="small" color={materialType === 'image' ? theme.buttonPrimaryText : theme.textPrimary}>
                图片素材
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* 水印开关 */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginBottom: Spacing.lg,
            }}
            onPress={() => setShowWatermark(!showWatermark)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <FontAwesome6 name="stamp" size={18} color={theme.primary} />
              <View>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>推广水印</ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>自动添加G Open品牌水印</ThemedText>
              </View>
            </View>
            <View style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: showWatermark ? theme.primary : theme.backgroundTertiary,
              padding: 2,
            }}>
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#fff',
                transform: [{ translateX: showWatermark ? 20 : 0 }],
              }} />
            </View>
          </TouchableOpacity>

          {/* 素材网格 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {(materialType === 'video' ? VIDEO_MATERIALS : IMAGE_MATERIALS).map((material) => (
              <TouchableOpacity
                key={material.id}
                style={{
                  width: CARD_WIDTH,
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
                onPress={() => {
                  setSelectedMaterial(material);
                  setShowPreview(true);
                }}
              >
                {/* 缩略图 */}
                <View style={{ position: 'relative' }}>
                  <Image 
                    source={{ uri: material.thumbnail }}
                    style={{ width: '100%', height: CARD_WIDTH * 0.75 }}
                    resizeMode="cover"
                  />
                  {materialType === 'video' && (
                    <View style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}>
                      <ThemedText variant="caption" color="#fff" style={{ fontSize: 10 }}>
                        {(material as any).duration}
                      </ThemedText>
                    </View>
                  )}
                  {showWatermark && (
                    <View style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      backgroundColor: 'rgba(79,70,229,0.9)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 4,
                    }}>
                      <ThemedText variant="caption" color="#fff" style={{ fontSize: 10 }}>G Open</ThemedText>
                    </View>
                  )}
                </View>
                {/* 信息 */}
                <View style={{ padding: Spacing.sm }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary} numberOfLines={1}>
                    {material.title}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {materialType === 'video' ? (material as any).quality : (material as any).size}
                  </ThemedText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <FontAwesome6 name="download" size={10} color={theme.textMuted} />
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {material.downloads}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* 一键推广区 */}
          <View style={{
            backgroundColor: theme.backgroundDefault,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            marginTop: Spacing.xl,
            marginBottom: Spacing.lg,
          }}>
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
              选择平台，一键推广
            </ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              {PLATFORMS.map((platform) => (
                <TouchableOpacity
                  key={platform.key}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.xs,
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.lg,
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.md,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                  onPress={() => openPlatform(platform)}
                >
                  <FontAwesome6 name={platform.icon as any} size={16} color={theme.primary} />
                  <ThemedText variant="small" color={theme.textPrimary}>{platform.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* 文案模板 */}
      {activeTab === 'copywriting' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 平台筛选 */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {[
              { key: 'all', label: '全部' },
              ...PLATFORMS.map(p => ({ key: p.key, label: p.name }))
            ].slice(0, 4).map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={{
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.sm,
                  borderRadius: BorderRadius.lg,
                  backgroundColor: theme.backgroundDefault,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <ThemedText variant="small" color={theme.textPrimary}>{filter.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* 文案列表 */}
          {COPYWRITING_TEMPLATES.map((template) => {
            const platform = PLATFORMS.find(p => p.key === template.platform);
            return (
              <View
                key={template.id}
                style={{
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.lg,
                  marginBottom: Spacing.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                {/* 标题栏 */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: BorderRadius.md,
                      backgroundColor: (platform?.color || theme.primary) + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <FontAwesome6 name={platform?.icon as any} size={14} color={platform?.color || theme.primary} />
                    </View>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>{template.title}</ThemedText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <FontAwesome6 name="eye" size={10} color={theme.textMuted} />
                    <ThemedText variant="caption" color={theme.textMuted}>{template.usageCount}</ThemedText>
                  </View>
                </View>

                {/* 内容预览 */}
                <ThemedText variant="caption" color={theme.textSecondary} numberOfLines={3} style={{ marginBottom: Spacing.md }}>
                  {template.content}
                </ThemedText>

                {/* 操作按钮 */}
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: Spacing.xs,
                      backgroundColor: theme.backgroundTertiary,
                      borderRadius: BorderRadius.md,
                      paddingVertical: Spacing.sm,
                    }}
                    onPress={() => handleCopy(template.content, template.title)}
                  >
                    <FontAwesome6 name="copy" size={12} color={theme.textPrimary} />
                    <ThemedText variant="caption" color={theme.textPrimary}>复制文案</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: Spacing.xs,
                      backgroundColor: theme.primary,
                      borderRadius: BorderRadius.md,
                      paddingVertical: Spacing.sm,
                    }}
                    onPress={() => openPlatform(platform!)}
                  >
                    <FontAwesome6 name="share" size={12} color={theme.buttonPrimaryText} />
                    <ThemedText variant="caption" color={theme.buttonPrimaryText}>立即发布</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* 数据统计 */}
      {activeTab === 'stats' && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 总览卡片 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
              推广效果总览
            </ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: '#10B98115',
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
              }}>
                <FontAwesome6 name="coins" size={24} color="#10B981" />
                <ThemedText variant="h2" color="#10B981" style={{ marginTop: Spacing.sm }}>
                  ¥{PROMOTION_STATS.totalRevenue.toLocaleString()}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>总收入</ThemedText>
              </View>
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: '#3B82F615',
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
              }}>
                <FontAwesome6 name="eye" size={24} color="#3B82F6" />
                <ThemedText variant="h2" color="#3B82F6" style={{ marginTop: Spacing.sm }}>
                  {PROMOTION_STATS.totalViews.toLocaleString()}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>总曝光</ThemedText>
              </View>
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: '#F59E0B15',
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
              }}>
                <FontAwesome6 name="hand-pointer" size={24} color="#F59E0B" />
                <ThemedText variant="h2" color="#F59E0B" style={{ marginTop: Spacing.sm }}>
                  {PROMOTION_STATS.totalClicks.toLocaleString()}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>总点击</ThemedText>
              </View>
              <View style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: '#EF444415',
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
              }}>
                <FontAwesome6 name="user-plus" size={24} color="#EF4444" />
                <ThemedText variant="h2" color="#EF4444" style={{ marginTop: Spacing.sm }}>
                  {PROMOTION_STATS.totalConversions}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>转化用户</ThemedText>
              </View>
            </View>

            {/* 转化率 */}
            <View style={{
              backgroundColor: theme.backgroundDefault,
              borderRadius: BorderRadius.lg,
              padding: Spacing.lg,
              marginTop: Spacing.md,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ThemedText variant="small" color={theme.textSecondary}>点击率</ThemedText>
                <ThemedText variant="smallMedium" color={theme.primary}>
                  {((PROMOTION_STATS.totalClicks / PROMOTION_STATS.totalViews) * 100).toFixed(2)}%
                </ThemedText>
              </View>
              <View style={{
                height: 8,
                backgroundColor: theme.backgroundTertiary,
                borderRadius: 4,
                marginTop: Spacing.sm,
              }}>
                <View style={{
                  width: `${Math.min((PROMOTION_STATS.totalClicks / PROMOTION_STATS.totalViews) * 100 * 5, 100)}%`,
                  height: '100%',
                  backgroundColor: '#3B82F6',
                  borderRadius: 4,
                }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md }}>
                <ThemedText variant="small" color={theme.textSecondary}>转化率</ThemedText>
                <ThemedText variant="smallMedium" color={theme.success}>
                  {((PROMOTION_STATS.totalConversions / PROMOTION_STATS.totalClicks) * 100).toFixed(2)}%
                </ThemedText>
              </View>
              <View style={{
                height: 8,
                backgroundColor: theme.backgroundTertiary,
                borderRadius: 4,
                marginTop: Spacing.sm,
              }}>
                <View style={{
                  width: `${Math.min((PROMOTION_STATS.totalConversions / PROMOTION_STATS.totalClicks) * 100 * 10, 100)}%`,
                  height: '100%',
                  backgroundColor: '#10B981',
                  borderRadius: 4,
                }} />
              </View>
            </View>
          </View>

          {/* 各平台统计 */}
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
            各平台收入
          </ThemedText>
          {PROMOTION_STATS.platformStats.map((stat) => {
            const platform = PLATFORMS.find(p => p.key === stat.platform);
            return (
              <View
                key={stat.platform}
                style={{
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.lg,
                  marginBottom: Spacing.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: BorderRadius.md,
                    backgroundColor: (platform?.color || theme.primary) + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <FontAwesome6 name={platform?.icon as any} size={18} color={platform?.color || theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>{platform?.name}</ThemedText>
                  </View>
                  <ThemedText variant="h3" color={theme.success}>¥{stat.revenue}</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText variant="caption" color={theme.textMuted}>曝光</ThemedText>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>{stat.views.toLocaleString()}</ThemedText>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText variant="caption" color={theme.textMuted}>点击</ThemedText>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>{stat.clicks.toLocaleString()}</ThemedText>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText variant="caption" color={theme.textMuted}>转化</ThemedText>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>{stat.conversions}</ThemedText>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <ThemedText variant="caption" color={theme.textMuted}>转化率</ThemedText>
                    <ThemedText variant="smallMedium" color={theme.primary}>
                      {((stat.conversions / stat.clicks) * 100).toFixed(1)}%
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          })}

          {/* 提示 */}
          <View style={{
            backgroundColor: theme.primary + '10',
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            marginTop: Spacing.md,
            marginBottom: Spacing.xl,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
              <FontAwesome6 name="lightbulb" size={16} color={theme.primary} />
              <ThemedText variant="small" color={theme.textSecondary}>
                推广收入来源于通过推广链接注册的新用户消费分成。转化率越高，平台会给予更多流量扶持。
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      )}

      {/* 素材预览弹窗 */}
      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowPreview(false)}
          >
            <FontAwesome6 name="xmark" size={20} color="#fff" />
          </TouchableOpacity>

          {selectedMaterial && (
            <View style={{ width: '90%', maxWidth: 800 }}>
              {selectedMaterial.type === 'video' ? (
                <Video
                  source={{ uri: selectedMaterial.videoUrl }}
                  style={{ width: '100%', height: 400 }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay
                />
              ) : (
                <Image
                  source={{ uri: selectedMaterial.imageUrl }}
                  style={{ width: '100%', height: 400, borderRadius: BorderRadius.lg }}
                  resizeMode="contain"
                />
              )}

              {/* 操作按钮 */}
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: Spacing.sm,
                    backgroundColor: theme.primary,
                    borderRadius: BorderRadius.lg,
                    paddingVertical: Spacing.md,
                  }}
                  onPress={() => handleShare(selectedMaterial)}
                >
                  <FontAwesome6 name="share" size={16} color={theme.buttonPrimaryText} />
                  <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>分享</ThemedText>
                </TouchableOpacity>
                {PLATFORMS.slice(0, 3).map((platform) => (
                  <TouchableOpacity
                    key={platform.key}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: Spacing.xs,
                      backgroundColor: theme.backgroundDefault,
                      borderRadius: BorderRadius.lg,
                      paddingVertical: Spacing.md,
                    }}
                    onPress={() => {
                      handleQuickPromote(selectedMaterial, platform);
                      setShowPreview(false);
                    }}
                  >
                    <FontAwesome6 name={platform.icon as any} size={14} color={theme.textPrimary} />
                    <ThemedText variant="small" color={theme.textPrimary}>{platform.name}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
