# 《剑破苍穹》小程序发布指南

## 🎮 游戏特点

### 横屏游戏体验
本游戏采用横屏(Landscape)模式，提供更沉浸的游戏体验：
- 左右分栏布局，游戏画面与信息面板分离
- 战斗场景更宽广，视觉冲击更强
- 操作按钮更集中，单手可操作
- 符合主流游戏习惯

### 配置方法
```json
// app.json
{
  "window": {
    "pageOrientation": "landscape"
  }
}
```

## 📋 发布前检查清单

### 1. 代码准备
- [ ] 所有页面功能正常
- [ ] 接口调用配置正确
- [ ] 图片资源已压缩
- [ ] 代码已通过ESLint检查
- [ ] 无console.log调试代码

### 2. 配置文件检查
- [ ] `app.json` 页面路径完整
- [ ] `project.config.json` 配置正确
- [ ] 服务器域名已配置

### 3. 隐私协议
- [ ] 用户协议已准备
- [ ] 隐私政策已准备
- [ ] 收集信息说明已填写

---

## 🚀 发布流程

### 第一步：微信开发者工具上传

1. 打开微信开发者工具
2. 导入项目目录 `miniprogram/`
3. 点击右上角「上传」按钮
4. 填写版本号和备注：
   ```
   版本号: 1.0.0
   备注: 首发版本 - 3D粒子互动剧情游戏
   ```

### 第二步：微信公众平台提交审核

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「管理」→「版本管理」
3. 点击「提交审核」
4. 填写审核信息：

#### 功能页面类目选择
```
一级类目: 游戏
二级类目: 休闲游戏
```

#### 功能描述
```
《剑破苍穹》是一款仙侠风格的3D粒子互动剧情游戏。

核心功能：
1. 3D粒子特效战斗系统
2. 分支剧情选择
3. 角色养成（等级、装备、宠物）
4. 社交互动（好友、战盟）
5. 竞技场PVP
6. 关卡挑战与扫荡

游戏特色：
- 8K级粒子效果，绚丽的视觉体验
- 丰富的剧情分支，沉浸式游戏体验
- 完善的充值和VIP系统
- 云端存档，多端同步
```

#### 截图要求
- 准备5张游戏截图
- 尺寸: 750×1334 或更大
- 内容：主页、战斗、剧情、社交、个人中心

### 第三步：审核注意事项

#### 可能被拒绝的原因
1. **虚拟支付问题**
   - 解决方案：iOS端隐藏充值入口，仅保留提示文字
   
2. **内容审核**
   - 避免敏感词汇（杀、血、暴等）
   - 角色服装不能过于暴露

3. **功能不完整**
   - 确保所有按钮可点击
   - 确保所有页面可访问

4. **缺少用户协议**
   - 必须在登录前展示用户协议

---

## 📱 发布后运营

### 数据监控
在微信公众平台查看：
- 日活用户数
- 留存率
- 充值金额
- 分享次数

### 版本更新
```bash
# 更新版本号
# project.config.json
"miniprogramRoot": "miniprogram/",
"version": "1.0.1"

# 上传新版本
# 微信开发者工具 → 上传
```

### 紧急修复
1. 发现严重Bug
2. 在微信公众平台「小程序管理」→「版本回退」
3. 修复后重新提交审核

---

## 🎮 接入微信云开发（可选）

### 1. 开通云开发
```javascript
// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上的基础库');
      return;
    }
    
    wx.cloud.init({
      env: 'your-env-id',
      traceUser: true
    });
  }
});
```

### 2. 云函数示例
```javascript
// cloudfunctions/getUserInfo/index.js
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID
  };
};
```

### 3. 云数据库
```javascript
// 存储用户数据
const db = wx.cloud.database();
db.collection('users').add({
  data: {
    uid: 10000001,
    nickname: '剑圣',
    level: 100,
    power: 50000
  }
});
```

---

## 🔧 服务器配置

### 域名配置
在微信公众平台配置服务器域名：

```
request合法域名:
https://your-domain.com

socket合法域名:
wss://your-domain.com

uploadFile合法域名:
https://your-domain.com

downloadFile合法域名:
https://your-domain.com
```

### HTTPS证书
确保服务器已配置SSL证书：
```bash
# 使用 Let's Encrypt 免费证书
certbot --nginx -d your-domain.com
```

---

## 📊 性能优化建议

### 1. 图片优化
- 使用WebP格式
- 压缩图片质量
- 使用CDN加速

### 2. 代码优化
- 分包加载
- 按需引入组件
- 减少setData调用频率

### 3. 网络优化
- 接口合并
- 数据缓存
- 骨架屏加载

---

## 🎯 推广方案

### 1. 社交分享
- 朋友圈海报
- 好友邀请奖励
- 战盟招募分享

### 2. 活动运营
- 新手七日登录奖励
- 首充双倍
- 节日活动

### 3. KOL合作
- 游戏主播试玩
- 小游戏评测
- 社区攻略分享

---

## 📞 技术支持

### 常见问题
1. **白屏问题**
   - 检查基础库版本
   - 清除缓存重试

2. **网络请求失败**
   - 检查域名配置
   - 检查HTTPS证书

3. **支付失败**
   - 检查商户号配置
   - 检查签名算法

### 联系方式
- 微信开放社区: https://developers.weixin.qq.com/community/
- 客服邮箱: support@your-domain.com

---

## ✅ 发布检查清单

- [ ] 代码已上传
- [ ] 审核已提交
- [ ] 截图已上传
- [ ] 功能描述已填写
- [ ] 用户协议已配置
- [ ] 隐私政策已配置
- [ ] 服务器域名已配置
- [ ] HTTPS证书已配置

---

祝发布顺利！🎮
