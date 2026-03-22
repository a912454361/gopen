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
  Modal,
  ActivityIndicator,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
// @ts-ignore - react-native-sse lacks proper type definitions
import RNSSE from 'react-native-sse';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useToast } from '@/components/Toast';
import { PromoBanner } from '@/components/PromoBanner';
import { PromoModal } from '@/components/PromoModal';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import { 
  createChatSession, 
  updateChatSession, 
  saveCurrentSessionId,
  getCurrentSessionId,
  type ChatSession 
} from '@/services/chatHistoryService';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  saved?: boolean;
}

interface SelectedModel {
  code: string;
  name: string;
  provider: string;
  providerName: string;
  pricing: { input: number; output: number; tier: string };
}

// 根据项目类型和服务类型生成创作提示词
const generateProjectPrompt = (title: string, type: string, serviceType?: string): string => {
  const servicePrefix: Record<string, string> = {
    'scene': '【场景创作】',
    'character': '【角色设计】',
    'story': '【剧情编写】',
    'music': '【配乐推荐】',
  };
  
  const prefix = serviceType ? (servicePrefix[serviceType] || '') : '';
  
  if (serviceType === 'character') {
    return `${prefix}请为《${title}》项目设计一个角色。

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
    return `${prefix}请为《${title}》项目构思一段剧情。

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

  return `请为《${title}》项目进行创作设计。

项目类型：${type}

请输出：
- 项目概述
- 设计理念
- 主要元素
- 实施方案`;
};

// 提供商颜色
const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97706',
  google: '#4285F4',
  deepseek: '#0066FF',
  doubao: '#3370FF',
  qwen: '#FF6A00',
  zhipu: '#1A73E8',
  moonshot: '#6366F1',
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember, isSuperMember, dailyChatCount, maxFreeChatsPerDay, incrementChatCount } = useMembership();
  const router = useSafeRouter();
  const params = useSafeSearchParams<{ 
    projectId?: string; 
    projectTitle?: string;
    projectType?: string;
    serviceType?: string;
    autoCreate?: string;
  }>();
  const { projectTitle, projectType, serviceType, autoCreate } = params;

  // 计算初始提示词
  const initialGuideData = useMemo(() => {
    if (autoCreate && projectTitle && projectType) {
      return {
        prompt: generateProjectPrompt(projectTitle, projectType, serviceType),
        project: { title: projectTitle, type: projectType },
        shouldShow: true,
      };
    }
    return { prompt: '', project: null, shouldShow: false };
  }, [autoCreate, projectTitle, projectType, serviceType]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showGuide, setShowGuide] = useState(initialGuideData.shouldShow);
  const [guidePrompt, setGuidePrompt] = useState(initialGuideData.prompt);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState<{title: string; type: string} | null>(initialGuideData.project);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 对话会话管理
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // 模型选择相关状态
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [availableModels, setAvailableModels] = useState<SelectedModel[]>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const sseRef = useRef<any>(null);
  const typingAnim = useMemo(() => new Animated.Value(1), []);
  const { showToast } = useToast();

  // 获取用户ID和模型
  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
    loadSelectedModel();
    fetchAvailableModels();
  }, []);

  // 页面获得焦点时刷新选中的模型
  useFocusEffect(
    useCallback(() => {
      loadSelectedModel();
    }, [])
  );

  /**
   * 加载用户选择的模型
   */
  const loadSelectedModel = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedModel');
      if (saved) {
        setSelectedModel(JSON.parse(saved));
      } else {
        // 默认使用豆包模型
        setSelectedModel({
          code: 'doubao-pro-32k',
          name: '豆包 Pro 32K',
          provider: 'doubao',
          providerName: '豆包',
          pricing: { input: 80, output: 200, tier: 'standard' },
        });
      }
    } catch (error) {
      console.error('Load selected model error:', error);
    }
  };

  /**
   * 获取可用模型列表
   * 服务端文件：server/src/routes/ai-gateway.ts
   * 接口：GET /api/v1/ai/models?type=text
   */
  const fetchAvailableModels = async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/models?type=text`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setAvailableModels(data.data.filter((m: any) => 
          m.category === 'text' || m.category === 'multimodal'
        ));
      }
    } catch (error) {
      console.error('Fetch models error:', error);
    }
  };

  // 打字动画
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

  // 清理SSE连接
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  // 检查模型权限
  const checkModelAccess = (model: SelectedModel): boolean => {
    if (model.pricing.tier === 'enterprise' && !isSuperMember) {
      Alert.alert(
        '需要超级会员',
        '该模型需要超级会员才能使用',
        [
          { text: '取消', style: 'cancel' },
          { text: '升级会员', onPress: () => router.push('/membership') },
        ]
      );
      return false;
    }
    if (model.pricing.tier === 'premium' && !isMember) {
      Alert.alert(
        '需要会员',
        '该模型需要普通会员才能使用',
        [
          { text: '取消', style: 'cancel' },
          { text: '升级会员', onPress: () => router.push('/membership') },
        ]
      );
      return false;
    }
    return true;
  };

  // 选择模型
  const handleSelectModel = (model: SelectedModel) => {
    if (!checkModelAccess(model)) return;
    
    setSelectedModel(model);
    AsyncStorage.setItem('selectedModel', JSON.stringify(model));
    setShowModelPicker(false);
  };

  // 确认发送
  const handleConfirmGuide = () => {
    setShowGuide(false);
    setInputText(guidePrompt);
    setTimeout(() => {
      handleSendWithText(guidePrompt);
    }, 100);
  };

  // 取消引导
  const handleCancelGuide = () => {
    setShowGuide(false);
    setGuidePrompt('');
  };

  // 新对话
  const handleNewChat = async () => {
    if (messages.length === 0) return;
    
    Alert.alert(
      '开始新对话',
      '确定要清空当前对话记录吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          style: 'destructive',
          onPress: async () => {
            if (sseRef.current) {
              sseRef.current.close();
            }
            setMessages([]);
            setInputText('');
            setIsLoading(false);
            setCurrentProject(null);
            setGuidePrompt('');
            setShowGuide(false);
            // 清除当前会话
            setCurrentSession(null);
            await saveCurrentSessionId(null);
          }
        },
      ]
    );
  };

  // 发送消息
  const handleSendWithText = async (text: string) => {
    if (!text.trim() || isLoading || !selectedModel) return;

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

    // 如果没有当前会话，创建一个新会话
    if (!currentSession && userId && autoSaveEnabled) {
      const title = text.trim().substring(0, 30) + (text.trim().length > 30 ? '...' : '');
      const session = await createChatSession(
        userId,
        title,
        selectedModel.code,
        selectedModel.name,
        selectedModel.provider
      );
      if (session) {
        setCurrentSession(session);
        await saveCurrentSessionId(session.id);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '' }]);

    try {
      // 使用新的统一AI网关接口
      const url = `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/ai/chat/stream`;

      const sse = new RNSSE(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userId || 'anonymous',
          model: selectedModel.code,
          messages: [
            { 
              role: 'system', 
              content: '你是 G open AI，一个专业的游戏和动漫创作助手。你帮助用户设计角色、场景、剧情和游戏机制。你要富有创意、详细具体、充满启发性。请使用中文回复用户。'
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content }
          ],
          stream: true,
        }),
        method: 'POST',
      });

      sseRef.current = sse;

      sse.addEventListener('message', (event: any) => {
        const data = event.data;
        if (data === '[DONE]') {
          sse.close();
          setIsLoading(false);
          // 更新会话信息
          if (currentSession) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg) {
              updateChatSession(currentSession.id, {
                lastMessage: lastMsg.content.substring(0, 100),
                messageCount: messages.length,
              });
            }
          }
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
        { id: aiMessageId, role: 'assistant', content: '连接错误，请重试' },
      ]);
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText;
    setInputText('');
    await handleSendWithText(textToSend);
  };

  // 保存作品
  const handleSaveWork = async (message: Message) => {
    if (!userId || message.saved || savingMessageId === message.id) return;

    setSavingMessageId(message.id);

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_id: currentProject?.title ? `project_${Date.now()}` : undefined,
          project_title: currentProject?.title || 'AI创作',
          project_type: currentProject?.type || 'AI对话',
          service_type: 'chat',
          service_name: 'AI对话创作',
          content: message.content,
          content_type: 'text',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === message.id ? { ...msg, saved: true } : msg
          )
        );
        Alert.alert('保存成功', '作品已保存到「我的作品」', [
          { text: '继续创作', style: 'default' },
          { text: '查看作品', onPress: () => router.push('/my-works') },
        ]);
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Save work error:', error);
      Alert.alert('保存失败', '请稍后重试');
    } finally {
      setSavingMessageId(null);
    }
  };

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
  const providerColor = selectedModel ? (PROVIDER_COLORS[selectedModel.provider] || theme.primary) : theme.primary;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      {/* 推广弹窗 */}
      <PromoModal 
        visible={false}
        onClose={() => {}}
        onJoin={() => router.push('/promotion')}
      />

      {/* 引导确认Modal */}
      <Modal visible={showGuide} transparent animationType="slide" onRequestClose={handleCancelGuide}>
        <View style={styles.guideOverlay}>
          <View style={[styles.guideModal, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.guideHeader}>
              <View style={[styles.guideIconWrap, { backgroundColor: `${theme.primary}20` }]}>
                <FontAwesome6 name="wand-magic-sparkles" size={24} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText variant="h3" color={theme.textPrimary}>创作引导</ThemedText>
                {currentProject && (
                  <ThemedText variant="label" color={theme.textMuted}>
                    项目：{currentProject.title} · {currentProject.type}
                  </ThemedText>
                )}
              </View>
            </View>

            <View style={styles.guideContent}>
              <ThemedText variant="labelSmall" color={theme.textMuted}>
                即将发送的创作提示：
              </ThemedText>
              <ScrollView style={styles.guidePromptWrap} nestedScrollEnabled>
                <ThemedText variant="body" color={theme.textPrimary}>{guidePrompt}</ThemedText>
              </ScrollView>
            </View>

            <View style={[styles.guideTip, { backgroundColor: theme.backgroundTertiary }]}>
              <FontAwesome6 name="lightbulb" size={16} color={theme.accent} />
              <ThemedText variant="caption" color={theme.textSecondary}>
                确认后AI将根据以上提示开始创作，您也可以取消后手动修改
              </ThemedText>
            </View>

            <View style={styles.guideActions}>
              <TouchableOpacity 
                style={[styles.guideButton, styles.guideCancelButton, { borderColor: theme.border }]}
                onPress={handleCancelGuide}
              >
                <ThemedText variant="label" color={theme.textSecondary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.guideButton, styles.guideConfirmButton, { backgroundColor: theme.primary }]}
                onPress={handleConfirmGuide}
              >
                <FontAwesome6 name="paper-plane" size={14} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText variant="label" color="#fff">确认开始创作</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 模型选择Modal */}
      <Modal visible={showModelPicker} transparent animationType="slide" onRequestClose={() => setShowModelPicker(false)}>
        <View style={styles.guideOverlay}>
          <View style={[styles.guideModal, { backgroundColor: theme.backgroundDefault, maxHeight: '80%' }]}>
            <View style={styles.guideHeader}>
              <ThemedText variant="h3" color={theme.textPrimary}>选择模型</ThemedText>
              <TouchableOpacity onPress={() => setShowModelPicker(false)}>
                <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {availableModels.map((model) => {
                const color = PROVIDER_COLORS[model.provider] || theme.primary;
                const isSelected = selectedModel?.code === model.code;
                const isLocked = (model.pricing.tier === 'enterprise' && !isSuperMember) ||
                                (model.pricing.tier === 'premium' && !isMember);
                
                return (
                  <TouchableOpacity
                    key={model.code}
                    style={[
                      styles.modelPickerItem,
                      { borderColor: isSelected ? color : theme.border, borderWidth: isSelected ? 2 : 1 },
                    ]}
                    onPress={() => handleSelectModel(model)}
                    disabled={isLocked}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.modelPickerIcon, { backgroundColor: color + '20' }]}>
                        <FontAwesome6 name="brain" size={16} color={color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <ThemedText variant="smallMedium" color={theme.textPrimary}>{model.name}</ThemedText>
                          {model.pricing.tier === 'free' && (
                            <View style={[styles.tierBadge, { backgroundColor: theme.success + '20' }]}>
                              <Text style={{ color: theme.success, fontSize: 10 }}>免费</Text>
                            </View>
                          )}
                          {model.pricing.tier === 'premium' && (
                            <View style={[styles.tierBadge, { backgroundColor: '#D9770620' }]}>
                              <Text style={{ color: '#D97706', fontSize: 10 }}>会员</Text>
                            </View>
                          )}
                          {model.pricing.tier === 'enterprise' && (
                            <View style={[styles.tierBadge, { backgroundColor: '#7C3AED20' }]}>
                              <Text style={{ color: '#7C3AED', fontSize: 10 }}>超级会员</Text>
                            </View>
                          )}
                        </View>
                        <ThemedText variant="caption" color={theme.textMuted}>{model.providerName}</ThemedText>
                      </View>
                      {isLocked && <FontAwesome6 name="lock" size={14} color={theme.textMuted} />}
                      {isSelected && !isLocked && <FontAwesome6 name="check" size={16} color={color} />}
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        输入: ¥{(model.pricing.input / 100).toFixed(2)}/百万
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        输出: ¥{(model.pricing.output / 100).toFixed(2)}/百万
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.guideButton, { backgroundColor: theme.primary, marginTop: 16 }]}
              onPress={() => router.push('/models')}
            >
              <FontAwesome6 name="grip" size={14} color="#fff" style={{ marginRight: 8 }} />
              <ThemedText variant="label" color="#fff">查看全部模型</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <ThemedText variant="h4" color={theme.textPrimary}>
                  G open AI 创作助手
                </ThemedText>
              </View>
              {messages.length > 0 && (
                <TouchableOpacity 
                  style={[styles.newChatButton, { borderColor: theme.border }]}
                  onPress={handleNewChat}
                >
                  <FontAwesome6 name="plus" size={12} color={theme.primary} />
                  <ThemedText variant="captionMedium" color={theme.primary}>新对话</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ThemedText variant="label" color={theme.textMuted}>
                由 OPENCLAW 引擎驱动
              </ThemedText>
              {isMember && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <FontAwesome6 name="crown" size={10} color={theme.primary} />
                  <ThemedText variant="tiny" color={theme.primary}>会员</ThemedText>
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

          {/* 模型选择器 */}
          <TouchableOpacity 
            style={[styles.modelSelector, { borderColor: providerColor }]}
            onPress={() => setShowModelPicker(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.modelSelectorIcon, { backgroundColor: providerColor + '20' }]}>
                <FontAwesome6 name="brain" size={16} color={providerColor} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {selectedModel?.name || '选择模型'}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {selectedModel?.providerName || '点击选择'}
                </ThemedText>
              </View>
            </View>
            <FontAwesome6 name="chevron-down" size={14} color={theme.textMuted} />
          </TouchableOpacity>

          {/* 推广横幅 */}
          <PromoBanner onPress={() => router.push('/promotion')} />

          {/* Usage indicator */}
          {!isMember && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <ThemedText variant="caption" color={theme.textMuted}>
                今日剩余对话：{remainingChats} 次
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/membership')}>
                <ThemedText variant="captionMedium" color={theme.primary}>升级会员</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages or Empty State */}
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <FontAwesome6 name="robot" size={32} color={theme.primary} />
              </View>
              <ThemedText variant="h3" color={theme.textPrimary}>准备开始创作</ThemedText>
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
                    <ThemedText variant="small" color={theme.textSecondary}>{action}</ThemedText>
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
                  {message.role === 'assistant' && message.content.length > 50 && !isLoading && (
                    <View style={styles.messageActions}>
                      <TouchableOpacity
                        style={[
                          styles.saveButton,
                          message.saved && styles.saveButtonSaved,
                          { borderColor: message.saved ? theme.success : theme.primary },
                        ]}
                        onPress={() => handleSaveWork(message)}
                        disabled={message.saved || savingMessageId === message.id}
                      >
                        {savingMessageId === message.id ? (
                          <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                          <>
                            <FontAwesome6
                              name={message.saved ? 'check' : 'bookmark'}
                              size={12}
                              color={message.saved ? theme.success : theme.primary}
                            />
                            <ThemedText variant="captionMedium" color={message.saved ? theme.success : theme.primary}>
                              {message.saved ? '已保存' : '保存到作品库'}
                            </ThemedText>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
                  <ThemedText variant="labelSmall" color={theme.primary}>G open AI</ThemedText>
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
