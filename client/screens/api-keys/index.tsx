import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

type APIProvider = 'openai' | 'anthropic' | 'doubao' | 'google' | 'azure';

interface APIKey {
  id: string;
  provider: string;
  api_key_masked: string;
  created_at: string;
  last_used_at?: string;
  status: string;
}

interface ProviderConfig {
  id: APIProvider;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  keyPlaceholder: string;
  needSecret: boolean;
}

const API_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'robot',
    color: '#10A37F',
    bgColor: '#10A37F15',
    description: 'GPT系列模型',
    keyPlaceholder: 'sk-...',
    needSecret: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'brain',
    color: '#D97706',
    bgColor: '#D9770615',
    description: 'Claude系列模型',
    keyPlaceholder: 'sk-ant-...',
    needSecret: false,
  },
  {
    id: 'doubao',
    name: '豆包',
    icon: 'fire',
    color: '#7C3AED',
    bgColor: '#7C3AED15',
    description: '字节跳动AI模型',
    keyPlaceholder: 'API Key',
    needSecret: true,
  },
  {
    id: 'google',
    name: 'Google AI',
    icon: 'google',
    color: '#4285F4',
    bgColor: '#4285F415',
    description: 'Gemini系列模型',
    keyPlaceholder: 'AIza...',
    needSecret: false,
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    icon: 'microsoft',
    color: '#0078D4',
    bgColor: '#0078D415',
    description: 'Azure云服务',
    keyPlaceholder: 'Endpoint + Key',
    needSecret: true,
  },
];

export default function APIKeysScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);

  /**
   * 获取用户API密钥列表
   * 服务端文件：server/src/routes/cloud-storage.ts
   * 接口：GET /api/v1/cloud/api-keys/:userId
   */
  const fetchAPIKeys = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/api-keys/${userId}`);
      const data = await res.json();
      
      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (error) {
      console.error('Fetch API keys error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAPIKeys();
  }, [fetchAPIKeys]);

  const handleAddKey = (provider: ProviderConfig) => {
    setSelectedProvider(provider);
    setApiKey('');
    setApiSecret('');
    setModalVisible(true);
  };

  const handleSaveKey = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      if (Platform.OS === 'web') {
        window.alert('请输入API密钥');
      } else {
        Alert.alert('提示', '请输入API密钥');
      }
      return;
    }

    setSaving(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('请先登录');
        return;
      }

      /**
       * 添加API密钥
       * 服务端文件：server/src/routes/cloud-storage.ts
       * 接口：POST /api/v1/cloud/api-keys
       * Body 参数：userId: string, provider: string, apiKey: string, apiSecret?: string
       */
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          provider: selectedProvider.id,
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim() || undefined,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setModalVisible(false);
        fetchAPIKeys();
        if (Platform.OS === 'web') {
          window.alert('API密钥添加成功');
        } else {
          Alert.alert('成功', 'API密钥添加成功');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Save API key error:', error);
      if (Platform.OS === 'web') {
        window.alert('添加失败');
      } else {
        Alert.alert('错误', '添加失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm('确定要删除此API密钥吗？')
      : await new Promise((resolve) => {
          Alert.alert('确认删除', '确定要删除此API密钥吗？', [
            { text: '取消', onPress: () => resolve(false), style: 'cancel' },
            { text: '删除', onPress: () => resolve(true), style: 'destructive' },
          ]);
        });

    if (!confirmDelete) return;

    try {
      /**
       * 删除API密钥
       * 服务端文件：server/src/routes/cloud-storage.ts
       * 接口：DELETE /api/v1/cloud/api-keys/:keyId
       */
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/cloud/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      
      if (data.success) {
        fetchAPIKeys();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Delete API key error:', error);
      if (Platform.OS === 'web') {
        window.alert('删除失败');
      } else {
        Alert.alert('错误', '删除失败');
      }
    }
  };

  const getProviderConfig = (providerId: string) => {
    return API_PROVIDERS.find(p => p.id === providerId);
  };

  const isProviderConfigured = (providerId: string) => {
    return apiKeys.some(k => k.provider === providerId);
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: Spacing.sm }}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary}>API密钥管理</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        {/* 说明卡片 */}
        <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
          <FontAwesome6 name="info-circle" size={20} color={theme.primary} />
          <ThemedText variant="small" color={theme.textSecondary} style={{ flex: 1, marginLeft: Spacing.sm }}>
            配置您自己的API密钥，可使用专属模型并获得更稳定的服务。您的密钥将安全加密存储。
          </ThemedText>
        </View>

        {/* 已配置的密钥 */}
        {apiKeys.length > 0 && (
          <View style={{ marginBottom: Spacing.xl }}>
            <ThemedText variant="label" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
              已配置密钥
            </ThemedText>
            {apiKeys.map((key) => {
              const config = getProviderConfig(key.provider);
              return (
                <View key={key.id} style={[styles.keyCard, { backgroundColor: theme.backgroundDefault }]}>
                  <View style={[styles.providerIcon, { backgroundColor: config?.bgColor || theme.backgroundTertiary }]}>
                    <FontAwesome6 
                      name={config?.icon || 'key'} 
                      size={20} 
                      color={config?.color || theme.textPrimary} 
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <ThemedText variant="smallMedium" color={theme.textPrimary}>
                      {config?.name || key.provider}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      {key.api_key_masked}
                    </ThemedText>
                    <ThemedText variant="caption" color={theme.textMuted}>
                      最后使用：{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : '未使用'}
                    </ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteKey(key.id)} style={{ padding: Spacing.sm }}>
                    <FontAwesome6 name="trash" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* 可配置的服务商 */}
        <ThemedText variant="label" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
          配置API密钥
        </ThemedText>
        {API_PROVIDERS.map((provider) => {
          const isConfigured = isProviderConfigured(provider.id);
          return (
            <TouchableOpacity
              key={provider.id}
              style={[styles.providerCard, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => handleAddKey(provider)}
            >
              <View style={[styles.providerIcon, { backgroundColor: provider.bgColor }]}>
                <FontAwesome6 name={provider.icon} size={24} color={provider.color} />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>
                  {provider.name}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {provider.description}
                </ThemedText>
              </View>
              {isConfigured ? (
                <View style={[styles.configuredBadge, { backgroundColor: theme.success + '20' }]}>
                  <FontAwesome6 name="check" size={14} color={theme.success} />
                  <ThemedText variant="caption" color={theme.success} style={{ marginLeft: 4 }}>已配置</ThemedText>
                </View>
              ) : (
                <FontAwesome6 name="plus" size={20} color={theme.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 添加密钥弹窗 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="h4" color={theme.textPrimary}>
                添加 {selectedProvider?.name} API密钥
              </ThemedText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome6 name="times" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedText variant="small" color={theme.textSecondary}>
                请输入您的API密钥，密钥将安全加密存储
              </ThemedText>

              <View style={{ marginTop: Spacing.lg }}>
                <ThemedText variant="label" color={theme.textPrimary}>API Key</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder={selectedProvider?.keyPlaceholder}
                  placeholderTextColor={theme.textMuted}
                  value={apiKey}
                  onChangeText={setApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {selectedProvider?.needSecret && (
                <View style={{ marginTop: Spacing.md }}>
                  <ThemedText variant="label" color={theme.textPrimary}>API Secret</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                    placeholder="API Secret"
                    placeholderTextColor={theme.textMuted}
                    value={apiSecret}
                    onChangeText={setApiSecret}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.backgroundTertiary }]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.5 }]}
                onPress={handleSaveKey}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText variant="smallMedium" color="#fff">保存</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
