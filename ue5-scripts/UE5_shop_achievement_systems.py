#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 商店与成就系统
支持虚拟商店、成就系统

功能：
- 商店系统
- 物品购买
- 成就系统
- 成就奖励
"""

import json
import time
import random
from typing import Optional, Dict, Any, List, Set
from dataclasses import dataclass, field
from enum import Enum


class CurrencyType(Enum):
    GOLD = "gold"
    DIAMOND = "diamond"
    HONOR = "honor"
    GUILD = "guild"


class ItemType(Enum):
    CONSUMABLE = "consumable"
    EQUIPMENT = "equipment"
    MATERIAL = "material"
    COSMETIC = "cosmetic"
    MOUNT = "mount"
    PET = "pet"


@dataclass
class ShopItem:
    """商店物品"""
    item_id: str
    name: str
    description: str
    item_type: ItemType
    price: Dict[str, int]
    stock: int = -1  # -1 表示无限
    level_required: int = 1
    premium: bool = False
    discount: float = 0.0
    discount_end_time: Optional[float] = None


@dataclass
class Achievement:
    """成就"""
    achievement_id: str
    name: str
    description: str
    icon: str
    category: str
    objectives: List[Dict]
    rewards: Dict[str, Any]
    hidden: bool = False
    progress: int = 0
    target: int = 1
    completed: bool = False
    claimed: bool = False


class UE5ShopSystem:
    """UE5 商店系统"""
    
    def __init__(self):
        self.items: Dict[str, ShopItem] = {}
        self.user_currencies: Dict[str, Dict[str, int]] = {}
        self.user_purchases: Dict[str, Dict[str, int]] = {}
        self.shop_refresh_time: Dict[str, float] = {}
        self._init_default_items()
    
    def _init_default_items(self):
        """初始化默认商品"""
        default_items = [
            ShopItem("health_potion", "生命药水", "恢复100点生命值", ItemType.CONSUMABLE,
                     {CurrencyType.GOLD.value: 50}, level_required=1),
            ShopItem("mana_potion", "法力药水", "恢复50点法力值", ItemType.CONSUMABLE,
                     {CurrencyType.GOLD.value: 60}, level_required=1),
            ShopItem("iron_sword", "铁剑", "攻击力+10", ItemType.EQUIPMENT,
                     {CurrencyType.GOLD.value: 500}, level_required=10),
            ShopItem("magic_staff", "法杖", "法术强度+15", ItemType.EQUIPMENT,
                     {CurrencyType.GOLD.value: 800}, level_required=15),
            ShopItem("premium_mount", "稀有坐骑", "限定坐骑", ItemType.MOUNT,
                     {CurrencyType.DIAMOND.value: 100}, premium=True, level_required=30),
            ShopItem("pet_egg", "宠物蛋", "随机获得一只宠物", ItemType.PET,
                     {CurrencyType.DIAMOND.value: 50}, level_required=20),
        ]
        
        for item in default_items:
            self.items[item.item_id] = item
    
    def get_user_currency(self, user_id: str) -> Dict[str, int]:
        """获取用户货币"""
        return self.user_currencies.get(user_id, {
            CurrencyType.GOLD.value: 1000,
            CurrencyType.DIAMOND.value: 100,
            CurrencyType.HONOR.value: 0,
            CurrencyType.GUILD.value: 0
        })
    
    def add_currency(self, user_id: str, currency_type: CurrencyType, amount: int):
        """增加货币"""
        if user_id not in self.user_currencies:
            self.user_currencies[user_id] = {
                CurrencyType.GOLD.value: 1000,
                CurrencyType.DIAMOND.value: 100,
                CurrencyType.HONOR.value: 0,
                CurrencyType.GUILD.value: 0
            }
        
        self.user_currencies[user_id][currency_type.value] = \
            self.user_currencies[user_id].get(currency_type.value, 0) + amount
    
    def purchase(self, user_id: str, item_id: str, quantity: int = 1) -> Dict:
        """购买物品"""
        item = self.items.get(item_id)
        
        if not item:
            return {"success": False, "error": "Item not found"}
        
        # 检查库存
        if item.stock > 0:
            if user_id not in self.user_purchases:
                self.user_purchases[user_id] = {}
            
            purchased = self.user_purchases[user_id].get(item_id, 0)
            if purchased + quantity > item.stock:
                return {"success": False, "error": "Out of stock"}
        
        # 检查货币
        currencies = self.get_user_currency(user_id)
        for currency, price in item.price.items():
            price_total = int(price * quantity * (1 - item.discount))
            if currencies.get(currency, 0) < price_total:
                return {"success": False, "error": f"Not enough {currency}"}
        
        # 扣除货币
        for currency, price in item.price.items():
            price_total = int(price * quantity * (1 - item.discount))
            self.user_currencies[user_id][currency] -= price_total
        
        # 记录购买
        if user_id not in self.user_purchases:
            self.user_purchases[user_id] = {}
        
        self.user_purchases[user_id][item_id] = \
            self.user_purchases[user_id].get(item_id, 0) + quantity
        
        return {
            "success": True,
            "item_id": item_id,
            "quantity": quantity,
            "remaining_currencies": self.user_currencies[user_id]
        }
    
    def get_shop_items(self, category: ItemType = None) -> List[Dict]:
        """获取商店物品列表"""
        items = []
        
        for item in self.items.values():
            if category and item.item_type != category:
                continue
            
            items.append({
                "item_id": item.item_id,
                "name": item.name,
                "description": item.description,
                "item_type": item.item_type.value,
                "price": item.price,
                "stock": item.stock,
                "level_required": item.level_required,
                "premium": item.premium,
                "discount": item.discount,
                "has_discount": item.discount > 0
            })
        
        return items


class UE5AchievementSystem:
    """UE5 成就系统"""
    
    def __init__(self):
        self.achievements: Dict[str, Achievement] = {}
        self.user_achievements: Dict[str, Set[str]] = {}
        self._init_default_achievements()
    
    def _init_default_achievements(self):
        """初始化默认成就"""
        default_achievements = [
            Achievement("first_login", "初次登录", "首次登录游戏", "icon_login", "general",
                        [{"type": "login", "target": 1}],
                        {CurrencyType.GOLD.value: 100}),
            Achievement("reach_level_10", "初出茅庐", "达到10级", "icon_level", "progression",
                        [{"type": "level", "target": 10}],
                        {CurrencyType.GOLD.value: 500}),
            Achievement("reach_level_50", "小有成就", "达到50级", "icon_level", "progression",
                        [{"type": "level", "target": 50}],
                        {CurrencyType.GOLD.value: 2000, CurrencyType.DIAMOND.value: 50}),
            Achievement("kill_100", "百人斩", "击败100个敌人", "icon_combat", "combat",
                        [{"type": "kills", "target": 100}],
                        {CurrencyType.GOLD.value: 1000}),
            Achievement("complete_10_quests", "任务达人", "完成10个任务", "icon_quest", "quest",
                        [{"type": "quests_completed", "target": 10}],
                        {CurrencyType.GOLD.value: 500}),
            Achievement("collect_100_items", "收藏家", "收集100件物品", "icon_collect", "collection",
                        [{"type": "items_collected", "target": 100}],
                        {CurrencyType.GOLD.value: 1500}),
        ]
        
        for achievement in default_achievements:
            self.achievements[achievement.achievement_id] = achievement
    
    def update_progress(self, user_id: str, achievement_id: str, progress: int) -> Dict:
        """更新成就进度"""
        achievement = self.achievements.get(achievement_id)
        
        if not achievement:
            return {"success": False}
        
        achievement.progress = min(progress, achievement.target)
        
        if achievement.progress >= achievement.target and not achievement.completed:
            achievement.completed = True
            
            if user_id not in self.user_achievements:
                self.user_achievements[user_id] = set()
            
            self.user_achievements[user_id].add(achievement_id)
        
        return {
            "success": True,
            "progress": achievement.progress,
            "completed": achievement.completed
        }
    
    def claim_reward(self, user_id: str, achievement_id: str) -> Dict:
        """领取成就奖励"""
        achievement = self.achievements.get(achievement_id)
        
        if not achievement or not achievement.completed:
            return {"success": False, "error": "Achievement not completed"}
        
        if achievement.claimed:
            return {"success": False, "error": "Already claimed"}
        
        achievement.claimed = True
        
        return {
            "success": True,
            "rewards": achievement.rewards
        }
    
    def get_user_achievements(self, user_id: str) -> List[Dict]:
        """获取用户成就列表"""
        achievements = []
        
        for achievement in self.achievements.values():
            achievements.append({
                "achievement_id": achievement.achievement_id,
                "name": achievement.name,
                "description": achievement.description,
                "icon": achievement.icon,
                "category": achievement.category,
                "progress": achievement.progress,
                "target": achievement.target,
                "completed": achievement.completed,
                "claimed": achievement.claimed,
                "rewards": achievement.rewards
            })
        
        return achievements


# 全局实例
_shop_instance: Optional[UE5ShopSystem] = None
_achievement_instance: Optional[UE5AchievementSystem] = None


def get_shop_system() -> UE5ShopSystem:
    global _shop_instance
    if _shop_instance is None:
        _shop_instance = UE5ShopSystem()
    return _shop_instance


def get_achievement_system() -> UE5AchievementSystem:
    global _achievement_instance
    if _achievement_instance is None:
        _achievement_instance = UE5AchievementSystem()
    return _achievement_instance


if __name__ == "__main__":
    shop = get_shop_system()
    achievement = get_achievement_system()
    
    print("Shop items:", shop.get_shop_items())
    print("Achievements:", achievement.get_user_achievements("player1"))
