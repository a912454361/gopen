import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface UserInfo {
  id: number;
  phone?: string;
  nickname?: string;
  membershipLevel: number;
  membershipExpiry?: string;
}

interface OAuthBinding {
  id: number;
  platform: string;
  platformUserId: string;
  platformNickname?: string;
}

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [bindings, setBindings] = useState<OAuthBinding[]>([]);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);

  const fetchUserInfo = useCallback(async () => {
    try {
      // 检查本地存储的用户信息
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setUser(null);
        setBindings([]);
        return;
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/oauth/bindings/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setUser(result.data.user);
        setBindings(result.data.bindings);
      }
    } catch (error) {
      console.error('Fetch user info error:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const handleOAuthLogin = async (platform: string) => {
    setLoadingPlatform(platform);
    setIsLoading(true);

    try {
      // 在真实应用中，这里会打开第三方App或WebView进行OAuth授权
      // 由于沙箱环境限制，这里模拟OAuth流程
      
      // 生成模拟的OAuth code
      const mockCode = `mock_${platform}_code_${Date.now()}`;
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/oauth/${platform}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mockCode }),
      });

      const result = await response.json();

      if (result.success) {
        // 保存用户ID到本地
        await AsyncStorage.setItem('userId', result.data.userId.toString());
        
        Alert.alert(
          '登录成功',
          `欢迎${result.data.isNewUser ? '加入' : '回来'} G Open！`,
          [{ text: '确定', onPress: fetchUserInfo }]
        );
      } else {
        Alert.alert('登录失败', result.message);
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      Alert.alert('登录失败', '网络错误，请重试');
    } finally {
      setIsLoading(false);
      setLoadingPlatform(null);
    }
  };

  const handleBind = async (platform: string) => {
    if (!user) return;
    
    setLoadingPlatform(platform);
    try {
      const mockCode = `mock_bind_${platform}_code_${Date.now()}`;
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/oauth/bind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          platform,
          code: mockCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('绑定成功', `${getPlatformName(platform)}已成功绑定`);
        fetchUserInfo();
      } else {
        Alert.alert('绑定失败', result.message);
      }
    } catch (error) {
      console.error('Bind error:', error);
      Alert.alert('绑定失败', '网络错误，请重试');
    } finally {
      setLoadingPlatform(null);
    }
  };

  const handleUnbind = async (binding: OAuthBinding) => {
    if (!user) return;
    
    Alert.alert(
      '确认解绑',
      `确定要解绑${getPlatformName(binding.platform)}吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解绑',
          style: 'destructive',
          onPress: async () => {
            setLoadingPlatform(binding.platform);
            try {
              const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/oauth/unbind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  platform: binding.platform,
                }),
              });

              const result = await response.json();

              if (result.success) {
                Alert.alert('解绑成功');
                fetchUserInfo();
              } else {
                Alert.alert('解绑失败', result.message);
              }
            } catch (error) {
              console.error('Unbind error:', error);
              Alert.alert('解绑失败', '网络错误，请重试');
            } finally {
              setLoadingPlatform(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userId');
            setUser(null);
            setBindings([]);
          },
        },
      ]
    );
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      alipay: '支付宝',
      wechat: '微信',
      douyin: '抖音',
    };
    return names[platform] || platform;
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, keyof typeof FontAwesome6.glyphMap> = {
      alipay: 'alipay',
      wechat: 'wechat',
      douyin: 'tiktok',
    };
    return icons[platform] || 'link';
  };

  const getMembershipName = (level: number) => {
    const names = ['免费用户', '普通会员', '超级会员'];
    return names[level] || '免费用户';
  };

  if (user) {
    // 已登录状态，显示用户信息和绑定管理
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView level="root" style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <FontAwesome6 name="user" size={28} color={theme.textMuted} />
            </View>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.userName}>
              {user.nickname || user.phone || '用户'}
            </ThemedText>
            <ThemedText variant="small" color={theme.primary} style={styles.userMember}>
              {getMembershipName(user.membershipLevel)}
              {user.membershipExpiry && ` · ${user.membershipExpiry}到期`}
            </ThemedText>
          </ThemedView>

          <View style={styles.bindingsSection}>
            <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
              第三方账号绑定
            </ThemedText>

            {['alipay', 'wechat', 'douyin'].map((platform) => {
              const binding = bindings.find(b => b.platform === platform);
              const isCurrentLoading = loadingPlatform === platform;

              return (
                <View key={platform} style={styles.bindingCard}>
                  <View style={[styles.bindingIcon, { backgroundColor: platform === 'alipay' ? '#1677FF' : platform === 'wechat' ? '#07C160' : '#000000' }]}>
                    <FontAwesome6 name={getPlatformIcon(platform)} size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.bindingInfo}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.bindingPlatform}>
                      {getPlatformName(platform)}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted} style={styles.bindingStatus}>
                      {binding ? `已绑定：${binding.platformNickname || binding.platformUserId}` : '未绑定'}
                    </ThemedText>
                  </View>
                  {isCurrentLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : binding ? (
                    <TouchableOpacity
                      style={[styles.bindingAction, styles.unbindAction]}
                      onPress={() => handleUnbind(binding)}
                    >
                      <ThemedText variant="caption" color="#FFFFFF" style={styles.bindingActionText}>
                        解绑
                      </ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.bindingAction, styles.bindAction]}
                      onPress={() => handleBind(platform)}
                    >
                      <ThemedText variant="caption" color={theme.buttonPrimaryText} style={styles.bindingActionText}>
                        绑定
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesome6 name="right-from-bracket" size={16} color={theme.error} />
            <ThemedText variant="smallMedium" color={theme.error} style={styles.logoutText}>
              退出登录
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    );
  }

  // 未登录状态，显示登录选项
  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <FontAwesome6 name="gamepad" size={36} color={theme.primary} />
          </View>
          <ThemedText variant="h3" color={theme.textPrimary} style={styles.title}>
            G Open
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted} style={styles.subtitle}>
            暗黑科技风AI创作助手
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
            快捷登录
          </ThemedText>

          {/* 支付宝登录 */}
          <TouchableOpacity
            style={[styles.loginButton, styles.alipayButton]}
            onPress={() => handleOAuthLogin('alipay')}
            disabled={isLoading}
          >
            {loadingPlatform === 'alipay' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome6 name="alipay" size={20} color="#FFFFFF" />
                <ThemedText variant="smallMedium" color="#FFFFFF" style={styles.loginButtonText}>
                  支付宝登录
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* 微信登录 */}
          <TouchableOpacity
            style={[styles.loginButton, styles.wechatButton]}
            onPress={() => handleOAuthLogin('wechat')}
            disabled={isLoading}
          >
            {loadingPlatform === 'wechat' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome6 name="comments" size={20} color="#FFFFFF" />
                <ThemedText variant="smallMedium" color="#FFFFFF" style={styles.loginButtonText}>
                  微信登录
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* 抖音登录 */}
          <TouchableOpacity
            style={[styles.loginButton, styles.douyinButton]}
            onPress={() => handleOAuthLogin('douyin')}
            disabled={isLoading}
          >
            {loadingPlatform === 'douyin' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome6 name="tiktok" size={20} color="#FFFFFF" />
                <ThemedText variant="smallMedium" color="#FFFFFF" style={styles.loginButtonText}>
                  抖音登录
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <ThemedText variant="caption" color={theme.textMuted} style={styles.dividerText}>
            其他方式
          </ThemedText>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.terms}>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.termsText}>
            登录即表示同意{' '}
            <ThemedText variant="caption" color={theme.primary} style={styles.termsLink}>
              用户协议
            </ThemedText>{' '}
            和{' '}
            <ThemedText variant="caption" color={theme.primary} style={styles.termsLink}>
              隐私政策
            </ThemedText>
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
