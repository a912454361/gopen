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
        <Stack.Screen name="login" options={{ title: "账号登录" }} />
        <Stack.Screen name="bill" options={{ title: "账单明细" }} />
        <Stack.Screen name="cloud-storage" options={{ title: "云存储设置" }} />
        <Stack.Screen name="wallet" options={{ title: "钱包" }} />
        <Stack.Screen name="models" options={{ title: "模型市场" }} />
        <Stack.Screen name="download" options={{ title: "下载应用" }} />
        <Stack.Screen name="membership" options={{ title: "会员中心" }} />
        <Stack.Screen name="payment-admin" options={{ title: "支付审核" }} />
      </Stack>
    </MembershipProvider>
  );
}
