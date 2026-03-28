#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 相机震动与加载画面系统
支持相机震动效果、加载画面显示

功能：
- 多种相机震动模式
- 加载进度管理
- 加载提示系统
"""

import json
import time
import math
import random
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class ShakePattern(Enum):
    CONSTANT = "constant"
    PERLIN_NOISE = "perlin_noise"
    DECAY = "decay"
    PULSE = "pulse"


@dataclass
class CameraShakeData:
    """相机震动数据"""
    shake_id: str
    pattern: ShakePattern
    intensity: float
    frequency: float
    duration: float
    decay_rate: float = 0.0
    rotation_intensity: float = 0.0
    fov_intensity: float = 0.0


@dataclass
class LoadingScreen:
    """加载画面"""
    screen_id: str
    title: str
    description: str
    tips: List[str]
    background_image: str
    min_display_time: float = 2.0


class UE5CameraShakeSystem:
    """UE5 相机震动系统"""
    
    def __init__(self):
        self.shake_presets: Dict[str, CameraShakeData] = {}
        self.active_shakes: Dict[str, CameraShakeData] = {}
        self._init_default_shakes()
    
    def _init_default_shakes(self):
        """初始化默认震动"""
        default_shakes = [
            CameraShakeData("small_explosion", ShakePattern.DECAY, 0.3, 10.0, 0.5, decay_rate=2.0),
            CameraShakeData("medium_explosion", ShakePattern.DECAY, 0.5, 15.0, 1.0, decay_rate=1.5),
            CameraShakeData("large_explosion", ShakePattern.DECAY, 1.0, 20.0, 2.0, decay_rate=1.0),
            CameraShakeData("footstep", ShakePattern.CONSTANT, 0.1, 5.0, 0.1),
            CameraShakeData("earthquake", ShakePattern.PERLIN_NOISE, 0.8, 8.0, 5.0),
            CameraShakeData("hit", ShakePattern.PULSE, 0.2, 30.0, 0.1),
        ]
        
        for shake in default_shakes:
            self.shake_presets[shake.shake_id] = shake
    
    def trigger_shake(self, shake_id: str, intensity_multiplier: float = 1.0) -> Dict:
        """触发震动"""
        preset = self.shake_presets.get(shake_id)
        
        if not preset:
            return {"success": False, "error": "Shake not found"}
        
        shake_instance = CameraShakeData(
            shake_id=f"{shake_id}_{int(time.time() * 1000)}",
            pattern=preset.pattern,
            intensity=preset.intensity * intensity_multiplier,
            frequency=preset.frequency,
            duration=preset.duration,
            decay_rate=preset.decay_rate,
            rotation_intensity=preset.rotation_intensity * intensity_multiplier,
            fov_intensity=preset.fov_intensity * intensity_multiplier
        )
        
        self.active_shakes[shake_instance.shake_id] = shake_instance
        
        return {
            "success": True,
            "shake_id": shake_instance.shake_id,
            "duration": shake_instance.duration
        }
    
    def update(self, delta_time: float) -> Dict:
        """更新震动"""
        current_offset = {"x": 0.0, "y": 0.0, "rotation": 0.0}
        completed_shakes = []
        
        for shake_id, shake in self.active_shakes.items():
            elapsed = time.time() - float(shake_id.split('_')[-1]) / 1000.0
            
            if elapsed >= shake.duration:
                completed_shakes.append(shake_id)
                continue
            
            progress = elapsed / shake.duration
            
            if shake.pattern == ShakePattern.CONSTANT:
                intensity = shake.intensity
            elif shake.pattern == ShakePattern.DECAY:
                intensity = shake.intensity * math.exp(-shake.decay_rate * elapsed)
            elif shake.pattern == ShakePattern.PULSE:
                intensity = shake.intensity * math.sin(math.pi * progress)
            else:  # PERLIN_NOISE
                intensity = shake.intensity * (0.5 + 0.5 * math.sin(elapsed * shake.frequency))
            
            offset_x = intensity * math.sin(elapsed * shake.frequency)
            offset_y = intensity * math.cos(elapsed * shake.frequency * 1.3)
            rotation = shake.rotation_intensity * math.sin(elapsed * shake.frequency * 0.7)
            
            current_offset["x"] += offset_x
            current_offset["y"] += offset_y
            current_offset["rotation"] += rotation
        
        for shake_id in completed_shakes:
            del self.active_shakes[shake_id]
        
        return current_offset
    
    def stop_all_shakes(self):
        """停止所有震动"""
        self.active_shakes.clear()


class UE5LoadingScreenSystem:
    """UE5 加载画面系统"""
    
    def __init__(self):
        self.loading_screens: Dict[str, LoadingScreen] = {}
        self.current_loading: Optional[str] = None
        self.loading_progress: float = 0.0
        self.loading_start_time: float = 0.0
        self._init_default_screens()
    
    def _init_default_screens(self):
        """初始化默认加载画面"""
        default_screens = [
            LoadingScreen(
                "game_start",
                "万古长夜",
                "正在进入游戏世界...",
                ["提示：合理使用技能可以更快击败敌人", "提示：完成主线任务可获得丰厚奖励"],
                "loading_bg_1.jpg"
            ),
            LoadingScreen(
                "scene_transition",
                "场景加载",
                "正在切换场景...",
                ["提示：探索未知区域可能发现隐藏宝藏"],
                "loading_bg_2.jpg"
            ),
            LoadingScreen(
                "dungeon_enter",
                "进入地下城",
                "准备挑战地下城...",
                ["提示：组队挑战地下城更容易成功"],
                "loading_bg_3.jpg"
            ),
        ]
        
        for screen in default_screens:
            self.loading_screens[screen.screen_id] = screen
    
    def start_loading(self, screen_id: str) -> Dict:
        """开始加载"""
        screen = self.loading_screens.get(screen_id)
        
        if not screen:
            return {"success": False, "error": "Screen not found"}
        
        self.current_loading = screen_id
        self.loading_progress = 0.0
        self.loading_start_time = time.time()
        
        return {
            "success": True,
            "screen": {
                "screen_id": screen.screen_id,
                "title": screen.title,
                "description": screen.description,
                "tip": random.choice(screen.tips) if screen.tips else "",
                "background_image": screen.background_image
            }
        }
    
    def update_progress(self, progress: float):
        """更新进度"""
        self.loading_progress = min(1.0, max(0.0, progress))
    
    def end_loading(self) -> Dict:
        """结束加载"""
        if not self.current_loading:
            return {"success": False, "error": "No active loading"}
        
        screen = self.loading_screens.get(self.current_loading)
        elapsed = time.time() - self.loading_start_time
        
        # 确保最小显示时间
        if elapsed < (screen.min_display_time if screen else 2.0):
            return {
                "success": True,
                "needs_wait": True,
                "remaining_time": (screen.min_display_time if screen else 2.0) - elapsed
            }
        
        completed_id = self.current_loading
        self.current_loading = None
        self.loading_progress = 0.0
        
        return {
            "success": True,
            "completed_screen": completed_id
        }
    
    def get_current_loading(self) -> Optional[Dict]:
        """获取当前加载状态"""
        if not self.current_loading:
            return None
        
        screen = self.loading_screens.get(self.current_loading)
        
        return {
            "screen_id": self.current_loading,
            "title": screen.title if screen else "",
            "description": screen.description if screen else "",
            "progress": self.loading_progress,
            "elapsed": time.time() - self.loading_start_time
        }


# 全局实例
_camera_shake_instance: Optional[UE5CameraShakeSystem] = None
_loading_screen_instance: Optional[UE5LoadingScreenSystem] = None


def get_camera_shake_system() -> UE5CameraShakeSystem:
    global _camera_shake_instance
    if _camera_shake_instance is None:
        _camera_shake_instance = UE5CameraShakeSystem()
    return _camera_shake_instance


def get_loading_screen_system() -> UE5LoadingScreenSystem:
    global _loading_screen_instance
    if _loading_screen_instance is None:
        _loading_screen_instance = UE5LoadingScreenSystem()
    return _loading_screen_instance


if __name__ == "__main__":
    camera_shake = get_camera_shake_system()
    loading_screen = get_loading_screen_system()
    
    camera_shake.trigger_shake("small_explosion")
    print("Camera offset:", camera_shake.update(0.016))
    
    loading_screen.start_loading("game_start")
    print("Loading state:", loading_screen.get_current_loading())
