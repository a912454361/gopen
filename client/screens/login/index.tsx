import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
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

interface UserInfo {
  id: string;
  phone?: string;
  nickname?: string;
  membershipLevel: number;
  membershipExpiry?: string;
}

interface OAuthBinding {
  id: string;
  platform: string;
  open_id: string;
  nickname?: string;
  avatar?: string;
}

interface PlatformInfo {
  id: string;
  name: string;
  icon: keyof typeof FontAwesome6.glyphMap;
  color: string;
}

// 所有支持的平台配置
const PLATFORMS_CONFIG: Record<string, PlatformInfo> = {
  // 国内平台
  alipay: { id: 'alipay', name: '支付宝', icon: 'alipay', color: '#1677FF' },
  wechat: { id: 'wechat', name: '微信', icon: 'wechat', color: '#07C160' },
  douyin: { id: 'douyin', name: '抖音', icon: 'tiktok', color: '#000000' },
  qq: { id: 'qq', name: 'QQ', icon: 'qq', color: '#12B7F5' },
  weibo: { id: 'weibo', name: '微博', icon: 'weibo', color: '#E6162D' },
  // 国际平台
  github: { id: 'github', name: 'GitHub', icon: 'github', color: '#24292F' },
  google: { id: 'google', name: 'Google', icon: 'google', color: '#4285F4' },
  apple: { id: 'apple', name: 'Apple', icon: 'apple', color: '#000000' },
  microsoft: { id: 'microsoft', name: 'Microsoft', icon: 'microsoft', color: '#00A4EF' },
  twitter: { id: 'twitter', name: 'Twitter/X', icon: 'x-twitter', color: '#000000' },
  discord: { id: 'discord', name: 'Discord', icon: 'discord', color: '#5865F2' },
  telegram: { id: 'telegram', name: 'Telegram', icon: 'telegram', color: '#26A5E4' },
};

const DOMESTIC_PLATFORMS = ['alipay', 'wechat', 'douyin', 'qq', 'weibo'];
const INTERNATIONAL_PLATFORMS = ['github', 'google', 'apple', 'microsoft', 'twitter', 'discord', 'telegram'];

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [bindings, setBindings] = useState<OAuthBinding[]>([]);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);

  const fetchUserInfo = useCallback(async () => {
    try {
      // 检查本地存储的用户信息
      const userId = await AsyncStorage.getItem('userId');
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (!userId) {
        setUser(null);
        setBindings([]);
        return;
      }

      // 从本地存储恢复用户信息
      if (userInfoStr) {
        setUser(JSON.parse(userInfoStr));
      }

      // 获取绑定信息
      /**
       * 服务端文件：server/src/routes/oauth.ts
       * 接口：GET /api/v1/oauth/bindings/:userId
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/oauth/bindings/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setBindings(result.data || []);
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
      
      /**
       * 服务端文件：server/src/routes/oauth.ts
       * 接口：POST /api/v1/oauth/callback
       * Body 参数：platform: string, code: string
       */
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform: platform,
          code: mockCode 
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 保存用户信息到本地
        await AsyncStorage.setItem('userId', result.data.userId.toString());
        await AsyncStorage.setItem('userInfo', JSON.stringify({
          id: result.data.userId,
          nickname: result.data.nickname,
          avatar: result.data.avatar,
          membershipLevel: result.data.memberLevel === 'super' ? 2 : result.data.memberLevel === 'member' ? 1 : 0,
          membershipExpiry: result.data.memberExpireAt,
        }));
        
        const message = Platform.OS === 'web' 
          ? null 
          : Alert.alert(
              '登录成功',
              `欢迎${result.data.isNewUser ? '加入' : '回来'} G Open！`,
              [{ text: '确定', onPress: fetchUserInfo }]
            );
        
        if (Platform.OS === 'web') {
          window.alert(`登录成功！欢迎${result.data.isNewUser ? '加入' : '回来'} G Open！`);
          fetchUserInfo();
        }
      } else {
        const errorMsg = result.error || '登录失败';
        if (Platform.OS === 'web') {
          window.alert(errorMsg);
        } else {
          Alert.alert('登录失败', errorMsg);
        }
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
    if (!user) {
      Alert.alert('请先登录', '请先登录后再绑定账号');
      return;
    }
    
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
        Alert.alert('绑定成功', `${PLATFORMS_CONFIG[platform]?.name || platform}已成功绑定`);
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
      `确定要解绑${PLATFORMS_CONFIG[binding.platform]?.name || binding.platform}吗？`,
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

  const getMembershipName = (level: number) => {
    const names = ['免费用户', '普通会员', '超级会员'];
    return names[level] || '免费用户';
  };

  // 渲染平台绑定项
  const renderBindingItem = (platformId: string) => {
    const config = PLATFORMS_CONFIG[platformId];
    if (!config) return null;

    const binding = bindings.find(b => b.platform === platformId);
    const isCurrentLoading = loadingPlatform === platformId;

    return (
      <View key={platformId} style={styles.bindingCard}>
        <View style={[styles.bindingIcon, { backgroundColor: config.color }]}>
          <FontAwesome6 name={config.icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.bindingInfo}>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.bindingPlatform}>
            {config.name}
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted} style={styles.bindingStatus}>
            {binding ? `已绑定：${binding.nickname || binding.open_id}` : '未绑定'}
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
            onPress={() => handleBind(platformId)}
          >
            <ThemedText variant="caption" color={theme.buttonPrimaryText} style={styles.bindingActionText}>
              绑定
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 渲染登录按钮
  const renderLoginButton = (platformId: string) => {
    const config = PLATFORMS_CONFIG[platformId];
    if (!config) return null;

    return (
      <TouchableOpacity
        key={platformId}
        style={[styles.loginButton, { backgroundColor: config.color }]}
        onPress={() => handleOAuthLogin(platformId)}
        disabled={isLoading}
      >
        {loadingPlatform === platformId ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <FontAwesome6 name={config.icon} size={20} color="#FFFFFF" />
            <ThemedText variant="smallMedium" color="#FFFFFF" style={styles.loginButtonText}>
              {config.name}登录
            </ThemedText>
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (user) {
    // 已登录状态，显示用户信息和绑定管理
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header with back button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ padding: Spacing.sm, marginLeft: -Spacing.sm }}
            >
              <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
            <ThemedText variant="h4" color={theme.textPrimary} style={{ marginLeft: Spacing.sm }}>
              账号管理
            </ThemedText>
          </View>
          
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

          {/* 国内平台绑定 */}
          <View style={styles.bindingsSection}>
            <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
              国内平台
            </ThemedText>
            {DOMESTIC_PLATFORMS.map(renderBindingItem)}
          </View>

          {/* 国际平台绑定 */}
          <View style={styles.bindingsSection}>
            <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
              国际平台
            </ThemedText>
            {INTERNATIONAL_PLATFORMS.map(renderBindingItem)}
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
        {/* Header with back button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ padding: Spacing.sm, marginLeft: -Spacing.sm }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginLeft: Spacing.sm }}>
            账号登录
          </ThemedText>
        </View>
        
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

        {/* 国内平台登录 */}
        <View style={styles.section}>
          <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
            国内平台快捷登录
          </ThemedText>
          <View style={styles.platformGrid}>
            {DOMESTIC_PLATFORMS.slice(0, 3).map(renderLoginButton)}
          </View>
        </View>

        {/* 国际平台登录 */}
        <View style={styles.section}>
          <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
            国际平台快捷登录
          </ThemedText>
          <View style={styles.platformGrid}>
            {INTERNATIONAL_PLATFORMS.slice(0, 3).map(renderLoginButton)}
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <ThemedText variant="caption" color={theme.textMuted} style={styles.dividerText}>
            更多平台
          </ThemedText>
          <View style={styles.dividerLine} />
        </View>

        {/* 更多平台图标 */}
        <View style={styles.morePlatforms}>
          {[...DOMESTIC_PLATFORMS.slice(3), ...INTERNATIONAL_PLATFORMS.slice(3)].map(platformId => {
            const config = PLATFORMS_CONFIG[platformId];
            if (!config) return null;
            
            return (
              <TouchableOpacity
                key={platformId}
                style={[styles.iconButton, { backgroundColor: config.color }]}
                onPress={() => handleOAuthLogin(platformId)}
                disabled={isLoading}
              >
                {loadingPlatform === platformId ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <FontAwesome6 name={config.icon} size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            );
          })}
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
