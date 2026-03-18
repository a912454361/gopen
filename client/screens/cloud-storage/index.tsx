import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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

interface CloudStorageInfo {
  id: number;
  platform: 'baidu' | 'aliyun';
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

export default function CloudStorageScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [baiduStorage, setBaiduStorage] = useState<CloudStorageInfo | null>(null);
  const [aliyunStorage, setAliyunStorage] = useState<CloudStorageInfo | null>(null);
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
        setBaiduStorage(result.data.baidu);
        setAliyunStorage(result.data.aliyun);
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

  const handleConnect = async (platform: 'baidu' | 'aliyun') => {
    setConnectingPlatform(platform);
    try {
      // 在真实应用中，这里会打开OAuth授权流程
      // 模拟授权流程
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
        Alert.alert('授权成功', `${platform === 'baidu' ? '百度网盘' : '阿里云盘'}已成功绑定`);
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

  const handleDisconnect = async (platform: 'baidu' | 'aliyun') => {
    Alert.alert(
      '确认解绑',
      `确定要解绑${platform === 'baidu' ? '百度网盘' : '阿里云盘'}吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解绑',
          style: 'destructive',
          onPress: async () => {
            try {
              const storageInfo = platform === 'baidu' ? baiduStorage : aliyunStorage;
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
                if (platform === 'baidu') {
                  setBaiduStorage(null);
                } else {
                  setAliyunStorage(null);
                }
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

  const handleSync = async (platform: 'baidu' | 'aliyun') => {
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStorageCard = (platform: 'baidu' | 'aliyun') => {
    const storageInfo = platform === 'baidu' ? baiduStorage : aliyunStorage;
    const isConnected = !!storageInfo;
    const isLoadingThis = connectingPlatform === platform || syncingPlatform === platform;

    return (
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <View
            style={[
              styles.storageIcon,
              platform === 'baidu' ? styles.baiduIcon : styles.alyunIcon,
            ]}
          >
            <FontAwesome6
              name={platform === 'baidu' ? 'cloud' : 'cloud'}
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.storageInfo}>
            <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.storageName}>
              {platform === 'baidu' ? '百度网盘' : '阿里云盘'}
            </ThemedText>
            <ThemedText
              variant="caption"
              color={isConnected ? theme.success : theme.textMuted}
              style={[styles.storageStatus, isConnected && styles.storageConnected]}
            >
              {isConnected ? '已授权' : '未授权'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.storageAction}>
          {isLoadingThis ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : isConnected ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.actionButton, styles.syncButton, { flex: 1 }]}
                onPress={() => handleSync(platform)}
              >
                <FontAwesome6 name="rotate" size={14} color={theme.buttonPrimaryText} />
                <ThemedText variant="small" color={theme.buttonPrimaryText} style={styles.actionButtonText}>
                  同步文件
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.disconnectButton, { flex: 1 }]}
                onPress={() => handleDisconnect(platform)}
              >
                <ThemedText variant="small" color={theme.error} style={styles.actionButtonText}>
                  解除绑定
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.connectButton]}
              onPress={() => handleConnect(platform)}
            >
              <FontAwesome6 name="link" size={14} color={theme.buttonPrimaryText} />
              <ThemedText variant="small" color={theme.buttonPrimaryText} style={styles.actionButtonText}>
                授权绑定
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

        <View style={styles.section}>
          <ThemedText variant="caption" color={theme.textSecondary} style={styles.sectionTitle}>
            绑定云存储
          </ThemedText>

          {renderStorageCard('baidu')}
          {renderStorageCard('aliyun')}
        </View>

        {/* 同步状态 */}
        {(baiduStorage || aliyunStorage) && syncStatus && (
          <View style={styles.syncSection}>
            <View style={styles.syncHeader}>
              <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.syncTitle}>
                同步状态
              </ThemedText>
              <View style={styles.syncStatus}>
                <FontAwesome6 name="clock" size={12} color={theme.textMuted} />
                <ThemedText variant="caption" color={theme.textMuted} style={styles.syncStatusText}>
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
                <ThemedText variant="h4" color={theme.textPrimary} style={styles.syncStatValue}>
                  {syncStatus.totalFiles}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.syncStatLabel}>
                  总文件数
                </ThemedText>
              </View>
              <View style={styles.syncStat}>
                <ThemedText variant="h4" color={theme.success} style={styles.syncStatValue}>
                  {syncStatus.syncedFiles}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.syncStatLabel}>
                  已同步
                </ThemedText>
              </View>
              <View style={styles.syncStat}>
                <ThemedText variant="h4" color="#D97706" style={styles.syncStatValue}>
                  {syncStatus.pendingFiles}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted} style={styles.syncStatLabel}>
                  待同步
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* 提示卡片 */}
        <View style={styles.tipCard}>
          <ThemedText variant="small" color={theme.textPrimary} style={styles.tipTitle}>
            使用提示
          </ThemedText>
          <ThemedText variant="caption" color={theme.textSecondary} style={styles.tipText}>
            绑定云存储后，您的创作作品将自动同步到云端。支持百度网盘和阿里云盘双平台备份，确保数据安全不丢失。同步文件将保存在 &quot;G Open/创作作品&quot; 目录下。
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
