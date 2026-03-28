#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 宠物与坐骑系统
支持宠物养成、坐骑管理

功能：
- 宠物捕捉、培养
- 宠物技能
- 坐骑管理
- 坐骑技能
"""

import json
import time
import random
from typing import Optional, Dict, Any, List, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum


class PetType(Enum):
    COMBAT = "combat"
    SUPPORT = "support"
    UTILITY = "utility"
    COSMETIC = "cosmetic"


class MountType(Enum):
    GROUND = "ground"
    FLYING = "flying"
    WATER = "water"
    SPECIAL = "special"


@dataclass
class Pet:
    """宠物"""
    pet_id: str
    name: str
    pet_type: PetType
    level: int = 1
    exp: int = 0
    max_exp: int = 100
    health: float = 100.0
    max_health: float = 100.0
    attack: float = 10.0
    defense: float = 5.0
    skills: List[str] = field(default_factory=list)
    personality: str = "neutral"
    happiness: float = 50.0
    hunger: float = 50.0
    model_id: str = ""
    icon: str = ""


@dataclass
class Mount:
    """坐骑"""
    mount_id: str
    name: str
    mount_type: MountType
    speed: float = 1.5
    stamina: float = 100.0
    max_stamina: float = 100.0
    skills: List[str] = field(default_factory=list)
    unlocked: bool = False
    premium: bool = False
    model_id: str = ""
    icon: str = ""


class UE5PetSystem:
    """UE5 宠物系统"""
    
    def __init__(self):
        self.pets: Dict[str, Pet] = {}
        self.user_pets: Dict[str, List[str]] = {}
        self.user_active_pet: Dict[str, str] = {}
        self.pet_skill_db: Dict[str, Dict] = {}
        self._init_pet_skills()
    
    def _init_pet_skills(self):
        """初始化宠物技能库"""
        self.pet_skill_db = {
            "bite": {"name": "撕咬", "damage": 15, "cooldown": 3.0, "type": "attack"},
            "heal_owner": {"name": "治愈主人", "heal": 20, "cooldown": 10.0, "type": "support"},
            "fetch": {"name": "寻回", "type": "utility"},
            "growl": {"name": "咆哮", "type": "taunt"},
            "stealth": {"name": "潜行", "type": "buff"}
        }
    
    def catch_pet(self, user_id: str, pet_type: PetType, name: str) -> Pet:
        """捕捉宠物"""
        pet_id = f"pet_{user_id}_{int(time.time() * 1000)}"
        
        pet = Pet(
            pet_id=pet_id,
            name=name,
            pet_type=pet_type,
            model_id=f"pet_model_{pet_type.value}",
            icon=f"pet_icon_{pet_type.value}",
            skills=self._generate_pet_skills(pet_type)
        )
        
        self.pets[pet_id] = pet
        
        if user_id not in self.user_pets:
            self.user_pets[user_id] = []
        
        self.user_pets[user_id].append(pet_id)
        
        return pet
    
    def _generate_pet_skills(self, pet_type: PetType) -> List[str]:
        """生成宠物技能"""
        skill_pool = {
            PetType.COMBAT: ["bite", "growl"],
            PetType.SUPPORT: ["heal_owner"],
            PetType.UTILITY: ["fetch", "stealth"],
            PetType.COSMETIC: []
        }
        
        return skill_pool.get(pet_type, [])
    
    def feed_pet(self, user_id: str, pet_id: str) -> bool:
        """喂养宠物"""
        pet = self.pets.get(pet_id)
        
        if not pet or pet_id not in self.user_pets.get(user_id, []):
            return False
        
        pet.hunger = max(0, pet.hunger - 20)
        pet.happiness = min(100, pet.happiness + 10)
        
        return True
    
    def gain_exp(self, pet_id: str, exp: int) -> Dict:
        """获得经验"""
        pet = self.pets.get(pet_id)
        
        if not pet:
            return {"success": False}
        
        pet.exp += exp
        
        level_ups = 0
        while pet.exp >= pet.max_exp:
            pet.exp -= pet.max_exp
            pet.level += 1
            pet.max_exp = int(pet.max_exp * 1.5)
            pet.max_health += 10
            pet.health = pet.max_health
            pet.attack += 2
            pet.defense += 1
            level_ups += 1
        
        return {
            "success": True,
            "level_ups": level_ups,
            "new_level": pet.level
        }
    
    def set_active_pet(self, user_id: str, pet_id: str) -> bool:
        """设置出战宠物"""
        if pet_id not in self.user_pets.get(user_id, []):
            return False
        
        self.user_active_pet[user_id] = pet_id
        return True
    
    def get_pet(self, pet_id: str) -> Optional[Dict]:
        """获取宠物信息"""
        pet = self.pets.get(pet_id)
        
        if not pet:
            return None
        
        return {
            "pet_id": pet.pet_id,
            "name": pet.name,
            "pet_type": pet.pet_type.value,
            "level": pet.level,
            "exp": pet.exp,
            "max_exp": pet.max_exp,
            "health": pet.health,
            "max_health": pet.max_health,
            "attack": pet.attack,
            "defense": pet.defense,
            "skills": pet.skills,
            "happiness": pet.happiness,
            "hunger": pet.hunger,
            "icon": pet.icon
        }
    
    def get_user_pets(self, user_id: str) -> List[Dict]:
        """获取用户所有宠物"""
        return [self.get_pet(pet_id) for pet_id in self.user_pets.get(user_id, [])]


class UE5MountSystem:
    """UE5 坐骑系统"""
    
    def __init__(self):
        self.mounts: Dict[str, Mount] = {}
        self.user_mounts: Dict[str, Set[str]] = {}
        self.user_active_mount: Dict[str, str] = {}
        self._init_default_mounts()
    
    def _init_default_mounts(self):
        """初始化默认坐骑"""
        default_mounts = [
            Mount("horse_basic", "普通马匹", MountType.GROUND, speed=1.5, model_id="horse_01", icon="horse_icon"),
            Mount("horse_war", "战马", MountType.GROUND, speed=1.8, model_id="horse_war", icon="war_horse_icon"),
            Mount("tiger", "猛虎", MountType.GROUND, speed=2.0, premium=True, model_id="tiger", icon="tiger_icon"),
            Mount("phoenix", "凤凰", MountType.FLYING, speed=2.5, premium=True, model_id="phoenix", icon="phoenix_icon"),
            Mount("dragon", "神龙", MountType.SPECIAL, speed=3.0, premium=True, model_id="dragon", icon="dragon_icon")
        ]
        
        for mount in default_mounts:
            self.mounts[mount.mount_id] = mount
    
    def unlock_mount(self, user_id: str, mount_id: str) -> bool:
        """解锁坐骑"""
        if mount_id not in self.mounts:
            return False
        
        if user_id not in self.user_mounts:
            self.user_mounts[user_id] = set()
        
        self.user_mounts[user_id].add(mount_id)
        self.mounts[mount_id].unlocked = True
        
        return True
    
    def mount(self, user_id: str, mount_id: str) -> Dict:
        """骑乘坐骑"""
        mount = self.mounts.get(mount_id)
        
        if not mount or mount_id not in self.user_mounts.get(user_id, set()):
            return {"success": False, "error": "Mount not available"}
        
        self.user_active_mount[user_id] = mount_id
        
        return {
            "success": True,
            "mount_id": mount_id,
            "speed": mount.speed,
            "mount_type": mount.mount_type.value
        }
    
    def dismount(self, user_id: str) -> Dict:
        """下坐骑"""
        if user_id not in self.user_active_mount:
            return {"success": False, "error": "Not mounted"}
        
        mount_id = self.user_active_mount[user_id]
        del self.user_active_mount[user_id]
        
        return {"success": True, "mount_id": mount_id}
    
    def use_mount_stamina(self, user_id: str, amount: float) -> Dict:
        """消耗坐骑体力"""
        if user_id not in self.user_active_mount:
            return {"success": False, "error": "Not mounted"}
        
        mount_id = self.user_active_mount[user_id]
        mount = self.mounts.get(mount_id)
        
        if not mount:
            return {"success": False, "error": "Mount not found"}
        
        mount.stamina = max(0, mount.stamina - amount)
        
        if mount.stamina <= 0:
            self.dismount(user_id)
            return {"success": True, "stamina_depleted": True}
        
        return {"success": True, "stamina": mount.stamina}
    
    def get_user_mounts(self, user_id: str) -> List[Dict]:
        """获取用户坐骑列表"""
        mounts = []
        
        for mount_id in self.user_mounts.get(user_id, set()):
            mount = self.mounts.get(mount_id)
            if mount:
                mounts.append({
                    "mount_id": mount.mount_id,
                    "name": mount.name,
                    "mount_type": mount.mount_type.value,
                    "speed": mount.speed,
                    "stamina": mount.stamina,
                    "max_stamina": mount.max_stamina,
                    "icon": mount.icon,
                    "is_active": self.user_active_mount.get(user_id) == mount_id
                })
        
        return mounts


# 全局实例
_pet_instance: Optional[UE5PetSystem] = None
_mount_instance: Optional[UE5MountSystem] = None


def get_pet_system() -> UE5PetSystem:
    global _pet_instance
    if _pet_instance is None:
        _pet_instance = UE5PetSystem()
    return _pet_instance


def get_mount_system() -> UE5MountSystem:
    global _mount_instance
    if _mount_instance is None:
        _mount_instance = UE5MountSystem()
    return _mount_instance


if __name__ == "__main__":
    pet_system = get_pet_system()
    pet = pet_system.catch_pet("player1", PetType.COMBAT, "小老虎")
    print("Pet:", pet_system.get_pet(pet.pet_id))
