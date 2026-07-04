#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 任务标记系统
支持任务目标标记、追踪

功能：
- 多种标记类型（击杀、收集、探索等）
- 进度追踪
- 路径点导航
- 最大追踪数量限制
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum


class QuestMarkerType(Enum):
    OBJECTIVE = "objective"
    TURN_IN = "turn_in"
    KILL = "kill"
    COLLECT = "collect"
    EXPLORE = "explore"
    INTERACT = "interact"


@dataclass
class QuestMarker:
    """任务标记"""
    marker_id: str
    quest_id: str
    marker_type: QuestMarkerType
    position: Tuple[float, float, float]
    name: str
    description: str = ""
    icon: Optional[str] = None
    distance: float = 0.0
    visible: bool = True
    priority: int = 1
    progress: int = 0
    progress_max: int = 1
    waypoints: List[Tuple[float, float, float]] = field(default_factory=list)


class UE5QuestMarkerSystem:
    """UE5 任务标记系统"""
    
    def __init__(self):
        self.markers: Dict[str, QuestMarker] = {}
        self.user_tracking: Dict[str, Set[str]] = {}
        self.max_tracking = 5
        self.show_distance = True
    
    def create_marker(self, quest_id: str, marker_type: QuestMarkerType,
                      position: Tuple[float, float, float], name: str,
                      **kwargs) -> QuestMarker:
        """创建任务标记"""
        marker_id = hashlib.md5(f"{quest_id}_{marker_type.value}_{position}".encode()).hexdigest()[:12]
        
        marker = QuestMarker(
            marker_id=marker_id,
            quest_id=quest_id,
            marker_type=marker_type,
            position=position,
            name=name,
            description=kwargs.get("description", ""),
            icon=kwargs.get("icon"),
            priority=kwargs.get("priority", 1),
            progress_max=kwargs.get("progress_max", 1)
        )
        
        self.markers[marker_id] = marker
        return marker
    
    def update_progress(self, marker_id: str, progress: int) -> bool:
        """更新标记进度"""
        if marker_id in self.markers:
            marker = self.markers[marker_id]
            marker.progress = min(progress, marker.progress_max)
            return True
        return False
    
    def track_marker(self, user_id: str, marker_id: str) -> bool:
        """追踪标记"""
        if user_id not in self.user_tracking:
            self.user_tracking[user_id] = set()
        
        if len(self.user_tracking[user_id]) >= self.max_tracking:
            return False
        
        self.user_tracking[user_id].add(marker_id)
        return True
    
    def untrack_marker(self, user_id: str, marker_id: str) -> bool:
        """取消追踪"""
        if user_id in self.user_tracking:
            self.user_tracking[user_id].discard(marker_id)
            return True
        return False
    
    def get_tracked_markers(self, user_id: str,
                            player_pos: Tuple[float, float, float]) -> List[Dict]:
        """获取追踪的标记"""
        markers = []
        
        for marker_id in self.user_tracking.get(user_id, set()):
            marker = self.markers.get(marker_id)
            if marker and marker.visible:
                distance = math.sqrt(
                    (marker.position[0] - player_pos[0]) ** 2 +
                    (marker.position[1] - player_pos[1]) ** 2 +
                    (marker.position[2] - player_pos[2]) ** 2
                )
                
                markers.append({
                    "marker_id": marker.marker_id,
                    "quest_id": marker.quest_id,
                    "marker_type": marker.marker_type.value,
                    "position": marker.position,
                    "name": marker.name,
                    "description": marker.description,
                    "icon": marker.icon,
                    "distance": distance,
                    "progress": marker.progress,
                    "progress_max": marker.progress_max,
                    "waypoints": marker.waypoints
                })
        
        markers.sort(key=lambda x: x["distance"])
        return markers
    
    def get_quest_markers(self, quest_id: str) -> List[Dict]:
        """获取任务的所有标记"""
        return [{
            "marker_id": m.marker_id,
            "marker_type": m.marker_type.value,
            "position": m.position,
            "name": m.name,
            "progress": m.progress,
            "progress_max": m.progress_max
        } for m in self.markers.values() if m.quest_id == quest_id]
    
    def remove_marker(self, marker_id: str):
        """移除标记"""
        if marker_id in self.markers:
            del self.markers[marker_id]
            for user_id in self.user_tracking:
                self.user_tracking[user_id].discard(marker_id)
    
    def remove_quest_markers(self, quest_id: str):
        """移除任务的所有标记"""
        to_remove = [m.marker_id for m in self.markers.values() if m.quest_id == quest_id]
        for marker_id in to_remove:
            self.remove_marker(marker_id)


def get_quest_marker_system() -> UE5QuestMarkerSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5QuestMarkerSystem()
    return _instance


if __name__ == "__main__":
    system = get_quest_marker_system()
    marker = system.create_marker("quest_001", QuestMarkerType.KILL, (100, 0, 100), "击败哥布林")
    system.track_marker("player1", marker.marker_id)
    print("Tracked markers:", system.get_tracked_markers("player1", (0, 0, 0)))
