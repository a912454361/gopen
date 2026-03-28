#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 复活系统
支持死亡处理、复活选项

功能：
- 多种复活方式（就地、城镇、检查点等）
- 经验/金币惩罚
- 复活计时器
- 复活点管理
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum


class ReviveLocationType(Enum):
    RESPAWN_POINT = "respawn_point"
    NEAREST_TOWN = "nearest_town"
    CURRENT_LOCATION = "current_location"
    PARTY_LEADER = "party_leader"
    CHECKPOINT = "checkpoint"


@dataclass
class RespawnPoint:
    """复活点"""
    point_id: str
    name: str
    position: Tuple[float, float, float]
    is_default: bool = False
    unlocked: bool = True


@dataclass
class DeathState:
    """死亡状态"""
    user_id: str
    death_position: Tuple[float, float, float]
    death_time: float
    revive_options: List[Dict] = field(default_factory=list)
    respawn_timer: float = 10.0
    exp_penalty: float = 0.05
    currency_penalty: float = 0.0


class UE5ReviveSystem:
    """UE5 复活系统"""
    
    def __init__(self):
        self.respawn_points: Dict[str, RespawnPoint] = {}
        self.death_states: Dict[str, DeathState] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.default_respawn_timer = 10.0
        self.exp_penalty_rate = 0.05
        self.currency_penalty_rate = 0.01
    
    def register_respawn_point(self, point_id: str, name: str,
                               position: Tuple[float, float, float],
                               is_default: bool = False):
        """注册复活点"""
        point = RespawnPoint(
            point_id=point_id,
            name=name,
            position=position,
            is_default=is_default
        )
        self.respawn_points[point_id] = point
    
    def handle_death(self, user_id: str, death_position: Tuple[float, float, float],
                     user_level: int, user_currency: float) -> DeathState:
        """处理死亡"""
        exp_penalty = user_level * 100 * self.exp_penalty_rate
        currency_penalty = user_currency * self.currency_penalty_rate
        
        revive_options = self._generate_revive_options(user_id, death_position)
        
        death_state = DeathState(
            user_id=user_id,
            death_position=death_position,
            death_time=time.time(),
            revive_options=revive_options,
            exp_penalty=exp_penalty,
            currency_penalty=currency_penalty
        )
        
        self.death_states[user_id] = death_state
        return death_state
    
    def _generate_revive_options(self, user_id: str,
                                  death_position: Tuple[float, float, float]) -> List[Dict]:
        """生成复活选项"""
        options = []
        
        # 就地复活
        options.append({
            "type": ReviveLocationType.CURRENT_LOCATION.value,
            "name": "就地复活",
            "cost": {"item": "revive_scroll", "quantity": 1},
            "position": death_position,
            "available": True
        })
        
        # 最近城镇
        nearest_town = self._find_nearest_respawn_point(death_position)
        if nearest_town:
            options.append({
                "type": ReviveLocationType.NEAREST_TOWN.value,
                "name": f"返回{nearest_town.name}",
                "cost": {},
                "position": nearest_town.position,
                "available": True
            })
        
        # 默认复活点
        default_point = self._get_default_respawn_point()
        if default_point:
            options.append({
                "type": ReviveLocationType.RESPAWN_POINT.value,
                "name": f"复活于{default_point.name}",
                "cost": {},
                "position": default_point.position,
                "available": True
            })
        
        return options
    
    def _find_nearest_respawn_point(self, position: Tuple[float, float, float]) -> Optional[RespawnPoint]:
        """查找最近的复活点"""
        nearest = None
        min_distance = float('inf')
        
        for point in self.respawn_points.values():
            if not point.unlocked:
                continue
            
            distance = math.sqrt(
                (point.position[0] - position[0]) ** 2 +
                (point.position[1] - position[1]) ** 2 +
                (point.position[2] - position[2]) ** 2
            )
            
            if distance < min_distance:
                min_distance = distance
                nearest = point
        
        return nearest
    
    def _get_default_respawn_point(self) -> Optional[RespawnPoint]:
        """获取默认复活点"""
        for point in self.respawn_points.values():
            if point.is_default and point.unlocked:
                return point
        return None
    
    def revive(self, user_id: str, revive_type: ReviveLocationType) -> Dict:
        """复活"""
        death_state = self.death_states.get(user_id)
        
        if not death_state:
            return {"success": False, "error": "No death state"}
        
        # 检查复活选项
        selected_option = None
        for option in death_state.revive_options:
            if option["type"] == revive_type.value:
                selected_option = option
                break
        
        if not selected_option:
            return {"success": False, "error": "Invalid revive option"}
        
        # 清除死亡状态
        del self.death_states[user_id]
        
        return {
            "success": True,
            "position": selected_option["position"],
            "exp_penalty": death_state.exp_penalty,
            "currency_penalty": death_state.currency_penalty
        }
    
    def get_death_state(self, user_id: str) -> Optional[Dict]:
        """获取死亡状态"""
        death_state = self.death_states.get(user_id)
        
        if not death_state:
            return None
        
        elapsed = time.time() - death_state.death_time
        remaining = max(0, death_state.respawn_timer - elapsed)
        
        return {
            "user_id": death_state.user_id,
            "death_position": death_state.death_position,
            "death_time": death_state.death_time,
            "revive_options": death_state.revive_options,
            "respawn_timer_remaining": remaining,
            "exp_penalty": death_state.exp_penalty,
            "currency_penalty": death_state.currency_penalty
        }


def get_revive_system() -> UE5ReviveSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5ReviveSystem()
    return _instance


if __name__ == "__main__":
    system = get_revive_system()
    system.register_respawn_point("town_001", "新手村", (0, 0, 0), is_default=True)
    death_state = system.handle_death("player1", (100, 0, 100), 50, 1000)
    print("Death state:", system.get_death_state("player1"))
