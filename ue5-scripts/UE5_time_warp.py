#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 时间扭曲/变速效果脚本
动漫风格的动态时间控制

功能：
- 时间扭曲效果
- 慢动作/快进
- 冻结帧
- 倒放效果
- 速度渐变
- 变速剪辑
"""

import unreal
import time
import math
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum


class TimeWarpType(Enum):
    SLOW_MOTION = "slow_motion"      # 慢动作
    FAST_FORWARD = "fast_forward"    # 快进
    FREEZE_FRAME = "freeze_frame"    # 冻结帧
    REVERSE = "reverse"              # 倒放
    SPEED_RAMP = "speed_ramp"        # 速度渐变
    ECHO = "echo"                    # 残影效果
    STUTTER = "stutter"              # 卡顿效果


@dataclass
class TimeWarpConfig:
    """时间扭曲配置"""
    warp_type: TimeWarpType
    speed: float = 1.0               # 速度倍率 (0.1 - 10.0)
    duration: float = 1.0            # 效果持续时长
    start_frame: int = 0
    end_frame: int = 100
    ease_in: float = 0.0             # 渐入时间
    ease_out: float = 0.0            # 渐出时间
    intensity: float = 1.0           # 效果强度


class TimeWarpEffect:
    """时间扭曲效果"""
    
    def __init__(self):
        self.active_effects: List[TimeWarpConfig] = []
        self.matinee = None
    
    def create_slow_motion(self, 
                          speed: float = 0.25,
                          duration: float = 3.0,
                          ease_in: float = 0.5) -> TimeWarpConfig:
        """创建慢动作效果"""
        
        config = TimeWarpConfig(
            warp_type=TimeWarpType.SLOW_MOTION,
            speed=speed,
            duration=duration,
            ease_in=ease_in,
        )
        
        self.active_effects.append(config)
        
        # 应用到关卡序列
        self._apply_to_sequence(config)
        
        unreal.log(f"[TimeWarp] Slow motion created: {speed}x for {duration}s")
        
        return config
    
    def create_fast_forward(self,
                           speed: float = 4.0,
                           duration: float = 2.0) -> TimeWarpConfig:
        """创建快进效果"""
        
        config = TimeWarpConfig(
            warp_type=TimeWarpType.FAST_FORWARD,
            speed=speed,
            duration=duration,
        )
        
        self.active_effects.append(config)
        self._apply_to_sequence(config)
        
        unreal.log(f"[TimeWarp] Fast forward created: {speed}x for {duration}s")
        
        return config
    
    def create_freeze_frame(self, 
                           duration: float = 1.0,
                           frame_number: int = None) -> TimeWarpConfig:
        """创建冻结帧效果"""
        
        config = TimeWarpConfig(
            warp_type=TimeWarpType.FREEZE_FRAME,
            speed=0.0,
            duration=duration,
            start_frame=frame_number or 0,
        )
        
        self.active_effects.append(config)
        self._apply_freeze_effect(config)
        
        unreal.log(f"[TimeWarp] Freeze frame created at frame {frame_number}")
        
        return config
    
    def create_reverse_playback(self,
                                frame_range: Tuple[int, int],
                                speed: float = 1.0) -> TimeWarpConfig:
        """创建倒放效果"""
        
        config = TimeWarpConfig(
            warp_type=TimeWarpType.REVERSE,
            speed=-speed,
            start_frame=frame_range[0],
            end_frame=frame_range[1],
        )
        
        self.active_effects.append(config)
        self._apply_reverse_effect(config)
        
        unreal.log(f"[TimeWarp] Reverse playback created: frames {frame_range}")
        
        return config
    
    def create_speed_ramp(self,
                         start_speed: float = 0.5,
                         end_speed: float = 2.0,
                         duration: float = 3.0) -> TimeWarpConfig:
        """创建速度渐变效果"""
        
        config = TimeWarpConfig(
            warp_type=TimeWarpType.SPEED_RAMP,
            duration=duration,
            intensity=(start_speed + end_speed) / 2,
        )
        
        # 存储渐变参数
        config.custom_data = {
            "start_speed": start_speed,
            "end_speed": end_speed,
        }
        
        self.active_effects.append(config)
        self._apply_speed_ramp(config, start_speed, end_speed)
        
        unreal.log(f"[TimeWarp] Speed ramp created: {start_speed}x -> {end_speed}x")
        
        return config
    
    def create_echo_effect(self,
                          echo_count: int = 5,
                          decay: float = 0.5,
                          interval: float = 0.1) -> TimeWarpConfig:
        """创建残影效果"""
        
        config = TimeWarpConfig(
            warp_type=TimeWarpType.ECHO,
            intensity=decay,
        )
        
        config.custom_data = {
            "echo_count": echo_count,
            "interval": interval,
        }
        
        self.active_effects.append(config)
        self._apply_echo_effect(config, echo_count, decay, interval)
        
        unreal.log(f"[TimeWarp] Echo effect created: {echo_count} echoes")
        
        return config
    
    def create_stutter_effect(self,
                             stutter_rate: float = 0.1,
                             duration: float = 2.0) -> TimeWarpConfig:
        """创建卡顿效果"""
        
        config = TimeWarpConfig(
            warp_type=TimeWarpType.STUTTER,
            duration=duration,
        )
        
        config.custom_data = {
            "stutter_rate": stutter_rate,
        }
        
        self.active_effects.append(config)
        self._apply_stutter_effect(config, stutter_rate)
        
        unreal.log(f"[TimeWarp] Stutter effect created: {stutter_rate}s interval")
        
        return config
    
    def _apply_to_sequence(self, config: TimeWarpConfig):
        """应用到关卡序列"""
        
        try:
            # 获取活动序列
            level_sequence = unreal.LevelSequenceEditorBlueprintLibrary.get_focused_level_sequence()
            
            if not level_sequence:
                unreal.log_warning("[TimeWarp] No active sequence found")
                return
            
            # 创建时间扭曲轨道
            # 注意：这需要使用 Sequencer API
            
            # 计算时间缩放
            time_scale = config.speed
            
            # 应用到播放速率
            playback_settings = level_sequence.get_playback_settings()
            # playback_settings.set_playback_rate(time_scale)
            
        except Exception as e:
            unreal.log_error(f"[TimeWarp] Failed to apply effect: {e}")
    
    def _apply_freeze_effect(self, config: TimeWarpConfig):
        """应用冻结效果"""
        
        # 使用 Matinee 或 Sequencer 实现帧冻结
        pass
    
    def _apply_reverse_effect(self, config: TimeWarpConfig):
        """应用倒放效果"""
        
        # 实现倒放逻辑
        pass
    
    def _apply_speed_ramp(self, config: TimeWarpConfig, start: float, end: float):
        """应用速度渐变"""
        
        # 创建缓动曲线
        pass
    
    def _apply_echo_effect(self, config: TimeWarpConfig, count: int, decay: float, interval: float):
        """应用残影效果"""
        
        # 创建多层图像叠加
        pass
    
    def _apply_stutter_effect(self, config: TimeWarpConfig, rate: float):
        """应用卡顿效果"""
        
        # 实现卡顿播放
        pass
    
    def remove_effect(self, config: TimeWarpConfig):
        """移除效果"""
        
        if config in self.active_effects:
            self.active_effects.remove(config)
    
    def clear_all_effects(self):
        """清除所有效果"""
        
        self.active_effects.clear()
        unreal.log("[TimeWarp] All effects cleared")


class TimeWarpPresets:
    """时间扭曲预设"""
    
    ANIME_PRESETS = {
        # 战斗场景预设
        "bullet_time": {
            "type": TimeWarpType.SLOW_MOTION,
            "speed": 0.1,
            "duration": 2.0,
            "ease_in": 0.3,
        },
        
        "final_blow": {
            "type": TimeWarpType.SLOW_MOTION,
            "speed": 0.2,
            "duration": 1.5,
            "ease_in": 0.2,
            "ease_out": 0.1,
        },
        
        "power_up": {
            "type": TimeWarpType.SPEED_RAMP,
            "start_speed": 0.5,
            "end_speed": 2.0,
            "duration": 3.0,
        },
        
        "super_speed": {
            "type": TimeWarpType.FAST_FORWARD,
            "speed": 8.0,
            "duration": 0.5,
        },
        
        # 情感场景预设
        "emotional_pause": {
            "type": TimeWarpType.FREEZE_FRAME,
            "duration": 2.0,
        },
        
        "flashback": {
            "type": TimeWarpType.REVERSE,
            "speed": 1.0,
        },
        
        # 特殊效果
        "glitch_stutter": {
            "type": TimeWarpType.STUTTER,
            "stutter_rate": 0.05,
            "duration": 1.0,
        },
        
        "ghost_echo": {
            "type": TimeWarpType.ECHO,
            "echo_count": 8,
            "decay": 0.3,
            "interval": 0.08,
        },
    }
    
    @classmethod
    def apply_preset(cls, preset_name: str) -> Optional[TimeWarpConfig]:
        """应用预设"""
        
        if preset_name not in cls.ANIME_PRESETS:
            unreal.log_error(f"[TimeWarp] Preset not found: {preset_name}")
            return None
        
        preset = cls.ANIME_PRESETS[preset_name]
        effect = TimeWarpEffect()
        
        warp_type = preset["type"]
        
        if warp_type == TimeWarpType.SLOW_MOTION:
            return effect.create_slow_motion(
                speed=preset.get("speed", 0.25),
                duration=preset.get("duration", 1.0),
                ease_in=preset.get("ease_in", 0.0),
            )
        elif warp_type == TimeWarpType.FAST_FORWARD:
            return effect.create_fast_forward(
                speed=preset.get("speed", 4.0),
                duration=preset.get("duration", 1.0),
            )
        elif warp_type == TimeWarpType.FREEZE_FRAME:
            return effect.create_freeze_frame(
                duration=preset.get("duration", 1.0),
            )
        elif warp_type == TimeWarpType.SPEED_RAMP:
            return effect.create_speed_ramp(
                start_speed=preset.get("start_speed", 0.5),
                end_speed=preset.get("end_speed", 2.0),
                duration=preset.get("duration", 2.0),
            )
        elif warp_type == TimeWarpType.STUTTER:
            return effect.create_stutter_effect(
                stutter_rate=preset.get("stutter_rate", 0.1),
                duration=preset.get("duration", 1.0),
            )
        elif warp_type == TimeWarpType.ECHO:
            return effect.create_echo_effect(
                echo_count=preset.get("echo_count", 5),
                decay=preset.get("decay", 0.5),
                interval=preset.get("interval", 0.1),
            )
        
        return None
    
    @classmethod
    def list_presets(cls) -> List[str]:
        """列出所有预设"""
        return list(cls.ANIME_PRESETS.keys())


class BatchTimeWarp:
    """批量时间扭曲"""
    
    def __init__(self):
        self.effect = TimeWarpEffect()
        self.batch_queue: List[Dict] = []
    
    def add_scene_warp(self,
                       scene_name: str,
                       preset_name: str,
                       frame_start: int,
                       frame_end: int) -> str:
        """添加场景时间扭曲"""
        
        task_id = f"warp_{int(time.time())}_{len(self.batch_queue)}"
        
        self.batch_queue.append({
            "id": task_id,
            "scene": scene_name,
            "preset": preset_name,
            "frames": (frame_start, frame_end),
            "status": "pending",
        })
        
        return task_id
    
    def process_batch(self) -> Dict[str, Any]:
        """处理批量任务"""
        
        results = {
            "total": len(self.batch_queue),
            "completed": 0,
            "failed": 0,
            "details": [],
        }
        
        for task in self.batch_queue:
            try:
                config = TimeWarpPresets.apply_preset(task["preset"])
                
                if config:
                    task["status"] = "completed"
                    results["completed"] += 1
                else:
                    task["status"] = "failed"
                    results["failed"] += 1
                
            except Exception as e:
                task["status"] = "failed"
                task["error"] = str(e)
                results["failed"] += 1
            
            results["details"].append(task)
        
        return results


# 便捷函数
def create_bullet_time(duration: float = 2.0) -> TimeWarpConfig:
    """创建子弹时间效果"""
    effect = TimeWarpEffect()
    return effect.create_slow_motion(speed=0.1, duration=duration, ease_in=0.3)


def create_super_speed(duration: float = 0.5) -> TimeWarpConfig:
    """创建超速效果"""
    effect = TimeWarpEffect()
    return effect.create_fast_forward(speed=8.0, duration=duration)


def create_freeze_frame(duration: float = 2.0) -> TimeWarpConfig:
    """创建冻结帧"""
    effect = TimeWarpEffect()
    return effect.create_freeze_frame(duration=duration)


def apply_anime_preset(preset_name: str) -> Optional[TimeWarpConfig]:
    """应用动漫预设"""
    return TimeWarpPresets.apply_preset(preset_name)


if __name__ == "__main__":
    # 列出所有预设
    presets = TimeWarpPresets.list_presets()
    print(f"Available presets: {presets}")
    
    # 应用子弹时间
    bullet_time = create_bullet_time(2.0)
    print(f"Bullet time created: {bullet_time}")
    
    # 应用预设
    final_blow = apply_anime_preset("final_blow")
    print(f"Final blow effect: {final_blow}")
