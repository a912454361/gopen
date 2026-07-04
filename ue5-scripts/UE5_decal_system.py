#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 贴花系统
支持地面贴花、特效贴花

功能：
- 多种贴花类型
- 自动过期
- 淡出效果
- 最大数量限制
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class DecalType(Enum):
    FOOTPRINT = "footprint"
    BLOOD = "blood"
    BURN = "burn"
    MAGIC = "magic"
    MARKER = "marker"
    CUSTOM = "custom"


@dataclass
class Decal:
    """贴花"""
    decal_id: str
    decal_type: DecalType
    texture_path: str
    position: Tuple[float, float, float]
    normal: Tuple[float, float, float] = (0.0, 1.0, 0.0)
    rotation: float = 0.0
    scale: Tuple[float, float] = (1.0, 1.0)
    color: str = "#FFFFFF"
    opacity: float = 1.0
    lifetime: Optional[float] = None
    fade_out: bool = True
    fade_start_ratio: float = 0.8
    created_at: float = field(default_factory=time.time)


class UE5DecalSystem:
    """UE5 贴花系统"""
    
    def __init__(self):
        self.decals: Dict[str, Decal] = {}
        self.max_decals = 500
        self.default_lifetime = 30.0
    
    def create_decal(self, decal_type: DecalType, texture_path: str,
                     position: Tuple[float, float, float], **kwargs) -> Decal:
        """创建贴花"""
        decal_id = hashlib.md5(f"{decal_type.value}_{position}_{time.time()}".encode()).hexdigest()[:12]
        
        decal = Decal(
            decal_id=decal_id,
            decal_type=decal_type,
            texture_path=texture_path,
            position=position,
            normal=kwargs.get("normal", (0.0, 1.0, 0.0)),
            rotation=kwargs.get("rotation", 0.0),
            scale=kwargs.get("scale", (1.0, 1.0)),
            color=kwargs.get("color", "#FFFFFF"),
            opacity=kwargs.get("opacity", 1.0),
            lifetime=kwargs.get("lifetime", self.default_lifetime),
            fade_out=kwargs.get("fade_out", True)
        )
        
        self.decals[decal_id] = decal
        
        if len(self.decals) > self.max_decals:
            self._remove_oldest()
        
        return decal
    
    def update(self, delta_time: float) -> List[str]:
        """更新贴花"""
        now = time.time()
        expired = []
        
        for decal_id, decal in self.decals.items():
            if decal.lifetime is None:
                continue
            
            elapsed = now - decal.created_at
            
            if elapsed >= decal.lifetime:
                expired.append(decal_id)
            elif decal.fade_out:
                fade_start = decal.lifetime * decal.fade_start_ratio
                if elapsed > fade_start:
                    decal.opacity = 1.0 - (elapsed - fade_start) / (decal.lifetime - fade_start)
        
        for decal_id in expired:
            del self.decals[decal_id]
        
        return expired
    
    def remove_decal(self, decal_id: str) -> bool:
        """移除贴花"""
        if decal_id in self.decals:
            del self.decals[decal_id]
            return True
        return False
    
    def get_decals_in_range(self, camera_pos: Tuple[float, float, float],
                           max_distance: float = 50.0) -> List[Dict]:
        """获取范围内的贴花"""
        decals = []
        
        for d in self.decals.values():
            if d.opacity <= 0:
                continue
            
            distance = math.sqrt(
                (d.position[0] - camera_pos[0]) ** 2 +
                (d.position[1] - camera_pos[1]) ** 2 +
                (d.position[2] - camera_pos[2]) ** 2
            )
            
            if distance <= max_distance:
                decals.append({
                    "decal_id": d.decal_id,
                    "decal_type": d.decal_type.value,
                    "texture_path": d.texture_path,
                    "position": d.position,
                    "normal": d.normal,
                    "rotation": d.rotation,
                    "scale": d.scale,
                    "color": d.color,
                    "opacity": d.opacity
                })
        
        return decals
    
    def clear_all(self):
        """清除所有贴花"""
        self.decals.clear()
    
    def _remove_oldest(self):
        """移除最旧的贴花"""
        if not self.decals:
            return
        oldest_id = min(self.decals.keys(), key=lambda x: self.decals[x].created_at)
        del self.decals[oldest_id]


def get_decal_system() -> UE5DecalSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5DecalSystem()
    return _instance


if __name__ == "__main__":
    system = get_decal_system()
    system.create_decal(DecalType.BLOOD, "blood_splatter.png", (10, 0, 10))
    print("Decals:", len(system.decals))
