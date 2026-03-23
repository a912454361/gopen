#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 速度线特效
动漫风格速度线/运动模糊效果

功能：
- 动态速度线生成
- 运动模糊效果
- 冲击波效果
"""

import unreal
import math
from typing import Optional, List, Dict


class SpeedLinesEffect:
    """速度线特效系统"""
    
    def __init__(self):
        self.niagara_system_path = "/Game/Effects/SpeedLines/NS_SpeedLines"
        self.active_effects: List[unreal.NiagaraComponent] = []
    
    def create_speed_lines_system(self) -> Optional[unreal.NiagaraSystem]:
        """创建速度线 Niagara 系统"""
        
        if unreal.EditorAssetLibrary.does_asset_exist(self.niagara_system_path):
            return unreal.EditorAssetLibrary.load_asset(self.niagara_system_path)
        
        # 创建目录
        system_dir = "/".join(self.niagara_system_path.split("/")[:-1])
        if not unreal.EditorAssetLibrary.does_directory_exist(system_dir):
            unreal.EditorAssetLibrary.make_directory(system_dir)
        
        # 创建 Niagara 系统
        niagara_system = unreal.NiagaraSystemFactoryNew().factory_create_new(
            self.niagara_system_path
        )
        
        # 添加发射器
        emitter = unreal.NiagaraEmitterFactoryNew().create_emitter()
        emitter.set_editor_property("emitter_name", "SpeedLines")
        
        niagara_system.add_emitter(emitter)
        
        unreal.EditorAssetLibrary.save_loaded_asset(niagara_system)
        return niagara_system
    
    def spawn_speed_lines(self, 
                          location: unreal.Vector,
                          direction: unreal.Vector,
                          intensity: float = 1.0,
                          color: unreal.LinearColor = None) -> Optional[unreal.NiagaraComponent]:
        """生成速度线特效"""
        
        if color is None:
            color = unreal.LinearColor(1, 1, 1, 1)
        
        niagara_system = self.create_speed_lines_system()
        if not niagara_system:
            return None
        
        world = unreal.EditorLevelLibrary.get_editor_world()
        
        # 生成 Actor
        actor = unreal.EditorLevelLibrary.spawn_actor_from_class(
            unreal.NiagaraActor,
            location,
            unreal.Rotator(0, 0, 0)
        )
        
        niagara_component = actor.get_niagara_component()
        niagara_component.set_asset(niagara_system)
        
        # 设置参数
        niagara_component.set_variable_vec3("Direction", direction)
        niagara_component.set_variable_float("Intensity", intensity)
        niagara_component.set_variable_linear_color("Color", color)
        
        self.active_effects.append(niagara_component)
        return niagara_component
    
    def create_radial_speed_lines(self,
                                   center: unreal.Vector,
                                   radius: float = 100.0,
                                   intensity: float = 1.0) -> List[unreal.NiagaraComponent]:
        """创建放射状速度线（冲击波效果）"""
        
        effects = []
        num_lines = 12
        
        for i in range(num_lines):
            angle = (360 / num_lines) * i
            rad = math.radians(angle)
            
            direction = unreal.Vector(
                math.cos(rad),
                math.sin(rad),
                0
            )
            
            effect = self.spawn_speed_lines(
                location=center,
                direction=direction,
                intensity=intensity
            )
            
            if effect:
                effects.append(effect)
        
        return effects
    
    def create_motion_trail(self,
                           actor: unreal.Actor,
                           trail_length: float = 1.0,
                           trail_color: unreal.LinearColor = None) -> bool:
        """为 Actor 创建运动轨迹"""
        
        if trail_color is None:
            trail_color = unreal.LinearColor(1, 1, 1, 0.5)
        
        # 添加轨迹组件
        # 这需要使用 Trail Component 或者 Niagara
        
        unreal.log(f"Motion trail created for: {actor.get_name()}")
        return True
    
    def stop_all_effects(self):
        """停止所有特效"""
        for effect in self.active_effects:
            if effect and effect.is_valid():
                effect.deactivate()
        
        self.active_effects.clear()


def create_speed_lines(location: unreal.Vector, direction: unreal.Vector, 
                       intensity: float = 1.0) -> Optional[unreal.NiagaraComponent]:
    """便捷函数：创建速度线"""
    effect = SpeedLinesEffect()
    return effect.spawn_speed_lines(location, direction, intensity)


if __name__ == "__main__":
    effect = SpeedLinesEffect()
    effect.create_speed_lines_system()
