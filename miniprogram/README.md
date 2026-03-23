# 剑破苍穹 - 国风燃爆互动剧情游戏

## 🎮 游戏简介

《剑破苍穹》是一款国风玄幻互动剧情游戏，玩家将扮演少年云澈，获得剑魂传承，踏上修仙之路。

### 游戏特色

- **沉浸式剧情**：10章完整剧情，多个分支选择
- **战斗系统**：回合制战斗，技能组合
- **多结局**：4种不同结局，取决于你的选择
- **成就系统**：18个成就等你解锁
- **属性养成**：勇气、智慧、力量等多种属性

## 📱 使用方法

### 1. 导入微信开发者工具

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具
3. 选择「导入项目」
4. 选择 `miniprogram` 文件夹
5. 填写你的 AppID（或使用测试号）
6. 点击「导入」

### 2. 预览与调试

- 点击工具栏的「编译」按钮预览游戏
- 点击「预览」生成二维码，用微信扫码体验
- 点击「真机调试」在手机上调试

### 3. 上传发布

1. 点击工具栏的「上传」按钮
2. 填写版本号和项目备注
3. 登录微信公众平台提交审核

## 📁 项目结构

```
miniprogram/
├── app.js              # 应用入口
├── app.json            # 应用配置
├── app.wxss            # 全局样式
├── project.config.json # 项目配置
├── sitemap.json        # 站点地图
│
├── data/
│   └── story.js        # 剧情数据（所有章节、战斗、结局）
│
├── pages/
│   ├── index/          # 首页（游戏入口）
│   ├── game/           # 游戏主页面（剧情、选择、战斗）
│   ├── ending/         # 结局页面
│   ├── achievements/   # 成就页面
│   └── stats/          # 统计页面
│
└── assets/             # 资源文件
    └── icons/          # Tab栏图标
```

## 🎯 游戏流程

```
开始游戏
    │
    ▼
第一章：剑魂觉醒 ──→ 选择追随/观察
    │
    ▼
第二章：初入江湖 ──→ 首次战斗
    │
    ▼
第三章：妖魔现身 ──→ Boss战：三头妖蛇
    │
    ▼
第四章：剑道争锋 ──→ 剑道大会
    │
    ▼
第五章：情劫难渡 ──→ 感情抉择
    │
    ▼
第六章：魔宗阴谋 ──→ 潜入/召集盟友
    │
    ▼
第七章：命运抉择 ──→ 关键抉择点
    │
    ├─→ 献祭自己 → 【悲剧结局】
    ├─→ 决战魔帝 → 胜利 → 【完美结局】
    │           └→ 失败 → 【黑暗结局】
    └─→ 特定条件 → 【隐藏结局】
```

## 🔧 自定义修改

### 添加新章节

编辑 `data/story.js`，添加新的节点：

```javascript
chapter8_start: {
  id: 'chapter8_start',
  chapter: 8,
  title: '章节标题',
  description: '剧情描述...',
  video: '视频URL',
  type: 'story',  // story / battle / ending
  choices: [
    { text: '选项文本', next: '下一节点ID', effects: { courage: 5 } }
  ]
}
```

### 添加战斗节点

```javascript
boss_battle: {
  id: 'boss_battle',
  chapter: 8,
  title: 'Boss战',
  type: 'battle',
  enemy: {
    name: 'Boss名称',
    hp: 500,
    attack: 30,
    defense: 15,
    skills: ['技能1', '技能2']
  },
  rewards: {
    win: { exp: 100, gold: 500, next: 'victory_node' },
    lose: { next: 'defeat_node' }
  }
}
```

### 添加成就

在 `data/story.js` 的 `achievements` 对象中添加：

```javascript
new_achievement: {
  id: 'new_achievement',
  name: '成就名称',
  desc: '成就描述',
  icon: '🏆'
}
```

## 🎨 视频资源

游戏使用占位图片作为视频替代。你可以：

1. **使用真实视频**：将 `video` 字段替换为实际视频URL
2. **生成专属视频**：使用 Seedance API 生成场景视频
3. **使用现有动漫片段**：替换为已有的视频资源

## 📊 数据存储

游戏数据存储在微信小程序本地存储中：
- `playerId` - 玩家唯一ID
- `gameSave` - 游戏存档（JSON格式）

如需云端存储，可以接入微信云开发。

## 🔗 与主项目联动

本小程序是 G open 智能创作助手的衍生项目，可以：

1. 从主App生成视频后，将URL更新到 `data/story.js`
2. 使用后端API管理剧情内容
3. 实现多端数据同步

## 📜 License

MIT License

---

**开发者**：G open 智能创作助手  
**版本**：1.0.0  
**更新日期**：2024年
