import { Stack } from 'expo-router';
import { MembershipProvider } from '@/contexts/MembershipContext';

export default function RootLayout() {
  return (
    <MembershipProvider>
      <Stack screenOptions={{
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        headerShown: false
      }}>
        <Stack.Screen name="(tabs)" options={{ title: "" }} />
      </Stack>
    </MembershipProvider>
  );
}
