/**
 * 万古长夜 - 主题常量
 */

// 间距系统
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

// 圆角系统
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

// 主题类型
export interface Theme {
  // 主色调
  primary: string;
  accent: string;
  
  // 背景色
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundTertiary: string;
  
  // 文字色
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // 边框色
  border: string;
  borderLight: string;
  
  // 按钮色
  buttonPrimaryText: string;
  
  // 状态色
  success: string;
  error: string;
  warning: string;
  
  // 阵营色
  factionYouming: string;    // 幽冥 - 深紫
  factionKunlun: string;     // 昆仑 - 冰雪天青
  factionPenglai: string;    // 蓬莱 - 粉霞
  factionManhuang: string;   // 蛮荒 - 烈焰
  factionWangu: string;      // 万古 - 金色
}

// 暗色主题
export const darkTheme: Theme = {
  primary: '#D4AF37',           // 金色主色
  accent: '#8B5CF6',            // 紫色点缀
  
  backgroundRoot: '#0A0A0F',    // 深黑背景
  backgroundDefault: '#12121A', // 默认背景
  backgroundTertiary: '#1A1A25', // 三级背景
  
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#6B6B80',
  
  border: 'rgba(212, 175, 55, 0.2)',
  borderLight: 'rgba(212, 175, 55, 0.1)',
  
  buttonPrimaryText: '#000000',
  
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  
  // 五大阵营色
  factionYouming: '#8B5CF6',    // 幽冥 - 深紫
  factionKunlun: '#4FC3F7',     // 昆仑 - 冰雪天青
  factionPenglai: '#F8BBD9',    // 蓬莱 - 粉霞
  factionManhuang: '#FF6F00',   // 蛮荒 - 烈焰
  factionWangu: '#D4AF37',      // 万古 - 金色
};

// 字体样式
export const FontSize = {
  tiny: 10,
  caption: 12,
  small: 14,
  body: 16,
  label: 18,
  h4: 20,
  h3: 24,
  h2: 28,
  h1: 32,
  hero: 40,
} as const;

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};
