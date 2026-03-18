import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{
      animation: 'slide_from_right',
      gestureEnabled: true,
      gestureDirection: 'horizontal',
      headerShown: false
    }}>
      <Stack.Screen name="(tabs)" options={{ title: "" }} />
    </Stack>
  );
}
