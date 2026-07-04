/**
 * 聊天历史服务
 * 管理对话会话的创建、更新、保存
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  model?: string;
  model_name?: string;
  provider?: string;
  message_count: number;
  last_message: string;
  last_message_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

/**
 * 创建新对话会话
 */
export async function createChatSession(
  userId: string,
  title: string,
  model?: string,
  modelName?: string,
  provider?: string
): Promise<ChatSession | null> {
  try {
    const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title,
        model,
        modelName,
        provider,
      }),
    });

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Create chat session error:', error);
    return null;
  }
}

/**
 * 更新对话会话
 */
export async function updateChatSession(
  sessionId: string,
  data: { title?: string; lastMessage?: string; messageCount?: number }
): Promise<boolean> {
  try {
    const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat-history/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        lastMessage: data.lastMessage,
        messageCount: data.messageCount,
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Update chat session error:', error);
    return false;
  }
}

/**
 * 保存消息到会话
 */
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ChatMessage | null> {
  try {
    const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat-history/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        content,
      }),
    });

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Save message error:', error);
    return null;
  }
}

/**
 * 获取用户对话历史列表
 */
export async function getChatSessions(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<ChatSession[]> {
  try {
    const response = await fetch(
      `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat-history/user/${userId}?page=${page}&limit=${limit}`
    );
    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Get chat sessions error:', error);
    return [];
  }
}

/**
 * 获取对话详情（包含消息）
 */
export async function getChatSessionDetail(sessionId: string): Promise<{
  session: ChatSession;
  messages: ChatMessage[];
} | null> {
  try {
    const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat-history/${sessionId}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      const { messages, ...session } = result.data;
      return {
        session,
        messages: messages || [],
      };
    }
    return null;
  } catch (error) {
    console.error('Get session detail error:', error);
    return null;
  }
}

/**
 * 删除对话
 */
export async function deleteChatSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/chat-history/${sessionId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Delete chat session error:', error);
    return false;
  }
}

/**
 * 本地缓存当前会话ID
 */
export const SESSION_CACHE_KEY = 'current_chat_session';

export async function saveCurrentSessionId(sessionId: string | null): Promise<void> {
  if (sessionId) {
    await AsyncStorage.setItem(SESSION_CACHE_KEY, sessionId);
  } else {
    await AsyncStorage.removeItem(SESSION_CACHE_KEY);
  }
}

export async function getCurrentSessionId(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_CACHE_KEY);
}

export default {
  createChatSession,
  updateChatSession,
  saveMessage,
  getChatSessions,
  getChatSessionDetail,
  deleteChatSession,
  saveCurrentSessionId,
  getCurrentSessionId,
};
