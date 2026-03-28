#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 连击、Buff与生成系统
支持连击计数、Buff效果、敌人/物品生成

功能：
- 连击系统（计数、加成）
- Buff/Debuff系统
- 生成系统（敌人、物品、NPC）
"""

import json
import time
import math
import random
from typing import Optional, Dict, Any, List, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum


class BuffType(Enum):
    BUFF = "buff"
    DEBUFF = "debuff"


class BuffEffect(Enum):
    DAMAGE_BOOST = "damage_boost"
    DAMAGE_REDUCTION = "damage_reduction"
    SPEED_BOOST = "speed_boost"
    SPEED_REDUCTION = "speed_reduction"
    HEAL_OVER_TIME = "heal_over_time"
    DAMAGE_OVER_TIME = "damage_over_time"
    SHIELD = "shield"
    STUN = "stun"
    SILENCE = "silence"
    INVISIBLE = "invisible"


@dataclass
class ComboData:
    """连击数据"""
    combo_count: int = 0
    last_hit_time: float = 0.0
    combo_timeout: float = 3.0
    multiplier: float = 1.0
    max_combo: int = 100


@dataclass
class Buff:
    """Buff"""
    buff_id: str
    name: str
    buff_type: BuffType
    effect: BuffEffect
    value: float
    duration: float
    apply_time: float = 0.0
    stack_count: int = 1
    max_stacks: int = 1
    tick_interval: float = 0.0
    source_id: str = ""


@dataclass
class SpawnPoint:
    """生成点"""
    spawn_id: str
    spawn_type: str
    position: Tuple[float, float, float]
    entity_id: str
    spawn_interval: float = 60.0
    max_spawned: int = 5
    current_spawned: int = 0
    last_spawn_time: float = 0.0
    active: bool = True


class UE5ComboSystem:
    """UE5 连击系统"""
    
    def __init__(self):
        self.user_combos: Dict[str, ComboData] = {}
        self.combo_rewards: Dict[int, Dict] = {}
        self._init_combo_rewards()
    
    def _init_combo_rewards(self):
        """初始化连击奖励"""
        self.combo_rewards = {
            10: {"damage_bonus": 0.1, "exp_bonus": 0.05},
            25: {"damage_bonus": 0.2, "exp_bonus": 0.1},
            50: {"damage_bonus": 0.3, "exp_bonus": 0.15},
            100: {"damage_bonus": 0.5, "exp_bonus": 0.25}
        }
    
    def hit(self, user_id: str) -> Dict:
        """记录一次攻击"""
        if user_id not in self.user_combos:
            self.user_combos[user_id] = ComboData()
        
        combo = self.user_combos[user_id]
        current_time = time.time()
        
        # 检查连击是否超时
        if current_time - combo.last_hit_time > combo.combo_timeout:
            combo.combo_count = 0
        
        combo.combo_count = min(combo.combo_count + 1, combo.max_combo)
        combo.last_hit_time = current_time
        
        # 计算连击倍率
        combo.multiplier = 1.0 + (combo.combo_count * 0.01)
        
        # 获取奖励
        rewards = self._get_combo_rewards(combo.combo_count)
        
        return {
            "combo_count": combo.combo_count,
            "multiplier": combo.multiplier,
            "rewards": rewards
        }
    
    def _get_combo_rewards(self, combo_count: int) -> Dict:
        """获取连击奖励"""
        rewards = {}
        
        for threshold, reward in sorted(self.combo_rewards.items(), reverse=True):
            if combo_count >= threshold:
                rewards = reward.copy()
                break
        
        return rewards
    
    def break_combo(self, user_id: str):
        """打断连击"""
        if user_id in self.user_combos:
            del self.user_combos[user_id]
    
    def get_combo(self, user_id: str) -> Optional[Dict]:
        """获取连击状态"""
        combo = self.user_combos.get(user_id)
        
        if not combo:
            return None
        
        # 检查是否超时
        if time.time() - combo.last_hit_time > combo.combo_timeout:
            return None
        
        return {
            "combo_count": combo.combo_count,
            "multiplier": combo.multiplier,
            "time_remaining": combo.combo_timeout - (time.time() - combo.last_hit_time)
        }


class UE5BuffSystem:
    """UE5 Buff系统"""
    
    def __init__(self):
        self.entity_buffs: Dict[str, Dict[str, Buff]] = {}
        self.buff_templates: Dict[str, Buff] = {}
        self._init_default_buffs()
    
    def _init_default_buffs(self):
        """初始化默认Buff"""
        default_buffs = [
            Buff("attack_boost", "攻击强化", BuffType.BUFF, BuffEffect.DAMAGE_BOOST, 0.2, 30.0),
            Buff("defense_boost", "防御强化", BuffType.BUFF, BuffEffect.DAMAGE_REDUCTION, 0.2, 30.0),
            Buff("speed_boost", "速度强化", BuffType.BUFF, BuffEffect.SPEED_BOOST, 0.3, 20.0),
            Buff("regeneration", "持续恢复", BuffType.BUFF, BuffEffect.HEAL_OVER_TIME, 5.0, 10.0, tick_interval=1.0),
            Buff("shield", "护盾", BuffType.BUFF, BuffEffect.SHIELD, 100.0, 15.0),
            Buff("poison", "中毒", BuffType.DEBUFF, BuffEffect.DAMAGE_OVER_TIME, 10.0, 5.0, tick_interval=1.0),
            Buff("slow", "减速", BuffType.DEBUFF, BuffEffect.SPEED_REDUCTION, 0.3, 3.0),
            Buff("stun", "眩晕", BuffType.DEBUFF, BuffEffect.STUN, 0.0, 2.0),
            Buff("silence", "沉默", BuffType.DEBUFF, BuffEffect.SILENCE, 0.0, 5.0),
        ]
        
        for buff in default_buffs:
            self.buff_templates[buff.buff_id] = buff
    
    def apply_buff(self, entity_id: str, buff_id: str, source_id: str = "") -> Dict:
        """应用Buff"""
        template = self.buff_templates.get(buff_id)
        
        if not template:
            return {"success": False, "error": "Buff not found"}
        
        if entity_id not in self.entity_buffs:
            self.entity_buffs[entity_id] = {}
        
        existing = self.entity_buffs[entity_id].get(buff_id)
        
        if existing and existing.stack_count < existing.max_stacks:
            existing.stack_count += 1
            existing.apply_time = time.time()
        elif existing:
            existing.apply_time = time.time()  # 刷新持续时间
        else:
            buff = Buff(
                buff_id=template.buff_id,
                name=template.name,
                buff_type=template.buff_type,
                effect=template.effect,
                value=template.value,
                duration=template.duration,
                apply_time=time.time(),
                stack_count=1,
                max_stacks=template.max_stacks,
                tick_interval=template.tick_interval,
                source_id=source_id
            )
            self.entity_buffs[entity_id][buff_id] = buff
        
        return {
            "success": True,
            "buff_id": buff_id,
            "stack_count": self.entity_buffs[entity_id][buff_id].stack_count
        }
    
    def remove_buff(self, entity_id: str, buff_id: str) -> bool:
        """移除Buff"""
        if entity_id in self.entity_buffs and buff_id in self.entity_buffs[entity_id]:
            del self.entity_buffs[entity_id][buff_id]
            return True
        return False
    
    def update(self, entity_id: str, delta_time: float) -> Dict:
        """更新Buff"""
        if entity_id not in self.entity_buffs:
            return {}
        
        results = {"expired": [], "tick_effects": []}
        expired_buffs = []
        
        for buff_id, buff in self.entity_buffs[entity_id].items():
            elapsed = time.time() - buff.apply_time
            
            if elapsed >= buff.duration:
                expired_buffs.append(buff_id)
                results["expired"].append(buff_id)
            elif buff.tick_interval > 0:
                ticks = int(elapsed / buff.tick_interval)
                last_tick = int((elapsed - delta_time) / buff.tick_interval)
                
                if ticks > last_tick:
                    results["tick_effects"].append({
                        "buff_id": buff_id,
                        "effect": buff.effect.value,
                        "value": buff.value * buff.stack_count
                    })
        
        for buff_id in expired_buffs:
            del self.entity_buffs[entity_id][buff_id]
        
        return results
    
    def get_active_buffs(self, entity_id: str) -> List[Dict]:
        """获取活跃Buff"""
        if entity_id not in self.entity_buffs:
            return []
        
        buffs = []
        
        for buff_id, buff in self.entity_buffs[entity_id].items():
            elapsed = time.time() - buff.apply_time
            remaining = buff.duration - elapsed
            
            if remaining > 0:
                buffs.append({
                    "buff_id": buff.buff_id,
                    "name": buff.name,
                    "buff_type": buff.buff_type.value,
                    "effect": buff.effect.value,
                    "value": buff.value,
                    "stack_count": buff.stack_count,
                    "remaining_time": remaining
                })
        
        return buffs


class UE5SpawnSystem:
    """UE5 生成系统"""
    
    def __init__(self):
        self.spawn_points: Dict[str, SpawnPoint] = {}
        self.spawned_entities: Dict[str, List[str]] = {}
    
    def register_spawn_point(self, spawn_point: SpawnPoint):
        """注册生成点"""
        self.spawn_points[spawn_point.spawn_id] = spawn_point
    
    def update(self, delta_time: float) -> List[Dict]:
        """更新生成"""
        spawned = []
        
        for spawn_id, spawn_point in self.spawn_points.items():
            if not spawn_point.active:
                continue
            
            if spawn_point.current_spawned >= spawn_point.max_spawned:
                continue
            
            elapsed = time.time() - spawn_point.last_spawn_time
            
            if elapsed >= spawn_point.spawn_interval:
                entity_id = f"{spawn_point.entity_id}_{int(time.time() * 1000)}"
                
                spawn_point.current_spawned += 1
                spawn_point.last_spawn_time = time.time()
                
                if spawn_id not in self.spawned_entities:
                    self.spawned_entities[spawn_id] = []
                
                self.spawned_entities[spawn_id].append(entity_id)
                
                spawned.append({
                    "spawn_id": spawn_id,
                    "entity_id": entity_id,
                    "entity_type": spawn_point.spawn_type,
                    "position": spawn_point.position
                })
        
        return spawned
    
    def despawn(self, spawn_id: str, entity_id: str):
        """移除生成实体"""
        if spawn_id in self.spawn_points:
            spawn_point = self.spawn_points[spawn_id]
            spawn_point.current_spawned = max(0, spawn_point.current_spawned - 1)
        
        if spawn_id in self.spawned_entities and entity_id in self.spawned_entities[spawn_id]:
            self.spawned_entities[spawn_id].remove(entity_id)
    
    def get_spawn_points(self) -> List[Dict]:
        """获取所有生成点"""
        return [{
            "spawn_id": sp.spawn_id,
            "spawn_type": sp.spawn_type,
            "position": sp.position,
            "entity_id": sp.entity_id,
            "max_spawned": sp.max_spawned,
            "current_spawned": sp.current_spawned,
            "active": sp.active
        } for sp in self.spawn_points.values()]


# 全局实例
_combo_instance: Optional[UE5ComboSystem] = None
_buff_instance: Optional[UE5BuffSystem] = None
_spawn_instance: Optional[UE5SpawnSystem] = None


def get_combo_system() -> UE5ComboSystem:
    global _combo_instance
    if _combo_instance is None:
        _combo_instance = UE5ComboSystem()
    return _combo_instance


def get_buff_system() -> UE5BuffSystem:
    global _buff_instance
    if _buff_instance is None:
        _buff_instance = UE5BuffSystem()
    return _buff_instance


def get_spawn_system() -> UE5SpawnSystem:
    global _spawn_instance
    if _spawn_instance is None:
        _spawn_instance = UE5SpawnSystem()
    return _spawn_instance


if __name__ == "__main__":
    combo = get_combo_system()
    buff = get_buff_system()
    spawn = get_spawn_system()
    
    print("Combo hit:", combo.hit("player1"))
    print("Apply buff:", buff.apply_buff("player1", "attack_boost"))
    print("Active buffs:", buff.get_active_buffs("player1"))
