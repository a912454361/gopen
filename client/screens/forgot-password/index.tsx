import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function ForgotPasswordScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [account, setAccount] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 倒计时
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!account.trim()) {
      setError('请输入手机号或邮箱');
      return;
    }

    setError('');
    setIsSendingCode(true);

    try {
      /**
       * 服务端文件：server/src/routes/auth.ts
       * 接口：POST /api/v1/auth/send-code
       * Body 参数：target: string, type: 'reset_password'
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: account.trim(),
          type: 'reset_password',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCountdown(60);
        const message = result.code 
          ? `验证码: ${result.code}（开发环境）`
          : '验证码已发送';
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('提示', message);
        }
      } else {
        setError(result.error || '发送失败');
      }
    } catch (err) {
      console.error('Send code error:', err);
      setError('网络错误，请重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!account.trim()) {
      setError('请输入手机号或邮箱');
      return;
    }

    if (!code) {
      setError('请输入验证码');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('密码至少6位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      /**
       * 服务端文件：server/src/routes/auth.ts
       * 接口：POST /api/v1/auth/forgot-password
       * Body 参数：account: string, code: string, newPassword: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: account.trim(),
          code,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || '重置失败');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <FontAwesome6 name="check" size={40} color={theme.buttonPrimaryText} />
            </View>
            <ThemedText variant="h3" color={theme.textPrimary} style={styles.successTitle}>
              密码重置成功
            </ThemedText>
            <ThemedText variant="small" color={theme.textMuted} style={styles.successText}>
              请使用新密码登录
            </ThemedText>
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.push('/auth-login')}
            >
              <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText} style={styles.backToLoginText}>
                返回登录
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
          <ThemedText variant="small" color={theme.textSecondary} style={styles.backText}>
            返回
          </ThemedText>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <FontAwesome6 name="key" size={36} color={theme.buttonPrimaryText} />
          </View>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.title}>
            找回密码
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted} style={styles.subtitle}>
            输入注册时的手机号或邮箱
          </ThemedText>
        </View>

        {/* 表单 */}
        <View style={styles.form}>
          {/* 账号输入 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="smallMedium" color={theme.textSecondary} style={styles.inputLabel}>
              手机号/邮箱
            </ThemedText>
            <View style={styles.inputContainer}>
              <FontAwesome6
                name="user"
                size={18}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="请输入手机号或邮箱"
                placeholderTextColor={theme.textMuted}
                value={account}
                onChangeText={setAccount}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* 验证码 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="smallMedium" color={theme.textSecondary} style={styles.inputLabel}>
              验证码
            </ThemedText>
            <View style={styles.inputContainer}>
              <FontAwesome6
                name="shield"
                size={18}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="请输入验证码"
                placeholderTextColor={theme.textMuted}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                style={[styles.codeButton, countdown > 0 && styles.codeButtonDisabled]}
                onPress={handleSendCode}
                disabled={countdown > 0 || isSendingCode}
              >
                {isSendingCode ? (
                  <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                ) : (
                  <ThemedText
                    variant="caption"
                    color={countdown > 0 ? theme.textMuted : theme.buttonPrimaryText}
                    style={styles.codeButtonText}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 新密码 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="smallMedium" color={theme.textSecondary} style={styles.inputLabel}>
              新密码
            </ThemedText>
            <View style={styles.inputContainer}>
              <FontAwesome6
                name="lock"
                size={18}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="设置新密码（至少6位）"
                placeholderTextColor={theme.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.codeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <FontAwesome6
                  name={showPassword ? 'eye' : 'eye-slash'}
                  size={18}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 确认密码 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="smallMedium" color={theme.textSecondary} style={styles.inputLabel}>
              确认新密码
            </ThemedText>
            <View style={styles.inputContainer}>
              <FontAwesome6
                name="lock"
                size={18}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="再次输入新密码"
                placeholderTextColor={theme.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* 错误提示 */}
          {error ? (
            <ThemedText variant="caption" color={theme.error} style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          {/* 重置按钮 */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
            ) : (
              <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText} style={styles.submitButtonText}>
                重置密码
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
