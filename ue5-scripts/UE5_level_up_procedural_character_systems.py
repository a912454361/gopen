#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 升级与程序化角色生成系统
支持角色升级、属性成长、程序化角色创建

功能：
- 角色升级系统
- 属性点分配
- 程序化角色生成
- 角色外观定制
"""

import json
import time
import math
import random
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum


class CharacterClass(Enum):
    WARRIOR = "warrior"
    MAGE = "mage"
    ARCHER = "archer"
    ASSASSIN = "assassin"
    HEALER = "healer"


class Attribute(Enum):
    STRENGTH = "strength"
    AGILITY = "agility"
    INTELLIGENCE = "intelligence"
    VITALITY = "vitality"
    LUCK = "luck"


@dataclass
class CharacterStats:
    """角色属性"""
    level: int = 1
    exp: int = 0
    exp_to_next: int = 100
    attribute_points: int = 0
    strength: int = 10
    agility: int = 10
    intelligence: int = 10
    vitality: int = 10
    luck: int = 10
    health: float = 100.0
    max_health: float = 100.0
    mana: float = 50.0
    max_mana: float = 50.0
    attack: float = 10.0
    defense: float = 5.0
    speed: float = 1.0
    crit_rate: float = 0.05
    crit_damage: float = 1.5


@dataclass
class CharacterAppearance:
    """角色外观"""
    gender: str = "male"
    body_type: int = 0
    face_type: int = 0
    hair_style: int = 0
    hair_color: str = "#000000"
    skin_color: str = "#E8BEAC"
    eye_color: str = "#000000"
    height: float = 1.0
    weight: float = 1.0


class UE5LevelUpSystem:
    """UE5 升级系统"""
    
    def __init__(self):
        self.characters: Dict[str, CharacterStats] = {}
        self.level_requirements: Dict[int, int] = {}
        self._init_level_requirements()
    
    def _init_level_requirements(self):
        """初始化等级需求"""
        for level in range(1, 101):
            self.level_requirements[level] = int(100 * (1.5 ** (level - 1)))
    
    def create_character(self, user_id: str, char_class: CharacterClass) -> CharacterStats:
        """创建角色"""
        stats = CharacterStats()
        
        # 根据职业调整初始属性
        class_bonuses = {
            CharacterClass.WARRIOR: {"strength": 5, "vitality": 5},
            CharacterClass.MAGE: {"intelligence": 8, "mana": 30},
            CharacterClass.ARCHER: {"agility": 6, "luck": 4},
            CharacterClass.ASSASSIN: {"agility": 8, "luck": 2},
            CharacterClass.HEALER: {"intelligence": 5, "vitality": 5}
        }
        
        bonus = class_bonuses.get(char_class, {})
        for attr, value in bonus.items():
            if hasattr(stats, attr):
                current = getattr(stats, attr)
                setattr(stats, attr, current + value)
        
        self._recalculate_derived(stats)
        self.characters[user_id] = stats
        
        return stats
    
    def gain_exp(self, user_id: str, exp: int) -> Dict:
        """获得经验"""
        stats = self.characters.get(user_id)
        
        if not stats:
            return {"success": False, "error": "Character not found"}
        
        stats.exp += exp
        
        level_ups = 0
        while stats.exp >= stats.exp_to_next and stats.level < 100:
            stats.exp -= stats.exp_to_next
            stats.level += 1
            stats.exp_to_next = self.level_requirements.get(stats.level, 10000)
            stats.attribute_points += 5
            level_ups += 1
        
        if level_ups > 0:
            self._recalculate_derived(stats)
        
        return {
            "success": True,
            "level_ups": level_ups,
            "new_level": stats.level,
            "exp": stats.exp,
            "exp_to_next": stats.exp_to_next,
            "attribute_points": stats.attribute_points
        }
    
    def allocate_attribute(self, user_id: str, attribute: Attribute, points: int = 1) -> Dict:
        """分配属性点"""
        stats = self.characters.get(user_id)
        
        if not stats:
            return {"success": False, "error": "Character not found"}
        
        if stats.attribute_points < points:
            return {"success": False, "error": "Not enough attribute points"}
        
        current_value = getattr(stats, attribute.value)
        setattr(stats, attribute.value, current_value + points)
        stats.attribute_points -= points
        
        self._recalculate_derived(stats)
        
        return {
            "success": True,
            "attribute": attribute.value,
            "new_value": getattr(stats, attribute.value),
            "remaining_points": stats.attribute_points
        }
    
    def _recalculate_derived(self, stats: CharacterStats):
        """重新计算衍生属性"""
        stats.max_health = 100 + stats.vitality * 10 + stats.strength * 2
        stats.max_mana = 50 + stats.intelligence * 5
        stats.attack = stats.strength * 2 + stats.agility * 0.5
        stats.defense = stats.vitality * 0.5 + stats.strength * 0.3
        stats.speed = 1.0 + stats.agility * 0.01
        stats.crit_rate = 0.05 + stats.luck * 0.005
        stats.crit_damage = 1.5 + stats.luck * 0.02
        
        stats.health = stats.max_health
        stats.mana = stats.max_mana
    
    def get_character(self, user_id: str) -> Optional[Dict]:
        """获取角色信息"""
        stats = self.characters.get(user_id)
        
        if not stats:
            return None
        
        return {
            "level": stats.level,
            "exp": stats.exp,
            "exp_to_next": stats.exp_to_next,
            "attribute_points": stats.attribute_points,
            "strength": stats.strength,
            "agility": stats.agility,
            "intelligence": stats.intelligence,
            "vitality": stats.vitality,
            "luck": stats.luck,
            "health": stats.health,
            "max_health": stats.max_health,
            "mana": stats.mana,
            "max_mana": stats.max_mana,
            "attack": stats.attack,
            "defense": stats.defense,
            "speed": stats.speed,
            "crit_rate": stats.crit_rate,
            "crit_damage": stats.crit_damage
        }


class UE5ProceduralCharacterGenerator:
    """UE5 程序化角色生成器"""
    
    def __init__(self):
        self.appearance_options: Dict[str, List] = {}
        self._init_appearance_options()
    
    def _init_appearance_options(self):
        """初始化外观选项"""
        self.appearance_options = {
            "hair_styles": list(range(20)),
            "hair_colors": ["#000000", "#1A1A1A", "#4A4A4A", "#8B4513", "#DAA520", "#CD853F", "#FF6B6B", "#4ECDC4", "#95E1D3"],
            "skin_colors": ["#FDEBD0", "#F5CBA7", "#E8BEAC", "#D4A574", "#A67C52", "#8D5524", "#6B4423", "#5D4037"],
            "eye_colors": ["#000000", "#4A4A4A", "#1E90FF", "#228B22", "#8B4513", "#9400D3", "#FF6347"]
        }
    
    def generate_npc(self, faction: str = None, role: str = None) -> Dict:
        """程序化生成NPC"""
        gender = random.choice(["male", "female"])
        
        appearance = CharacterAppearance(
            gender=gender,
            body_type=random.randint(0, 5),
            face_type=random.randint(0, 10),
            hair_style=random.choice(self.appearance_options["hair_styles"]),
            hair_color=random.choice(self.appearance_options["hair_colors"]),
            skin_color=random.choice(self.appearance_options["skin_colors"]),
            eye_color=random.choice(self.appearance_options["eye_colors"]),
            height=random.uniform(0.9, 1.1),
            weight=random.uniform(0.8, 1.2)
        )
        
        name = self._generate_name(gender, faction)
        personality = self._generate_personality()
        
        return {
            "name": name,
            "gender": gender,
            "appearance": {
                "body_type": appearance.body_type,
                "face_type": appearance.face_type,
                "hair_style": appearance.hair_style,
                "hair_color": appearance.hair_color,
                "skin_color": appearance.skin_color,
                "eye_color": appearance.eye_color,
                "height": appearance.height,
                "weight": appearance.weight
            },
            "personality": personality,
            "faction": faction,
            "role": role
        }
    
    def generate_player_character(self, user_id: str, preferences: Dict = None) -> Dict:
        """程序化生成玩家角色"""
        preferences = preferences or {}
        
        gender = preferences.get("gender", random.choice(["male", "female"]))
        
        appearance = CharacterAppearance(
            gender=gender,
            body_type=preferences.get("body_type", random.randint(0, 5)),
            face_type=preferences.get("face_type", random.randint(0, 10)),
            hair_style=preferences.get("hair_style", random.choice(self.appearance_options["hair_styles"])),
            hair_color=preferences.get("hair_color", random.choice(self.appearance_options["hair_colors"])),
            skin_color=preferences.get("skin_color", random.choice(self.appearance_options["skin_colors"])),
            eye_color=preferences.get("eye_color", random.choice(self.appearance_options["eye_colors"])),
            height=preferences.get("height", random.uniform(0.9, 1.1)),
            weight=preferences.get("weight", random.uniform(0.8, 1.2))
        )
        
        return {
            "user_id": user_id,
            "appearance": {
                "gender": appearance.gender,
                "body_type": appearance.body_type,
                "face_type": appearance.face_type,
                "hair_style": appearance.hair_style,
                "hair_color": appearance.hair_color,
                "skin_color": appearance.skin_color,
                "eye_color": appearance.eye_color,
                "height": appearance.height,
                "weight": appearance.weight
            }
        }
    
    def _generate_name(self, gender: str, faction: str = None) -> str:
        """生成名字"""
        surname_pool = ["李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴"]
        
        male_names = ["天行", "云飞", "浩然", "明轩", "子墨", "承恩", "志远", "景行"]
        female_names = ["诗韵", "梦瑶", "雨萱", "思琪", "雅琳", "若兰", "紫烟", "雪晴"]
        
        surname = random.choice(surname_pool)
        given_name = random.choice(male_names if gender == "male" else female_names)
        
        return f"{surname}{given_name}"
    
    def _generate_personality(self) -> Dict:
        """生成性格"""
        traits = ["勇敢", "谨慎", "善良", "冷漠", "热情", "沉默", "幽默", "严肃"]
        
        return {
            "primary_trait": random.choice(traits),
            "secondary_trait": random.choice(traits),
            "friendliness": random.uniform(0.3, 0.9),
            "aggression": random.uniform(0.1, 0.7)
        }


# 全局实例
_level_up_instance: Optional[UE5LevelUpSystem] = None
_character_generator_instance: Optional[UE5ProceduralCharacterGenerator] = None


def get_level_up_system() -> UE5LevelUpSystem:
    global _level_up_instance
    if _level_up_instance is None:
        _level_up_instance = UE5LevelUpSystem()
    return _level_up_instance


def get_character_generator() -> UE5ProceduralCharacterGenerator:
    global _character_generator_instance
    if _character_generator_instance is None:
        _character_generator_instance = UE5ProceduralCharacterGenerator()
    return _character_generator_instance


if __name__ == "__main__":
    level_up = get_level_up_system()
    char_gen = get_character_generator()
    
    level_up.create_character("player1", CharacterClass.WARRIOR)
    print("Level up:", level_up.gain_exp("player1", 150))
    print("Character:", level_up.get_character("player1"))
    
    print("Generated NPC:", char_gen.generate_npc("昆仑", "warrior"))
