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
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from 'expo-router';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQRCodeSize, scaleSize, isSmallScreen } from '@/utils/responsive';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

// 推广平台列表
const PROMO_PLATFORMS = [
  { category: '支付平台', platforms: [
    { id: 'alipay', name: '支付宝', icon: 'alipay', color: '#1677FF' },
    { id: 'wechat_pay', name: '微信支付', icon: 'weixin', color: '#07C160', brand: true },
    { id: 'unionpay', name: '银联', icon: 'credit-card', color: '#E60012' },
    { id: 'jd_pay', name: '京东支付', icon: 'wallet', color: '#E1251B' },
  ]},
  { category: '电商平台', platforms: [
    { id: 'taobao', name: '淘宝', icon: 'shopping-bag', color: '#FF5000' },
    { id: 'jd', name: '京东', icon: 'shopping-cart', color: '#E1251B' },
    { id: 'pdd', name: '拼多多', icon: 'store', color: '#E02E24' },
    { id: 'meituan', name: '美团', icon: 'utensils', color: '#FFD100' },
  ]},
  { category: '国内社交', platforms: [
    { id: 'weibo', name: '微博', icon: 'weibo', color: '#E6162D' },
    { id: 'wechat_moments', name: '朋友圈', icon: 'comments', color: '#07C160' },
    { id: 'wechat_mp', name: '公众号', icon: 'newspaper', color: '#07C160' },
    { id: 'qq', name: 'QQ', icon: 'qq', color: '#12B7F5' },
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
    { id: 'dayuhao', name: '大鱼号', icon: 'fish', color: '#FF6600' },
    { id: 'souhu', name: '搜狐号', icon: 'newspaper', color: '#FF6600' },
  ]},
  { category: '其他渠道', platforms: [
    { id: 'forum', name: '论坛', icon: 'comments', color: '#6B7280' },
    { id: 'blog', name: '博客', icon: 'pen', color: '#F59E0B' },
    { id: 'community', name: '社区', icon: 'users', color: '#8B5CF6' },
    { id: 'offline', name: '线下推广', icon: 'store', color: '#10B981' },
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
  const router = useSafeRouter();
  const [activePayType, setActivePayType] = useState<'alipay' | 'wechat' | 'unionpay' | 'jdpay' | 'bank'>('alipay');
  const [qrcodes, setQrcodes] = useState<Record<string, QRCodeData> | null>(null);
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
          adminKey: 'GtAdmin2024SecretKey8888',
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
          'x-admin-key': 'GtAdmin2024SecretKey8888',
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

  // 保存二维码到相册
  const saveQRCodeToGallery = async () => {
    if (!currentQRCode?.qrcodeUrl) {
      Alert.alert('提示', '暂无收款码可保存');
      return;
    }

    try {
      // 请求相册权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能保存收款码');
        return;
      }

      // 下载图片
      const downloadResult = await (FileSystem as any).downloadAsync(
        currentQRCode.qrcodeUrl,
        (FileSystem as any).documentDirectory + `qrcode_${Date.now()}.png`
      );

      if (downloadResult.uri) {
        // 保存到相册
        await MediaLibrary.createAssetAsync(downloadResult.uri);
        Alert.alert('保存成功', '收款码已保存到相册，您可以使用支付宝/微信扫一扫选择相册图片支付');
      }
    } catch (error) {
      console.error('Save QR code error:', error);
      Alert.alert('保存失败', '请稍后重试');
    }
  };

  // 复制收款账号
  const copyPaymentAccount = async () => {
    if (!currentQRCode?.account) {
      Alert.alert('提示', '暂无收款账号');
      return;
    }

    try {
      await Clipboard.setStringAsync(currentQRCode.account);
      const payAppName = activePayType === 'alipay' ? '支付宝' : '微信';
      Alert.alert(
        '复制成功', 
        `${payAppName}收款账号已复制：${currentQRCode.account}\n\n请打开${payAppName}搜索该账号进行转账`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: `打开${payAppName}`, 
            onPress: activePayType === 'alipay' ? openAlipayHome : openWechatHome 
          },
        ]
      );
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  // 打开支付宝扫一扫
  const openAlipayScan = () => {
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
    // 支付宝转账页面
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
    Alert.alert(
      '支付宝支付',
      '请选择支付方式',
      [
        { text: '扫一扫支付', onPress: openAlipayScan },
        { text: '转账支付', onPress: openAlipayTransfer },
        { text: '复制账号', onPress: copyPaymentAccount },
        { text: '保存收款码', onPress: saveQRCodeToGallery },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  // 显示微信操作选项
  const showWechatOptions = () => {
    Alert.alert(
      '微信支付',
      '请选择支付方式',
      [
        { text: '扫一扫支付', onPress: openWechatScan },
        { text: '复制账号', onPress: copyPaymentAccount },
        { text: '保存收款码', onPress: saveQRCodeToGallery },
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
      paddingTop: insets.top,
      paddingBottom: Spacing.xs,
      alignItems: 'center' as const,
    },
    neonLine: {
      height: 2,
      borderRadius: 1,
      marginTop: Spacing.xs,
      width: scaleSize(100),
    },
    statsRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      paddingVertical: Spacing.xs,
      marginHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
      marginBottom: 0,
    },
    statItem: {
      alignItems: 'center' as const,
    },
    payTypeRow: {
      flexDirection: 'row' as const,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    payTypeButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      gap: Spacing.xs,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: 0,
      paddingBottom: Spacing['5xl'],
    },
    qrCard: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xs,
      alignItems: 'center' as const,
    },
    logoContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    logoIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    logoText: {
      alignItems: 'flex-start' as const,
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
      marginTop: Spacing.xs,
      paddingVertical: 0,
      paddingHorizontal: Spacing.xs,
      borderRadius: BorderRadius.md,
      width: '100%' as const,
    },
    accountInfo: {
      marginTop: Spacing.xs,
      padding: Spacing.xs,
      borderRadius: BorderRadius.lg,
      width: '100%' as const,
    },
    accountRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: 0,
    },
    shareCard: {
      padding: Spacing.xs,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xs,
    },
    shareHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: Spacing.xs,
      marginBottom: 0,
    },
    shareButtons: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    shareButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.md,
      gap: Spacing.xs,
      minWidth: '30%' as const,
    },
    linkBox: {
      padding: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    rechargeCard: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xs,
    },
    rechargeHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    rechargeButtons: {
      flexDirection: 'row' as const,
      gap: Spacing.sm,
    },
    rechargeButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      gap: Spacing.xs,
    },
    actionRow: {
      flexDirection: 'row' as const,
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      gap: Spacing.xs,
    },
    platformCard: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xs,
    },
    categoryTitle: {
      marginBottom: Spacing.xs,
    },
    platformGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: Spacing.xs,
    },
    platformButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
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
            <FontAwesome6 name="alipay" size={18} color={activePayType === 'alipay' ? '#1677FF' : theme.textMuted} />
            <ThemedText variant="tiny" color={activePayType === 'alipay' ? '#1677FF' : theme.textPrimary}>
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
            <FontAwesome6 name="weixin" size={18} color={activePayType === 'wechat' ? '#07C160' : theme.textMuted} brand />
            <ThemedText variant="tiny" color={activePayType === 'wechat' ? '#07C160' : theme.textPrimary}>
              微信
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.payTypeButton,
              { 
                backgroundColor: activePayType === 'unionpay' ? 'rgba(230,0,18,0.1)' : theme.backgroundDefault,
                borderColor: activePayType === 'unionpay' ? '#E60012' : theme.border,
              }
            ]}
            onPress={() => setActivePayType('unionpay')}
          >
            <FontAwesome6 name="credit-card" size={18} color={activePayType === 'unionpay' ? '#E60012' : theme.textMuted} />
            <ThemedText variant="tiny" color={activePayType === 'unionpay' ? '#E60012' : theme.textPrimary}>
              银联
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.payTypeButton,
              { 
                backgroundColor: activePayType === 'jdpay' ? 'rgba(225,37,27,0.1)' : theme.backgroundDefault,
                borderColor: activePayType === 'jdpay' ? '#E1251B' : theme.border,
              }
            ]}
            onPress={() => setActivePayType('jdpay')}
          >
            <FontAwesome6 name="wallet" size={18} color={activePayType === 'jdpay' ? '#E1251B' : theme.textMuted} />
            <ThemedText variant="tiny" color={activePayType === 'jdpay' ? '#E1251B' : theme.textPrimary}>
              京东
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.payTypeButton,
              { 
                backgroundColor: activePayType === 'bank' ? 'rgba(196,18,48,0.1)' : theme.backgroundDefault,
                borderColor: activePayType === 'bank' ? '#C41230' : theme.border,
              }
            ]}
            onPress={() => setActivePayType('bank')}
          >
            <FontAwesome6 name="building-columns" size={18} color={activePayType === 'bank' ? '#C41230' : theme.textMuted} />
            <ThemedText variant="tiny" color={activePayType === 'bank' ? '#C41230' : theme.textPrimary}>
              银行
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* QR Code Display */}
          <View style={[styles.qrCard, { backgroundColor: theme.backgroundDefault }]}>
            {/* G Open Logo */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
                <FontAwesome6 name="gamepad" size={24} color="#fff" />
              </View>
              <View style={styles.logoText}>
                <ThemedText variant="smallMedium" color={theme.textPrimary}>G Open</ThemedText>
                <ThemedText variant="tiny" color={theme.textMuted}>智能创作助手</ThemedText>
              </View>
            </View>
            
            {/* 二维码图片 */}
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
            
            <ThemedText variant="label" color={theme.textPrimary} style={{ marginTop: Spacing.xs }}>
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
              <ThemedText variant="smallMedium" color={theme.textPrimary}>收款码操作</ThemedText>
            </View>
            
            <View style={styles.shareButtons}>
              <TouchableOpacity 
                style={[styles.shareButton, { backgroundColor: theme.primary }]}
                onPress={saveQRCodeToGallery}
              >
                <FontAwesome6 name="download" size={16} color="#fff" />
                <ThemedText variant="small" color="#fff">保存收款码</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.shareButton, { backgroundColor: theme.accent }]}
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
                <ThemedText variant="small" color={theme.primary}>复制链接</ThemedText>
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

          {/* 充值功能区 */}
          <View style={[styles.rechargeCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.rechargeHeader}>
              <FontAwesome6 name="crown" size={18} color={theme.primary} />
              <ThemedText variant="smallMedium" color={theme.textPrimary}>会员充值</ThemedText>
            </View>
            <View style={styles.rechargeButtons}>
              <TouchableOpacity 
                style={[styles.rechargeButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/membership')}
              >
                <FontAwesome6 name="crown" size={16} color="#fff" />
                <ThemedText variant="small" color="#fff">开通会员</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.rechargeButton, { backgroundColor: theme.accent }]}
                onPress={() => router.push('/payment')}
              >
                <FontAwesome6 name="credit-card" size={16} color="#fff" />
                <ThemedText variant="small" color="#fff">立即充值</ThemedText>
              </TouchableOpacity>
            </View>
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
                      brand={(platform as any).brand}
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
