import React, { useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { useMembership } from '@/contexts/MembershipContext';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

interface StorageFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'model' | 'other';
  size: number;
  createdAt: string;
}

interface StorageServer {
  id: string;
  name: string;
  status: 'online' | 'offline';
  endpoint: string;
  region: string;
}

const mockFiles: StorageFile[] = [
  { id: '1', name: '角色_战士_v2.png', type: 'image', size: 2.4, createdAt: '2024-01-15' },
  { id: '2', name: '场景_森林_夜景.mp4', type: 'video', size: 45.2, createdAt: '2024-01-14' },
  { id: '3', name: 'BGM_战斗_01.mp3', type: 'audio', size: 3.8, createdAt: '2024-01-13' },
  { id: '4', name: '模型_建筑_塔楼.gltf', type: 'model', size: 12.1, createdAt: '2024-01-12' },
];

const mockServers: StorageServer[] = [
  {
    id: '1',
    name: 'G open 云端',
    status: 'online',
    endpoint: 'api.gopen.cloud',
    region: '华东-上海',
  },
];

export default function StorageScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  const { level, storageUsed, maxStorageMB, getStorageLabel } = useMembership();

  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState<StorageFile[]>(mockFiles);
  const [servers, setServers] = useState<StorageServer[]>(mockServers);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const handleDeleteFile = (file: StorageFile) => {
    Alert.alert(
      '删除文件',
      `确定要删除 "${file.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setFiles(files.filter(f => f.id !== file.id));
          },
        },
      ]
    );
  };

  const handleUploadFile = () => {
    if (storageUsed >= maxStorageMB) {
      Alert.alert('存储已满', '请升级会员以获取更多存储空间', [
        { text: '取消', style: 'cancel' },
        { text: '升级会员', onPress: () => router.push('/membership') },
      ]);
      return;
    }
    Alert.alert('上传文件', '文件上传功能开发中');
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'film';
      case 'audio': return 'music';
      case 'model': return 'cube';
      default: return 'file';
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'image': return theme.primary;
      case 'video': return theme.accent;
      case 'audio': return theme.success;
      case 'model': return '#FFD700';
      default: return theme.textMuted;
    }
  };

  const storagePercent = (storageUsed / maxStorageMB) * 100;

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h4" color={theme.textPrimary}>
            云端存储
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>
            {getStorageLabel()} · 持久化存储
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Storage Overview */}
        <View style={styles.storageOverview}>
          <View style={styles.storageIcon}>
            <FontAwesome6 name="cloud" size={28} color={theme.primary} />
          </View>
          <ThemedText variant="h2" color={theme.primary}>
            {storageUsed}MB
          </ThemedText>
          <ThemedText variant="caption" color={theme.textMuted}>
            已使用 / {maxStorageMB >= 1000 ? `${(maxStorageMB/1000).toFixed(0)}GB` : `${maxStorageMB}MB`} 总空间
          </ThemedText>

          <View style={styles.storageBar}>
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: '100%', width: `${Math.min(storagePercent, 100)}%`, borderRadius: 4 }}
            />
          </View>

          <View style={styles.storageStats}>
            <View style={styles.statItem}>
              <ThemedText variant="title" color={theme.textPrimary}>{files.length}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>文件</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText variant="title" color={theme.textPrimary}>{servers.length}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>服务器</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText variant="title" color={theme.textPrimary}>
                {maxStorageMB >= 1000 ? `${(maxStorageMB/1000).toFixed(0)}GB` : `${maxStorageMB}MB`}
              </ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>总容量</ThemedText>
            </View>
          </View>
        </View>

        {/* Servers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="labelSmall" color={theme.textMuted}>存储服务器</ThemedText>
          </View>
          {servers.map(server => (
            <View key={server.id} style={styles.serverCard}>
              <View style={styles.serverHeader}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>{server.name}</ThemedText>
                <View style={styles.serverStatus}>
                  <View style={[styles.statusDot, server.status === 'online' ? styles.statusOnline : styles.statusOffline]} />
                  <ThemedText variant="caption" color={server.status === 'online' ? theme.success : theme.error}>
                    {server.status === 'online' ? '在线' : '离线'}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.serverInfo}>
                <View style={styles.serverInfoRow}>
                  <ThemedText variant="caption" color={theme.textMuted}>端点</ThemedText>
                  <ThemedText variant="caption" color={theme.textPrimary}>{server.endpoint}</ThemedText>
                </View>
                <View style={styles.serverInfoRow}>
                  <ThemedText variant="caption" color={theme.textMuted}>区域</ThemedText>
                  <ThemedText variant="caption" color={theme.textPrimary}>{server.region}</ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Files */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="labelSmall" color={theme.textMuted}>我的文件</ThemedText>
            <TouchableOpacity onPress={handleUploadFile}>
              <FontAwesome6 name="plus" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          {files.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <FontAwesome6 name="folder-open" size={28} color={theme.textMuted} />
              </View>
              <ThemedText variant="small" color={theme.textMuted}>暂无文件</ThemedText>
            </View>
          ) : (
            <View style={styles.fileList}>
              {files.map(file => (
                <View key={file.id} style={styles.fileCard}>
                  <View style={styles.fileIcon}>
                    <FontAwesome6 name={getFileIcon(file.type)} size={18} color={getFileColor(file.type)} />
                  </View>
                  <View style={styles.fileInfo}>
                    <ThemedText variant="small" color={theme.textPrimary}>{file.name}</ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {file.size}MB · {file.createdAt}
                    </ThemedText>
                  </View>
                  <View style={styles.fileActions}>
                    <TouchableOpacity style={styles.fileAction}>
                      <FontAwesome6 name="download" size={12} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fileAction} onPress={() => handleDeleteFile(file)}>
                      <FontAwesome6 name="trash" size={12} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Upgrade Card */}
        {level === 'free' && (
          <View style={styles.upgradeCard}>
            <ThemedText variant="title" color={theme.primary}>升级存储空间</ThemedText>
            <ThemedText variant="small" color={theme.textSecondary}>
              开通会员可获得更大存储空间和更多功能
            </ThemedText>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => router.push('/membership')}>
              <FontAwesome6 name="crown" size={14} color={theme.backgroundRoot} />
              <ThemedText variant="labelSmall" color={theme.backgroundRoot}>查看会员方案</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
