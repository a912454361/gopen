#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 游戏核心系统合集
包含战斗、对话、任务、背包、技能树、制作等核心游戏系统
"""

import json
import time
import math
import random
import hashlib
from typing import Optional, Dict, Any, List, Tuple, Set, Callable
from dataclasses import dataclass, field
from enum import Enum


# ============== 战斗系统 ==============

class DamageType(Enum):
    PHYSICAL = "physical"
    MAGICAL = "magical"
    TRUE = "true"
    FIRE = "fire"
    ICE = "ice"
    LIGHTNING = "lightning"


class CombatState(Enum):
    IDLE = "idle"
    ATTACKING = "attacking"
    DEFENDING = "defending"
    STUNNED = "stunned"
    DEAD = "dead"


@dataclass
class CombatUnit:
    """战斗单位"""
    unit_id: str
    name: str
    level: int
    current_health: float
    max_health: float
    current_mana: float
    max_mana: float
    attack: float
    defense: float
    speed: float
    state: CombatState = CombatState.IDLE
    position: Tuple[float, float, float] = (0.0, 0.0, 0.0)
    target_id: Optional[str] = None
    cooldowns: Dict[str, float] = field(default_factory=dict)


@dataclass
class Skill:
    """技能"""
    skill_id: str
    name: str
    damage_type: DamageType
    base_damage: float
    mana_cost: float
    cooldown: float
    range: float
    cast_time: float
    description: str = ""


class UE5CombatSystem:
    """UE5 战斗系统"""
    
    def __init__(self):
        self.units: Dict[str, CombatUnit] = {}
        self.skills: Dict[str, Skill] = {}
        self.combat_log: List[Dict] = []
        self._init_default_skills()
    
    def _init_default_skills(self):
        """初始化默认技能"""
        default_skills = [
            Skill("basic_attack", "普通攻击", DamageType.PHYSICAL, 10, 0, 1.0, 5.0, 0.5),
            Skill("fireball", "火球术", DamageType.FIRE, 50, 20, 5.0, 20.0, 1.5),
            Skill("ice_bolt", "冰箭", DamageType.ICE, 40, 15, 4.0, 15.0, 1.0),
            Skill("lightning", "闪电链", DamageType.LIGHTNING, 60, 25, 6.0, 25.0, 1.2),
        ]
        for skill in default_skills:
            self.skills[skill.skill_id] = skill
    
    def register_unit(self, unit: CombatUnit):
        """注册战斗单位"""
        self.units[unit.unit_id] = unit
    
    def attack(self, attacker_id: str, target_id: str, skill_id: str = "basic_attack") -> Dict:
        """执行攻击"""
        attacker = self.units.get(attacker_id)
        target = self.units.get(target_id)
        skill = self.skills.get(skill_id)
        
        if not attacker or not target or not skill:
            return {"success": False, "error": "Invalid combat data"}
        
        # 检查冷却
        if skill_id in attacker.cooldowns and attacker.cooldowns[skill_id] > time.time():
            return {"success": False, "error": "Skill on cooldown"}
        
        # 检查距离
        distance = math.sqrt(
            (attacker.position[0] - target.position[0]) ** 2 +
            (attacker.position[1] - target.position[1]) ** 2 +
            (attacker.position[2] - target.position[2]) ** 2
        )
        if distance > skill.range:
            return {"success": False, "error": "Out of range"}
        
        # 检查法力
        if attacker.current_mana < skill.mana_cost:
            return {"success": False, "error": "Not enough mana"}
        
        # 计算伤害
        damage = self._calculate_damage(attacker, target, skill)
        
        # 应用伤害
        target.current_health = max(0, target.current_health - damage)
        attacker.current_mana -= skill.mana_cost
        attacker.cooldowns[skill_id] = time.time() + skill.cooldown
        
        # 记录日志
        log_entry = {
            "time": time.time(),
            "attacker": attacker.name,
            "target": target.name,
            "skill": skill.name,
            "damage": damage,
            "damage_type": skill.damage_type.value
        }
        self.combat_log.append(log_entry)
        
        return {
            "success": True,
            "damage": damage,
            "target_health": target.current_health,
            "target_dead": target.current_health <= 0
        }
    
    def _calculate_damage(self, attacker: CombatUnit, target: CombatUnit, skill: Skill) -> float:
        """计算伤害"""
        base_damage = skill.base_damage + attacker.attack * 0.5
        defense_reduction = target.defense * 0.3
        final_damage = max(1, base_damage - defense_reduction)
        
        # 随机浮动
        variance = random.uniform(0.9, 1.1)
        final_damage *= variance
        
        return final_damage
    
    def get_combat_state(self, unit_id: str) -> Optional[Dict]:
        """获取战斗状态"""
        unit = self.units.get(unit_id)
        if not unit:
            return None
        
        return {
            "unit_id": unit.unit_id,
            "name": unit.name,
            "health": unit.current_health,
            "max_health": unit.max_health,
            "mana": unit.current_mana,
            "max_mana": unit.max_mana,
            "state": unit.state.value,
            "cooldowns": unit.cooldowns
        }


# ============== 对话系统 ==============

class DialogueNodeType(Enum):
    TEXT = "text"
    CHOICE = "choice"
    CONDITION = "condition"
    ACTION = "action"
    END = "end"


@dataclass
class DialogueNode:
    """对话节点"""
    node_id: str
    node_type: DialogueNodeType
    speaker: str
    text: str
    choices: List[Dict] = field(default_factory=list)
    next_node_id: Optional[str] = None
    conditions: List[Dict] = field(default_factory=list)
    actions: List[Dict] = field(default_factory=list)


@dataclass
class Dialogue:
    """对话"""
    dialogue_id: str
    title: str
    nodes: Dict[str, DialogueNode] = field(default_factory=dict)
    start_node_id: str = ""


class UE5DialogueSystem:
    """UE5 对话系统"""
    
    def __init__(self):
        self.dialogues: Dict[str, Dialogue] = {}
        self.active_dialogues: Dict[str, str] = {}  # user_id -> dialogue_id
        self.current_nodes: Dict[str, str] = {}  # user_id -> node_id
    
    def create_dialogue(self, dialogue_id: str, title: str, nodes: List[DialogueNode], start_node_id: str) -> Dialogue:
        """创建对话"""
        dialogue = Dialogue(
            dialogue_id=dialogue_id,
            title=title,
            start_node_id=start_node_id
        )
        
        for node in nodes:
            dialogue.nodes[node.node_id] = node
        
        self.dialogues[dialogue_id] = dialogue
        return dialogue
    
    def start_dialogue(self, user_id: str, dialogue_id: str) -> Optional[Dict]:
        """开始对话"""
        dialogue = self.dialogues.get(dialogue_id)
        if not dialogue:
            return None
        
        self.active_dialogues[user_id] = dialogue_id
        self.current_nodes[user_id] = dialogue.start_node_id
        
        return self.get_current_node(user_id)
    
    def get_current_node(self, user_id: str) -> Optional[Dict]:
        """获取当前节点"""
        dialogue_id = self.active_dialogues.get(user_id)
        node_id = self.current_nodes.get(user_id)
        
        if not dialogue_id or not node_id:
            return None
        
        dialogue = self.dialogues.get(dialogue_id)
        node = dialogue.nodes.get(node_id) if dialogue else None
        
        if not node:
            return None
        
        return {
            "node_id": node.node_id,
            "node_type": node.node_type.value,
            "speaker": node.speaker,
            "text": node.text,
            "choices": node.choices
        }
    
    def select_choice(self, user_id: str, choice_index: int) -> Optional[Dict]:
        """选择选项"""
        node = self.get_current_node(user_id)
        if not node or choice_index >= len(node["choices"]):
            return None
        
        choice = node["choices"][choice_index]
        next_node_id = choice.get("next_node_id")
        
        if next_node_id:
            self.current_nodes[user_id] = next_node_id
            return self.get_current_node(user_id)
        
        return None
    
    def end_dialogue(self, user_id: str):
        """结束对话"""
        if user_id in self.active_dialogues:
            del self.active_dialogues[user_id]
        if user_id in self.current_nodes:
            del self.current_nodes[user_id]


# ============== 任务系统 ==============

class QuestStatus(Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class QuestType(Enum):
    MAIN = "main"
    SIDE = "side"
    DAILY = "daily"
    REPEATABLE = "repeatable"


@dataclass
class QuestObjective:
    """任务目标"""
    objective_id: str
    description: str
    current: int = 0
    target: int = 1
    completed: bool = False


@dataclass
class Quest:
    """任务"""
    quest_id: str
    name: str
    description: str
    quest_type: QuestType
    status: QuestStatus = QuestStatus.LOCKED
    level_required: int = 1
    objectives: List[QuestObjective] = field(default_factory=list)
    rewards: Dict[str, Any] = field(default_factory=dict)
    prerequisites: List[str] = field(default_factory=list)
    time_limit: Optional[float] = None
    start_time: Optional[float] = None


class UE5QuestSystem:
    """UE5 任务系统"""
    
    def __init__(self):
        self.quests: Dict[str, Quest] = {}
        self.user_quests: Dict[str, Set[str]] = {}
    
    def create_quest(self, quest: Quest):
        """创建任务"""
        self.quests[quest.quest_id] = quest
    
    def accept_quest(self, user_id: str, quest_id: str) -> bool:
        """接受任务"""
        quest = self.quests.get(quest_id)
        if not quest or quest.status != QuestStatus.AVAILABLE:
            return False
        
        quest.status = QuestStatus.IN_PROGRESS
        quest.start_time = time.time()
        
        if user_id not in self.user_quests:
            self.user_quests[user_id] = set()
        self.user_quests[user_id].add(quest_id)
        
        return True
    
    def update_objective(self, quest_id: str, objective_id: str, progress: int) -> bool:
        """更新任务目标"""
        quest = self.quests.get(quest_id)
        if not quest:
            return False
        
        for objective in quest.objectives:
            if objective.objective_id == objective_id:
                objective.current = min(progress, objective.target)
                objective.completed = objective.current >= objective.target
                self._check_quest_completion(quest)
                return True
        
        return False
    
    def _check_quest_completion(self, quest: Quest):
        """检查任务完成"""
        if all(obj.completed for obj in quest.objectives):
            quest.status = QuestStatus.COMPLETED
    
    def complete_quest(self, user_id: str, quest_id: str) -> Dict:
        """完成任务"""
        quest = self.quests.get(quest_id)
        if not quest or quest.status != QuestStatus.COMPLETED:
            return {"success": False, "error": "Quest not completable"}
        
        return {
            "success": True,
            "rewards": quest.rewards
        }
    
    def get_user_quests(self, user_id: str, status: QuestStatus = None) -> List[Dict]:
        """获取用户任务列表"""
        quests = []
        
        for quest_id in self.user_quests.get(user_id, set()):
            quest = self.quests.get(quest_id)
            if quest and (status is None or quest.status == status):
                quests.append({
                    "quest_id": quest.quest_id,
                    "name": quest.name,
                    "description": quest.description,
                    "type": quest.quest_type.value,
                    "status": quest.status.value,
                    "objectives": [{
                        "objective_id": obj.objective_id,
                        "description": obj.description,
                        "current": obj.current,
                        "target": obj.target,
                        "completed": obj.completed
                    } for obj in quest.objectives]
                })
        
        return quests


# ============== 背包系统 ==============

class ItemRarity(Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


@dataclass
class Item:
    """物品"""
    item_id: str
    name: str
    description: str
    rarity: ItemRarity
    max_stack: int = 1
    icon: str = ""
    value: int = 0
    weight: float = 0.0


@dataclass
class InventorySlot:
    """背包槽位"""
    slot_id: int
    item_id: Optional[str] = None
    quantity: int = 0


class UE5InventorySystem:
    """UE5 背包系统"""
    
    def __init__(self):
        self.items: Dict[str, Item] = {}
        self.inventories: Dict[str, List[InventorySlot]] = {}
        self.default_capacity = 40
    
    def create_inventory(self, user_id: str, capacity: int = None):
        """创建背包"""
        capacity = capacity or self.default_capacity
        self.inventories[user_id] = [InventorySlot(slot_id=i) for i in range(capacity)]
    
    def add_item(self, user_id: str, item_id: str, quantity: int = 1) -> bool:
        """添加物品"""
        if user_id not in self.inventories:
            self.create_inventory(user_id)
        
        item = self.items.get(item_id)
        if not item:
            return False
        
        inventory = self.inventories[user_id]
        
        # 查找已有堆叠
        if item.max_stack > 1:
            for slot in inventory:
                if slot.item_id == item_id and slot.quantity < item.max_stack:
                    add_amount = min(quantity, item.max_stack - slot.quantity)
                    slot.quantity += add_amount
                    quantity -= add_amount
                    if quantity <= 0:
                        return True
        
        # 查找空槽位
        for slot in inventory:
            if slot.item_id is None:
                add_amount = min(quantity, item.max_stack)
                slot.item_id = item_id
                slot.quantity = add_amount
                quantity -= add_amount
                if quantity <= 0:
                    return True
        
        return quantity == 0
    
    def remove_item(self, user_id: str, item_id: str, quantity: int = 1) -> bool:
        """移除物品"""
        if user_id not in self.inventories:
            return False
        
        inventory = self.inventories[user_id]
        
        for slot in reversed(inventory):
            if slot.item_id == item_id and slot.quantity > 0:
                remove_amount = min(quantity, slot.quantity)
                slot.quantity -= remove_amount
                quantity -= remove_amount
                
                if slot.quantity <= 0:
                    slot.item_id = None
                    slot.quantity = 0
                
                if quantity <= 0:
                    return True
        
        return False
    
    def get_inventory(self, user_id: str) -> List[Dict]:
        """获取背包"""
        if user_id not in self.inventories:
            self.create_inventory(user_id)
        
        inventory = self.inventories[user_id]
        
        return [{
            "slot_id": slot.slot_id,
            "item_id": slot.item_id,
            "quantity": slot.quantity,
            "item": {
                "name": self.items[slot.item_id].name,
                "rarity": self.items[slot.item_id].rarity.value,
                "icon": self.items[slot.item_id].icon
            } if slot.item_id and slot.item_id in self.items else None
        } for slot in inventory]


# ============== 技能树系统 ==============

@dataclass
class SkillNode:
    """技能节点"""
    node_id: str
    name: str
    description: str
    icon: str
    level_required: int = 1
    max_level: int = 5
    current_level: int = 0
    prerequisites: List[str] = field(default_factory=list)
    effects: Dict[str, float] = field(default_factory=dict)
    cost_per_level: int = 1


class UE5SkillTreeSystem:
    """UE5 技能树系统"""
    
    def __init__(self):
        self.skill_nodes: Dict[str, SkillNode] = {}
        self.user_skill_points: Dict[str, int] = {}
        self.user_skills: Dict[str, Dict[str, int]] = {}
    
    def create_skill_node(self, node: SkillNode):
        """创建技能节点"""
        self.skill_nodes[node.node_id] = node
    
    def upgrade_skill(self, user_id: str, node_id: str) -> Dict:
        """升级技能"""
        node = self.skill_nodes.get(node_id)
        if not node:
            return {"success": False, "error": "Skill not found"}
        
        # 检查前置技能
        for prereq_id in node.prerequisites:
            prereq_level = self.user_skills.get(user_id, {}).get(prereq_id, 0)
            if prereq_level <= 0:
                return {"success": False, "error": "Prerequisite not met"}
        
        # 检查技能点
        current_level = self.user_skills.get(user_id, {}).get(node_id, 0)
        if current_level >= node.max_level:
            return {"success": False, "error": "Max level reached"}
        
        if user_id not in self.user_skill_points or self.user_skill_points[user_id] < node.cost_per_level:
            return {"success": False, "error": "Not enough skill points"}
        
        # 升级
        if user_id not in self.user_skills:
            self.user_skills[user_id] = {}
        
        self.user_skills[user_id][node_id] = current_level + 1
        self.user_skill_points[user_id] -= node.cost_per_level
        
        return {
            "success": True,
            "node_id": node_id,
            "new_level": self.user_skills[user_id][node_id]
        }
    
    def get_skill_tree(self, user_id: str) -> List[Dict]:
        """获取技能树"""
        user_skill_levels = self.user_skills.get(user_id, {})
        
        return [{
            "node_id": node.node_id,
            "name": node.name,
            "description": node.description,
            "icon": node.icon,
            "level_required": node.level_required,
            "max_level": node.max_level,
            "current_level": user_skill_levels.get(node.node_id, 0),
            "prerequisites": node.prerequisites,
            "can_upgrade": all(
                user_skill_levels.get(p, 0) > 0 for p in node.prerequisites
            ) and user_skill_levels.get(node.node_id, 0) < node.max_level
        } for node in self.skill_nodes.values()]


# 全局实例
_combat_instance: Optional[UE5CombatSystem] = None
_dialogue_instance: Optional[UE5DialogueSystem] = None
_quest_instance: Optional[UE5QuestSystem] = None
_inventory_instance: Optional[UE5InventorySystem] = None
_skill_tree_instance: Optional[UE5SkillTreeSystem] = None


def get_combat_system() -> UE5CombatSystem:
    global _combat_instance
    if _combat_instance is None:
        _combat_instance = UE5CombatSystem()
    return _combat_instance


def get_dialogue_system() -> UE5DialogueSystem:
    global _dialogue_instance
    if _dialogue_instance is None:
        _dialogue_instance = UE5DialogueSystem()
    return _dialogue_instance


def get_quest_system() -> UE5QuestSystem:
    global _quest_instance
    if _quest_instance is None:
        _quest_instance = UE5QuestSystem()
    return _quest_instance


def get_inventory_system() -> UE5InventorySystem:
    global _inventory_instance
    if _inventory_instance is None:
        _inventory_instance = UE5InventorySystem()
    return _inventory_instance


def get_skill_tree_system() -> UE5SkillTreeSystem:
    global _skill_tree_instance
    if _skill_tree_instance is None:
        _skill_tree_instance = UE5SkillTreeSystem()
    return _skill_tree_instance


if __name__ == "__main__":
    print("UE5 Game Core Systems initialized!")
