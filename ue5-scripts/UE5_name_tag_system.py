#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 名字标签系统
支持玩家/怪物名字显示

功能：
- 显示名称、称号、公会
- 等级显示
- 距离缩放
- 背景透明度
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class NameTagType(Enum):
    PLAYER = "player"
    NPC = "npc"
    ENEMY = "enemy"
    BOSS = "boss"
    OBJECT = "object"


@dataclass
class NameTag:
    """名字标签"""
    tag_id: str
    target_id: str
    tag_type: NameTagType
    display_name: str
    title: Optional[str] = None
    guild: Optional[str] = None
    level: int = 1
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    offset: Tuple[float, float, float] = (0.0, 2.0, 0.0)
    color: str = "#FFFFFF"
    background_color: str = "#000000"
    background_opacity: float = 0.5
    visible: bool = True
    show_level: bool = True
    show_guild: bool = True
    show_title: bool = True
    scale_with_distance: bool = True
    max_distance: float = 100.0
    font_size: int = 14


class UE5NameTagSystem:
    """UE5 名字标签系统"""
    
    def __init__(self):
        self.name_tags: Dict[str, NameTag] = {}
        self.default_max_distance = 100.0
        self.min_scale = 0.3
        self.max_scale = 1.0
    
    def create_name_tag(self, target_id: str, display_name: str,
                        tag_type: NameTagType = NameTagType.PLAYER,
                        **kwargs) -> NameTag:
        """创建名字标签"""
        tag_id = hashlib.md5(f"{target_id}_nametag".encode()).hexdigest()[:12]
        
        tag = NameTag(
            tag_id=tag_id,
            target_id=target_id,
            tag_type=tag_type,
            display_name=display_name,
            title=kwargs.get("title"),
            guild=kwargs.get("guild"),
            level=kwargs.get("level", 1),
            position=kwargs.get("position", (0.0, 0.0, 0.0)),
            offset=kwargs.get("offset", (0.0, 2.0, 0.0)),
            color=kwargs.get("color", "#FFFFFF"),
            background_color=kwargs.get("background_color", "#000000"),
            visible=kwargs.get("visible", True)
        )
        
        self.name_tags[tag_id] = tag
        return tag
    
    def update_position(self, target_id: str, position: Tuple[float, float, float]) -> bool:
        """更新位置"""
        for tag in self.name_tags.values():
            if tag.target_id == target_id:
                tag.position = position
                return True
        return False
    
    def set_visible(self, target_id: str, visible: bool) -> bool:
        """设置可见性"""
        for tag in self.name_tags.values():
            if tag.target_id == target_id:
                tag.visible = visible
                return True
        return False
    
    def update_display_name(self, target_id: str, display_name: str) -> bool:
        """更新显示名称"""
        for tag in self.name_tags.values():
            if tag.target_id == target_id:
                tag.display_name = display_name
                return True
        return False
    
    def remove_name_tag(self, target_id: str) -> bool:
        """移除名字标签"""
        to_remove = [tag_id for tag_id, tag in self.name_tags.items() 
                    if tag.target_id == target_id]
        for tag_id in to_remove:
            del self.name_tags[tag_id]
        return len(to_remove) > 0
    
    def get_name_tags_in_view(self, camera_pos: Tuple[float, float, float]) -> List[Dict]:
        """获取视野内的名字标签"""
        tags = []
        
        for tag in self.name_tags.values():
            if not tag.visible:
                continue
            
            distance = math.sqrt(
                (tag.position[0] - camera_pos[0]) ** 2 +
                (tag.position[1] - camera_pos[1]) ** 2 +
                (tag.position[2] - camera_pos[2]) ** 2
            )
            
            if distance <= tag.max_distance:
                scale = 1.0
                if tag.scale_with_distance:
                    scale = max(self.min_scale, min(self.max_scale, 50.0 / max(distance, 1.0)))
                
                tags.append({
                    "tag_id": tag.tag_id,
                    "target_id": tag.target_id,
                    "tag_type": tag.tag_type.value,
                    "display_name": tag.display_name,
                    "title": tag.title,
                    "guild": tag.guild,
                    "level": tag.level,
                    "position": tag.position,
                    "offset": tag.offset,
                    "color": tag.color,
                    "background_color": tag.background_color,
                    "background_opacity": tag.background_opacity,
                    "distance": distance,
                    "scale": scale,
                    "font_size": tag.font_size
                })
        
        return tags
    
    def clear_all(self):
        """清除所有名字标签"""
        self.name_tags.clear()


def get_name_tag_system() -> UE5NameTagSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5NameTagSystem()
    return _instance


if __name__ == "__main__":
    system = get_name_tag_system()
    system.create_name_tag("player1", "剑客小明", NameTagType.PLAYER, title="武林高手", level=50)
    print("Name tags:", system.get_name_tags_in_view((0, 0, 0)))
