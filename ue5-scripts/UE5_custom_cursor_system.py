#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 自定义光标系统
支持多种光标样式、动态效果

功能：
- 多种光标样式（默认、攻击、拾取、交互等）
- 光标动画效果
- 光标颜色自定义
- 悬停状态反馈
- 游戏手柄支持
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum


class CursorType(Enum):
    """光标类型"""
    DEFAULT = "default"
    ARROW = "arrow"
    FINGER = "finger"
    ATTACK = "attack"
    PICKUP = "pickup"
    TALK = "talk"
    INSPECT = "inspect"
    USE = "use"
    FORBIDDEN = "forbidden"
    WAIT = "wait"
    MOVE = "move"
    RESIZE = "resize"
    TARGET = "target"
    CUSTOM = "custom"


class CursorState(Enum):
    """光标状态"""
    NORMAL = "normal"
    HOVER = "hover"
    PRESSED = "pressed"
    DRAGGING = "dragging"
    DISABLED = "disabled"


@dataclass
class CursorConfig:
    """光标配置"""
    cursor_type: CursorType
    name: str
    texture_path: str
    hotspot: tuple = (0, 0)  # 热点位置
    scale: float = 1.0
    color: str = "#FFFFFF"
    animation: Optional[str] = None
    animation_speed: float = 1.0
    visible: bool = True


@dataclass
class CursorState:
    """光标状态"""
    current_type: CursorType = CursorType.DEFAULT
    current_state: CursorState = CursorState.NORMAL
    position: tuple = (0, 0)
    target_actor: Optional[str] = None
    hover_time: float = 0.0


class UE5CustomCursorSystem:
    """UE5 自定义光标系统"""
    
    def __init__(self):
        # 光标配置库
        self.cursors: Dict[CursorType, CursorConfig] = {}
        
        # 用户光标状态
        self.user_states: Dict[str, CursorState] = {}
        
        # 事件处理器
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 初始化默认光标
        self._init_default_cursors()
        
        # 配置
        self.enable_cursor_effects = True
        self.enable_hover_animation = True
        self.hover_delay = 0.5  # 悬停延迟（秒）
    
    def _init_default_cursors(self):
        """初始化默认光标"""
        default_cursors = [
            CursorConfig(CursorType.DEFAULT, "默认", "cursor_default.png", (0, 0)),
            CursorConfig(CursorType.ARROW, "箭头", "cursor_arrow.png", (0, 0)),
            CursorConfig(CursorType.FINGER, "手指", "cursor_finger.png", (8, 4)),
            CursorConfig(CursorType.ATTACK, "攻击", "cursor_attack.png", (16, 16), color="#FF4444"),
            CursorConfig(CursorType.PICKUP, "拾取", "cursor_pickup.png", (16, 16), color="#FFD700"),
            CursorConfig(CursorType.TALK, "对话", "cursor_talk.png", (16, 8), color="#44FF44"),
            CursorConfig(CursorType.INSPECT, "查看", "cursor_inspect.png", (16, 16), color="#4444FF"),
            CursorConfig(CursorType.USE, "使用", "cursor_use.png", (16, 16), color="#FF44FF"),
            CursorConfig(CursorType.FORBIDDEN, "禁止", "cursor_forbidden.png", (16, 16), color="#FF0000"),
            CursorConfig(CursorType.WAIT, "等待", "cursor_wait.png", (16, 16), animation="rotate"),
            CursorConfig(CursorType.MOVE, "移动", "cursor_move.png", (16, 16)),
            CursorConfig(CursorType.RESIZE, "调整大小", "cursor_resize.png", (16, 16)),
            CursorConfig(CursorType.TARGET, "目标", "cursor_target.png", (16, 16), color="#FF0000", animation="pulse"),
        ]
        
        for cursor in default_cursors:
            self.cursors[cursor.cursor_type] = cursor
    
    def register_user(self, user_id: str):
        """注册用户"""
        if user_id not in self.user_states:
            self.user_states[user_id] = CursorState()
    
    def set_cursor_type(self, user_id: str, cursor_type: CursorType) -> bool:
        """设置光标类型"""
        if user_id not in self.user_states:
            self.register_user(user_id)
        
        state = self.user_states[user_id]
        old_type = state.current_type
        state.current_type = cursor_type
        
        self._trigger_event("cursor_type_changed", {
            "user_id": user_id,
            "old_type": old_type.value,
            "new_type": cursor_type.value
        })
        
        return True
    
    def set_cursor_state(self, user_id: str, cursor_state: CursorState) -> bool:
        """设置光标状态"""
        if user_id not in self.user_states:
            return False
        
        state = self.user_states[user_id]
        state.current_state = cursor_state
        
        return True
    
    def update_position(self, user_id: str, position: tuple):
        """更新光标位置"""
        if user_id not in self.user_states:
            return
        
        state = self.user_states[user_id]
        state.position = position
    
    def set_hover_target(self, user_id: str, target_actor: str, cursor_type: CursorType = None):
        """设置悬停目标"""
        if user_id not in self.user_states:
            return
        
        state = self.user_states[user_id]
        state.target_actor = target_actor
        state.hover_time = time.time()
        
        if cursor_type:
            self.set_cursor_type(user_id, cursor_type)
        
        self._trigger_event("cursor_hover", {
            "user_id": user_id,
            "target_actor": target_actor,
            "cursor_type": cursor_type.value if cursor_type else None
        })
    
    def clear_hover_target(self, user_id: str):
        """清除悬停目标"""
        if user_id not in self.user_states:
            return
        
        state = self.user_states[user_id]
        state.target_actor = None
        state.hover_time = 0.0
        
        # 恢复默认光标
        self.set_cursor_type(user_id, CursorType.DEFAULT)
    
    def get_cursor_config(self, cursor_type: CursorType) -> Optional[Dict]:
        """获取光标配置"""
        cursor = self.cursors.get(cursor_type)
        if cursor:
            return {
                "cursor_type": cursor.cursor_type.value,
                "name": cursor.name,
                "texture_path": cursor.texture_path,
                "hotspot": cursor.hotspot,
                "scale": cursor.scale,
                "color": cursor.color,
                "animation": cursor.animation,
                "animation_speed": cursor.animation_speed,
                "visible": cursor.visible
            }
        return None
    
    def get_user_cursor_state(self, user_id: str) -> Dict:
        """获取用户光标状态"""
        if user_id not in self.user_states:
            self.register_user(user_id)
        
        state = self.user_states[user_id]
        cursor_config = self.get_cursor_config(state.current_type)
        
        return {
            "user_id": user_id,
            "cursor_type": state.current_type.value,
            "cursor_state": state.current_state.value,
            "position": state.position,
            "target_actor": state.target_actor,
            "hover_time": state.hover_time,
            "config": cursor_config
        }
    
    def add_custom_cursor(self, name: str, texture_path: str, hotspot: tuple = (0, 0),
                          scale: float = 1.0, color: str = "#FFFFFF") -> CursorType:
        """添加自定义光标"""
        cursor_id = f"custom_{hashlib.md5(name.encode()).hexdigest()[:8]}"
        cursor_type = CursorType.CUSTOM
        
        cursor = CursorConfig(
            cursor_type=cursor_type,
            name=name,
            texture_path=texture_path,
            hotspot=hotspot,
            scale=scale,
            color=color
        )
        
        self.cursors[cursor_type] = cursor
        
        return cursor_type
    
    def get_all_cursors(self) -> List[Dict]:
        """获取所有光标"""
        cursors = []
        
        for cursor_type, cursor in self.cursors.items():
            cursors.append({
                "cursor_type": cursor_type.value,
                "name": cursor.name,
                "texture_path": cursor.texture_path,
                "hotspot": cursor.hotspot,
                "scale": cursor.scale,
                "color": cursor.color,
                "animation": cursor.animation
            })
        
        return cursors
    
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
                print(f"[Cursor] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "total_cursors": len(self.cursors),
            "active_users": len(self.user_states)
        }


# 全局实例
_cursor_instance: Optional[UE5CustomCursorSystem] = None


def get_cursor_system() -> UE5CustomCursorSystem:
    """获取光标系统实例"""
    global _cursor_instance
    
    if _cursor_instance is None:
        _cursor_instance = UE5CustomCursorSystem()
    
    return _cursor_instance


if __name__ == "__main__":
    system = get_cursor_system()
    
    # 测试
    system.register_user("player1")
    system.set_cursor_type("player1", CursorType.ATTACK)
    
    print("Cursor state:", system.get_user_cursor_state("player1"))
    print("Available cursors:", len(system.get_all_cursors()))
