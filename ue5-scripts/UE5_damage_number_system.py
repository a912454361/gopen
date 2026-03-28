#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 伤害数字系统
支持伤害飘字、治疗数字、暴击特效

功能：
- 伤害/治疗数字飘字
- 暴击放大效果
- 物理/魔法/真实伤害区分
- 阻挡/吸收显示
"""

import json
import time
import math
import random
import hashlib
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class DamageType(Enum):
    PHYSICAL = "physical"
    MAGICAL = "magical"
    TRUE = "true"
    HEAL = "heal"
    CRITICAL = "critical"
    DOT = "dot"


@dataclass
class DamageNumber:
    """伤害数字"""
    number_id: str
    value: float
    damage_type: DamageType
    position: Tuple[float, float, float]
    target_id: str
    source_id: Optional[str] = None
    is_critical: bool = False
    is_blocked: bool = False
    is_absorbed: bool = False
    animation_time: float = 1.5
    start_time: float = field(default_factory=time.time)
    offset_y: float = 0.0
    velocity: Tuple[float, float] = (0.0, 50.0)


class UE5DamageNumberSystem:
    """UE5 伤害数字系统"""
    
    def __init__(self):
        self.damage_numbers: List[DamageNumber] = []
        self.max_numbers = 100
        self.crit_scale = 1.5
    
    def show_damage(self, target_id: str, value: float, damage_type: DamageType,
                    position: Tuple[float, float, float], source_id: str = None,
                    is_critical: bool = False, **kwargs) -> str:
        """显示伤害数字"""
        number_id = hashlib.md5(f"{target_id}_{value}_{time.time()}".encode()).hexdigest()[:12]
        
        offset_x = random.uniform(-20, 20)
        offset_y = random.uniform(0, 10)
        position = (position[0] + offset_x, position[1] + offset_y, position[2])
        
        velocity_x = random.uniform(-30, 30)
        velocity_y = random.uniform(60, 100) if is_critical else random.uniform(40, 70)
        
        number = DamageNumber(
            number_id=number_id,
            value=value,
            damage_type=damage_type,
            position=position,
            target_id=target_id,
            source_id=source_id,
            is_critical=is_critical,
            is_blocked=kwargs.get("is_blocked", False),
            is_absorbed=kwargs.get("is_absorbed", False),
            velocity=(velocity_x, velocity_y)
        )
        
        self.damage_numbers.append(number)
        
        if len(self.damage_numbers) > self.max_numbers:
            self.damage_numbers.pop(0)
        
        return number_id
    
    def show_heal(self, target_id: str, value: float, 
                  position: Tuple[float, float, float],
                  is_critical: bool = False) -> str:
        """显示治疗数字"""
        return self.show_damage(target_id, value, DamageType.HEAL, position, is_critical=is_critical)
    
    def update(self, delta_time: float):
        """更新伤害数字"""
        current_time = time.time()
        to_remove = []
        
        for number in self.damage_numbers:
            elapsed = current_time - number.start_time
            
            if elapsed >= number.animation_time:
                to_remove.append(number)
                continue
            
            number.velocity = (
                number.velocity[0] * 0.95,
                number.velocity[1] - 98.0 * delta_time
            )
            
            number.offset_y += number.velocity[1] * delta_time
    
    def get_active_numbers(self) -> List[Dict]:
        """获取活跃的伤害数字"""
        current_time = time.time()
        numbers = []
        
        for number in self.damage_numbers:
            elapsed = current_time - number.start_time
            if elapsed < number.animation_time:
                alpha = 1.0 - (elapsed / number.animation_time)
                
                numbers.append({
                    "number_id": number.number_id,
                    "value": int(number.value),
                    "damage_type": number.damage_type.value,
                    "position": number.position,
                    "offset_y": number.offset_y,
                    "is_critical": number.is_critical,
                    "is_blocked": number.is_blocked,
                    "is_absorbed": number.is_absorbed,
                    "alpha": alpha,
                    "scale": self.crit_scale if number.is_critical else 1.0
                })
        
        return numbers
    
    def clear_numbers(self):
        """清除所有伤害数字"""
        self.damage_numbers.clear()


def get_damage_number_system() -> UE5DamageNumberSystem:
    global _instance
    if '_instance' not in globals():
        _instance = UE5DamageNumberSystem()
    return _instance


if __name__ == "__main__":
    system = get_damage_number_system()
    system.show_damage("enemy_001", 250, DamageType.CRITICAL, (100, 50, 0), is_critical=True)
    print("Damage numbers:", system.get_active_numbers())
