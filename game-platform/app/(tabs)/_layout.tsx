/**
 * Tab 导航布局
 */
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

const GOLD = '#D4AF37';

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.backgroundRoot,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: Platform.OS === 'web' ? 60 : 50 + insets.bottom,
          paddingBottom: Platform.OS === 'web' ? 0 : insets.bottom,
        },
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarItemStyle: {
          height: Platform.OS === 'web' ? 60 : undefined,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: '卡牌',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="layer-group" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          title: '对战',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="swords" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recharge"
        options={{
          title: '充值',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="wallet" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="download"
        options={{
          title: '下载',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="download" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
