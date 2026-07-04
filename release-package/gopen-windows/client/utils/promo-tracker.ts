import { useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface PromoTrackerProps {
  promoCode?: string;
}

// 从 URL 参数获取推广码
function getPromoCodeFromUrl(): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('ref') || params.get('promo_code') || null;
  }
  return null;
}

// 从 URL 参数获取 UTM 参数
function getUTMParams(): Record<string, string> {
  const utmParams: Record<string, string> = {};
  
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(key => {
      const value = params.get(key);
      if (value) utmParams[key] = value;
    });
  }
  
  return utmParams;
}

// 获取设备信息
function getDeviceInfo(): Record<string, string> {
  return {
    device_type: Platform.OS === 'web' ? 'web' : (Platform.OS as string),
    device_brand: Device.brand || 'unknown',
    device_model: Device.modelName || 'unknown',
    os_name: Platform.OS === 'web' ? 'web' : (Device.osName || 'unknown'),
    os_version: Device.osVersion || 'unknown',
  };
}

// 获取浏览器信息（仅 Web）
function getBrowserInfo(): Record<string, string> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
    return {};
  }

  const ua = navigator.userAgent;
  let browser = 'unknown';
  let browserVersion = 'unknown';

  if (ua.includes('Chrome')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
  } else if (ua.includes('Safari')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'unknown';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
    browserVersion = ua.match(/Edge\/(\d+)/)?.[1] || 'unknown';
  }

  return { browser, browser_version: browserVersion };
}

// 发送追踪数据
async function sendTrackingData(data: Record<string, any>): Promise<void> {
  try {
    await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/promo/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Promo tracking error:', error);
  }
}

// 推广追踪 Hook
export function usePromoTracker(): {
  trackEvent: (eventName: string, eventData?: Record<string, any>) => void;
  trackConversion: (conversionType: string, value?: number) => void;
  getPromoInfo: () => { code: string | null; utm: Record<string, string> };
} {
  const hasTrackedVisit = useRef(false);
  const promoCode = useRef<string | null>(null);
  const utmParams = useRef<Record<string, string>>({});

  useEffect(() => {
    // 获取推广码和 UTM 参数
    promoCode.current = getPromoCodeFromUrl();
    utmParams.current = getUTMParams();

    // 如果有推广码，发送首次访问追踪
    if (promoCode.current && !hasTrackedVisit.current) {
      hasTrackedVisit.current = true;
      
      const trackingData = {
        code: promoCode.current,
        ...utmParams.current,
        ...getDeviceInfo(),
        ...getBrowserInfo(),
        referrer: Platform.OS === 'web' ? document.referrer : undefined,
        user_agent: Platform.OS === 'web' ? navigator.userAgent : undefined,
        screen_width: Platform.OS === 'web' ? window.screen.width : undefined,
        screen_height: Platform.OS === 'web' ? window.screen.height : undefined,
        language: Platform.OS === 'web' ? navigator.language : undefined,
        timestamp: new Date().toISOString(),
      };

      sendTrackingData(trackingData);
    }
  }, []);

  // 追踪自定义事件
  const trackEvent = (eventName: string, eventData?: Record<string, any>) => {
    if (!promoCode.current) return;

    sendTrackingData({
      code: promoCode.current,
      event_type: 'custom',
      event_name: eventName,
      event_data: eventData,
      timestamp: new Date().toISOString(),
    });
  };

  // 追踪转化
  const trackConversion = (conversionType: string, value?: number) => {
    if (!promoCode.current) return;

    sendTrackingData({
      code: promoCode.current,
      event_type: 'conversion',
      conversion_type: conversionType,
      conversion_value: value,
      timestamp: new Date().toISOString(),
    });
  };

  // 获取推广信息
  const getPromoInfo = () => ({
    code: promoCode.current,
    utm: utmParams.current,
  });

  return { trackEvent, trackConversion, getPromoInfo };
}

// 推广追踪组件（放在根布局）
export function PromoTracker({ promoCode }: PromoTrackerProps) {
  usePromoTracker();
  return null;
}

export default PromoTracker;
