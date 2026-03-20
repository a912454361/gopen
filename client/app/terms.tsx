import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { createStyles } from './styles';

export default function TermsScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText variant="h3" color={theme.textPrimary} style={{ marginBottom: 24 }}>
          用户协议
        </ThemedText>

        <ThemedText variant="caption" color={theme.textMuted} style={{ marginBottom: 16 }}>
          更新日期：2026年3月21日
        </ThemedText>

        <Section title="一、服务条款" theme={theme} styles={styles}>
          欢迎使用 G open！本协议是您与 G open 之间关于使用本应用的法律协议。使用本应用即表示您同意遵守本协议的所有条款。
        </Section>

        <Section title="二、账户注册" theme={theme} styles={styles}>
          • 您需要注册账户才能使用完整功能{'\n'}
          • 您有责任保护账户安全{'\n'}
          • 禁止转让或共享账户{'\n'}
          • 提供真实、准确的注册信息
        </Section>

        <Section title="三、会员服务" theme={theme} styles={styles}>
          • 会员服务为付费服务{'\n'}
          • 会员权益以购买时的说明为准{'\n'}
          • 会员费用一经支付不予退款（除非法律另有规定）{'\n'}
          • 会员到期后自动降级为免费用户
        </Section>

        <Section title="四、用户行为规范" theme={theme} styles={styles}>
          禁止以下行为：{'\n'}
          • 发布违法、有害内容{'\n'}
          • 侵犯他人知识产权{'\n'}
          • 利用应用进行欺诈活动{'\n'}
          • 破坏应用安全或正常运行{'\n'}
          • 自动化爬虫或批量操作
        </Section>

        <Section title="五、知识产权" theme={theme} styles={styles}>
          • 本应用的所有内容受知识产权法保护{'\n'}
          • 用户创作的内容归用户所有{'\n'}
          • 用户授权我们使用其内容提供服务{'\n'}
          • 禁止未经授权复制、传播应用内容
        </Section>

        <Section title="六、免责声明" theme={theme} styles={styles}>
          • 我们尽力确保服务稳定，但不保证无中断{'\n'}
          • AI 生成内容仅供参考{'\n'}
          • 对因使用本应用产生的损失，在法律允许范围内免责{'\n'}
          • 第三方服务的内容和责任由第三方承担
        </Section>

        <Section title="七、服务变更与终止" theme={theme} styles={styles}>
          • 我们有权变更、暂停或终止服务{'\n'}
          • 重大变更将提前通知{'\n'}
          • 违反协议的用户可能被终止服务{'\n'}
          • 服务终止后用户数据将按规定处理
        </Section>

        <Section title="八、争议解决" theme={theme} styles={styles}>
          • 本协议受中华人民共和国法律管辖{'\n'}
          • 争议优先协商解决{'\n'}
          • 协商不成可向有管辖权的人民法院提起诉讼
        </Section>

        <Section title="九、联系我们" theme={theme} styles={styles}>
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
