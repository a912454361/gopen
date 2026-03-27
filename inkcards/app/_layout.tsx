/**
 * 万古长夜 - 主布局
 */

import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, themes, darkTheme } from '@/constants/theme';
import { ThemeContext } from '@/contexts/ThemeContext';

export default function RootLayout() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [theme, setTheme] = useState<Theme>(darkTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    const newTheme = themeMode === 'system' 
      ? darkTheme // 简化处理，实际应检测系统主题
      : themes[themeMode];
    setTheme(newTheme);
  }, [themeMode]);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_mode');
      if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
        setThemeMode(saved as ThemeMode);
      }
    } catch (error) {
      console.error('加载主题失败:', error);
    }
  };

  const changeTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem('theme_mode', mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode: changeTheme }}>
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: theme.backgroundRoot },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ title: '万古长夜' }} />
          <Stack.Screen name="battle" options={{ title: '对战', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="cloud" options={{ title: '云游戏', animation: 'fade' }} />
          <Stack.Screen name="collection" options={{ title: '卡牌收藏' }} />
          <Stack.Screen name="shop" options={{ title: '商店' }} />
        </Stack>
      </View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
