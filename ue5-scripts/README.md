# UE5 游戏系统脚本集

## 概述

本脚本集为"万古长夜"游戏提供完整的UE5游戏系统功能，包含50+个核心游戏系统，覆盖UI系统、游戏核心系统、动画系统、AI系统、高级系统等多个领域。

## 系统架构

```
/workspace/projects/ue5-scripts/
├── 第一组：UI系统 (13个文件)
│   ├── UE5_procedural_city.py           # 程序化城市生成
│   ├── UE5_notice_board_system.py       # 公告板系统
│   ├── UE5_billboard_system.py          # 广告牌系统
│   ├── UE5_decal_system.py              # 贴花系统
│   ├── UE5_damage_number_system.py      # 伤害数字系统
│   ├── UE5_health_bar_system.py         # 血条系统
│   ├── UE5_name_tag_system.py           # 名字标签系统
│   ├── UE5_radar_system.py              # 雷达系统
│   ├── UE5_quest_marker_system.py       # 任务标记系统
│   ├── UE5_action_bar_system.py         # 快捷栏系统
│   ├── UE5_target_lock_system.py        # 目标锁定系统
│   ├── UE5_revive_system.py             # 复活系统
│   └── UE5_mount_ui_system.py           # 坐骑界面系统
│
├── 第二组：游戏核心系统 (9个文件)
│   ├── UE5_game_core_systems.py         # 战斗+对话+任务+背包+技能树
│   ├── UE5_crafting_save_systems.py     # 制作系统+存档系统
│   ├── UE5_weather_day_night_systems.py # 天气系统+昼夜循环
│   ├── UE5_pet_mount_systems.py         # 宠物系统+坐骑系统
│   ├── UE5_shop_achievement_systems.py  # 商店系统+成就系统
│   ├── UE5_tutorial_minimap_systems.py  # 教程系统+小地图系统
│   ├── UE5_camera_loading_systems.py    # 相机震动+加载画面
│   ├── UE5_combo_buff_spawn_systems.py  # 连击+Buff+生成系统
│   └── UE5_level_up_procedural_character_systems.py # 升级+程序化角色生成
│
├── 第三组：动画与系统 (1个文件)
│   └── UE5_animation_world_systems.py   # 动画蒙太奇+世界分区+物理模拟+地形系统
│
├── 第四组：高级系统 (1个文件)
│   └── UE5_advanced_systems.py          # 数据资产+Actor组件+蓝图宏库+时间轴系统
│
├── 第五组：AI与游戏逻辑 (1个文件)
│   └── UE5_ai_game_logic_systems.py     # AI导航+行为树+环境特效+输入动作系统
│
├── 第六组：综合系统 (1个文件)
│   └── UE5_comprehensive_systems.py     # 游戏标签+对象池+委托+技能+流送体积+程序化植被+蓝图接口+C++集成
│
├── UE5_voice_chat_system.py             # 语音聊天系统
├── UE5_text_chat_system.py              # 文字聊天系统
├── UE5_emote_system.py                  # 表情动作系统
├── UE5_minimap_icon_system.py           # 小地图图标系统
├── UE5_custom_cursor_system.py          # 自定义光标系统
├── UE5_drag_drop_system.py              # 拖拽系统
├── UE5_tooltip_system.py                # 提示框系统
├── UE5_context_menu_system.py           # 右键菜单系统
├── UE5_combat_ui_systems.py             # 战斗UI系统合集
├── UE5_gameplay_systems.py              # 游戏玩法系统合集
├── UE5_world_ui_systems.py              # 世界UI系统合集
├── UE5_systems_manager.py               # 系统管理器
└── README.md                            # 本文档
```

## 系统分类详解

### 第一组：UI系统 (13个文件)

| 文件名 | 系统功能 | 主要特性 |
|--------|----------|----------|
| UE5_procedural_city.py | 程序化城市生成 | 建筑生成、道路网络、区域划分 |
| UE5_notice_board_system.py | 公告板系统 | 系统公告、活动公告、已读状态 |
| UE5_billboard_system.py | 广告牌系统 | 世界空间UI、面向摄像机、距离淡出 |
| UE5_decal_system.py | 贴花系统 | 脚印、血迹、魔法效果、自动过期 |
| UE5_damage_number_system.py | 伤害数字系统 | 飘字、暴击特效、伤害类型区分 |
| UE5_health_bar_system.py | 血条系统 | 玩家/敌人/BOSS血条、护盾显示 |
| UE5_name_tag_system.py | 名字标签系统 | 名称、称号、公会、等级显示 |
| UE5_radar_system.py | 雷达系统 | 小地图雷达、多种光点类型 |
| UE5_quest_marker_system.py | 任务标记系统 | 目标标记、进度追踪、路径导航 |
| UE5_action_bar_system.py | 快捷栏系统 | 技能/物品槽位、冷却管理 |
| UE5_target_lock_system.py | 目标锁定系统 | 目标选择、切换、最近目标查找 |
| UE5_revive_system.py | 复活系统 | 多种复活方式、经验惩罚、复活点管理 |
| UE5_mount_ui_system.py | 坐骑界面系统 | 坐骑管理、召唤/解散、体力系统 |

### 第二组：游戏核心系统 (9个文件)

| 文件名 | 包含系统 | 主要功能 |
|--------|----------|----------|
| UE5_game_core_systems.py | 战斗、对话、任务、背包、技能树 | 核心游戏机制 |
| UE5_crafting_save_systems.py | 制作系统、存档系统 | 物品制作、游戏存档 |
| UE5_weather_day_night_systems.py | 天气系统、昼夜循环 | 动态天气、时间系统 |
| UE5_pet_mount_systems.py | 宠物系统、坐骑系统 | 宠物养成、坐骑管理 |
| UE5_shop_achievement_systems.py | 商店系统、成就系统 | 物品购买、成就解锁 |
| UE5_tutorial_minimap_systems.py | 教程系统、小地图系统 | 新手引导、地图导航 |
| UE5_camera_loading_systems.py | 相机震动、加载画面 | 视觉效果、加载管理 |
| UE5_combo_buff_spawn_systems.py | 连击、Buff、生成系统 | 战斗机制、状态效果 |
| UE5_level_up_procedural_character_systems.py | 升级、程序化角色生成 | 角色成长、NPC生成 |

### 第三组：动画与系统 (1个文件)

| 文件名 | 包含系统 | 主要功能 |
|--------|----------|----------|
| UE5_animation_world_systems.py | 动画蒙太奇、世界分区、物理模拟、地形系统 | 动画管理、世界管理、物理引擎、地形生成 |

### 第四组：高级系统 (1个文件)

| 文件名 | 包含系统 | 主要功能 |
|--------|----------|----------|
| UE5_advanced_systems.py | 数据资产、Actor组件、蓝图宏库、时间轴系统 | 资产管理、组件系统、宏定义、时间轴动画 |

### 第五组：AI与游戏逻辑 (1个文件)

| 文件名 | 包含系统 | 主要功能 |
|--------|----------|----------|
| UE5_ai_game_logic_systems.py | AI导航、行为树、环境特效、输入动作系统 | AI寻路、行为决策、特效管理、输入处理 |

### 第六组：综合系统 (1个文件)

| 文件名 | 包含系统 | 主要功能 |
|--------|----------|----------|
| UE5_comprehensive_systems.py | 游戏标签、对象池、委托、技能、流送体积、程序化植被、蓝图接口、C++集成 | 标签系统、性能优化、事件系统、技能框架、关卡流送、植被生成、接口系统、语言集成 |

## 快速开始

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

## 单独使用某个系统

```python
# 导入特定系统
from UE5_game_core_systems import get_combat_system, get_dialogue_system
from UE5_crafting_save_systems import get_crafting_system, get_save_game_system

# 战斗系统
combat = get_combat_system()
combat.register_unit(unit)

# 对话系统
dialogue = get_dialogue_system()
dialogue.start_dialogue(user_id, dialogue_id)

# 制作系统
crafting = get_crafting_system()
crafting.start_crafting(user_id, recipe_id)

# 存档系统
save_game = get_save_game_system()
save_game.save(user_id, slot_id, game_data)
```

## 系统总数统计

| 组别 | 文件数 | 系统数 |
|------|--------|--------|
| 第一组：UI系统 | 13 | 13 |
| 第二组：游戏核心系统 | 9 | 18+ |
| 第三组：动画与系统 | 1 | 4 |
| 第四组：高级系统 | 1 | 4 |
| 第五组：AI与游戏逻辑 | 1 | 4 |
| 第六组：综合系统 | 1 | 8 |
| 基础系统 | 12 | 12+ |
| **总计** | **38+** | **63+** |

## 与前端集成

这些Python脚本设计为后端服务，可以通过以下方式与前端React Native应用集成：

### REST API 集成

```typescript
// 前端调用示例
const response = await fetch(`${EXPO_PUBLIC_BACKEND_BASE_URL}/api/v1/skill/cast`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'player1',
    skill_id: 'fireball',
    current_mana: 100
  })
});
```

### WebSocket 实时通信

```typescript
// 前端WebSocket连接
const ws = new WebSocket(`${WS_URL}/game`);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 处理游戏数据
};
```

## 注意事项

1. **性能优化**: 所有系统都有数量限制和自动清理机制
2. **线程安全**: 使用全局单例模式，确保线程安全
3. **事件驱动**: 支持事件处理器注册，方便扩展
4. **模块化设计**: 每个系统独立，可单独使用
5. **类型安全**: 使用Python类型注解，提高代码质量

## 未来扩展

1. 添加数据库持久化
2. 实现WebSocket服务器
3. 添加REST API路由
4. 集成到游戏主循环
5. 添加单元测试
6. 性能优化和压力测试
7. 多语言支持

## 版本信息

- **版本**: 2.0.0
- **创建日期**: 2025-01-11
- **更新日期**: 2025-01-11
- **适用于**: 万古长夜 - 国风粒子卡牌游戏
- **系统总数**: 63+个游戏系统
- **文件总数**: 38+个Python文件

---

**开发者**: 万古长夜开发团队
**联系方式**: support@wangu-game.com
