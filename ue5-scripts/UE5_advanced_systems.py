#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 高级系统模块
包含数据资产、Actor组件、蓝图宏库等高级功能

功能：
- 数据资产系统
- Actor组件系统
- 蓝图宏库
- 物理手柄
- 时间轴系统
"""

import json
import time
import math
import random
from typing import Optional, Dict, Any, List, Tuple, Set, Callable
from dataclasses import dataclass, field
from enum import Enum


# ============== 数据资产系统 ==============

@dataclass
class DataAsset:
    """数据资产基类"""
    asset_id: str
    asset_name: str
    asset_type: str
    data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class WeaponData(DataAsset):
    """武器数据"""
    damage: float = 0.0
    attack_speed: float = 1.0
    range: float = 1.0
    durability: int = 100
    element_type: str = "physical"


@dataclass
class CharacterData(DataAsset):
    """角色数据"""
    health: float = 100.0
    mana: float = 50.0
    attack: float = 10.0
    defense: float = 5.0
    speed: float = 1.0


class UE5DataAssetSystem:
    """UE5 数据资产系统"""
    
    def __init__(self):
        self.assets: Dict[str, DataAsset] = {}
        self.asset_cache: Dict[str, Dict] = {}
    
    def register_asset(self, asset: DataAsset):
        """注册数据资产"""
        self.assets[asset.asset_id] = asset
        # 缓存资产数据
        self.asset_cache[asset.asset_id] = asset.data
    
    def get_asset(self, asset_id: str) -> Optional[DataAsset]:
        """获取数据资产"""
        return self.assets.get(asset_id)
    
    def get_asset_data(self, asset_id: str) -> Optional[Dict]:
        """获取资产数据"""
        asset = self.assets.get(asset_id)
        return asset.data if asset else None
    
    def query_assets(self, asset_type: str = None, filter_func: Callable = None) -> List[DataAsset]:
        """查询资产"""
        results = []
        
        for asset in self.assets.values():
            if asset_type and asset.asset_type != asset_type:
                continue
            
            if filter_func and not filter_func(asset):
                continue
            
            results.append(asset)
        
        return results
    
    def load_assets_from_json(self, json_path: str) -> int:
        """从JSON文件加载资产"""
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            count = 0
            for asset_data in data.get('assets', []):
                asset = DataAsset(
                    asset_id=asset_data.get('asset_id'),
                    asset_name=asset_data.get('name'),
                    asset_type=asset_data.get('type'),
                    data=asset_data.get('data', {})
                )
                self.register_asset(asset)
                count += 1
            
            return count
        except Exception as e:
            print(f"Error loading assets: {e}")
            return 0


# ============== Actor组件系统 ==============

class ComponentType(Enum):
    RENDER = "render"
    PHYSICS = "physics"
    AUDIO = "audio"
    AI = "ai"
    ANIMATION = "animation"
    INPUT = "input"


@dataclass
class ActorComponent:
    """Actor组件基类"""
    component_id: str
    component_type: ComponentType
    is_active: bool = True
    owner_id: str = ""


@dataclass
class RenderComponent(ActorComponent):
    """渲染组件"""
    mesh_path: str = ""
    material_path: str = ""
    scale: Tuple[float, float, float] = (1.0, 1.0, 1.0)
    visible: bool = True


@dataclass
class PhysicsComponent(ActorComponent):
    """物理组件"""
    mass: float = 1.0
    is_static: bool = False
    use_gravity: bool = True
    collision_enabled: bool = True


@dataclass
class AudioComponent(ActorComponent):
    """音频组件"""
    sound_path: str = ""
    volume: float = 1.0
    is_looping: bool = False
    is_3d: bool = True


class UE5ActorComponentSystem:
    """UE5 Actor组件系统"""
    
    def __init__(self):
        self.components: Dict[str, ActorComponent] = {}
        self.owner_components: Dict[str, Set[str]] = {}
    
    def attach_component(self, owner_id: str, component: ActorComponent):
        """附加组件"""
        component.owner_id = owner_id
        self.components[component.component_id] = component
        
        if owner_id not in self.owner_components:
            self.owner_components[owner_id] = set()
        
        self.owner_components[owner_id].add(component.component_id)
    
    def detach_component(self, component_id: str):
        """分离组件"""
        component = self.components.get(component_id)
        
        if component and component.owner_id:
            if component.owner_id in self.owner_components:
                self.owner_components[component.owner_id].discard(component_id)
        
        if component_id in self.components:
            del self.components[component_id]
    
    def get_owner_components(self, owner_id: str) -> List[ActorComponent]:
        """获取Actor的所有组件"""
        component_ids = self.owner_components.get(owner_id, set())
        return [self.components[cid] for cid in component_ids if cid in self.components]
    
    def get_components_by_type(self, component_type: ComponentType) -> List[ActorComponent]:
        """按类型获取组件"""
        return [c for c in self.components.values() if c.component_type == component_type]


# ============== 蓝图宏库系统 ==============

class BlueprintMacro:
    """蓝图宏"""
    
    def __init__(self, name: str, params: List[str], body: Callable):
        self.name = name
        self.params = params
        self.body = body
    
    def execute(self, context: Dict, *args) -> Any:
        """执行宏"""
        if len(args) != len(self.params):
            raise ValueError(f"Expected {len(self.params)} arguments, got {len(args)}")
        
        local_context = context.copy()
        for param, arg in zip(self.params, args):
            local_context[param] = arg
        
        return self.body(local_context)


class UE5BlueprintMacroLibrary:
    """UE5 蓝图宏库"""
    
    def __init__(self):
        self.macros: Dict[str, BlueprintMacro] = {}
        self._init_default_macros()
    
    def _init_default_macros(self):
        """初始化默认宏"""
        # 计算距离宏
        self.register_macro(BlueprintMacro(
            "CalculateDistance",
            ["pos1", "pos2"],
            lambda ctx: math.sqrt(
                (ctx["pos1"][0] - ctx["pos2"][0]) ** 2 +
                (ctx["pos1"][1] - ctx["pos2"][1]) ** 2 +
                (ctx["pos1"][2] - ctx["pos2"][2]) ** 2
            )
        ))
        
        # 计算伤害宏
        self.register_macro(BlueprintMacro(
            "CalculateDamage",
            ["base_damage", "attack_power", "defense"],
            lambda ctx: max(1, ctx["base_damage"] + ctx["attack_power"] * 0.5 - ctx["defense"] * 0.3)
        ))
        
        # 格式化时间宏
        self.register_macro(BlueprintMacro(
            "FormatTime",
            ["seconds"],
            lambda ctx: f"{int(ctx['seconds'] // 60)}:{int(ctx['seconds'] % 60):02d}"
        ))
    
    def register_macro(self, macro: BlueprintMacro):
        """注册宏"""
        self.macros[macro.name] = macro
    
    def execute_macro(self, name: str, context: Dict, *args) -> Any:
        """执行宏"""
        macro = self.macros.get(name)
        
        if not macro:
            raise ValueError(f"Macro '{name}' not found")
        
        return macro.execute(context, *args)


# ============== 时间轴系统 ==============

@dataclass
class TimelineTrack:
    """时间轴轨道"""
    track_id: str
    track_name: str
    keyframes: List[Dict] = field(default_factory=list)
    length: float = 1.0


@dataclass
class Timeline:
    """时间轴"""
    timeline_id: str
    name: str
    tracks: Dict[str, TimelineTrack] = field(default_factory=dict)
    length: float = 1.0
    playback_rate: float = 1.0
    is_looping: bool = False


class UE5TimelineSystem:
    """UE5 时间轴系统"""
    
    def __init__(self):
        self.timelines: Dict[str, Timeline] = {}
        self.active_timelines: Dict[str, float] = {}  # timeline_id -> current_time
    
    def create_timeline(self, timeline_id: str, name: str, length: float = 1.0) -> Timeline:
        """创建时间轴"""
        timeline = Timeline(
            timeline_id=timeline_id,
            name=name,
            length=length
        )
        self.timelines[timeline_id] = timeline
        return timeline
    
    def add_track(self, timeline_id: str, track: TimelineTrack):
        """添加轨道"""
        timeline = self.timelines.get(timeline_id)
        
        if timeline:
            timeline.tracks[track.track_id] = track
    
    def play(self, timeline_id: str, loop: bool = False):
        """播放时间轴"""
        if timeline_id in self.timelines:
            self.active_timelines[timeline_id] = 0.0
            self.timelines[timeline_id].is_looping = loop
    
    def stop(self, timeline_id: str):
        """停止时间轴"""
        if timeline_id in self.active_timelines:
            del self.active_timelines[timeline_id]
    
    def update(self, delta_time: float) -> Dict:
        """更新时间轴"""
        results = {}
        
        for timeline_id, current_time in list(self.active_timelines.items()):
            timeline = self.timelines.get(timeline_id)
            
            if not timeline:
                del self.active_timelines[timeline_id]
                continue
            
            new_time = current_time + delta_time * timeline.playback_rate
            
            if new_time >= timeline.length:
                if timeline.is_looping:
                    new_time = new_time % timeline.length
                else:
                    del self.active_timelines[timeline_id]
                    new_time = timeline.length
            
            self.active_timelines[timeline_id] = new_time
            
            # 获取当前帧数据
            track_values = {}
            for track_id, track in timeline.tracks.items():
                value = self._interpolate_keyframes(track, new_time)
                track_values[track_id] = value
            
            results[timeline_id] = {
                "current_time": new_time,
                "progress": new_time / timeline.length,
                "track_values": track_values
            }
        
        return results
    
    def _interpolate_keyframes(self, track: TimelineTrack, time: float) -> Any:
        """插值关键帧"""
        if not track.keyframes:
            return None
        
        # 找到当前时间前后的关键帧
        prev_frame = None
        next_frame = None
        
        for i, keyframe in enumerate(track.keyframes):
            if keyframe["time"] <= time:
                prev_frame = keyframe
            if keyframe["time"] >= time and next_frame is None:
                next_frame = keyframe
        
        if prev_frame is None:
            return track.keyframes[0].get("value")
        
        if next_frame is None or prev_frame == next_frame:
            return prev_frame.get("value")
        
        # 线性插值
        t = (time - prev_frame["time"]) / (next_frame["time"] - prev_frame["time"])
        prev_value = prev_frame.get("value", 0)
        next_value = next_frame.get("value", 0)
        
        if isinstance(prev_value, (int, float)) and isinstance(next_value, (int, float)):
            return prev_value + (next_value - prev_value) * t
        
        return prev_value


# 全局实例
_data_asset_instance: Optional[UE5DataAssetSystem] = None
_actor_component_instance: Optional[UE5ActorComponentSystem] = None
_blueprint_macro_instance: Optional[UE5BlueprintMacroLibrary] = None
_timeline_instance: Optional[UE5TimelineSystem] = None


def get_data_asset_system() -> UE5DataAssetSystem:
    global _data_asset_instance
    if _data_asset_instance is None:
        _data_asset_instance = UE5DataAssetSystem()
    return _data_asset_instance


def get_actor_component_system() -> UE5ActorComponentSystem:
    global _actor_component_instance
    if _actor_component_instance is None:
        _actor_component_instance = UE5ActorComponentSystem()
    return _actor_component_instance


def get_blueprint_macro_library() -> UE5BlueprintMacroLibrary:
    global _blueprint_macro_instance
    if _blueprint_macro_instance is None:
        _blueprint_macro_instance = UE5BlueprintMacroLibrary()
    return _blueprint_macro_instance


def get_timeline_system() -> UE5TimelineSystem:
    global _timeline_instance
    if _timeline_instance is None:
        _timeline_instance = UE5TimelineSystem()
    return _timeline_instance


if __name__ == "__main__":
    data_asset = get_data_asset_system()
    actor_component = get_actor_component_system()
    blueprint_macro = get_blueprint_macro_library()
    timeline = get_timeline_system()
    
    print("Distance:", blueprint_macro.execute_macro("CalculateDistance", {}, (0, 0, 0), (3, 4, 0)))
    
    print("Timeline:", timeline.create_timeline("test", "Test Timeline", 5.0))
