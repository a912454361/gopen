/**
 * 推广弹窗组件
 * 首次进入应用时显示，引导用户参与推广
 */

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';

interface PromoModalProps {
  visible: boolean;
  onClose: () => void;
  onJoin: () => void;
}

const PROMO_MODAL_SHOWN_KEY = 'promo_modal_shown_v1';

export function PromoModal({ visible, onClose, onJoin }: PromoModalProps) {
  const { theme } = useTheme();
  const [internalVisible, setInternalVisible] = useState(false);

  useEffect(() => {
    // 检查是否已显示过
    AsyncStorage.getItem(PROMO_MODAL_SHOWN_KEY).then(shown => {
      if (shown !== 'true') {
        // 延迟3秒显示，不打断用户首次体验
        setTimeout(() => {
          setInternalVisible(true);
        }, 3000);
      }
    });
  }, []);

  const handleClose = async () => {
    setInternalVisible(false);
    await AsyncStorage.setItem(PROMO_MODAL_SHOWN_KEY, 'true');
    onClose();
  };

  const handleJoin = async () => {
    setInternalVisible(false);
    await AsyncStorage.setItem(PROMO_MODAL_SHOWN_KEY, 'true');
    onJoin();
  };

  const showModal = visible || internalVisible;

  if (!showModal) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <FontAwesome6 name="xmark" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          {/* 顶部装饰 */}
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53', '#FFA726']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <FontAwesome6 name="gift" size={48} color="#fff" />
            </View>
            <ThemedText variant="h3" color="#fff">推广赚钱计划</ThemedText>
            <ThemedText variant="small" color="rgba(255,255,255,0.9)">
              分享给好友，轻松赚取佣金
            </ThemedText>
          </LinearGradient>

          <ScrollView style={styles.content}>
            {/* 优势列表 */}
            <View style={styles.benefits}>
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: `${theme.success}20` }]}>
                  <FontAwesome6 name="coins" size={20} color={theme.success} />
                </View>
                <View style={styles.benefitText}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>高额佣金</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>好友消费你得10%佣金</ThemedText>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: `${theme.primary}20` }]}>
                  <FontAwesome6 name="infinity" size={20} color={theme.primary} />
                </View>
                <View style={styles.benefitText}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>永久有效</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>一次邀请，永久收益</ThemedText>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: `${theme.accent}20` }]}>
                  <FontAwesome6 name="bolt" size={20} color={theme.accent} />
                </View>
                <View style={styles.benefitText}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>快速提现</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>满10元即可提现，24小时到账</ThemedText>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: '#FF6B6B20' }]}>
                  <FontAwesome6 name="users" size={20} color="#FF6B6B" />
                </View>
                <View style={styles.benefitText}>
                  <ThemedText variant="smallMedium" color={theme.textPrimary}>好友福利</ThemedText>
                  <ThemedText variant="caption" color={theme.textMuted}>好友注册即送免费额度</ThemedText>
                </View>
              </View>
            </View>

            {/* 如何参与 */}
            <View style={styles.howToSection}>
              <ThemedText variant="label" color={theme.textMuted}>如何参与？</ThemedText>
              <View style={styles.steps}>
                <View style={styles.step}>
                  <View style={[styles.stepNum, { backgroundColor: theme.primary }]}>
                    <ThemedText variant="smallMedium" color="#fff">1</ThemedText>
                  </View>
                  <ThemedText variant="small" color={theme.textPrimary}>申请成为推广员</ThemedText>
                </View>
                <View style={styles.step}>
                  <View style={[styles.stepNum, { backgroundColor: theme.primary }]}>
                    <ThemedText variant="smallMedium" color="#fff">2</ThemedText>
                  </View>
                  <ThemedText variant="small" color={theme.textPrimary}>分享专属链接给好友</ThemedText>
                </View>
                <View style={styles.step}>
                  <View style={[styles.stepNum, { backgroundColor: theme.primary }]}>
                    <ThemedText variant="smallMedium" color="#fff">3</ThemedText>
                  </View>
                  <ThemedText variant="small" color={theme.textPrimary}>好友消费，你拿佣金</ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* 底部按钮 */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.laterButton} onPress={handleClose}>
              <ThemedText variant="smallMedium" color={theme.textMuted}>稍后再说</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinButtonGradient}
              >
                <FontAwesome6 name="rocket" size={16} color="#fff" style={{ marginRight: 8 }} />
                <ThemedText variant="label" color="#fff">立即参与</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  content: {
    padding: Spacing.lg,
    maxHeight: 350,
  },
  benefits: {
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  howToSection: {
    marginTop: Spacing.xl,
  },
  steps: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  laterButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    flex: 2,
  },
  joinButtonGradient: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PromoModal;
