import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

export default function TermsOfServiceScreen() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useSafeRouter();

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle="light">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: Spacing.sm }}>
            <FontAwesome6 name="arrow-left" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <ThemedText variant="h3" color={theme.textPrimary}>服务条款</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            G open 服务条款
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted} style={styles.updateDate}>
            最后更新日期：2025年1月8日
          </ThemedText>

          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            欢迎使用 G open！本服务条款（以下简称&quot;本条款&quot;）是您与 G open（以下简称&quot;我们&quot;或&quot;本平台&quot;）之间关于使用本平台服务的法律协议。使用本平台服务前，请仔细阅读本条款。
          </ThemedText>

          {/* 一、服务说明 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            一、服务说明
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1.1 G open 是一款 AI 创作助手应用，提供 AI 模型调用、项目管理、云存储同步等服务
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1.2 我们保留随时修改、暂停或终止服务的权利，恕不另行通知
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1.3 服务内容包括但不限于：AI 对话、图像生成、项目管理、云存储等
          </ThemedText>

          {/* 二、用户注册 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            二、账户注册与使用
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2.1 您需要注册账户才能使用完整服务，注册时需提供真实、准确的信息
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2.2 您对账户下的所有活动负责，应妥善保管账户密码
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2.3 禁止转让、出售或以其他方式处置账户
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2.4 如发现账户被盗，应立即通知我们
          </ThemedText>

          {/* 三、会员服务 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            三、会员服务与付费
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3.1 会员类型：免费用户、普通会员（¥29/月）、超级会员（¥99/月）
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3.2 付费服务一经开通，不支持退款（法律另有规定除外）
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3.3 会员权益到期后，将自动降级为免费用户
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3.4 我们有权调整会员价格和权益，已开通的会员不受影响
          </ThemedText>

          {/* 四、使用规范 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            四、使用规范
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            使用本服务时，您承诺不会：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4.1 违反中国法律法规或公序良俗
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4.2 侵犯他人知识产权、隐私权等合法权益
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4.3 生成、传播违法违规内容
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4.4 逆向工程、破解、攻击本平台系统
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4.5 使用自动化工具大量调用 API
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4.6 将服务用于商业竞争或不正当目的
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4.7 转售、出租或以其他方式商业化使用本服务
          </ThemedText>

          {/* 五、知识产权 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            五、知识产权
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            5.1 本平台的所有内容（包括但不限于软件、设计、商标）均受知识产权法保护
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            5.2 您使用本服务生成的内容，版权归您所有
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            5.3 您授权我们使用您生成的内容改进服务
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            5.4 如发现侵权内容，请联系我们处理
          </ThemedText>

          {/* 六、免责声明 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            六、免责声明
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            6.1 AI 生成内容仅供参考，不构成专业建议
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            6.2 我们不对 AI 生成内容的准确性、完整性负责
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            6.3 因不可抗力导致的服务中断，我们不承担责任
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            6.4 第三方服务（如云存储）的问题，我们不承担连带责任
          </ThemedText>

          {/* 七、服务终止 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            七、服务终止
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            7.1 您有权随时注销账户并停止使用服务
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            7.2 如您违反本条款，我们有权暂停或终止服务
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            7.3 服务终止后，您的数据将按隐私政策处理
          </ThemedText>

          {/* 八、争议解决 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            八、争议解决
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            8.1 本条款的解释和执行均适用中华人民共和国法律
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            8.2 如发生争议，双方应首先友好协商解决
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            8.3 协商不成的，任何一方可向我们所在地法院提起诉讼
          </ThemedText>

          {/* 九、条款修改 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            九、条款修改
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            9.1 我们有权随时修改本条款
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            9.2 重大变更将通过应用内通知或邮件告知
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            9.3 继续使用服务即表示同意修改后的条款
          </ThemedText>

          {/* 十、联系我们 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            十、联系我们
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            如有任何问题，请通过以下方式联系我们：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            • 邮箱：legal@gopen.ai
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            • 网站：https://woshiguotao.cn
          </ThemedText>

          <View style={{ height: Spacing['3xl'] }} />
        </View>
      </ScrollView>
    </Screen>
  );
}
