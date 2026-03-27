import { Stack } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { MembershipProvider } from '@/contexts/MembershipContext';
import { ToastProvider } from '@/components/Toast';
import { useTheme } from '@/hooks/useTheme';

function RootLayoutContent() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Stack screenOptions={{
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        headerShown: false,
        contentStyle: { backgroundColor: theme.backgroundRoot },
      }}>
        <Stack.Screen name="(tabs)" options={{ title: "" }} />
        <Stack.Screen name="workflow" options={{ title: "创作工作台" }} />
        <Stack.Screen name="storage" options={{ title: "云端存储" }} />
        <Stack.Screen name="payment" options={{ title: "支付中心" }} />
        <Stack.Screen name="login" options={{ title: "账号登录" }} />
        <Stack.Screen name="auth-login" options={{ title: "登录" }} />
        <Stack.Screen name="register" options={{ title: "注册" }} />
        <Stack.Screen name="forgot-password" options={{ title: "找回密码" }} />
        <Stack.Screen name="bill" options={{ title: "账单明细" }} />
        <Stack.Screen name="cloud-storage" options={{ title: "云存储设置" }} />
        <Stack.Screen name="wallet" options={{ title: "钱包" }} />
        <Stack.Screen name="download" options={{ title: "下载应用" }} />
        <Stack.Screen name="payment-admin" options={{ title: "支付审核" }} />
        <Stack.Screen name="admin" options={{ title: "管理后台" }} />
        <Stack.Screen name="notification-settings" options={{ title: "通知设置" }} />
        <Stack.Screen name="privacy-policy" options={{ title: "隐私政策" }} />
        <Stack.Screen name="terms-of-service" options={{ title: "服务条款" }} />
        <Stack.Screen name="profit-panel" options={{ title: "利润统计" }} />
        <Stack.Screen name="cloud-storage-setup" options={{ title: "云存储开通" }} />
        <Stack.Screen name="privacy-settings" options={{ title: "隐私设置" }} />
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
        <Stack.Screen name="audio" options={{ title: "AI音频工具" }} />
        <Stack.Screen name="token-usage" options={{ title: "Token用量统计" }} />
        <Stack.Screen name="chat-history" options={{ title: "对话历史" }} />
        <Stack.Screen name="create" options={{ title: "AI创作中心" }} />
        <Stack.Screen name="theme" options={{ title: "主题设置" }} />
        <Stack.Screen name="language" options={{ title: "语言设置" }} />
        <Stack.Screen name="invite" options={{ title: "邀请有礼" }} />
        <Stack.Screen name="profile-edit" options={{ title: "编辑资料" }} />
        <Stack.Screen name="recharge" options={{ title: "充值中心" }} />
        <Stack.Screen name="consumption" options={{ title: "消费明细" }} />
        <Stack.Screen name="rewards" options={{ title: "奖励中心" }} />
        <Stack.Screen name="providers" options={{ title: "厂商管理" }} />
        <Stack.Screen name="free-anime" options={{ title: "AI动漫创作" }} />
        <Stack.Screen name="anime-detail" options={{ title: "动漫详情" }} />
        <Stack.Screen name="anime-list" options={{ title: "动漫列表" }} />
        <Stack.Screen name="guofeng-create" options={{ title: "国风创作" }} />
        <Stack.Screen name="ue-engine" options={{ title: "UE5引擎创作" }} />
        <Stack.Screen name="one-day-production" options={{ title: "24小时极速制作" }} />
        <Stack.Screen name="vendor-register" options={{ title: "厂商入驻" }} />
        <Stack.Screen name="vendor-dashboard" options={{ title: "厂商后台" }} />
        <Stack.Screen name="ink-cards" options={{ title: "万古长夜" }} />
        <Stack.Screen name="ink-battle" options={{ title: "卡牌对战" }} />
        <Stack.Screen name="game" options={{ title: "游戏平台" }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <MembershipProvider>
      <ToastProvider>
        <RootLayoutContent />
      </ToastProvider>
    </MembershipProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
