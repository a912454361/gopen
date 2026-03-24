import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

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
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarItemStyle: {
          height: Platform.OS === 'web' ? 60 : undefined,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '创作',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="wand-magic-sparkles" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: '项目',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="layer-group" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="membership"
        options={{
          title: '会员',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="crown" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="gear" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
