#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 制作与存档系统
支持物品制作、配方管理、存档读写

功能：
- 配方系统
- 材料消耗
- 存档加密
- 多存档槽位
"""

import json
import time
import hashlib
import base64
from typing import Optional, Dict, Any, List, Set
from dataclasses import dataclass, field
from enum import Enum


class CraftingStatus(Enum):
    SUCCESS = "success"
    FAILED = "failed"
    MISSING_MATERIALS = "missing_materials"
    MISSING_RECIPE = "missing_recipe"


@dataclass
class Recipe:
    """配方"""
    recipe_id: str
    name: str
    result_item_id: str
    result_quantity: int
    materials: Dict[str, int]
    craft_time: float
    skill_required: Optional[str] = None
    skill_level: int = 0
    success_rate: float = 1.0


@dataclass
class CraftingJob:
    """制作任务"""
    job_id: str
    user_id: str
    recipe_id: str
    start_time: float
    end_time: float
    quantity: int = 1


@dataclass
class SaveSlot:
    """存档槽位"""
    slot_id: int
    user_id: str
    save_time: float
    data: Dict[str, Any]
    checksum: str = ""


class UE5CraftingSystem:
    """UE5 制作系统"""
    
    def __init__(self):
        self.recipes: Dict[str, Recipe] = {}
        self.user_recipes: Dict[str, Set[str]] = {}
        self.active_jobs: Dict[str, CraftingJob] = {}
        self._init_default_recipes()
    
    def _init_default_recipes(self):
        """初始化默认配方"""
        default_recipes = [
            Recipe("recipe_health_potion", "生命药水", "health_potion", 3,
                   {"herb": 2, "water": 1}, 5.0, success_rate=1.0),
            Recipe("recipe_iron_sword", "铁剑", "iron_sword", 1,
                   {"iron_ingot": 3, "wood": 1}, 30.0, "blacksmith", 10, 0.9),
            Recipe("recipe_magic_staff", "法杖", "magic_staff", 1,
                   {"magic_crystal": 2, "ancient_wood": 3}, 60.0, "enchanting", 20, 0.8),
        ]
        
        for recipe in default_recipes:
            self.recipes[recipe.recipe_id] = recipe
    
    def unlock_recipe(self, user_id: str, recipe_id: str) -> bool:
        """解锁配方"""
        if recipe_id not in self.recipes:
            return False
        
        if user_id not in self.user_recipes:
            self.user_recipes[user_id] = set()
        
        self.user_recipes[user_id].add(recipe_id)
        return True
    
    def can_craft(self, user_id: str, recipe_id: str, inventory: Dict[str, int]) -> Dict:
        """检查是否可以制作"""
        recipe = self.recipes.get(recipe_id)
        
        if not recipe:
            return {"can_craft": False, "reason": CraftingStatus.MISSING_RECIPE.value}
        
        if user_id not in self.user_recipes or recipe_id not in self.user_recipes[user_id]:
            return {"can_craft": False, "reason": CraftingStatus.MISSING_RECIPE.value}
        
        missing = {}
        for material_id, required in recipe.materials.items():
            available = inventory.get(material_id, 0)
            if available < required:
                missing[material_id] = required - available
        
        if missing:
            return {"can_craft": False, "reason": CraftingStatus.MISSING_MATERIALS.value, "missing": missing}
        
        return {"can_craft": True, "reason": CraftingStatus.SUCCESS.value}
    
    def start_crafting(self, user_id: str, recipe_id: str, quantity: int = 1) -> Dict:
        """开始制作"""
        job_id = f"craft_{user_id}_{int(time.time() * 1000)}"
        recipe = self.recipes.get(recipe_id)
        
        if not recipe:
            return {"success": False, "error": "Recipe not found"}
        
        job = CraftingJob(
            job_id=job_id,
            user_id=user_id,
            recipe_id=recipe_id,
            start_time=time.time(),
            end_time=time.time() + recipe.craft_time * quantity,
            quantity=quantity
        )
        
        self.active_jobs[job_id] = job
        
        return {
            "success": True,
            "job_id": job_id,
            "end_time": job.end_time
        }
    
    def check_crafting(self, job_id: str) -> Dict:
        """检查制作状态"""
        job = self.active_jobs.get(job_id)
        
        if not job:
            return {"success": False, "error": "Job not found"}
        
        if time.time() < job.end_time:
            progress = (time.time() - job.start_time) / (job.end_time - job.start_time)
            return {
                "success": True,
                "completed": False,
                "progress": min(1.0, progress)
            }
        
        # 制作完成
        recipe = self.recipes.get(job.recipe_id)
        success = random.random() < recipe.success_rate if recipe else True
        
        del self.active_jobs[job_id]
        
        return {
            "success": True,
            "completed": True,
            "result": {
                "item_id": recipe.result_item_id if recipe else None,
                "quantity": job.quantity if success else 0,
                "success": success
            }
        }


class UE5SaveGameSystem:
    """UE5 存档系统"""
    
    def __init__(self):
        self.save_slots: Dict[int, Dict[str, SaveSlot]] = {}
        self.max_slots = 3
        self.encryption_key = "wan_gu_chang_ye_2024"
    
    def _encrypt(self, data: str) -> str:
        """加密数据"""
        key_hash = hashlib.sha256(self.encryption_key.encode()).digest()
        data_bytes = data.encode()
        
        encrypted = bytearray()
        for i, byte in enumerate(data_bytes):
            encrypted.append(byte ^ key_hash[i % len(key_hash)])
        
        return base64.b64encode(encrypted).decode()
    
    def _decrypt(self, data: str) -> str:
        """解密数据"""
        key_hash = hashlib.sha256(self.encryption_key.encode()).digest()
        data_bytes = base64.b64decode(data.encode())
        
        decrypted = bytearray()
        for i, byte in enumerate(data_bytes):
            decrypted.append(byte ^ key_hash[i % len(key_hash)])
        
        return decrypted.decode()
    
    def _generate_checksum(self, data: Dict) -> str:
        """生成校验和"""
        return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()
    
    def save(self, user_id: str, slot_id: int, data: Dict) -> Dict:
        """保存游戏"""
        if slot_id < 0 or slot_id >= self.max_slots:
            return {"success": False, "error": "Invalid slot"}
        
        checksum = self._generate_checksum(data)
        
        save_slot = SaveSlot(
            slot_id=slot_id,
            user_id=user_id,
            save_time=time.time(),
            data=data,
            checksum=checksum
        )
        
        if slot_id not in self.save_slots:
            self.save_slots[slot_id] = {}
        
        self.save_slots[slot_id][user_id] = save_slot
        
        return {
            "success": True,
            "slot_id": slot_id,
            "save_time": save_slot.save_time
        }
    
    def load(self, user_id: str, slot_id: int) -> Dict:
        """读取存档"""
        if slot_id not in self.save_slots:
            return {"success": False, "error": "Slot not found"}
        
        save_slot = self.save_slots[slot_id].get(user_id)
        
        if not save_slot:
            return {"success": False, "error": "Save not found"}
        
        # 验证校验和
        if self._generate_checksum(save_slot.data) != save_slot.checksum:
            return {"success": False, "error": "Save corrupted"}
        
        return {
            "success": True,
            "data": save_slot.data,
            "save_time": save_slot.save_time
        }
    
    def delete_save(self, user_id: str, slot_id: int) -> bool:
        """删除存档"""
        if slot_id in self.save_slots and user_id in self.save_slots[slot_id]:
            del self.save_slots[slot_id][user_id]
            return True
        return False
    
    def get_save_slots(self, user_id: str) -> List[Dict]:
        """获取所有存档槽位"""
        slots = []
        
        for slot_id in range(self.max_slots):
            if slot_id in self.save_slots and user_id in self.save_slots[slot_id]:
                save_slot = self.save_slots[slot_id][user_id]
                slots.append({
                    "slot_id": slot_id,
                    "save_time": save_slot.save_time,
                    "has_data": True
                })
            else:
                slots.append({
                    "slot_id": slot_id,
                    "save_time": None,
                    "has_data": False
                })
        
        return slots


# 全局实例
_crafting_instance: Optional[UE5CraftingSystem] = None
_save_game_instance: Optional[UE5SaveGameSystem] = None


def get_crafting_system() -> UE5CraftingSystem:
    global _crafting_instance
    if _crafting_instance is None:
        _crafting_instance = UE5CraftingSystem()
    return _crafting_instance


def get_save_game_system() -> UE5SaveGameSystem:
    global _save_game_instance
    if _save_game_instance is None:
        _save_game_instance = UE5SaveGameSystem()
    return _save_game_instance


if __name__ == "__main__":
    import random
    print("UE5 Crafting and Save Systems initialized!")
