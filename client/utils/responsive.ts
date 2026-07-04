/**
 * 响应式布局工具
 * 适配不同屏幕尺寸（iPhone SE 到 iPhone 16 Pro Max、Android 大屏等）
 */
import { Dimensions, PixelRatio, Platform } from 'react-native';

// 获取屏幕尺寸
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 基准设计尺寸（以 iPhone 14 为基准）
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// 屏幕类型判断
export const isSmallScreen = SCREEN_WIDTH < 375; // iPhone SE, iPhone 6/7/8
export const isMediumScreen = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414; // iPhone 12/13/14
export const isLargeScreen = SCREEN_WIDTH >= 414 && SCREEN_WIDTH < 428; // iPhone 12/13/14 Pro Max
export const isExtraLargeScreen = SCREEN_WIDTH >= 428; // iPhone 14 Pro Max, iPhone 16 Pro Max

// 安全区相关
export const getSafeBottom = () => {
  // 不同设备的底部安全区高度
  if (Platform.OS === 'android') return 0;
  if (isSmallScreen) return 34;
  if (isMediumScreen) return 34;
  if (isLargeScreen) return 34;
  return 34; // 默认
};

/**
 * 根据屏幕宽度缩放尺寸
 * 适用于：字体、间距、小图标等
 */
export const scaleSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * 根据屏幕宽度缩放字体
 * 设置最大缩放比例，防止大屏字体过大
 */
export const scaleFont = (size: number, maxScale: number = 1.2): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, maxScale);
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * 响应式宽度
 * 根据屏幕宽度计算百分比
 */
export const responsiveWidth = (percent: number): number => {
  return (SCREEN_WIDTH * percent) / 100;
};

/**
 * 响应式高度
 * 根据屏幕高度计算百分比
 */
export const responsiveHeight = (percent: number): number => {
  return (SCREEN_HEIGHT * percent) / 100;
};

/**
 * 计算二维码尺寸
 * 小屏幕：180px
 * 中等屏幕：200px
 * 大屏幕：220px
 * 超大屏幕：240px
 */
export const getQRCodeSize = (): number => {
  if (isSmallScreen) return 180;
  if (isMediumScreen) return 200;
  if (isLargeScreen) return 220;
  return 240;
};

/**
 * 计算卡片圆角
 * 根据屏幕大小调整圆角
 */
export const getCardBorderRadius = (): number => {
  if (isSmallScreen) return 12;
  if (isMediumScreen) return 16;
  return 20;
};

/**
 * 计算图标大小
 * 根据屏幕大小调整图标
 */
export const getIconSize = (baseSize: number): number => {
  if (isSmallScreen) return baseSize * 0.9;
  if (isLargeScreen || isExtraLargeScreen) return baseSize * 1.1;
  return baseSize;
};

/**
 * 计算间距
 * 根据屏幕大小调整间距
 */
export const getSpacing = (baseSpacing: number): number => {
  return scaleSize(baseSpacing);
};

/**
 * 导出屏幕尺寸信息
 */
export const screenInfo = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  isExtraLargeScreen,
  pixelRatio: PixelRatio.get(),
};

// 常用尺寸预设
export const Sizes = {
  // 图标尺寸
  iconSmall: scaleSize(16),
  iconMedium: scaleSize(20),
  iconLarge: scaleSize(24),
  iconXLarge: scaleSize(32),
  
  // 二维码尺寸
  qrcodeSmall: getQRCodeSize() * 0.8,
  qrcodeMedium: getQRCodeSize(),
  qrcodeLarge: getQRCodeSize() * 1.2,
  
  // 按钮高度
  buttonHeight: scaleSize(48),
  buttonHeightSmall: scaleSize(40),
  buttonHeightLarge: scaleSize(56),
  
  // 输入框高度
  inputHeight: scaleSize(44),
  
  // 头部高度
  headerHeight: scaleSize(56),
  
  // Tab Bar 高度
  tabBarHeight: Platform.OS === 'web' ? 60 : 50 + getSafeBottom(),
};
