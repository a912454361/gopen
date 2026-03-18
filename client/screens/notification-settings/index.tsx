import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSetting {
  id: string;
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'system' | 'content' | 'marketing';
}

const DEFAULT_SETTINGS: NotificationSetting[] = [
  // 系统通知
  {
    id: 'payment',
    icon: 'wallet',
    title: '支付通知',
    description: '支付成功、失败、退款等提醒',
    enabled: true,
    category: 'system',
  },
  {
    id: 'membership',
    icon: 'crown',
    title: '会员提醒',
    description: '会员到期、续费成功提醒',
    enabled: true,
    category: 'system',
  },
  {
    id: 'security',
    icon: 'shield-check',
    title: '安全提醒',
    description: '账号登录、密码修改等安全通知',
    enabled: true,
    category: 'system',
  },
  // 内容通知
  {
    id: 'ai_complete',
    icon: 'wand-magic-sparkles',
    title: 'AI创作完成',
    description: '作品生成完成后推送通知',
    enabled: true,
    category: 'content',
  },
  {
    id: 'download_complete',
    icon: 'download',
    title: '下载完成',
    description: '文件下载完成后通知',
    enabled: true,
    category: 'content',
  },
  {
    id: 'sync_complete',
    icon: 'cloud-arrow-up',
    title: '云同步完成',
    description: '云端同步完成后通知',
    enabled: false,
    category: 'content',
  },
  // 营销通知
  {
    id: 'promotion',
    icon: 'gift',
    title: '优惠活动',
    description: '限时优惠、折扣活动通知',
    enabled: false,
    category: 'marketing',
  },
  {
    id: 'new_features',
    icon: 'sparkles',
    title: '新功能上线',
    description: '新功能发布、版本更新通知',
    enabled: true,
    category: 'marketing',
  },
  {
    id: 'newsletter',
    icon: 'newspaper',
    title: '产品动态',
    description: '产品资讯、使用技巧推送',
    enabled: false,
    category: 'marketing',
  },
];

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  const [settings, setSettings] = useState<NotificationSetting[]>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleSetting = useCallback((id: string) => {
    setSettings(prev => {
      const newSettings = prev.map(s => 
        s.id === id ? { ...s, enabled: !s.enabled } : s
      );
      setHasChanges(true);
      return newSettings;
    });
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
      setHasChanges(false);
      if (Platform.OS === 'web') {
        window.alert('设置已保存');
      } else {
        // Native alert would go here
      }
    } catch (error) {
      console.error('Save settings error:', error);
    }
  }, [settings]);

  const renderCategory = (category: 'system' | 'content' | 'marketing', title: string, icon: string) => {
    const categorySettings = settings.filter(s => s.category === category);
    
    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: theme.primary + '20' }]}>
            <FontAwesome6 name={icon as any} size={14} color={theme.primary} />
          </View>
          <ThemedText variant="label" color={theme.textPrimary}>
            {title}
          </ThemedText>
        </View>
        <View style={styles.settingsList}>
          {categorySettings.map((setting, index) => (
            <TouchableOpacity
              key={setting.id}
              style={[
                styles.settingItem,
                index < categorySettings.length - 1 && styles.settingItemBorder,
              ]}
              onPress={() => toggleSetting(setting.id)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIcon}>
                <FontAwesome6 
                  name={setting.icon as any} 
                  size={16} 
                  color={setting.enabled ? theme.primary : theme.textMuted} 
                />
              </View>
              <View style={styles.settingContent}>
                <ThemedText 
                  variant="smallMedium" 
                  color={setting.enabled ? theme.textPrimary : theme.textMuted}
                >
                  {setting.title}
                </ThemedText>
                <ThemedText variant="caption" color={theme.textMuted}>
                  {setting.description}
                </ThemedText>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: theme.border, true: theme.primary + '50' }}
                thumbColor={setting.enabled ? theme.primary : theme.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ position: 'absolute', left: 0, padding: Spacing.sm, zIndex: 1 }}
          >
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h4" color={theme.textPrimary} style={{ marginLeft: Spacing['2xl'] }}>
            通知设置
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted} style={{ marginLeft: Spacing['2xl'] }}>
            自定义推送通知偏好
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* 说明卡片 */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <FontAwesome6 name="bell" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              推送通知管理
            </ThemedText>
            <ThemedText variant="caption" color={theme.textMuted}>
              您可以自由选择接收哪些类型的通知，关闭后不会收到相关推送
            </ThemedText>
          </View>
        </View>

        {/* 系统通知 */}
        {renderCategory('system', '系统通知', 'gear')}

        {/* 内容通知 */}
        {renderCategory('content', '内容通知', 'wand-magic-sparkles')}

        {/* 营销通知 */}
        {renderCategory('marketing', '营销通知', 'megaphone')}

        {/* 快捷操作 */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              setSettings(prev => prev.map(s => ({ ...s, enabled: true })));
              setHasChanges(true);
            }}
          >
            <FontAwesome6 name="check-double" size={14} color={theme.primary} />
            <ThemedText variant="small" color={theme.primary}>
              全部开启
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              setSettings(prev => prev.map(s => ({ 
                ...s, 
                enabled: s.category !== 'marketing' 
              })));
              setHasChanges(true);
            }}
          >
            <FontAwesome6 name="bell-slash" size={14} color={theme.accent} />
            <ThemedText variant="small" color={theme.accent}>
              仅保留重要
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              setSettings(prev => prev.map(s => ({ ...s, enabled: false })));
              setHasChanges(true);
            }}
          >
            <FontAwesome6 name="moon" size={14} color={theme.textMuted} />
            <ThemedText variant="small" color={theme.textMuted}>
              全部关闭
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 保存按钮 */}
        {hasChanges && (
          <TouchableOpacity onPress={saveSettings} activeOpacity={0.8}>
            <LinearGradient
              colors={[theme.primary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <FontAwesome6 name="floppy-disk" size={16} color={theme.backgroundRoot} />
              <ThemedText variant="labelTitle" color={theme.backgroundRoot}>
                保存设置
              </ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* 免打扰时段 */}
        <View style={styles.dndSection}>
          <View style={styles.dndHeader}>
            <FontAwesome6 name="moon" size={16} color={theme.accent} />
            <ThemedText variant="smallMedium" color={theme.textPrimary}>
              免打扰模式
            </ThemedText>
          </View>
          <ThemedText variant="caption" color={theme.textMuted}>
            开启后，在指定时间段内将不会收到任何推送通知（系统安全通知除外）
          </ThemedText>
          <View style={styles.dndTimeRow}>
            <View style={styles.dndTimeItem}>
              <ThemedText variant="caption" color={theme.textMuted}>
                开始时间
              </ThemedText>
              <View style={styles.dndTimeValue}>
                <FontAwesome6 name="clock" size={12} color={theme.primary} />
                <ThemedText variant="smallMedium" color={theme.primary}>
                  22:00
                </ThemedText>
              </View>
            </View>
            <FontAwesome6 name="arrow-right" size={12} color={theme.textMuted} />
            <View style={styles.dndTimeItem}>
              <ThemedText variant="caption" color={theme.textMuted}>
                结束时间
              </ThemedText>
              <View style={styles.dndTimeValue}>
                <FontAwesome6 name="clock" size={12} color={theme.primary} />
                <ThemedText variant="smallMedium" color={theme.primary}>
                  08:00
                </ThemedText>
              </View>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: theme.border, true: theme.accent + '50' }}
              thumbColor={theme.accent}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
