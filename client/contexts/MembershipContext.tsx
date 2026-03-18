import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MemberLevel = 'free' | 'member' | 'super';

interface MembershipState {
  level: MemberLevel;
  expireDate: string | null;
  planType: string | null;
  dailyChatCount: number;
  maxFreeChatsPerDay: number;
  storageUsed: number;
  maxStorageMB: number;
}

interface MembershipContextType extends MembershipState {
  checkMembership: () => Promise<void>;
  incrementChatCount: () => Promise<boolean>;
  canChat: () => boolean;
  setMember: (level: MemberLevel, expireDate: string, planType: string) => Promise<void>;
  canUseFeature: (feature: FeatureType) => boolean;
  getFeatureLabel: (feature: FeatureType) => string;
  getStorageLabel: () => string;
  isMember: boolean;
  isSuperMember: boolean;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

const MEMBERSHIP_KEY = 'gopen_membership';
const CHAT_COUNT_KEY = 'gopen_chat_count';
const CHAT_DATE_KEY = 'gopen_chat_date';
const STORAGE_KEY = 'gopen_storage_used';

export type FeatureType = 
  | 'env_setup'        // 环境打通 - 免费
  | 'basic_create'     // 基础创作 - 免费
  | 'content_create'   // 内容制作 - 普通会员
  | 'output_basic'     // 基础输出 - 普通会员
  | 'output_pro'       // 高级输出 - 超级会员
  | 'ai_advanced'      // 高级AI模型 - 超级会员
  | 'cloud_storage'    // 云端存储 - 超级会员
  | 'unlimited_chat'   // 无限对话 - 超级会员
  | 'priority_support' // 优先支持 - 超级会员
  | 'project_unlimited'; // 无限项目 - 超级会员

const FEATURE_PERMISSIONS: Record<FeatureType, MemberLevel[]> = {
  'env_setup': ['free', 'member', 'super'],
  'basic_create': ['free', 'member', 'super'],
  'content_create': ['member', 'super'],
  'output_basic': ['member', 'super'],
  'output_pro': ['super'],
  'ai_advanced': ['super'],
  'cloud_storage': ['super'],
  'unlimited_chat': ['super'],
  'priority_support': ['super'],
  'project_unlimited': ['super'],
};

const STORAGE_LIMITS: Record<MemberLevel, number> = {
  'free': 100,      // 100MB
  'member': 10000,   // 10GB
  'super': 100000,   // 100GB
};

const CHAT_LIMITS: Record<MemberLevel, number> = {
  'free': 10,      // 每日10次
  'member': 100,   // 每日100次
  'super': -1,     // 无限
};

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MembershipState>({
    level: 'free',
    expireDate: null,
    planType: null,
    dailyChatCount: 0,
    maxFreeChatsPerDay: 10,
    storageUsed: 0,
    maxStorageMB: 50,
  });

  const checkMembership = useCallback(async () => {
    try {
      const membershipData = await AsyncStorage.getItem(MEMBERSHIP_KEY);
      const chatCountStr = await AsyncStorage.getItem(CHAT_COUNT_KEY);
      const chatDate = await AsyncStorage.getItem(CHAT_DATE_KEY);
      const storageStr = await AsyncStorage.getItem(STORAGE_KEY);

      const today = new Date().toDateString();
      let dailyCount = 0;

      if (chatDate === today && chatCountStr) {
        dailyCount = parseInt(chatCountStr, 10);
      }

      if (membershipData) {
        const membership = JSON.parse(membershipData);
        const expireDate = new Date(membership.expireDate);
        const isValid = expireDate > new Date();
        const level: MemberLevel = isValid ? membership.level : 'free';

        setState({
          level,
          expireDate: isValid ? membership.expireDate : null,
          planType: isValid ? membership.planType : null,
          dailyChatCount: dailyCount,
          maxFreeChatsPerDay: CHAT_LIMITS[level] === -1 ? -1 : CHAT_LIMITS[level],
          storageUsed: storageStr ? parseInt(storageStr, 10) : 0,
          maxStorageMB: STORAGE_LIMITS[level],
        });
      } else {
        setState(prev => ({
          ...prev,
          dailyChatCount: dailyCount,
          storageUsed: storageStr ? parseInt(storageStr, 10) : 0,
        }));
      }
    } catch (error) {
      console.error('Failed to check membership:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await checkMembership();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const incrementChatCount = useCallback(async (): Promise<boolean> => {
    if (state.level === 'super') return true;

    const maxChats = CHAT_LIMITS[state.level];
    if (maxChats === -1) return true;

    const today = new Date().toDateString();

    try {
      const chatDate = await AsyncStorage.getItem(CHAT_DATE_KEY);

      if (chatDate !== today) {
        await AsyncStorage.setItem(CHAT_DATE_KEY, today);
        await AsyncStorage.setItem(CHAT_COUNT_KEY, '1');
        setState(prev => ({ ...prev, dailyChatCount: 1 }));
        return true;
      }

      if (state.dailyChatCount >= maxChats) {
        return false;
      }

      const newCount = state.dailyChatCount + 1;
      await AsyncStorage.setItem(CHAT_COUNT_KEY, newCount.toString());
      setState(prev => ({ ...prev, dailyChatCount: newCount }));
      return true;
    } catch (error) {
      console.error('Failed to increment chat count:', error);
      return false;
    }
  }, [state.level, state.dailyChatCount]);

  const canChat = useCallback((): boolean => {
    if (state.level === 'super') return true;
    const maxChats = CHAT_LIMITS[state.level];
    if (maxChats === -1) return true;
    return state.dailyChatCount < maxChats;
  }, [state.level, state.dailyChatCount]);

  const setMember = useCallback(async (level: MemberLevel, expireDate: string, planType: string) => {
    try {
      await AsyncStorage.setItem(MEMBERSHIP_KEY, JSON.stringify({ level, expireDate, planType }));
      setState(prev => ({
        ...prev,
        level,
        expireDate,
        planType,
        maxFreeChatsPerDay: CHAT_LIMITS[level] === -1 ? -1 : CHAT_LIMITS[level],
        maxStorageMB: STORAGE_LIMITS[level],
      }));
    } catch (error) {
      console.error('Failed to set membership:', error);
    }
  }, []);

  const canUseFeature = useCallback((feature: FeatureType): boolean => {
    return FEATURE_PERMISSIONS[feature].includes(state.level);
  }, [state.level]);

  const getFeatureLabel = useCallback((feature: FeatureType): string => {
    const allowed = FEATURE_PERMISSIONS[feature];
    if (allowed.includes('free')) return '免费';
    if (allowed.includes('member')) return '会员';
    return '超级会员';
  }, []);

  const getStorageLabel = useCallback((): string => {
    if (state.level === 'super') return '100GB存储';
    if (state.level === 'member') return '10GB存储';
    return '100MB存储';
  }, [state.level]);

  const isMember = state.level === 'member' || state.level === 'super';
  const isSuperMember = state.level === 'super';

  return (
    <MembershipContext.Provider
      value={{
        ...state,
        checkMembership,
        incrementChatCount,
        canChat,
        setMember,
        canUseFeature,
        getFeatureLabel,
        getStorageLabel,
        isMember,
        isSuperMember,
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (context === undefined) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}
