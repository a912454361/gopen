import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';

export default function TermsOfServiceScreen() {
  const { theme, isDark } = useTheme();

  return (
    <Screen backgroundColor={theme.backgroundRoot} statusBarStyle={isDark ? 'light' : 'dark'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg }}>
        <ThemedText variant="h2" style={{ marginBottom: Spacing.md }}>
          用户服务协议
        </ThemedText>
        
        <ThemedText variant="small" color={theme.textMuted} style={{ marginBottom: Spacing.xl }}>
          最后更新日期：2024年1月1日
        </ThemedText>

        <View style={{ gap: Spacing.lg }}>
          <Section title="一、服务条款的接受">
            <ThemedText variant="body" color={theme.textSecondary}>
              欢迎使用 G open 智能创作助手（以下简称「本服务」）。在使用本服务前，请您仔细阅读本用户服务协议（以下简称「本协议」）。{'\n'}
              {'\n'}您一旦注册、登录或使用本服务，即视为您已充分理解并同意接受本协议的全部内容。如您不同意本协议的任何条款，请立即停止使用本服务。
            </ThemedText>
          </Section>

          <Section title="二、服务说明">
            <ThemedText variant="body" color={theme.textSecondary}>
              1. 服务内容{'\n'}
              本服务是一款面向游戏和动漫创作者的AI辅助创作平台，提供包括但不限于：{'\n'}
              • AI智能对话与创作{'\n'}
              • 图像生成与编辑{'\n'}
              • 视频制作与处理{'\n'}
              • 音频处理与转换{'\n'}
              • 多种AI模型服务{'\n'}
              {'\n'}2. 服务变更{'\n'}
              我们保留随时修改、暂停或终止部分或全部服务的权利，恕不另行通知。对于服务的重大变更，我们将通过应用内通知或其他方式告知用户。
            </ThemedText>
          </Section>

          <Section title="三、账户注册与使用">
            <ThemedText variant="body" color={theme.textSecondary}>
              1. 注册条件{'\n'}
              • 您必须年满18周岁{'\n'}
              • 您提供的注册信息必须真实、准确{'\n'}
              • 每位用户只能注册一个账户{'\n'}
              {'\n'}2. 账户安全{'\n'}
              • 您有责任保护账户信息的安全{'\n'}
              • 如发现账户被盗，请立即联系我们{'\n'}
              • 因您个人原因导致的账户损失，我们不承担责任{'\n'}
              {'\n'}3. 账户注销{'\n'}
              您可以随时申请注销账户。账户注销后，相关数据将按法律法规要求处理。
            </ThemedText>
          </Section>

          <Section title="四、用户行为规范">
            <ThemedText variant="body" color={theme.textSecondary}>
              您在使用本服务时，不得从事以下行为：{'\n'}
              {'\n'}1. 违反法律法规的行为{'\n'}
              • 发布违法信息{'\n'}
              • 侵犯他人知识产权{'\n'}
              • 传播有害信息{'\n'}
              {'\n'}2. 危害网络安全的行为{'\n'}
              • 攻击我们的服务器{'\n'}
              • 传播病毒或恶意代码{'\n'}
              • 非法获取他人信息{'\n'}
              {'\n'}3. 干扰正常服务的行为{'\n'}
              • 使用自动化工具刷量{'\n'}
              • 恶意消耗系统资源{'\n'}
              • 干扰其他用户使用{'\n'}
              {'\n'}4. 其他不当行为{'\n'}
              • 利用AI生成违法内容{'\n'}
              • 冒充他人身份{'\n'}
              • 进行欺诈活动
            </ThemedText>
          </Section>

          <Section title="五、会员服务">
            <ThemedText variant="body" color={theme.textSecondary}>
              1. 会员等级{'\n'}
              我们提供多种会员等级，不同等级享有不同的权益和优惠。{'\n'}
              {'\n'}2. 充值与消费{'\n'}
              • 充值成功后不可退款，但可用于平台内消费{'\n'}
              • 虚拟货币仅限本平台使用，不可转让{'\n'}
              • 消费记录可在应用内查看{'\n'}
              {'\n'}3. 自动续费{'\n'}
              • 开通自动续费后，到期前24小时自动扣款{'\n'}
              • 您可以随时在设置中关闭自动续费{'\n'}
              • 关闭后，当前会员期内服务不受影响
            </ThemedText>
          </Section>

          <Section title="六、知识产权">
            <ThemedText variant="body" color={theme.textSecondary}>
              1. 平台知识产权{'\n'}
              本服务的所有内容，包括但不限于软件、界面设计、商标、标识等，均为我们或其许可方所有。{'\n'}
              {'\n'}2. 用户生成内容{'\n'}
              • 用户通过AI生成的内容，版权归用户所有{'\n'}
              • 用户授权我们使用其内容用于服务改进{'\n'}
              • 用户需确保其内容不侵犯他人权益{'\n'}
              {'\n'}3. AI模型说明{'\n'}
              AI生成内容可能存在不准确之处，请用户自行判断并核实。我们不保证AI生成内容的准确性和适用性。
            </ThemedText>
          </Section>

          <Section title="七、免责声明">
            <ThemedText variant="body" color={theme.textSecondary}>
              1. 服务中断{'\n'}
              因不可抗力、系统维护、网络故障等原因导致的服务中断，我们不承担责任。{'\n'}
              {'\n'}2. 第三方服务{'\n'}
              本服务可能包含第三方链接或服务，我们对第三方内容不承担责任。{'\n'}
              {'\n'}3. AI生成内容{'\n'}
              AI生成内容仅供参考，我们不对其准确性、完整性作任何保证。{'\n'}
              {'\n'}4. 用户行为{'\n'}
              用户因违反本协议或法律法规导致的任何损失，我们不承担责任。
            </ThemedText>
          </Section>

          <Section title="八、隐私保护">
            <ThemedText variant="body" color={theme.textSecondary}>
              我们重视您的隐私保护。关于个人信息的收集、使用、存储和保护，请参阅我们的《隐私政策》。《隐私政策》是本协议的重要组成部分，与本协议具有同等法律效力。
            </ThemedText>
          </Section>

          <Section title="九、协议修改">
            <ThemedText variant="body" color={theme.textSecondary}>
              我们有权随时修改本协议。修改后的协议将在应用内公布，您继续使用本服务即视为同意修改后的协议。如您不同意修改后的协议，可以选择停止使用本服务。
            </ThemedText>
          </Section>

          <Section title="十、争议解决">
            <ThemedText variant="body" color={theme.textSecondary}>
              1. 协商解决{'\n'}
              如您对本服务有任何意见或建议，请先与我们协商解决。{'\n'}
              {'\n'}2. 管辖法院{'\n'}
              如协商不成，任何一方可向我们所在地有管辖权的人民法院提起诉讼。{'\n'}
              {'\n'}3. 适用法律{'\n'}
              本协议的订立、履行和解释均适用中华人民共和国法律。
            </ThemedText>
          </Section>

          <Section title="十一、联系我们">
            <ThemedText variant="body" color={theme.textSecondary}>
              如您对本协议有任何疑问，请通过以下方式联系我们：{'\n'}
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
