/**
 * 管理后台登录页面
 * 支持账号密码登录
 * Web端和移动端通用
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Text,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 管理员账号信息
const ADMIN_CREDENTIALS = {
  phone: '18321337942',
  password: 'guo13816528465',
  adminKey: 'GtAdmin2024SecretKey8888',
};

const LOGIN_STORAGE_KEY = 'admin_login_status';

export default function AdminLoginScreen() {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const router = useSafeRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Web端显示提示
  useEffect(() => {
    console.log('[AdminLogin] Page loaded, Platform:', Platform.OS);
  }, []);

  // 显示提示（兼容Web和移动端）
  const showAlert = (title: string, message: string, buttons?: { text: string; style?: string; onPress?: () => void }[]) => {
    if (Platform.OS === 'web') {
      // Web端使用浏览器原生确认框
      const confirmMessage = `${title}\n\n${message}`;
      if (buttons && buttons.length > 1) {
        const result = window.confirm(confirmMessage);
        if (result && buttons[1]?.onPress) {
          buttons[1].onPress();
        } else if (!result && buttons[0]?.onPress) {
          buttons[0].onPress();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        if (buttons && buttons[0]?.onPress) {
          buttons[0].onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons as any);
    }
  };

  // 账号密码登录
  const handleLogin = async () => {
    console.log('[AdminLogin] handleLogin called');
    
    // 清除之前的错误
    setError('');
    
    // 验证输入
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }

    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    // 验证账号密码
    if (phone !== ADMIN_CREDENTIALS.phone || password !== ADMIN_CREDENTIALS.password) {
      setError('手机号或密码错误');
      return;
    }

    setLoading(true);
    console.log('[AdminLogin] Verifying admin key...');

    try {
      // 验证管理员密钥
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/verify?key=${ADMIN_CREDENTIALS.adminKey}`
      );
      const result = await response.json();
      console.log('[AdminLogin] Verify result:', result);

      if (result.success) {
        // 保存登录状态
        await AsyncStorage.setItem(LOGIN_STORAGE_KEY, 'true');
        
        console.log('[AdminLogin] Login successful, redirecting to /admin');
        
        // 跳转到管理后台
        router.replace('/admin', { key: ADMIN_CREDENTIALS.adminKey });
      } else {
        setError('管理员验证失败');
      }
    } catch (error) {
      console.error('[AdminLogin] Login failed:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Logo区域 */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <FontAwesome6 name="shield-halved" size={48} color={theme.primary} />
              </View>
              <ThemedText variant="h2" color={theme.textPrimary} style={styles.title}>
                管理后台
              </ThemedText>
              <ThemedText variant="body" color={theme.textSecondary} style={styles.subtitle}>
                请登录以访问管理功能
              </ThemedText>
            </View>

            {/* 登录表单 */}
            <View style={styles.form}>
              {/* 手机号输入 */}
              <View style={styles.inputGroup}>
                <ThemedText variant="smallMedium" color={theme.textSecondary}>
                  手机号
                </ThemedText>
                <View style={styles.inputContainer}>
                  <FontAwesome6
                    name="mobile-screen"
                    size={20}
                    color={theme.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="请输入手机号"
                    placeholderTextColor={theme.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* 密码输入 */}
              <View style={styles.inputGroup}>
                <ThemedText variant="smallMedium" color={theme.textSecondary}>
                  密码
                </ThemedText>
                <View style={styles.inputContainer}>
                  <FontAwesome6
                    name="lock"
                    size={20}
                    color={theme.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="请输入密码"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <FontAwesome6
                      name={showPassword ? 'eye-slash' : 'eye'}
                      size={20}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 错误提示 */}
              {error ? (
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: Spacing.sm,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  backgroundColor: theme.error + '15',
                  borderRadius: BorderRadius.md,
                  marginTop: Spacing.md,
                }}>
                  <FontAwesome6 name="circle-exclamation" size={14} color={theme.error} />
                  <Text style={{ color: theme.error, fontSize: 13 }}>{error}</Text>
                </View>
              ) : null}

              {/* 登录按钮 */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.buttonPrimaryText} />
                ) : (
                  <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText}>
                    登录
                  </ThemedText>
                )}
              </TouchableOpacity>

              {/* 提示信息 */}
              <View style={styles.hintSection}>
                <FontAwesome6 name="circle-info" size={14} color={theme.textMuted} />
                <ThemedText variant="caption" color={theme.textMuted} style={styles.hintText}>
                  管理后台仅限授权管理员访问
                </ThemedText>
              </View>
            </View>

            {/* 底部信息 */}
            <View style={styles.footer}>
              <ThemedText variant="caption" color={theme.textMuted}>
                G open 管理系统 V1.0
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
