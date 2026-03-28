#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 雷达系统
支持小地图雷达显示

功能：
- 多种光点类型
- 距离显示
- 脉冲效果
- 可配置显示选项
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class RadarBlipType(Enum):
    PLAYER = "player"
    ENEMY = "enemy"
    NPC = "npc"
    ITEM = "item"
    QUEST = "quest"
    WAYPOINT = "waypoint"
    DANGER = "danger"


@dataclass
class RadarBlip:
    """雷达光点"""
    blip_id: str
    blip_type: RadarBlipType
    target_id: str
    name: str
    position: Tuple[float, float, float]
    icon: Optional[str] = None
    color: str = "#FFFFFF"
    pulse: bool = False
    visible: bool = True


@dataclass
class RadarConfig:
    """雷达配置"""
    range: float = 100.0
    zoom: float = 1.0
    show_players: bool = True
    show_enemies: bool = True
    show_npcs: bool = True
    show_items: bool = True
    show_quests: bool = True


class UE5RadarSystem:
    """UE5 雷达系统"""
    
    def __init__(self):
        self.blips: Dict[str, RadarBlip] = {}
        self.radar_configs: Dict[str, RadarConfig] = {}
        self.default_range = 100.0
    
    def create_blip(self, blip_type: RadarBlipType, target_id: str,
                    name: str, position: Tuple[float, float, float],
                    **kwargs) -> RadarBlip:
        """创建雷达光点"""
        blip_id = hashlib.md5(f"{blip_type.value}_{target_id}".encode()).hexdigest()[:12]
        
        blip = RadarBlip(
            blip_id=blip_id,
            blip_type=blip_type,
            target_id=target_id,
            name=name,
            position=position,
            icon=kwargs.get("icon"),
            color=kwargs.get("color", self._get_default_color(blip_type)),
            pulse=kwargs.get("pulse", False),
            visible=kwargs.get("visible", True)
        )
        
        self.blips[blip_id] = blip
        return blip
    
    def update_blip_position(self, blip_id: str, position: Tuple[float, float, float]) -> bool:
        """更新光点位置"""
        if blip_id in self.blips:
            self.blips[blip_id].position = position
            return True
        return False
    
    def remove_blip(self, blip_id: str) -> bool:
        """移除光点"""
        if blip_id in self.blips:
            del self.blips[blip_id]
            return True
        return False
    
    def get_radar_data(self, user_id: str,
                       player_position: Tuple[float, float, float],
                       player_rotation: float) -> Dict:
        """获取雷达数据"""
        config = self.radar_configs.get(user_id, RadarConfig())
        blips = []
        
        for blip in self.blips.values():
            if not blip.visible:
                continue
            
            # 过滤类型
            type_filters = {
                RadarBlipType.PLAYER: config.show_players,
                RadarBlipType.ENEMY: config.show_enemies,
                RadarBlipType.NPC: config.show_npcs,
                RadarBlipType.ITEM: config.show_items,
                RadarBlipType.QUEST: config.show_quests
            }
            
            if not type_filters.get(blip.blip_type, True):
                continue
            
            # 计算相对位置
            rel_x = blip.position[0] - player_position[0]
            rel_z = blip.position[2] - player_position[2]
            distance = math.sqrt(rel_x ** 2 + rel_z ** 2)
            
            if distance <= config.range:
                # 考虑玩家朝向旋转
                angle = math.radians(player_rotation)
                rotated_x = rel_x * math.cos(angle) - rel_z * math.sin(angle)
                rotated_z = rel_x * math.sin(angle) + rel_z * math.cos(angle)
                
                # 归一化
                normalized_x = rotated_x / config.range
                normalized_z = rotated_z / config.range
                
                blips.append({
                    "blip_id": blip.blip_id,
                    "blip_type": blip.blip_type.value,
                    "name": blip.name,
                    "relative_x": normalized_x,
                    "relative_z": normalized_z,
                    "distance": distance,
                    "icon": blip.icon,
                    "color": blip.color,
                    "pulse": blip.pulse
                })
        
        return {
            "range": config.range,
            "zoom": config.zoom,
            "blips": blips
        }
    
    def set_radar_config(self, user_id: str, **kwargs):
        """设置雷达配置"""
        if user_id not in self.radar_configs:
            self.radar_configs[user_id] = RadarConfig()
        
        config = self.radar_configs[user_id]
        for key in ["range", "zoom", "show_players", "show_enemies", "show_npcs", "show_items", "show_quests"]:
            if key in kwargs:
                setattr(config, key, kwargs[key])
    
    def _get_default_color(self, blip_type: RadarBlipType) -> str:
        colors = {
            RadarBlipType.PLAYER: "#00FF00",
            RadarBlipType.ENEMY: "#FF0000",
            RadarBlipType.NPC: "#FFFF00",
            RadarBlipType.ITEM: "#00FFFF",
            RadarBlipType.QUEST: "#FFD700",
            RadarBlipType.WAYPOINT: "#FFFFFF",
            RadarBlipType.DANGER: "#FF4444"
        }
        return colors.get(blip_type, "#FFFFFF")


def get_radar_system() -> UE5RadarSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5RadarSystem()
    return _instance


if __name__ == "__main__":
    system = get_radar_system()
    system.create_blip(RadarBlipType.ENEMY, "enemy_001", "哥布林", (50, 0, 50))
    print("Radar data:", system.get_radar_data("player1", (0, 0, 0), 0))
