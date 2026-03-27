/**
 * Screen 组件 - 统一页面容器
 */

import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark';
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  backgroundColor = '#0A0A0F',
  statusBarStyle = 'light',
  safeAreaEdges = ['top', 'left', 'right'],
}) => {
  const insets = useSafeAreaInsets();

  const getPadding = () => {
    return {
      paddingTop: safeAreaEdges.includes('top') ? insets.top : 0,
      paddingBottom: safeAreaEdges.includes('bottom') ? insets.bottom : 0,
      paddingLeft: safeAreaEdges.includes('left') ? insets.left : 0,
      paddingRight: safeAreaEdges.includes('right') ? insets.right : 0,
    };
  };

  return (
    <View style={[styles.container, { backgroundColor }, getPadding()]}>
      <StatusBar barStyle={statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
