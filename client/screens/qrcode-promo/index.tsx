/**
 * 收款码推广页面
 * 支持将会员付费二维码提交到各平台进行推广
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQRCodeSize, scaleSize, isSmallScreen } from '@/utils/responsive';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 屏幕宽度
const SCREEN_WIDTH = Dimensions.get('window').width;

// 推广平台列表
const PROMO_PLATFORMS = [
  { category: '国内社交', platforms: [
    { id: 'weibo', name: '微博', icon: 'weibo', color: '#E6162D' },
    { id: 'wechat_moments', name: '朋友圈', icon: 'comments', color: '#07C160' },
    { id: 'wechat_mp', name: '公众号', icon: 'newspaper', color: '#07C160' },
  ]},
  { category: '短视频/直播', platforms: [
    { id: 'douyin', name: '抖音', icon: 'tiktok', color: '#000000' },
    { id: 'kuaishou', name: '快手', icon: 'video', color: '#FF4906' },
    { id: 'bilibili', name: 'B站', icon: 'bilibili', color: '#FB7299' },
    { id: 'shipinhao', name: '视频号', icon: 'video', color: '#07C160' },
  ]},
  { category: '内容社区', platforms: [
    { id: 'xiaohongshu', name: '小红书', icon: 'book', color: '#FE2C55' },
    { id: 'zhihu', name: '知乎', icon: 'zhihu', color: '#0084FF' },
    { id: 'tieba', name: '贴吧', icon: 'users', color: '#4879BD' },
    { id: 'douban', name: '豆瓣', icon: 'leaf', color: '#00B51D' },
  ]},
  { category: '自媒体平台', platforms: [
    { id: 'toutiao', name: '今日头条', icon: 'newspaper', color: '#F85959' },
    { id: 'baijiahao', name: '百家号', icon: 'pen', color: '#2932E1' },
  ]},
  { category: '其他', platforms: [
    { id: 'forum', name: '论坛', icon: 'comments', color: '#6B7280' },
    { id: 'blog', name: '博客', icon: 'pen', color: '#F59E0B' },
    { id: 'community', name: '社区', icon: 'users', color: '#8B5CF6' },
  ]},
];

interface QRCodeData {
  name: string;
  account?: string;
  qrcodeUrl: string;
  realName: string;
  promoText: string;
  promoUrl: string;
}

interface PromoStats {
  total_promoted: number;
  total_clicks: number;
  total_conversions: number;
}

export default function QRCodePromoScreen() {
  const { theme } = useTheme();
  const [activePayType, setActivePayType] = useState<'alipay' | 'wechat'>('alipay');
  const [qrcodes, setQrcodes] = useState<{ alipay: QRCodeData; wechat: QRCodeData } | null>(null);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 平台选择
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [promoText, setPromoText] = useState('扫码开通G open会员，享受AI智能创作无限体验！');
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  
  // 刷新收款码
  const [refreshModalVisible, setRefreshModalVisible] = useState(false);
  const [newQrcodeUrl, setNewQrcodeUrl] = useState('');

  // 加载数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/qrcode/promo`);
      const data = await response.json();
      
      if (data.success) {
        setQrcodes(data.data.qrcodes);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Fetch qrcode promo error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // 切换平台选择
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // 提交收款码到平台
  const handleSubmit = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert('提示', '请选择至少一个推广平台');
      return;
    }

    setSubmitting(true);
    try {
      const userId = await AsyncStorage.getItem('userId') || 'guest_user';
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/qrcode/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          pay_type: activePayType,
          promo_text: promoText,
          adminKey: 'gopen_admin_2024',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('提交成功', `收款码已提交到 ${data.data.success_count} 个平台`);
        setSubmitModalVisible(false);
        setSelectedPlatforms([]);
        fetchData();
      } else {
        Alert.alert('提交失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('网络错误', '请检查网络连接');
    } finally {
      setSubmitting(false);
    }
  };

  // 刷新收款码
  const handleRefresh = async () => {
    if (!newQrcodeUrl.trim()) {
      Alert.alert('提示', '请输入新的收款码图片URL');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/qrcode/refresh?adminKey=gopen_admin_2024&payType=${activePayType}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrcode_url: newQrcodeUrl.trim() }),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('刷新成功', '收款码已更新');
        setRefreshModalVisible(false);
        setNewQrcodeUrl('');
        fetchData();
      } else {
        Alert.alert('刷新失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('网络错误', '请检查网络连接');
    } finally {
      setSubmitting(false);
    }
  };

  // 同步收款码到推广系统
  const handleSync = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/payment/qrcode/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': 'gopen_admin_2024',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        Alert.alert('同步成功', '收款码已同步到推广系统');
        fetchData();
      } else {
        Alert.alert('同步失败', data.error || '请稍后重试');
      }
    } catch (error) {
      console.error('Sync error:', error);
      Alert.alert('网络错误', '请检查网络连接');
    }
  };

  const currentQRCode = qrcodes?.[activePayType];
  
  // 响应式二维码尺寸
  const qrSize = getQRCodeSize();

  const styles = useMemo(() => ({
    container: {
      flex: 1 as const,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['2xl'],
      paddingBottom: Spacing.lg,
      alignItems: 'center' as const,
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.lg,
      width: scaleSize(120),
    },
    statsRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      paddingVertical: Spacing.lg,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    statItem: {
      alignItems: 'center' as const,
    },
    payTypeRow: {
      flexDirection: 'row' as const,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    payTypeButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      gap: Spacing.sm,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing['5xl'],
    },
    qrCard: {
      padding: Spacing.xl,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.lg,
      alignItems: 'center' as const,
    },
    qrImage: {
      width: qrSize,
      height: qrSize,
      borderRadius: BorderRadius.lg,
    },
    qrPlaceholder: {
      width: qrSize,
      height: qrSize,
      borderRadius: BorderRadius.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    promoText: {
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      width: '100%' as const,
    },
    actionRow: {
      flexDirection: 'row' as const,
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
    },
    platformCard: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    categoryTitle: {
      marginBottom: Spacing.md,
    },
    platformGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: Spacing.sm,
    },
    platformButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      gap: Spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center' as const,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: Spacing.lg,
    },
    modalContent: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      maxHeight: '80%' as const,
    },
    modalTitle: {
      marginBottom: Spacing.lg,
    },
    input: {
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
    },
    modalActions: {
      flexDirection: 'row' as const,
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
    modalButton: {
      flex: 1,
      alignItems: 'center' as const,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
  }), [theme]);

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
        <View style={styles.container}>
          <View style={styles.header}>
            <ThemedText variant="h4" color={theme.textPrimary}>收款码推广</ThemedText>
            <LinearGradient colors={[theme.primary, theme.accent]} style={styles.neonLine} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h4" color={theme.textPrimary}>收款码推广</ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>会员付费二维码推广系统</ThemedText>
          <LinearGradient colors={[theme.primary, theme.accent]} style={styles.neonLine} />
        </View>

        {/* Stats */}
        {stats && (
          <View style={[styles.statsRow, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.statItem}>
              <ThemedText variant="h3" color={theme.primary}>{stats.total_promoted}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>推广次数</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText variant="h3" color={theme.accent}>{stats.total_clicks}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>扫码次数</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText variant="h3" color={theme.success}>{stats.total_conversions}</ThemedText>
              <ThemedText variant="caption" color={theme.textMuted}>转化数</ThemedText>
            </View>
          </View>
        )}

        {/* Pay Type Selection */}
        <View style={styles.payTypeRow}>
          <TouchableOpacity
            style={[
              styles.payTypeButton,
              { 
                backgroundColor: activePayType === 'alipay' ? 'rgba(22,119,255,0.1)' : theme.backgroundDefault,
                borderColor: activePayType === 'alipay' ? '#1677FF' : theme.border,
              }
            ]}
            onPress={() => setActivePayType('alipay')}
          >
            <FontAwesome6 name="alipay" size={20} color={activePayType === 'alipay' ? '#1677FF' : theme.textMuted} />
            <ThemedText variant="label" color={activePayType === 'alipay' ? '#1677FF' : theme.textPrimary}>
              支付宝
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.payTypeButton,
              { 
                backgroundColor: activePayType === 'wechat' ? 'rgba(7,193,96,0.1)' : theme.backgroundDefault,
                borderColor: activePayType === 'wechat' ? '#07C160' : theme.border,
              }
            ]}
            onPress={() => setActivePayType('wechat')}
          >
            <FontAwesome6 name="comment" size={20} color={activePayType === 'wechat' ? '#07C160' : theme.textMuted} />
            <ThemedText variant="label" color={activePayType === 'wechat' ? '#07C160' : theme.textPrimary}>
              微信支付
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* QR Code Display */}
          <View style={[styles.qrCard, { backgroundColor: theme.backgroundDefault }]}>
            {currentQRCode?.qrcodeUrl ? (
              <Image
                source={{ uri: currentQRCode.qrcodeUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.qrPlaceholder, { backgroundColor: theme.backgroundTertiary }]}>
                <FontAwesome6 name="qrcode" size={80} color={theme.primary} />
              </View>
            )}
            
            <ThemedText variant="label" color={theme.textPrimary} style={{ marginTop: Spacing.lg }}>
              {currentQRCode?.name || '收款码'}
            </ThemedText>
            {currentQRCode?.account && (
              <ThemedText variant="caption" color={theme.textMuted}>
                账号: {currentQRCode.account}
              </ThemedText>
            )}
            
            <View style={[styles.promoText, { backgroundColor: theme.backgroundTertiary }]}>
              <ThemedText variant="small" color={theme.textSecondary} style={{ textAlign: 'center' }}>
                {currentQRCode?.promoText || '扫码开通会员'}
              </ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => setSubmitModalVisible(true)}
            >
              <FontAwesome6 name="paper-plane" size={16} color="#fff" />
              <ThemedText variant="label" color="#fff">提交推广</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.accent }]}
              onPress={() => setRefreshModalVisible(true)}
            >
              <FontAwesome6 name="rotate" size={16} color="#fff" />
              <ThemedText variant="label" color="#fff">刷新收款码</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Sync Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, borderWidth: 1, marginBottom: Spacing.lg }]}
            onPress={handleSync}
          >
            <FontAwesome6 name="arrows-rotate" size={16} color={theme.primary} />
            <ThemedText variant="label" color={theme.primary}>同步到推广系统</ThemedText>
          </TouchableOpacity>

          {/* Platform List */}
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
            推广平台
          </ThemedText>
          
          {PROMO_PLATFORMS.map(category => (
            <View key={category.category} style={[styles.platformCard, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText variant="tiny" color={theme.textMuted} style={styles.categoryTitle}>
                {category.category}
              </ThemedText>
              <View style={styles.platformGrid}>
                {category.platforms.map(platform => (
                  <TouchableOpacity
                    key={platform.id}
                    style={[
                      styles.platformButton,
                      { 
                        borderColor: selectedPlatforms.includes(platform.id) ? theme.primary : theme.border,
                        backgroundColor: selectedPlatforms.includes(platform.id) ? theme.primary + '20' : theme.backgroundTertiary,
                      }
                    ]}
                    onPress={() => togglePlatform(platform.id)}
                  >
                    <FontAwesome6 
                      name={platform.icon as any} 
                      size={14} 
                      color={selectedPlatforms.includes(platform.id) ? theme.primary : theme.textMuted} 
                    />
                    <ThemedText variant="tiny" color={selectedPlatforms.includes(platform.id) ? theme.primary : theme.textMuted}>
                      {platform.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Submit Modal */}
        <Modal visible={submitModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText variant="h4" color={theme.textPrimary} style={styles.modalTitle}>
                提交收款码推广
              </ThemedText>
              
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
                已选择 {selectedPlatforms.length} 个平台
              </ThemedText>
              
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: Spacing.xs }}>
                推广文案
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                value={promoText}
                onChangeText={setPromoText}
                placeholder="输入推广文案"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, { borderColor: theme.border }]} 
                  onPress={() => setSubmitModalVisible(false)}
                >
                  <ThemedText variant="label" color={theme.textSecondary}>取消</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: theme.primary }]} 
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText variant="label" color="#fff">提交</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Refresh Modal */}
        <Modal visible={refreshModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText variant="h4" color={theme.textPrimary} style={styles.modalTitle}>
                刷新收款码
              </ThemedText>
              
              <ThemedText variant="small" color={theme.textSecondary} style={{ marginBottom: Spacing.md }}>
                当前: {activePayType === 'alipay' ? '支付宝' : '微信'}收款码
              </ThemedText>
              
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: Spacing.xs }}>
                新收款码图片URL
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundTertiary, color: theme.textPrimary }]}
                value={newQrcodeUrl}
                onChangeText={setNewQrcodeUrl}
                placeholder="https://example.com/qrcode.png"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, { borderColor: theme.border }]} 
                  onPress={() => { setRefreshModalVisible(false); setNewQrcodeUrl(''); }}
                >
                  <ThemedText variant="label" color={theme.textSecondary}>取消</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: theme.accent }]} 
                  onPress={handleRefresh}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText variant="label" color="#fff">刷新</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
