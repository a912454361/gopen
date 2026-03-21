/**
 * 收款码推广页面
 * 支持将会员付费二维码提交到各平台进行推广
 * 注意：收款码为固定配置，仅管理员可更新
 */

import React, { useState, useMemo, useCallback } from 'react';
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
  Linking,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQRCodeSize, scaleSize, isSmallScreen } from '@/utils/responsive';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

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
  const insets = useSafeAreaInsets();
  const [activePayType, setActivePayType] = useState<'alipay' | 'wechat'>('alipay');
  const [qrcodes, setQrcodes] = useState<{ alipay: QRCodeData; wechat: QRCodeData } | null>(null);
  const [stats, setStats] = useState<PromoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // 平台选择
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [promoText, setPromoText] = useState('扫码开通G open会员，享受AI智能创作无限体验！');
  const [submitModalVisible, setSubmitModalVisible] = useState(false);

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

  // 打开支付宝扫一扫
  const openAlipayScan = () => {
    // 支付宝扫一扫：alipays://platformapi/startapp?appId=10000007
    const alipayUrl = 'alipays://platformapi/startapp?appId=10000007';
    
    Linking.canOpenURL(alipayUrl).then(supported => {
      if (supported) {
        Linking.openURL(alipayUrl);
      } else {
        Alert.alert('提示', '请先安装支付宝APP');
      }
    }).catch(err => {
      console.error('Open Alipay error:', err);
      Alert.alert('提示', '无法打开支付宝，请确保已安装支付宝APP');
    });
  };

  // 打开支付宝转账
  const openAlipayTransfer = () => {
    // 支付宝转账：alipays://platformapi/startapp?appId=20000067
    const alipayUrl = 'alipays://platformapi/startapp?appId=20000067';
    
    Linking.canOpenURL(alipayUrl).then(supported => {
      if (supported) {
        Linking.openURL(alipayUrl);
      } else {
        Alert.alert('提示', '请先安装支付宝APP');
      }
    }).catch(err => {
      console.error('Open Alipay error:', err);
      Alert.alert('提示', '无法打开支付宝，请确保已安装支付宝APP');
    });
  };

  // 打开支付宝APP首页
  const openAlipayHome = () => {
    const alipayUrl = 'alipays://';
    
    Linking.canOpenURL(alipayUrl).then(supported => {
      if (supported) {
        Linking.openURL(alipayUrl);
      } else {
        Alert.alert('提示', '请先安装支付宝APP');
      }
    }).catch(err => {
      console.error('Open Alipay error:', err);
      Alert.alert('提示', '无法打开支付宝，请确保已安装支付宝APP');
    });
  };

  // 打开微信扫一扫
  const openWechatScan = () => {
    // 微信扫一扫：weixin://scanqrcode
    const wechatUrl = 'weixin://scanqrcode';
    
    Linking.canOpenURL(wechatUrl).then(supported => {
      if (supported) {
        Linking.openURL(wechatUrl);
      } else {
        Alert.alert('提示', '请先安装微信APP');
      }
    }).catch(err => {
      console.error('Open WeChat error:', err);
      Alert.alert('提示', '无法打开微信，请确保已安装微信APP');
    });
  };

  // 打开微信APP首页
  const openWechatHome = () => {
    const wechatUrl = 'weixin://';
    
    Linking.canOpenURL(wechatUrl).then(supported => {
      if (supported) {
        Linking.openURL(wechatUrl);
      } else {
        Alert.alert('提示', '请先安装微信APP');
      }
    }).catch(err => {
      console.error('Open WeChat error:', err);
      Alert.alert('提示', '无法打开微信，请确保已安装微信APP');
    });
  };

  // 显示支付宝操作选项
  const showAlipayOptions = () => {
    if (Platform.OS === 'web') {
      // Web端直接打开转账
      openAlipayTransfer();
      return;
    }
    
    Alert.alert(
      '选择操作',
      '请选择要执行的操作',
      [
        { text: '扫一扫', onPress: openAlipayScan },
        { text: '转账', onPress: openAlipayTransfer },
        { text: '打开支付宝', onPress: openAlipayHome },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  // 显示微信操作选项
  const showWechatOptions = () => {
    if (Platform.OS === 'web') {
      // Web端直接打开微信
      openWechatHome();
      return;
    }
    
    Alert.alert(
      '选择操作',
      '请选择要执行的操作',
      [
        { text: '扫一扫', onPress: openWechatScan },
        { text: '打开微信', onPress: openWechatHome },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  // 复制收款账号
  const copyAccount = async (account: string, label: string) => {
    try {
      await Clipboard.setStringAsync(account);
      Alert.alert('复制成功', `${label}账号已复制: ${account}`);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  // 分享收款码
  const handleShare = async () => {
    if (!currentQRCode) return;
    
    try {
      const shareMessage = `G Open 会员付费收款码\n\n${currentQRCode.promoText}\n\n收款账号：${currentQRCode.account || ''}\n收款人：${currentQRCode.realName}\n\n访问链接：${currentQRCode.promoUrl}`;
      
      await Share.share({
        message: shareMessage,
        title: 'G Open 会员收款码',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // 复制公开链接
  const copyPublicLink = async () => {
    if (!currentQRCode) return;
    
    try {
      await Clipboard.setStringAsync(currentQRCode.promoUrl);
      Alert.alert('复制成功', `公开链接已复制: ${currentQRCode.promoUrl}`);
    } catch (error) {
      console.error('Copy error:', error);
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
      paddingTop: insets.top + Spacing.md,
      paddingBottom: Spacing.md,
      alignItems: 'center' as const,
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.sm,
      width: scaleSize(120),
    },
    statsRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      paddingVertical: Spacing.md,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.sm,
    },
    statItem: {
      alignItems: 'center' as const,
    },
    payTypeRow: {
      flexDirection: 'row' as const,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    payTypeButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.md,
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
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.md,
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
      marginTop: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      width: '100%' as const,
    },
    accountInfo: {
      marginTop: Spacing.md,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      width: '100%' as const,
    },
    accountRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: Spacing.xs,
    },
    shareCard: {
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.md,
    },
    shareHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    shareButtons: {
      flexDirection: 'row' as const,
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    shareButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      gap: Spacing.xs,
    },
    linkBox: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
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
    tipBox: {
      marginTop: Spacing.lg,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderLeftWidth: 3,
    },
  }), [theme, qrSize, insets.top]);

  if (loading) {
    return (
      <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
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
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light" safeAreaEdges={['left', 'right', 'bottom']}>
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
            <FontAwesome6 name="weixin" size={20} color={activePayType === 'wechat' ? '#07C160' : theme.textMuted} brand />
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
            
            <View style={[styles.promoText, { backgroundColor: theme.backgroundTertiary }]}>
              <ThemedText variant="small" color={theme.textSecondary} style={{ textAlign: 'center' }}>
                {currentQRCode?.promoText || '扫码开通会员'}
              </ThemedText>
            </View>

            {/* 收款账户信息 */}
            {currentQRCode?.account && (
              <View style={[styles.accountInfo, { backgroundColor: theme.backgroundTertiary }]}>
                <View style={styles.accountRow}>
                  <ThemedText variant="caption" color={theme.textMuted}>收款账号</ThemedText>
                  <TouchableOpacity onPress={() => copyAccount(currentQRCode.account!, '收款')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <ThemedText variant="smallMedium" color={theme.textPrimary}>{currentQRCode.account}</ThemedText>
                      <FontAwesome6 name="copy" size={12} color={theme.textMuted} />
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.accountRow}>
                  <ThemedText variant="caption" color={theme.textMuted}>收款人</ThemedText>
                  <ThemedText variant="small" color={theme.textPrimary}>{currentQRCode.realName}</ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* 分享与公开链接 */}
          <View style={[styles.shareCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.shareHeader}>
              <FontAwesome6 name="share-nodes" size={18} color={theme.primary} />
              <ThemedText variant="smallMedium" color={theme.textPrimary}>对公众开放</ThemedText>
            </View>
            
            <View style={styles.shareButtons}>
              <TouchableOpacity 
                style={[styles.shareButton, { backgroundColor: theme.primary }]}
                onPress={handleShare}
              >
                <FontAwesome6 name="share" size={16} color="#fff" />
                <ThemedText variant="small" color="#fff">分享收款码</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.shareButton, { backgroundColor: theme.backgroundTertiary, borderColor: theme.border, borderWidth: 1 }]}
                onPress={copyPublicLink}
              >
                <FontAwesome6 name="link" size={16} color={theme.primary} />
                <ThemedText variant="small" color={theme.primary}>复制公开链接</ThemedText>
              </TouchableOpacity>
            </View>
            
            {currentQRCode?.promoUrl && (
              <View style={[styles.linkBox, { backgroundColor: theme.backgroundTertiary }]}>
                <ThemedText variant="tiny" color={theme.textMuted} numberOfLines={1}>
                  {currentQRCode.promoUrl}
                </ThemedText>
              </View>
            )}
          </View>

          {/* 快捷支付按钮 */}
          <View style={styles.actionRow}>
            {activePayType === 'alipay' ? (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#1677FF' }]}
                onPress={showAlipayOptions}
              >
                <FontAwesome6 name="alipay" size={18} color="#fff" />
                <ThemedText variant="label" color="#fff">支付宝支付</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#07C160' }]}
                onPress={showWechatOptions}
              >
                <FontAwesome6 name="weixin" size={18} color="#fff" brand />
                <ThemedText variant="label" color="#fff">微信支付</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => setSubmitModalVisible(true)}
            >
              <FontAwesome6 name="paper-plane" size={18} color="#fff" />
              <ThemedText variant="label" color="#fff">提交推广</ThemedText>
            </TouchableOpacity>
          </View>

          {/* 同步按钮 */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.backgroundDefault, borderColor: theme.border, borderWidth: 1, marginBottom: Spacing.lg }]}
            onPress={handleSync}
          >
            <FontAwesome6 name="arrows-rotate" size={16} color={theme.primary} />
            <ThemedText variant="label" color={theme.primary}>同步到推广系统</ThemedText>
          </TouchableOpacity>

          {/* 提示信息 */}
          <View style={[styles.tipBox, { backgroundColor: theme.backgroundTertiary, borderLeftColor: theme.primary }]}>
            <ThemedText variant="small" color={theme.textSecondary}>
              提示：收款码为官方固定配置，如需更新请联系管理员。点击&quot;打开支付宝/微信&quot;可直接跳转到对应APP进行扫码支付。
            </ThemedText>
          </View>

          {/* Platform List */}
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}>
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
      </View>
    </Screen>
  );
}
