#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 坐骑界面系统
支持坐骑管理、召唤/解散

功能：
- 地面/飞行/水域坐骑
- 坐骑速度加成
- 体力系统
- 坐骑技能
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any, List, Set, Callable
from dataclasses import dataclass, field
from enum import Enum


class MountType(Enum):
    GROUND = "ground"
    FLYING = "flying"
    WATER = "water"
    SPECIAL = "special"


@dataclass
class Mount:
    """坐骑"""
    mount_id: str
    name: str
    mount_type: MountType
    speed: float
    icon: str
    model: str
    description: str = ""
    level_required: int = 1
    unlocked: bool = False
    premium: bool = False
    abilities: List[str] = field(default_factory=list)
    stats: Dict[str, float] = field(default_factory=dict)


@dataclass
class MountState:
    """坐骑状态"""
    user_id: str
    current_mount: Optional[str] = None
    is_mounted: bool = False
    mount_time: Optional[float] = None
    stamina: float = 100.0
    max_stamina: float = 100.0


class UE5MountUISystem:
    """UE5 坐骑界面系统"""
    
    def __init__(self):
        self.mounts: Dict[str, Mount] = {}
        self.user_mounts: Dict[str, Set[str]] = {}
        self.user_states: Dict[str, MountState] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.mount_duration = 2.0
        self.stamina_drain_rate = 1.0
        self.stamina_regen_rate = 5.0
        self._init_default_mounts()
    
    def _init_default_mounts(self):
        """初始化默认坐骑"""
        default_mounts = [
            Mount("horse_basic", "普通马匹", MountType.GROUND, 1.5, "horse_icon.png", "horse_model",
                  "一匹普通的马", level_required=10),
            Mount("horse_war", "战马", MountType.GROUND, 1.8, "war_horse_icon.png", "war_horse_model",
                  "训练有素的战马", level_required=30, abilities=["charge", "trample"]),
            Mount("tiger", "猛虎", MountType.GROUND, 2.0, "tiger_icon.png", "tiger_model",
                  "凶猛的坐骑虎", level_required=40, premium=True),
            Mount("phoenix", "凤凰", MountType.FLYING, 2.5, "phoenix_icon.png", "phoenix_model",
                  "传说中的飞行坐骑", level_required=60, premium=True, abilities=["fly", "dive"]),
            Mount("dragon", "神龙", MountType.SPECIAL, 3.0, "dragon_icon.png", "dragon_model",
                  "稀有神龙坐骑", level_required=80, premium=True, abilities=["fly", "breathe_fire"])
        ]
        
        for mount in default_mounts:
            self.mounts[mount.mount_id] = mount
    
    def unlock_mount(self, user_id: str, mount_id: str) -> bool:
        """解锁坐骑"""
        if mount_id not in self.mounts:
            return False
        
        if user_id not in self.user_mounts:
            self.user_mounts[user_id] = set()
        
        self.user_mounts[user_id].add(mount_id)
        return True
    
    def mount(self, user_id: str, mount_id: str) -> Dict:
        """上坐骑"""
        if mount_id not in self.mounts:
            return {"success": False, "error": "Mount not found"}
        
        if user_id not in self.user_mounts or mount_id not in self.user_mounts[user_id]:
            return {"success": False, "error": "Mount not unlocked"}
        
        if user_id not in self.user_states:
            self.user_states[user_id] = MountState(user_id=user_id)
        
        state = self.user_states[user_id]
        
        if state.is_mounted:
            return {"success": False, "error": "Already mounted"}
        
        mount = self.mounts[mount_id]
        state.current_mount = mount_id
        state.is_mounted = True
        state.mount_time = time.time()
        
        return {
            "success": True,
            "mount_id": mount_id,
            "mount_name": mount.name,
            "speed": mount.speed,
            "mount_type": mount.mount_type.value
        }
    
    def dismount(self, user_id: str) -> Dict:
        """下坐骑"""
        if user_id not in self.user_states:
            return {"success": False, "error": "No mount state"}
        
        state = self.user_states[user_id]
        
        if not state.is_mounted:
            return {"success": False, "error": "Not mounted"}
        
        mount_id = state.current_mount
        state.is_mounted = False
        state.current_mount = None
        state.mount_time = None
        
        return {"success": True, "mount_id": mount_id}
    
    def update_stamina(self, user_id: str, delta_time: float, moving: bool = False):
        """更新体力"""
        if user_id not in self.user_states:
            return
        
        state = self.user_states[user_id]
        
        if not state.is_mounted:
            return
        
        if moving:
            state.stamina = max(0, state.stamina - self.stamina_drain_rate * delta_time)
        else:
            state.stamina = min(state.max_stamina, state.stamina + self.stamina_regen_rate * delta_time)
    
    def get_user_mounts(self, user_id: str) -> List[Dict]:
        """获取用户坐骑列表"""
        mounts = []
        
        for mount_id in self.user_mounts.get(user_id, set()):
            mount = self.mounts.get(mount_id)
            if mount:
                mounts.append({
                    "mount_id": mount.mount_id,
                    "name": mount.name,
                    "mount_type": mount.mount_type.value,
                    "speed": mount.speed,
                    "icon": mount.icon,
                    "description": mount.description,
                    "level_required": mount.level_required,
                    "premium": mount.premium,
                    "abilities": mount.abilities
                })
        
        return mounts
    
    def get_current_mount(self, user_id: str) -> Optional[Dict]:
        """获取当前坐骑"""
        if user_id not in self.user_states:
            return None
        
        state = self.user_states[user_id]
        
        if not state.is_mounted or not state.current_mount:
            return None
        
        mount = self.mounts.get(state.current_mount)
        
        if not mount:
            return None
        
        return {
            "mount_id": mount.mount_id,
            "name": mount.name,
            "mount_type": mount.mount_type.value,
            "speed": mount.speed,
            "icon": mount.icon,
            "is_mounted": state.is_mounted,
            "stamina": state.stamina,
            "max_stamina": state.max_stamina,
            "stamina_percentage": state.stamina / state.max_stamina
        }
    
    def get_mount_list(self) -> List[Dict]:
        """获取所有坐骑列表"""
        return [{
            "mount_id": m.mount_id,
            "name": m.name,
            "mount_type": m.mount_type.value,
            "speed": m.speed,
            "icon": m.icon,
            "description": m.description,
            "level_required": m.level_required,
            "premium": m.premium
        } for m in self.mounts.values()]


def get_mount_ui_system() -> UE5MountUISystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5MountUISystem()
    return _instance


if __name__ == "__main__":
    system = get_mount_ui_system()
    system.unlock_mount("player1", "horse_basic")
    result = system.mount("player1", "horse_basic")
    print("Mount result:", result)
    print("Current mount:", system.get_current_mount("player1"))
