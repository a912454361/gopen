import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { createStyles } from './styles';
import { Spacing } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
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
          <ThemedText variant="h3" color={theme.textPrimary}>隐私政策</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText variant="h4" color={theme.textPrimary} style={styles.sectionTitle}>
            G open 隐私政策
          </ThemedText>
          <ThemedText variant="small" color={theme.textMuted} style={styles.updateDate}>
            最后更新日期：2025年1月8日
          </ThemedText>

          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            感谢您使用 G open（以下简称"我们"或"本应用"）。我们深知个人隐私的重要性，并致力于保护您的个人信息安全。本隐私政策将详细说明我们如何收集、使用、存储和保护您的信息。
          </ThemedText>

          {/* 一、信息收集 */}
          <ThemedText variant="title" color={theme.textPrimary} style={styles.sectionTitle}>
            一、信息收集
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            为了提供更好的服务，我们可能收集以下类型的信息：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1. 账户信息：用户名、昵称、头像、邮箱地址
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2. 使用数据：应用使用情况、功能偏好、操作记录
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3. 设备信息：设备型号、操作系统版本、唯一设备标识
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4. 交易信息：充值记录、消费记录、会员状态
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            5. 内容数据：创作项目、模型配置、存储文件
          </ThemedText>

          {/* 二、信息使用 */}
          <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
            二、信息使用
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            我们收集的信息将用于以下目的：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1. 提供核心服务：AI 模型调用、项目管理、云存储同步
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2. 账户管理：身份验证、会员服务、安全保护
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3. 服务优化：功能改进、性能优化、个性化推荐
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4. 沟通联络：服务通知、问题反馈、活动推送
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            5. 安全防护：防止欺诈、保护账户安全
          </ThemedText>

          {/* 三、信息存储 */}
          <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
            三、信息存储与保护
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            我们采用业界标准的安全措施保护您的信息：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1. 数据加密：传输过程使用 TLS 加密，存储数据采用 AES-256 加密
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2. 访问控制：严格限制员工访问权限，定期审计
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3. 安全审计：记录所有数据访问日志，异常检测
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4. 备份恢复：多地备份，确保数据安全
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            5. 存储期限：账户注销后 90 天内删除所有数据
          </ThemedText>

          {/* 四、信息共享 */}
          <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
            四、信息共享
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            我们承诺不会出售您的个人信息。在以下情况下，我们可能共享您的信息：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1. 服务提供商：AI 模型提供商（OpenAI、Anthropic、豆包等）
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2. 云存储服务：用户授权的百度网盘、阿里云盘等
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3. 支付服务：微信支付、支付宝等支付平台
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4. 法律要求：遵守法律法规或响应合法的政府请求
          </ThemedText>

          {/* 五、用户权利 */}
          <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
            五、您的权利
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            您对个人信息享有以下权利：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1. 访问权：随时查看您的个人信息和使用数据
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2. 更正权：更新或修改您的个人信息
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3. 删除权：申请删除您的个人信息
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            4. 导出权：导出您的数据副本
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            5. 撤回同意：随时撤回对数据处理的同意
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            6. 注销账户：申请注销账户及删除所有数据
          </ThemedText>

          {/* 六、Cookie */}
          <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
            六、Cookie 和追踪技术
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            我们使用以下技术改善服务体验：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1. 本地存储：保存登录状态、用户偏好设置
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2. 分析工具：匿名统计应用使用情况
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3. 崩溃报告：收集崩溃日志以改进稳定性
          </ThemedText>

          {/* 七、未成年人保护 */}
          <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
            七、未成年人保护
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            我们非常重视未成年人的隐私保护：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1. 未满 14 周岁的用户需在监护人同意下使用本应用
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2. 不会主动收集未成年人的个人信息
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3. 如发现误收集未成年人信息，将及时删除
          </ThemedText>

          {/* 八、政策更新 */}
          <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
            八、隐私政策更新
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            我们可能会不时更新本隐私政策：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            1. 重大变更将通过应用内通知或邮件告知
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            2. 继续使用本应用即表示同意更新后的政策
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            3. 您有权选择停止使用本应用
          </ThemedText>

          {/* 九、联系我们 */}
          <ThemedText variant="h5" color={theme.textPrimary} style={styles.sectionTitle}>
            九、联系我们
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            如有任何隐私相关问题或投诉，请通过以下方式联系我们：
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            • 邮箱：privacy@gopen.ai
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            • 网站：https://woshiguotao.cn
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.listItem}>
            • 地址：中国北京市朝阳区（示例地址）
          </ThemedText>
          <ThemedText variant="small" color={theme.textSecondary} style={styles.paragraph}>
            我们将在 15 个工作日内回复您的请求。
          </ThemedText>

          <View style={{ height: Spacing['3xl'] }} />
        </View>
      </ScrollView>
    </Screen>
  );
}
