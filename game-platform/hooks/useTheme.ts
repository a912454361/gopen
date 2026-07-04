import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, Theme } from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  
  // 游戏平台固定使用暗色主题
  const theme = useMemo(() => darkTheme, []);
  const isDark = true;
  
  return { theme, isDark };
}
