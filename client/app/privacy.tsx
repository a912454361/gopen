import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';

export default function PrivacyScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText variant="h3" color={theme.textPrimary} style={{ marginBottom: 24 }}>
          隐私政策
        </ThemedText>

        <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 16 }}>
          更新日期：2026年3月21日
        </ThemedText>

        <Section title="一、信息收集" theme={theme} styles={styles}>
          我们收集以下信息：{'\n'}
          • 设备信息（设备型号、操作系统版本）{'\n'}
          • 账户信息（用户名、邮箱）{'\n'}
          • 使用记录（创作历史、支付记录）{'\n'}
          • 位置信息（仅在使用相关功能时）
        </Section>

        <Section title="二、信息使用" theme={theme} styles={styles}>
          我们使用收集的信息用于：{'\n'}
          • 提供和改进服务{'\n'}
          • 处理支付和会员服务{'\n'}
          • 个性化用户体验{'\n'}
          • 技术支持和客户服务
        </Section>

        <Section title="三、信息保护" theme={theme} styles={styles}>
          我们采取以下安全措施：{'\n'}
          • 数据加密传输和存储{'\n'}
          • 访问权限控制{'\n'}
          • 定期安全审计{'\n'}
          • 服务器安全防护
        </Section>

        <Section title="四、信息共享" theme={theme} styles={styles}>
          我们不会向第三方出售您的个人信息。我们仅在以下情况下共享信息：{'\n'}
          • 获得您的明确同意{'\n'}
          • 法律法规要求{'\n'}
          • 保护我们的权利和安全
        </Section>

        <Section title="五、用户权利" theme={theme} styles={styles}>
          您有权：{'\n'}
          • 访问和修改个人信息{'\n'}
          • 删除账户和数据{'\n'}
          • 撤回授权同意{'\n'}
          • 投诉和反馈
        </Section>

        <Section title="六、儿童隐私" theme={theme} styles={styles}>
          我们的服务不面向14岁以下儿童。如果您发现我们意外收集了儿童的信息，请联系我们删除。
        </Section>

        <Section title="七、政策更新" theme={theme} styles={styles}>
          我们可能会不时更新本隐私政策。更新后的政策将在应用内公布，建议您定期查看。
        </Section>

        <Section title="八、联系方式" theme={theme} styles={styles}>
          如有疑问，请联系：{'\n'}
          • 邮箱：support@woshiguotao.cn{'\n'}
          • 网站：https://woshiguotao.cn
        </Section>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children, theme, styles }: { 
  title: string; 
  children: React.ReactNode; 
  theme: any;
  styles: any;
}) {
  return (
    <ThemedView level="default" style={[styles.card, { marginBottom: 16 }]}>
      <ThemedText variant="h4" color={theme.textPrimary} style={{ marginBottom: 12 }}>
        {title}
      </ThemedText>
      <ThemedText variant="body" color={theme.textSecondary}>
        {children}
      </ThemedText>
    </ThemedView>
  );
}
