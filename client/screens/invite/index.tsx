import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Clipboard,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

const EXPO_PUBLIC_BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function InviteScreen() {
  const { theme } = useTheme();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [stats, setStats] = useState({ invited: 0, rewards: 0 });

  // 生成或获取邀请码
  useEffect(() => {
    const initInvite = async () => {
      let code = await AsyncStorage.getItem('inviteCode');
      if (!code) {
        // 生成随机邀请码
        code = `GOP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        await AsyncStorage.setItem('inviteCode', code);
      }
      setInviteCode(code);
      setInviteLink(`${EXPO_PUBLIC_BACKEND_BASE_URL}/download?ref=${code}`);
    };
    initInvite();
  }, []);

  // 复制邀请码
  const handleCopyCode = async () => {
    await Clipboard.setString(inviteCode);
    Alert.alert('复制成功', '邀请码已复制到剪贴板');
  };

  // 复制邀请链接
  const handleCopyLink = async () => {
    await Clipboard.setString(inviteLink);
    Alert.alert('复制成功', '邀请链接已复制到剪贴板');
  };

  // 分享邀请
  const handleShare = async () => {
    try {
      await Share.share({
        title: 'G open - AI智能创作助手',
        message: `我在使用 G open 进行AI创作，非常棒！\n\n使用我的邀请码【${inviteCode}】注册，双方都能获得额外创作次数！\n\n立即下载: ${inviteLink}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // 社交平台分享
  const handleSocialShare = (platform: 'wechat' | 'weibo' | 'qq') => {
    Alert.alert('分享', `即将跳转到${platform === 'wechat' ? '微信' : platform === 'weibo' ? '微博' : 'QQ'}分享...`);
    // 实际实现需要集成对应SDK
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient
          colors={[theme.primary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <FontAwesome6 name="gift" size={48} color="#fff" />
          <ThemedText variant="h3" color="#fff" style={{ marginTop: Spacing.lg, fontWeight: 'bold' }}>
            邀请好友，双方得奖励
          </ThemedText>
          <ThemedText variant="body" color="rgba(255,255,255,0.9)" style={{ marginTop: Spacing.sm }}>
            每邀请一位好友注册，双方各得 10 次创作次数
          </ThemedText>
        </LinearGradient>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.primary}>{stats.invited}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>已邀请</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText variant="h2" color={theme.accent}>{stats.rewards}</ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>获得奖励</ThemedText>
          </View>
        </View>

        {/* Invite Code */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textPrimary}>我的邀请码</ThemedText>
          <View style={[styles.codeCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <ThemedText variant="h2" color={theme.primary} style={{ letterSpacing: 4 }}>
              {inviteCode || '加载中...'}
            </ThemedText>
            <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
              <FontAwesome6 name="copy" size={16} color={theme.textSecondary} />
              <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: 4 }}>复制</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invite Link */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textPrimary}>邀请链接</ThemedText>
          <View style={[styles.linkCard, { backgroundColor: theme.backgroundTertiary, borderColor: theme.border }]}>
            <ThemedText variant="caption" color={theme.textSecondary} numberOfLines={2}>
              {inviteLink || '加载中...'}
            </ThemedText>
            <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton}>
              <FontAwesome6 name="copy" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.primary }]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <FontAwesome6 name="share-nodes" size={20} color="#fff" />
            <ThemedText variant="label" color="#fff" style={{ marginLeft: Spacing.sm }}>
              立即分享
            </ThemedText>
          </TouchableOpacity>

          {/* Social Share */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#07C160' }]}
              onPress={() => handleSocialShare('wechat')}
            >
              <FontAwesome6 name="weixin" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#E6162D' }]}
              onPress={() => handleSocialShare('weibo')}
            >
              <FontAwesome6 name="weibo" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#12B7F5' }]}
              onPress={() => handleSocialShare('qq')}
            >
              <FontAwesome6 name="qq" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Rules */}
        <View style={[styles.rulesCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <ThemedText variant="label" color={theme.textPrimary} style={{ marginBottom: Spacing.md }}>
            邀请规则
          </ThemedText>
          <View style={styles.ruleItem}>
            <FontAwesome6 name="circle-check" size={14} color={theme.success} />
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: Spacing.sm }}>
              好友通过您的邀请码注册成功，双方各得 10 次创作次数
            </ThemedText>
          </View>
          <View style={styles.ruleItem}>
            <FontAwesome6 name="circle-check" size={14} color={theme.success} />
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: Spacing.sm }}>
              邀请次数无上限，邀请越多奖励越多
            </ThemedText>
          </View>
          <View style={styles.ruleItem}>
            <FontAwesome6 name="circle-check" size={14} color={theme.success} />
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: Spacing.sm }}>
              奖励将在好友完成注册后自动发放
            </ThemedText>
          </View>
          <View style={styles.ruleItem}>
            <FontAwesome6 name="circle-check" size={14} color={theme.success} />
            <ThemedText variant="caption" color={theme.textSecondary} style={{ marginLeft: Spacing.sm }}>
              禁止恶意刷邀请，否则将取消奖励并封号
            </ThemedText>
          </View>
        </View>

        {/* QR Code Placeholder */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textPrimary} style={{ textAlign: 'center' }}>
            扫码下载
          </ThemedText>
          <View style={[styles.qrContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <View style={[styles.qrPlaceholder, { backgroundColor: theme.backgroundTertiary }]}>
              <FontAwesome6 name="qrcode" size={80} color={theme.textMuted} />
              <ThemedText variant="caption" color={theme.textMuted} style={{ marginTop: Spacing.md }}>
                二维码即将上线
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = {
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['5xl'],
  },
  header: {
    alignItems: 'center' as const,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  statsCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: Spacing.xl,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  codeCard: {
    marginTop: Spacing.md,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  copyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing.sm,
  },
  linkCard: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  shareButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  socialButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  rulesCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  ruleItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: Spacing.sm,
  },
  qrContainer: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
