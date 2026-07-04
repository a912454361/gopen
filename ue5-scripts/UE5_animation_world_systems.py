#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 动画与系统模块
包含动画蒙太奇、世界分区、物理模拟、地形等系统

功能：
- 动画蒙太奇系统
- 世界分区系统
- 物理模拟
- 地形系统
"""

import json
import time
import math
import random
from typing import Optional, Dict, Any, List, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum


# ============== 动画蒙太奇系统 ==============

class AnimationType(Enum):
    IDLE = "idle"
    WALK = "walk"
    RUN = "run"
    JUMP = "jump"
    ATTACK = "attack"
    SKILL = "skill"
    DEATH = "death"
    INTERACT = "interact"


@dataclass
class AnimationMontage:
    """动画蒙太奇"""
    montage_id: str
    name: str
    animation_type: AnimationType
    duration: float
    sections: List[Dict] = field(default_factory=list)
    notifiers: List[Dict] = field(default_factory=list)
    blend_in_time: float = 0.2
    blend_out_time: float = 0.2


@dataclass
class AnimationState:
    """动画状态"""
    current_montage: Optional[str] = None
    current_time: float = 0.0
    is_playing: bool = False
    is_looping: bool = False


class UE5AnimationMontageSystem:
    """UE5 动画蒙太奇系统"""
    
    def __init__(self):
        self.montages: Dict[str, AnimationMontage] = {}
        self.entity_states: Dict[str, AnimationState] = {}
        self._init_default_montages()
    
    def _init_default_montages(self):
        """初始化默认动画"""
        default_montages = [
            AnimationMontage("idle", "待机", AnimationType.IDLE, 3.0, is_looping=True),
            AnimationMontage("walk", "行走", AnimationType.WALK, 1.0, is_looping=True),
            AnimationMontage("run", "奔跑", AnimationType.RUN, 0.8, is_looping=True),
            AnimationMontage("jump", "跳跃", AnimationType.JUMP, 0.5,
                           sections=[{"name": "start", "time": 0.0}, {"name": "apex", "time": 0.25}, {"name": "land", "time": 0.5}]),
            AnimationMontage("attack_1", "攻击1", AnimationType.ATTACK, 0.8,
                           notifiers=[{"name": "hit", "time": 0.3}, {"name": "effect", "time": 0.35}]),
            AnimationMontage("skill_1", "技能1", AnimationType.SKILL, 1.5,
                           notifiers=[{"name": "cast", "time": 0.5}, {"name": "impact", "time": 1.0}]),
            AnimationMontage("death", "死亡", AnimationType.DEATH, 2.0),
        ]
        
        for montage in default_montages:
            self.montages[montage.montage_id] = montage
    
    def play_montage(self, entity_id: str, montage_id: str, loop: bool = False) -> Dict:
        """播放动画蒙太奇"""
        montage = self.montages.get(montage_id)
        
        if not montage:
            return {"success": False, "error": "Montage not found"}
        
        if entity_id not in self.entity_states:
            self.entity_states[entity_id] = AnimationState()
        
        state = self.entity_states[entity_id]
        state.current_montage = montage_id
        state.current_time = 0.0
        state.is_playing = True
        state.is_looping = loop
        
        return {
            "success": True,
            "montage_id": montage_id,
            "duration": montage.duration
        }
    
    def stop_montage(self, entity_id: str) -> Dict:
        """停止动画"""
        if entity_id not in self.entity_states:
            return {"success": False, "error": "No active animation"}
        
        state = self.entity_states[entity_id]
        state.is_playing = False
        
        return {"success": True}
    
    def update(self, entity_id: str, delta_time: float) -> Dict:
        """更新动画"""
        if entity_id not in self.entity_states:
            return {}
        
        state = self.entity_states[entity_id]
        
        if not state.is_playing or not state.current_montage:
            return {}
        
        montage = self.montages.get(state.current_montage)
        
        if not montage:
            return {}
        
        state.current_time += delta_time
        
        # 检查动画结束
        if state.current_time >= montage.duration:
            if state.is_looping:
                state.current_time = state.current_time % montage.duration
            else:
                state.is_playing = False
                state.current_time = montage.duration
        
        # 获取当前通知器
        active_notifiers = []
        for notifier in montage.notifiers:
            if abs(state.current_time - notifier["time"]) < delta_time:
                active_notifiers.append(notifier)
        
        return {
            "montage_id": state.current_montage,
            "current_time": state.current_time,
            "progress": state.current_time / montage.duration,
            "active_notifiers": active_notifiers
        }


# ============== 世界分区系统 ==============

@dataclass
class WorldPartitionCell:
    """世界分区单元格"""
    cell_id: str
    bounds: Tuple[float, float, float, float]  # minX, minY, maxX, maxY
    loaded: bool = False
    actors: List[str] = field(default_factory=list)


class UE5WorldPartitionSystem:
    """UE5 世界分区系统"""
    
    def __init__(self):
        self.cells: Dict[str, WorldPartitionCell] = {}
        self.cell_size: float = 1000.0
        self.load_range: float = 2000.0
    
    def get_cell_id(self, position: Tuple[float, float, float]) -> str:
        """获取位置所在的单元格ID"""
        cell_x = int(position[0] / self.cell_size)
        cell_y = int(position[1] / self.cell_size)
        return f"cell_{cell_x}_{cell_y}"
    
    def register_actor(self, actor_id: str, position: Tuple[float, float, float]):
        """注册Actor"""
        cell_id = self.get_cell_id(position)
        
        if cell_id not in self.cells:
            self._create_cell(cell_id, position)
        
        self.cells[cell_id].actors.append(actor_id)
    
    def _create_cell(self, cell_id: str, position: Tuple[float, float, float]):
        """创建单元格"""
        cell_x = int(position[0] / self.cell_size)
        cell_y = int(position[1] / self.cell_size)
        
        bounds = (
            cell_x * self.cell_size,
            cell_y * self.cell_size,
            (cell_x + 1) * self.cell_size,
            (cell_y + 1) * self.cell_size
        )
        
        self.cells[cell_id] = WorldPartitionCell(cell_id=cell_id, bounds=bounds)
    
    def update_loading(self, player_position: Tuple[float, float, float]) -> Dict:
        """更新加载状态"""
        loaded_cells = []
        unloaded_cells = []
        
        for cell_id, cell in self.cells.items():
            cell_center = (
                (cell.bounds[0] + cell.bounds[2]) / 2,
                (cell.bounds[1] + cell.bounds[3]) / 2,
                0
            )
            
            distance = math.sqrt(
                (cell_center[0] - player_position[0]) ** 2 +
                (cell_center[1] - player_position[1]) ** 2
            )
            
            if distance <= self.load_range:
                if not cell.loaded:
                    cell.loaded = True
                    loaded_cells.append(cell_id)
            else:
                if cell.loaded:
                    cell.loaded = False
                    unloaded_cells.append(cell_id)
        
        return {
            "loaded_cells": loaded_cells,
            "unloaded_cells": unloaded_cells
        }


# ============== 物理模拟系统 ==============

@dataclass
class PhysicsBody:
    """物理体"""
    body_id: str
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    velocity: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    acceleration: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    mass: float = 1.0
    friction: float = 0.1
    restitution: float = 0.3
    is_static: bool = False
    use_gravity: bool = True


class UE5PhysicsSystem:
    """UE5 物理模拟系统"""
    
    def __init__(self):
        self.bodies: Dict[str, PhysicsBody] = {}
        self.gravity = (0.0, 0.0, -9.8)
    
    def create_body(self, body_id: str, **kwargs) -> PhysicsBody:
        """创建物理体"""
        body = PhysicsBody(body_id=body_id, **kwargs)
        self.bodies[body_id] = body
        return body
    
    def apply_force(self, body_id: str, force: Tuple[float, float, float]):
        """施加力"""
        body = self.bodies.get(body_id)
        
        if body and not body.is_static:
            ax = force[0] / body.mass
            ay = force[1] / body.mass
            az = force[2] / body.mass
            
            body.acceleration = (
                body.acceleration[0] + ax,
                body.acceleration[1] + ay,
                body.acceleration[2] + az
            )
    
    def update(self, delta_time: float):
        """更新物理模拟"""
        for body in self.bodies.values():
            if body.is_static:
                continue
            
            # 应用重力
            if body.use_gravity:
                body.acceleration = (
                    body.acceleration[0] + self.gravity[0],
                    body.acceleration[1] + self.gravity[1],
                    body.acceleration[2] + self.gravity[2]
                )
            
            # 更新速度
            body.velocity = (
                body.velocity[0] + body.acceleration[0] * delta_time,
                body.velocity[1] + body.acceleration[1] * delta_time,
                body.velocity[2] + body.acceleration[2] * delta_time
            )
            
            # 应用摩擦
            body.velocity = (
                body.velocity[0] * (1 - body.friction),
                body.velocity[1] * (1 - body.friction),
                body.velocity[2] * (1 - body.friction)
            )
            
            # 更新位置
            body.position = (
                body.position[0] + body.velocity[0] * delta_time,
                body.position[1] + body.velocity[1] * delta_time,
                body.position[2] + body.velocity[2] * delta_time
            )
            
            # 重置加速度
            body.acceleration = (0.0, 0.0, 0.0)


# ============== 地形系统 ==============

@dataclass
class TerrainChunk:
    """地形块"""
    chunk_id: str
    position: Tuple[int, int]
    size: int = 100
    height_data: List[List[float]] = field(default_factory=list)
    material_data: List[List[int]] = field(default_factory=list)


class UE5TerrainSystem:
    """UE5 地形系统"""
    
    def __init__(self):
        self.chunks: Dict[str, TerrainChunk] = {}
        self.chunk_size = 100
        self.height_scale = 100.0
    
    def generate_chunk(self, chunk_x: int, chunk_y: int, seed: int = None) -> TerrainChunk:
        """生成地形块"""
        chunk_id = f"chunk_{chunk_x}_{chunk_y}"
        
        height_data = []
        material_data = []
        
        random.seed(seed or (chunk_x * 10000 + chunk_y))
        
        for y in range(self.chunk_size):
            height_row = []
            material_row = []
            
            for x in range(self.chunk_size):
                # 简单的噪声生成
                height = self._generate_height(
                    chunk_x * self.chunk_size + x,
                    chunk_y * self.chunk_size + y
                )
                height_row.append(height)
                
                # 根据高度确定材质
                if height < 20:
                    material = 0  # 水
                elif height < 30:
                    material = 1  # 沙地
                elif height < 60:
                    material = 2  # 草地
                elif height < 80:
                    material = 3  # 岩石
                else:
                    material = 4  # 雪
                
                material_row.append(material)
            
            height_data.append(height_row)
            material_data.append(material_row)
        
        chunk = TerrainChunk(
            chunk_id=chunk_id,
            position=(chunk_x, chunk_y),
            size=self.chunk_size,
            height_data=height_data,
            material_data=material_data
        )
        
        self.chunks[chunk_id] = chunk
        return chunk
    
    def _generate_height(self, world_x: int, world_y: int) -> float:
        """生成高度值"""
        # 简单的多层噪声
        height = 0.0
        
        # 大尺度地形
        height += math.sin(world_x * 0.01) * math.cos(world_y * 0.01) * 30
        # 中等细节
        height += math.sin(world_x * 0.05) * math.cos(world_y * 0.05) * 10
        # 小细节
        height += random.uniform(-2, 2)
        
        return max(0, min(100, height + 50))
    
    def get_height(self, world_x: float, world_y: float) -> float:
        """获取世界坐标处的高度"""
        chunk_x = int(world_x / self.chunk_size)
        chunk_y = int(world_y / self.chunk_size)
        
        chunk_id = f"chunk_{chunk_x}_{chunk_y}"
        chunk = self.chunks.get(chunk_id)
        
        if not chunk:
            chunk = self.generate_chunk(chunk_x, chunk_y)
        
        local_x = int(world_x) % self.chunk_size
        local_y = int(world_y) % self.chunk_size
        
        if 0 <= local_x < self.chunk_size and 0 <= local_y < self.chunk_size:
            return chunk.height_data[local_y][local_x]
        
        return 0.0


# 全局实例
_animation_instance: Optional[UE5AnimationMontageSystem] = None
_world_partition_instance: Optional[UE5WorldPartitionSystem] = None
_physics_instance: Optional[UE5PhysicsSystem] = None
_terrain_instance: Optional[UE5TerrainSystem] = None


def get_animation_montage_system() -> UE5AnimationMontageSystem:
    global _animation_instance
    if _animation_instance is None:
        _animation_instance = UE5AnimationMontageSystem()
    return _animation_instance


def get_world_partition_system() -> UE5WorldPartitionSystem:
    global _world_partition_instance
    if _world_partition_instance is None:
        _world_partition_instance = UE5WorldPartitionSystem()
    return _world_partition_instance


def get_physics_system() -> UE5PhysicsSystem:
    global _physics_instance
    if _physics_instance is None:
        _physics_instance = UE5PhysicsSystem()
    return _physics_instance


def get_terrain_system() -> UE5TerrainSystem:
    global _terrain_instance
    if _terrain_instance is None:
        _terrain_instance = UE5TerrainSystem()
    return _terrain_instance


if __name__ == "__main__":
    animation = get_animation_montage_system()
    world_partition = get_world_partition_system()
    physics = get_physics_system()
    terrain = get_terrain_system()
    
    print("Animation:", animation.play_montage("player1", "attack_1"))
    print("Physics body:", physics.create_body("box1"))
    print("Terrain height:", terrain.get_height(150, 150))
