/**
 * 微信支付扫码支付页面
 * 
 * 功能：
 * 1. 调用后端统一下单接口获取 code_url
 * 2. 使用在线API将 code_url 渲染成二维码图片
 * 3. 轮询查询订单状态
 * 4. 支付成功/失败处理
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeRouter, useSafeSearchParams } from '@/hooks/useSafeRouter';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface WechatPayOrder {
  out_trade_no: string;
  code_url: string;
  amount: number;
  expired_at: string;
  description: string;
  is_mock: boolean;
}

type PayStatus = 'creating' | 'pending' | 'success' | 'failed' | 'closed' | 'expired';

export default function WechatPayScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();
  
  const params = useSafeSearchParams<{ amount?: string; productType?: string }>();
  const amount = parseInt(params.amount || '2900', 10);
  const productType = params.productType || 'membership';
  
  const [order, setOrder] = useState<WechatPayOrder | null>(null);
  const [payStatus, setPayStatus] = useState<PayStatus>('creating');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  
  // 格式化金额
  const formatAmount = (fen: number) => {
    return `¥${(fen / 100).toFixed(2)}`;
  };
  
  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 创建订单
  const createOrder = useCallback(async () => {
    setLoading(true);
    setPayStatus('creating');
    
    try {
      const userId = await AsyncStorage.getItem('userId') || 'guest_user';
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wechat-pay/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          productType,
          description: productType === 'super_member' ? 'G Open超级会员' : 'G Open会员服务',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOrder(result.data);
        setPayStatus('pending');
        
        // 计算倒计时
        const expiredAt = new Date(result.data.expired_at);
        const now = new Date();
        const diffSeconds = Math.floor((expiredAt.getTime() - now.getTime()) / 1000);
        setCountdown(Math.max(diffSeconds, 0));
      } else {
        setPayStatus('failed');
        console.error('Create order failed:', result.error);
      }
    } catch (error) {
      console.error('Create order error:', error);
      setPayStatus('failed');
    } finally {
      setLoading(false);
    }
  }, [amount, productType]);
  
  // 查询订单状态
  const queryOrderStatus = useCallback(async () => {
    if (!order) return;
    
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wechat-pay/query?out_trade_no=${order.out_trade_no}`
      );
      const result = await response.json();
      
      if (result.success) {
        const { trade_state } = result.data;
        
        if (trade_state === 'SUCCESS') {
          setPayStatus('success');
          setPolling(false);
        } else if (trade_state === 'CLOSED') {
          setPayStatus('closed');
          setPolling(false);
        }
      }
    } catch (error) {
      console.error('Query order error:', error);
    }
  }, [order]);
  
  // 初始化创建订单
  useEffect(() => {
    createOrder();
  }, [createOrder]);
  
  // 倒计时
  useEffect(() => {
    if (countdown > 0 && payStatus === 'pending') {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && payStatus === 'pending') {
      setPayStatus('expired');
      setPolling(false);
    }
  }, [countdown, payStatus]);
  
  // 轮询订单状态
  useEffect(() => {
    if (!polling || payStatus !== 'pending') return;
    
    const interval = setInterval(queryOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [polling, payStatus, queryOrderStatus]);
  
  // 开始轮询
  useEffect(() => {
    if (order && payStatus === 'pending') {
      setPolling(true);
    }
  }, [order, payStatus]);
  
  // 关闭订单
  const handleCloseOrder = async () => {
    if (!order) return;
    
    try {
      await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/wechat-pay/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ out_trade_no: order.out_trade_no }),
      });
      
      router.back();
    } catch (error) {
      console.error('Close order error:', error);
    }
  };
  
  // 生成二维码图片URL
  const getQRCodeUrl = (codeUrl: string) => {
    // 使用在线二维码生成服务
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(codeUrl)}`;
  };
  
  // 渲染状态图标
  const renderStatusIcon = () => {
    switch (payStatus) {
      case 'success':
        return (
          <View style={[styles.statusIcon, { backgroundColor: '#D1FAE5' }]}>
            <FontAwesome6 name="check" size={28} color="#059669" />
          </View>
        );
      case 'failed':
      case 'expired':
        return (
          <View style={[styles.statusIcon, { backgroundColor: '#FEE2E2' }]}>
            <FontAwesome6 name="times" size={28} color="#DC2626" />
          </View>
        );
      case 'closed':
        return (
          <View style={[styles.statusIcon, { backgroundColor: '#FEF3C7' }]}>
            <FontAwesome6 name="ban" size={28} color="#D97706" />
          </View>
        );
      default:
        return null;
    }
  };
  
  // 渲染支付状态
  const renderPayStatus = () => {
    const statusConfig: Record<PayStatus, { title: string; desc: string }> = {
      creating: { title: '创建订单中...', desc: '请稍候' },
      pending: { title: '', desc: '' },
      success: { title: '支付成功', desc: '您的会员已激活，感谢您的支持！' },
      failed: { title: '支付失败', desc: '订单创建失败，请重试' },
      closed: { title: '订单已关闭', desc: '您已取消支付' },
      expired: { title: '订单已过期', desc: '支付超时，请重新下单' },
    };
    
    const config = statusConfig[payStatus];
    
    if (payStatus === 'pending') return null;
    
    return (
      <View style={styles.statusCard}>
        {renderStatusIcon()}
        <ThemedText variant="h3" color={theme.textPrimary}>
          {config.title}
        </ThemedText>
        <ThemedText variant="small" color={theme.textSecondary} style={{ marginTop: Spacing.sm }}>
          {config.desc}
        </ThemedText>
        
        <View style={styles.buttonGroup}>
          {payStatus === 'success' ? (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.replace('/membership')}
            >
              <ThemedText variant="smallMedium" color="#FFFFFF">查看会员权益</ThemedText>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={createOrder}
              >
                <ThemedText variant="smallMedium" color="#FFFFFF">重新支付</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => router.back()}
              >
                <ThemedText variant="smallMedium" color={theme.textPrimary}>返回</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };
  
  // 渲染二维码区域
  const renderQRCode = () => {
    if (payStatus !== 'pending' || !order) return null;
    
    return (
      <>
        {/* 模拟模式提示 */}
        {order.is_mock && (
          <View style={styles.mockBanner}>
            <FontAwesome6 name="info-circle" size={16} color="#92400E" />
            <ThemedText variant="caption" style={styles.mockText}>
              模拟模式：微信支付未配置真实商户信息，二维码仅供演示
            </ThemedText>
          </View>
        )}
        
        {/* 倒计时 */}
        <View style={styles.countdownBar}>
          <FontAwesome6 
            name="clock" 
            size={14} 
            color={countdown > 300 ? theme.textMuted : theme.error} 
          />
          <ThemedText 
            variant="small" 
            color={countdown > 300 ? theme.textMuted : theme.error}
          >
            请在 {formatCountdown(countdown)} 内完成支付
          </ThemedText>
        </View>
        
        {/* 二维码 */}
        <View style={styles.qrSection}>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.qrTitle}>
            使用微信扫码支付
          </ThemedText>
          
          <View style={styles.qrContainer}>
            {order.code_url ? (
              <Image 
                source={{ uri: getQRCodeUrl(order.code_url) }} 
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <FontAwesome6 name="qrcode" size={60} color={theme.textMuted} />
              </View>
            )}
          </View>
          
          {/* 订单信息 */}
          <View style={styles.orderCard}>
            <View style={styles.orderRow}>
              <ThemedText variant="caption" color={theme.textSecondary}>订单金额</ThemedText>
              <ThemedText variant="h2" color="#07C160">{formatAmount(order.amount)}</ThemedText>
            </View>
            <View style={styles.orderRow}>
              <ThemedText variant="caption" color={theme.textSecondary}>订单编号</ThemedText>
              <ThemedText variant="small" color={theme.textPrimary}>{order.out_trade_no}</ThemedText>
            </View>
            <View style={styles.orderRow}>
              <ThemedText variant="caption" color={theme.textSecondary}>商品说明</ThemedText>
              <ThemedText variant="small" color={theme.textPrimary}>{order.description}</ThemedText>
            </View>
          </View>
          
          {/* 刷新状态 */}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={queryOrderStatus}
          >
            <FontAwesome6 name="refresh" size={14} color="#07C160" />
            <ThemedText variant="caption" color="#07C160">
              {polling ? '正在查询支付状态...' : '刷新状态'}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* 操作按钮 */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleCloseOrder}
          >
            <ThemedText variant="smallMedium" color={theme.textPrimary}>取消支付</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* 支付提示 */}
        <View style={styles.tipsSection}>
          <ThemedText variant="smallMedium" color={theme.textPrimary} style={styles.tipsTitle}>
            支付说明
          </ThemedText>
          <View style={styles.tipsItem}>
            <View style={styles.tipsDot} />
            <ThemedText variant="caption" color={theme.textSecondary} style={styles.tipsText}>
              请使用微信扫描上方二维码完成支付
            </ThemedText>
          </View>
          <View style={styles.tipsItem}>
            <View style={styles.tipsDot} />
            <ThemedText variant="caption" color={theme.textSecondary} style={styles.tipsText}>
              支付成功后页面将自动跳转，无需手动操作
            </ThemedText>
          </View>
          <View style={styles.tipsItem}>
            <View style={styles.tipsDot} />
            <ThemedText variant="caption" color={theme.textSecondary} style={styles.tipsText}>
              如遇支付问题，请联系客服处理
            </ThemedText>
          </View>
        </View>
      </>
    );
  };
  
  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary}>微信支付</ThemedText>
        </View>
        
        {/* 加载状态 */}
        {loading && (
          <View style={styles.statusCard}>
            <ActivityIndicator size="large" color="#07C160" />
            <ThemedText variant="small" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
              正在创建订单...
            </ThemedText>
          </View>
        )}
        
        {/* 支付状态 */}
        {!loading && renderPayStatus()}
        
        {/* 二维码区域 */}
        {!loading && renderQRCode()}
      </ScrollView>
    </Screen>
  );
}
