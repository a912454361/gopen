import React, { useMemo, useState, useCallback } from 'react';
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
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type LoginType = 'password' | 'code';

// 第三方登录平台配置
const OAUTH_PLATFORMS = [
  { id: 'wechat', name: '微信', icon: 'wechat' as const, color: '#07C160' },
  { id: 'alipay', name: '支付宝', icon: 'alipay' as const, color: '#1677FF' },
  { id: 'github', name: 'GitHub', icon: 'github' as const, color: '#24292F' },
  { id: 'google', name: 'Google', icon: 'google' as const, color: '#4285F4' },
];

export default function AuthLoginScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [loginType, setLoginType] = useState<LoginType>('password');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

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
       * Body 参数：target: string, type: 'login'
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: account.trim(),
          type: 'login',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCountdown(60);
        if (Platform.OS === 'web') {
          window.alert('验证码已发送');
        } else {
          Alert.alert('提示', '验证码已发送');
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

  // 登录
  const handleLogin = async () => {
    if (!account.trim()) {
      setError('请输入账号');
      return;
    }

    if (loginType === 'password' && !password) {
      setError('请输入密码');
      return;
    }

    if (loginType === 'code' && !code) {
      setError('请输入验证码');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      /**
       * 服务端文件：server/src/routes/auth.ts
       * 接口：POST /api/v1/auth/login
       * Body 参数：account: string, password?: string, code?: string, loginType: 'password' | 'code'
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: account.trim(),
          password: loginType === 'password' ? password : undefined,
          code: loginType === 'code' ? code : undefined,
          loginType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 保存用户信息
        await AsyncStorage.setItem('userId', result.data.userId.toString());
        await AsyncStorage.setItem('userInfo', JSON.stringify(result.data));

        const message = '登录成功！';
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('成功', message, [
            { text: '确定', onPress: () => router.back() }
          ]);
        }

        if (Platform.OS === 'web') {
          router.back();
        }
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 第三方登录
  const handleOAuthLogin = async (platform: string) => {
    setIsLoading(true);

    try {
      const mockCode = `mock_${platform}_code_${Date.now()}`;

      /**
       * 服务端文件：server/src/routes/oauth.ts
       * 接口：POST /api/v1/oauth/callback
       * Body 参数：platform: string, code: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          code: mockCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await AsyncStorage.setItem('userId', result.data.userId.toString());
        await AsyncStorage.setItem('userInfo', JSON.stringify({
          id: result.data.userId,
          nickname: result.data.nickname,
          avatar: result.data.avatar,
          memberLevel: result.data.memberLevel === 'super' ? 2 : result.data.memberLevel === 'member' ? 1 : 0,
          membershipExpiry: result.data.memberExpireAt,
        }));

        const message = `登录成功！欢迎${result.data.isNewUser ? '加入' : '回来'} G Open！`;
        if (Platform.OS === 'web') {
          window.alert(message);
          router.back();
        } else {
          Alert.alert('成功', message, [
            { text: '确定', onPress: () => router.back() }
          ]);
        }
      } else {
        setError(result.error || '登录失败');
      }
    } catch (err) {
      console.error('OAuth login error:', err);
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
            <FontAwesome6 name="gamepad" size={36} color={theme.buttonPrimaryText} />
          </View>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.title}>
            欢迎回来
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted} style={styles.subtitle}>
            登录您的 G Open 账号
          </ThemedText>
        </View>

        {/* 登录方式切换 */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, loginType === 'password' && styles.tabActive]}
            onPress={() => setLoginType('password')}
          >
            <ThemedText
              variant="smallMedium"
              color={loginType === 'password' ? theme.buttonPrimaryText : theme.textSecondary}
            >
              密码登录
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, loginType === 'code' && styles.tabActive]}
            onPress={() => setLoginType('code')}
          >
            <ThemedText
              variant="smallMedium"
              color={loginType === 'code' ? theme.buttonPrimaryText : theme.textSecondary}
            >
              快捷登录
            </ThemedText>
          </TouchableOpacity>
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

          {/* 密码/验证码输入 */}
          {loginType === 'password' ? (
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
                  placeholder="请输入密码"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
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
          ) : (
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
          )}

          {/* 错误提示 */}
          {error ? (
            <ThemedText variant="caption" color={theme.error} style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          {/* 忘记密码 */}
          {loginType === 'password' && (
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
            >
              <ThemedText variant="small" color={theme.primary}>
                忘记密码？
              </ThemedText>
            </TouchableOpacity>
          )}

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
            ) : (
              <ThemedText variant="bodyMedium" color={theme.buttonPrimaryText} style={styles.loginButtonText}>
                登录
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* 分割线 */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <ThemedText variant="caption" color={theme.textMuted} style={styles.dividerText}>
            其他登录方式
          </ThemedText>
          <View style={styles.dividerLine} />
        </View>

        {/* 第三方登录 */}
        <View style={styles.oauthSection}>
          <View style={styles.oauthButtons}>
            {OAUTH_PLATFORMS.map((platform) => (
              <TouchableOpacity
                key={platform.id}
                style={[styles.oauthButton, { backgroundColor: platform.color }]}
                onPress={() => handleOAuthLogin(platform.id)}
                disabled={isLoading}
              >
                <FontAwesome6 name={platform.icon} size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 注册入口 */}
        <View style={styles.footer}>
          <ThemedText variant="small" color={theme.textMuted} style={styles.footerText}>
            还没有账号？
          </ThemedText>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <ThemedText variant="smallMedium" color={theme.primary} style={styles.footerLink}>
              立即注册
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}
