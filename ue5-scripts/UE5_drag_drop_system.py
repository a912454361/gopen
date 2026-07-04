#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 拖拽系统
支持物品拖拽、技能拖拽、UI元素拖拽

功能：
- 物品拖拽
- 技能拖拽到快捷栏
- UI元素拖拽
- 拖拽预览
- 放置验证
- 拖拽反馈
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any, List, Callable, Tuple
from dataclasses import dataclass, field
from enum import Enum


class DragSourceType(Enum):
    """拖拽源类型"""
    INVENTORY = "inventory"
    SKILL = "skill"
    EQUIPMENT = "equipment"
    HOTBAR = "hotbar"
    QUEST = "quest"
    SHOP = "shop"
    TRADE = "trade"
    CUSTOM = "custom"


class DropTargetType(Enum):
    """放置目标类型"""
    INVENTORY = "inventory"
    EQUIPMENT = "equipment"
    HOTBAR = "hotbar"
    TRASH = "trash"
    TRADE = "trade"
    SHOP = "shop"
    GROUND = "ground"
    CUSTOM = "custom"


class DragState(Enum):
    """拖拽状态"""
    IDLE = "idle"
    DRAGGING = "dragging"
    DROPPING = "dropping"


@dataclass
class DragItem:
    """拖拽物品"""
    item_id: str
    item_type: DragSourceType
    source_slot: int
    source_container: str
    data: Dict[str, Any]
    quantity: int = 1
    preview_icon: Optional[str] = None
    preview_text: Optional[str] = None


@dataclass
class DropTarget:
    """放置目标"""
    target_type: DropTargetType
    target_slot: int
    target_container: str
    accept_types: List[DragSourceType]
    max_stack: int = 1
    current_item_id: Optional[str] = None


@dataclass
class DragOperation:
    """拖拽操作"""
    operation_id: str
    user_id: str
    drag_item: DragItem
    current_position: Tuple[int, int]
    state: DragState = DragState.DRAGGING
    valid_targets: List[str] = field(default_factory=list)
    start_time: float = field(default_factory=time.time)


class UE5DragDropSystem:
    """UE5 拖拽系统"""
    
    def __init__(self):
        # 当前拖拽操作
        self.active_operations: Dict[str, DragOperation] = {}
        
        # 用户拖拽状态
        self.user_operations: Dict[str, str] = {}  # user_id -> operation_id
        
        # 放置规则
        self.drop_rules: Dict[str, List[DropTarget]] = {}
        
        # 事件处理器
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 配置
        self.drag_threshold = 5  # 拖拽阈值（像素）
        self.enable_preview = True
        self.enable_snap = True
        self.snap_distance = 20
    
    def start_drag(self, user_id: str, item: DragItem, start_position: Tuple[int, int]) -> str:
        """开始拖拽"""
        operation_id = hashlib.md5(f"{user_id}_{item.item_id}_{time.time()}".encode()).hexdigest()[:12]
        
        operation = DragOperation(
            operation_id=operation_id,
            user_id=user_id,
            drag_item=item,
            current_position=start_position
        )
        
        self.active_operations[operation_id] = operation
        self.user_operations[user_id] = operation_id
        
        # 查找有效放置目标
        operation.valid_targets = self._find_valid_targets(item)
        
        self._trigger_event("drag_started", {
            "operation_id": operation_id,
            "user_id": user_id,
            "item_id": item.item_id,
            "item_type": item.item_type.value,
            "source_slot": item.source_slot,
            "source_container": item.source_container
        })
        
        return operation_id
    
    def update_drag_position(self, user_id: str, position: Tuple[int, int]) -> bool:
        """更新拖拽位置"""
        operation_id = self.user_operations.get(user_id)
        if not operation_id:
            return False
        
        operation = self.active_operations.get(operation_id)
        if not operation:
            return False
        
        operation.current_position = position
        
        # 检测悬停的有效目标
        hovered_target = self._find_hovered_target(position, operation.valid_targets)
        
        self._trigger_event("drag_position_updated", {
            "operation_id": operation_id,
            "user_id": user_id,
            "position": position,
            "hovered_target": hovered_target
        })
        
        return True
    
    def cancel_drag(self, user_id: str) -> bool:
        """取消拖拽"""
        operation_id = self.user_operations.get(user_id)
        if not operation_id:
            return False
        
        operation = self.active_operations.get(operation_id)
        if not operation:
            return False
        
        operation.state = DragState.IDLE
        
        # 清理
        del self.active_operations[operation_id]
        del self.user_operations[user_id]
        
        self._trigger_event("drag_cancelled", {
            "operation_id": operation_id,
            "user_id": user_id,
            "item_id": operation.drag_item.item_id
        })
        
        return True
    
    def drop(self, user_id: str, target: DropTarget) -> Dict:
        """放置物品"""
        operation_id = self.user_operations.get(user_id)
        if not operation_id:
            return {"success": False, "error": "No active drag operation"}
        
        operation = self.active_operations.get(operation_id)
        if not operation:
            return {"success": False, "error": "Operation not found"}
        
        # 验证放置
        validation = self._validate_drop(operation.drag_item, target)
        if not validation["valid"]:
            return {"success": False, "error": validation["error"]}
        
        # 执行放置
        result = self._execute_drop(operation.drag_item, target)
        
        operation.state = DragState.DROPPING
        
        # 清理
        del self.active_operations[operation_id]
        del self.user_operations[user_id]
        
        self._trigger_event("item_dropped", {
            "operation_id": operation_id,
            "user_id": user_id,
            "item_id": operation.drag_item.item_id,
            "target_type": target.target_type.value,
            "target_slot": target.target_slot,
            "success": result["success"]
        })
        
        return result
    
    def swap_items(self, user_id: str, item1: DragItem, item2: DragItem) -> bool:
        """交换物品"""
        # 验证交换
        if not self._can_swap(item1, item2):
            return False
        
        # 执行交换
        self._trigger_event("items_swapped", {
            "user_id": user_id,
            "item1_id": item1.item_id,
            "item1_slot": item1.source_slot,
            "item2_id": item2.item_id,
            "item2_slot": item2.source_slot
        })
        
        return True
    
    def split_stack(self, user_id: str, item: DragItem, quantity: int) -> Tuple[DragItem, DragItem]:
        """分割堆叠"""
        if quantity >= item.quantity:
            return None, None
        
        # 创建分割后的物品
        item1 = DragItem(
            item_id=item.item_id,
            item_type=item.item_type,
            source_slot=item.source_slot,
            source_container=item.source_container,
            data=item.data.copy(),
            quantity=quantity,
            preview_icon=item.preview_icon,
            preview_text=item.preview_text
        )
        
        item2 = DragItem(
            item_id=item.item_id,
            item_type=item.item_type,
            source_slot=-1,  # 新槽位
            source_container=item.source_container,
            data=item.data.copy(),
            quantity=item.quantity - quantity,
            preview_icon=item.preview_icon,
            preview_text=item.preview_text
        )
        
        self._trigger_event("stack_split", {
            "user_id": user_id,
            "item_id": item.item_id,
            "original_quantity": item.quantity,
            "split_quantity": quantity
        })
        
        return item1, item2
    
    def merge_stacks(self, user_id: str, item1: DragItem, item2: DragItem) -> DragItem:
        """合并堆叠"""
        if item1.item_id != item2.item_id:
            return None
        
        max_stack = 99  # 默认最大堆叠数
        
        total = item1.quantity + item2.quantity
        merged_quantity = min(total, max_stack)
        overflow = total - merged_quantity
        
        merged_item = DragItem(
            item_id=item1.item_id,
            item_type=item1.item_type,
            source_slot=item2.source_slot,
            source_container=item2.source_container,
            data=item1.data.copy(),
            quantity=merged_quantity,
            preview_icon=item1.preview_icon,
            preview_text=item1.preview_text
        )
        
        self._trigger_event("stacks_merged", {
            "user_id": user_id,
            "item_id": item1.item_id,
            "quantity1": item1.quantity,
            "quantity2": item2.quantity,
            "merged_quantity": merged_quantity,
            "overflow": overflow
        })
        
        return merged_item
    
    def register_drop_target(self, container_id: str, target: DropTarget):
        """注册放置目标"""
        if container_id not in self.drop_rules:
            self.drop_rules[container_id] = []
        
        self.drop_rules[container_id].append(target)
    
    def _find_valid_targets(self, item: DragItem) -> List[str]:
        """查找有效放置目标"""
        valid = []
        
        for container_id, targets in self.drop_rules.items():
            for target in targets:
                if item.item_type in target.accept_types:
                    valid.append(f"{container_id}:{target.target_slot}")
        
        return valid
    
    def _find_hovered_target(self, position: Tuple[int, int], valid_targets: List[str]) -> Optional[str]:
        """查找悬停的目标"""
        # 简化实现：根据位置查找最近的目标
        # 实际应基于UI元素的位置计算
        return None
    
    def _validate_drop(self, item: DragItem, target: DropTarget) -> Dict:
        """验证放置"""
        if item.item_type not in target.accept_types:
            return {"valid": False, "error": "Cannot drop this item type here"}
        
        # 检查堆叠限制
        if target.current_item_id and target.current_item_id != item.item_id:
            return {"valid": False, "error": "Slot is occupied"}
        
        return {"valid": True}
    
    def _execute_drop(self, item: DragItem, target: DropTarget) -> Dict:
        """执行放置"""
        # 实际应调用物品系统进行移动
        return {
            "success": True,
            "item_id": item.item_id,
            "target_slot": target.target_slot,
            "target_container": target.target_container
        }
    
    def _can_swap(self, item1: DragItem, item2: DragItem) -> bool:
        """检查是否可以交换"""
        # 实现交换逻辑
        return True
    
    def get_drag_operation(self, user_id: str) -> Optional[Dict]:
        """获取当前拖拽操作"""
        operation_id = self.user_operations.get(user_id)
        if not operation_id:
            return None
        
        operation = self.active_operations.get(operation_id)
        if not operation:
            return None
        
        return {
            "operation_id": operation.operation_id,
            "item_id": operation.drag_item.item_id,
            "item_type": operation.drag_item.item_type.value,
            "position": operation.current_position,
            "state": operation.state.value,
            "valid_targets": operation.valid_targets,
            "duration": time.time() - operation.start_time
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
                print(f"[DragDrop] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "active_operations": len(self.active_operations),
            "registered_targets": sum(len(targets) for targets in self.drop_rules.values())
        }


# 全局实例
_drag_drop_instance: Optional[UE5DragDropSystem] = None


def get_drag_drop_system() -> UE5DragDropSystem:
    """获取拖拽系统实例"""
    global _drag_drop_instance
    
    if _drag_drop_instance is None:
        _drag_drop_instance = UE5DragDropSystem()
    
    return _drag_drop_instance


if __name__ == "__main__":
    system = get_drag_drop_system()
    
    # 测试
    item = DragItem(
        item_id="sword_001",
        item_type=DragSourceType.INVENTORY,
        source_slot=0,
        source_container="inventory",
        data={"name": "铁剑", "damage": 10},
        quantity=1
    )
    
    op_id = system.start_drag("player1", item, (100, 100))
    print("Drag operation:", system.get_drag_operation("player1"))
