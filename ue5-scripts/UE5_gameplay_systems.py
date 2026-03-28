#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 游戏玩法系统合集
包含任务标记、快捷栏、目标锁定、复活、坐骑等系统

功能：
- 任务标记系统
- 快捷栏系统
- 目标锁定系统
- 复活系统
- 坐骑系统
"""

import json
import time
import math
import hashlib
from typing import Optional, Dict, Any, List, Callable, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum


# ============== 任务标记系统 ==============

class QuestMarkerType(Enum):
    """任务标记类型"""
    OBJECTIVE = "objective"
    TURN_IN = "turn_in"
    KILL = "kill"
    COLLECT = "collect"
    EXPLORE = "explore"
    INTERACT = "interact"


@dataclass
class QuestMarker:
    """任务标记"""
    marker_id: str
    quest_id: str
    marker_type: QuestMarkerType
    position: Tuple[float, float, float]
    name: str
    description: str = ""
    icon: Optional[str] = None
    distance: float = 0.0
    visible: bool = True
    priority: int = 1
    progress: int = 0
    progress_max: int = 1
    waypoints: List[Tuple[float, float, float]] = field(default_factory=list)


class UE5QuestMarkerSystem:
    """UE5 任务标记系统"""
    
    def __init__(self):
        self.markers: Dict[str, QuestMarker] = {}
        self.user_tracking: Dict[str, Set[str]] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.max_tracking = 5
        self.show_distance = True
    
    def create_marker(self, quest_id: str, marker_type: QuestMarkerType,
                      position: Tuple[float, float, float], name: str,
                      **kwargs) -> QuestMarker:
        """创建任务标记"""
        marker_id = hashlib.md5(f"{quest_id}_{marker_type.value}_{position}".encode()).hexdigest()[:12]
        
        marker = QuestMarker(
            marker_id=marker_id,
            quest_id=quest_id,
            marker_type=marker_type,
            position=position,
            name=name,
            description=kwargs.get("description", ""),
            icon=kwargs.get("icon"),
            priority=kwargs.get("priority", 1),
            progress_max=kwargs.get("progress_max", 1)
        )
        
        self.markers[marker_id] = marker
        
        self._trigger_event("marker_created", {
            "marker_id": marker_id,
            "quest_id": quest_id,
            "marker_type": marker_type.value
        })
        
        return marker
    
    def update_progress(self, marker_id: str, progress: int) -> bool:
        """更新标记进度"""
        if marker_id not in self.markers:
            return False
        
        marker = self.markers[marker_id]
        marker.progress = min(progress, marker.progress_max)
        
        self._trigger_event("marker_progress_updated", {
            "marker_id": marker_id,
            "progress": progress,
            "progress_max": marker.progress_max
        })
        
        return True
    
    def track_marker(self, user_id: str, marker_id: str) -> bool:
        """追踪标记"""
        if user_id not in self.user_tracking:
            self.user_tracking[user_id] = set()
        
        if len(self.user_tracking[user_id]) >= self.max_tracking:
            return False
        
        self.user_tracking[user_id].add(marker_id)
        return True
    
    def untrack_marker(self, user_id: str, marker_id: str) -> bool:
        """取消追踪"""
        if user_id not in self.user_tracking:
            return False
        
        self.user_tracking[user_id].discard(marker_id)
        return True
    
    def get_tracked_markers(self, user_id: str,
                            player_position: Tuple[float, float, float]) -> List[Dict]:
        """获取追踪的标记"""
        markers = []
        
        for marker_id in self.user_tracking.get(user_id, set()):
            marker = self.markers.get(marker_id)
            if marker and marker.visible:
                distance = math.sqrt(
                    (marker.position[0] - player_position[0]) ** 2 +
                    (marker.position[1] - player_position[1]) ** 2 +
                    (marker.position[2] - player_position[2]) ** 2
                )
                
                markers.append({
                    "marker_id": marker.marker_id,
                    "quest_id": marker.quest_id,
                    "marker_type": marker.marker_type.value,
                    "position": marker.position,
                    "name": marker.name,
                    "description": marker.description,
                    "icon": marker.icon,
                    "distance": distance,
                    "progress": marker.progress,
                    "progress_max": marker.progress_max,
                    "waypoints": marker.waypoints
                })
        
        markers.sort(key=lambda x: x["distance"])
        
        return markers
    
    def get_quest_markers(self, quest_id: str) -> List[Dict]:
        """获取任务的所有标记"""
        markers = []
        
        for marker in self.markers.values():
            if marker.quest_id == quest_id:
                markers.append({
                    "marker_id": marker.marker_id,
                    "marker_type": marker.marker_type.value,
                    "position": marker.position,
                    "name": marker.name,
                    "progress": marker.progress,
                    "progress_max": marker.progress_max
                })
        
        return markers
    
    def remove_marker(self, marker_id: str):
        """移除标记"""
        if marker_id in self.markers:
            del self.markers[marker_id]
            
            # 从用户追踪中移除
            for user_id in self.user_tracking:
                self.user_tracking[user_id].discard(marker_id)
    
    def remove_quest_markers(self, quest_id: str):
        """移除任务的所有标记"""
        to_remove = [m.marker_id for m in self.markers.values() if m.quest_id == quest_id]
        
        for marker_id in to_remove:
            self.remove_marker(marker_id)
    
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
                print(f"[QuestMarker] Event handler error: {e}")


# ============== 快捷栏系统 ==============

class HotbarSlotType(Enum):
    """快捷栏槽位类型"""
    SKILL = "skill"
    ITEM = "item"
    EMOTE = "emote"
    MACRO = "macro"
    EMPTY = "empty"


@dataclass
class HotbarSlot:
    """快捷栏槽位"""
    slot_id: int
    slot_type: HotbarSlotType = HotbarSlotType.EMPTY
    item_id: Optional[str] = None
    icon: Optional[str] = None
    name: str = ""
    cooldown: float = 0.0
    max_cooldown: float = 0.0
    quantity: int = 0
    keybind: Optional[str] = None
    enabled: bool = True


class UE5HotbarSystem:
    """UE5 快捷栏系统"""
    
    def __init__(self):
        self.user_hotbars: Dict[str, List[HotbarSlot]] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.default_slots = 12
        self.max_bars = 5
    
    def create_hotbar(self, user_id: str, slots: int = None) -> List[HotbarSlot]:
        """创建快捷栏"""
        if slots is None:
            slots = self.default_slots
        
        hotbar = []
        for i in range(slots):
            keybind = str((i + 1) % 10) if i < 10 else None
            hotbar.append(HotbarSlot(slot_id=i, keybind=keybind))
        
        self.user_hotbars[user_id] = hotbar
        
        return hotbar
    
    def set_slot(self, user_id: str, slot_id: int, slot_type: HotbarSlotType,
                 item_id: str, icon: str, name: str, cooldown: float = 0.0,
                 quantity: int = 0) -> bool:
        """设置槽位"""
        if user_id not in self.user_hotbars:
            self.create_hotbar(user_id)
        
        hotbar = self.user_hotbars[user_id]
        
        if slot_id < 0 or slot_id >= len(hotbar):
            return False
        
        hotbar[slot_id] = HotbarSlot(
            slot_id=slot_id,
            slot_type=slot_type,
            item_id=item_id,
            icon=icon,
            name=name,
            max_cooldown=cooldown,
            quantity=quantity,
            keybind=hotbar[slot_id].keybind
        )
        
        self._trigger_event("slot_set", {
            "user_id": user_id,
            "slot_id": slot_id,
            "slot_type": slot_type.value,
            "item_id": item_id
        })
        
        return True
    
    def clear_slot(self, user_id: str, slot_id: int) -> bool:
        """清空槽位"""
        if user_id not in self.user_hotbars:
            return False
        
        hotbar = self.user_hotbars[user_id]
        
        if slot_id < 0 or slot_id >= len(hotbar):
            return False
        
        hotbar[slot_id] = HotbarSlot(slot_id=slot_id, keybind=hotbar[slot_id].keybind)
        
        return True
    
    def use_slot(self, user_id: str, slot_id: int) -> Dict:
        """使用槽位"""
        if user_id not in self.user_hotbars:
            return {"success": False, "error": "No hotbar"}
        
        hotbar = self.user_hotbars[user_id]
        
        if slot_id < 0 or slot_id >= len(hotbar):
            return {"success": False, "error": "Invalid slot"}
        
        slot = hotbar[slot_id]
        
        if slot.slot_type == HotbarSlotType.EMPTY:
            return {"success": False, "error": "Empty slot"}
        
        if not slot.enabled:
            return {"success": False, "error": "Slot disabled"}
        
        if slot.cooldown > 0:
            return {"success": False, "error": "On cooldown", "remaining": slot.cooldown}
        
        # 触发冷却
        if slot.max_cooldown > 0:
            slot.cooldown = slot.max_cooldown
        
        # 消耗数量
        if slot.quantity > 0:
            slot.quantity -= 1
            if slot.quantity <= 0:
                self.clear_slot(user_id, slot_id)
        
        self._trigger_event("slot_used", {
            "user_id": user_id,
            "slot_id": slot_id,
            "slot_type": slot.slot_type.value,
            "item_id": slot.item_id
        })
        
        return {
            "success": True,
            "slot_type": slot.slot_type.value,
            "item_id": slot.item_id
        }
    
    def update_cooldowns(self, delta_time: float):
        """更新冷却"""
        for hotbar in self.user_hotbars.values():
            for slot in hotbar:
                if slot.cooldown > 0:
                    slot.cooldown = max(0, slot.cooldown - delta_time)
    
    def get_hotbar(self, user_id: str) -> List[Dict]:
        """获取快捷栏"""
        if user_id not in self.user_hotbars:
            self.create_hotbar(user_id)
        
        return [{
            "slot_id": slot.slot_id,
            "slot_type": slot.slot_type.value,
            "item_id": slot.item_id,
            "icon": slot.icon,
            "name": slot.name,
            "cooldown": slot.cooldown,
            "max_cooldown": slot.max_cooldown,
            "quantity": slot.quantity,
            "keybind": slot.keybind,
            "enabled": slot.enabled
        } for slot in self.user_hotbars[user_id]]
    
    def set_keybind(self, user_id: str, slot_id: int, key: str) -> bool:
        """设置快捷键"""
        if user_id not in self.user_hotbars:
            return False
        
        hotbar = self.user_hotbars[user_id]
        
        if slot_id < 0 or slot_id >= len(hotbar):
            return False
        
        hotbar[slot_id].keybind = key
        return True
    
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
                print(f"[Hotbar] Event handler error: {e}")


# ============== 目标锁定系统 ==============

@dataclass
class TargetInfo:
    """目标信息"""
    target_id: str
    target_name: str
    target_type: str  # player, enemy, npc, object
    position: Tuple[float, float, float]
    distance: float
    level: int = 1
    health_percentage: float = 1.0
    hostility: str = "neutral"  # friendly, neutral, hostile


class UE5TargetLockSystem:
    """UE5 目标锁定系统"""
    
    def __init__(self):
        self.user_targets: Dict[str, Optional[str]] = {}
        self.target_data: Dict[str, TargetInfo] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.max_lock_distance = 100.0
        self.auto_lock_enabled = True
    
    def lock_target(self, user_id: str, target_id: str, target_info: TargetInfo) -> bool:
        """锁定目标"""
        self.user_targets[user_id] = target_id
        self.target_data[target_id] = target_info
        
        self._trigger_event("target_locked", {
            "user_id": user_id,
            "target_id": target_id,
            "target_name": target_info.target_name,
            "target_type": target_info.target_type
        })
        
        return True
    
    def unlock_target(self, user_id: str) -> bool:
        """解锁目标"""
        if user_id not in self.user_targets:
            return False
        
        target_id = self.user_targets[user_id]
        self.user_targets[user_id] = None
        
        self._trigger_event("target_unlocked", {
            "user_id": user_id,
            "target_id": target_id
        })
        
        return True
    
    def switch_target(self, user_id: str, targets: List[TargetInfo],
                      direction: int = 1) -> Optional[str]:
        """切换目标"""
        current_target = self.user_targets.get(user_id)
        
        if not targets:
            return None
        
        # 排序目标（按距离）
        targets.sort(key=lambda x: x.distance)
        
        # 找到当前目标的索引
        current_index = -1
        if current_target:
            for i, t in enumerate(targets):
                if t.target_id == current_target:
                    current_index = i
                    break
        
        # 计算下一个目标
        next_index = (current_index + direction) % len(targets)
        next_target = targets[next_index]
        
        self.lock_target(user_id, next_target.target_id, next_target)
        
        return next_target.target_id
    
    def find_nearest_target(self, position: Tuple[float, float, float],
                            targets: List[TargetInfo],
                            target_type: str = None) -> Optional[TargetInfo]:
        """查找最近的目标"""
        nearest = None
        min_distance = float('inf')
        
        for target in targets:
            if target_type and target.target_type != target_type:
                continue
            
            if target.distance < min_distance:
                min_distance = target.distance
                nearest = target
        
        return nearest
    
    def get_target(self, user_id: str) -> Optional[Dict]:
        """获取当前目标"""
        target_id = self.user_targets.get(user_id)
        
        if not target_id:
            return None
        
        target_info = self.target_data.get(target_id)
        
        if not target_info:
            return None
        
        return {
            "target_id": target_info.target_id,
            "target_name": target_info.target_name,
            "target_type": target_info.target_type,
            "position": target_info.position,
            "distance": target_info.distance,
            "level": target_info.level,
            "health_percentage": target_info.health_percentage,
            "hostility": target_info.hostility
        }
    
    def update_target_position(self, target_id: str, position: Tuple[float, float, float]):
        """更新目标位置"""
        if target_id in self.target_data:
            self.target_data[target_id].position = position
    
    def update_target_health(self, target_id: str, health_percentage: float):
        """更新目标血量"""
        if target_id in self.target_data:
            self.target_data[target_id].health_percentage = health_percentage
    
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
                print(f"[TargetLock] Event handler error: {e}")


# ============== 复活系统 ==============

class ReviveLocation(Enum):
    """复活地点类型"""
    RESPAWN_POINT = "respawn_point"
    NEAREST_TOWN = "nearest_town"
    CURRENT_LOCATION = "current_location"
    PARTY_LEADER = "party_leader"
    CHECKPOINT = "checkpoint"


@dataclass
class RespawnPoint:
    """复活点"""
    point_id: str
    name: str
    position: Tuple[float, float, float]
    is_default: bool = False
    unlocked: bool = True


@dataclass
class DeathState:
    """死亡状态"""
    user_id: str
    death_position: Tuple[float, float, float]
    death_time: float
    revive_options: List[Dict] = field(default_factory=list)
    respawn_timer: float = 10.0
    exp_penalty: float = 0.05  # 经验惩罚
    currency_penalty: float = 0.0


class UE5ReviveSystem:
    """UE5 复活系统"""
    
    def __init__(self):
        self.respawn_points: Dict[str, RespawnPoint] = {}
        self.death_states: Dict[str, DeathState] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.default_respawn_timer = 10.0
        self.exp_penalty_rate = 0.05
        self.currency_penalty_rate = 0.01
    
    def register_respawn_point(self, point_id: str, name: str,
                               position: Tuple[float, float, float],
                               is_default: bool = False):
        """注册复活点"""
        point = RespawnPoint(
            point_id=point_id,
            name=name,
            position=position,
            is_default=is_default
        )
        
        self.respawn_points[point_id] = point
    
    def handle_death(self, user_id: str, death_position: Tuple[float, float, float],
                     user_level: int, user_currency: float) -> DeathState:
        """处理死亡"""
        # 计算惩罚
        exp_penalty = user_level * 100 * self.exp_penalty_rate
        currency_penalty = user_currency * self.currency_penalty_rate
        
        # 生成复活选项
        revive_options = self._generate_revive_options(user_id, death_position)
        
        death_state = DeathState(
            user_id=user_id,
            death_position=death_position,
            death_time=time.time(),
            revive_options=revive_options,
            exp_penalty=exp_penalty,
            currency_penalty=currency_penalty
        )
        
        self.death_states[user_id] = death_state
        
        self._trigger_event("player_died", {
            "user_id": user_id,
            "death_position": death_position,
            "exp_penalty": exp_penalty,
            "currency_penalty": currency_penalty
        })
        
        return death_state
    
    def _generate_revive_options(self, user_id: str,
                                  death_position: Tuple[float, float, float]) -> List[Dict]:
        """生成复活选项"""
        options = []
        
        # 就地复活（消耗道具）
        options.append({
            "type": ReviveLocation.CURRENT_LOCATION.value,
            "name": "就地复活",
            "cost": {"item": "revive_scroll", "quantity": 1},
            "position": death_position,
            "available": True
        })
        
        # 最近城镇
        nearest_town = self._find_nearest_respawn_point(death_position)
        if nearest_town:
            options.append({
                "type": ReviveLocation.NEAREST_TOWN.value,
                "name": f"返回{nearest_town.name}",
                "cost": {},
                "position": nearest_town.position,
                "available": True
            })
        
        # 默认复活点
        default_point = self._get_default_respawn_point()
        if default_point:
            options.append({
                "type": ReviveLocation.RESPAWN_POINT.value,
                "name": f"复活于{default_point.name}",
                "cost": {},
                "position": default_point.position,
                "available": True
            })
        
        return options
    
    def _find_nearest_respawn_point(self, position: Tuple[float, float, float]) -> Optional[RespawnPoint]:
        """查找最近的复活点"""
        nearest = None
        min_distance = float('inf')
        
        for point in self.respawn_points.values():
            if not point.unlocked:
                continue
            
            distance = math.sqrt(
                (point.position[0] - position[0]) ** 2 +
                (point.position[1] - position[1]) ** 2 +
                (point.position[2] - position[2]) ** 2
            )
            
            if distance < min_distance:
                min_distance = distance
                nearest = point
        
        return nearest
    
    def _get_default_respawn_point(self) -> Optional[RespawnPoint]:
        """获取默认复活点"""
        for point in self.respawn_points.values():
            if point.is_default and point.unlocked:
                return point
        return None
    
    def revive(self, user_id: str, revive_type: ReviveLocation) -> Dict:
        """复活"""
        death_state = self.death_states.get(user_id)
        
        if not death_state:
            return {"success": False, "error": "No death state"}
        
        # 检查复活选项
        selected_option = None
        for option in death_state.revive_options:
            if option["type"] == revive_type.value:
                selected_option = option
                break
        
        if not selected_option:
            return {"success": False, "error": "Invalid revive option"}
        
        # 检查消耗
        if selected_option.get("cost"):
            # 检查是否有足够道具/货币
            pass
        
        # 清除死亡状态
        del self.death_states[user_id]
        
        self._trigger_event("player_revived", {
            "user_id": user_id,
            "revive_type": revive_type.value,
            "position": selected_option["position"],
            "exp_penalty": death_state.exp_penalty,
            "currency_penalty": death_state.currency_penalty
        })
        
        return {
            "success": True,
            "position": selected_option["position"],
            "exp_penalty": death_state.exp_penalty,
            "currency_penalty": death_state.currency_penalty
        }
    
    def get_death_state(self, user_id: str) -> Optional[Dict]:
        """获取死亡状态"""
        death_state = self.death_states.get(user_id)
        
        if not death_state:
            return None
        
        elapsed = time.time() - death_state.death_time
        remaining = max(0, death_state.respawn_timer - elapsed)
        
        return {
            "user_id": death_state.user_id,
            "death_position": death_state.death_position,
            "death_time": death_state.death_time,
            "revive_options": death_state.revive_options,
            "respawn_timer_remaining": remaining,
            "exp_penalty": death_state.exp_penalty,
            "currency_penalty": death_state.currency_penalty
        }
    
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
                print(f"[Revive] Event handler error: {e}")


# ============== 坐骑系统 ==============

class MountType(Enum):
    """坐骑类型"""
    GROUND = "ground"
    FLYING = "flying"
    WATER = "water"
    SPECIAL = "special"


@dataclass
class Mount:
    """坐骑"""
    mount_id: str
    name: str
    mount_type: MountType
    speed: float
    icon: str
    model: str
    description: str = ""
    level_required: int = 1
    unlocked: bool = False
    premium: bool = False
    abilities: List[str] = field(default_factory=list)
    stats: Dict[str, float] = field(default_factory=dict)


@dataclass
class MountState:
    """坐骑状态"""
    user_id: str
    current_mount: Optional[str] = None
    is_mounted: bool = False
    mount_time: Optional[float] = None
    stamina: float = 100.0
    max_stamina: float = 100.0


class UE5MountSystem:
    """UE5 坐骑系统"""
    
    def __init__(self):
        self.mounts: Dict[str, Mount] = {}
        self.user_mounts: Dict[str, Set[str]] = {}
        self.user_states: Dict[str, MountState] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        self.mount_duration = 2.0  # 上马动画时长
        self.stamina_drain_rate = 1.0  # 体力消耗速率
        self.stamina_regen_rate = 5.0  # 体力恢复速率
        
        self._init_default_mounts()
    
    def _init_default_mounts(self):
        """初始化默认坐骑"""
        default_mounts = [
            Mount("horse_basic", "普通马匹", MountType.GROUND, 1.5, "horse_icon.png", "horse_basic_model",
                  "一匹普通的马", level_required=10),
            Mount("horse_war", "战马", MountType.GROUND, 1.8, "war_horse_icon.png", "war_horse_model",
                  "训练有素的战马", level_required=30, premium=False,
                  abilities=["charge", "trample"]),
            Mount("tiger", "猛虎", MountType.GROUND, 2.0, "tiger_icon.png", "tiger_model",
                  "凶猛的坐骑虎", level_required=40, premium=True),
            Mount("phoenix", "凤凰", MountType.FLYING, 2.5, "phoenix_icon.png", "phoenix_model",
                  "传说中的飞行坐骑", level_required=60, premium=True,
                  abilities=["fly", "dive"]),
            Mount("dragon", "神龙", MountType.SPECIAL, 3.0, "dragon_icon.png", "dragon_model",
                  "稀有神龙坐骑", level_required=80, premium=True,
                  abilities=["fly", "breathe_fire", "roar"])
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
        
        self._trigger_event("mount_unlocked", {
            "user_id": user_id,
            "mount_id": mount_id,
            "mount_name": self.mounts[mount_id].name
        })
        
        return True
    
    def mount(self, user_id: str, mount_id: str) -> Dict:
        """上坐骑"""
        if mount_id not in self.mounts:
            return {"success": False, "error": "Mount not found"}
        
        if user_id not in self.user_mounts or mount_id not in self.user_mounts[user_id]:
            return {"success": False, "error": "Mount not unlocked"}
        
        if user_id not in self.user_states:
            self.user_states[user_id] = MountState(user_id=user_id)
        
        state = self.user_states[user_id]
        
        if state.is_mounted:
            return {"success": False, "error": "Already mounted"}
        
        mount = self.mounts[mount_id]
        state.current_mount = mount_id
        state.is_mounted = True
        state.mount_time = time.time()
        
        self._trigger_event("mount_summoned", {
            "user_id": user_id,
            "mount_id": mount_id,
            "mount_name": mount.name,
            "mount_type": mount.mount_type.value
        })
        
        return {
            "success": True,
            "mount_id": mount_id,
            "mount_name": mount.name,
            "speed": mount.speed,
            "mount_type": mount.mount_type.value
        }
    
    def dismount(self, user_id: str) -> Dict:
        """下坐骑"""
        if user_id not in self.user_states:
            return {"success": False, "error": "No mount state"}
        
        state = self.user_states[user_id]
        
        if not state.is_mounted:
            return {"success": False, "error": "Not mounted"}
        
        mount_id = state.current_mount
        mount_name = self.mounts[mount_id].name if mount_id else ""
        
        state.is_mounted = False
        state.current_mount = None
        state.mount_time = None
        
        self._trigger_event("mount_dismissed", {
            "user_id": user_id,
            "mount_id": mount_id,
            "mount_name": mount_name
        })
        
        return {
            "success": True,
            "mount_id": mount_id
        }
    
    def update_stamina(self, user_id: str, delta_time: float, moving: bool = False):
        """更新体力"""
        if user_id not in self.user_states:
            return
        
        state = self.user_states[user_id]
        
        if not state.is_mounted:
            return
        
        if moving:
            state.stamina = max(0, state.stamina - self.stamina_drain_rate * delta_time)
        else:
            state.stamina = min(state.max_stamina, state.stamina + self.stamina_regen_rate * delta_time)
    
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
                    "icon": mount.icon,
                    "description": mount.description,
                    "level_required": mount.level_required,
                    "premium": mount.premium,
                    "abilities": mount.abilities
                })
        
        return mounts
    
    def get_current_mount(self, user_id: str) -> Optional[Dict]:
        """获取当前坐骑"""
        if user_id not in self.user_states:
            return None
        
        state = self.user_states[user_id]
        
        if not state.is_mounted or not state.current_mount:
            return None
        
        mount = self.mounts.get(state.current_mount)
        
        if not mount:
            return None
        
        return {
            "mount_id": mount.mount_id,
            "name": mount.name,
            "mount_type": mount.mount_type.value,
            "speed": mount.speed,
            "icon": mount.icon,
            "is_mounted": state.is_mounted,
            "stamina": state.stamina,
            "max_stamina": state.max_stamina,
            "stamina_percentage": state.stamina / state.max_stamina
        }
    
    def get_mount_list(self) -> List[Dict]:
        """获取所有坐骑列表"""
        return [{
            "mount_id": mount.mount_id,
            "name": mount.name,
            "mount_type": mount.mount_type.value,
            "speed": mount.speed,
            "icon": mount.icon,
            "description": mount.description,
            "level_required": mount.level_required,
            "premium": mount.premium
        } for mount in self.mounts.values()]
    
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
                print(f"[Mount] Event handler error: {e}")


# 全局实例
_quest_marker_instance: Optional[UE5QuestMarkerSystem] = None
_hotbar_instance: Optional[UE5HotbarSystem] = None
_target_lock_instance: Optional[UE5TargetLockSystem] = None
_revive_instance: Optional[UE5ReviveSystem] = None
_mount_instance: Optional[UE5MountSystem] = None


def get_quest_marker_system() -> UE5QuestMarkerSystem:
    global _quest_marker_instance
    if _quest_marker_instance is None:
        _quest_marker_instance = UE5QuestMarkerSystem()
    return _quest_marker_instance


def get_hotbar_system() -> UE5HotbarSystem:
    global _hotbar_instance
    if _hotbar_instance is None:
        _hotbar_instance = UE5HotbarSystem()
    return _hotbar_instance


def get_target_lock_system() -> UE5TargetLockSystem:
    global _target_lock_instance
    if _target_lock_instance is None:
        _target_lock_instance = UE5TargetLockSystem()
    return _target_lock_instance


def get_revive_system() -> UE5ReviveSystem:
    global _revive_instance
    if _revive_instance is None:
        _revive_instance = UE5ReviveSystem()
    return _revive_instance


def get_mount_system() -> UE5MountSystem:
    global _mount_instance
    if _mount_instance is None:
        _mount_instance = UE5MountSystem()
    return _mount_instance


if __name__ == "__main__":
    # 测试
    quest_system = get_quest_marker_system()
    hotbar_system = get_hotbar_system()
    target_system = get_target_lock_system()
    revive_system = get_revive_system()
    mount_system = get_mount_system()
    
    # 测试坐骑系统
    mount_system.unlock_mount("player1", "horse_basic")
    result = mount_system.mount("player1", "horse_basic")
    print("Mount result:", result)
    
    print("All systems initialized successfully!")
