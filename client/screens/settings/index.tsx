import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';

interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const generalMenuItems: MenuItem[] = [
    {
      icon: 'palette',
      title: 'Theme',
      subtitle: 'Appearance settings',
      value: 'DARK',
    },
    {
      icon: 'globe',
      title: 'Language',
      subtitle: 'Interface language',
      value: 'EN',
    },
    {
      icon: 'bell',
      title: 'Notifications',
      subtitle: 'Push notification settings',
    },
  ];

  const aiMenuItems: MenuItem[] = [
    {
      icon: 'microchip',
      title: 'AI Model',
      subtitle: 'Select preferred model',
      value: 'CLAW PRO',
    },
    {
      icon: 'sliders',
      title: 'Generation Quality',
      subtitle: 'Adjust output quality',
      value: 'HIGH',
    },
    {
      icon: 'bolt',
      title: 'Performance Mode',
      subtitle: 'Speed vs Quality balance',
      value: 'BALANCED',
    },
  ];

  const accountMenuItems: MenuItem[] = [
    {
      icon: 'user-shield',
      title: 'Privacy',
      subtitle: 'Data and privacy settings',
    },
    {
      icon: 'key',
      title: 'API Keys',
      subtitle: 'Manage integrations',
    },
    {
      icon: 'circle-question',
      title: 'Help & Support',
      subtitle: 'Get assistance',
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number, total: number) => (
    <TouchableOpacity
      key={item.title}
      style={[styles.menuItem, index < total - 1 && styles.menuItemBorder]}
      onPress={item.onPress}
    >
      <View style={styles.menuIcon}>
        <FontAwesome6 name={item.icon} size={16} color={theme.textPrimary} />
      </View>
      <View style={styles.menuContent}>
        <ThemedText variant="smallMedium" color={theme.textPrimary}>
          {item.title}
        </ThemedText>
        {item.subtitle && (
          <ThemedText variant="caption" color={theme.textMuted}>
            {item.subtitle}
          </ThemedText>
        )}
      </View>
      {item.value && (
        <ThemedText variant="smallMedium" color={theme.primary}>
          {item.value}
        </ThemedText>
      )}
      <FontAwesome6 name="chevron-right" size={12} color={theme.textMuted} />
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="h4" color={theme.textPrimary}>
            Settings
          </ThemedText>
          <ThemedText variant="label" color={theme.textMuted}>
            SYSTEM CONFIGURATION
          </ThemedText>
          <LinearGradient
            colors={[theme.primary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.neonLine}
          />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <FontAwesome6 name="user" size={28} color={theme.primary} />
          </View>
          <View style={styles.profileInfo}>
            <ThemedText variant="title" color={theme.textPrimary}>
              Creator Pro
            </ThemedText>
            <ThemedText variant="small" color={theme.textMuted}>
              pro@openclaw.ai
            </ThemedText>
          </View>
          <FontAwesome6 name="chevron-right" size={12} color={theme.textMuted} />
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted}>
            GENERAL
          </ThemedText>
          <View style={styles.menuList}>
            {generalMenuItems.map((item, index) =>
              renderMenuItem(item, index, generalMenuItems.length)
            )}
          </View>
        </View>

        {/* AI Settings */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted}>
            AI CONFIGURATION
          </ThemedText>
          <View style={styles.menuList}>
            {aiMenuItems.map((item, index) =>
              renderMenuItem(item, index, aiMenuItems.length)
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <ThemedText variant="label" color={theme.textMuted}>
            ACCOUNT
          </ThemedText>
          <View style={styles.menuList}>
            {accountMenuItems.map((item, index) =>
              renderMenuItem(item, index, accountMenuItems.length)
            )}
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <ThemedText variant="caption" color={theme.textMuted}>
            OPENCLAW ENGINE{' '}
            <ThemedText variant="caption" color={theme.primary}>
              v2.4.7
            </ThemedText>
          </ThemedText>
        </View>
      </ScrollView>
    </Screen>
  );
}
