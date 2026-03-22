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
        <Stack.Screen name="admin" options={{ title: "管理后台" }} />
        <Stack.Screen name="notification-settings" options={{ title: "通知设置" }} />
        <Stack.Screen name="privacy" options={{ title: "隐私政策" }} />
        <Stack.Screen name="terms" options={{ title: "用户协议" }} />
        <Stack.Screen name="profit-panel" options={{ title: "利润统计" }} />
        <Stack.Screen name="cloud-storage-setup" options={{ title: "云存储开通" }} />
        <Stack.Screen name="privacy-settings" options={{ title: "隐私设置" }} />
        <Stack.Screen name="privacy-policy" options={{ title: "隐私政策" }} />
        <Stack.Screen name="terms-of-service" options={{ title: "服务条款" }} />
        <Stack.Screen name="api-keys" options={{ title: "API密钥管理" }} />
        <Stack.Screen name="promotion" options={{ title: "推广中心" }} />
        <Stack.Screen name="admin-login" options={{ title: "管理员登录" }} />
        {/* 新增页面 */}
        <Stack.Screen name="my-works" options={{ title: "我的作品" }} />
        <Stack.Screen name="community" options={{ title: "创作社区" }} />
        <Stack.Screen name="templates" options={{ title: "模板市场" }} />
        <Stack.Screen name="notifications" options={{ title: "消息通知" }} />
        <Stack.Screen name="stats" options={{ title: "数据统计" }} />
        <Stack.Screen name="image-gen" options={{ title: "AI图像创作" }} />
      </Stack>
    </MembershipProvider>
  );
}
