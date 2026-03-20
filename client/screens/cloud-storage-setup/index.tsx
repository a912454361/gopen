/**
 * 云存储开通页面
 * 支持百度网盘、阿里云盘、Google Drive、OneDrive、Dropbox、iCloud
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface CloudProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  authUrl: string;
  features: string[];
  storageLimit: string;
  price: string;
}

const CLOUD_PROVIDERS: CloudProvider[] = [
  {
    id: 'baidu',
    name: '百度网盘',
    icon: 'cloud',
    color: '#06A7FF',
    description: '国内用户首选，稳定可靠',
    authUrl: '/api/v1/cloud/auth/baidu',
    features: ['自动备份', '大文件传输', '离线下载'],
    storageLimit: '2TB - 8TB',
    price: '免费/会员',
  },
  {
    id: 'aliyun',
    name: '阿里云盘',
    icon: 'hard-drive',
    color: '#FF6A00',
    description: '速度快，不限速下载',
    authUrl: '/api/v1/cloud/auth/aliyun',
    features: ['极速上传', '在线预览', '相册备份'],
    storageLimit: '1TB - 8TB',
    price: '免费/会员',
  },
  {
    id: 'google',
    name: 'Google Drive',
    icon: 'google-drive',
    color: '#4285F4',
    description: '全球通用，与 Google 服务无缝集成',
    authUrl: '/api/v1/cloud/auth/google',
    features: ['实时协作', 'Google 集成', '版本历史'],
    storageLimit: '15GB - 2TB',
    price: '免费/付费',
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: 'microsoft',
    color: '#0078D4',
    description: '微软出品，Office 完美集成',
    authUrl: '/api/v1/cloud/auth/onedrive',
    features: ['Office 集成', '个人保管库', '自动保存'],
    storageLimit: '5GB - 1TB',
    price: '免费/Microsoft 365',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: 'dropbox',
    color: '#0061FF',
    description: '老牌云存储，同步稳定',
    authUrl: '/api/v1/cloud/auth/dropbox',
    features: ['智能同步', '文件恢复', '团队协作'],
    storageLimit: '2GB - 无限',
    price: '免费/付费',
  },
  {
    id: 'icloud',
    name: 'iCloud',
    icon: 'apple',
    color: '#000000',
    description: '苹果生态首选，无缝同步',
    authUrl: '/api/v1/cloud/auth/icloud',
    features: ['设备同步', '照片库', '查找设备'],
    storageLimit: '5GB - 2TB',
    price: '免费/iCloud+',
  },
];

interface CloudAccount {
  id: string;
  provider: string;
  account_name: string;
  storage_used: number;
  storage_total: number;
  status: string;
  connected_at: string;
}

export default function CloudStorageSetupScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 获取已连接的云存储账户
  const fetchAccounts = async () => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/accounts`
      );
      const result = await response.json();
      if (result.success) {
        setAccounts(result.data || []);
      }
    } catch (error) {
      console.error('Fetch accounts error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 连接云存储
  const handleConnect = async (provider: CloudProvider) => {
    try {
      setConnecting(provider.id);

      // 获取授权 URL
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}${provider.authUrl}`,
        { method: 'POST' }
      );
      const result = await response.json();

      if (result.success && result.data.authUrl) {
        // 打开授权页面
        await Linking.openURL(result.data.authUrl);
      } else {
        Alert.alert('提示', '该服务暂未开放，敬请期待');
      }
    } catch (error) {
      console.error('Connect error:', error);
      Alert.alert('错误', '连接失败，请稍后重试');
    } finally {
      setConnecting(null);
    }
  };

  // 断开连接
  const handleDisconnect = async (accountId: string) => {
    Alert.alert(
      '确认断开',
      '断开后将无法访问该云存储的文件，确定要断开吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/accounts/${accountId}`,
                { method: 'DELETE' }
              );
              fetchAccounts();
            } catch (error) {
              console.error('Disconnect error:', error);
            }
          },
        },
      ]
    );
  };

  // 计算存储百分比
  const getStoragePercent = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  // 格式化存储大小
  const formatStorage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <ThemedView level="root" style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </ThemedView>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <ThemedView level="root" style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.backgroundTertiary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: Spacing.md,
              }}
            >
              <FontAwesome6 name="arrow-left" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <ThemedText variant="h2" color={theme.textPrimary}>
                云存储设置
              </ThemedText>
            </View>
          </View>
          <ThemedText variant="body" color={theme.textMuted}>
            连接云盘，自动同步创作文件
          </ThemedText>
        </ThemedView>

        {/* 已连接账户 */}
        {accounts.length > 0 && (
          <ThemedView level="default" style={styles.section}>
            <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
              已连接账户
            </ThemedText>

            {accounts.map((account) => {
              const provider = CLOUD_PROVIDERS.find(p => p.id === account.provider);
              const storagePercent = getStoragePercent(account.storage_used, account.storage_total);

              return (
                <View
                  key={account.id}
                  style={{
                    backgroundColor: theme.backgroundTertiary,
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.lg,
                    marginBottom: Spacing.md,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: provider?.color + '20' || theme.backgroundTertiary,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      <FontAwesome6
                        name={(provider?.icon as any) || 'cloud'}
                        size={20}
                        color={provider?.color || theme.textPrimary}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                        {provider?.name || account.provider}
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        {account.account_name}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.sm,
                        backgroundColor: theme.error + '20',
                        borderRadius: BorderRadius.md,
                      }}
                      onPress={() => handleDisconnect(account.id)}
                    >
                      <ThemedText variant="small" color={theme.error}>
                        断开
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* 存储使用情况 */}
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
                      <ThemedText variant="caption" color={theme.textMuted}>
                        存储空间
                      </ThemedText>
                      <ThemedText variant="caption" color={theme.textSecondary}>
                        {formatStorage(account.storage_used)} / {formatStorage(account.storage_total)}
                      </ThemedText>
                    </View>
                    <View style={{
                      height: 6,
                      backgroundColor: theme.backgroundDefault,
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <View style={{
                        height: '100%',
                        width: `${storagePercent}%`,
                        backgroundColor: storagePercent > 90 ? theme.error : theme.primary,
                        borderRadius: 3,
                      }} />
                    </View>
                  </View>
                </View>
              );
            })}
          </ThemedView>
        )}

        {/* 可用云存储 */}
        <ThemedView level="default" style={styles.section}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            连接云存储
          </ThemedText>

          {CLOUD_PROVIDERS.map((provider) => {
            const isConnected = accounts.some(a => a.provider === provider.id);
            const isConnecting = connecting === provider.id;

            return (
              <TouchableOpacity
                key={provider.id}
                style={{
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.lg,
                  marginBottom: Spacing.md,
                  opacity: isConnected ? 0.6 : 1,
                }}
                onPress={() => !isConnected && handleConnect(provider)}
                disabled={isConnected || isConnecting !== null}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: provider.color + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <FontAwesome6
                      name={provider.icon as any}
                      size={20}
                      color={provider.color}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                        {provider.name}
                      </ThemedText>
                      {isConnected && (
                        <View style={{
                          marginLeft: Spacing.sm,
                          paddingHorizontal: Spacing.sm,
                          paddingVertical: 2,
                          backgroundColor: theme.success + '20',
                          borderRadius: BorderRadius.sm,
                        }}>
                          <ThemedText variant="tiny" color={theme.success}>
                            已连接
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {provider.description}
                    </ThemedText>
                  </View>

                  {isConnecting ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : isConnected ? (
                    <FontAwesome6 name="circle-check" size={20} color={theme.success} />
                  ) : (
                    <FontAwesome6 name="circle-plus" size={20} color={theme.primary} />
                  )}
                </View>

                {/* 功能标签 */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md, gap: Spacing.sm }}>
                  {provider.features.map((feature) => (
                    <View
                      key={feature}
                      style={{
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 4,
                        backgroundColor: theme.backgroundDefault,
                        borderRadius: BorderRadius.sm,
                      }}
                    >
                      <ThemedText variant="tiny" color={theme.textSecondary}>
                        {feature}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {/* 存储和价格信息 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md }}>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    存储: {provider.storageLimit}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    价格: {provider.price}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })}
        </ThemedView>

        {/* 提示信息 */}
        <ThemedView level="default" style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
            <FontAwesome6 name="circle-info" size={20} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <ThemedText variant="bodyMedium" color={theme.textPrimary}>
                关于云存储
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.xs }}>
                • 连接云存储后，您的创作文件将自动同步到云端{'\n'}
                • 支持多账户连接，轻松管理不同平台的文件{'\n'}
                • 所有传输均采用加密，保障您的数据安全
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </Screen>
  );
}
