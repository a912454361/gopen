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
        <Stack.Screen name="workflow" options={{ title: "创作工作台" }} />
        <Stack.Screen name="storage" options={{ title: "云端存储" }} />
        <Stack.Screen name="payment" options={{ title: "支付中心" }} />
      </Stack>
    </MembershipProvider>
  );
}
