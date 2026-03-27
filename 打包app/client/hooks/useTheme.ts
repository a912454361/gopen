import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true); // 默认暗色主题

  const theme: Theme = isDark ? darkTheme : lightTheme;

  return {
    theme,
    isDark,
    toggleTheme: () => setIsDark(!isDark),
  };
}
