/**
 * 主题上下文
 */

import React from 'react';
import { Theme, ThemeMode } from '@/constants/theme';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = React.createContext<ThemeContextValue>({
  theme: {} as Theme,
  themeMode: 'dark',
  setThemeMode: () => {},
});

export const useTheme = () => React.useContext(ThemeContext);
