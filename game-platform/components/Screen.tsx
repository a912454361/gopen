/**
 * 屏幕容器组件
 */
import React from 'react';
import { View, StyleSheet, StatusBar, Platform, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light' | 'dark';
  style?: ViewStyle;
}

export function Screen({ 
  children, 
  backgroundColor = '#0A0A0F', 
  statusBarStyle = 'light',
  style 
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor,
          paddingTop: Platform.OS === 'web' ? 0 : insets.top,
          paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom,
        },
        style
      ]}
    >
      <StatusBar 
        barStyle={statusBarStyle === 'light' ? 'light-content' : 'dark-content'} 
        backgroundColor={backgroundColor}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
