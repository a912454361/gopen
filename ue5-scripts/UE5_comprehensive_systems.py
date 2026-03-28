#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 综合系统模块
包含游戏标签、世界构成、音频、骨骼动画、材质、对象池等系统

功能：
- 游戏标签系统
- 世界构成系统
- 音频组件
- 骨骼LOD
- 材质实例
- 对象池
- 软引用
- 碰撞响应
- 委托系统
- 技能系统
- 状态动画
- 流送体积
- 程序化植被
- 蓝图接口
- C++集成
"""

import json
import time
import math
import random
import hashlib
from typing import Optional, Dict, Any, List, Tuple, Set, Callable, TypeVar, Generic
from dataclasses import dataclass, field
from enum import Enum


# ============== 游戏标签系统 ==============

class GameTag(Enum):
    PLAYER = "player"
    ENEMY = "enemy"
    NPC = "npc"
    INTERACTABLE = "interactable"
    ITEM = "item"
    QUEST = "quest"
    DUNGEON = "dungeon"
    BOSS = "boss"


@dataclass
class TaggedObject:
    """标签对象"""
    object_id: str
    tags: Set[str] = field(default_factory=set)
    
    def add_tag(self, tag: str):
        self.tags.add(tag)
    
    def remove_tag(self, tag: str):
        self.tags.discard(tag)
    
    def has_tag(self, tag: str) -> bool:
        return tag in self.tags
    
    def has_any_tags(self, tags: Set[str]) -> bool:
        return bool(self.tags & tags)
    
    def has_all_tags(self, tags: Set[str]) -> bool:
        return tags.issubset(self.tags)


class UE5GameTagSystem:
    """UE5 游戏标签系统"""
    
    def __init__(self):
        self.tagged_objects: Dict[str, TaggedObject] = {}
        self.tag_index: Dict[str, Set[str]] = {}  # tag -> object_ids
    
    def register_object(self, object_id: str, tags: Set[str] = None):
        """注册对象"""
        obj = TaggedObject(object_id=object_id, tags=tags or set())
        self.tagged_objects[object_id] = obj
        
        for tag in obj.tags:
            if tag not in self.tag_index:
                self.tag_index[tag] = set()
            self.tag_index[tag].add(object_id)
    
    def add_tag(self, object_id: str, tag: str):
        """添加标签"""
        obj = self.tagged_objects.get(object_id)
        
        if obj:
            obj.add_tag(tag)
            
            if tag not in self.tag_index:
                self.tag_index[tag] = set()
            self.tag_index[tag].add(object_id)
    
    def remove_tag(self, object_id: str, tag: str):
        """移除标签"""
        obj = self.tagged_objects.get(object_id)
        
        if obj:
            obj.remove_tag(tag)
            
            if tag in self.tag_index:
                self.tag_index[tag].discard(object_id)
    
    def query_by_tag(self, tag: str) -> List[str]:
        """按标签查询"""
        return list(self.tag_index.get(tag, set()))
    
    def query_by_any_tags(self, tags: Set[str]) -> List[str]:
        """查询包含任一标签的对象"""
        result = set()
        for tag in tags:
            result.update(self.tag_index.get(tag, set()))
        return list(result)
    
    def query_by_all_tags(self, tags: Set[str]) -> List[str]:
        """查询包含所有标签的对象"""
        result = []
        for obj_id, obj in self.tagged_objects.items():
            if obj.has_all_tags(tags):
                result.append(obj_id)
        return result


# ============== 对象池系统 ==============

T = TypeVar('T')


@dataclass
class PooledObject(Generic[T]):
    """池化对象"""
    object: T
    is_active: bool = False
    last_used_time: float = 0.0


class UE5ObjectPool(Generic[T]):
    """UE5 对象池"""
    
    def __init__(self, factory: Callable[[], T], initial_size: int = 10, max_size: int = 100):
        self.factory = factory
        self.max_size = max_size
        self.pool: List[PooledObject[T]] = []
        
        # 预创建对象
        for _ in range(initial_size):
            obj = self.factory()
            self.pool.append(PooledObject(object=obj, is_active=False))
    
    def acquire(self) -> Optional[T]:
        """获取对象"""
        # 查找空闲对象
        for pooled in self.pool:
            if not pooled.is_active:
                pooled.is_active = True
                pooled.last_used_time = time.time()
                return pooled.object
        
        # 创建新对象
        if len(self.pool) < self.max_size:
            obj = self.factory()
            pooled = PooledObject(object=obj, is_active=True, last_used_time=time.time())
            self.pool.append(pooled)
            return obj
        
        return None
    
    def release(self, obj: T):
        """释放对象"""
        for pooled in self.pool:
            if pooled.object == obj:
                pooled.is_active = False
                break
    
    def release_all(self):
        """释放所有对象"""
        for pooled in self.pool:
            pooled.is_active = False
    
    def cleanup_inactive(self, max_age: float = 60.0):
        """清理长时间未使用的对象"""
        current_time = time.time()
        self.pool = [p for p in self.pool 
                     if p.is_active or (current_time - p.last_used_time) < max_age]


# ============== 委托系统 ==============

class UE5Delegate:
    """UE5 委托系统"""
    
    def __init__(self):
        self.handlers: Dict[str, List[Callable]] = {}
    
    def bind(self, event_name: str, handler: Callable) -> str:
        """绑定事件处理器"""
        if event_name not in self.handlers:
            self.handlers[event_name] = []
        
        handler_id = f"{event_name}_{len(self.handlers[event_name])}_{int(time.time() * 1000)}"
        self.handlers[event_name].append((handler_id, handler))
        
        return handler_id
    
    def unbind(self, event_name: str, handler_id: str):
        """解绑事件处理器"""
        if event_name in self.handlers:
            self.handlers[event_name] = [
                (hid, h) for hid, h in self.handlers[event_name] if hid != handler_id
            ]
    
    def broadcast(self, event_name: str, *args, **kwargs):
        """广播事件"""
        if event_name in self.handlers:
            for handler_id, handler in self.handlers[event_name]:
                try:
                    handler(*args, **kwargs)
                except Exception as e:
                    print(f"Handler error: {e}")
    
    def broadcast_async(self, event_name: str, *args, **kwargs):
        """异步广播事件"""
        import threading
        
        if event_name in self.handlers:
            for handler_id, handler in self.handlers[event_name]:
                thread = threading.Thread(target=handler, args=args, kwargs=kwargs)
                thread.start()


# ============== 技能系统 ==============

class SkillCategory(Enum):
    ATTACK = "attack"
    DEFENSE = "defense"
    SUPPORT = "support"
    PASSIVE = "passive"
    ULTIMATE = "ultimate"


@dataclass
class SkillDefinition:
    """技能定义"""
    skill_id: str
    name: str
    category: SkillCategory
    cooldown: float
    mana_cost: float
    range: float
    cast_time: float
    description: str = ""
    damage: float = 0.0
    healing: float = 0.0
    buffs: List[str] = field(default_factory=list)
    requirements: Dict[str, Any] = field(default_factory=dict)


class UE5SkillSystem:
    """UE5 技能系统"""
    
    def __init__(self):
        self.skills: Dict[str, SkillDefinition] = {}
        self.user_skills: Dict[str, Set[str]] = {}
        self.user_cooldowns: Dict[str, Dict[str, float]] = {}
        self._init_default_skills()
    
    def _init_default_skills(self):
        """初始化默认技能"""
        default_skills = [
            SkillDefinition("fireball", "火球术", SkillCategory.ATTACK, 5.0, 20.0, 15.0, 1.0,
                          "发射一个火球造成伤害", damage=50.0),
            SkillDefinition("heal", "治愈术", SkillCategory.SUPPORT, 10.0, 30.0, 5.0, 2.0,
                          "治疗目标", healing=100.0),
            SkillDefinition("shield", "护盾", SkillCategory.DEFENSE, 15.0, 40.0, 0.0, 0.5,
                          "生成护盾保护自己", buffs=["shield"]),
            SkillDefinition("rage", "狂暴", SkillCategory.ULTIMATE, 60.0, 50.0, 0.0, 1.0,
                          "进入狂暴状态，大幅提升攻击力", buffs=["damage_boost", "speed_boost"]),
        ]
        
        for skill in default_skills:
            self.skills[skill.skill_id] = skill
    
    def learn_skill(self, user_id: str, skill_id: str) -> bool:
        """学习技能"""
        if skill_id not in self.skills:
            return False
        
        if user_id not in self.user_skills:
            self.user_skills[user_id] = set()
        
        self.user_skills[user_id].add(skill_id)
        return True
    
    def cast_skill(self, user_id: str, skill_id: str, current_mana: float) -> Dict:
        """施放技能"""
        skill = self.skills.get(skill_id)
        
        if not skill:
            return {"success": False, "error": "Skill not found"}
        
        if user_id not in self.user_skills or skill_id not in self.user_skills[user_id]:
            return {"success": False, "error": "Skill not learned"}
        
        if current_mana < skill.mana_cost:
            return {"success": False, "error": "Not enough mana"}
        
        cooldowns = self.user_cooldowns.get(user_id, {})
        if skill_id in cooldowns and cooldowns[skill_id] > time.time():
            return {"success": False, "error": "Skill on cooldown"}
        
        # 应用冷却
        if user_id not in self.user_cooldowns:
            self.user_cooldowns[user_id] = {}
        
        self.user_cooldowns[user_id][skill_id] = time.time() + skill.cooldown
        
        return {
            "success": True,
            "skill_id": skill_id,
            "damage": skill.damage,
            "healing": skill.healing,
            "buffs": skill.buffs,
            "cast_time": skill.cast_time
        }
    
    def get_user_skills(self, user_id: str) -> List[Dict]:
        """获取用户技能列表"""
        learned_skill_ids = self.user_skills.get(user_id, set())
        cooldowns = self.user_cooldowns.get(user_id, {})
        current_time = time.time()
        
        skills = []
        for skill_id in learned_skill_ids:
            skill = self.skills.get(skill_id)
            if skill:
                cooldown_remaining = max(0, cooldowns.get(skill_id, 0) - current_time)
                skills.append({
                    "skill_id": skill.skill_id,
                    "name": skill.name,
                    "category": skill.category.value,
                    "cooldown": skill.cooldown,
                    "cooldown_remaining": cooldown_remaining,
                    "mana_cost": skill.mana_cost,
                    "description": skill.description
                })
        
        return skills


# ============== 流送体积系统 ==============

@dataclass
class StreamingVolume:
    """流送体积"""
    volume_id: str
    bounds: Tuple[float, float, float, float, float, float]  # minX, minY, minZ, maxX, maxY, maxZ
    level_names: List[str] = field(default_factory=list)
    is_loaded: bool = False


class UE5StreamingVolumeSystem:
    """UE5 流送体积系统"""
    
    def __init__(self):
        self.volumes: Dict[str, StreamingVolume] = {}
    
    def create_volume(self, volume_id: str, bounds: Tuple[float, float, float, float, float, float],
                      level_names: List[str]) -> StreamingVolume:
        """创建流送体积"""
        volume = StreamingVolume(
            volume_id=volume_id,
            bounds=bounds,
            level_names=level_names
        )
        self.volumes[volume_id] = volume
        return volume
    
    def update(self, player_position: Tuple[float, float, float]) -> Dict:
        """更新流送状态"""
        changes = {"loaded": [], "unloaded": []}
        
        for volume in self.volumes.values():
            in_volume = self._is_point_in_volume(player_position, volume.bounds)
            
            if in_volume and not volume.is_loaded:
                volume.is_loaded = True
                changes["loaded"].extend(volume.level_names)
            elif not in_volume and volume.is_loaded:
                volume.is_loaded = False
                changes["unloaded"].extend(volume.level_names)
        
        return changes
    
    def _is_point_in_volume(self, point: Tuple[float, float, float],
                            bounds: Tuple[float, float, float, float, float, float]) -> bool:
        """检查点是否在体积内"""
        return (bounds[0] <= point[0] <= bounds[3] and
                bounds[1] <= point[1] <= bounds[4] and
                bounds[2] <= point[2] <= bounds[5])


# ============== 程序化植被系统 ==============

@dataclass
class VegetationType:
    """植被类型"""
    type_id: str
    name: str
    mesh_path: str
    min_scale: float = 0.8
    max_scale: float = 1.2
    spawn_density: float = 0.1
    height_range: Tuple[float, float] = (0.0, 100.0)
    slope_range: Tuple[float, float] = (0.0, 45.0)


class UE5ProceduralVegetationSystem:
    """UE5 程序化植被系统"""
    
    def __init__(self):
        self.vegetation_types: Dict[str, VegetationType] = {}
        self.spawned_vegetation: Dict[str, List[Dict]] = {}
        self._init_default_vegetation()
    
    def _init_default_vegetation(self):
        """初始化默认植被"""
        default_vegetation = [
            VegetationType("tree_oak", "橡树", "tree_oak_mesh", 0.8, 1.2, 0.02, (20.0, 60.0)),
            VegetationType("tree_pine", "松树", "tree_pine_mesh", 0.7, 1.3, 0.03, (30.0, 80.0)),
            VegetationType("bush", "灌木", "bush_mesh", 0.5, 1.5, 0.1, (10.0, 50.0)),
            VegetationType("grass", "草", "grass_mesh", 0.3, 0.7, 0.5, (0.0, 40.0)),
        ]
        
        for veg in default_vegetation:
            self.vegetation_types[veg.type_id] = veg
    
    def generate_vegetation(self, chunk_id: str, bounds: Tuple[float, float, float, float],
                            height_func: Callable[[float, float], float]) -> List[Dict]:
        """生成植被"""
        vegetation = []
        
        for veg_type in self.vegetation_types.values():
            count = int((bounds[2] - bounds[0]) * (bounds[3] - bounds[1]) * veg_type.spawn_density)
            
            for _ in range(count):
                x = random.uniform(bounds[0], bounds[2])
                y = random.uniform(bounds[1], bounds[3])
                height = height_func(x, y)
                
                if veg_type.height_range[0] <= height <= veg_type.height_range[1]:
                    scale = random.uniform(veg_type.min_scale, veg_type.max_scale)
                    rotation = random.uniform(0, 360)
                    
                    vegetation.append({
                        "type_id": veg_type.type_id,
                        "position": (x, y, height),
                        "scale": scale,
                        "rotation": rotation,
                        "mesh_path": veg_type.mesh_path
                    })
        
        self.spawned_vegetation[chunk_id] = vegetation
        return vegetation
    
    def remove_vegetation(self, chunk_id: str):
        """移除植被"""
        if chunk_id in self.spawned_vegetation:
            del self.spawned_vegetation[chunk_id]


# ============== 蓝图接口系统 ==============

class BlueprintInterface:
    """蓝图接口"""
    
    def __init__(self, interface_name: str):
        self.interface_name = interface_name
        self.functions: Dict[str, Callable] = {}
    
    def register_function(self, function_name: str, implementation: Callable):
        """注册函数实现"""
        self.functions[function_name] = implementation
    
    def call_function(self, function_name: str, *args, **kwargs) -> Any:
        """调用接口函数"""
        func = self.functions.get(function_name)
        
        if func:
            return func(*args, **kwargs)
        
        raise NotImplementedError(f"Function '{function_name}' not implemented in interface '{self.interface_name}'")


# ============== C++集成接口 ==============

class UE5CppIntegration:
    """UE5 C++集成接口"""
    
    @staticmethod
    def export_to_cpp(data: Dict) -> str:
        """导出数据为C++格式"""
        lines = ["// Auto-generated C++ code"]
        
        for key, value in data.items():
            if isinstance(value, str):
                lines.append(f'std::string {key} = "{value}";')
            elif isinstance(value, (int, float)):
                lines.append(f'float {key} = {value};')
            elif isinstance(value, bool):
                lines.append(f'bool {key} = {"true" if value else "false"};')
            elif isinstance(value, list):
                lines.append(f'std::vector<float> {key} = {{{", ".join(map(str, value))}}};')
        
        return "\n".join(lines)
    
    @staticmethod
    def import_from_cpp(cpp_code: str) -> Dict:
        """从C++代码导入数据"""
        data = {}
        
        for line in cpp_code.split("\n"):
            line = line.strip()
            
            if line.startswith("std::string") and "=" in line:
                parts = line.split("=")
                var_name = parts[0].replace("std::string", "").strip()
                value = parts[1].replace(";", "").replace('"', "").strip()
                data[var_name] = value
            
            elif line.startswith("float") and "=" in line:
                parts = line.split("=")
                var_name = parts[0].replace("float", "").strip()
                value = float(parts[1].replace(";", "").strip())
                data[var_name] = value
            
            elif line.startswith("bool") and "=" in line:
                parts = line.split("=")
                var_name = parts[0].replace("bool", "").strip()
                value = parts[1].replace(";", "").strip() == "true"
                data[var_name] = value
        
        return data


# 全局实例
_game_tag_instance: Optional[UE5GameTagSystem] = None
_delegate_instance: Optional[UE5Delegate] = None
_skill_instance: Optional[UE5SkillSystem] = None
_streaming_volume_instance: Optional[UE5StreamingVolumeSystem] = None
_vegetation_instance: Optional[UE5ProceduralVegetationSystem] = None


def get_game_tag_system() -> UE5GameTagSystem:
    global _game_tag_instance
    if _game_tag_instance is None:
        _game_tag_instance = UE5GameTagSystem()
    return _game_tag_instance


def get_delegate_system() -> UE5Delegate:
    global _delegate_instance
    if _delegate_instance is None:
        _delegate_instance = UE5Delegate()
    return _delegate_instance


def get_skill_system() -> UE5SkillSystem:
    global _skill_instance
    if _skill_instance is None:
        _skill_instance = UE5SkillSystem()
    return _skill_instance


def get_streaming_volume_system() -> UE5StreamingVolumeSystem:
    global _streaming_volume_instance
    if _streaming_volume_instance is None:
        _streaming_volume_instance = UE5StreamingVolumeSystem()
    return _streaming_volume_instance


def get_vegetation_system() -> UE5ProceduralVegetationSystem:
    global _vegetation_instance
    if _vegetation_instance is None:
        _vegetation_instance = UE5ProceduralVegetationSystem()
    return _vegetation_instance


if __name__ == "__main__":
    game_tag = get_game_tag_system()
    delegate = get_delegate_system()
    skill = get_skill_system()
    streaming = get_streaming_volume_system()
    vegetation = get_vegetation_system()
    
    print("Skills:", list(skill.skills.keys()))
    print("Vegetation types:", list(vegetation.vegetation_types.keys()))
