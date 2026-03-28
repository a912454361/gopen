#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 快捷栏系统
支持技能/物品快捷栏

功能：
- 技能/物品槽位
- 冷却时间管理
- 快捷键绑定
- 数量消耗
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum


class ActionBarSlotType(Enum):
    SKILL = "skill"
    ITEM = "item"
    EMOTE = "emote"
    MACRO = "macro"
    EMPTY = "empty"


@dataclass
class ActionBarSlot:
    """快捷栏槽位"""
    slot_id: int
    slot_type: ActionBarSlotType = ActionBarSlotType.EMPTY
    item_id: Optional[str] = None
    icon: Optional[str] = None
    name: str = ""
    cooldown: float = 0.0
    max_cooldown: float = 0.0
    quantity: int = 0
    keybind: Optional[str] = None
    enabled: bool = True


class UE5ActionBarSystem:
    """UE5 快捷栏系统"""
    
    def __init__(self):
        self.user_action_bars: Dict[str, List[ActionBarSlot]] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.default_slots = 12
        self.max_bars = 5
    
    def create_action_bar(self, user_id: str, slots: int = None) -> List[ActionBarSlot]:
        """创建快捷栏"""
        if slots is None:
            slots = self.default_slots
        
        action_bar = []
        for i in range(slots):
            keybind = str((i + 1) % 10) if i < 10 else None
            action_bar.append(ActionBarSlot(slot_id=i, keybind=keybind))
        
        self.user_action_bars[user_id] = action_bar
        return action_bar
    
    def set_slot(self, user_id: str, slot_id: int, slot_type: ActionBarSlotType,
                 item_id: str, icon: str, name: str, cooldown: float = 0.0,
                 quantity: int = 0) -> bool:
        """设置槽位"""
        if user_id not in self.user_action_bars:
            self.create_action_bar(user_id)
        
        action_bar = self.user_action_bars[user_id]
        
        if slot_id < 0 or slot_id >= len(action_bar):
            return False
        
        action_bar[slot_id] = ActionBarSlot(
            slot_id=slot_id,
            slot_type=slot_type,
            item_id=item_id,
            icon=icon,
            name=name,
            max_cooldown=cooldown,
            quantity=quantity,
            keybind=action_bar[slot_id].keybind
        )
        
        return True
    
    def clear_slot(self, user_id: str, slot_id: int) -> bool:
        """清空槽位"""
        if user_id not in self.user_action_bars:
            return False
        
        action_bar = self.user_action_bars[user_id]
        
        if slot_id < 0 or slot_id >= len(action_bar):
            return False
        
        action_bar[slot_id] = ActionBarSlot(slot_id=slot_id, keybind=action_bar[slot_id].keybind)
        return True
    
    def use_slot(self, user_id: str, slot_id: int) -> Dict:
        """使用槽位"""
        if user_id not in self.user_action_bars:
            return {"success": False, "error": "No action bar"}
        
        action_bar = self.user_action_bars[user_id]
        
        if slot_id < 0 or slot_id >= len(action_bar):
            return {"success": False, "error": "Invalid slot"}
        
        slot = action_bar[slot_id]
        
        if slot.slot_type == ActionBarSlotType.EMPTY:
            return {"success": False, "error": "Empty slot"}
        
        if not slot.enabled:
            return {"success": False, "error": "Slot disabled"}
        
        if slot.cooldown > 0:
            return {"success": False, "error": "On cooldown", "remaining": slot.cooldown}
        
        # 触发冷却
        if slot.max_cooldown > 0:
            slot.cooldown = slot.max_cooldown
        
        # 消耗数量
        if slot.quantity > 0:
            slot.quantity -= 1
            if slot.quantity <= 0:
                self.clear_slot(user_id, slot_id)
        
        return {
            "success": True,
            "slot_type": slot.slot_type.value,
            "item_id": slot.item_id
        }
    
    def update_cooldowns(self, delta_time: float):
        """更新冷却"""
        for action_bar in self.user_action_bars.values():
            for slot in action_bar:
                if slot.cooldown > 0:
                    slot.cooldown = max(0, slot.cooldown - delta_time)
    
    def get_action_bar(self, user_id: str) -> List[Dict]:
        """获取快捷栏"""
        if user_id not in self.user_action_bars:
            self.create_action_bar(user_id)
        
        return [{
            "slot_id": slot.slot_id,
            "slot_type": slot.slot_type.value,
            "item_id": slot.item_id,
            "icon": slot.icon,
            "name": slot.name,
            "cooldown": slot.cooldown,
            "max_cooldown": slot.max_cooldown,
            "quantity": slot.quantity,
            "keybind": slot.keybind,
            "enabled": slot.enabled
        } for slot in self.user_action_bars[user_id]]
    
    def set_keybind(self, user_id: str, slot_id: int, key: str) -> bool:
        """设置快捷键"""
        if user_id not in self.user_action_bars:
            return False
        
        action_bar = self.user_action_bars[user_id]
        
        if slot_id < 0 or slot_id >= len(action_bar):
            return False
        
        action_bar[slot_id].keybind = key
        return True


def get_action_bar_system() -> UE5ActionBarSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5ActionBarSystem()
    return _instance


if __name__ == "__main__":
    system = get_action_bar_system()
    system.set_slot("player1", 0, ActionBarSlotType.SKILL, "fireball", "fireball_icon.png", "火球术", 5.0)
    print("Action bar:", system.get_action_bar("player1"))
