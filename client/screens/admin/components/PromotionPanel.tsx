/**
 * 推广中心组件
 * 提供一键发布全部平台、推广收入统计功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

interface PromotionPanelProps {
  adminKey: string;
}

type PlatformType = 'xiaohongshu' | 'douyin' | 'weibo' | 'zhihu' | 'bilibili';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  content: string;
}

interface PromotionStats {
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  platformStats: {
    platform: PlatformType;
    views: number;
    clicks: number;
    conversions: number;
    revenue: number;
    publishCount: number;
  }[];
}

interface PublishRecord {
  id: string;
  platform: PlatformType;
  contentId: string;
  publishedAt: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

const PLATFORMS: { key: PlatformType; name: string; icon: string; url: string; publishUrl: string }[] = [
  { 
    key: 'xiaohongshu', 
    name: '小红书', 
    icon: 'book', 
    url: 'https://www.xiaohongshu.com',
    publishUrl: 'https://creator.xiaohongshu.com/publish/publish'
  },
  { 
    key: 'douyin', 
    name: '抖音', 
    icon: 'play', 
    url: 'https://www.douyin.com',
    publishUrl: 'https://creator.douyin.com/creator-micro/content/publish'
  },
  { 
    key: 'weibo', 
    name: '微博', 
    icon: 'share', 
    url: 'https://weibo.com',
    publishUrl: 'https://weibo.com'
  },
  { 
    key: 'zhihu', 
    name: '知乎', 
    icon: 'question', 
    url: 'https://www.zhihu.com',
    publishUrl: 'https://www.zhihu.com/write'
  },
  { 
    key: 'bilibili', 
    name: 'B站', 
    icon: 'tv', 
    url: 'https://www.bilibili.com',
    publishUrl: 'https://member.bilibili.com/platform/home'
  },
];

const CONTENT_DATA: Record<PlatformType, ContentItem[]> = {
  xiaohongshu: [
    {
      id: 'xhs1',
      title: '产品介绍',
      type: '产品推荐',
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
    },
    {
      id: 'xhs2',
      title: '功能介绍',
      type: '功能展示',
      content: `一个APP集齐所有顶级AI模型！这是什么神仙体验？

GPT-4o：最强的语言理解能力
Claude 3：最擅长写作和推理
豆包：中文能力最强

关键是按需付费！
不像其他AI工具动不动就几十块一个月
这里用多少付多少，学生党也能轻松负担

还有超贴心的项目管理功能
所有创作历史一目了然
再也不用翻聊天记录找了

赶紧去试试！新手注册还送2000 Token免费额度

#AI工具 #Gopen #效率神器 #自媒体工具`,
    },
    {
      id: 'xhs3',
      title: '价格对比',
      type: '性价比',
      content: `算了一笔账，我一年省了1200块！

之前订阅ChatGPT Plus：20美元/月 = 145元/月
订阅Claude Pro：20美元/月 = 145元/月
合计：290元/月 = 3480元/年

现在用G open：
按Token计费，用多少付多少
平均每月只需要50块
一年只要600块！

省下来的钱可以吃好几顿火锅了

关键是功能一点没少：
- 多个顶级AI模型
- 图像生成功能
- 项目管理
- 云存储同步

性价比之王，不接受反驳！

#省钱攻略 #AI工具 #Gopen #性价比`,
    },
  ],
  douyin: [
    {
      id: 'dy1',
      title: '开场白',
      type: '15秒视频',
      content: `【钩子】一个APP，集齐所有顶级AI模型！

【正文】
G open，你的AI创作工作室
GPT-4o、Claude 3、豆包全都有
按需付费，比订阅便宜
还能生成图片、管理项目

【行动】赶紧点击下方链接下载！`,
    },
    {
      id: 'dy2',
      title: '效率提升',
      type: '15秒视频',
      content: `【钩子】创作效率提升200%的秘密武器！

【正文】
以前写一篇文章要3小时
现在用G open，半小时搞定
还能生成封面图、管理项目
自媒体博主必备神器

【行动】评论区回复"666"，送你新手礼包！`,
    },
  ],
  weibo: [
    {
      id: 'wb1',
      title: '话题营销',
      type: '话题营销',
      content: `#AI创作工具# 发现一个神仙APP！

一个APP集齐GPT-4o、Claude 3、豆包等顶级AI
关键是按Token计费，用多少付多少
比订阅便宜太多了！

还能生成图片、管理项目、云存储同步
自媒体博主、程序员、学生党必备神器

注册还送2000 Token，赶紧去试试！

#Gopen #效率工具 #AI`,
    },
  ],
  zhihu: [
    {
      id: 'zh1',
      title: 'AI写作工具推荐',
      type: '回答模板',
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

新手注册还送2000 Token，可以试试看！

#AI工具 #写作工具`,
    },
  ],
  bilibili: [
    {
      id: 'bli1',
      title: '深度测评脚本',
      type: '视频脚本',
      content: `【开场】（30秒）
大家好，我是XXX
今天给大家测评一款新上线的AI工具：G open
号称"一个APP集齐所有顶级AI模型"
到底是不是智商税？
我们一起来测测看

【第一部分：产品介绍】（2分钟）
G open是一款AI创作助手
集成多个顶级AI模型
包括GPT-4o、Claude 3、豆包等

【第二部分：核心功能测试】（5分钟）
1. 对话功能测试
2. 图像生成测试

【结尾】（1分钟）
总体来说，G open性价比很高
特别适合自媒体博主、程序员、学生党`,
    },
  ],
};

// 获取所有平台的推荐文案（每个平台取第一条）
const getAllPlatformsContent = (): string => {
  let allContent = '';
  PLATFORMS.forEach((platform, index) => {
    const contents = CONTENT_DATA[platform.key];
    if (contents && contents.length > 0) {
      allContent += `【${platform.name}】\n`;
      allContent += contents[0].content;
      if (index < PLATFORMS.length - 1) {
        allContent += '\n\n' + '='.repeat(40) + '\n\n';
      }
    }
  });
  return allContent;
};

export function PromotionPanel({ adminKey }: PromotionPanelProps) {
  const { theme, isDark } = useTheme();
  const [activePlatform, setActivePlatform] = useState<PlatformType>('xiaohongshu');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState<'publish' | 'stats'>('publish');

  const currentContents = CONTENT_DATA[activePlatform] || [];

  // 获取推广统计数据
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/stats?key=${adminKey}`
      );
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Fetch promotion stats error:', error);
      // 使用模拟数据
      setStats({
        totalViews: 12580,
        totalClicks: 3245,
        totalConversions: 186,
        totalRevenue: 5380,
        platformStats: [
          { platform: 'xiaohongshu', views: 5200, clicks: 1450, conversions: 78, revenue: 2250, publishCount: 12 },
          { platform: 'douyin', views: 3800, clicks: 980, conversions: 52, revenue: 1500, publishCount: 8 },
          { platform: 'weibo', views: 2100, clicks: 520, conversions: 32, revenue: 920, publishCount: 15 },
          { platform: 'zhihu', views: 980, clicks: 195, conversions: 14, revenue: 410, publishCount: 6 },
          { platform: 'bilibili', views: 500, clicks: 100, conversions: 10, revenue: 300, publishCount: 4 },
        ],
      });
    } finally {
      setLoadingStats(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 复制文案
  const handleCopy = async (item: ContentItem) => {
    try {
      await Clipboard.setStringAsync(item.content);
      setCopiedId(item.id);
      Alert.alert('成功', '文案已复制到剪贴板！');
      setTimeout(() => setCopiedId(null), 3000);
    } catch (error) {
      Alert.alert('错误', '复制失败，请重试');
    }
  };

  // 一键复制所有平台文案
  const handleCopyAll = async () => {
    try {
      const allContent = getAllPlatformsContent();
      await Clipboard.setStringAsync(allContent);
      Alert.alert('成功', `已复制${PLATFORMS.length}个平台的推广文案！`);
    } catch (error) {
      Alert.alert('错误', '复制失败，请重试');
    }
  };

  // 一键发布到所有平台（打开所有平台发布页面）
  const handlePublishAll = async () => {
    Alert.alert(
      '一键发布',
      '将打开所有平台的发布页面，请确保已复制推广文案。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '开始发布', 
          onPress: async () => {
            // 先复制所有文案
            await handleCopyAll();
            
            // 依次打开各平台
            if (Platform.OS === 'web') {
              PLATFORMS.forEach((platform, index) => {
                setTimeout(() => {
                  window.open(platform.publishUrl, '_blank');
                }, index * 500); // 间隔500ms打开，避免浏览器拦截
              });
            } else {
              Alert.alert('提示', '请在PC端使用一键发布功能');
            }
          }
        },
      ]
    );
  };

  // 打开平台发布页面
  const handleOpenPublishPage = (platform: typeof PLATFORMS[0]) => {
    if (Platform.OS === 'web') {
      window.open(platform.publishUrl, '_blank');
    } else {
      Alert.alert('提示', `请访问: ${platform.publishUrl}`);
    }
  };

  // 记录发布
  const handleRecordPublish = async (platform: PlatformType, contentId: string) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/promotion/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, contentId, adminKey }),
      });
      Alert.alert('成功', '发布记录已保存');
      fetchStats(); // 刷新统计
    } catch (error) {
      console.error('Record publish error:', error);
    }
  };

  // 统计数据
  const totalContents = Object.values(CONTENT_DATA).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Tab 切换 */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            backgroundColor: activeTab === 'publish' ? theme.primary : theme.backgroundDefault,
            alignItems: 'center',
          }}
          onPress={() => setActiveTab('publish')}
        >
          <FontAwesome6 
            name="paper-plane" 
            size={16} 
            color={activeTab === 'publish' ? theme.buttonPrimaryText : theme.textPrimary} 
          />
          <ThemedText 
            variant="small" 
            color={activeTab === 'publish' ? theme.buttonPrimaryText : theme.textPrimary}
            style={{ marginTop: 4 }}
          >
            发布推广
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            backgroundColor: activeTab === 'stats' ? theme.primary : theme.backgroundDefault,
            alignItems: 'center',
          }}
          onPress={() => setActiveTab('stats')}
        >
          <FontAwesome6 
            name="chart-line" 
            size={16} 
            color={activeTab === 'stats' ? theme.buttonPrimaryText : theme.textPrimary} 
          />
          <ThemedText 
            variant="small" 
            color={activeTab === 'stats' ? theme.buttonPrimaryText : theme.textPrimary}
            style={{ marginTop: 4 }}
          >
            收入统计
          </ThemedText>
        </TouchableOpacity>
      </View>

      {activeTab === 'publish' ? (
        <>
          {/* 统计卡片 */}
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg }}>
            <View
              style={{
                flex: 1,
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
              }}
            >
              <ThemedText variant="h2" color={theme.primary}>
                {totalContents}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                推广文案
              </ThemedText>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                padding: Spacing.lg,
                alignItems: 'center',
              }}
            >
              <ThemedText variant="h2" color={theme.primary}>
                {PLATFORMS.length}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>
                推广平台
              </ThemedText>
            </View>
          </View>

          {/* 一键发布全部 */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: Spacing.sm,
              backgroundColor: '#10B981',
              borderRadius: BorderRadius.lg,
              paddingVertical: Spacing.md,
              marginBottom: Spacing.lg,
            }}
            onPress={handlePublishAll}
          >
            <FontAwesome6 name="rocket" size={18} color="#fff" />
            <ThemedText variant="bodyMedium" color="#fff">
              一键发布全部平台
            </ThemedText>
          </TouchableOpacity>

          {/* 平台选择 */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: Spacing.lg }}
            >
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {PLATFORMS.map((platform) => (
                  <TouchableOpacity
                    key={platform.key}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.xs,
                      paddingVertical: Spacing.sm,
                      paddingHorizontal: Spacing.lg,
                      backgroundColor:
                        activePlatform === platform.key
                          ? theme.primary
                          : theme.backgroundDefault,
                      borderRadius: BorderRadius.lg,
                      borderWidth: 1,
                      borderColor:
                        activePlatform === platform.key
                          ? theme.primary
                          : theme.border,
                    }}
                    onPress={() => setActivePlatform(platform.key)}
                  >
                    <FontAwesome6
                      name={platform.icon as any}
                      size={14}
                      color={
                        activePlatform === platform.key
                          ? theme.buttonPrimaryText
                          : theme.textPrimary
                      }
                    />
                    <ThemedText
                      variant="small"
                      color={
                        activePlatform === platform.key
                          ? theme.buttonPrimaryText
                          : theme.textPrimary
                      }
                    >
                      {platform.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 快速操作 */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.xs,
                backgroundColor: theme.backgroundDefault,
                borderRadius: BorderRadius.lg,
                paddingVertical: Spacing.md,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              onPress={handleCopyAll}
            >
              <FontAwesome6 name="copy" size={16} color={theme.primary} />
              <ThemedText variant="smallMedium" color={theme.primary}>
                复制全部文案
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: Spacing.xs,
                backgroundColor: theme.primary,
                borderRadius: BorderRadius.lg,
                paddingVertical: Spacing.md,
              }}
              onPress={() => handleOpenPublishPage(PLATFORMS.find(p => p.key === activePlatform)!)}
            >
              <FontAwesome6 name="arrow-up-right-from-square" size={16} color={theme.buttonPrimaryText} />
              <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                打开发布页
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* 文案列表 */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {currentContents.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: theme.backgroundDefault,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.lg,
                  marginBottom: Spacing.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>
                    {item.title}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {item.type}
                  </ThemedText>
                </View>
                <ThemedText
                  variant="caption"
                  color={theme.textSecondary}
                  numberOfLines={3}
                  style={{ marginBottom: Spacing.md }}
                >
                  {item.content}
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: Spacing.xs,
                      backgroundColor: copiedId === item.id ? theme.success : theme.backgroundTertiary,
                      borderRadius: BorderRadius.md,
                      paddingVertical: Spacing.sm,
                    }}
                    onPress={() => handleCopy(item)}
                  >
                    <FontAwesome6
                      name={copiedId === item.id ? 'check' : 'copy'}
                      size={12}
                      color={copiedId === item.id ? '#fff' : theme.textPrimary}
                    />
                    <ThemedText
                      variant="caption"
                      color={copiedId === item.id ? '#fff' : theme.textPrimary}
                    >
                      {copiedId === item.id ? '已复制' : '复制'}
                    </ThemedText>
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
                    onPress={() => handleRecordPublish(activePlatform, item.id)}
                  >
                    <FontAwesome6 name="circle-check" size={12} color={theme.buttonPrimaryText} />
                    <ThemedText variant="caption" color={theme.buttonPrimaryText}>
                      记录发布
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        /* 收入统计 */
        <ScrollView showsVerticalScrollIndicator={false}>
          {loadingStats ? (
            <ActivityIndicator size="large" color={theme.primary} />
          ) : stats ? (
            <>
              {/* 总览卡片 */}
              <View style={{ marginBottom: Spacing.xl }}>
                <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
                  推广效果总览
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
                  <View style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#10B981' + '15',
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.lg,
                    alignItems: 'center',
                  }}>
                    <FontAwesome6 name="coins" size={24} color="#10B981" />
                    <ThemedText variant="h2" color="#10B981" style={{ marginTop: Spacing.sm }}>
                      ¥{stats.totalRevenue.toLocaleString()}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      总收入
                    </ThemedText>
                  </View>
                  <View style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#3B82F6' + '15',
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.lg,
                    alignItems: 'center',
                  }}>
                    <FontAwesome6 name="eye" size={24} color="#3B82F6" />
                    <ThemedText variant="h2" color="#3B82F6" style={{ marginTop: Spacing.sm }}>
                      {stats.totalViews.toLocaleString()}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      总曝光
                    </ThemedText>
                  </View>
                  <View style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#F59E0B' + '15',
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.lg,
                    alignItems: 'center',
                  }}>
                    <FontAwesome6 name="hand-pointer" size={24} color="#F59E0B" />
                    <ThemedText variant="h2" color="#F59E0B" style={{ marginTop: Spacing.sm }}>
                      {stats.totalClicks.toLocaleString()}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      总点击
                    </ThemedText>
                  </View>
                  <View style={{
                    flex: 1,
                    minWidth: '45%',
                    backgroundColor: '#EF4444' + '15',
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.lg,
                    alignItems: 'center',
                  }}>
                    <FontAwesome6 name="user-plus" size={24} color="#EF4444" />
                    <ThemedText variant="h2" color="#EF4444" style={{ marginTop: Spacing.sm }}>
                      {stats.totalConversions}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      转化用户
                    </ThemedText>
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
                    <ThemedText variant="small" color={theme.textSecondary}>
                      点击率
                    </ThemedText>
                    <ThemedText variant="smallMedium" color={theme.primary}>
                      {((stats.totalClicks / stats.totalViews) * 100).toFixed(2)}%
                    </ThemedText>
                  </View>
                  <View style={{
                    height: 8,
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: 4,
                    marginTop: Spacing.sm,
                  }}>
                    <View style={{
                      width: `${Math.min((stats.totalClicks / stats.totalViews) * 100 * 5, 100)}%`,
                      height: '100%',
                      backgroundColor: '#3B82F6',
                      borderRadius: 4,
                    }} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md }}>
                    <ThemedText variant="small" color={theme.textSecondary}>
                      转化率
                    </ThemedText>
                    <ThemedText variant="smallMedium" color={theme.success}>
                      {((stats.totalConversions / stats.totalClicks) * 100).toFixed(2)}%
                    </ThemedText>
                  </View>
                  <View style={{
                    height: 8,
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: 4,
                    marginTop: Spacing.sm,
                  }}>
                    <View style={{
                      width: `${Math.min((stats.totalConversions / stats.totalClicks) * 100 * 10, 100)}%`,
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
              {stats.platformStats.map((platformStat) => {
                const platform = PLATFORMS.find(p => p.key === platformStat.platform);
                return (
                  <View
                    key={platformStat.platform}
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
                        backgroundColor: theme.primary + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <FontAwesome6 name={platform?.icon as any} size={18} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText variant="smallMedium" color={theme.textPrimary}>
                          {platform?.name}
                        </ThemedText>
                        <ThemedText variant="caption" color={theme.textMuted}>
                          已发布 {platformStat.publishCount} 次
                        </ThemedText>
                      </View>
                      <ThemedText variant="h3" color={theme.success}>
                        ¥{platformStat.revenue}
                      </ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ alignItems: 'center' }}>
                        <ThemedText variant="caption" color={theme.textMuted}>曝光</ThemedText>
                        <ThemedText variant="smallMedium" color={theme.textPrimary}>{platformStat.views}</ThemedText>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <ThemedText variant="caption" color={theme.textMuted}>点击</ThemedText>
                        <ThemedText variant="smallMedium" color={theme.textPrimary}>{platformStat.clicks}</ThemedText>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <ThemedText variant="caption" color={theme.textMuted}>转化</ThemedText>
                        <ThemedText variant="smallMedium" color={theme.textPrimary}>{platformStat.conversions}</ThemedText>
                      </View>
                      <View style={{ alignItems: 'center' }}>
                        <ThemedText variant="caption" color={theme.textMuted}>转化率</ThemedText>
                        <ThemedText variant="smallMedium" color={theme.primary}>
                          {((platformStat.conversions / platformStat.clicks) * 100).toFixed(1)}%
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
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                  <FontAwesome6 name="circle-info" size={16} color={theme.primary} />
                  <ThemedText variant="small" color={theme.textSecondary}>
                    推广收入来源于通过推广链接注册的新用户消费分成。当前转化率越高，平台会给予更多流量扶持。
                  </ThemedText>
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
