# UE5 游戏系统脚本集

## 概述

本脚本集为"万古长夜"游戏提供完整的UE5游戏系统功能，包含20个核心游戏系统，支持语音聊天、文字聊天、表情动作、战斗UI、任务系统、坐骑系统等。

## 系统架构

```
/workspace/projects/ue5-scripts/
├── UE5_voice_chat_system.py       # 语音聊天系统
├── UE5_text_chat_system.py        # 文字聊天系统
├── UE5_emote_system.py            # 表情动作系统
├── UE5_minimap_icon_system.py     # 小地图图标系统
├── UE5_custom_cursor_system.py    # 自定义光标系统
├── UE5_drag_drop_system.py        # 拖拽系统
├── UE5_tooltip_system.py          # 提示框系统
├── UE5_context_menu_system.py     # 右键菜单系统
├── UE5_combat_ui_systems.py       # 伤害数字+血条系统
├── UE5_gameplay_systems.py        # 任务标记+快捷栏+目标锁定+复活+坐骑系统
├── UE5_world_ui_systems.py        # 公告板+广告牌+贴花+名字标签+雷达系统
├── UE5_systems_manager.py         # 系统管理器（统一入口）
└── README.md                      # 本文档
```

## 系统列表

### 1. 通信系统

#### 语音聊天系统 (UE5_voice_chat_system.py)
- **功能**: 实时语音通话、语音频道管理、语音识别转文字
- **特性**:
  - 多种语音频道类型（全局、队伍、近距离、私聊）
  - 3D空间音频
  - 语音识别（ASR）
  - 降噪和回声消除
- **使用示例**:
```python
from UE5_voice_chat_system import get_voice_chat_system

system = get_voice_chat_system()
system.register_user("player1", "剑客小明")
system.join_channel("player1", "global")
system.start_speaking("player1")
```

#### 文字聊天系统 (UE5_text_chat_system.py)
- **功能**: 多频道聊天、富文本支持、敏感词过滤
- **特性**:
  - 世界/队伍/公会/私聊频道
  - 消息撤回
  - @提及功能
  - 聊天命令系统
- **使用示例**:
```python
from UE5_text_chat_system import get_text_chat_system

system = get_text_chat_system()
system.register_user("player1", "剑客小明", level=50)
system.send_message("player1", "world", "大家好！")
```

### 2. 社交系统

#### 表情动作系统 (UE5_emote_system.py)
- **功能**: 角色表情、动作动画、社交交互
- **特性**:
  - 预设表情动作库（问候、情绪、舞蹈、社交等）
  - 自定义表情
  - 快捷键绑定
  - 交互动作（拥抱、击掌等）
- **使用示例**:
```python
from UE5_emote_system import get_emote_system

system = get_emote_system()
system.register_user("player1", is_premium=True)
system.play_emote("player1", "wave")
system.play_emote("player1", "dance1")
```

### 3. UI系统

#### 小地图图标系统 (UE5_minimap_icon_system.py)
- **功能**: 动态图标、追踪标记、区域显示
- **特性**:
  - 多种图标类型（玩家、敌人、NPC、任务等）
  - 图标追踪
  - 区域范围显示
  - 危险区域/安全区域

#### 自定义光标系统 (UE5_custom_cursor_system.py)
- **功能**: 多种光标样式、动态效果
- **特性**:
  - 预设光标样式（默认、攻击、拾取、交互等）
  - 悬停状态反馈
  - 光标动画

#### 拖拽系统 (UE5_drag_drop_system.py)
- **功能**: 物品拖拽、技能拖拽、UI元素拖拽
- **特性**:
  - 物品拖拽
  - 技能拖拽到快捷栏
  - 堆叠分割和合并
  - 拖拽预览

#### 提示框系统 (UE5_tooltip_system.py)
- **功能**: 物品提示、技能提示、状态提示
- **特性**:
  - 物品/技能/状态提示框
  - 富文本支持
  - 延迟显示
  - 动态位置

#### 右键菜单系统 (UE5_context_menu_system.py)
- **功能**: 动态菜单项、子菜单、快捷键
- **特性**:
  - 动态菜单项
  - 子菜单支持
  - 快捷键绑定
  - 分组菜单

### 4. 战斗UI系统

#### 伤害数字系统 (UE5_combat_ui_systems.py - DamageNumber)
- **功能**: 伤害飘字、治疗数字、暴击特效
- **特性**:
  - 伤害/治疗数字飘字
  - 暴击放大效果
  - 物理/魔法/真实伤害区分
  - 阻挡/吸收显示

#### 血条系统 (UE5_combat_ui_systems.py - HealthBar)
- **功能**: 血条显示、护盾显示、状态效果
- **特性**:
  - 玩家/敌人/BOSS血条
  - 护盾显示
  - 状态效果图标
  - 根据类型自动调整颜色和大小

### 5. 游戏玩法系统

#### 任务标记系统 (UE5_gameplay_systems.py - QuestMarker)
- **功能**: 任务目标标记、追踪
- **特性**:
  - 多种标记类型（击杀、收集、探索等）
  - 进度追踪
  - 路径点导航
  - 最大追踪数量限制

#### 快捷栏系统 (UE5_gameplay_systems.py - Hotbar)
- **功能**: 技能/物品快捷栏
- **特性**:
  - 技能/物品槽位
  - 冷却时间管理
  - 快捷键绑定
  - 数量消耗

#### 目标锁定系统 (UE5_gameplay_systems.py - TargetLock)
- **功能**: 目标选择、切换
- **特性**:
  - 目标锁定/解锁
  - 目标切换
  - 最近目标查找
  - 目标信息显示

#### 复活系统 (UE5_gameplay_systems.py - Revive)
- **功能**: 死亡处理、复活选项
- **特性**:
  - 多种复活方式（就地、城镇、检查点等）
  - 经验/金币惩罚
  - 复活计时器
  - 复活点管理

#### 坐骑系统 (UE5_gameplay_systems.py - Mount)
- **功能**: 坐骑管理、召唤/解散
- **特性**:
  - 地面/飞行/水域坐骑
  - 坐骑速度加成
  - 体力系统
  - 坐骑技能

### 6. 世界UI系统

#### 公告板系统 (UE5_world_ui_systems.py - Announcement)
- **功能**: 系统公告、活动公告
- **特性**:
  - 多种公告类型
  - 置顶公告
  - 已读/未读状态
  - 自动过期

#### 广告牌系统 (UE5_world_ui_systems.py - Billboard)
- **功能**: 世界空间UI显示
- **特性**:
  - 文本/图像/视频广告牌
  - 面向摄像机
  - 距离淡出
  - 交互式广告牌

#### 贴花系统 (UE5_world_ui_systems.py - Decal)
- **功能**: 地面贴花、特效贴花
- **特性**:
  - 多种贴花类型（脚印、血迹、魔法效果等）
  - 自动过期
  - 淡出效果
  - 最大数量限制

#### 名字标签系统 (UE5_world_ui_systems.py - NameTag)
- **功能**: 玩家/怪物名字显示
- **特性**:
  - 显示名称、称号、公会
  - 等级显示
  - 距离缩放
  - 背景透明度

#### 雷达系统 (UE5_world_ui_systems.py - Radar)
- **功能**: 小地图雷达显示
- **特性**:
  - 多种光点类型
  - 距离显示
  - 脉冲效果
  - 可配置显示选项

## 使用方法

### 快速开始

```python
# 导入系统管理器
from UE5_systems_manager import get_systems_manager

# 初始化所有系统
manager = get_systems_manager()

# 获取特定系统
voice_chat = manager.voice_chat
text_chat = manager.text_chat
emote = manager.emote

# 使用系统
voice_chat.register_user("player1", "玩家1")
text_chat.send_message("player1", "world", "你好！")
emote.play_emote("player1", "wave")

# 更新所有系统（游戏循环中调用）
manager.update_all(delta_time=0.016)

# 获取系统状态
status = manager.get_all_systems_status()
print(status)
```

### 单独使用某个系统

```python
from UE5_voice_chat_system import get_voice_chat_system

system = get_voice_chat_system()
system.register_user("player1", "剑客小明")
system.join_channel("player1", "global")
```

## 与前端集成

这些Python脚本设计为后端服务，可以通过以下方式与前端React Native应用集成：

### REST API 集成

```typescript
// 前端调用示例
const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/voice/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'player1',
    channel_id: 'global'
  })
});
```

### WebSocket 实时通信

```typescript
// 前端WebSocket连接
const ws = new WebSocket(`${WS_URL}/voice`);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 处理语音数据
};
```

## 注意事项

1. **性能优化**: 所有系统都有数量限制和自动清理机制
2. **线程安全**: 使用全局单例模式，确保线程安全
3. **事件驱动**: 支持事件处理器注册，方便扩展
4. **模块化设计**: 每个系统独立，可单独使用

## 未来扩展

1. 添加数据库持久化
2. 实现WebSocket服务器
3. 添加REST API路由
4. 集成到游戏主循环
5. 添加单元测试

## 版本信息

- **版本**: 1.0.0
- **创建日期**: 2025-01-11
- **适用于**: 万古长夜 - 国风粒子卡牌游戏

---

**开发者**: 万古长夜开发团队
**联系方式**: support@wangu-game.com
