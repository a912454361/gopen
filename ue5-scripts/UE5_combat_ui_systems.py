#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 伤害数字与血条系统
支持伤害显示、治疗显示、血条UI

功能：
- 伤害数字飘字
- 治疗数字飘字
- 暴击特效
- 血条显示
- 护盾显示
- 状态效果图标
"""

import json
import time
import math
import random
import hashlib
from typing import Optional, Dict, Any, List, Callable, Tuple
from dataclasses import dataclass, field
from enum import Enum


class DamageType(Enum):
    """伤害类型"""
    PHYSICAL = "physical"
    MAGICAL = "magical"
    TRUE = "true"
    HEAL = "heal"
    CRITICAL = "critical"
    DOT = "dot"  # Damage over Time
    HOT = "hot"  # Heal over Time


class HealthBarType(Enum):
    """血条类型"""
    PLAYER = "player"
    ENEMY = "enemy"
    NPC = "npc"
    BOSS = "boss"
    OBJECT = "object"
    PET = "pet"


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
    velocity: Tuple[float, float] = (0.0, 50.0)  # x, y velocity


@dataclass
class HealthBar:
    """血条数据"""
    bar_id: str
    target_id: str
    bar_type: HealthBarType
    current_health: float
    max_health: float
    current_shield: float = 0.0
    max_shield: float = 0.0
    level: int = 1
    name: str = ""
    visible: bool = True
    show_name: bool = True
    show_level: bool = True
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    offset: Tuple[float, float, float] = (0.0, 2.0, 0.0)
    width: float = 200.0
    height: float = 20.0
    color: str = "#FF0000"
    shield_color: str = "#4444FF"
    effects: List[str] = field(default_factory=list)


class UE5DamageNumberSystem:
    """UE5 伤害数字系统"""
    
    def __init__(self):
        self.damage_numbers: List[DamageNumber] = []
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 配置
        self.max_numbers = 100
        self.default_duration = 1.5
        self.crit_scale = 1.5
    
    def show_damage(self, target_id: str, value: float, damage_type: DamageType,
                    position: Tuple[float, float, float], source_id: str = None,
                    is_critical: bool = False, **kwargs) -> str:
        """显示伤害数字"""
        number_id = hashlib.md5(f"{target_id}_{value}_{time.time()}".encode()).hexdigest()[:12]
        
        # 随机偏移
        offset_x = random.uniform(-20, 20)
        offset_y = random.uniform(0, 10)
        
        position = (position[0] + offset_x, position[1] + offset_y, position[2])
        
        # 随机速度
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
        
        # 限制数量
        if len(self.damage_numbers) > self.max_numbers:
            self.damage_numbers.pop(0)
        
        self._trigger_event("damage_shown", {
            "number_id": number_id,
            "target_id": target_id,
            "value": value,
            "damage_type": damage_type.value,
            "is_critical": is_critical
        })
        
        return number_id
    
    def show_heal(self, target_id: str, value: float, position: Tuple[float, float, float],
                  is_critical: bool = False) -> str:
        """显示治疗数字"""
        return self.show_damage(
            target_id=target_id,
            value=value,
            damage_type=DamageType.HEAL,
            position=position,
            is_critical=is_critical
        )
    
    def update(self, delta_time: float):
        """更新伤害数字"""
        current_time = time.time()
        to_remove = []
        
        for number in self.damage_numbers:
            elapsed = current_time - number.start_time
            
            # 检查是否过期
            if elapsed >= number.animation_time:
                to_remove.append(number)
                continue
            
            # 更新位置（模拟飘字运动）
            progress = elapsed / number.animation_time
            
            # 添加重力和速度衰减
            number.velocity = (
                number.velocity[0] * 0.95,
                number.velocity[1] - 98.0 * delta_time  # 重力
            )
            
            number.offset_y += number.velocity[1] * delta_time
    
    def get_active_numbers(self) -> List[Dict]:
        """获取所有活跃的伤害数字"""
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
    
    def register_event_handler(self, event_type: str, handler: Callable):
        """注册事件处理器"""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    def _trigger_event(self, event_type: str, data: Dict):
        """触发事件"""
        handlers = self.event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                handler(data)
            except Exception as e:
                print(f"[DamageNumber] Event handler error: {e}")


class UE5HealthBarSystem:
    """UE5 血条系统"""
    
    def __init__(self):
        self.health_bars: Dict[str, HealthBar] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 配置
        self.default_width = 200.0
        self.default_height = 20.0
    
    def create_health_bar(self, target_id: str, bar_type: HealthBarType,
                          max_health: float, name: str = "", level: int = 1) -> HealthBar:
        """创建血条"""
        bar_id = hashlib.md5(f"{target_id}_{bar_type.value}".encode()).hexdigest()[:12]
        
        bar = HealthBar(
            bar_id=bar_id,
            target_id=target_id,
            bar_type=bar_type,
            current_health=max_health,
            max_health=max_health,
            level=level,
            name=name,
            width=self._get_bar_width(bar_type),
            color=self._get_bar_color(bar_type)
        )
        
        self.health_bars[bar_id] = bar
        
        self._trigger_event("health_bar_created", {
            "bar_id": bar_id,
            "target_id": target_id,
            "bar_type": bar_type.value,
            "max_health": max_health
        })
        
        return bar
    
    def update_health(self, target_id: str, current_health: float,
                      max_health: float = None) -> bool:
        """更新血量"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                bar.current_health = min(current_health, bar.max_health)
                if max_health:
                    bar.max_health = max_health
                
                self._trigger_event("health_updated", {
                    "bar_id": bar.bar_id,
                    "target_id": target_id,
                    "current_health": current_health,
                    "max_health": bar.max_health,
                    "percentage": bar.current_health / bar.max_health
                })
                
                return True
        
        return False
    
    def update_shield(self, target_id: str, current_shield: float, max_shield: float) -> bool:
        """更新护盾"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                bar.current_shield = current_shield
                bar.max_shield = max_shield
                
                return True
        
        return False
    
    def set_position(self, target_id: str, position: Tuple[float, float, float]):
        """设置血条位置"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                bar.position = position
                return True
        return False
    
    def set_visible(self, target_id: str, visible: bool):
        """设置血条可见性"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                bar.visible = visible
                return True
        return False
    
    def add_effect(self, target_id: str, effect_icon: str):
        """添加状态效果图标"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                if effect_icon not in bar.effects:
                    bar.effects.append(effect_icon)
                return True
        return False
    
    def remove_effect(self, target_id: str, effect_icon: str):
        """移除状态效果图标"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                if effect_icon in bar.effects:
                    bar.effects.remove(effect_icon)
                return True
        return False
    
    def remove_health_bar(self, target_id: str):
        """移除血条"""
        to_remove = []
        
        for bar_id, bar in self.health_bars.items():
            if bar.target_id == target_id:
                to_remove.append(bar_id)
        
        for bar_id in to_remove:
            del self.health_bars[bar_id]
    
    def get_health_bar(self, target_id: str) -> Optional[Dict]:
        """获取血条数据"""
        for bar in self.health_bars.values():
            if bar.target_id == target_id:
                return {
                    "bar_id": bar.bar_id,
                    "target_id": bar.target_id,
                    "bar_type": bar.bar_type.value,
                    "current_health": bar.current_health,
                    "max_health": bar.max_health,
                    "current_shield": bar.current_shield,
                    "max_shield": bar.max_shield,
                    "percentage": bar.current_health / bar.max_health if bar.max_health > 0 else 0,
                    "shield_percentage": bar.current_shield / bar.max_shield if bar.max_shield > 0 else 0,
                    "level": bar.level,
                    "name": bar.name,
                    "visible": bar.visible,
                    "position": bar.position,
                    "offset": bar.offset,
                    "width": bar.width,
                    "height": bar.height,
                    "color": bar.color,
                    "shield_color": bar.shield_color,
                    "effects": bar.effects
                }
        
        return None
    
    def get_visible_bars(self, camera_position: Tuple[float, float, float],
                         max_distance: float = 100.0) -> List[Dict]:
        """获取可见范围内的血条"""
        bars = []
        
        for bar in self.health_bars.values():
            if not bar.visible:
                continue
            
            distance = math.sqrt(
                (bar.position[0] - camera_position[0]) ** 2 +
                (bar.position[1] - camera_position[1]) ** 2 +
                (bar.position[2] - camera_position[2]) ** 2
            )
            
            if distance <= max_distance:
                bar_data = self.get_health_bar(bar.target_id)
                if bar_data:
                    bar_data["distance"] = distance
                    bars.append(bar_data)
        
        return bars
    
    def _get_bar_width(self, bar_type: HealthBarType) -> float:
        """获取血条宽度"""
        widths = {
            HealthBarType.PLAYER: 200.0,
            HealthBarType.ENEMY: 150.0,
            HealthBarType.BOSS: 400.0,
            HealthBarType.NPC: 100.0,
            HealthBarType.OBJECT: 120.0,
            HealthBarType.PET: 150.0
        }
        return widths.get(bar_type, self.default_width)
    
    def _get_bar_color(self, bar_type: HealthBarType) -> str:
        """获取血条颜色"""
        colors = {
            HealthBarType.PLAYER: "#00FF00",
            HealthBarType.ENEMY: "#FF0000",
            HealthBarType.BOSS: "#FF4400",
            HealthBarType.NPC: "#FFFF00",
            HealthBarType.OBJECT: "#888888",
            HealthBarType.PET: "#00FFFF"
        }
        return colors.get(bar_type, "#FF0000")
    
    def register_event_handler(self, event_type: str, handler: Callable):
        """注册事件处理器"""
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        self.event_handlers[event_type].append(handler)
    
    def _trigger_event(self, event_type: str, data: Dict):
        """触发事件"""
        handlers = self.event_handlers.get(event_type, [])
        for handler in handlers:
            try:
                handler(data)
            except Exception as e:
                print(f"[HealthBar] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "total_bars": len(self.health_bars)
        }


# 全局实例
_damage_number_instance: Optional[UE5DamageNumberSystem] = None
_health_bar_instance: Optional[UE5HealthBarSystem] = None


def get_damage_number_system() -> UE5DamageNumberSystem:
    """获取伤害数字系统实例"""
    global _damage_number_instance
    
    if _damage_number_instance is None:
        _damage_number_instance = UE5DamageNumberSystem()
    
    return _damage_number_instance


def get_health_bar_system() -> UE5HealthBarSystem:
    """获取血条系统实例"""
    global _health_bar_instance
    
    if _health_bar_instance is None:
        _health_bar_instance = UE5HealthBarSystem()
    
    return _health_bar_instance


if __name__ == "__main__":
    # 测试
    damage_system = get_damage_number_system()
    health_system = get_health_bar_system()
    
    # 创建血条
    bar = health_system.create_health_bar(
        "enemy_001",
        HealthBarType.ENEMY,
        1000.0,
        "哥布林战士",
        15
    )
    
    # 显示伤害
    damage_system.show_damage(
        "enemy_001",
        250,
        DamageType.CRITICAL,
        (100, 50, 0),
        is_critical=True
    )
    
    print("Active damage numbers:", len(damage_system.get_active_numbers()))
    print("Health bar:", health_system.get_health_bar("enemy_001"))
