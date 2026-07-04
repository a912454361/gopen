import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const { theme, isDark } = useTheme();

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg }}>
        <ThemedText variant="h2" style={{ marginBottom: Spacing.md }}>
          隐私政策
        </ThemedText>
        
        <ThemedText variant="small" color={theme.textMuted} style={{ marginBottom: Spacing.xl }}>
          最后更新日期：2024年1月1日
        </ThemedText>

        <View style={{ gap: Spacing.lg }}>
          <Section title="一、引言">
            <ThemedText variant="body" color={theme.textSecondary}>
              G open 智能创作助手（以下简称「我们」）非常重视用户的隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。请您在使用我们的服务前仔细阅读本政策。
            </ThemedText>
          </Section>

          <Section title="二、我们收集的信息">
            <ThemedText variant="body" color={theme.textSecondary}>
              {'\n'}1. 账户信息{'\n'}
              当您注册账户时，我们会收集您的手机号码、电子邮件地址和用户名。{'\n'}
              {'\n'}2. 使用信息{'\n'}
              我们会收集您使用服务的相关信息，包括但不限于：{'\n'}
              • 访问时间和频率{'\n'}
              • 功能使用情况{'\n'}
              • 设备信息（型号、操作系统版本）{'\n'}
              {'\n'}3. 内容信息{'\n'}
              当您使用AI创作功能时，我们会存储您的输入内容和生成结果，以便提供历史记录服务。{'\n'}
              {'\n'}4. 支付信息{'\n'}
              我们会收集您的支付记录，但不会存储您的银行卡信息。
            </ThemedText>
          </Section>

          <Section title="三、信息使用目的">
            <ThemedText variant="body" color={theme.textSecondary}>
              我们收集的信息将用于以下目的：{'\n'}
              {'\n'}• 提供、维护和改进我们的服务{'\n'}
              • 处理您的支付请求{'\n'}
              • 发送服务通知和更新{'\n'}
              • 分析用户行为，优化产品体验{'\n'}
              • 保护服务安全，防止欺诈行为{'\n'}
              • 遵守法律法规的要求
            </ThemedText>
          </Section>

          <Section title="四、信息共享">
            <ThemedText variant="body" color={theme.textSecondary}>
              我们不会出售您的个人信息。我们仅在以下情况下共享信息：{'\n'}
              {'\n'}• 经您明确同意{'\n'}
              • 与服务提供商共享（如支付服务商、云服务商）{'\n'}
              • 法律法规要求{'\n'}
              • 保护我们或用户的合法权益
            </ThemedText>
          </Section>

          <Section title="五、数据安全">
            <ThemedText variant="body" color={theme.textSecondary}>
              我们采取多种安全措施保护您的个人信息：{'\n'}
              {'\n'}• 数据传输使用SSL/TLS加密{'\n'}
              • 敏感数据采用AES-256加密存储{'\n'}
              • 定期安全审计和漏洞扫描{'\n'}
              • 访问权限严格控制
            </ThemedText>
          </Section>

          <Section title="六、数据保留">
            <ThemedText variant="body" color={theme.textSecondary}>
              我们会在以下期限内保留您的个人信息：{'\n'}
              {'\n'}• 账户信息：账户存续期间{'\n'}
              • 使用记录：最长12个月{'\n'}
              • 创作内容：用户删除或账户注销后30天{'\n'}
              • 支付记录：法律法规要求的期限（至少5年）
            </ThemedText>
          </Section>

          <Section title="七、您的权利">
            <ThemedText variant="body" color={theme.textSecondary}>
              您对您的个人信息享有以下权利：{'\n'}
              {'\n'}• 访问权：您可以查看我们持有的您的个人信息{'\n'}
              • 更正权：您可以更新或更正不准确的信息{'\n'}
              • 删除权：您可以请求删除您的个人信息{'\n'}
              • 导出权：您可以导出您的个人数据{'\n'}
              • 撤回同意权：您可以撤回之前给予的同意{'\n'}
              {'\n'}如需行使上述权利，请通过以下方式联系我们：{'\n'}
              邮箱：privacy@gopen.app
            </ThemedText>
          </Section>

          <Section title="八、未成年人保护">
            <ThemedText variant="body" color={theme.textSecondary}>
              我们的服务面向18周岁及以上的用户。如果我们发现在未获得可证实的父母同意的情况下收集了未成年人的个人信息，我们会尽快删除相关信息。
            </ThemedText>
          </Section>

          <Section title="九、政策更新">
            <ThemedText variant="body" color={theme.textSecondary}>
              我们可能会不时更新本隐私政策。更新后的政策将在应用内公布，重大变更将通过应用通知告知您。继续使用我们的服务即表示您接受更新后的政策。
            </ThemedText>
          </Section>

          <Section title="十、联系我们">
            <ThemedText variant="body" color={theme.textSecondary}>
              如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：{'\n'}
              {'\n'}• 邮箱：support@gopen.app{'\n'}
              • 地址：中国北京市{'\n'}
              • 网站：https://woshiguotao.cn
            </ThemedText>
          </Section>
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  
  return (
    <View>
      <ThemedText variant="h4" style={{ marginBottom: Spacing.sm }}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}
