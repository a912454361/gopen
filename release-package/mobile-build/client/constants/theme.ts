// ==================== 主题配色系统 ====================

// 基础间距和圆角配置
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 112,
    lineHeight: 112,
    fontWeight: "200" as const,
    letterSpacing: -4,
  },
  displayLarge: {
    fontSize: 112,
    lineHeight: 112,
    fontWeight: "200" as const,
    letterSpacing: -2,
  },
  displayMedium: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "200" as const,
  },
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700" as const,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  smallMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  captionMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
  labelTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  stat: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  tiny: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "400" as const,
  },
  navLabel: {
    fontSize: 9,
    lineHeight: 14,
    fontWeight: "700" as const,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  },
};

// 主题类型定义
export type ThemeType = 'cyber' | 'aesthetic' | 'dynamic' | 'fashion' | 'ancient' | 'chinese';

// 主题名称映射
export const ThemeNames: Record<ThemeType, string> = {
  cyber: '暗黑科技',
  aesthetic: '唯美',
  dynamic: '动感',
  fashion: '时尚',
  ancient: '古风',
  chinese: '国风',
};

// 主题颜色类型
export type ThemeColors = {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  accent: string;
  success: string;
  error: string;
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundTertiary: string;
  buttonPrimaryText: string;
  tabIconSelected: string;
  border: string;
  borderLight: string;
  // 扩展色
  neonCyan?: string;
  neonPurple?: string;
  neonRed?: string;
  neonGreen?: string;
  gradientStart?: string;
  gradientEnd?: string;
};

// ==================== 主题配色方案 ====================

export const Themes: Record<ThemeType, ThemeColors> = {
  // 暗黑科技风（默认）
  cyber: {
    textPrimary: "#EAEAEA",
    textSecondary: "#A8A29E",
    textMuted: "#555570",
    primary: "#00F0FF", // 电光青
    accent: "#BF00FF", // 霓虹紫
    success: "#00FF88", // 矩阵绿
    error: "#FF003C", // 危险红
    backgroundRoot: "#0A0A0F", // 纯黑
    backgroundDefault: "#12121A", // 微亮黑
    backgroundTertiary: "#1A1A24", // 三级背景
    buttonPrimaryText: "#0A0A0F",
    tabIconSelected: "#00F0FF",
    border: "rgba(0,240,255,0.15)",
    borderLight: "rgba(0,240,255,0.08)",
    neonCyan: "#00F0FF",
    neonPurple: "#BF00FF",
    neonRed: "#FF003C",
    neonGreen: "#00FF88",
    gradientStart: "#00F0FF",
    gradientEnd: "#BF00FF",
  },

  // 唯美风 - 柔和梦幻
  aesthetic: {
    textPrimary: "#4A4A5A",
    textSecondary: "#7A7A8A",
    textMuted: "#9A9AAA",
    primary: "#B8A9E8", // 淡紫粉
    accent: "#F5B5C8", // 樱花粉
    success: "#A8D8B9", // 薄荷绿
    error: "#E8A9B8", // 玫瑰粉
    backgroundRoot: "#FAF8FC", // 米白
    backgroundDefault: "#FFFFFF", // 纯白
    backgroundTertiary: "#F5F3F8", // 浅紫灰
    buttonPrimaryText: "#FFFFFF",
    tabIconSelected: "#B8A9E8",
    border: "rgba(184,169,232,0.25)",
    borderLight: "rgba(184,169,232,0.12)",
    gradientStart: "#B8A9E8",
    gradientEnd: "#F5B5C8",
  },

  // 动感风 - 活力运动
  dynamic: {
    textPrimary: "#FFFFFF",
    textSecondary: "#B8C4D0",
    textMuted: "#6B7B8C",
    primary: "#FF6B35", // 活力橙
    accent: "#00D4FF", // 天蓝
    success: "#00E676", // 亮绿
    error: "#FF3D71", // 亮红
    backgroundRoot: "#0D1421", // 深蓝黑
    backgroundDefault: "#1A2234", // 深蓝灰
    backgroundTertiary: "#242F42", // 三级
    buttonPrimaryText: "#0D1421",
    tabIconSelected: "#FF6B35",
    border: "rgba(255,107,53,0.2)",
    borderLight: "rgba(255,107,53,0.1)",
    gradientStart: "#FF6B35",
    gradientEnd: "#00D4FF",
  },

  // 时尚风 - 现代高级
  fashion: {
    textPrimary: "#1A1A1A",
    textSecondary: "#5A5A5A",
    textMuted: "#8A8A8A",
    primary: "#C9A96E", // 香槟金
    accent: "#2C2C2C", // 墨黑
    success: "#4CAF7C", // 优雅绿
    error: "#D45B5B", // 高级红
    backgroundRoot: "#FAFAFA", // 米白
    backgroundDefault: "#FFFFFF", // 纯白
    backgroundTertiary: "#F5F5F5", // 浅灰
    buttonPrimaryText: "#FFFFFF",
    tabIconSelected: "#C9A96E",
    border: "rgba(201,169,110,0.25)",
    borderLight: "rgba(201,169,110,0.12)",
    gradientStart: "#C9A96E",
    gradientEnd: "#8B7355",
  },

  // 古风 - 古典雅致
  ancient: {
    textPrimary: "#3D3D3D",
    textSecondary: "#6B6B5A",
    textMuted: "#8A8A78",
    primary: "#5B7B6A", // 墨绿
    accent: "#8B6B4A", // 赭石
    success: "#6B8B5A", // 青绿
    error: "#9B5A5A", // 朱砂红
    backgroundRoot: "#F5F3ED", // 宣纸白
    backgroundDefault: "#FAF8F2", // 米黄
    backgroundTertiary: "#EDE9DF", // 浅米
    buttonPrimaryText: "#F5F3ED",
    tabIconSelected: "#5B7B6A",
    border: "rgba(91,123,106,0.25)",
    borderLight: "rgba(91,123,106,0.12)",
    gradientStart: "#5B7B6A",
    gradientEnd: "#8B6B4A",
  },

  // 国风 - 中国传统
  chinese: {
    textPrimary: "#F5E6D0",
    textSecondary: "#C9B896",
    textMuted: "#8A7B60",
    primary: "#C41E3A", // 中国红
    accent: "#D4AF37", // 金色
    success: "#2E8B57", // 翠绿
    error: "#DC143C", // 深红
    backgroundRoot: "#1A0A0A", // 深红黑
    backgroundDefault: "#2A1515", // 暗红
    backgroundTertiary: "#3A2020", // 三级
    buttonPrimaryText: "#F5E6D0",
    tabIconSelected: "#C41E3A",
    border: "rgba(196,30,58,0.25)",
    borderLight: "rgba(196,30,58,0.12)",
    gradientStart: "#C41E3A",
    gradientEnd: "#D4AF37",
  },
};

// 兼容旧版本的 Colors 导出
export const Colors = {
  light: Themes.aesthetic,
  dark: Themes.cyber,
};

export type Theme = ThemeColors;
