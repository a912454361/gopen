import { useState, useEffect, useCallback } from 'react';
import { Themes, ThemeType, ThemeColors, ThemeNames } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'app_theme_choice';

// 当前选中的主题
let currentThemeType: ThemeType = 'cyber';
let themeChangeCallbacks: Array<(theme: ThemeColors, themeType: ThemeType) => void> = [];

// 获取主题
function getTheme(themeType: ThemeType): { theme: ThemeColors; themeType: ThemeType; isDark: boolean } {
  const theme = Themes[themeType];
  // 判断是否为深色主题（背景较深）
  const isDark = theme.backgroundRoot.toLowerCase().includes('0') || 
                 theme.backgroundRoot.startsWith('#1') ||
                 theme.backgroundRoot.startsWith('#0') ||
                 theme.backgroundRoot.startsWith('#2');
  
  return { theme, themeType, isDark };
}

// 设置主题并通知所有监听者
function setTheme(themeType: ThemeType) {
  currentThemeType = themeType;
  const { theme } = getTheme(themeType);
  themeChangeCallbacks.forEach(callback => callback(theme, themeType));
  
  // 持久化存储
  AsyncStorage.setItem(THEME_STORAGE_KEY, themeType);
}

// 获取当前主题类型
function getCurrentThemeType(): ThemeType {
  return currentThemeType;
}

// Hook: 使用主题
function useTheme() {
  const [themeState, setThemeState] = useState<{
    theme: ThemeColors;
    themeType: ThemeType;
    isDark: boolean;
  }>(() => getTheme(currentThemeType));

  useEffect(() => {
    // 加载保存的主题
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && savedTheme !== currentThemeType) {
          currentThemeType = savedTheme as ThemeType;
          setThemeState(getTheme(currentThemeType));
        }
      } catch (e) {
        // 忽略错误
      }
    };
    loadTheme();

    // 注册主题变化监听
    const handleThemeChange = (newTheme: ThemeColors, newThemeType: ThemeType) => {
      setThemeState(getTheme(newThemeType));
    };
    
    themeChangeCallbacks.push(handleThemeChange);

    return () => {
      themeChangeCallbacks = themeChangeCallbacks.filter(cb => cb !== handleThemeChange);
    };
  }, []);

  // 切换主题
  const changeTheme = useCallback((newThemeType: ThemeType) => {
    setTheme(newThemeType);
    setThemeState(getTheme(newThemeType));
  }, []);

  return {
    ...themeState,
    changeTheme,
    themeNames: ThemeNames,
    availableThemes: Object.keys(Themes) as ThemeType[],
  };
}

export {
  useTheme,
  getTheme,
  setTheme,
  getCurrentThemeType,
  ThemeNames,
  Themes,
  type ThemeType,
  type ThemeColors,
};
