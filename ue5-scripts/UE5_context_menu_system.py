#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UE5 右键菜单系统
支持动态菜单项、子菜单、快捷键

功能：
- 动态菜单项
- 子菜单支持
- 图标支持
- 快捷键绑定
- 分隔符
- 禁用状态
- 分组菜单
"""

import json
import time
import hashlib
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum


class MenuItemType(Enum):
    """菜单项类型"""
    ACTION = "action"
    TOGGLE = "toggle"
    SUBMENU = "submenu"
    SEPARATOR = "separator"
    HEADER = "header"


@dataclass
class MenuItem:
    """菜单项"""
    item_id: str
    item_type: MenuItemType
    label: str
    icon: Optional[str] = None
    shortcut: Optional[str] = None
    enabled: bool = True
    checked: bool = False
    action: Optional[Callable] = None
    submenu: List['MenuItem'] = field(default_factory=list)
    danger: bool = False  # 危险操作（红色高亮）
    tooltip: Optional[str] = None


@dataclass
class ContextMenu:
    """右键菜单"""
    menu_id: str
    title: Optional[str] = None
    items: List[MenuItem] = field(default_factory=list)
    position: tuple = (0, 0)
    target_actor: Optional[str] = None
    target_type: Optional[str] = None
    visible: bool = False


class UE5ContextMenuSystem:
    """UE5 右键菜单系统"""
    
    def __init__(self):
        # 菜单模板
        self.menu_templates: Dict[str, ContextMenu] = {}
        
        # 当前显示的菜单
        self.active_menus: Dict[str, ContextMenu] = {}
        
        # 用户菜单状态
        self.user_menus: Dict[str, str] = {}
        
        # 事件处理器
        self.event_handlers: Dict[str, List[Callable]] = {}
        
        # 初始化默认菜单模板
        self._init_default_templates()
    
    def _init_default_templates(self):
        """初始化默认菜单模板"""
        # 玩家菜单
        player_menu = ContextMenu(
            menu_id="player_context",
            title="玩家操作",
            items=[
                MenuItem("view_profile", MenuItemType.ACTION, "查看资料", icon="user"),
                MenuItem("whisper", MenuItemType.ACTION, "私聊", icon="message", shortcut="W"),
                MenuItem("invite_party", MenuItemType.ACTION, "邀请组队", icon="team"),
                MenuItem("add_friend", MenuItemType.ACTION, "添加好友", icon="friend"),
                MenuItem("sep1", MenuItemType.SEPARATOR, ""),
                MenuItem("trade", MenuItemType.ACTION, "请求交易", icon="trade"),
                MenuItem("duel", MenuItemType.ACTION, "请求决斗", icon="sword"),
                MenuItem("sep2", MenuItemType.SEPARATOR, ""),
                MenuItem("block", MenuItemType.ACTION, "屏蔽", icon="block", danger=True),
                MenuItem("report", MenuItemType.ACTION, "举报", icon="report", danger=True),
            ]
        )
        
        # 物品菜单
        item_menu = ContextMenu(
            menu_id="item_context",
            title="物品操作",
            items=[
                MenuItem("use", MenuItemType.ACTION, "使用", icon="use", shortcut="U"),
                MenuItem("equip", MenuItemType.ACTION, "装备", icon="equip"),
                MenuItem("sep1", MenuItemType.SEPARATOR, ""),
                MenuItem("move_to", MenuItemType.SUBMENU, "移动到", icon="move", submenu=[
                    MenuItem("bag1", MenuItemType.ACTION, "背包1"),
                    MenuItem("bag2", MenuItemType.ACTION, "背包2"),
                    MenuItem("bank", MenuItemType.ACTION, "仓库"),
                ]),
                MenuItem("sep2", MenuItemType.SEPARATOR, ""),
                MenuItem("split", MenuItemType.ACTION, "拆分", icon="split"),
                MenuItem("link", MenuItemType.ACTION, "发送到聊天", icon="link"),
                MenuItem("sep3", MenuItemType.SEPARATOR, ""),
                MenuItem("destroy", MenuItemType.ACTION, "销毁", icon="trash", danger=True),
            ]
        )
        
        # NPC菜单
        npc_menu = ContextMenu(
            menu_id="npc_context",
            title="NPC",
            items=[
                MenuItem("talk", MenuItemType.ACTION, "对话", icon="talk"),
                MenuItem("shop", MenuItemType.ACTION, "商店", icon="shop"),
                MenuItem("quest", MenuItemType.ACTION, "任务", icon="quest"),
                MenuItem("sep1", MenuItemType.SEPARATOR, ""),
                MenuItem("target", MenuItemType.ACTION, "设为目标", icon="target"),
            ]
        )
        
        self.menu_templates["player"] = player_menu
        self.menu_templates["item"] = item_menu
        self.menu_templates["npc"] = npc_menu
    
    def show_menu(self, user_id: str, menu_type: str, position: tuple,
                  target_actor: str = None, **kwargs) -> str:
        """显示右键菜单"""
        template = self.menu_templates.get(menu_type)
        if not template:
            # 创建空菜单
            template = ContextMenu(menu_id=f"{menu_type}_context")
        
        # 创建菜单实例
        menu_id = hashlib.md5(f"{user_id}_{menu_type}_{time.time()}".encode()).hexdigest()[:12]
        
        menu = ContextMenu(
            menu_id=menu_id,
            title=template.title,
            items=self._clone_items(template.items),
            position=position,
            target_actor=target_actor,
            target_type=menu_type,
            visible=True
        )
        
        self.active_menus[menu_id] = menu
        self.user_menus[user_id] = menu_id
        
        self._trigger_event("menu_shown", {
            "menu_id": menu_id,
            "user_id": user_id,
            "menu_type": menu_type,
            "position": position,
            "target_actor": target_actor
        })
        
        return menu_id
    
    def hide_menu(self, user_id: str) -> bool:
        """隐藏菜单"""
        menu_id = self.user_menus.get(user_id)
        if not menu_id:
            return False
        
        if menu_id in self.active_menus:
            del self.active_menus[menu_id]
        
        del self.user_menus[user_id]
        
        self._trigger_event("menu_hidden", {
            "menu_id": menu_id,
            "user_id": user_id
        })
        
        return True
    
    def execute_action(self, user_id: str, item_id: str, **kwargs) -> bool:
        """执行菜单动作"""
        menu_id = self.user_menus.get(user_id)
        if not menu_id:
            return False
        
        menu = self.active_menus.get(menu_id)
        if not menu:
            return False
        
        # 查找菜单项
        item = self._find_item(menu.items, item_id)
        if not item or not item.enabled:
            return False
        
        # 执行动作
        if item.action:
            item.action(user_id, menu.target_actor, **kwargs)
        
        # 切换状态
        if item.item_type == MenuItemType.TOGGLE:
            item.checked = not item.checked
        
        # 隐藏菜单
        self.hide_menu(user_id)
        
        self._trigger_event("menu_action_executed", {
            "user_id": user_id,
            "item_id": item_id,
            "target_actor": menu.target_actor
        })
        
        return True
    
    def add_menu_item(self, menu_type: str, item: MenuItem, position: int = -1):
        """添加菜单项到模板"""
        template = self.menu_templates.get(menu_type)
        if not template:
            return False
        
        if position >= 0:
            template.items.insert(position, item)
        else:
            template.items.append(item)
        
        return True
    
    def remove_menu_item(self, menu_type: str, item_id: str) -> bool:
        """移除菜单项"""
        template = self.menu_templates.get(menu_type)
        if not template:
            return False
        
        for i, item in enumerate(template.items):
            if item.item_id == item_id:
                template.items.pop(i)
                return True
        
        return False
    
    def set_item_enabled(self, user_id: str, item_id: str, enabled: bool) -> bool:
        """设置菜单项启用状态"""
        menu_id = self.user_menus.get(user_id)
        if not menu_id:
            return False
        
        menu = self.active_menus.get(menu_id)
        if not menu:
            return False
        
        item = self._find_item(menu.items, item_id)
        if item:
            item.enabled = enabled
            return True
        
        return False
    
    def get_menu(self, menu_id: str) -> Optional[Dict]:
        """获取菜单数据"""
        menu = self.active_menus.get(menu_id)
        if not menu:
            return None
        
        return {
            "menu_id": menu.menu_id,
            "title": menu.title,
            "items": self._items_to_dict(menu.items),
            "position": menu.position,
            "target_actor": menu.target_actor,
            "visible": menu.visible
        }
    
    def get_user_menu(self, user_id: str) -> Optional[Dict]:
        """获取用户当前菜单"""
        menu_id = self.user_menus.get(user_id)
        if menu_id:
            return self.get_menu(menu_id)
        return None
    
    def create_custom_menu(self, user_id: str, items: List[Dict], position: tuple) -> str:
        """创建自定义菜单"""
        menu_id = hashlib.md5(f"{user_id}_custom_{time.time()}".encode()).hexdigest()[:12]
        
        menu_items = []
        for item_data in items:
            item = MenuItem(
                item_id=item_data.get("id", hashlib.md5(str(time.time()).encode()).hexdigest()[:8]),
                item_type=MenuItemType(item_data.get("type", "action")),
                label=item_data.get("label", ""),
                icon=item_data.get("icon"),
                shortcut=item_data.get("shortcut"),
                enabled=item_data.get("enabled", True),
                danger=item_data.get("danger", False)
            )
            menu_items.append(item)
        
        menu = ContextMenu(
            menu_id=menu_id,
            items=menu_items,
            position=position,
            visible=True
        )
        
        self.active_menus[menu_id] = menu
        self.user_menus[user_id] = menu_id
        
        return menu_id
    
    def _clone_items(self, items: List[MenuItem]) -> List[MenuItem]:
        """克隆菜单项"""
        cloned = []
        for item in items:
            cloned_item = MenuItem(
                item_id=item.item_id,
                item_type=item.item_type,
                label=item.label,
                icon=item.icon,
                shortcut=item.shortcut,
                enabled=item.enabled,
                checked=item.checked,
                action=item.action,
                danger=item.danger,
                tooltip=item.tooltip,
                submenu=self._clone_items(item.submenu) if item.submenu else []
            )
            cloned.append(cloned_item)
        return cloned
    
    def _find_item(self, items: List[MenuItem], item_id: str) -> Optional[MenuItem]:
        """查找菜单项"""
        for item in items:
            if item.item_id == item_id:
                return item
            if item.submenu:
                found = self._find_item(item.submenu, item_id)
                if found:
                    return found
        return None
    
    def _items_to_dict(self, items: List[MenuItem]) -> List[Dict]:
        """菜单项转字典"""
        result = []
        for item in items:
            result.append({
                "item_id": item.item_id,
                "type": item.item_type.value,
                "label": item.label,
                "icon": item.icon,
                "shortcut": item.shortcut,
                "enabled": item.enabled,
                "checked": item.checked,
                "danger": item.danger,
                "tooltip": item.tooltip,
                "submenu": self._items_to_dict(item.submenu) if item.submenu else []
            })
        return result
    
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
                print(f"[ContextMenu] Event handler error: {e}")
    
    def get_status(self) -> Dict:
        """获取系统状态"""
        return {
            "active_menus": len(self.active_menus),
            "templates_count": len(self.menu_templates)
        }


# 全局实例
_context_menu_instance: Optional[UE5ContextMenuSystem] = None


def get_context_menu_system() -> UE5ContextMenuSystem:
    """获取右键菜单系统实例"""
    global _context_menu_instance
    
    if _context_menu_instance is None:
        _context_menu_instance = UE5ContextMenuSystem()
    
    return _context_menu_instance


if __name__ == "__main__":
    system = get_context_menu_system()
    
    # 测试
    menu_id = system.show_menu("player1", "item", (100, 200), "sword_001")
    print("Menu:", system.get_menu(menu_id))
    
    system.execute_action("player1", "use")
