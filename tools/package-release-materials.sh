#!/bin/bash

# G open 应用上线材料打包脚本
# 自动生成所有必需材料并打包

PROJECT_ROOT="/workspace/projects"
DOCS_DIR="$PROJECT_ROOT/docs"
RELEASE_DIR="$PROJECT_ROOT/release-package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "========================================"
echo "🚀 G open 应用上线材料打包工具"
echo "========================================"
echo ""

# 创建发布目录
mkdir -p "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/01-软件著作权申请"
mkdir -p "$RELEASE_DIR/02-应用截图"
mkdir -p "$RELEASE_DIR/03-应用商店信息"
mkdir -p "$RELEASE_DIR/04-隐私文档"
mkdir -p "$RELEASE_DIR/05-提交指南"

echo "📦 正在打包材料..."
echo ""

# 1. 软件著作权申请材料
echo "📄 复制软件著作权申请材料..."
cp "$DOCS_DIR/software-copyright/user-manual.md" "$RELEASE_DIR/01-软件著作权申请/"
cp "$DOCS_DIR/software-copyright/source-code.doc" "$RELEASE_DIR/01-软件著作权申请/"
echo "  ✓ 软件说明书"
echo "  ✓ 源程序代码文档"

# 2. 应用截图工具
echo "📸 复制截图生成工具..."
cp "$PROJECT_ROOT/tools/screenshot-generator.html" "$RELEASE_DIR/02-应用截图/"
echo "  ✓ 截图生成器（请在浏览器中打开使用）"

# 3. 应用商店信息
echo "📋 复制应用商店信息..."
cp "$DOCS_DIR/release-platforms.md" "$RELEASE_DIR/03-应用商店信息/"
cp "$DOCS_DIR/release-checklist.md" "$RELEASE_DIR/03-应用商店信息/"
cp "$DOCS_DIR/china-app-stores-guide.md" "$RELEASE_DIR/03-应用商店信息/"
echo "  ✓ 平台清单"
echo "  ✓ 上线检查清单"
echo "  ✓ 国内应用市场指南"

# 4. 隐私文档
echo "🔒 复制隐私政策和服务条款..."
# 创建独立 HTML 文件
cat > "$RELEASE_DIR/04-隐私文档/privacy-policy.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>G open 隐私政策</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.8;
            color: #333;
        }
        h1 { color: #00F0FF; border-bottom: 2px solid #00F0FF; padding-bottom: 10px; }
        h2 { color: #BF00FF; margin-top: 30px; }
        .update-date { color: #888; font-size: 14px; }
        ul { margin: 15px 0; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <h1>G open 隐私政策</h1>
    <p class="update-date">最后更新日期：2025年01月08日</p>
    <p>感谢您使用 G open（以下简称"我们"或"本应用"）。我们深知个人隐私的重要性，并致力于保护您的个人信息安全。</p>
    
    <h2>一、信息收集</h2>
    <p>为了提供更好的服务，我们可能收集以下类型的信息：</p>
    <ul>
        <li>账户信息：用户名、昵称、头像、邮箱地址</li>
        <li>使用数据：应用使用情况、功能偏好、操作记录</li>
        <li>设备信息：设备型号、操作系统版本、唯一设备标识</li>
        <li>交易信息：充值记录、消费记录、会员状态</li>
        <li>内容数据：创作项目、模型配置、存储文件</li>
    </ul>
    
    <h2>二、信息使用</h2>
    <p>我们收集的信息将用于以下目的：</p>
    <ul>
        <li>提供核心服务：AI 模型调用、项目管理、云存储同步</li>
        <li>账户管理：身份验证、会员服务、安全保护</li>
        <li>服务优化：功能改进、性能优化、个性化推荐</li>
        <li>沟通联络：服务通知、问题反馈、活动推送</li>
    </ul>
    
    <h2>三、信息存储与保护</h2>
    <p>我们采用业界标准的安全措施保护您的信息：</p>
    <ul>
        <li>数据加密：传输过程使用 TLS 加密，存储数据采用 AES-256 加密</li>
        <li>访问控制：严格限制员工访问权限，定期审计</li>
        <li>安全审计：记录所有数据访问日志，异常检测</li>
        <li>备份恢复：多地备份，确保数据安全</li>
    </ul>
    
    <h2>四、您的权利</h2>
    <ul>
        <li>访问权：随时查看您的个人信息和使用数据</li>
        <li>更正权：更新或修改您的个人信息</li>
        <li>删除权：申请删除您的个人信息</li>
        <li>导出权：导出您的数据副本</li>
        <li>注销账户：申请注销账户及删除所有数据</li>
    </ul>
    
    <h2>五、联系我们</h2>
    <p>如有任何隐私相关问题，请通过以下方式联系我们：</p>
    <ul>
        <li>邮箱：privacy@gopen.ai</li>
        <li>网站：https://woshiguotao.cn</li>
    </ul>
</body>
</html>
EOF

cat > "$RELEASE_DIR/04-隐私文档/terms-of-service.html" << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>G open 服务条款</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.8;
            color: #333;
        }
        h1 { color: #00F0FF; border-bottom: 2px solid #00F0FF; padding-bottom: 10px; }
        h2 { color: #BF00FF; margin-top: 30px; }
        .update-date { color: #888; font-size: 14px; }
        ul { margin: 15px 0; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <h1>G open 服务条款</h1>
    <p class="update-date">最后更新日期：2025年01月08日</p>
    <p>欢迎使用 G open！本服务条款是您与 G open 之间关于使用本平台服务的法律协议。</p>
    
    <h2>一、服务说明</h2>
    <p>G open 是一款 AI 创作助手应用，提供 AI 模型调用、项目管理、云存储同步等服务。</p>
    
    <h2>二、账户注册与使用</h2>
    <ul>
        <li>您需要注册账户才能使用完整服务</li>
        <li>您对账户下的所有活动负责</li>
        <li>禁止转让、出售或以其他方式处置账户</li>
    </ul>
    
    <h2>三、会员服务与付费</h2>
    <ul>
        <li>会员类型：免费用户、普通会员（¥29/月）、超级会员（¥99/月）</li>
        <li>付费服务一经开通，不支持退款</li>
        <li>会员权益到期后，将自动降级为免费用户</li>
    </ul>
    
    <h2>四、使用规范</h2>
    <p>使用本服务时，您承诺不会：</p>
    <ul>
        <li>违反中国法律法规或公序良俗</li>
        <li>侵犯他人知识产权、隐私权等合法权益</li>
        <li>生成、传播违法违规内容</li>
        <li>逆向工程、破解、攻击本平台系统</li>
    </ul>
    
    <h2>五、知识产权</h2>
    <p>本平台的所有内容均受知识产权法保护。您使用本服务生成的内容，版权归您所有。</p>
    
    <h2>六、免责声明</h2>
    <p>AI 生成内容仅供参考，不构成专业建议。我们不对 AI 生成内容的准确性、完整性负责。</p>
    
    <h2>七、联系我们</h2>
    <p>如有任何问题，请通过以下方式联系我们：</p>
    <ul>
        <li>邮箱：legal@gopen.ai</li>
        <li>网站：https://woshiguotao.cn</li>
    </ul>
</body>
</html>
EOF
echo "  ✓ 隐私政策 HTML"
echo "  ✓ 服务条款 HTML"

# 5. 提交指南
echo "📖 复制提交指南..."
cp "$DOCS_DIR/china-app-stores-guide.md" "$RELEASE_DIR/05-提交指南/国内应用市场提交指南.md"
echo "  ✓ 国内应用市场提交指南"

# 创建总结文档
cat > "$RELEASE_DIR/README.md" << 'EOF'
# 🚀 G open 应用上线材料包

## 📦 材料清单

### 01-软件著作权申请
- `user-manual.md` - 软件说明书
- `source-code.doc` - 源程序代码文档（前30页+后30页）

**申请步骤**：
1. 访问中国版权保护中心：https://www.ccopyright.com.cn
2. 注册账号并实名认证
3. 填写申请表
4. 上传软件说明书和源代码文档
5. 提交申请

---

### 02-应用截图
- `screenshot-generator.html` - 截图生成工具

**使用方法**：
1. 在浏览器中打开 HTML 文件
2. 点击"下载截图"按钮生成各尺寸截图
3. 保存截图用于应用商店提交

**所需截图**：
- Android 手机：1080x1920（至少 2 张）
- iPhone：2778x1284（至少 2 张）
- iPad：2732x2048（可选）

---

### 03-应用商店信息
- `release-platforms.md` - 上线平台清单（12 个平台）
- `release-checklist.md` - 上线检查清单
- `china-app-stores-guide.md` - 国内应用市场指南

**优先级**：
1. 华为应用市场（最大分发渠道）
2. 小米应用商店
3. OPPO 应用商店
4. vivo 应用商店
5. 腾讯应用宝
6. 360、百度（补充）

---

### 04-隐私文档
- `privacy-policy.html` - 隐私政策
- `terms-of-service.html` - 服务条款

**托管方式**：
1. 上传至您的服务器
2. 在应用商店填写链接：https://woshiguotao.cn/privacy-policy

---

### 05-提交指南
- `国内应用市场提交指南.md` - 详细提交步骤

**关键步骤**：
1. 注册开发者账号（各平台）
2. 创建应用
3. 上传 APK
4. 填写应用信息
5. 上传资质文件（软著、ICP）
6. 提交审核

---

## ⏰ 时间规划

### 第1周
- [ ] 申请软件著作权证书
- [ ] 制作应用截图
- [ ] 注册各平台开发者账号

### 第2周
- [ ] 等待软著证书下发
- [ ] 准备 ICP 备案
- [ ] 完善应用信息

### 第3周
- [ ] 提交华为、小米、OPPO
- [ ] 提交 vivo、腾讯应用宝

### 第4周
- [ ] 提交 360、百度
- [ ] 处理审核反馈

---

## 📞 联系方式

- **技术支持**：support@gopen.ai
- **商务合作**：business@gopen.ai
- **官方网站**：https://woshiguotao.cn

---

**打包时间**：2025年01月08日
**版本**：V1.0
EOF

echo ""
echo "✅ 材料打包完成！"
echo ""
echo "📂 打包位置：$RELEASE_DIR"
echo ""
echo "📋 下一步操作："
echo "1. 查看 README.md 了解材料清单"
echo "2. 使用截图生成工具制作截图"
echo "3. 申请软件著作权证书"
echo "4. 注册各平台开发者账号"
echo "5. 提交应用审核"
echo ""
