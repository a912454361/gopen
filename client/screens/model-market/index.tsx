/**
 * 模型市场 - 厂商入驻与模型选购
 * 
 * 商业模式：
 * 1. 用户自带API Key调用模型（平台不承担费用）
 * 2. 平台收取服务费（回扣）
 * 3. 厂商自主入驻，提交模型服务
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

// 厂商数据类型
interface Vendor {
  id: string;
  company_name: string;
  description: string;
  logo_url?: string;
  website?: string;
  status: 'pending' | 'approved' | 'rejected';
  total_services: number;
  rating: number;
  created_at: string;
}

// 服务数据类型
interface VendorService {
  id: string;
  vendor_id: string;
  service_code: string;
  service_name: string;
  service_type: 'llm' | 'image' | 'video' | 'audio' | 'embedding';
  category?: string;
  description?: string;
  icon?: string;
  input_price: number;
  output_price: number;
  platform_markup: number;
  final_input_price: number;
  final_output_price: number;
  context_window?: number;
  max_tokens?: number;
  status: 'draft' | 'pending' | 'active' | 'offline';
  features?: {
    streaming?: boolean;
    functionCall?: boolean;
    vision?: boolean;
    audio?: boolean;
  };
  vendor?: Vendor;
}

// 用户API Key配置
interface UserApiKey {
  id: string;
  provider: string;
  api_key_masked: string;
  is_valid: boolean;
  created_at: string;
}

// 平台服务费配置
const PLATFORM_FEE_CONFIG = {
  llm: 0.15,      // LLM模型 15%
  image: 0.25,    // 图像模型 25%
  video: 0.30,    // 视频模型 30%
  audio: 0.20,    // 音频模型 20%
  embedding: 0.10, // 向量模型 10%
};

type TabType = 'market' | 'my-keys' | 'vendor-apply' | 'vendor-console';

// 服务类型配置
const SERVICE_TYPES = [
  { id: 'llm', name: '大语言模型', icon: 'brain', color: '#3B82F6' },
  { id: 'image', name: '图像生成', icon: 'image', color: '#8B5CF6' },
  { id: 'video', name: '视频生成', icon: 'video', color: '#EF4444' },
  { id: 'audio', name: '音频处理', icon: 'music', color: '#10B981' },
  { id: 'embedding', name: '向量化', icon: 'vector-square', color: '#F59E0B' },
];

export default function ModelMarketScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [services, setServices] = useState<VendorService[]>([]);
  const [myKeys, setMyKeys] = useState<UserApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // 用户信息
  const [userId, setUserId] = useState<string | null>(null);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorInfo, setVendorInfo] = useState<Vendor | null>(null);

  // API Key 配置Modal
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  // 厂商入驻Modal
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    description: '',
    website: '',
  });

  // 加载用户信息
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      let uid = await AsyncStorage.getItem('user_id');
      if (!uid) {
        uid = `user_${Date.now()}`;
        await AsyncStorage.setItem('user_id', uid);
      }
      setUserId(uid);

      // 检查是否是厂商
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/profile?userId=${uid}`);
      const result = await response.json();
      if (result.success && result.data) {
        setIsVendor(result.data.status === 'approved');
        setVendorInfo(result.data);
      }
    } catch (error) {
      console.error('Load user info error:', error);
    }
  };

  // 加载服务列表
  useEffect(() => {
    if (activeTab === 'market') {
      loadServices();
    } else if (activeTab === 'my-keys') {
      loadMyKeys();
    }
  }, [activeTab, selectedType, searchQuery]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('status', 'active');
      if (selectedType) params.append('type', selectedType);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/services/public?${params}`);
      const result = await response.json();
      setServices(result.data || []);
    } catch (error) {
      console.error('Load services error:', error);
      // 模拟数据
      setServices(getMockServices());
    } finally {
      setLoading(false);
    }
  };

  const loadMyKeys = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/api-keys?userId=${userId}`);
      const result = await response.json();
      setMyKeys(result.data || []);
    } catch (error) {
      console.error('Load keys error:', error);
      setMyKeys([]);
    } finally {
      setLoading(false);
    }
  };

  // 添加API Key
  const handleAddApiKey = async () => {
    if (!newApiKey.trim() || !selectedProvider) {
      Alert.alert('错误', '请填写完整信息');
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/user/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          provider: selectedProvider,
          apiKey: newApiKey.trim(),
        }),
      });
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', 'API Key 添加成功');
        setKeyModalVisible(false);
        setNewApiKey('');
        setSelectedProvider('');
        loadMyKeys();
      } else {
        Alert.alert('错误', result.error || '添加失败');
      }
    } catch (error) {
      Alert.alert('错误', '添加失败，请重试');
    }
  };

  // 厂商入驻申请
  const handleVendorApply = async () => {
    if (!vendorForm.companyName || !vendorForm.contactName || !vendorForm.contactEmail) {
      Alert.alert('错误', '请填写必填信息');
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/vendor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...vendorForm,
        }),
      });
      const result = await response.json();
      if (result.success) {
        Alert.alert('成功', '入驻申请已提交，请等待审核');
        setVendorModalVisible(false);
        loadUserInfo();
      } else {
        Alert.alert('错误', result.error || '申请失败');
      }
    } catch (error) {
      Alert.alert('错误', '申请失败，请重试');
    }
  };

  // 购买服务（使用用户自己的API Key）
  const handlePurchase = (service: VendorService) => {
    Alert.alert(
      '使用服务',
      `将使用您的 ${service.vendor?.company_name || '厂商'} API Key 调用此服务\n\n平台服务费: ${(service.platform_markup * 100).toFixed(0)}%`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确认使用', 
          onPress: () => {
            // 导航到对话页面
            router.push(`/chat?service=${service.id}`);
          }
        },
      ]
    );
  };

  // 模拟数据
  const getMockServices = (): VendorService[] => [
    {
      id: '1',
      vendor_id: 'v1',
      service_code: 'gpt-4o',
      service_name: 'GPT-4o',
      service_type: 'llm',
      description: 'OpenAI 最新多模态模型',
      input_price: 18,
      output_price: 72,
      platform_markup: 0.20,
      final_input_price: 22,
      final_output_price: 86,
      context_window: 128000,
      max_tokens: 16384,
      status: 'active',
      features: { streaming: true, functionCall: true, vision: true },
      vendor: { id: 'v1', company_name: 'OpenAI', description: 'AI 领导者', status: 'approved', total_services: 5, rating: 4.9, created_at: '' },
    },
    {
      id: '2',
      vendor_id: 'v2',
      service_code: 'claude-3-5-sonnet',
      service_name: 'Claude 3.5 Sonnet',
      service_type: 'llm',
      description: 'Anthropic 最新旗舰模型',
      input_price: 22,
      output_price: 108,
      platform_markup: 0.20,
      final_input_price: 26,
      final_output_price: 130,
      context_window: 200000,
      max_tokens: 8192,
      status: 'active',
      features: { streaming: true, functionCall: true, vision: true },
      vendor: { id: 'v2', company_name: 'Anthropic', description: 'AI 安全先驱', status: 'approved', total_services: 3, rating: 4.8, created_at: '' },
    },
    {
      id: '3',
      vendor_id: 'v3',
      service_code: 'deepseek-v3',
      service_name: 'DeepSeek V3',
      service_type: 'llm',
      description: '国产顶尖开源模型',
      input_price: 0,
      output_price: 0,
      platform_markup: 0.20,
      final_input_price: 0.7,
      final_output_price: 0.7,
      context_window: 64000,
      max_tokens: 4096,
      status: 'active',
      features: { streaming: true, functionCall: true },
      vendor: { id: 'v3', company_name: 'DeepSeek', description: '国产AI新星', status: 'approved', total_services: 2, rating: 4.7, created_at: '' },
    },
    {
      id: '4',
      vendor_id: 'v4',
      service_code: 'gemini-2-flash',
      service_name: 'Gemini 2.0 Flash',
      service_type: 'llm',
      description: 'Google 最新多模态模型',
      input_price: 0,
      output_price: 0,
      platform_markup: 0.50,
      final_input_price: 0.4,
      final_output_price: 0.4,
      context_window: 1000000,
      max_tokens: 8192,
      status: 'active',
      features: { streaming: true, functionCall: true, vision: true, audio: true },
      vendor: { id: 'v4', company_name: 'Google AI', description: '科技巨头', status: 'approved', total_services: 4, rating: 4.6, created_at: '' },
    },
    {
      id: '5',
      vendor_id: 'v5',
      service_code: 'dall-e-3',
      service_name: 'DALL-E 3',
      service_type: 'image',
      description: 'OpenAI 图像生成',
      input_price: 288000,
      output_price: 0,
      platform_markup: 0.25,
      final_input_price: 360000,
      final_output_price: 0,
      status: 'active',
      features: {},
      vendor: { id: 'v5', company_name: 'OpenAI', description: 'AI 领导者', status: 'approved', total_services: 5, rating: 4.9, created_at: '' },
    },
  ];

  // 渲染市场Tab
  const renderMarket = () => (
    <View style={styles.tabContent}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <FontAwesome6 name="magnifying-glass" size={16} color={theme.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索模型..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 类型筛选 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilter}>
        <TouchableOpacity
          style={[styles.typeChip, !selectedType && styles.typeChipActive]}
          onPress={() => setSelectedType(null)}
        >
          <ThemedText variant="small" color={selectedType ? theme.textSecondary : '#FFF'}>全部</ThemedText>
        </TouchableOpacity>
        {SERVICE_TYPES.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[styles.typeChip, selectedType === type.id && styles.typeChipActive]}
            onPress={() => setSelectedType(type.id)}
          >
            <FontAwesome6 name={type.icon as any} size={12} color={selectedType === type.id ? '#FFF' : type.color} />
            <ThemedText variant="small" color={selectedType === type.id ? '#FFF' : theme.textSecondary}>
              {type.name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 服务列表 */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <View style={styles.serviceList}>
          {services.map(service => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => handlePurchase(service)}
            >
              {/* 厂商信息 */}
              <View style={styles.serviceHeader}>
                <View style={[styles.vendorLogo, { backgroundColor: `${SERVICE_TYPES.find(t => t.id === service.service_type)?.color}20` }]}>
                  <FontAwesome6 
                    name={SERVICE_TYPES.find(t => t.id === service.service_type)?.icon as any || 'cube'} 
                    size={20} 
                    color={SERVICE_TYPES.find(t => t.id === service.service_type)?.color || theme.primary} 
                  />
                </View>
                <View style={styles.serviceInfo}>
                  <ThemedText variant="label" weight="semibold" color={theme.textPrimary}>
                    {service.service_name}
                  </ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>
                    {service.vendor?.company_name || '未知厂商'}
                  </ThemedText>
                </View>
                <View style={styles.platformFee}>
                  <ThemedText variant="tiny" color={theme.success}>
                    平台+{(service.platform_markup * 100).toFixed(0)}%
                  </ThemedText>
                </View>
              </View>

              {/* 描述 */}
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
                {service.description}
              </ThemedText>

              {/* 特性标签 */}
              <View style={styles.featureTags}>
                {service.features?.streaming && (
                  <View style={styles.featureTag}>
                    <ThemedText variant="tiny" color={theme.textSecondary}>流式</ThemedText>
                  </View>
                )}
                {service.features?.vision && (
                  <View style={styles.featureTag}>
                    <ThemedText variant="tiny" color={theme.textSecondary}>视觉</ThemedText>
                  </View>
                )}
                {service.context_window && (
                  <View style={styles.featureTag}>
                    <ThemedText variant="tiny" color={theme.textSecondary}>
                      {(service.context_window / 1000).toFixed(0)}K上下文
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* 价格 */}
              <View style={styles.priceRow}>
                <View style={styles.priceItem}>
                  <ThemedText variant="tiny" color={theme.textMuted}>输入</ThemedText>
                  <ThemedText variant="small" weight="medium" color={theme.primary}>
                    ¥{service.final_input_price / 1000}/千tokens
                  </ThemedText>
                </View>
                <View style={styles.priceItem}>
                  <ThemedText variant="tiny" color={theme.textMuted}>输出</ThemedText>
                  <ThemedText variant="small" weight="medium" color={theme.primary}>
                    ¥{service.final_output_price / 1000}/千tokens
                  </ThemedText>
                </View>
                <TouchableOpacity style={styles.useButton}>
                  <ThemedText variant="smallMedium" color="#FFF">使用</ThemedText>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  // 渲染我的Key Tab
  const renderMyKeys = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
          我的 API Key
        </ThemedText>
        <TouchableOpacity style={styles.addButton} onPress={() => setKeyModalVisible(true)}>
          <FontAwesome6 name="plus" size={14} color="#FFF" />
          <ThemedText variant="small" color="#FFF">添加</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.keyList}>
        {myKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome6 name="key" size={48} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              还没有添加 API Key
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              添加您的 API Key 后即可使用模型服务
            </ThemedText>
          </View>
        ) : (
          myKeys.map(key => (
            <View key={key.id} style={styles.keyCard}>
              <View style={styles.keyHeader}>
                <FontAwesome6 name="key" size={20} color={theme.primary} />
                <ThemedText variant="label" weight="medium" color={theme.textPrimary}>
                  {key.provider}
                </ThemedText>
                <View style={[styles.statusBadge, key.is_valid ? styles.statusValid : styles.statusInvalid]}>
                  <ThemedText variant="tiny" color={key.is_valid ? theme.success : theme.error}>
                    {key.is_valid ? '有效' : '无效'}
                  </ThemedText>
                </View>
              </View>
              <ThemedText variant="caption" color={theme.textMuted}>
                {key.api_key_masked}
              </ThemedText>
            </View>
          ))
        )}
      </View>

      {/* 说明 */}
      <View style={styles.infoBox}>
        <FontAwesome6 name="info-circle" size={16} color={theme.primary} />
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <ThemedText variant="smallMedium" color={theme.textPrimary}>用户自带API Key模式</ThemedText>
          <ThemedText variant="caption" color={theme.textSecondary}>
            使用您自己的 API Key 调用模型，费用直接产生在您的厂商账户。
            平台仅收取服务费，不承担任何调用费用。
          </ThemedText>
        </View>
      </View>
    </View>
  );

  // 渲染厂商申请Tab
  const renderVendorApply = () => (
    <View style={styles.tabContent}>
      {isVendor ? (
        <View style={styles.vendorApproved}>
          <FontAwesome6 name="check-circle" size={64} color={theme.success} />
          <ThemedText variant="h3" weight="bold" color={theme.success} style={{ marginTop: Spacing.lg }}>
            已是认证厂商
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
            {vendorInfo?.company_name}
          </ThemedText>
          <TouchableOpacity 
            style={styles.consoleButton}
            onPress={() => setActiveTab('vendor-console')}
          >
            <ThemedText variant="label" color="#FFF">进入厂商控制台</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
              厂商入驻
            </ThemedText>
          </View>

          <View style={styles.applyCard}>
            <ThemedText variant="small" color={theme.textSecondary}>
              入驻成为 G open 厂商，即可发布您的 AI 模型服务，获得收益分成。
            </ThemedText>

            {/* 入驻优势 */}
            <View style={styles.benefits}>
              <View style={styles.benefitItem}>
                <FontAwesome6 name="store" size={20} color={theme.primary} />
                <ThemedText variant="small" color={theme.textPrimary}>入驻即享流量扶持</ThemedText>
              </View>
              <View style={styles.benefitItem}>
                <FontAwesome6 name="percent" size={20} color={theme.primary} />
                <ThemedText variant="small" color={theme.textPrimary}>自主定价，平台只抽成</ThemedText>
              </View>
              <View style={styles.benefitItem}>
                <FontAwesome6 name="chart-line" size={20} color={theme.primary} />
                <ThemedText variant="small" color={theme.textPrimary}>实时数据，透明结算</ThemedText>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setVendorModalVisible(true)}
            >
              <ThemedText variant="label" weight="medium" color="#FFF">立即申请入驻</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  // 渲染厂商控制台Tab
  const renderVendorConsole = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>
          厂商控制台
        </ThemedText>
      </View>

      <View style={styles.consoleStats}>
        <View style={styles.statCard}>
          <ThemedText variant="h2" weight="bold" color={theme.primary}>3</ThemedText>
          <ThemedText variant="small" color={theme.textMuted}>已发布服务</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText variant="h2" weight="bold" color={theme.success}>¥1,280</ThemedText>
          <ThemedText variant="small" color={theme.textMuted}>本月收入</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText variant="h2" weight="bold" color={theme.textPrimary}>892</ThemedText>
          <ThemedText variant="small" color={theme.textMuted}>调用次数</ThemedText>
        </View>
      </View>

      <TouchableOpacity style={styles.addServiceButton}>
        <FontAwesome6 name="plus" size={16} color="#FFF" />
        <ThemedText variant="label" color="#FFF" style={{ marginLeft: Spacing.sm }}>发布新服务</ThemedText>
      </TouchableOpacity>

      <View style={styles.serviceList}>
        <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
          我的服务
        </ThemedText>
        {/* 服务列表 */}
      </View>
    </View>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      {/* 标题栏 */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <ThemedText variant="h3" weight="bold" color={theme.textPrimary}>模型市场</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab 导航 */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'market' && styles.tabItemActive]}
          onPress={() => setActiveTab('market')}
        >
          <FontAwesome6 name="store" size={16} color={activeTab === 'market' ? theme.primary : theme.textMuted} />
          <ThemedText variant="small" color={activeTab === 'market' ? theme.primary : theme.textMuted}>
            模型市场
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'my-keys' && styles.tabItemActive]}
          onPress={() => setActiveTab('my-keys')}
        >
          <FontAwesome6 name="key" size={16} color={activeTab === 'my-keys' ? theme.primary : theme.textMuted} />
          <ThemedText variant="small" color={activeTab === 'my-keys' ? theme.primary : theme.textMuted}>
            我的Key
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'vendor-apply' && styles.tabItemActive]}
          onPress={() => setActiveTab('vendor-apply')}
        >
          <FontAwesome6 name="building" size={16} color={activeTab === 'vendor-apply' ? theme.primary : theme.textMuted} />
          <ThemedText variant="small" color={activeTab === 'vendor-apply' ? theme.primary : theme.textMuted}>
            厂商入驻
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* 内容区 */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing['2xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'market' && renderMarket()}
        {activeTab === 'my-keys' && renderMyKeys()}
        {activeTab === 'vendor-apply' && renderVendorApply()}
        {activeTab === 'vendor-console' && renderVendorConsole()}
      </ScrollView>

      {/* 添加 API Key Modal */}
      <Modal visible={keyModalVisible} transparent animationType="fade" onRequestClose={() => setKeyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>添加 API Key</ThemedText>
            
            <View style={styles.formField}>
              <ThemedText variant="smallMedium" color={theme.textSecondary}>厂商</ThemedText>
              <View style={styles.providerGrid}>
                {['OpenAI', 'Anthropic', 'Google', 'DeepSeek'].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.providerChip, selectedProvider === p && styles.providerChipActive]}
                    onPress={() => setSelectedProvider(p)}
                  >
                    <ThemedText variant="small" color={selectedProvider === p ? '#FFF' : theme.textPrimary}>{p}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <ThemedText variant="smallMedium" color={theme.textSecondary}>API Key</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                placeholder="sk-..."
                placeholderTextColor={theme.textMuted}
                value={newApiKey}
                onChangeText={setNewApiKey}
                secureTextEntry
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setKeyModalVisible(false)}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleAddApiKey}>
                <ThemedText variant="smallMedium" color="#FFF">确认添加</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 厂商入驻 Modal */}
      <Modal visible={vendorModalVisible} transparent animationType="fade" onRequestClose={() => setVendorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault, maxHeight: '80%' }]}>
            <ThemedText variant="h4" weight="semibold" color={theme.textPrimary}>厂商入驻申请</ThemedText>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formField}>
                <ThemedText variant="smallMedium" color={theme.textSecondary}>公司名称 *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="请输入公司名称"
                  placeholderTextColor={theme.textMuted}
                  value={vendorForm.companyName}
                  onChangeText={(t) => setVendorForm({ ...vendorForm, companyName: t })}
                />
              </View>

              <View style={styles.formField}>
                <ThemedText variant="smallMedium" color={theme.textSecondary}>联系人 *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="请输入联系人姓名"
                  placeholderTextColor={theme.textMuted}
                  value={vendorForm.contactName}
                  onChangeText={(t) => setVendorForm({ ...vendorForm, contactName: t })}
                />
              </View>

              <View style={styles.formField}>
                <ThemedText variant="smallMedium" color={theme.textSecondary}>联系邮箱 *</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="请输入联系邮箱"
                  placeholderTextColor={theme.textMuted}
                  value={vendorForm.contactEmail}
                  onChangeText={(t) => setVendorForm({ ...vendorForm, contactEmail: t })}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formField}>
                <ThemedText variant="smallMedium" color={theme.textSecondary}>公司简介</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="请输入公司简介"
                  placeholderTextColor={theme.textMuted}
                  value={vendorForm.description}
                  onChangeText={(t) => setVendorForm({ ...vendorForm, description: t })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formField}>
                <ThemedText variant="smallMedium" color={theme.textSecondary}>官网地址</ThemedText>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                  placeholder="https://..."
                  placeholderTextColor={theme.textMuted}
                  value={vendorForm.website}
                  onChangeText={(t) => setVendorForm({ ...vendorForm, website: t })}
                  keyboardType="url"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setVendorModalVisible(false)}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>取消</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleVendorApply}>
                <ThemedText variant="smallMedium" color="#FFF">提交申请</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabNav: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: theme.primary,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
  },
  typeFilter: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: theme.backgroundDefault,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: theme.border,
  },
  typeChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  serviceList: {
    gap: Spacing.md,
  },
  serviceCard: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  platformFee: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  featureTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  featureTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: theme.backgroundTertiary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  priceItem: {
    flex: 1,
  },
  useButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.primary,
  },
  keyList: {
    gap: Spacing.md,
  },
  keyCard: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  keyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: 'auto',
  },
  statusValid: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusInvalid: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    marginTop: Spacing.xl,
  },
  applyCard: {
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  benefits: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  applyButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.primary,
    alignItems: 'center',
  },
  vendorApproved: {
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  consoleButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.primary,
  },
  consoleStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  formField: {
    gap: Spacing.sm,
  },
  input: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  providerChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  providerChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: theme.primary,
    alignItems: 'center',
  },
});

export default ModelMarketScreen;
