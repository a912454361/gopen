/**
 * 管理后台登录页面
 * 支持账号密码登录和Face ID扫脸登录
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
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 管理员账号信息
const ADMIN_CREDENTIALS = {
  phone: '18321337942',
  password: 'guo13816528465',
  adminKey: 'gopen_admin_2024',
};

const LOGIN_STORAGE_KEY = 'admin_login_status';
const BIOMETRIC_ENABLED_KEY = 'admin_biometric_enabled';

export default function AdminLoginScreen() {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const router = useSafeRouter();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 检查生物识别支持
  useEffect(() => {
    checkBiometricSupport();
    checkAutoLogin();
  }, []);

  // 检查生物识别支持
  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        console.log('设备不支持生物识别');
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        console.log('未设置生物识别');
        return;
      }

      // 获取支持的生物识别类型
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('指纹');
      } else {
        setBiometricType('生物识别');
      }

      // 检查是否已启用生物识别登录
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      if (enabled === 'true') {
        setBiometricEnabled(true);
      }
    } catch (error) {
      console.error('检查生物识别支持失败:', error);
    }
  };

  // 检查自动登录
  const checkAutoLogin = async () => {
    try {
      const loginStatus = await AsyncStorage.getItem(LOGIN_STORAGE_KEY);
      if (loginStatus === 'true' && biometricEnabled) {
        // 如果已登录且启用了生物识别，尝试生物识别登录
        authenticateWithBiometric();
      }
    } catch (error) {
      console.error('检查自动登录失败:', error);
    }
  };

  // 生物识别登录
  const authenticateWithBiometric = async () => {
    if (!biometricEnabled) {
      Alert.alert('提示', '请先使用账号密码登录，然后启用生物识别登录');
      return;
    }

    setIsAuthenticating(true);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '验证身份以登录管理后台',
        fallbackLabel: '使用密码',
        cancelLabel: '取消',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // 生物识别成功，保存登录状态
        await AsyncStorage.setItem(LOGIN_STORAGE_KEY, 'true');
        
        // 跳转到管理后台
        router.replace('/admin', { key: ADMIN_CREDENTIALS.adminKey });
      } else {
        // 生物识别失败，提示使用账号密码登录
        Alert.alert('验证失败', '请使用账号密码登录');
      }
    } catch (error) {
      console.error('生物识别登录失败:', error);
      Alert.alert('错误', '生物识别登录失败，请使用账号密码登录');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 账号密码登录
  const handleLogin = async () => {
    // 验证输入
    if (!phone.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }

    if (!password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    // 验证账号密码
    if (phone !== ADMIN_CREDENTIALS.phone || password !== ADMIN_CREDENTIALS.password) {
      Alert.alert('登录失败', '手机号或密码错误');
      return;
    }

    setLoading(true);

    try {
      // 验证管理员密钥
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/admin/verify?key=${ADMIN_CREDENTIALS.adminKey}`
      );
      const result = await response.json();

      if (result.success) {
        // 保存登录状态
        await AsyncStorage.setItem(LOGIN_STORAGE_KEY, 'true');
        
        // 提示启用生物识别
        if (biometricType && !biometricEnabled) {
          Alert.alert(
            '启用快速登录',
            `是否启用${biometricType}登录？下次可以使用${biometricType}快速登录`,
            [
              {
                text: '暂不启用',
                style: 'cancel',
                onPress: () => {
                  // 直接跳转
                  router.replace('/admin', { key: ADMIN_CREDENTIALS.adminKey });
                },
              },
              {
                text: '启用',
                onPress: async () => {
                  // 启用生物识别登录
                  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
                  setBiometricEnabled(true);
                  
                  // 跳转到管理后台
                  router.replace('/admin', { key: ADMIN_CREDENTIALS.adminKey });
                },
              },
            ]
          );
        } else {
          // 跳转到管理后台
          router.replace('/admin', { key: ADMIN_CREDENTIALS.adminKey });
        }
      } else {
        Alert.alert('登录失败', '管理员验证失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(LOGIN_STORAGE_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      router.replace('/');
    } catch (error) {
      console.error('登出失败:', error);
    }
  }, [router]);

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

            {/* 生物识别登录按钮 */}
            {biometricEnabled && biometricType && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={authenticateWithBiometric}
                disabled={isAuthenticating}
              >
                <FontAwesome6
                  name={biometricType === 'Face ID' ? 'face-smile' : 'fingerprint'}
                  size={32}
                  color={theme.primary}
                />
                <ThemedText variant="bodyMedium" color={theme.textPrimary} style={styles.biometricText}>
                  {isAuthenticating ? '正在验证...' : `使用${biometricType}登录`}
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* 分隔线 */}
            {biometricEnabled && biometricType && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <ThemedText variant="caption" color={theme.textMuted} style={styles.dividerText}>
                  或使用账号密码登录
                </ThemedText>
                <View style={styles.dividerLine} />
              </View>
            )}

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
