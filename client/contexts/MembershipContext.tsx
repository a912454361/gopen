import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MembershipState {
  isMember: boolean;
  expireDate: string | null;
  planType: string | null;
  dailyChatCount: number;
  maxFreeChatsPerDay: number;
}

interface MembershipContextType extends MembershipState {
  checkMembership: () => Promise<void>;
  incrementChatCount: () => Promise<boolean>;
  canChat: () => boolean;
  setMember: (expireDate: string, planType: string) => Promise<void>;
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined);

const MEMBERSHIP_KEY = 'gopen_membership';
const CHAT_COUNT_KEY = 'gopen_chat_count';
const CHAT_DATE_KEY = 'gopen_chat_date';

// Custom hook for async state initialization
function useAsyncInit<T>(asyncFn: () => Promise<T>, initialValue: T): T {
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    let mounted = true;
    asyncFn().then((result) => {
      if (mounted) {
        setState(result);
      }
    });
    return () => {
      mounted = false;
    };
  }, [asyncFn]);

  return state;
}

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MembershipState>({
    isMember: false,
    expireDate: null,
    planType: null,
    dailyChatCount: 0,
    maxFreeChatsPerDay: 10,
  });

  const checkMembership = useCallback(async () => {
    try {
      const membershipData = await AsyncStorage.getItem(MEMBERSHIP_KEY);
      const chatCountStr = await AsyncStorage.getItem(CHAT_COUNT_KEY);
      const chatDate = await AsyncStorage.getItem(CHAT_DATE_KEY);

      const today = new Date().toDateString();
      let dailyCount = 0;

      // Reset count if it's a new day
      if (chatDate === today && chatCountStr) {
        dailyCount = parseInt(chatCountStr, 10);
      }

      if (membershipData) {
        const membership = JSON.parse(membershipData);
        const expireDate = new Date(membership.expireDate);
        const isMember = expireDate > new Date();

        setState({
          isMember,
          expireDate: membership.expireDate,
          planType: membership.planType,
          dailyChatCount: dailyCount,
          maxFreeChatsPerDay: 10,
        });
      } else {
        setState(prev => ({
          ...prev,
          dailyChatCount: dailyCount,
        }));
      }
    } catch (error) {
      console.error('Failed to check membership:', error);
    }
  }, []);

  // Initialize membership on mount
  useEffect(() => {
    const init = async () => {
      await checkMembership();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const incrementChatCount = useCallback(async (): Promise<boolean> => {
    if (state.isMember) return true;

    const today = new Date().toDateString();

    try {
      const chatDate = await AsyncStorage.getItem(CHAT_DATE_KEY);

      if (chatDate !== today) {
        // New day, reset count
        await AsyncStorage.setItem(CHAT_DATE_KEY, today);
        await AsyncStorage.setItem(CHAT_COUNT_KEY, '1');
        setState(prev => ({ ...prev, dailyChatCount: 1 }));
        return true;
      }

      if (state.dailyChatCount >= state.maxFreeChatsPerDay) {
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
  }, [state.isMember, state.dailyChatCount, state.maxFreeChatsPerDay]);

  const canChat = useCallback((): boolean => {
    if (state.isMember) return true;
    return state.dailyChatCount < state.maxFreeChatsPerDay;
  }, [state.isMember, state.dailyChatCount, state.maxFreeChatsPerDay]);

  const setMember = useCallback(async (expireDate: string, planType: string) => {
    try {
      await AsyncStorage.setItem(MEMBERSHIP_KEY, JSON.stringify({ expireDate, planType }));
      setState(prev => ({
        ...prev,
        isMember: true,
        expireDate,
        planType,
      }));
    } catch (error) {
      console.error('Failed to set membership:', error);
    }
  }, []);

  return (
    <MembershipContext.Provider
      value={{
        ...state,
        checkMembership,
        incrementChatCount,
        canChat,
        setMember,
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
