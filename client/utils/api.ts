/**
 * 统一API请求封装
 * 提供缓存、错误处理、重试等功能
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createFormDataFile } from '@/utils';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 缓存配置
const CACHE_PREFIX = 'api_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface RequestOptions extends RequestInit {
  skipCache?: boolean;
  cacheKey?: string;
  cacheDuration?: number;
}

/**
 * 获取缓存
 */
async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (cached) {
      const item: CacheItem<T> = JSON.parse(cached);
      if (Date.now() - item.timestamp < CACHE_DURATION) {
        return item.data;
      }
      // 缓存过期，删除
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

/**
 * 设置缓存
 */
async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * 清除缓存
 */
export async function clearCache(pattern?: string): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => 
      k.startsWith(CACHE_PREFIX) && 
      (!pattern || k.includes(pattern))
    );
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * 统一请求方法
 */
export async function api<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const {
    skipCache = false,
    cacheKey,
    cacheDuration = CACHE_DURATION,
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${EXPO_PUBLIC_BACKEND_BASE_URL}${endpoint}`;

  // GET请求检查缓存
  if (!skipCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
    const key = cacheKey || endpoint;
    const cached = await getCache<T>(key);
    if (cached) {
      return { success: true, data: cached };
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error || data.message || `请求失败 (${response.status})`,
      };
    }

    // 缓存成功的GET请求
    if (!skipCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
      const key = cacheKey || endpoint;
      await setCache(key, data.data || data);
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

/**
 * GET请求
 */
export async function get<T>(endpoint: string, options?: RequestOptions) {
  return api<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST请求
 */
export async function post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
  return api<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT请求
 */
export async function put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
  return api<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE请求
 */
export async function del<T>(endpoint: string, options?: RequestOptions) {
  return api<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * 文件上传
 */
export async function upload<T>(
  endpoint: string,
  file: { uri: string; name: string; type: string },
  additionalData?: Record<string, string>
): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${EXPO_PUBLIC_BACKEND_BASE_URL}${endpoint}`;

  const formData = new FormData();
  // 使用跨平台兼容的文件对象创建方法
  const fileData = await createFormDataFile(file.uri, file.name, file.type);
  formData.append('file', fileData as any);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error || '上传失败',
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    };
  }
}

export default { api, get, post, put, del, upload, clearCache };
