#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 广告牌系统
支持3D空间UI显示

功能：
- 文本/图像/视频广告牌
- 面向摄像机
- 距离淡出
- 交互式广告牌
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class BillboardType(Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    INTERACTIVE = "interactive"


@dataclass
class Billboard:
    """广告牌"""
    billboard_id: str
    name: str
    billboard_type: BillboardType
    content: str
    position: Tuple[float, float, float]
    rotation: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    scale: float = 1.0
    width: float = 2.0
    height: float = 1.0
    visible: bool = True
    face_camera: bool = True
    fade_distance: float = 50.0
    opacity: float = 1.0
    render_queue: int = 3000
    created_at: float = field(default_factory=time.time)


class UE5BillboardSystem:
    """UE5 广告牌系统"""
    
    def __init__(self):
        self.billboards: Dict[str, Billboard] = {}
    
    def create_billboard(self, name: str, billboard_type: BillboardType,
                         content: str, position: Tuple[float, float, float],
                         **kwargs) -> Billboard:
        """创建广告牌"""
        billboard_id = hashlib.md5(f"{name}_{position}_{time.time()}".encode()).hexdigest()[:12]
        
        billboard = Billboard(
            billboard_id=billboard_id,
            name=name,
            billboard_type=billboard_type,
            content=content,
            position=position,
            rotation=kwargs.get("rotation", (0.0, 0.0, 0.0)),
            scale=kwargs.get("scale", 1.0),
            width=kwargs.get("width", 2.0),
            height=kwargs.get("height", 1.0),
            face_camera=kwargs.get("face_camera", True),
            fade_distance=kwargs.get("fade_distance", 50.0)
        )
        
        self.billboards[billboard_id] = billboard
        return billboard
    
    def update_content(self, billboard_id: str, content: str) -> bool:
        """更新内容"""
        if billboard_id in self.billboards:
            self.billboards[billboard_id].content = content
            return True
        return False
    
    def set_visible(self, billboard_id: str, visible: bool) -> bool:
        """设置可见性"""
        if billboard_id in self.billboards:
            self.billboards[billboard_id].visible = visible
            return True
        return False
    
    def remove_billboard(self, billboard_id: str) -> bool:
        """移除广告牌"""
        if billboard_id in self.billboards:
            del self.billboards[billboard_id]
            return True
        return False
    
    def get_billboards_in_range(self, camera_pos: Tuple[float, float, float]) -> List[Dict]:
        """获取范围内的广告牌"""
        billboards = []
        
        for b in self.billboards.values():
            if not b.visible:
                continue
            
            distance = math.sqrt(
                (b.position[0] - camera_pos[0]) ** 2 +
                (b.position[1] - camera_pos[1]) ** 2 +
                (b.position[2] - camera_pos[2]) ** 2
            )
            
            if distance <= b.fade_distance * 1.5:
                opacity = 1.0 if distance <= b.fade_distance else \
                         1.0 - (distance - b.fade_distance) / (b.fade_distance * 0.5)
                
                billboards.append({
                    "billboard_id": b.billboard_id,
                    "name": b.name,
                    "type": b.billboard_type.value,
                    "content": b.content,
                    "position": b.position,
                    "rotation": b.rotation,
                    "scale": b.scale,
                    "width": b.width,
                    "height": b.height,
                    "face_camera": b.face_camera,
                    "distance": distance,
                    "opacity": opacity
                })
        
        return billboards


def get_billboard_system() -> UE5BillboardSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5BillboardSystem()
    return _instance


if __name__ == "__main__":
    system = get_billboard_system()
    system.create_billboard("公告牌", BillboardType.TEXT, "欢迎来到万古长夜", (100, 50, 100))
    print("Billboards:", system.get_billboards_in_range((100, 50, 100)))
