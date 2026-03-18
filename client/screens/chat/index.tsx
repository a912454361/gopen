import React, { useState, useRef, useMemo, useEffect } from 'react';
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
import { useSafeRouter } from '@/hooks/useSafeRouter';
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

export default function ChatScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { isMember, dailyChatCount, maxFreeChatsPerDay, incrementChatCount, canChat } = useMembership();
  const router = useSafeRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
