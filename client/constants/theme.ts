export const Colors = {
  light: {
    textPrimary: "#EAEAEA",
    textSecondary: "#A8A29E",
    textMuted: "#555570",
    primary: "#00F0FF", // 电光青 - 霓虹主色
    accent: "#BF00FF", // 霓虹紫 - 辅助色
    success: "#00FF88", // 矩阵绿
    error: "#FF003C", // 危险红
    backgroundRoot: "#0A0A0F", // 纯黑背景
    backgroundDefault: "#12121A", // 微亮黑卡片
    backgroundTertiary: "#1A1A24", // 三级背景
    buttonPrimaryText: "#0A0A0F",
    tabIconSelected: "#00F0FF",
    border: "rgba(0,240,255,0.15)",
    borderLight: "rgba(0,240,255,0.08)",
    neonCyan: "#00F0FF", // 霓虹青
    neonPurple: "#BF00FF", // 霓虹紫
    neonRed: "#FF003C", // 霓虹红
    neonGreen: "#00FF88", // 霓虹绿
  },
  dark: {
    textPrimary: "#EAEAEA",
    textSecondary: "#A8A29E",
    textMuted: "#555570",
    primary: "#00F0FF", // 电光青 - 霓虹主色
    accent: "#BF00FF", // 霓虹紫 - 辅助色
    success: "#00FF88", // 矩阵绿
    error: "#FF003C", // 危险红
    backgroundRoot: "#0A0A0F", // 纯黑背景
    backgroundDefault: "#12121A", // 微亮黑卡片
    backgroundTertiary: "#1A1A24", // 三级背景
    buttonPrimaryText: "#0A0A0F",
    tabIconSelected: "#00F0FF",
    border: "rgba(0,240,255,0.15)",
    borderLight: "rgba(0,240,255,0.08)",
    neonCyan: "#00F0FF", // 霓虹青
    neonPurple: "#BF00FF", // 霓虹紫
    neonRed: "#FF003C", // 霓虹红
    neonGreen: "#00FF88", // 霓虹绿
  },
};

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
  sm: 8, // 暗黑科技风使用锐利小圆角
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

export type Theme = typeof Colors.light;
