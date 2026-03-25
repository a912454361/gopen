/**
 * 用户头像组件
 * 支持显示、上传、编辑
 */

import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface AvatarProps {
  userId: string;
  size?: number;
  avatarUrl?: string | null;
  editable?: boolean;
  onAvatarChange?: (url: string) => void;
}

export function Avatar({ userId, size = 80, avatarUrl, editable = false, onAvatarChange }: AvatarProps) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);

  useEffect(() => {
    setCurrentAvatar(avatarUrl);
  }, [avatarUrl]);

  const pickImage = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('需要相册权限才能选择头像');
        } else {
          Alert.alert('提示', '需要相册权限才能选择头像');
        }
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      if (Platform.OS === 'web') {
        window.alert('选择图片失败');
      } else {
        Alert.alert('错误', '选择图片失败');
      }
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);

      // 在实际应用中，这里应该上传到对象存储
      // 现在模拟上传并更新
      const mockUrl = uri.startsWith('http') ? uri : `https://picsum.photos/seed/${Date.now()}/200/200`;
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, avatarUrl: mockUrl }),
      });

      const result = await response.json();
      if (result.success) {
        setCurrentAvatar(mockUrl);
        onAvatarChange?.(mockUrl);
        
        if (Platform.OS === 'web') {
          window.alert('头像更新成功');
        } else {
          Alert.alert('成功', '头像更新成功');
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      if (Platform.OS === 'web') {
        window.alert('上传头像失败');
      } else {
        Alert.alert('错误', '上传头像失败');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <TouchableOpacity
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.backgroundTertiary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
      onPress={editable ? pickImage : undefined}
      disabled={uploading}
      activeOpacity={editable ? 0.7 : 1}
    >
      {uploading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : currentAvatar ? (
        <Image
          source={{ uri: currentAvatar }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : (
        <FontAwesome6 name="user" size={size * 0.5} color={theme.textMuted} />
      )}
      
      {editable && !uploading && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: Spacing.xs,
          alignItems: 'center',
        }}>
          <FontAwesome6 name="camera" size={12} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}
