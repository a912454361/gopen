#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 提示框系统
支持物品提示、技能提示、状态提示

功能：
- 多种提示框样式
- 富文本提示
- 图标支持
- 延迟显示
- 动态位置
- 分组提示
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum


class TooltipType(Enum):
    """提示框类型"""
    ITEM = "item"
    SKILL = "skill"
    STATUS = "status"
    NPC = "npc"
    LOCATION = "location"
    QUEST = "quest"
    ACHIEVEMENT = "achievement"
    CUSTOM = "custom"


class TooltipPosition(Enum):
    """提示框位置"""
    CURSOR = "cursor"
    TOP = "top"
    BOTTOM = "bottom"
    LEFT = "left"
    RIGHT = "right"
    CENTER = "center"


@dataclass
class TooltipContent:
    """提示框内容"""
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    rarity: Optional[str] = None
    stats: List[Dict[str, str]] = field(default_factory=list)
    effects: List[str] = field(default_factory=list)
    requirements: List[str] = field(default_factory=list)
    price: Optional[Dict[str, Any]] = None
    extra_info: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TooltipInstance:
    """提示框实例"""
    tooltip_id: str
    tooltip_type: TooltipType
    content: TooltipContent
    target_element: str
    position: TooltipPosition
    offset: tuple = (0, 0)
    show_delay: float = 0.3
    hide_delay: float = 0.1
    visible: bool = False
    created_at: float = field(default_factory=time.time)


class UE5TooltipSystem:
    """UE5 提示框系统"""
    
    def __init__(self):
        # 提示框模板
        self.templates: Dict[str, TooltipContent] = {}
        
        # 当前显示的提示框
        self.active_tooltips: Dict[str, TooltipInstance] = {}
        
        # 用户提示框状态
        self.user_tooltips: Dict[str, str] = {}  # user_id -> tooltip_id
        
        # 事件处理器
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 配置
        self.default_show_delay = 0.3
        self.default_hide_delay = 0.1
        self.max_width = 400
        self.enable_rich_text = True
    
    def show_tooltip(self, user_id: str, tooltip_type: TooltipType,
                     content: TooltipContent, target_element: str,
                     position: TooltipPosition = TooltipPosition.CURSOR,
                     offset: tuple = (10, 10)) -> str:
        """显示提示框"""
        tooltip_id = hashlib.md5(f"{user_id}_{tooltip_type.value}_{time.time()}".encode()).hexdigest()[:12]
        
        tooltip = TooltipInstance(
            tooltip_id=tooltip_id,
            tooltip_type=tooltip_type,
            content=content,
            target_element=target_element,
            position=position,
            offset=offset
        )
        
        self.active_tooltips[tooltip_id] = tooltip
        self.user_tooltips[user_id] = tooltip_id
        
        # 延迟显示
        time.sleep(tooltip.show_delay)
        tooltip.visible = True
        
        self._trigger_event("tooltip_shown", {
            "tooltip_id": tooltip_id,
            "user_id": user_id,
            "tooltip_type": tooltip_type.value,
            "title": content.title,
            "target_element": target_element
        })
        
        return tooltip_id
    
    def hide_tooltip(self, user_id: str) -> bool:
        """隐藏提示框"""
        tooltip_id = self.user_tooltips.get(user_id)
        if not tooltip_id:
            return False
        
        tooltip = self.active_tooltips.get(tooltip_id)
        if not tooltip:
            return False
        
        # 延迟隐藏
        time.sleep(tooltip.hide_delay)
        
        del self.active_tooltips[tooltip_id]
        del self.user_tooltips[user_id]
        
        self._trigger_event("tooltip_hidden", {
            "tooltip_id": tooltip_id,
            "user_id": user_id
        })
        
        return True
    
    def update_tooltip_position(self, user_id: str, position: tuple) -> bool:
        """更新提示框位置"""
        tooltip_id = self.user_tooltips.get(user_id)
        if not tooltip_id:
            return False
        
        tooltip = self.active_tooltips.get(tooltip_id)
        if not tooltip:
            return False
        
        # 根据位置策略计算新位置
        if tooltip.position == TooltipPosition.CURSOR:
            tooltip.offset = position
        
        return True
    
    def create_item_tooltip(self, item_data: Dict) -> TooltipContent:
        """创建物品提示框"""
        rarity_colors = {
            "common": "#FFFFFF",
            "uncommon": "#1EFF00",
            "rare": "#0070DD",
            "epic": "#A335EE",
            "legendary": "#FF8000",
            "mythic": "#E6CC80"
        }
        
        content = TooltipContent(
            title=item_data.get("name", "未知物品"),
            subtitle=item_data.get("type", ""),
            description=item_data.get("description", ""),
            icon=item_data.get("icon"),
            rarity=item_data.get("rarity", "common"),
            stats=item_data.get("stats", []),
            effects=item_data.get("effects", []),
            requirements=item_data.get("requirements", []),
            price=item_data.get("price"),
            extra_info={
                "level": item_data.get("level", 1),
                "class": item_data.get("class"),
                "bind": item_data.get("bind", "none")
            }
        )
        
        return content
    
    def create_skill_tooltip(self, skill_data: Dict) -> TooltipContent:
        """创建技能提示框"""
        content = TooltipContent(
            title=skill_data.get("name", "未知技能"),
            subtitle=f"等级 {skill_data.get('level', 1)}",
            description=skill_data.get("description", ""),
            icon=skill_data.get("icon"),
            stats=[
                {"label": "法力消耗", "value": str(skill_data.get("mana_cost", 0))},
                {"label": "冷却时间", "value": f"{skill_data.get('cooldown', 0)}秒"},
                {"label": "施法距离", "value": f"{skill_data.get('range', 0)}米"}
            ],
            effects=skill_data.get("effects", []),
            requirements=skill_data.get("requirements", []),
            extra_info={
                "skill_type": skill_data.get("type"),
                "damage_type": skill_data.get("damage_type")
            }
        )
        
        return content
    
    def create_status_tooltip(self, status_data: Dict) -> TooltipContent:
        """创建状态提示框"""
        content = TooltipContent(
            title=status_data.get("name", "未知状态"),
            subtitle=f"{status_data.get('stacks', 1)} 层",
            description=status_data.get("description", ""),
            icon=status_data.get("icon"),
            stats=[
                {"label": "持续时间", "value": f"{status_data.get('duration', 0)}秒"},
                {"label": "效果强度", "value": str(status_data.get('intensity', 1))}
            ],
            extra_info={
                "buff_type": status_data.get("buff_type", "buff"),
                "source": status_data.get("source")
            }
        )
        
        return content
    
    def create_quest_tooltip(self, quest_data: Dict) -> TooltipContent:
        """创建任务提示框"""
        content = TooltipContent(
            title=quest_data.get("name", "未知任务"),
            subtitle=quest_data.get("type", "主线任务"),
            description=quest_data.get("description", ""),
            icon=quest_data.get("icon"),
            stats=[
                {"label": "等级要求", "value": str(quest_data.get("level", 1))},
                {"label": "经验奖励", "value": str(quest_data.get("exp_reward", 0))}
            ],
            effects=quest_data.get("objectives", []),
            requirements=quest_data.get("prerequisites", []),
            price={
                "gold": quest_data.get("gold_reward", 0),
                "items": quest_data.get("item_rewards", [])
            }
        )
        
        return content
    
    def get_tooltip(self, tooltip_id: str) -> Optional[Dict]:
        """获取提示框数据"""
        tooltip = self.active_tooltips.get(tooltip_id)
        if not tooltip:
            return None
        
        return {
            "tooltip_id": tooltip.tooltip_id,
            "tooltip_type": tooltip.tooltip_type.value,
            "title": tooltip.content.title,
            "subtitle": tooltip.content.subtitle,
            "description": tooltip.content.description,
            "icon": tooltip.content.icon,
            "rarity": tooltip.content.rarity,
            "stats": tooltip.content.stats,
            "effects": tooltip.content.effects,
            "requirements": tooltip.content.requirements,
            "price": tooltip.content.price,
            "extra_info": tooltip.content.extra_info,
            "position": tooltip.position.value,
            "offset": tooltip.offset,
            "visible": tooltip.visible
        }
    
    def get_user_tooltip(self, user_id: str) -> Optional[Dict]:
        """获取用户当前提示框"""
        tooltip_id = self.user_tooltips.get(user_id)
        if tooltip_id:
            return self.get_tooltip(tooltip_id)
        return None
    
    def register_template(self, template_id: str, content: TooltipContent):
        """注册提示框模板"""
        self.templates[template_id] = content
    
    def show_from_template(self, user_id: str, template_id: str,
                           target_element: str, **kwargs) -> Optional[str]:
        """从模板显示提示框"""
        template = self.templates.get(template_id)
        if not template:
            return None
        
        return self.show_tooltip(
            user_id=user_id,
            tooltip_type=TooltipType.CUSTOM,
            content=template,
            target_element=target_element,
            **kwargs
        )
    
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
                print(f"[Tooltip] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "active_tooltips": len(self.active_tooltips),
            "templates_count": len(self.templates)
        }


# 全局实例
_tooltip_instance: Optional[UE5TooltipSystem] = None


def get_tooltip_system() -> UE5TooltipSystem:
    """获取提示框系统实例"""
    global _tooltip_instance
    
    if _tooltip_instance is None:
        _tooltip_instance = UE5TooltipSystem()
    
    return _tooltip_instance


if __name__ == "__main__":
    system = get_tooltip_system()
    
    # 测试
    item_tooltip = system.create_item_tooltip({
        "name": "烈焰之剑",
        "type": "双手剑",
        "rarity": "epic",
        "level": 50,
        "damage": 150,
        "description": "燃烧着永不熄灭的火焰"
    })
    
    tooltip_id = system.show_tooltip("player1", TooltipType.ITEM, item_tooltip, "inventory_slot_1")
    print("Tooltip:", system.get_tooltip(tooltip_id))
