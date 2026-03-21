import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
// @ts-ignore - react-native-sse lacks proper type definitions
import RNSSE from 'react-native-sse';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// 根据项目类型和服务类型生成创作提示词
const generateProjectPrompt = (title: string, type: string, serviceType?: string): string => {
  // 服务类型前缀
  const servicePrefix: Record<string, string> = {
    'scene': '【场景创作】',
    'character': '【角色设计】',
    'story': '【剧情编写】',
    'music': '【配乐推荐】',
  };
  
  const prefix = serviceType ? (servicePrefix[serviceType] || '') : '';
  
  // 根据服务类型调整提示词
  if (serviceType === 'character') {
    return `${prefix}请为《${title}》项目设计一个${type.replace(/场景|剧情/g, '角色')}。

要求：
1. 造型：符合${type}风格，细节精致
2. 配色：传统中国色系，突出气质
3. 配饰：发簪、玉佩、折扇等可选
4. 气质：温婉如玉或英气逼人
5. 背景：与角色气质相符的场景暗示

请输出：
- 角色设定（姓名、性格、背景）
- 外貌描述
- 服装设计方案
- 标志性特征`;
  }
  
  if (serviceType === 'story') {
    return `${prefix}请为《${title}》项目构思一段${type.replace(/场景|角色/g, '剧情')}。

要求：
1. 背景：符合${type}的世界观设定
2. 人物：角色鲜活，性格鲜明
3. 情节：曲折动人，情感真挚
4. 语言：古风韵味，诗词点缀
5. 主题：爱情、权谋、江湖可选

请输出：
- 故事梗概
- 主要人物设定
- 关键情节设计
- 情感线索`;
  }
  
  if (serviceType === 'music') {
    return `${prefix}请为《${title}》项目推荐合适的配乐。

项目类型：${type}

请推荐：
1. 主旋律风格建议（乐器、节奏、情绪）
2. 场景配乐清单（3-5首参考曲目风格）
3. 音效设计建议（环境音、特效音）
4. 整体音乐风格定位`;
  }
  const stylePrompts: Record<string, string> = {
    '古风场景': `请为《${title}》项目创作一个古风场景设计方案。

要求：
1. 场景氛围：江南水乡、青砖黛瓦、小桥流水
2. 色调：以青灰、水墨色为主，点缀朱红
3. 元素：古建筑、石桥、柳树、荷花、远山
4. 光影：晨雾朦胧、夕照余晖可选
5. 风格：写实与写意结合，富有诗意

请输出：
- 场景描述（200字）
- 主要元素清单
- 色彩搭配方案
- 氛围营造建议`,

    '古风角色': `请为《${title}》项目设计一个古风角色。

要求：
1. 造型：汉服风格，细节精致
2. 配色：传统中国色，如黛青、绛紫、缃色
3. 配饰：发簪、玉佩、折扇等
4. 气质：温婉如玉或英气逼人
5. 背景：与角色气质相符的场景暗示

请输出：
- 角色设定（姓名、性格、背景）
- 外貌描述
- 服装设计方案
- 标志性特征`,

    '国风热血': `请为《${title}》项目设计一个热血战斗场景。

要求：
1. 氛围：气势磅礴、热血沸腾
2. 元素：刀光剑影、战旗飘扬、骏马奔腾
3. 色调：以红黑金为主，突出热血感
4. 动作：动态感强，张力十足
5. 背景：战场、古城、山川可选

请输出：
- 战斗场景描述
- 角色动作设计
- 武器装备设定
- 特效表现建议`,

    '唯美风': `请为《${title}》项目设计一个唯美意境场景。

要求：
1. 氛围：空灵唯美、如梦似幻
2. 元素：花瓣、流光、薄雾、月色
3. 色调：淡粉、浅紫、月白为主
4. 构图：留白与细节结合
5. 情感：温婉、缱绻、诗意

请输出：
- 意境描述（诗意表达）
- 视觉元素清单
- 色彩情感分析
- 光影设计`,

    '仙侠唯美': `请为《${title}》项目设计一个仙侠唯美场景。

要求：
1. 氛围：仙气飘渺、超凡脱俗
2. 元素：仙山、云海、瑶台、仙鹤
3. 色调：以白、青、金为主，仙气感
4. 光效：流光溢彩、祥云瑞气
5. 风格：仙侠风，如梦如幻

请输出：
- 仙境场景描述
- 仙家元素设计
- 法术特效建议
- 灵气氛围营造`,

    '水墨场景': `请为《${title}》项目设计一个水墨风格场景。

要求：
1. 风格：传统水墨画风格
2. 笔法：浓淡干湿、虚实结合
3. 元素：山水、竹林、扁舟、渔翁
4. 意境：淡泊宁静、禅意悠远
5. 留白：适当留白，意境深远

请输出：
- 水墨场景构图
- 笔墨技法建议
- 意境表达
- 题款位置建议`,

    '古风剧情': `请为《${title}》项目构思一段古风剧情。

要求：
1. 背景：古代中国，朝代可选
2. 人物：才子佳人、帝王将相
3. 情节：曲折动人、情感真挚
4. 语言：古风韵味，诗词点缀
5. 主题：爱情、权谋、江湖可选

请输出：
- 故事梗概
- 主要人物设定
- 关键情节设计
- 情感线索`,

    '国风城池': `请为《${title}》项目设计一座国风古城。

要求：
1. 规模：皇城、府城、县城可选
2. 布局：中轴对称、棋盘格局
3. 建筑：宫殿、官署、民居、市井
4. 防御：城墙、城门、角楼、护城河
5. 氛围：繁华或萧瑟，符合剧情需要

请输出：
- 城池整体布局
- 主要建筑群设计
- 城市功能分区
- 特色地标`,

    '仙侠场景': `请为《${title}》项目设计一个仙侠场景。

要求：
1. 类型：仙山、洞府、秘境、战场
2. 元素：灵气、仙草、阵法、法宝
3. 氛围：神秘、庄严或激烈
4. 光效：仙光流转、灵气氤氲
5. 交互：修仙、斗法、探索功能

请输出：
- 场景整体描述
- 灵气分布设定
- 交互玩法设计
- 特效表现方案`,

    '国风场景': `请为《${title}》项目设计一个国风场景。

要求：
1. 风格：中国传统文化元素
2. 元素：根据主题选择合适元素
3. 色调：传统中国色系
4. 氛围：典雅、大气或婉约
5. 细节：传统纹样、书法题词

请输出：
- 场景设计理念
- 文化元素运用
- 色彩搭配方案
- 细节装饰建议`,

    '游戏角色': `请为《${title}》项目设计一个游戏角色。

要求：
1. 风格：符合游戏整体美术风格
2. 特征：辨识度高，记忆点明确
3. 动作：战斗姿态或休闲姿态
4. 装备：武器、防具、配饰
5. 背景：简要人物背景

请输出：
- 角色设定（姓名、职业、性格）
- 外貌特征设计
- 装备武器设计
- 技能特效建议`,

    '动漫场景': `请为《${title}》项目设计一个动漫场景。

要求：
1. 风格：日系动漫或国漫风格
2. 透视：动态构图，视觉冲击力
3. 色彩：饱和度高，明快或深沉
4. 氛围：根据剧情需要
5. 细节：精良的背景绘制

请输出：
- 场景构图设计
- 色彩氛围设定
- 光影处理方案
- 细节绘制要点`,
  };

  return stylePrompts[type] || `请为《${title}》项目进行创作设计。

项目类型：${type}

请输出：
- 项目概述
- 设计理念
- 主要元素
- 实施方案`;
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember, dailyChatCount, maxFreeChatsPerDay, incrementChatCount, canChat } = useMembership();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ 
    projectId?: string; 
    projectTitle?: string;
    projectType?: string;
    serviceType?: string;
    autoCreate?: string;
  }>();
  const { projectTitle, projectType, serviceType, autoCreate } = params;

  const [messages, setMessages] = useState<Message[]>([]);
  
  // Compute initial input text from project params if autoCreate
  const initialInputText = useMemo(() => {
    if (autoCreate && projectTitle && projectType) {
      return generateProjectPrompt(projectTitle, projectType, serviceType);
    }
    return '';
  }, [autoCreate, projectTitle, projectType, serviceType]);
  
  const [inputText, setInputText] = useState(initialInputText);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState<{title: string; type: string} | null>(null);
  const autoSendTriggered = useRef<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sseRef = useRef<any>(null);
  const typingAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
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
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    // Check if user can chat (member or has free chats left)
    const allowed = await incrementChatCount();
    if (!allowed) {
      Alert.alert(
        '对话次数已用完',
        `免费用户每日限${maxFreeChatsPerDay}次对话，升级会员享受无限对话`,
        [
          { text: '稍后再说', style: 'cancel' },
          { text: '升级会员', onPress: () => router.push('/membership') },
        ]
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '' }]);

    try {
      const url = `${process.env.EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat/stream`;

      const sse = new RNSSE(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
        method: 'POST',
      });

      sseRef.current = sse;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sse.addEventListener('message', (event: any) => {
        const data = event.data;
        if (data === '[DONE]') {
          sse.close();
          setIsLoading(false);
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + parsed.content }
                  : msg
              )
            );
          }
        } catch {
          // Handle plain text chunks
          if (data && data !== '[DONE]') {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + data }
                  : msg
              )
            );
          }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sse.addEventListener('error', (_event: any) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: '连接错误，请重试' }
              : msg
          )
        );
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          id: aiMessageId,
          role: 'assistant',
          content: '连接错误，请重试',
        },
      ]);
      setIsLoading(false);
    }
  };

  // Auto-create content when navigating from project with autoCreate flag
  useEffect(() => {
    if (autoCreate && initialInputText && !autoSendTriggered.current) {
      autoSendTriggered.current = true;
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleSend();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoCreate, initialInputText]);

  const handleQuickAction = (text: string) => {
    setInputText(text);
  };

  const quickActions = [
    '创建游戏角色',
    '设计动漫场景',
    '生成故事剧情',
    '构建游戏关卡',
  ];

  const remainingChats = isMember ? '无限' : maxFreeChatsPerDay - dailyChatCount;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText variant="h4" color={theme.textPrimary}>
              G open AI 创作助手
            </ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ThemedText variant="label" color={theme.textMuted}>
                由 OPENCLAW 引擎驱动
              </ThemedText>
              {isMember && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <FontAwesome6 name="crown" size={10} color={theme.primary} />
                  <ThemedText variant="tiny" color={theme.primary}>
                    会员
                  </ThemedText>
                </View>
              )}
            </View>
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.neonLine}
            />
          </View>

          {/* Usage indicator for free users */}
          {!isMember && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <ThemedText variant="caption" color={theme.textMuted}>
                今日剩余对话：{remainingChats} 次
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/membership')}>
                <ThemedText variant="captionMedium" color={theme.primary}>
                  升级会员
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages or Empty State */}
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <FontAwesome6 name="robot" size={32} color={theme.primary} />
              </View>
              <ThemedText variant="h3" color={theme.textPrimary}>
                准备开始创作
              </ThemedText>
              <ThemedText variant="body" color={theme.textMuted}>
                描述你的游戏或动漫项目，让 AI 为你实现创意愿景
              </ThemedText>
              <View style={styles.quickActions}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickAction}
                    onPress={() => handleQuickAction(action)}
                  >
                    <ThemedText variant="small" color={theme.textSecondary}>
                      {action}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map(message => (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    message.role === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
                  ]}
                >
                  <ThemedText
                    variant="labelSmall"
                    color={message.role === 'user' ? theme.accent : theme.primary}
                  >
                    {message.role === 'user' ? '用户' : 'G open AI'}
                  </ThemedText>
                  <View
                    style={[
                      styles.messageBubble,
                      message.role === 'user' ? styles.userMessage : styles.aiMessage,
                    ]}
                  >
                    <ThemedText variant="body" color={theme.textPrimary}>
                      {message.content}
                    </ThemedText>
                  </View>
                </View>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
                  <ThemedText variant="labelSmall" color={theme.primary}>
                    G open AI
                  </ThemedText>
                  <View style={[styles.messageBubble, styles.aiMessage, styles.typingIndicator]}>
                    <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
                    <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
                    <Animated.View style={[styles.typingDot, { opacity: typingAnim }]} />
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="描述你的创意..."
            placeholderTextColor={theme.textMuted}
            multiline
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <FontAwesome6
              name="paper-plane"
              size={18}
              color={inputText.trim() ? theme.primary : theme.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
