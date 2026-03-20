/**
 * 推广中心组件
 * 提供推广文案管理和一键发布功能
 */

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
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

const PLATFORMS: { key: PlatformType; name: string; icon: string; url: string }[] = [
  { key: 'xiaohongshu', name: '小红书', icon: 'book', url: 'https://www.xiaohongshu.com' },
  { key: 'douyin', name: '抖音', icon: 'play', url: 'https://www.douyin.com' },
  { key: 'weibo', name: '微博', icon: 'share', url: 'https://weibo.com' },
  { key: 'zhihu', name: '知乎', icon: 'question', url: 'https://www.zhihu.com' },
  { key: 'bilibili', name: 'B站', icon: 'tv', url: 'https://www.bilibili.com' },
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
    {
      id: 'xhs4',
      title: '自媒体场景',
      type: '场景应用',
      content: `自媒体博主的一天是怎么过的？

7:00 起床，刷手机找灵感
9:00 开始写公众号文章，憋了2小时才写完
12:00 吃饭，顺便写小红书文案
14:00 拍摄视频素材
16:00 写微博，发抖音
18:00 终于忙完了...

一天都在写写写，累得不行

直到我发现了G open这个神器：
- 早上输入主题，10分钟生成公众号文章框架
- 中午一键改写成小红书风格
- 下午再生成微博和抖音文案

一天的工作，半天就搞定了！
而且质量比我写的还好

终于有时间好好休息了
强烈推荐给所有自媒体博主！

#自媒体 #效率工具 #Gopen #写作神器`,
    },
    {
      id: 'xhs5',
      title: '学生党必备',
      type: '场景应用',
      content: `考研党的福音来了！

英语作文不会写？
专业课笔记懒得整理？
论文框架不知道怎么搭建？
翻译软件翻译得不地道？

一个G open全搞定！

- 英语作文：输入中文，自动生成地道英文
- 专业课笔记：拍照识别，自动整理成思维导图
- 论文框架：输入主题，自动生成大纲和参考文献
- 翻译：多个模型对比，选择最准确的翻译

关键是学生认证还半价！
一杯奶茶钱就能用一个月

考研上岸的神器，冲！

#考研 #学习神器 #Gopen #学生必备`,
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
    {
      id: 'dy3',
      title: '省钱攻略',
      type: '15秒视频',
      content: `【钩子】算了一笔账，我省了1200块！

【正文】
以前订阅各种AI工具，一年3000多
现在用G open，一年只要600
关键是功能一点没少
性价比之王，不接受反驳

【行动】点击链接，你也试试！`,
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
    {
      id: 'wb2',
      title: '自媒体场景',
      type: '场景应用',
      content: `#自媒体运营# 效率提升200%的秘密武器！

以前写一篇公众号文章要3小时
现在用G open，半小时搞定
还能一键改写成小红书、微博风格
30秒生成封面图

再也不用找设计师了
一个月省好几百

强烈推荐给所有自媒体博主！

#Gopen #写作神器`,
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
支持对话、图像生成、项目管理等功能

【第二部分：核心功能测试】（5分钟）
1. 对话功能测试
   - 测试不同模型的回答质量
   - 测试上下文记忆能力
   
2. 图像生成测试
   - 文生图效果
   - 风格定制能力

【结尾】（1分钟）
总体来说，G open是一款性价比很高的AI工具
特别适合自媒体博主、程序员、学生党
如果你也想提升创作效率
不妨试试看

链接在评论区，欢迎留言讨论！`,
    },
  ],
};

export function PromotionPanel({ adminKey }: PromotionPanelProps) {
  const { theme, isDark } = useTheme();
  const [activePlatform, setActivePlatform] = useState<PlatformType>('xiaohongshu');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentContents = CONTENT_DATA[activePlatform] || [];

  // 复制文案
  const handleCopy = async (item: ContentItem) => {
    try {
      await Clipboard.setStringAsync(item.content);
      setCopiedId(item.id);
      
      if (Platform.OS === 'web') {
        Alert.alert('成功', '文案已复制到剪贴板！');
      } else {
        Alert.alert('成功', '文案已复制到剪贴板！');
      }
      
      // 3秒后重置
      setTimeout(() => {
        setCopiedId(null);
      }, 3000);
    } catch (error) {
      Alert.alert('错误', '复制失败，请重试');
    }
  };

  // 打开平台
  const handleOpenPlatform = (url: string) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Alert.alert('提示', `请访问: ${url}`);
    }
  };

  // 统计数据
  const totalContents = Object.values(CONTENT_DATA).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <View style={{ flex: 1 }}>
      {/* 统计卡片 */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
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

      {/* 快捷操作 */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.sm,
          backgroundColor: theme.primary,
          borderRadius: BorderRadius.lg,
          paddingVertical: Spacing.md,
          marginBottom: Spacing.lg,
        }}
        onPress={() => handleOpenPlatform(PLATFORMS.find(p => p.key === activePlatform)?.url || '')}
      >
        <FontAwesome6 name="arrow-up-right-from-square" size={16} color={theme.buttonPrimaryText} />
        <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>
          打开{PLATFORMS.find(p => p.key === activePlatform)?.name}
        </ThemedText>
      </TouchableOpacity>

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
            {/* 标题和类型 */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: Spacing.sm,
              }}
            >
              <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                {item.title}
              </ThemedText>
              <View
                style={{
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: BorderRadius.lg,
                  paddingVertical: 4,
                  paddingHorizontal: Spacing.sm,
                }}
              >
                <ThemedText variant="caption" color={theme.textSecondary}>
                  {item.type}
                </ThemedText>
              </View>
            </View>

            {/* 内容预览 */}
            <View
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                borderRadius: BorderRadius.md,
                padding: Spacing.md,
                marginBottom: Spacing.md,
              }}
            >
              <ThemedText
                variant="small"
                color={theme.textSecondary}
                style={{ lineHeight: 20 }}
                numberOfLines={6}
              >
                {item.content}
              </ThemedText>
            </View>

            {/* 操作按钮 */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.xs,
                  backgroundColor: copiedId === item.id ? theme.success : theme.primary,
                  borderRadius: BorderRadius.md,
                  paddingVertical: Spacing.sm,
                }}
                onPress={() => handleCopy(item)}
              >
                <FontAwesome6
                  name={copiedId === item.id ? 'check' : 'copy'}
                  size={14}
                  color={theme.buttonPrimaryText}
                />
                <ThemedText variant="smallMedium" color={theme.buttonPrimaryText}>
                  {copiedId === item.id ? '已复制' : '一键复制'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: Spacing.xs,
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: BorderRadius.md,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.lg,
                }}
                onPress={() => {
                  Alert.alert(
                    '文案内容',
                    item.content,
                    [
                      { text: '取消', style: 'cancel' },
                      { text: '复制', onPress: () => handleCopy(item) },
                    ]
                  );
                }}
              >
                <FontAwesome6 name="eye" size={14} color={theme.textPrimary} />
                <ThemedText variant="small" color={theme.textPrimary}>
                  查看
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* 底部提示 */}
        <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
          <ThemedText variant="caption" color={theme.textMuted}>
            共 {currentContents.length} 条文案
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}
