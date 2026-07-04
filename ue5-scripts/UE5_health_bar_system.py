#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 血条系统
支持血条显示、护盾显示、状态效果

功能：
- 玩家/敌人/BOSS血条
- 护盾显示
- 状态效果图标
- 根据类型自动调整颜色和大小
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class HealthBarType(Enum):
    PLAYER = "player"
    ENEMY = "enemy"
    NPC = "npc"
    BOSS = "boss"
    OBJECT = "object"
    PET = "pet"


@dataclass
class HealthBar:
    """血条数据"""
    bar_id: str
    target_id: str
    bar_type: HealthBarType
    current_health: float
    max_health: float
    current_shield: float = 0.0
    max_shield: float = 0.0
    level: int = 1
    name: str = ""
    visible: bool = True
    show_name: bool = True
    show_level: bool = True
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    offset: Tuple[float, float, float] = (0.0, 2.0, 0.0)
    width: float = 200.0
    height: float = 20.0
    color: str = "#FF0000"
    shield_color: str = "#4444FF"
    effects: List[str] = field(default_factory=list)


class UE5HealthBarSystem:
    """UE5 血条系统"""
    
    def __init__(self):
        self.health_bars: Dict[str, HealthBar] = {}
        self.default_width = 200.0
        self.default_height = 20.0
    
    def create_health_bar(self, target_id: str, bar_type: HealthBarType,
                          max_health: float, name: str = "", level: int = 1) -> HealthBar:
        """创建血条"""
        bar_id = hashlib.md5(f"{target_id}_{bar_type.value}".encode()).hexdigest()[:12]
        
        bar = HealthBar(
            bar_id=bar_id,
            target_id=target_id,
            bar_type=bar_type,
            current_health=max_health,
            max_health=max_health,
            level=level,
            name=name,
            width=self._get_bar_width(bar_type),
            color=self._get_bar_color(bar_type)
        )
        
        self.health_bars[bar_id] = bar
        return bar
    
    def update_health(self, target_id: str, current_health: float,
                      max_health: float = None) -> bool:
        """更新血量"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                bar.current_health = min(current_health, bar.max_health)
                if max_health:
                    bar.max_health = max_health
                return True
        return False
    
    def update_shield(self, target_id: str, current_shield: float, 
                      max_shield: float) -> bool:
        """更新护盾"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                bar.current_shield = current_shield
                bar.max_shield = max_shield
                return True
        return False
    
    def set_position(self, target_id: str, position: Tuple[float, float, float]):
        """设置血条位置"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                bar.position = position
                return True
        return False
    
    def set_visible(self, target_id: str, visible: bool):
        """设置血条可见性"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                bar.visible = visible
                return True
        return False
    
    def add_effect(self, target_id: str, effect_icon: str):
        """添加状态效果图标"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                if effect_icon not in bar.effects:
                    bar.effects.append(effect_icon)
                return True
        return False
    
    def remove_effect(self, target_id: str, effect_icon: str):
        """移除状态效果图标"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                if effect_icon in bar.effects:
                    bar.effects.remove(effect_icon)
                return True
        return False
    
    def remove_health_bar(self, target_id: str):
        """移除血条"""
        to_remove = [bar_id for bar_id, bar in self.health_bars.items() 
                    if bar.target_id == target_id]
        for bar_id in to_remove:
            del self.health_bars[bar_id]
    
    def get_health_bar(self, target_id: str) -> Optional[Dict]:
        """获取血条数据"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                return {
                    "bar_id": bar.bar_id,
                    "target_id": bar.target_id,
                    "bar_type": bar.bar_type.value,
                    "current_health": bar.current_health,
                    "max_health": bar.max_health,
                    "current_shield": bar.current_shield,
                    "max_shield": bar.max_shield,
                    "percentage": bar.current_health / bar.max_health if bar.max_health > 0 else 0,
                    "shield_percentage": bar.current_shield / bar.max_shield if bar.max_shield > 0 else 0,
                    "level": bar.level,
                    "name": bar.name,
                    "visible": bar.visible,
                    "position": bar.position,
                    "offset": bar.offset,
                    "width": bar.width,
                    "height": bar.height,
                    "color": bar.color,
                    "shield_color": bar.shield_color,
                    "effects": bar.effects
                }
        return None
    
    def get_visible_bars(self, camera_pos: Tuple[float, float, float],
                        max_distance: float = 100.0) -> List[Dict]:
        """获取可见范围内的血条"""
        bars = []
        
        for bar in self.health_bars.values():
            if not bar.visible:
                continue
            
            distance = math.sqrt(
                (bar.position[0] - camera_pos[0]) ** 2 +
                (bar.position[1] - camera_pos[1]) ** 2 +
                (bar.position[2] - camera_pos[2]) ** 2
            )
            
            if distance <= max_distance:
                bar_data = self.get_health_bar(bar.target_id)
                if bar_data:
                    bar_data["distance"] = distance
                    bars.append(bar_data)
        
        return bars
    
    def _get_bar_width(self, bar_type: HealthBarType) -> float:
        widths = {
            HealthBarType.PLAYER: 200.0,
            HealthBarType.ENEMY: 150.0,
            HealthBarType.BOSS: 400.0,
            HealthBarType.NPC: 100.0,
            HealthBarType.OBJECT: 120.0,
            HealthBarType.PET: 150.0
        }
        return widths.get(bar_type, self.default_width)
    
    def _get_bar_color(self, bar_type: HealthBarType) -> str:
        colors = {
            HealthBarType.PLAYER: "#00FF00",
            HealthBarType.ENEMY: "#FF0000",
            HealthBarType.BOSS: "#FF4400",
            HealthBarType.NPC: "#FFFF00",
            HealthBarType.OBJECT: "#888888",
            HealthBarType.PET: "#00FFFF"
        }
        return colors.get(bar_type, "#FF0000")


def get_health_bar_system() -> UE5HealthBarSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5HealthBarSystem()
    return _instance


if __name__ == "__main__":
    system = get_health_bar_system()
    bar = system.create_health_bar("enemy_001", HealthBarType.ENEMY, 1000.0, "哥布林", 15)
    print("Health bar:", system.get_health_bar("enemy_001"))
