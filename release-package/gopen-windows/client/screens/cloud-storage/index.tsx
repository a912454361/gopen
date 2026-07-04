import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type CloudPlatform = 'baidu' | 'aliyun' | 'google' | 'onedrive' | 'dropbox' | 'icloud';

interface CloudStorageInfo {
  id: number;
  platform: CloudPlatform;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface SyncStatus {
  totalFiles: number;
  syncedFiles: number;
  pendingFiles: number;
  lastSyncAt?: string;
}

interface CloudPlatformConfig {
  id: CloudPlatform;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
  supported: boolean;
}

const CLOUD_PLATFORMS: CloudPlatformConfig[] = [
  {
    id: 'baidu',
    name: '百度网盘',
    nameEn: 'Baidu Netdisk',
    icon: 'cloud',
    color: '#2932E1',
    bgColor: '#2932E115',
    description: '国内主流云存储服务',
    features: ['大文件传输', '离线下载', '多端同步'],
    supported: true,
  },
  {
    id: 'aliyun',
    name: '阿里云盘',
    nameEn: 'Aliyun Drive',
    icon: 'cloud',
    color: '#FF6A00',
    bgColor: '#FF6A0015',
    description: '阿里旗下云存储服务',
    features: ['极速上传', '智能分类', '空间不限速'],
    supported: true,
  },
  {
    id: 'google',
    name: 'Google Drive',
    nameEn: 'Google Drive',
    icon: 'google-drive',
    color: '#4285F4',
    bgColor: '#4285F415',
    description: 'Google云端存储服务',
    features: ['15GB免费空间', '实时协作', '智能搜索'],
    supported: true,
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    nameEn: 'Microsoft OneDrive',
    icon: 'microsoft',
    color: '#0078D4',
    bgColor: '#0078D415',
    description: '微软云存储服务',
    features: ['Office集成', '个人保管库', '版本历史'],
    supported: true,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    nameEn: 'Dropbox',
    icon: 'dropbox',
    color: '#0061FF',
    bgColor: '#0061FF15',
    description: '全球知名云存储服务',
    features: ['智能同步', '文件恢复', '团队协作'],
    supported: true,
  },
  {
    id: 'icloud',
    name: 'iCloud',
    nameEn: 'Apple iCloud',
    icon: 'apple',
    color: '#555555',
    bgColor: '#55555515',
    description: '苹果云服务（仅iOS/macOS）',
    features: ['无缝同步', '端到端加密', '设备备份'],
    supported: Platform.OS === 'ios',
  },
];

export default function CloudStorageScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [storageMap, setStorageMap] = useState<Record<CloudPlatform, CloudStorageInfo | null>>({
    baidu: null,
    aliyun: null,
    google: null,
    onedrive: null,
    dropbox: null,
    icloud: null,
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const fetchStorageInfo = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/storage/${userId}`
      );
      const result = await response.json();

      if (result.success) {
        setStorageMap(prev => ({
          ...prev,
          baidu: result.data.baidu || null,
          aliyun: result.data.aliyun || null,
        }));
        setSyncStatus(result.data.syncStatus);
      }
    } catch (error) {
      console.error('Fetch storage info error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo]);

  const handleConnect = async (platform: CloudPlatform) => {
    if (!CLOUD_PLATFORMS.find(p => p.id === platform)?.supported) {
      if (Platform.OS === 'web') {
        window.alert('该平台暂不支持当前设备');
      } else {
        Alert.alert('提示', '该平台暂不支持当前设备');
      }
      return;
    }

    setConnectingPlatform(platform);
    try {
      const mockCode = `mock_${platform}_code_${Date.now()}`;

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('请先登录', '您需要登录后才能绑定云存储');
        return;
      }

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/${platform}/auth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            code: mockCode,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        const platformConfig = CLOUD_PLATFORMS.find(p => p.id === platform);
        Alert.alert('授权成功', `${platformConfig?.name}已成功绑定`);
        fetchStorageInfo();
      } else {
        Alert.alert('授权失败', result.message);
      }
    } catch (error) {
      console.error('Connect error:', error);
      Alert.alert('授权失败', '网络错误，请重试');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: CloudPlatform) => {
    const platformConfig = CLOUD_PLATFORMS.find(p => p.id === platform);
    Alert.alert(
      '确认解绑',
      `确定要解绑${platformConfig?.name}吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解绑',
          style: 'destructive',
          onPress: async () => {
            try {
              const storageInfo = storageMap[platform];
              if (!storageInfo) return;

              const response = await fetch(
                `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/${platform}/disconnect`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    storageId: storageInfo.id,
                  }),
                }
              );

              const result = await response.json();

              if (result.success) {
                Alert.alert('解绑成功');
                setStorageMap(prev => ({ ...prev, [platform]: null }));
              } else {
                Alert.alert('解绑失败', result.message);
              }
            } catch (error) {
              console.error('Disconnect error:', error);
              Alert.alert('解绑失败', '网络错误，请重试');
            }
          },
        },
      ]
    );
  };

  const handleSync = async (platform: CloudPlatform) => {
    setSyncingPlatform(platform);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/${platform}/sync`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Alert.alert('同步成功', `已同步 ${result.data.syncedCount} 个文件`);
        fetchStorageInfo();
      } else {
        Alert.alert('同步失败', result.message);
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('同步失败', '网络错误，请重试');
    } finally {
      setSyncingPlatform(null);
    }
  };

  const renderStorageCard = (platformConfig: CloudPlatformConfig) => {
    const storageInfo = storageMap[platformConfig.id];
    const isConnected = !!storageInfo;
    const isLoadingThis = connectingPlatform === platformConfig.id || syncingPlatform === platformConfig.id;

    return (
      <View key={platformConfig.id} style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <View
            style={[
              styles.storageIcon,
              { backgroundColor: platformConfig.color },
            ]}
          >
            <FontAwesome6
              name={platformConfig.icon as any}
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.storageInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                {platformConfig.name}
              </ThemedText>
              {!platformConfig.supported && (
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: theme.backgroundTertiary,
                  borderRadius: 4,
                }}>
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    不支持
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText variant="caption" color={theme.textMuted}>
              {platformConfig.description}
            </ThemedText>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: 4 }}>
              {platformConfig.features.slice(0, 2).map((feature, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <FontAwesome6 name="check" size={8} color={platformConfig.color} />
                  <ThemedText variant="tiny" color={theme.textMuted}>
                    {feature}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
          {isConnected && (
            <View style={[styles.statusBadge, { backgroundColor: platformConfig.bgColor }]}>
              <FontAwesome6 name="circle-check" size={10} color={platformConfig.color} />
              <ThemedText variant="tiny" color={platformConfig.color}>
                已绑定
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.storageAction}>
          {isLoadingThis ? (
            <ActivityIndicator size="small" color={platformConfig.color} />
          ) : isConnected ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.actionButton, styles.syncButton, { flex: 1, backgroundColor: platformConfig.color }]}
                onPress={() => handleSync(platformConfig.id)}
              >
                <FontAwesome6 name="rotate" size={14} color="#FFFFFF" />
                <ThemedText variant="small" color="#FFFFFF" style={styles.actionButtonText}>
                  同步文件
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.disconnectButton, { flex: 1, borderColor: theme.error }]}
                onPress={() => handleDisconnect(platformConfig.id)}
              >
                <ThemedText variant="small" color={theme.error} style={styles.actionButtonText}>
                  解除绑定
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.connectButton, { backgroundColor: platformConfig.supported ? platformConfig.color : theme.textMuted }]}
              onPress={() => handleConnect(platformConfig.id)}
              disabled={!platformConfig.supported}
            >
              <FontAwesome6 name="link" size={14} color="#FFFFFF" />
              <ThemedText variant="small" color="#FFFFFF" style={styles.actionButtonText}>
                {platformConfig.supported ? '授权绑定' : '暂不支持'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  // 统计已绑定的平台数量
  const connectedCount = Object.values(storageMap).filter(Boolean).length;

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
            云存储设置
          </ThemedText>
        </View>

        {/* 统计概览 */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            marginBottom: Spacing.xl,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <ThemedText variant="small" color="rgba(255,255,255,0.8)">
                已绑定云存储
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <ThemedText variant="h2" color="#FFFFFF">
                  {connectedCount}
                </ThemedText>
                <ThemedText variant="small" color="rgba(255,255,255,0.8)">
                  / {CLOUD_PLATFORMS.filter(p => p.supported).length} 个平台
                </ThemedText>
              </View>
            </View>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <FontAwesome6 name="cloud-arrow-up" size={24} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>

        {/* 国内云存储 */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <FontAwesome6 name="flag" size={12} color={theme.primary} />
            <ThemedText variant="label" color={theme.textMuted}>
              国内云存储
            </ThemedText>
          </View>
          {CLOUD_PLATFORMS.filter(p => ['baidu', 'aliyun'].includes(p.id)).map(renderStorageCard)}
        </View>

        {/* 国际云存储 */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
            <FontAwesome6 name="globe" size={12} color={theme.accent} />
            <ThemedText variant="label" color={theme.textMuted}>
              国际云存储
            </ThemedText>
          </View>
          {CLOUD_PLATFORMS.filter(p => !['baidu', 'aliyun'].includes(p.id)).map(renderStorageCard)}
        </View>

        {/* 同步状态 */}
        {connectedCount > 0 && syncStatus && (
          <View style={styles.syncSection}>
            <View style={styles.syncHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary}>
                同步状态
              </ThemedText>
              <View style={styles.syncStatus}>
                <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                <ThemedText variant="caption" color={theme.textMuted}>
                  {syncStatus.lastSyncAt
                    ? new Date(syncStatus.lastSyncAt).toLocaleString()
                    : '从未同步'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.syncProgress}>
              <View
                style={[
                  styles.syncProgressFill,
                  {
                    width: `${
                      syncStatus.totalFiles > 0
                        ? (syncStatus.syncedFiles / syncStatus.totalFiles) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>

            <View style={styles.syncStats}>
              <View style={styles.syncStat}>
                <ThemedText variant="h4" color={theme.textPrimary}>
                  {syncStatus.totalFiles}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  总文件数
                </ThemedText>
              </View>
              <View style={styles.syncStat}>
                <ThemedText variant="h4" color={theme.success}>
                  {syncStatus.syncedFiles}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  已同步
                </ThemedText>
              </View>
              <View style={styles.syncStat}>
                <ThemedText variant="h4" color="#D97706">
                  {syncStatus.pendingFiles}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  待同步
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* 提示卡片 */}
        <View style={styles.tipCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <FontAwesome6 name="lightbulb" size={16} color={theme.primary} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              使用提示
            </ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textSecondary}>
            绑定云存储后，您的创作作品将自动同步到云端。支持多平台同时绑定，实现多重备份确保数据安全。同步文件将保存在 &quot;G Open/创作作品&quot; 目录下。
          </ThemedText>
        </View>

        {/* 平台特性说明 */}
        <View style={[styles.tipCard, { marginTop: Spacing.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
            <FontAwesome6 name="circle-info" size={16} color={theme.accent} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              平台说明
            </ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textSecondary}>
            • 百度网盘：国内用户首选，传输稳定{'\n'}
            • 阿里云盘：不限速下载，适合大文件{'\n'}
            • Google Drive：国际用户推荐，实时协作{'\n'}
            • OneDrive：Office用户首选{'\n'}
            • Dropbox：团队协作首选{'\n'}
            • iCloud：苹果生态无缝同步（仅iOS/macOS）
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
