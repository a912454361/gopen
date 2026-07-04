/**
 * 保存功能工具函数
 * 统一处理图片、音频等媒体文件的保存
 */

import { Platform, Alert, Share } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { getToast } from '@/components/Toast/ToastService';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 缓存目录路径
const CACHE_DIR = Platform.OS === 'web' ? '/tmp' : (FileSystem as any).cacheDirectory || '';

/**
 * 请求相册权限
 */
export async function requestMediaPermission(): Promise<boolean> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '权限不足',
        '需要相册权限才能保存图片，请在设置中开启',
        [{ text: '知道了' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('请求相册权限失败:', error);
    return false;
  }
}

/**
 * 保存图片到相册
 * @param url 图片URL或本地URI
 */
export async function saveImageToGallery(url: string): Promise<boolean> {
  try {
    // 检查权限
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return false;

    let fileUri = url;

    // 如果是网络图片，先下载
    if (url.startsWith('http')) {
      const downloadPath = `${CACHE_DIR}temp_image_${Date.now()}.jpg`;
      const { uri } = await (FileSystem as any).downloadAsync(url, downloadPath);
      fileUri = uri;
    }

    // 保存到相册
    await MediaLibrary.saveToLibraryAsync(fileUri);
    
    // 显示成功提示
    const toast = getToast();
    toast?.showToast('success', '图片已保存到相册');
    
    return true;
  } catch (error) {
    console.error('保存图片失败:', error);
    const toast = getToast();
    toast?.showToast('error', '保存图片失败');
    return false;
  }
}

/**
 * 保存音频文件
 * @param url 音频URL
 * @param filename 文件名
 */
export async function saveAudioFile(url: string, filename?: string): Promise<boolean> {
  try {
    // 检查权限
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return false;

    // 下载音频文件
    const name = filename || `audio_${Date.now()}.mp3`;
    const downloadPath = `${CACHE_DIR}${name}`;
    
    const { uri } = await (FileSystem as any).downloadAsync(url, downloadPath);
    
    // 保存到相册（音频也会被保存到音乐文件夹）
    await MediaLibrary.saveToLibraryAsync(uri);
    
    const toast = getToast();
    toast?.showToast('success', '音频已保存');
    
    return true;
  } catch (error) {
    console.error('保存音频失败:', error);
    const toast = getToast();
    toast?.showToast('error', '保存音频失败');
    return false;
  }
}

/**
 * 分享图片
 * @param url 图片URL
 */
export async function shareImage(url: string): Promise<void> {
  try {
    let fileUri = url;

    // 如果是网络图片，先下载
    if (url.startsWith('http')) {
      const downloadPath = `${CACHE_DIR}temp_share_${Date.now()}.jpg`;
      const { uri } = await (FileSystem as any).downloadAsync(url, downloadPath);
      fileUri = uri;
    }

    await Share.share({
      url: fileUri,
      message: '来自 G open 智能创作助手',
    });
  } catch (error) {
    console.error('分享失败:', error);
    const toast = getToast();
    toast?.showToast('error', '分享失败');
  }
}

/**
 * 导出数据为JSON文件
 * @param data 数据对象
 * @param filename 文件名
 */
export async function exportToJson(data: any, filename: string): Promise<boolean> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const filePath = `${CACHE_DIR}${filename}.json`;
    
    await (FileSystem as any).writeAsStringAsync(filePath, jsonString);
    
    const toast = getToast();
    toast?.showToast('success', '导出成功');
    
    return true;
  } catch (error) {
    console.error('导出失败:', error);
    const toast = getToast();
    toast?.showToast('error', '导出失败');
    return false;
  }
}

export default {
  requestMediaPermission,
  saveImageToGallery,
  saveAudioFile,
  shareImage,
  exportToJson,
};
