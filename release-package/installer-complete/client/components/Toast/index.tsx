/**
 * Toast 轻提示组件
 * 用于快速反馈操作结果
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { setToastService } from './ToastService';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { theme } = useTheme();

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    
    // 3秒后自动移除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // 注册全局服务
  useEffect(() => {
    setToastService({ showToast });
  }, [showToast]);

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { bg: ['#10B981', '#059669'], icon: 'check-circle' };
      case 'error':
        return { bg: ['#EF4444', '#DC2626'], icon: 'circle-xmark' };
      case 'warning':
        return { bg: ['#F59E0B', '#D97706'], icon: 'triangle-exclamation' };
      case 'info':
        return { bg: [theme.primary, theme.accent], icon: 'circle-info' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map(toast => {
          const style = getToastStyle(toast.type);
          return (
            <Animated.View key={toast.id} style={styles.toast}>
              <LinearGradient
                colors={style.bg as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.toastGradient}
              >
                <FontAwesome6 name={style.icon} size={18} color="#fff" />
                <ThemedText variant="smallMedium" color="#fff" style={styles.toastText}>
                  {toast.message}
                </ThemedText>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  toastText: {
    marginLeft: Spacing.sm,
  },
});

export default ToastProvider;
