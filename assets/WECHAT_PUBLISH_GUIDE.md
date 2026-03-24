# 微信小程序发布操作指南

## 📦 第一步：代码上传微信开发者工具

### 1. 安装微信开发者工具
下载地址：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 2. 导入项目
1. 打开微信开发者工具
2. 点击「导入项目」
3. 选择项目目录：`miniprogram/`
4. 填写AppID（需要在微信公众平台获取）

### 3. 配置项目
```json
// project.config.json
{
  "appid": "你的小程序AppID",
  "projectname": "剑破苍穹",
  "miniprogramRoot": "miniprogram/",
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "enableEngineNative": false,
    "useIsolateContext": true,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "disableUseStrict": false,
    "minifyWXML": true,
    "showES6CompileOption": false,
    "useCompilerPlugins": false
  }
}
```

### 4. 上传代码
1. 点击右上角「上传」按钮
2. 填写版本信息：
   - 版本号：`1.0.0`
   - 备注：`首发版本 - 横屏3D粒子仙侠游戏`
3. 点击「上传」
4. 等待上传完成

---

## 🔍 第二步：提交审核

### 1. 登录微信公众平台
地址：https://mp.weixin.qq.com/

### 2. 进入版本管理
路径：管理 → 版本管理 → 开发版本

### 3. 提交审核
点击开发版本右侧的「提交审核」按钮

### 4. 填写审核信息

#### 基本信息
```
小程序名称：剑破苍穹
小程序简介：一款横屏3D粒子仙侠互动剧情游戏
服务类目：游戏 → 休闲游戏
```

#### 功能页面

**页面1：首页（主游戏页面）**
```
页面路径：pages/main/main
页面功能：游戏主界面，展示用户信息、货币系统、功能入口
```

**页面2：剧情游戏**
```
页面路径：pages/index/index
页面功能：互动剧情选择，推进主线故事
```

**页面3：关卡挑战**
```
页面路径：pages/stage/stage
页面功能：关卡选择、扫荡、战力碾压
```

**页面4：竞技场**
```
页面路径：pages/arena/arena
页面功能：PVP对战、积分排名、赛季奖励
```

**页面5：战盟**
```
页面路径：pages/guild/guild
页面功能：创建/加入战盟、成员管理、战盟战
```

#### 测试账号
```
测试账号：无需登录，游戏内自动分配UID
测试密码：无
```

---

## 🌐 第三步：配置服务器域名

### 1. 进入开发设置
路径：开发 → 开发管理 → 开发设置 → 服务器域名

### 2. 配置域名

#### request合法域名
```
https://your-domain.com
https://api.your-domain.com
```

#### socket合法域名
```
wss://your-domain.com
```

#### uploadFile合法域名
```
https://your-domain.com
https://cdn.your-domain.com
```

#### downloadFile合法域名
```
https://your-domain.com
https://cdn.your-domain.com
```

### 3. 域名要求
- 必须是HTTPS协议
- 必须有有效的SSL证书
- 域名需ICP备案
- 不支持IP地址和端口号

### 4. 本地开发调试
在微信开发者工具中：
- 右上角「详情」→「本地设置」
- 勾选「不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书」
- 仅用于开发调试，上线前必须配置正式域名

---

## 📸 第四步：准备截图和功能描述

### 1. 截图要求
- 尺寸：750 x 1334 或更大
- 格式：PNG / JPG
- 数量：5张
- 内容：展示核心功能和玩法

### 2. 截图内容规划

#### 截图1：游戏主界面
**展示内容**：
- 横屏游戏画面
- 3D粒子特效
- 用户信息面板
- 功能入口按钮

**配文**：
```
横屏游戏模式
3D粒子特效震撼视觉
```

#### 截图2：战斗场景
**展示内容**：
- 战斗界面
- 敌人对立
- 技能释放效果
- 血条MP条

**配文**：
```
实时战斗系统
技能连招秒杀敌人
```

#### 截图3：剧情互动
**展示内容**：
- 剧情对话
- 选项分支
- 角色立绘

**配文**：
```
沉浸式剧情
你的选择决定命运
```

#### 截图4：社交系统
**展示内容**：
- 战盟界面
- 好友列表
- 竞技场排名

**配文**：
```
丰富社交玩法
战盟竞技好友互动
```

#### 截图5：养成系统
**展示内容**：
- 宠物系统
- 装备强化
- 战力提升

**配文**：
```
深度养成玩法
宠物进化战力飙升
```

---

## 📝 功能描述文案

### 简短描述（20字以内）
```
横屏3D粒子仙侠游戏
```

### 详细描述

```
《剑破苍穹》是一款横屏3D粒子仙侠互动剧情游戏，带你体验沉浸式修仙之旅。

【游戏特色】

🗡️ 横屏战斗体验
- 宽广的战斗视野，左右对立布局
- 技能连招系统，策略对决
- 战力碾压机制，一键扫荡关卡

✨ 3D粒子特效
- 8K级粒子效果，震撼视觉体验
- 4档画质调节，适配各种机型
- 点击屏幕触发炫酷特效

📖 沉浸式剧情
- 分支剧情选择，命运由你决定
- 多结局设定，重复可玩性高
- 角色养成与剧情深度结合

⚔️ 丰富玩法
- 竞技场PVP：实时对战，积分排名
- 战盟系统：组建战盟，争夺荣耀
- 宠物养成：喂养进化，战力加成
- 好友互动：赠送体力，共同冒险

🎮 便捷操作
- 横屏设计，单手可操作
- 自动战斗，解放双手
- 一键扫荡，快速升级

立即开始你的修仙之旅，剑破苍穹！
```

---

## ✅ 发布检查清单

### 上传前
- [ ] 代码无语法错误
- [ ] 所有页面可正常访问
- [ ] 图片资源已优化
- [ ] 无console.log调试代码
- [ ] API接口地址已配置

### 提交审核前
- [ ] 服务器域名已配置
- [ ] HTTPS证书有效
- [ ] 测试账号可用
- [ ] 截图已准备
- [ ] 功能描述已填写

### 审核期间
- [ ] 保持手机畅通
- [ ] 及时响应审核反馈
- [ ] 准备补充材料

---

## ⚠️ 常见问题

### Q1：审核被拒绝怎么办？
查看拒绝原因，修改后重新提交。常见原因：
- 功能不完整
- 内容违规
- 侵犯版权
- 缺少协议说明

### Q2：iOS端支付限制？
iOS端不能有虚拟支付入口，需要：
- 隐藏iOS端充值按钮
- 或改为「联系客服」

### Q3：审核需要多久？
通常1-7个工作日，可通过「审核进度」查询

### Q4：如何加急审核？
紧急情况可通过「审核加急」申请，需提供理由

---

## 📞 技术支持

- 微信开放社区：https://developers.weixin.qq.com/community/
- 小程序文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 客服邮箱：support@your-domain.com

祝发布顺利！🎉
