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
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function RegisterScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(true);

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
       * Body 参数：target: string, type: 'register'
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: account.trim(),
          type: 'register',
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

  // 注册
  const handleRegister = async () => {
    if (!account.trim()) {
      setError('请输入手机号或邮箱');
      return;
    }

    if (!code) {
      setError('请输入验证码');
      return;
    }

    if (!password || password.length < 6) {
      setError('密码至少6位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    if (!agreed) {
      setError('请阅读并同意用户协议');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      /**
       * 服务端文件：server/src/routes/auth.ts
       * 接口：POST /api/v1/auth/register
       * Body 参数：account: string, password: string, code: string, nickname?: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: account.trim(),
          password,
          code,
          nickname: nickname.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 保存用户信息
        await AsyncStorage.setItem('userId', result.data.userId.toString());
        await AsyncStorage.setItem('userInfo', JSON.stringify(result.data));

        const message = '注册成功！';
        if (Platform.OS === 'web') {
          window.alert(message);
          router.back();
        } else {
          Alert.alert('成功', message, [
            { text: '确定', onPress: () => router.back() }
          ]);
        }
      } else {
        setError(result.error || '注册失败');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

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
            <FontAwesome6 name="user-plus" size={36} color={theme.buttonPrimaryText} />
          </View>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.title}>
            创建账号
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted} style={styles.subtitle}>
            注册 G Open，开启创作之旅
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

          {/* 昵称 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="smallMedium" color={theme.textSecondary} style={styles.inputLabel}>
              昵称（选填）
            </ThemedText>
            <View style={styles.inputContainer}>
              <FontAwesome6
                name="at"
                size={18}
                color={theme.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="给自己起个名字吧"
                placeholderTextColor={theme.textMuted}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
              />
            </View>
          </View>

          {/* 密码 */}
          <View style={styles.inputGroup}>
            <ThemedText variant="smallMedium" color={theme.textSecondary} style={styles.inputLabel}>
              密码
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
                placeholder="设置密码（至少6位）"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
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
              确认密码
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
                placeholder="再次输入密码"
                placeholderTextColor={theme.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.codeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesome6
                  name={showConfirmPassword ? 'eye' : 'eye-slash'}
                  size={18}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 用户协议 */}
          <View style={styles.agreement}>
            <TouchableOpacity
              style={[styles.checkbox, agreed && styles.checkboxChecked]}
              onPress={() => setAgreed(!agreed)}
            >
              {agreed && (
                <FontAwesome6 name="check" size={12} color={theme.buttonPrimaryText} />
              )}
            </TouchableOpacity>
            <ThemedText variant="caption" color={theme.textMuted} style={styles.agreementText}>
              我已阅读并同意{' '}
              <ThemedText variant="caption" color={theme.primary} style={styles.agreementLink}>
                用户协议
              </ThemedText>
              {' '}和{' '}
              <ThemedText variant="caption" color={theme.primary} style={styles.agreementLink}>
                隐私政策
              </ThemedText>
            </ThemedText>
          </View>

          {/* 错误提示 */}
          {error ? (
            <ThemedText variant="caption" color={theme.error} style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          {/* 注册按钮 */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
            ) : (
              <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText} style={styles.submitButtonText}>
                注册
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* 登录入口 */}
        <View style={styles.footer}>
          <ThemedText variant="small" color={theme.textMuted} style={styles.footerText}>
            已有账号？
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/auth-login')}>
            <ThemedText variant="smallMedium" color={theme.primary} style={styles.footerLink}>
              立即登录
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
