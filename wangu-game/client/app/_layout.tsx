/**
 * 根布局
 */
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

function RootNavigator() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]} edges={['top']}>
      <Stack screenOptions={{
        animation: 'slide_from_right',
        headerShown: false,
        contentStyle: { backgroundColor: theme.backgroundRoot },
      }}>
        <Stack.Screen name="(tabs)" options={{ title: "" }} />
      </Stack>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
