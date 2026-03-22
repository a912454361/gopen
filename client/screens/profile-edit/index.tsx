/**
 * 用户资料编辑页面
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { useToast } from '@/components/Toast';
import { createFormDataFile } from '@/utils';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface UserProfile {
  id: string;
  nickname: string;
  avatar: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const MAX_BIO_LENGTH = 200;

export default function ProfileEditScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('userId').then((id) => {
      if (id) {
        setUserId(id);
      }
    });
  }, []);

  // 获取用户资料
  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      /**
       * 服务端文件：server/src/routes/user.ts
       * 接口：GET /api/v1/user/:userId
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/${userId}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setProfile(result.data);
        setNickname(result.data.nickname || '');
        setBio(result.data.bio || '');
        setAvatarUrl(result.data.avatar_url || null);
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      showToast('error', '获取用户资料失败');
    } finally {
      setIsLoading(false);
    }
  }, [userId, showToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 选择并上传头像
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('需要相册权限才能选择头像');
        } else {
          Alert.alert('提示', '需要相册权限才能选择头像');
        }
        return;
      }

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
      console.error('Pick avatar error:', error);
      showToast('error', '选择图片失败');
    }
  };

  // 上传头像到服务器
  const uploadAvatar = async (uri: string) => {
    if (!userId) return;

    try {
      setIsUploading(true);

      const fileName = `avatar_${Date.now()}.jpg`;
      const formData = new FormData();
      const fileData = await createFormDataFile(uri, fileName, 'image/jpeg');
      formData.append('avatar', fileData as any);

      /**
       * 服务端文件：server/src/routes/user.ts
       * 接口：POST /api/v1/user/:userId/avatar
       * 使用 multipart/form-data 上传
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/${userId}/avatar`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success && result.data) {
        setAvatarUrl(result.data.avatarUrl);
        showToast('success', '头像上传成功');
      } else {
        throw new Error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      showToast('error', '上传头像失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 保存用户资料
  const handleSave = async () => {
    if (!userId) return;

    // 验证
    if (!nickname.trim()) {
      showToast('error', '请输入昵称');
      return;
    }

    try {
      setIsSaving(true);

      /**
       * 服务端文件：server/src/routes/user.ts
       * 接口：PUT /api/v1/user/:userId
       * Body 参数：nickname?: string, bio?: string
       */
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: nickname.trim(),
            bio: bio.trim(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        showToast('success', '资料保存成功');
        router.back();
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      showToast('error', '保存资料失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 导航栏 */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.navTitle}>
            编辑资料
          </ThemedText>
        </View>

        {/* 头像区域 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={handlePickAvatar}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              {isUploading ? (
                <ActivityIndicator size="large" color={theme.primary} />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <FontAwesome6 name="user" size={48} color={theme.textMuted} />
              )}
              {!isUploading && (
                <View style={styles.avatarOverlay}>
                  <FontAwesome6 name="camera" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handlePickAvatar}
              disabled={isUploading}
            >
              <FontAwesome6 name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <ThemedText variant="label" color={theme.textMuted}>
            点击更换头像
          </ThemedText>
        </View>

        {/* 昵称 */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted} style={styles.sectionTitle}>
            昵称
          </ThemedText>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="请输入昵称"
              placeholderTextColor={theme.textMuted}
              maxLength={20}
            />
          </View>
        </View>

        {/* 自我介绍 */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted} style={styles.sectionTitle}>
            自我介绍
          </ThemedText>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="介绍一下自己吧..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              maxLength={MAX_BIO_LENGTH}
            />
          </View>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.charCount}>
            {bio.length}/{MAX_BIO_LENGTH}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.hint}>
            自我介绍将展示在社区作品和个人主页
          </ThemedText>
        </View>

        {/* 保存按钮 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
              ) : (
                <>
                  <FontAwesome6 name="check" size={16} color={theme.buttonPrimaryText} />
                  <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>
                    保存资料
                  </ThemedText>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
