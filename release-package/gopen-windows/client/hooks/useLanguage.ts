import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LanguageCode, 
  Languages, 
  translations, 
  getTranslation 
} from '@/constants/i18n';

const LANGUAGE_STORAGE_KEY = 'app_language';

// 当前语言
let currentLanguage: LanguageCode = 'zh';
let languageChangeCallbacks: Array<(lang: LanguageCode) => void> = [];

// 获取当前语言
function getCurrentLanguage(): LanguageCode {
  return currentLanguage;
}

// 设置语言并通知所有监听者
function setLanguage(lang: LanguageCode) {
  currentLanguage = lang;
  languageChangeCallbacks.forEach(callback => callback(lang));
  
  // 持久化存储
  AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
}

// 获取翻译文本
function t(key: string): string {
  return getTranslation(currentLanguage, key);
}

// Hook: 使用语言
function useLanguage() {
  const [languageState, setLanguageState] = useState<LanguageCode>(currentLanguage);

  useEffect(() => {
    // 加载保存的语言
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
          currentLanguage = savedLang as LanguageCode;
          setLanguageState(currentLanguage);
        }
      } catch (e) {
        // 忽略错误
      }
    };
    loadLanguage();

    // 注册语言变化监听
    const handleLanguageChange = (newLang: LanguageCode) => {
      setLanguageState(newLang);
    };
    
    languageChangeCallbacks.push(handleLanguageChange);

    return () => {
      languageChangeCallbacks = languageChangeCallbacks.filter(cb => cb !== handleLanguageChange);
    };
  }, []);

  // 切换语言
  const changeLanguage = useCallback((newLang: LanguageCode) => {
    setLanguage(newLang);
    setLanguageState(newLang);
  }, []);

  // 获取翻译
  const translate = useCallback((key: string): string => {
    return getTranslation(languageState, key);
  }, [languageState]);

  return {
    language: languageState,
    languageInfo: Languages[languageState],
    changeLanguage,
    translate,
    t: translate, // 简写别名
    availableLanguages: Object.values(Languages),
  };
}

export {
  useLanguage,
  getCurrentLanguage,
  setLanguage,
  t,
  type LanguageCode,
};
