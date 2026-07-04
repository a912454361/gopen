#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 目标锁定系统
支持目标选择、切换

功能：
- 目标锁定/解锁
- 目标切换
- 最近目标查找
- 目标信息显示
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum


class TargetType(Enum):
    PLAYER = "player"
    ENEMY = "enemy"
    NPC = "npc"
    OBJECT = "object"


@dataclass
class TargetInfo:
    """目标信息"""
    target_id: str
    target_name: str
    target_type: TargetType
    position: Tuple[float, float, float]
    distance: float
    level: int = 1
    health_percentage: float = 1.0
    hostility: str = "neutral"  # friendly, neutral, hostile


class UE5TargetLockSystem:
    """UE5 目标锁定系统"""
    
    def __init__(self):
        self.user_targets: Dict[str, Optional[str]] = {}
        self.target_data: Dict[str, TargetInfo] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.max_lock_distance = 100.0
        self.auto_lock_enabled = True
    
    def lock_target(self, user_id: str, target_id: str, target_info: TargetInfo) -> bool:
        """锁定目标"""
        self.user_targets[user_id] = target_id
        self.target_data[target_id] = target_info
        return True
    
    def unlock_target(self, user_id: str) -> bool:
        """解锁目标"""
        if user_id in self.user_targets:
            self.user_targets[user_id] = None
            return True
        return False
    
    def switch_target(self, user_id: str, targets: List[TargetInfo],
                      direction: int = 1) -> Optional[str]:
        """切换目标"""
        current_target = self.user_targets.get(user_id)
        
        if not targets:
            return None
        
        # 排序目标（按距离）
        targets.sort(key=lambda x: x.distance)
        
        # 找到当前目标的索引
        current_index = -1
        if current_target:
            for i, t in enumerate(targets):
                if t.target_id == current_target:
                    current_index = i
                    break
        
        # 计算下一个目标
        next_index = (current_index + direction) % len(targets)
        next_target = targets[next_index]
        
        self.lock_target(user_id, next_target.target_id, next_target)
        return next_target.target_id
    
    def find_nearest_target(self, position: Tuple[float, float, float],
                            targets: List[TargetInfo],
                            target_type: TargetType = None) -> Optional[TargetInfo]:
        """查找最近的目标"""
        nearest = None
        min_distance = float('inf')
        
        for target in targets:
            if target_type and target.target_type != target_type:
                continue
            
            if target.distance < min_distance:
                min_distance = target.distance
                nearest = target
        
        return nearest
    
    def get_target(self, user_id: str) -> Optional[Dict]:
        """获取当前目标"""
        target_id = self.user_targets.get(user_id)
        
        if not target_id:
            return None
        
        target_info = self.target_data.get(target_id)
        
        if not target_info:
            return None
        
        return {
            "target_id": target_info.target_id,
            "target_name": target_info.target_name,
            "target_type": target_info.target_type.value,
            "position": target_info.position,
            "distance": target_info.distance,
            "level": target_info.level,
            "health_percentage": target_info.health_percentage,
            "hostility": target_info.hostility
        }
    
    def update_target_position(self, target_id: str, position: Tuple[float, float, float]):
        """更新目标位置"""
        if target_id in self.target_data:
            self.target_data[target_id].position = position
    
    def update_target_health(self, target_id: str, health_percentage: float):
        """更新目标血量"""
        if target_id in self.target_data:
            self.target_data[target_id].health_percentage = health_percentage


def get_target_lock_system() -> UE5TargetLockSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5TargetLockSystem()
    return _instance


if __name__ == "__main__":
    system = get_target_lock_system()
    target = TargetInfo("enemy_001", "哥布林", TargetType.ENEMY, (100, 0, 100), 141.4, 15, 1.0, "hostile")
    system.lock_target("player1", "enemy_001", target)
    print("Target:", system.get_target("player1"))
