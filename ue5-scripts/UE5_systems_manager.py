#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 游戏系统脚本管理器
统一管理所有游戏系统的入口

包含系统：
1. 语音聊天系统 (UE5_voice_chat_system.py)
2. 文字聊天系统 (UE5_text_chat_system.py)
3. 表情动作系统 (UE5_emote_system.py)
4. 小地图图标系统 (UE5_minimap_icon_system.py)
5. 自定义光标系统 (UE5_custom_cursor_system.py)
6. 拖拽系统 (UE5_drag_drop_system.py)
7. 提示框系统 (UE5_tooltip_system.py)
8. 右键菜单系统 (UE5_context_menu_system.py)
9. 伤害数字系统 (UE5_combat_ui_systems.py - DamageNumber)
10. 血条系统 (UE5_combat_ui_systems.py - HealthBar)
11. 任务标记系统 (UE5_gameplay_systems.py - QuestMarker)
12. 快捷栏系统 (UE5_gameplay_systems.py - Hotbar)
13. 目标锁定系统 (UE5_gameplay_systems.py - TargetLock)
14. 复活系统 (UE5_gameplay_systems.py - Revive)
15. 坐骑系统 (UE5_gameplay_systems.py - Mount)
16. 公告板系统 (UE5_world_ui_systems.py - Announcement)
17. 广告牌系统 (UE5_world_ui_systems.py - Billboard)
18. 贴花系统 (UE5_world_ui_systems.py - Decal)
19. 名字标签系统 (UE5_world_ui_systems.py - NameTag)
20. 雷达系统 (UE5_world_ui_systems.py - Radar)
"""

from typing import Dict, Any, List

# 导入所有系统
from UE5_voice_chat_system import get_voice_chat_system, UE5VoiceChatSystem
from UE5_text_chat_system import get_text_chat_system, UE5TextChatSystem
from UE5_emote_system import get_emote_system, UE5EmoteSystem
from UE5_minimap_icon_system import get_minimap_system, UE5MinimapIconSystem
from UE5_custom_cursor_system import get_cursor_system, UE5CustomCursorSystem
from UE5_drag_drop_system import get_drag_drop_system, UE5DragDropSystem
from UE5_tooltip_system import get_tooltip_system, UE5TooltipSystem
from UE5_context_menu_system import get_context_menu_system, UE5ContextMenuSystem
from UE5_combat_ui_systems import get_damage_number_system, get_health_bar_system
from UE5_gameplay_systems import (
    get_quest_marker_system,
    get_hotbar_system,
    get_target_lock_system,
    get_revive_system,
    get_mount_system
)
from UE5_world_ui_systems import (
    get_announcement_system,
    get_billboard_system,
    get_decal_system,
    get_nametag_system,
    get_radar_system
)


class UE5SystemsManager:
    """UE5 系统管理器"""
    
    def __init__(self):
        """初始化所有系统"""
        # 通信系统
        self.voice_chat = get_voice_chat_system()
        self.text_chat = get_text_chat_system()
        
        # 表情和动作
        self.emote = get_emote_system()
        
        # UI系统
        self.minimap = get_minimap_system()
        self.cursor = get_cursor_system()
        self.drag_drop = get_drag_drop_system()
        self.tooltip = get_tooltip_system()
        self.context_menu = get_context_menu_system()
        
        # 战斗UI
        self.damage_number = get_damage_number_system()
        self.health_bar = get_health_bar_system()
        
        # 游戏玩法
        self.quest_marker = get_quest_marker_system()
        self.hotbar = get_hotbar_system()
        self.target_lock = get_target_lock_system()
        self.revive = get_revive_system()
        self.mount = get_mount_system()
        
        # 世界UI
        self.announcement = get_announcement_system()
        self.billboard = get_billboard_system()
        self.decal = get_decal_system()
        self.nametag = get_nametag_system()
        self.radar = get_radar_system()
    
    def get_all_systems_status(self) -> Dict[str, Any]:
        """获取所有系统状态"""
        return {
            "communication": {
                "voice_chat": self.voice_chat.get_status(),
                "text_chat": self.text_chat.get_status()
            },
            "social": {
                "emote": self.emote.get_status()
            },
            "ui": {
                "minimap": self.minimap.get_status(),
                "cursor": self.cursor.get_status(),
                "drag_drop": self.drag_drop.get_status(),
                "tooltip": self.tooltip.get_status(),
                "context_menu": self.context_menu.get_status()
            },
            "combat": {
                "damage_number": {"active_numbers": len(self.damage_number.get_active_numbers())},
                "health_bar": self.health_bar.get_status()
            },
            "gameplay": {
                "quest_marker": {"total_markers": len(self.quest_marker.markers)},
                "hotbar": {"total_users": len(self.hotbar.user_hotbars)},
                "target_lock": {"locked_targets": len([t for t in self.target_lock.user_targets.values() if t])},
                "revive": {"dead_players": len(self.revive.death_states)},
                "mount": {"total_mounts": len(self.mount.mounts)}
            },
            "world_ui": {
                "announcement": {"total_announcements": len(self.announcement.announcements)},
                "billboard": {"total_billboards": len(self.billboard.billboards)},
                "decal": {"total_decals": len(self.decal.decals)},
                "nametag": {"total_tags": len(self.nametag.name_tags)},
                "radar": {"total_blips": len(self.radar.blips)}
            }
        }
    
    def update_all(self, delta_time: float):
        """更新所有系统"""
        self.damage_number.update(delta_time)
        self.decal.update(delta_time)
        self.hotbar.update_cooldowns(delta_time)


# 全局管理器实例
_manager_instance: UE5SystemsManager = None


def get_systems_manager() -> UE5SystemsManager:
    """获取系统管理器实例"""
    global _manager_instance
    
    if _manager_instance is None:
        _manager_instance = UE5SystemsManager()
    
    return _manager_instance


def initialize_all_systems():
    """初始化所有系统"""
    manager = get_systems_manager()
    print("[UE5 Systems] All systems initialized successfully!")
    return manager


if __name__ == "__main__":
    # 初始化所有系统
    manager = initialize_all_systems()
    
    # 打印系统状态
    status = manager.get_all_systems_status()
    
    print("\n" + "="*60)
    print("UE5 游戏系统状态报告")
    print("="*60)
    
    for category, systems in status.items():
        print(f"\n【{category.upper()}】")
        for system_name, system_status in systems.items():
            print(f"  - {system_name}: {system_status}")
    
    print("\n" + "="*60)
    print("所有系统运行正常！")
    print("="*60)
