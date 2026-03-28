#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 教程与小地图系统
支持新手教程、游戏地图

功能：
- 教程步骤管理
- 教程进度跟踪
- 小地图显示
- 地图标记
"""

import json
import time
import math
from typing import Optional, Dict, Any, List, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum


class TutorialStepType(Enum):
    DIALOGUE = "dialogue"
    INTERACTION = "interaction"
    MOVEMENT = "movement"
    COMBAT = "combat"
    UI = "ui"
    CUSTOM = "custom"


@dataclass
class TutorialStep:
    """教程步骤"""
    step_id: str
    step_type: TutorialStepType
    title: str
    description: str
    target: str  # 目标对象ID
    action: str  # 需要执行的动作
    prerequisites: List[str] = field(default_factory=list)
    rewards: Dict[str, Any] = field(default_factory=dict)
    highlight_ui: List[str] = field(default_factory=list)
    completed: bool = False


@dataclass
class Tutorial:
    """教程"""
    tutorial_id: str
    name: str
    description: str
    steps: List[TutorialStep] = field(default_factory=list)
    total_steps: int = 0
    completed_steps: int = 0


@dataclass
class MapMarker:
    """地图标记"""
    marker_id: str
    name: str
    position: Tuple[float, float, float]
    icon: str
    marker_type: str
    is_active: bool = True
    is_permanent: bool = True


class UE5TutorialSystem:
    """UE5 教程系统"""
    
    def __init__(self):
        self.tutorials: Dict[str, Tutorial] = {}
        self.user_tutorials: Dict[str, Set[str]] = {}
        self.user_progress: Dict[str, Dict[str, int]] = {}
        self._init_default_tutorials()
    
    def _init_default_tutorials(self):
        """初始化默认教程"""
        # 新手教程
        steps = [
            TutorialStep("step_1", TutorialStepType.MOVEMENT, "移动",
                         "使用WASD或虚拟摇杆移动", "world", "move_to_marker"),
            TutorialStep("step_2", TutorialStepType.INTERACTION, "交互",
                         "按E键或点击交互按钮与NPC对话", "npc_guide", "interact"),
            TutorialStep("step_3", TutorialStepType.COMBAT, "战斗",
                         "点击攻击按钮攻击敌人", "enemy_training", "kill"),
            TutorialStep("step_4", TutorialStepType.UI, "技能",
                         "学习并使用技能", "skill_ui", "use_skill"),
            TutorialStep("step_5", TutorialStepType.INTERACTION, "背包",
                         "打开背包查看物品", "inventory_ui", "open_inventory"),
        ]
        
        tutorial = Tutorial(
            tutorial_id="newbie_tutorial",
            name="新手教程",
            description="学习游戏基本操作",
            steps=steps,
            total_steps=len(steps)
        )
        
        self.tutorials[tutorial.tutorial_id] = tutorial
    
    def start_tutorial(self, user_id: str, tutorial_id: str) -> Optional[Tutorial]:
        """开始教程"""
        tutorial = self.tutorials.get(tutorial_id)
        
        if not tutorial:
            return None
        
        if user_id not in self.user_tutorials:
            self.user_tutorials[user_id] = set()
        
        self.user_tutorials[user_id].add(tutorial_id)
        
        if user_id not in self.user_progress:
            self.user_progress[user_id] = {}
        
        self.user_progress[user_id][tutorial_id] = 0
        
        return tutorial
    
    def complete_step(self, user_id: str, tutorial_id: str, step_id: str) -> Dict:
        """完成步骤"""
        tutorial = self.tutorials.get(tutorial_id)
        
        if not tutorial:
            return {"success": False, "error": "Tutorial not found"}
        
        for step in tutorial.steps:
            if step.step_id == step_id:
                step.completed = True
                tutorial.completed_steps += 1
                
                if tutorial.completed_steps >= tutorial.total_steps:
                    return {
                        "success": True,
                        "tutorial_completed": True,
                        "rewards": {"gold": 1000, "exp": 500}
                    }
                
                return {
                    "success": True,
                    "tutorial_completed": False,
                    "progress": tutorial.completed_steps / tutorial.total_steps
                }
        
        return {"success": False, "error": "Step not found"}
    
    def get_tutorial_progress(self, user_id: str, tutorial_id: str) -> Dict:
        """获取教程进度"""
        tutorial = self.tutorials.get(tutorial_id)
        
        if not tutorial:
            return {"error": "Tutorial not found"}
        
        return {
            "tutorial_id": tutorial_id,
            "name": tutorial.name,
            "total_steps": tutorial.total_steps,
            "completed_steps": tutorial.completed_steps,
            "progress": tutorial.completed_steps / tutorial.total_steps,
            "steps": [{
                "step_id": step.step_id,
                "title": step.title,
                "completed": step.completed
            } for step in tutorial.steps]
        }


class UE5MinimapSystem:
    """UE5 小地图系统"""
    
    def __init__(self):
        self.markers: Dict[str, MapMarker] = {}
        self.user_discovered: Dict[str, Set[str]] = {}
        self.map_center: Tuple[float, float, float] = (0.0, 0.0, 0.0)
        self.map_size: float = 1000.0
        self._init_default_markers()
    
    def _init_default_markers(self):
        """初始化默认标记"""
        default_markers = [
            MapMarker("town_center", "城镇中心", (0, 0, 0), "icon_town", "town"),
            MapMarker("quest_giver", "任务NPC", (100, 0, 50), "icon_quest", "npc"),
            MapMarker("shop", "商店", (-50, 0, 100), "icon_shop", "shop"),
            MapMarker("dungeon", "地下城入口", (300, 0, 200), "icon_dungeon", "dungeon"),
        ]
        
        for marker in default_markers:
            self.markers[marker.marker_id] = marker
    
    def add_marker(self, marker: MapMarker):
        """添加标记"""
        self.markers[marker.marker_id] = marker
    
    def remove_marker(self, marker_id: str):
        """移除标记"""
        if marker_id in self.markers:
            del self.markers[marker_id]
    
    def discover_marker(self, user_id: str, marker_id: str):
        """发现标记"""
        if user_id not in self.user_discovered:
            self.user_discovered[user_id] = set()
        
        self.user_discovered[user_id].add(marker_id)
    
    def get_visible_markers(self, user_id: str, position: Tuple[float, float, float],
                            view_range: float = 100.0) -> List[Dict]:
        """获取可见标记"""
        visible = []
        
        for marker in self.markers.values():
            if not marker.is_active:
                continue
            
            distance = math.sqrt(
                (marker.position[0] - position[0]) ** 2 +
                (marker.position[1] - position[1]) ** 2 +
                (marker.position[2] - position[2]) ** 2
            )
            
            if distance <= view_range or marker.is_permanent:
                discovered = marker.marker_id in self.user_discovered.get(user_id, set())
                
                visible.append({
                    "marker_id": marker.marker_id,
                    "name": marker.name,
                    "position": marker.position,
                    "icon": marker.icon,
                    "marker_type": marker.marker_type,
                    "distance": distance,
                    "discovered": discovered
                })
        
        return visible
    
    def get_minimap_data(self, user_id: str, position: Tuple[float, float, float]) -> Dict:
        """获取小地图数据"""
        return {
            "center": position,
            "size": self.map_size,
            "markers": self.get_visible_markers(user_id, position)
        }


# 全局实例
_tutorial_instance: Optional[UE5TutorialSystem] = None
_minimap_instance: Optional[UE5MinimapSystem] = None


def get_tutorial_system() -> UE5TutorialSystem:
    global _tutorial_instance
    if _tutorial_instance is None:
        _tutorial_instance = UE5TutorialSystem()
    return _tutorial_instance


def get_minimap_system() -> UE5MinimapSystem:
    global _minimap_instance
    if _minimap_instance is None:
        _minimap_instance = UE5MinimapSystem()
    return _minimap_instance


if __name__ == "__main__":
    tutorial = get_tutorial_system()
    minimap = get_minimap_system()
    
    print("Tutorial:", tutorial.get_tutorial_progress("player1", "newbie_tutorial"))
    print("Minimap:", minimap.get_minimap_data("player1", (0, 0, 0)))
