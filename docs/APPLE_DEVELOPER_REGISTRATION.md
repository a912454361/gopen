# Apple Developer 账号注册指南

## 📋 准备材料

### 个人账号 ($99/年)
- ✅ 身份证（需拍照或扫描）
- ✅ 信用卡或支付宝（用于支付年费）
- ✅ 可接收短信的手机号
- ✅ 真实的姓名和联系方式

### 公司账号 ($99/年)
- ✅ 营业执照
- ✅ 邓白氏编码 (D-U-N-S Number) - [免费申请](https://www.dnb.com/duns-number)
- ✅ 公司公章
- ✅ 法人身份证
- ✅ 公司对公银行账户（用于验证）

---

## 🚀 注册步骤

### 步骤 1：访问 Apple Developer 网站

打开浏览器，访问：https://developer.apple.com/programs/

点击右上角 **"Enroll"（注册）** 按钮

### 步骤 2：登录 Apple ID

1. 使用现有 Apple ID 登录，或创建新的 Apple ID
2. **重要**：Apple ID 邮箱必须是可以正常接收邮件的

### 步骤 3：选择账号类型

- **Individual（个人）**：适合个人开发者
- **Organization（组织/公司）**：适合企业开发

### 步骤 4：填写个人信息/公司信息

**个人账号**：
1. 填写真实姓名（与身份证一致）
2. 填写手机号码
3. 填写地址信息
4. 选择支付方式

**公司账号**：
1. 填写公司名称（与营业执照一致）
2. 输入邓白氏编码
3. 填写公司地址
4. 上传营业执照
5. 等待 Apple 验证（通常1-2周）

### 步骤 5：支付年费

1. 选择支付方式：
   - 信用卡（Visa/MasterCard）
   - 支付宝（支持人民币支付）
   
2. 支付金额：
   - $99 USD ≈ ¥699 人民币

### 步骤 6：完成注册

支付成功后，您的 Apple Developer 账号立即生效！

---

## ⚠️ 注意事项

### 常见被拒原因

1. **姓名不真实**
   - 必须使用真实姓名，与身份证一致
   - 不能使用昵称或英文名

2. **地址信息不完整**
   - 必须填写完整的地址信息
   - 地址必须真实存在

3. **公司信息不一致**
   - 公司名称必须与营业执照完全一致
   - 邓白氏编码必须有效

4. **支付失败**
   - 确保信用卡额度充足
   - 支付宝余额充足

### 审核时间

- **个人账号**：通常即时生效
- **公司账号**：通常需要 1-2 周

---

## 📱 App Store Connect 配置

账号生效后，需要进行以下配置：

### 1. 创建 App ID

1. 访问：https://appstoreconnect.apple.com
2. 点击 "我的 App" → "+" → "新建 App"
3. 填写信息：
   - **名称**：G open 智能创作助手
   - **主要语言**：简体中文
   - **Bundle ID**：com.gopen.app
   - **SKU**：gopen-001（自定义）

### 2. 配置证书

```bash
# 使用 EAS 自动配置证书
eas credentials

# 选择 platform: ios
# 选择 action: Set up new credentials
# 选择 "Let EAS handle the process"
```

### 3. 配置 App 信息

在 App Store Connect 中填写：

| 项目 | 内容 |
|------|------|
| 隐私政策 URL | https://woshiguotao.cn/privacy |
| 用户协议 URL | https://woshiguotao.cn/terms |
| 技术支持 URL | https://woshiguotao.cn/support |
| 营销网站 URL | https://woshiguotao.cn |

---

## 🔗 相关链接

- [Apple Developer 官网](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [邓白氏编码申请](https://www.dnb.com/duns-number)
- [App Store 审核指南](https://developer.apple.com/app-store/review/guidelines/)
- [人机界面指南](https://developer.apple.com/design/human-interface-guidelines/)

---

## ❓ 常见问题

### Q1：邓白氏编码是什么？
A：邓白氏编码 (D-U-N-S Number) 是一个独特的9位数字编码，用于标识企业实体。申请公司账号必须提供有效的邓白氏编码。

### Q2：个人账号和公司账号有什么区别？
A：
- **功能相同**：都可以上架 App Store
- **区别**：公司账号可以添加团队成员，App 显示公司名称
- **推荐**：个人开发者选择个人账号即可

### Q3：年费什么时候扣？
A：每年到期前 30 天自动续费，会发送邮件提醒。

### Q4：可以退款吗？
A：Apple Developer 年费一旦支付，概不退款。

---

## 📞 需要帮助？

如果您在注册过程中遇到问题，可以：

1. 联系 Apple Developer 支持：https://developer.apple.com/contact/
2. 查看官方文档：https://developer.apple.com/support/
